import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, SubmissionStatus, CampaignStatus } from "@prisma/client";

export async function GET() {
  try {
    await requireRole([UserRole.ADMIN]);

    const [
      activeCampaignsCount,
      totalCampaignsCount,
      totalClippersCount,
      approvedMetricsAgg,
      pendingReviewsCount,
      campaigns,
      payoutsAgg,
      pendingSubmissions,
    ] = await Promise.all([
      // 1. Total Active Campaigns
      prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
      // 2. Total Campaigns
      prisma.campaign.count(),
      // 3. Total Registered Clippers
      prisma.user.count({ where: { role: UserRole.CLIPPER } }),
      // 4. Approved Metrics Platform-Wide (strictly status = APPROVED)
      prisma.submission.aggregate({
        where: { status: SubmissionStatus.APPROVED },
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
      // 5. Pending Reviews
      prisma.submission.count({
        where: { status: SubmissionStatus.PENDING },
      }),
      // 6. All Campaigns with stats
      prisma.campaign.findMany({
        orderBy: { created_at: "desc" },
        include: {
          _count: {
            select: {
              memberships: true,
              submissions: true,
            },
          },
          submissions: {
            select: {
              status: true,
              current_views: true,
            },
          },
        },
      }),
      // 7. Payout Aggregates
      prisma.payout.groupBy({
        by: ["status"],
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      // 8. Pending Submissions Queue - OLDEST FIRST: ORDER BY submitted_at ASC, id ASC
      prisma.submission.findMany({
        where: { status: SubmissionStatus.PENDING },
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

    const totalApprovedViews = approvedMetricsAgg._sum.current_views || 0;
    const totalApprovedLikes = approvedMetricsAgg._sum.current_likes || 0;
    const totalApprovedComments = approvedMetricsAgg._sum.current_comments || 0;
    const totalApprovedShares = approvedMetricsAgg._sum.current_shares || 0;
    const totalApprovedSaves = approvedMetricsAgg._sum.current_saves || 0;

    let totalBudget = 0;
    let usedBudget = 0;

    const formattedCampaigns = campaigns.map((c) => {
      const approvedSubs = c.submissions.filter((s) => s.status === SubmissionStatus.APPROVED);
      const pendingSubs = c.submissions.filter((s) => s.status === SubmissionStatus.PENDING);
      const campApprovedViews = approvedSubs.reduce((sum, s) => sum + s.current_views, 0);

      const cBudget = Number(c.total_budget);
      const cUsed = Number(c.used_budget);
      totalBudget += cBudget;
      usedBudget += cUsed;

      return {
        id: c.id,
        name: c.name,
        brand_name: c.brand_name,
        image_url: c.image_url,
        status: c.status,
        cpm: Number(c.cpm),
        total_budget: cBudget,
        used_budget: cUsed,
        minimum_views_for_payout: c.minimum_views_for_payout,
        approved_views: campApprovedViews,
        total_views: campApprovedViews,
        submissions_count: c._count.submissions,
        pending_submissions_count: pendingSubs.length,
        clippers_count: c._count.memberships,
      };
    });

    let pendingPayoutAmount = 0;
    let pendingPayoutCount = 0;
    let paidOutAmount = 0;
    let paidOutCount = 0;

    for (const group of payoutsAgg) {
      const amount = Number(group._sum.amount || 0);
      if (group.status === "PENDING" || group.status === "PROCESSING") {
        pendingPayoutAmount += amount;
        pendingPayoutCount += group._count;
      } else if (group.status === "PAID") {
        paidOutAmount += amount;
        paidOutCount += group._count;
      }
    }

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
        totalApprovedViews,
        totalApprovedLikes,
        totalApprovedComments,
        totalApprovedShares,
        totalApprovedSaves,
        totalActiveCampaigns: activeCampaignsCount,
        totalCampaigns: totalCampaignsCount,
        totalClippers: totalClippersCount,
        totalBudget,
        usedBudget,
        remainingBudget: Math.max(0, totalBudget - usedBudget),
        pendingReviewsCount,
        pendingPayoutAmount,
        pendingPayoutCount,
        paidOutAmount,
        paidOutCount,
        campaigns: formattedCampaigns,
        pendingSubmissions: formattedSubmissions,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch admin dashboard" },
      { status: 500 }
    );
  }
}
