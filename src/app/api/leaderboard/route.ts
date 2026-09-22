import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all"; // all, 30d, 7d

    let dateFilter: Date | undefined;
    if (period === "7d") {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "30d") {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const approvedSubmissions = await prisma.submission.findMany({
      where: {
        status: SubmissionStatus.APPROVED,
        ...(dateFilter ? { reviewed_at: { gte: dateFilter } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });

    const userMap = new Map<
      string,
      {
        userId: string;
        username: string;
        avatarUrl: string | null;
        eligibleViews: number;
        earnings: number;
        approvedClips: number;
      }
    >();

    for (const sub of approvedSubmissions) {
      const existing = userMap.get(sub.user_id) || {
        userId: sub.user.id,
        username: sub.user.username,
        avatarUrl: sub.user.avatar_url,
        eligibleViews: 0,
        earnings: 0,
        approvedClips: 0,
      };

      existing.eligibleViews += sub.eligible_views;
      existing.earnings += Number(sub.current_earnings);
      existing.approvedClips += 1;
      userMap.set(sub.user_id, existing);
    }

    const globalLeaderboard = Array.from(userMap.values())
      .sort((a, b) => b.eligibleViews - a.eligibleViews)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return NextResponse.json({ data: globalLeaderboard });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch global leaderboard" }, { status: 500 });
  }
}
