import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { syncAllApprovedSubmissions } from "@/lib/earnings/engine";
import { getSessionUser } from "@/lib/auth";
import { getAccessibleCampaignIdsForManager } from "@/lib/campaignAccess";

// Fetching views from three platforms can take a while; never cache this route.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Verifies the request is authorized to trigger the cron job.
 *
 * Accepts the secret either as a standard "Authorization: Bearer <CRON_SECRET>"
 * header (the convention Vercel Cron and most schedulers use) or as a
 * "?secret=<CRON_SECRET>" query param, for schedulers that can't set custom
 * headers.
 *
 * If CRON_SECRET is not configured in the environment at all, secret-based
 * requests are denied by default (fail closed).
 */
function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") === cronSecret) {
    return true;
  }

  return false;
}

/**
 * Resolves who triggered the sync:
 * - cron (secret)       → all campaigns
 * - logged-in ADMIN     → all campaigns (manual "Sync views" button)
 * - logged-in MANAGER   → only the campaigns they can access
 */
async function resolveSyncScope(
  request: Request
): Promise<{ authorized: false } | { authorized: true; campaignIds?: string[]; manual: boolean }> {
  if (isAuthorizedCronRequest(request)) {
    return { authorized: true, manual: false };
  }

  const user = await getSessionUser().catch(() => null);
  if (user && user.status === "ACTIVE") {
    if (user.role === UserRole.ADMIN) {
      return { authorized: true, manual: true };
    }
    if (user.role === UserRole.MANAGER) {
      const campaignIds = await getAccessibleCampaignIdsForManager(user.id);
      return { authorized: true, campaignIds, manual: true };
    }
  }

  return { authorized: false };
}

export async function POST(request: Request) {
  const scope = await resolveSyncScope(request);
  if (!scope.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    // A manual button press should refresh now, not only clips older than the cron interval
    const force = searchParams.get("force") === "true" || scope.manual;

    const results = await syncAllApprovedSubmissions({ force, campaignIds: scope.campaignIds });
    const successful = results.filter((r) => r.status === "SUCCESS").length;
    const failed = results.filter((r) => r.status === "FAILED").length;
    const unavailable = results.filter((r) => r.status === "UNAVAILABLE").length;
    const budgetExhausted = results.filter((r) => r.status === "BUDGET_EXHAUSTED").length;
    const totalEarningsGenerated = results.reduce((sum, r) => sum + r.earningsDelta, 0);
    const totalEligibleViewsGenerated = results.reduce((sum, r) => sum + r.eligibleViewsDelta, 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalProcessed: results.length,
        successful,
        failed,
        unavailable,
        budgetExhausted,
        totalEarningsGenerated,
        totalEligibleViewsGenerated,
      },
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Sync views job failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Allow GET for Vercel Cron or browser trigger
  return POST(request);
}
