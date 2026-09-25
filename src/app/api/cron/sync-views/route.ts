import { NextResponse } from "next/server";
import { syncAllApprovedSubmissions } from "@/lib/earnings/engine";

/**
 * Verifies the request is authorized to trigger the cron job.
 *
 * Accepts the secret either as a standard "Authorization: Bearer <CRON_SECRET>"
 * header (the convention Vercel Cron and most schedulers use) or as a
 * "?secret=<CRON_SECRET>" query param, for schedulers that can't set custom
 * headers.
 *
 * If CRON_SECRET is not configured in the environment at all, requests are
 * denied by default (fail closed) rather than left open.
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

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const results = await syncAllApprovedSubmissions({ force });
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
