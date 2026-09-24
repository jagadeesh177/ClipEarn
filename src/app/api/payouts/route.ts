import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getClipperEarningsSummary, requestPayout } from "@/lib/payout/engine";

export async function GET() {
  try {
    const user = await requireAuth({ allowSuspended: true });

    const [summary, payouts, ledger] = await Promise.all([
      getClipperEarningsSummary(user.id),
      prisma.payout.findMany({
        where: { user_id: user.id },
        orderBy: { requested_at: "desc" },
      }),
      prisma.earningsLedger.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: "desc" },
        take: 50,
        include: {
          campaign: {
            select: { name: true, cpm: true },
          },
        },
      }),
    ]);

    const formattedLedger = ledger.map((l) => ({
      id: l.id,
      campaignName: l.campaign.name,
      views: l.views,
      ratePer1000: Number(l.rate_per_1000),
      amount: Number(l.amount),
      createdAt: l.created_at,
    }));

    return NextResponse.json({
      summary,
      payouts,
      ledger: formattedLedger,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch payout data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { amount, method, accountDetails } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Please specify a valid payout amount." }, { status: 400 });
    }

    if (!method) {
      return NextResponse.json({ error: "Please select a payout method." }, { status: 400 });
    }

    const payout = await requestPayout(user.id, parseFloat(amount), method, accountDetails);

    return NextResponse.json({ success: true, payout }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to request payout" }, { status: 400 });
  }
}
