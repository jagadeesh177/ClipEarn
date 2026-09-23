import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, SubmissionStatus, CampaignStatus, PayoutStatus } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);

    const campaignFilter =
      user.role === UserRole.MANAGER
        ? { access_codes: { some: { redeemed_by: user.id, status: "REDEEMED" } } }
        : {};

    const [
      activeCampaignsCount,
      totalClippersCount,
      submissionsCounts,
      payoutsCounts,
      budgetAggregate,
      ledgerAggregate,
      recentSnapshots,
    ] = await Promise.all([
      prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE, ...campaignFilter } }),
      prisma.user.count({ where: { role: UserRole.CLIPPER } }),
      prisma.submission.groupBy({
        by: ["status"],
        where: user.role === UserRole.MANAGER ? { campaign: campaignFilter } : undefined,
        _count: true,
        _sum: {
          current_views: true,
          current_likes: true,
          current_comments: true,
          eligible_views: true,
          current_earnings: true,
        },
      }),
      prisma.payout.groupBy({
        by: ["status"],
        _count: true,
        _sum: { amount: true },
      }),
      prisma.campaign.aggregate({
        where: campaignFilter,
        _sum: {
          total_budget: true,
          used_budget: true,
        },
      }),
      prisma.earningsLedger.aggregate({
        _sum: {
          amount: true,
          views: true,
        },
      }),
      prisma.viewSnapshot.findMany({
        take: 30,
        orderBy: { captured_at: "desc" },
      }),
    ]);

    let totalSubmissions = 0;
    let pendingReviews = 0;
    let approvedSubmissions = 0;
    let rejectedSubmissions = 0;
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let eligibleViews = 0;

    for (const group of submissionsCounts) {
      totalSubmissions += group._count;
      totalViews += group._sum.current_views || 0;
      totalLikes += group._sum.current_likes || 0;
      totalComments += group._sum.current_comments || 0;
      eligibleViews += group._sum.eligible_views || 0;

      if (group.status === SubmissionStatus.PENDING) pendingReviews = group._count;
      if (group.status === SubmissionStatus.APPROVED) approvedSubmissions = group._count;
      if (group.status === SubmissionStatus.REJECTED) rejectedSubmissions = group._count;
    }

    let pendingPayoutAmount = 0;
    let paidOutAmount = 0;
    for (const group of payoutsCounts) {
      if (group.status === PayoutStatus.PENDING || group.status === PayoutStatus.PROCESSING) {
        pendingPayoutAmount += Number(group._sum.amount || 0);
      }
      if (group.status === PayoutStatus.PAID) {
        paidOutAmount += Number(group._sum.amount || 0);
      }
    }

    const totalBudget = Number(budgetAggregate._sum.total_budget || 0);
    const usedBudget = Number(budgetAggregate._sum.used_budget || 0);
    const totalEarnings = Number(ledgerAggregate._sum.amount || 0);

    const avgViewsPerClip = approvedSubmissions > 0 ? Math.round(eligibleViews / approvedSubmissions) : 0;
    const avgEarningsPerClip = approvedSubmissions > 0 ? Number((totalEarnings / approvedSubmissions).toFixed(2)) : 0;

    return NextResponse.json({
      data: {
        activeCampaignsCount,
        totalClippersCount,
        totalSubmissions,
        pendingReviews,
        approvedSubmissions,
        rejectedSubmissions,
        totalViews,
        totalLikes,
        totalComments,
        eligibleViews,
        totalBudget,
        usedBudget,
        remainingBudget: Math.max(0, totalBudget - usedBudget),
        totalEarnings,
        pendingPayoutAmount,
        paidOutAmount,
        avgViewsPerClip,
        avgEarningsPerClip,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
