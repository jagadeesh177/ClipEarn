import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, SubmissionStatus, CampaignStatus, PayoutStatus } from "@prisma/client";

/**
 * GET /api/admin/analytics
 * Platform-wide analytics exclusively for ADMIN.
 * Approved metrics strictly derived from approved submissions.
 */
export async function GET() {
  try {
    const user = await requireRole([UserRole.ADMIN]);

    const [
      activeCampaignsCount,
      totalCampaignsCount,
      totalClippersCount,
      approvedMetrics,
      submissionsCountByStatus,
      payoutsAggregate,
      budgetAggregate,
    ] = await Promise.all([
      // Total active campaigns
      prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
      // Total campaigns (any status)
      prisma.campaign.count(),
      // Total clippers
      prisma.user.count({ where: { role: UserRole.CLIPPER } }),
      // Approved submissions aggregate (single source of truth for platform approved metrics)
      prisma.submission.aggregate({
        where: { status: SubmissionStatus.APPROVED },
        _count: true,
        _sum: {
          current_views: true,
          current_likes: true,
          current_comments: true,
          current_shares: true,
          current_saves: true,
          eligible_views: true,
          current_earnings: true,
        },
      }),
      // Submission counts by status for pipeline monitoring
      prisma.submission.groupBy({
        by: ["status"],
        _count: true,
      }),
      // Platform-wide payouts summary
      prisma.payout.groupBy({
        by: ["status"],
        _count: true,
        _sum: { amount: true },
      }),
      // Platform-wide budget
      prisma.campaign.aggregate({
        _sum: {
          total_budget: true,
          used_budget: true,
        },
      }),
    ]);

    // Approved metrics strictly from APPROVED status
    const approvedViews = approvedMetrics._sum.current_views || 0;
    const approvedLikes = approvedMetrics._sum.current_likes || 0;
    const approvedComments = approvedMetrics._sum.current_comments || 0;
    const approvedShares = approvedMetrics._sum.current_shares || 0;
    const approvedSaves = approvedMetrics._sum.current_saves || 0;
    const approvedClips = approvedMetrics._count || 0;
    const totalEarnings = Number(approvedMetrics._sum.current_earnings || 0);

    let pendingReviews = 0;
    let rejectedSubmissions = 0;
    let totalSubmissions = 0;

    for (const group of submissionsCountByStatus) {
      totalSubmissions += group._count;
      if (group.status === SubmissionStatus.PENDING) pendingReviews = group._count;
      if (group.status === SubmissionStatus.REJECTED) rejectedSubmissions = group._count;
    }

    let pendingPayoutAmount = 0;
    let pendingPayoutCount = 0;
    let paidOutAmount = 0;
    let paidOutCount = 0;

    for (const group of payoutsAggregate) {
      if (group.status === PayoutStatus.PENDING || group.status === PayoutStatus.PROCESSING) {
        pendingPayoutAmount += Number(group._sum.amount || 0);
        pendingPayoutCount += group._count;
      }
      if (group.status === PayoutStatus.PAID) {
        paidOutAmount += Number(group._sum.amount || 0);
        paidOutCount += group._count;
      }
    }

    const totalBudget = Number(budgetAggregate._sum.total_budget || 0);
    const usedBudget = Number(budgetAggregate._sum.used_budget || 0);

    return NextResponse.json({
      data: {
        totalApprovedViews: approvedViews,
        totalApprovedLikes: approvedLikes,
        totalApprovedComments: approvedComments,
        totalApprovedShares: approvedShares,
        totalApprovedSaves: approvedSaves,
        totalApprovedClips: approvedClips,
        totalActiveCampaigns: activeCampaignsCount,
        totalCampaigns: totalCampaignsCount,
        totalClippers: totalClippersCount,
        totalSubmissions,
        pendingReviews,
        rejectedSubmissions,
        totalBudget,
        usedBudget,
        remainingBudget: Math.max(0, totalBudget - usedBudget),
        totalEarnings,
        pendingPayoutAmount,
        pendingPayoutCount,
        paidOutAmount,
        paidOutCount,
      },
    });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }
    return NextResponse.json({ error: err?.message || "Failed to fetch admin analytics" }, { status: 500 });
  }
}
