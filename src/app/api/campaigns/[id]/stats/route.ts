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
      select: { minimum_views_for_payout: true, maximum_views_per_clip: true },
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

    let totalViews = 0;        // all views across ALL submissions (any status)
    let approvedViews = 0;     // current_views from APPROVED clips only
    let totalEarnings = 0;
    let clipsSubmitted = submissions.length;
    let approvedClips = 0;
    let eligibleViews = 0;     // eligible_views (capped, for earnings calc) from APPROVED only

    for (const sub of submissions) {
      totalViews += sub.current_views;
      if (sub.status === SubmissionStatus.APPROVED) {
        approvedClips += 1;
        approvedViews += sub.current_views;
        eligibleViews += sub.eligible_views;
        totalEarnings += Number(sub.current_earnings);
      }
    }

    // Payout eligibility is an AGGREGATE gate: total eligible views across all approved clips
    const minViews = campaign.minimum_views_for_payout || 0;
    const qualifiesForPayout = minViews > 0 ? eligibleViews >= minViews : true;
    const viewsRemainingForPayout = Math.max(0, minViews - eligibleViews);
    const progressPercent = minViews > 0 ? Math.min(100, Math.round((eligibleViews / minViews) * 100)) : 100;

    // Always show actual earnings earned so far (not hidden behind payout gate in display)
    // The payout gate only affects whether they can request a payout, not what they've earned
    return NextResponse.json({
      data: {
        totalViews,
        approvedViews,
        eligibleViews,
        totalEarnings,
        clipsSubmitted,
        approvedClips,
        minimumViewsForPayout: minViews,
        viewsRemainingForPayout,
        progressPercent,
        qualifiesForPayout,
        payoutProgressText:
          viewsRemainingForPayout > 0
            ? `${viewsRemainingForPayout.toLocaleString()} more approved views to start earning`
            : "You're eligible for payout",
        payoutFractionText: `${eligibleViews.toLocaleString()} / ${minViews.toLocaleString()} approved views required for payout`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch user stats" }, { status: 500 });
  }
}
