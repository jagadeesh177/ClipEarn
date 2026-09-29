import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, SubmissionStatus } from "@prisma/client";
import { getAccessibleCampaignIdsForManager } from "@/lib/campaignAccess";

/**
 * GET /api/manager/payouts
 * Returns payout eligibility and payment status strictly scoped to assigned campaigns.
 * Private clipper payment details are NEVER exposed to managers.
 */
export async function GET() {
  try {
    const user = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);

    let assignedCampaignIds: string[] = [];
    if (user.role === UserRole.MANAGER) {
      assignedCampaignIds = await getAccessibleCampaignIdsForManager(user.id);
      if (assignedCampaignIds.length === 0) {
        return NextResponse.json({ data: [] });
      }
    }

    const campaignWhere =
      user.role === UserRole.MANAGER
        ? { id: { in: assignedCampaignIds } }
        : {};

    // Fetch campaigns, their approved submissions, and payouts
    const campaigns = await prisma.campaign.findMany({
      where: campaignWhere,
      select: {
        id: true,
        name: true,
        brand_name: true,
        cpm: true,
        minimum_views_for_payout: true,
        status: true,
        submissions: {
          where: { status: SubmissionStatus.APPROVED },
          select: {
            user_id: true,
            current_views: true,
            current_earnings: true,
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              },
            },
          },
        },
        payouts: {
          select: {
            id: true,
            user_id: true,
            amount: true,
            status: true,
            transaction_id: true,
            paid_at: true,
            requested_at: true,
          },
        },
      },
    });

    const eligibleClippersList: any[] = [];

    for (const campaign of campaigns) {
      const minViews = campaign.minimum_views_for_payout || 0;

      // Group approved views and earnings by clipper
      const clipperMap = new Map<
        string,
        {
          clipperId: string;
          username: string;
          avatarUrl: string | null;
          approvedViews: number;
          earnings: number;
        }
      >();

      for (const sub of campaign.submissions) {
        const existing = clipperMap.get(sub.user_id) || {
          clipperId: sub.user.id,
          username: sub.user.username,
          avatarUrl: sub.user.avatar_url,
          approvedViews: 0,
          earnings: 0,
        };
        existing.approvedViews += sub.current_views;
        existing.earnings += Number(sub.current_earnings);
        clipperMap.set(sub.user_id, existing);
      }

      // Map payouts for quick lookup
      const payoutMap = new Map<string, any>();
      for (const p of campaign.payouts) {
        payoutMap.set(p.user_id, p);
      }

      for (const [, clipper] of clipperMap) {
        const isEligible = minViews > 0 ? clipper.approvedViews >= minViews : true;
        const payout = payoutMap.get(clipper.clipperId);

        let payoutStatus = isEligible ? "ELIGIBLE" : "NOT_ELIGIBLE";
        if (payout) {
          payoutStatus = payout.status;
        }

        eligibleClippersList.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          brandName: campaign.brand_name,
          clipperId: clipper.clipperId,
          username: clipper.username,
          avatarUrl: clipper.avatarUrl,
          approvedViews: clipper.approvedViews,
          thresholdViews: minViews,
          earnings: clipper.earnings,
          isEligible,
          payoutStatus,
          transactionId: payout?.transaction_id || null,
          paidAt: payout?.paid_at || null,
        });
      }
    }

    return NextResponse.json({ data: eligibleClippersList });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch payout eligibility" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/manager/payouts
 * Blocked for managers: Only Administrators can disburse or reject payouts.
 */
export async function PATCH() {
  return NextResponse.json(
    {
      error:
        "Direct payout processing is strictly restricted to Platform Administrators. Campaign Managers have read-only eligibility overview access.",
    },
    { status: 403 }
  );
}
