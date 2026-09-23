import { prisma } from "@/lib/prisma";
import { getSocialProvider } from "@/lib/social";
import { SubmissionStatus, CampaignStatus, ViewEligibilityMode, Prisma } from "@prisma/client";

export interface SyncResult {
  submissionId: string;
  previousViews: number;
  newViews: number;
  eligibleViewsDelta: number;
  earningsDelta: number;
  status: "SUCCESS" | "SKIPPED" | "BUDGET_EXHAUSTED" | "FAILED";
  error?: string;
}

export async function syncSubmissionViews(submissionId: string): Promise<SyncResult> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      campaign: true,
      user: true,
      view_snapshots: {
        orderBy: { captured_at: "asc" },
      },
    },
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  // Only approved submissions can earn or track views
  if (submission.status !== SubmissionStatus.APPROVED) {
    return {
      submissionId,
      previousViews: submission.current_views,
      newViews: submission.current_views,
      eligibleViewsDelta: 0,
      earningsDelta: 0,
      status: "SKIPPED",
    };
  }

  const campaign = submission.campaign;

  // Check if campaign is active and budget is remaining
  const remainingBudget = Number(campaign.total_budget) - Number(campaign.used_budget);
  if (remainingBudget <= 0 || campaign.status !== CampaignStatus.ACTIVE) {
    return {
      submissionId,
      previousViews: submission.current_views,
      newViews: submission.current_views,
      eligibleViewsDelta: 0,
      earningsDelta: 0,
      status: "BUDGET_EXHAUSTED",
    };
  }

  // Fetch current views via social provider
  const provider = getSocialProvider(submission.platform);
  let latestViews: number;

  try {
    latestViews = await provider.getVideoViews(submission.platform_post_id);
    if (isNaN(latestViews) || latestViews < 0) {
      throw new Error(`Invalid view count returned: ${latestViews}`);
    }
  } catch (err: any) {
    // Failure handling: do not wipe old views, record failure telemetry
    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        last_sync_status: "FAILED",
        last_sync_error: err?.message || "Unknown error fetching views",
        last_view_update: new Date(),
      },
    });

    return {
      submissionId,
      previousViews: submission.current_views,
      newViews: submission.current_views,
      eligibleViewsDelta: 0,
      earningsDelta: 0,
      status: "FAILED",
      error: err?.message || "View sync failed",
    };
  }

  // Prevent impossible view decrease (e.g. API glitch)
  if (latestViews < submission.current_views) {
    latestViews = submission.current_views;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create historical view snapshot
    await tx.viewSnapshot.create({
      data: {
        submission_id: submission.id,
        views: latestViews,
        source: "PLATFORM_API",
      },
    });

    // 2. Calculate baseline for eligible views based on campaign mode
    let baselineViews = 0;
    const snapshots = submission.view_snapshots;

    if (campaign.view_eligibility_mode === ViewEligibilityMode.FROM_SUBMISSION) {
      baselineViews = snapshots.length > 0 ? snapshots[0].views : 0;
    } else if (campaign.view_eligibility_mode === ViewEligibilityMode.FROM_APPROVAL) {
      // Find snapshot closest to reviewed_at
      const approvalSnapshot = snapshots.find(
        (s) => submission.reviewed_at && s.captured_at >= submission.reviewed_at
      );
      baselineViews = approvalSnapshot ? approvalSnapshot.views : (snapshots[0]?.views || 0);
    } else if (campaign.view_eligibility_mode === ViewEligibilityMode.LIFETIME) {
      baselineViews = 0;
    }

    // Maximum views per clip cap (if defined by campaign)
    let totalPotentialEligible = Math.max(0, latestViews - baselineViews);
    if (campaign.maximum_views_per_clip && totalPotentialEligible > campaign.maximum_views_per_clip) {
      totalPotentialEligible = campaign.maximum_views_per_clip;
    }

    const previousEligible = submission.eligible_views;
    const deltaEligibleViews = Math.max(0, totalPotentialEligible - previousEligible);

    if (deltaEligibleViews === 0) {
      await tx.submission.update({
        where: { id: submission.id },
        data: {
          current_views: latestViews,
          last_view_update: new Date(),
          last_sync_status: "SUCCESS",
          last_sync_error: null,
          last_successful_sync: new Date(),
        },
      });

      return {
        submissionId: submission.id,
        previousViews: submission.current_views,
        newViews: latestViews,
        eligibleViewsDelta: 0,
        earningsDelta: 0,
        status: "SUCCESS",
      };
    }

    // 3. Calculate earnings delta using exact rate
    // Once views reach minimum_views_for_payout, then only budget used increases; otherwise view progress increases
    const minPayoutViews = campaign.minimum_views_for_payout || 0;
    const qualifiesForPayout = minPayoutViews > 0 ? totalPotentialEligible >= minPayoutViews : true;

    const cpmRate = Number(campaign.cpm);
    let rawEarningsDelta = qualifiesForPayout ? (deltaEligibleViews / 1000) * cpmRate : 0;

    // Check budget cap
    const currentUsedBudget = Number(campaign.used_budget);
    const totalBudget = Number(campaign.total_budget);
    let finalEarningsDelta = rawEarningsDelta;
    let actualEligibleDelta = deltaEligibleViews;

    if (qualifiesForPayout && currentUsedBudget + rawEarningsDelta > totalBudget) {
      finalEarningsDelta = Math.max(0, totalBudget - currentUsedBudget);
      // Adjust eligible views delta to correspond to capped budget
      actualEligibleDelta = Math.floor((finalEarningsDelta / cpmRate) * 1000);
    }

    // 4. Create immutable EarningsLedger entry if any earnings generated
    if (finalEarningsDelta > 0) {
      await tx.earningsLedger.create({
        data: {
          user_id: submission.user_id,
          campaign_id: campaign.id,
          submission_id: submission.id,
          event_type: "VIEW_SYNC",
          views: actualEligibleDelta,
          rate_per_1000: new Prisma.Decimal(cpmRate),
          amount: new Prisma.Decimal(finalEarningsDelta),
        },
      });

      // Update campaign used budget
      const newUsedBudget = currentUsedBudget + finalEarningsDelta;
      await tx.campaign.update({
        where: { id: campaign.id },
        data: {
          used_budget: new Prisma.Decimal(newUsedBudget),
          status: newUsedBudget >= totalBudget ? CampaignStatus.PAUSED : campaign.status,
        },
      });
    }

    // 5. Update submission
    const newCurrentEarnings = Number(submission.current_earnings) + finalEarningsDelta;
    const newEligibleViews = previousEligible + actualEligibleDelta;

    await tx.submission.update({
      where: { id: submission.id },
      data: {
        current_views: latestViews,
        eligible_views: newEligibleViews,
        current_earnings: new Prisma.Decimal(newCurrentEarnings),
        last_view_update: new Date(),
        last_sync_status: "SUCCESS",
        last_sync_error: null,
        last_successful_sync: new Date(),
      },
    });

    return {
      submissionId: submission.id,
      previousViews: submission.current_views,
      newViews: latestViews,
      eligibleViewsDelta: actualEligibleDelta,
      earningsDelta: finalEarningsDelta,
      status: "SUCCESS",
    };
  });
}

export async function syncAllApprovedSubmissions(): Promise<SyncResult[]> {
  const approvedSubmissions = await prisma.submission.findMany({
    where: {
      status: SubmissionStatus.APPROVED,
      campaign: {
        status: CampaignStatus.ACTIVE,
      },
    },
    select: { id: true },
  });

  const results: SyncResult[] = [];
  for (const sub of approvedSubmissions) {
    try {
      const result = await syncSubmissionViews(sub.id);
      results.push(result);
    } catch (err: any) {
      results.push({
        submissionId: sub.id,
        previousViews: 0,
        newViews: 0,
        eligibleViewsDelta: 0,
        earningsDelta: 0,
        status: "FAILED",
        error: err?.message,
      });
    }
  }

  return results;
}
