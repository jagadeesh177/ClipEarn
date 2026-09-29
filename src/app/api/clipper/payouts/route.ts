import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { SubmissionStatus } from "@prisma/client";

/**
 * GET /api/clipper/payouts
 * Returns the clipper's campaign-by-campaign earnings, payout status, and complete payout history.
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const [submissions, payouts, payoutAccount] = await Promise.all([
      prisma.submission.findMany({
        where: { user_id: user.id },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              brand_name: true,
              cpm: true,
              minimum_views_for_payout: true,
              status: true,
            },
          },
        },
      }),
      prisma.payout.findMany({
        where: { user_id: user.id },
        orderBy: { requested_at: "desc" },
        include: {
          campaign: {
            select: { id: true, name: true, brand_name: true },
          },
        },
      }),
      prisma.payoutAccount.findUnique({
        where: { user_id: user.id },
      }),
    ]);

    // Group approved submissions by campaign
    const campaignStatsMap = new Map<
      string,
      {
        campaignId: string;
        campaignName: string;
        brandName: string;
        cpm: number;
        minimumViews: number;
        campaignStatus: string;
        totalViews: number;
        approvedViews: number;
        earnings: number;
        isEligible: boolean;
        payoutStatus: "NOT_ELIGIBLE" | "ELIGIBLE" | "PROCESSING" | "PAID" | "FAILED";
        payoutDetails: any | null;
      }
    >();

    for (const sub of submissions) {
      const camp = sub.campaign;
      const existing = campaignStatsMap.get(camp.id) || {
        campaignId: camp.id,
        campaignName: camp.name,
        brandName: camp.brand_name,
        cpm: Number(camp.cpm),
        minimumViews: camp.minimum_views_for_payout || 0,
        campaignStatus: camp.status,
        totalViews: 0,
        approvedViews: 0,
        earnings: 0,
        isEligible: false,
        payoutStatus: "NOT_ELIGIBLE",
        payoutDetails: null,
      };

      existing.totalViews += sub.current_views;
      if (sub.status === SubmissionStatus.APPROVED) {
        existing.approvedViews += sub.current_views;
        existing.earnings += Number(sub.current_earnings);
      }
      campaignStatsMap.set(camp.id, existing);
    }

    // Match payout records to campaigns
    for (const [, campData] of campaignStatsMap) {
      const isEligible =
        campData.minimumViews > 0
          ? campData.approvedViews >= campData.minimumViews
          : campData.approvedViews > 0;
      campData.isEligible = isEligible;

      // Find latest payout for this campaign
      const campaignPayout = payouts.find((p) => p.campaign_id === campData.campaignId);

      if (campaignPayout) {
        campData.payoutDetails = {
          id: campaignPayout.id,
          amount: Number(campaignPayout.amount),
          status: campaignPayout.status,
          transactionId: campaignPayout.transaction_id,
          paidAt: campaignPayout.paid_at,
          failureReason: campaignPayout.failure_reason,
        };
        campData.payoutStatus = campaignPayout.status as any;
      } else {
        campData.payoutStatus = isEligible ? "ELIGIBLE" : "NOT_ELIGIBLE";
      }
    }

    // Format payment history table
    const paymentHistory = payouts.map((p) => ({
      id: p.id,
      campaignName: p.campaign?.name || "General Payout",
      amount: Number(p.amount),
      currency: p.currency,
      method: p.method,
      status: p.status,
      transactionId: p.transaction_id || "—",
      date: p.paid_at || p.processed_at || p.requested_at,
      failureReason: p.failure_reason,
    }));

    return NextResponse.json({
      data: {
        campaignEarnings: Array.from(campaignStatsMap.values()),
        paymentHistory,
        hasPaymentDetails: !!payoutAccount,
        paymentProfile: payoutAccount
          ? {
              provider: payoutAccount.provider,
              accountReference: payoutAccount.account_reference,
            }
          : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch clipper payout data" },
      { status: 500 }
    );
  }
}
