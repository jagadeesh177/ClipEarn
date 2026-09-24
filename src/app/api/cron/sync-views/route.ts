import { NextResponse } from "next/server";
import { syncAllApprovedSubmissions } from "@/lib/earnings/engine";

export async function POST(request: Request) {
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
