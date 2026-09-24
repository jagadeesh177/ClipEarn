import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

export async function GET(request: Request) {
  try {
    const user = await requireAuth({ allowSuspended: true });
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d"; // 7d, 30d, 90d

    const daysCount = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const startDate = startOfDay(subDays(new Date(), daysCount - 1));
    const endDate = new Date();

    // Fetch ledger entries in interval
    const ledgerEntries = await prisma.earningsLedger.findMany({
      where: {
        user_id: user.id,
        created_at: { gte: startDate },
      },
      orderBy: { created_at: "asc" },
    });

    // Fetch snapshots for user's submissions
    const snapshots = await prisma.viewSnapshot.findMany({
      where: {
        submission: { user_id: user.id },
        captured_at: { gte: startDate },
      },
      orderBy: { captured_at: "asc" },
    });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dayDataMap = new Map<string, { date: string; earnings: number; views: number }>();

    for (const d of days) {
      const key = format(d, "yyyy-MM-dd");
      dayDataMap.set(key, {
        date: format(d, "MMM dd"),
        earnings: 0,
        views: 0,
      });
    }

    for (const entry of ledgerEntries) {
      const key = format(entry.created_at, "yyyy-MM-dd");
      const current = dayDataMap.get(key);
      if (current) {
        current.earnings += Number(entry.amount);
        current.views += entry.views;
      }
    }

    const chartData = Array.from(dayDataMap.values());

    return NextResponse.json({ data: chartData });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch performance data" }, { status: 500 });
  }
}
