import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus, UserRole } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { hasManagerCampaignAccess } from "@/lib/campaignAccess";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (user?.role === UserRole.MANAGER) {
      const hasAccess = await hasManagerCampaignAccess(user.id, params.id, user.role);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Access denied. You do not have operational access for this campaign." },
          { status: 403 }
        );
      }
    }

    const [campaign, approvedSubmissions, payouts] = await Promise.all([
      prisma.campaign.findUnique({
        where: { id: params.id },
        select: { id: true, minimum_views_for_payout: true, cpm: true },
      }),
      prisma.submission.findMany({
        where: {
          campaign_id: params.id,
          status: SubmissionStatus.APPROVED,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
            },
          },
        },
      }),
      prisma.payout.findMany({
        where: {
          campaign_id: params.id,
        },
        select: {
          id: true,
          user_id: true,
          status: true,
          amount: true,
          transaction_id: true,
        },
      }),
    ]);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const minViews = campaign.minimum_views_for_payout || 0;

    // Map user payouts for this campaign
    const userPayoutMap = new Map<string, any>();
    for (const p of payouts) {
      userPayoutMap.set(p.user_id, p);
    }

    // Group by user
    const userMap = new Map<
      string,
      {
        userId: string;
        username: string;
        avatarUrl: string | null;
        approvedViews: number;
        approvedLikes: number;
        approvedComments: number;
        eligibleViews: number;
        earnings: number;
        clipsCount: number;
        isEligible: boolean;
        payoutStatus: "NOT_ELIGIBLE" | "ELIGIBLE" | "PROCESSING" | "PAID" | "FAILED";
      }
    >();

    for (const sub of approvedSubmissions) {
      const existing = userMap.get(sub.user_id) || {
        userId: sub.user.id,
        username: sub.user.username,
        avatarUrl: sub.user.avatar_url,
        approvedViews: 0,
        approvedLikes: 0,
        approvedComments: 0,
        eligibleViews: 0,
        earnings: 0,
        clipsCount: 0,
        isEligible: false,
        payoutStatus: "NOT_ELIGIBLE",
      };

      existing.approvedViews += sub.current_views;
      existing.approvedLikes += sub.current_likes || 0;
      existing.approvedComments += sub.current_comments || 0;
      existing.eligibleViews += sub.current_views;
      existing.earnings += Number(sub.current_earnings);
      existing.clipsCount += 1;
      userMap.set(sub.user_id, existing);
    }

    // Calculate eligibility and payout status
    for (const [, entry] of userMap) {
      const isEligible = minViews > 0 ? entry.approvedViews >= minViews : true;
      entry.isEligible = isEligible;

      const payout = userPayoutMap.get(entry.userId);
      if (payout) {
        if (payout.status === "PAID") entry.payoutStatus = "PAID";
        else if (payout.status === "PROCESSING") entry.payoutStatus = "PROCESSING";
        else if (payout.status === "FAILED") entry.payoutStatus = "FAILED";
        else if (payout.status === "PENDING") entry.payoutStatus = "PROCESSING";
        else entry.payoutStatus = isEligible ? "ELIGIBLE" : "NOT_ELIGIBLE";
      } else {
        entry.payoutStatus = isEligible ? "ELIGIBLE" : "NOT_ELIGIBLE";
      }
    }

    const leaderboard = Array.from(userMap.values())
      .sort((a, b) => b.approvedViews - a.approvedViews)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return NextResponse.json({
      data: leaderboard,
      meta: {
        minimumViewsForPayout: minViews,
        totalEligibleClippers: leaderboard.filter((l) => l.isEligible).length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch leaderboard" }, { status: 500 });
  }
}
