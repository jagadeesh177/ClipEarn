import { prisma } from "@/lib/prisma";
import { getSocialProvider } from "@/lib/social";
import { SubmissionStatus, CampaignStatus, ViewEligibilityMode, Prisma, FraudSeverity } from "@prisma/client";
import { decryptToken } from "@/lib/encryption";
import { flagSuspiciousActivity } from "@/lib/fraud";

export interface SyncResult {
  submissionId: string;
  previousViews: number;
  newViews: number;
  eligibleViewsDelta: number;
  earningsDelta: number;
  status: "SUCCESS" | "SKIPPED" | "BUDGET_EXHAUSTED" | "FAILED" | "UNAVAILABLE";
  error?: string;
}

export async function syncSubmissionViews(submissionId: string): Promise<SyncResult> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      campaign: true,
      user: true,
      social_account: true,
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

  // Decrypt social account access token if available
  const decryptedToken = submission.social_account?.access_token_encrypted
    ? decryptToken(submission.social_account.access_token_encrypted)
    : null;

  // Fetch current metrics (views, likes, comments, shares, saves) via social provider
  const provider = getSocialProvider(submission.platform);
  let latestViews = submission.current_views;
  let latestLikes = submission.current_likes;
  let latestComments = submission.current_comments;
  let latestShares = submission.current_shares;
  let latestSaves = submission.current_saves;

  try {
    if (provider.getNormalizedMetrics) {
      const norm = await provider.getNormalizedMetrics(
        submission.platform_post_id,
        submission.social_account
          ? {
              platform_user_id: submission.social_account.platform_user_id,
              username: submission.social_account.username,
              access_token: decryptedToken,
            }
          : null
      );

      // Handle unavailable or private clips cleanly without resetting views or earnings
      if (!norm.isAvailable || norm.isPrivate) {
        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            last_sync_status: "UNAVAILABLE",
            last_sync_error: norm.isPrivate
              ? "Clip is marked private on the platform by the creator"
              : "Clip is unavailable or has been removed from the platform",
            last_view_update: new Date(),
          },
        });

        return {
          submissionId,
          previousViews: submission.current_views,
          newViews: submission.current_views,
          eligibleViewsDelta: 0,
          earningsDelta: 0,
          status: "UNAVAILABLE",
          error: norm.isPrivate ? "Clip marked private" : "Clip unavailable or removed",
        };
      }

      if (norm.views != null && !isNaN(norm.views)) {
        latestViews = norm.views;
      }
      if (norm.likes !== undefined) latestLikes = norm.likes;
      if (norm.comments !== undefined) latestComments = norm.comments;
      if (norm.shares !== undefined) latestShares = norm.shares;
      if (norm.saves !== undefined) latestSaves = norm.saves;
    } else if (provider.getVideoMetrics) {
      const metrics = await provider.getVideoMetrics(
        submission.platform_post_id,
        submission.post_url,
        submission.social_account
          ? {
              platform_user_id: submission.social_account.platform_user_id,
              username: submission.social_account.username,
              access_token: decryptedToken,
            }
          : null
      );
      latestViews = metrics.views;
      latestLikes = metrics.likes ?? latestLikes;
      latestComments = metrics.comments ?? latestComments;
      latestShares = metrics.shares ?? latestShares;
      latestSaves = metrics.saves ?? latestSaves;
    } else {
      latestViews = await provider.getVideoViews(submission.platform_post_id);
    }

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

  // Prevent impossible view decrease (e.g. temporary API fluctuation)
  if (latestViews < submission.current_views) {
    latestViews = submission.current_views;
  }

  // Abnormal View Velocity / Spike Fraud Detection (> 500k views jump in a single sync)
  const viewJump = latestViews - submission.current_views;
  if (viewJump > 500000) {
    await flagSuspiciousActivity({
      userId: submission.user_id,
      submissionId: submission.id,
      type: "ABNORMAL_VIEW_VELOCITY",
      severity: FraudSeverity.HIGH,
      description: `Clip jumped by ${viewJump.toLocaleString()} views (from ${submission.current_views.toLocaleString()} to ${latestViews.toLocaleString()}) in a single sync. Flagged for review.`,
    });
  }

  // Check if metrics have changed to deduplicate snapshot creation
  const metricsChanged =
    latestViews !== submission.current_views ||
    latestLikes !== submission.current_likes ||
    latestComments !== submission.current_comments ||
    latestShares !== submission.current_shares ||
    latestSaves !== submission.current_saves;

  const lastSnapshot = submission.view_snapshots[submission.view_snapshots.length - 1];
  const lastCapturedMs = lastSnapshot ? new Date(lastSnapshot.captured_at).getTime() : 0;
  const hoursSinceLastSnapshot = (Date.now() - lastCapturedMs) / (1000 * 60 * 60);

  return await prisma.$transaction(async (tx) => {
    // 1. Create historical view snapshot if metrics changed or if > 24 hours have passed
    if (metricsChanged || hoursSinceLastSnapshot >= 24 || !lastSnapshot) {
      await tx.viewSnapshot.create({
        data: {
          submission_id: submission.id,
          views: latestViews,
          likes: latestLikes,
          comments: latestComments,
          shares: latestShares,
          saves: latestSaves,
          source: "PLATFORM_API",
        },
      });
    }

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
          current_likes: latestLikes,
          current_comments: latestComments,
          current_shares: latestShares,
          current_saves: latestSaves,
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

    // 3. Calculate earnings delta using exact CPM rate (Approved eligible views ONLY)
    // Likes, comments, shares, and saves NEVER generate CPM earnings
    const minPayoutViews = campaign.minimum_views_for_payout || 0;
    const qualifiesForPayout = minPayoutViews > 0 ? totalPotentialEligible >= minPayoutViews : true;

    const cpmRate = Number(campaign.cpm);
    const eligibleViewsToCredit = qualifiesForPayout ? Math.max(0, totalPotentialEligible - previousEligible) : 0;
    let rawEarningsDelta = (eligibleViewsToCredit / 1000) * cpmRate;

    // Check budget cap
    const currentUsedBudget = Number(campaign.used_budget);
    const totalBudget = Number(campaign.total_budget);
    let finalEarningsDelta = rawEarningsDelta;
    let actualEligibleDelta = eligibleViewsToCredit;

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

    // 5. Update submission metrics & earnings
    const newCurrentEarnings = Number(submission.current_earnings) + finalEarningsDelta;
    const newEligibleViews = previousEligible + actualEligibleDelta;

    await tx.submission.update({
      where: { id: submission.id },
      data: {
        current_views: latestViews,
        current_likes: latestLikes,
        current_comments: latestComments,
        current_shares: latestShares,
        current_saves: latestSaves,
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

export async function syncAllApprovedSubmissions(options?: {
  force?: boolean;
  intervalHours?: number;
}): Promise<SyncResult[]> {
  const force = options?.force ?? false;
  const intervalHours = options?.intervalHours ?? 8;
  const cutoffTime = new Date(Date.now() - intervalHours * 60 * 60 * 1000);

  const approvedSubmissions = await prisma.submission.findMany({
    where: {
      status: SubmissionStatus.APPROVED,
      campaign: {
        status: CampaignStatus.ACTIVE,
      },
      ...(force
        ? {}
        : {
            OR: [
              { last_view_update: null },
              { last_view_update: { lt: cutoffTime } },
            ],
          }),
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
