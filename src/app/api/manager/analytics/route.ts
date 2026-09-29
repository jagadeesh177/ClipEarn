import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, SubmissionStatus, CampaignStatus } from "@prisma/client";
import { getAccessibleCampaignIdsForManager } from "@/lib/campaignAccess";

export async function GET() {
  try {
    const user = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);

    // Managers can only see assigned campaigns
    let assignedCampaignIds: string[] = [];
    if (user.role === UserRole.MANAGER) {
      assignedCampaignIds = await getAccessibleCampaignIdsForManager(user.id);
      if (assignedCampaignIds.length === 0) {
        return NextResponse.json({
          data: {
            hasAssignedCampaigns: false,
            assignedCampaignsCount: 0,
            activeCampaignsCount: 0,
            totalSubmissions: 0,
            pendingReviews: 0,
            approvedSubmissions: 0,
            rejectedSubmissions: 0,
            approvedViews: 0,
            approvedLikes: 0,
            approvedComments: 0,
            approvedShares: 0,
            approvedSaves: 0,
            eligibleViews: 0,
            totalBudget: 0,
            usedBudget: 0,
            remainingBudget: 0,
            totalEarnings: 0,
          },
        });
      }
    }

    const campaignWhere =
      user.role === UserRole.MANAGER
        ? { id: { in: assignedCampaignIds } }
        : {};

    const submissionWhere =
      user.role === UserRole.MANAGER
        ? { campaign_id: { in: assignedCampaignIds } }
        : {};

    const [
      activeCampaignsCount,
      totalAssignedCount,
      submissionsCounts,
      budgetAggregate,
    ] = await Promise.all([
      prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE, ...campaignWhere } }),
      prisma.campaign.count({ where: campaignWhere }),
      prisma.submission.groupBy({
        by: ["status"],
        where: submissionWhere,
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
      prisma.campaign.aggregate({
        where: campaignWhere,
        _sum: {
          total_budget: true,
          used_budget: true,
        },
      }),
    ]);

    let totalSubmissions = 0;
    let pendingReviews = 0;
    let approvedSubmissions = 0;
    let rejectedSubmissions = 0;
    let approvedViews = 0;
    let approvedLikes = 0;
    let approvedComments = 0;
    let approvedShares = 0;
    let approvedSaves = 0;
    let totalEarnings = 0;

    for (const group of submissionsCounts) {
      totalSubmissions += group._count;

      if (group.status === SubmissionStatus.PENDING) {
        pendingReviews = group._count;
      }
      if (group.status === SubmissionStatus.APPROVED) {
        approvedSubmissions = group._count;
        approvedViews = group._sum.current_views || 0;
        approvedLikes = group._sum.current_likes || 0;
        approvedComments = group._sum.current_comments || 0;
        approvedShares = group._sum.current_shares || 0;
        approvedSaves = group._sum.current_saves || 0;
        totalEarnings = Number(group._sum.current_earnings || 0);
      }
      if (group.status === SubmissionStatus.REJECTED) {
        rejectedSubmissions = group._count;
      }
    }

    const totalBudget = Number(budgetAggregate._sum.total_budget || 0);
    const usedBudget = Number(budgetAggregate._sum.used_budget || 0);

    return NextResponse.json({
      data: {
        hasAssignedCampaigns: true,
        assignedCampaignsCount: totalAssignedCount,
        activeCampaignsCount,
        totalSubmissions,
        pendingReviews,
        approvedSubmissions,
        rejectedSubmissions,
        approvedViews,
        approvedLikes,
        approvedComments,
        approvedShares,
        approvedSaves,
        eligibleViews: approvedViews,
        totalBudget,
        usedBudget,
        remainingBudget: Math.max(0, totalBudget - usedBudget),
        totalEarnings,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
