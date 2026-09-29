import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, SubmissionStatus, CampaignStatus } from "@prisma/client";
import { getAccessibleCampaignIdsForManager } from "@/lib/campaignAccess";

export async function GET() {
  try {
    const user = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);

    // Managers can only see assigned campaigns.
    // If an Admin enters manager dashboard, only allow if they have manager access.
    const assignedCampaignIds = await getAccessibleCampaignIdsForManager(user.id);
    if (assignedCampaignIds.length === 0) {
      if (user.role === UserRole.ADMIN) {
        return NextResponse.json(
          { error: "Access Denied. You do not have Campaign Manager access to any campaigns." },
          { status: 403 }
        );
      }
      return NextResponse.json({
        data: {
          hasAssignedCampaigns: false,
          assignedCampaignsCount: 0,
          activeCampaignsCount: 0,
          approvedViews: 0,
          approvedLikes: 0,
          approvedComments: 0,
          approvedShares: 0,
          approvedSaves: 0,
          pendingReviewsCount: 0,
          qualifiedClippersCount: 0,
          campaigns: [],
          pendingSubmissions: [],
        },
      });
    }

    const campaignWhere = { id: { in: assignedCampaignIds } };
    const submissionWhere = { campaign_id: { in: assignedCampaignIds } };

    const [
      assignedCampaignsCount,
      activeCampaignsCount,
      approvedMetricsAgg,
      pendingReviewsCount,
      campaigns,
      pendingSubmissions,
    ] = await Promise.all([
      // 1. Assigned Campaigns Count
      prisma.campaign.count({ where: campaignWhere }),
      // 2. Active Assigned Campaigns Count
      prisma.campaign.count({
        where: { status: CampaignStatus.ACTIVE, ...campaignWhere },
      }),
      // 3. Approved Metrics strictly scoped to assigned campaigns and status = APPROVED
      prisma.submission.aggregate({
        where: {
          status: SubmissionStatus.APPROVED,
          ...submissionWhere,
        },
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
      // 4. Pending Reviews in assigned campaigns
      prisma.submission.count({
        where: {
          status: SubmissionStatus.PENDING,
          ...submissionWhere,
        },
      }),
      // 5. Assigned Campaigns
      prisma.campaign.findMany({
        where: campaignWhere,
        orderBy: { created_at: "desc" },
        include: {
          _count: {
            select: {
              memberships: true,
              submissions: true,
            },
          },
          submissions: {
            where: { status: { in: [SubmissionStatus.APPROVED, SubmissionStatus.PENDING] } },
            select: {
              status: true,
              current_views: true,
              user_id: true,
            },
          },
        },
      }),
      // 6. Pending Submissions Queue - OLDEST FIRST: ORDER BY submitted_at ASC, id ASC
      prisma.submission.findMany({
        where: {
          status: SubmissionStatus.PENDING,
          ...submissionWhere,
        },
        orderBy: [{ submitted_at: "asc" }, { id: "asc" }],
        take: 10,
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              brand_name: true,
              cpm: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
            },
          },
        },
      }),
    ]);

    const approvedViews = approvedMetricsAgg._sum.current_views || 0;
    const approvedLikes = approvedMetricsAgg._sum.current_likes || 0;
    const approvedComments = approvedMetricsAgg._sum.current_comments || 0;
    const approvedShares = approvedMetricsAgg._sum.current_shares || 0;
    const approvedSaves = approvedMetricsAgg._sum.current_saves || 0;

    let qualifiedClippersCount = 0;

    const formattedCampaigns = campaigns.map((c) => {
      const approvedSubs = c.submissions.filter((s) => s.status === SubmissionStatus.APPROVED);
      const pendingSubs = c.submissions.filter((s) => s.status === SubmissionStatus.PENDING);
      const campApprovedViews = approvedSubs.reduce((sum, s) => sum + s.current_views, 0);

      // Check qualified clippers for this campaign
      const minViews = c.minimum_views_for_payout || 0;
      const userViewsMap = new Map<string, number>();
      for (const s of approvedSubs) {
        userViewsMap.set(s.user_id, (userViewsMap.get(s.user_id) || 0) + s.current_views);
      }
      for (const [, views] of userViewsMap) {
        if (minViews > 0 ? views >= minViews : views > 0) {
          qualifiedClippersCount++;
        }
      }

      return {
        id: c.id,
        name: c.name,
        brand_name: c.brand_name,
        image_url: c.image_url,
        status: c.status,
        cpm: Number(c.cpm),
        total_budget: Number(c.total_budget),
        minimum_views_for_payout: c.minimum_views_for_payout,
        approved_views: campApprovedViews,
        total_views: campApprovedViews,
        submissions_count: c._count.submissions,
        pending_submissions_count: pendingSubs.length,
        clippers_count: c._count.memberships,
      };
    });

    const formattedSubmissions = pendingSubmissions.map((s) => ({
      id: s.id,
      campaign: {
        id: s.campaign.id,
        name: s.campaign.name,
        brand_name: s.campaign.brand_name,
        cpm: Number(s.campaign.cpm),
      },
      clipper: {
        id: s.user.id,
        username: s.user.username,
        avatar_url: s.user.avatar_url,
      },
      platform: s.platform,
      post_url: s.post_url,
      status: s.status,
      current_views: s.current_views,
      current_likes: s.current_likes,
      current_comments: s.current_comments,
      current_shares: s.current_shares,
      current_saves: s.current_saves,
      submitted_at: s.submitted_at.toISOString(),
    }));

    return NextResponse.json({
      data: {
        hasAssignedCampaigns: true,
        assignedCampaignsCount,
        activeCampaignsCount,
        approvedViews,
        approvedLikes,
        approvedComments,
        approvedShares,
        approvedSaves,
        pendingReviewsCount,
        qualifiedClippersCount,
        campaigns: formattedCampaigns,
        pendingSubmissions: formattedSubmissions,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch manager dashboard" },
      { status: 500 }
    );
  }
}
