import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { SubmissionStatus } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { minimum_views_for_payout: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        campaign_id: params.id,
        user_id: user.id,
      },
    });

    let totalViews = 0;
    let totalEarnings = 0;
    let clipsSubmitted = submissions.length;
    let approvedClips = 0;
    let eligibleViews = 0;

    for (const sub of submissions) {
      totalViews += sub.current_views;
      if (sub.status === SubmissionStatus.APPROVED) {
        approvedClips += 1;
        eligibleViews += sub.eligible_views;
        totalEarnings += Number(sub.current_earnings);
      }
    }

    const minViews = campaign.minimum_views_for_payout;
    const viewsRemainingForPayout = Math.max(0, minViews - eligibleViews);
    const progressPercent = Math.min(100, Math.round((eligibleViews / minViews) * 100));

    return NextResponse.json({
      data: {
        totalViews,
        totalEarnings,
        clipsSubmitted,
        approvedClips,
        eligibleViews,
        minimumViewsForPayout: minViews,
        viewsRemainingForPayout,
        progressPercent,
        payoutProgressText:
          viewsRemainingForPayout > 0
            ? `${viewsRemainingForPayout.toLocaleString()} more approved views to start earning`
            : "Eligible for payout!",
        payoutFractionText: `${eligibleViews.toLocaleString()} / ${minViews.toLocaleString()} approved views required for payout`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch user stats" }, { status: 500 });
  }
}
