import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const approvedSubmissions = await prisma.submission.findMany({
      where: {
        campaign_id: params.id,
        status: SubmissionStatus.APPROVED,
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

    // Group by user
    const userMap = new Map<
      string,
      {
        userId: string;
        username: string;
        avatarUrl: string | null;
        eligibleViews: number;
        earnings: number;
        clipsCount: number;
      }
    >();

    for (const sub of approvedSubmissions) {
      const existing = userMap.get(sub.user_id) || {
        userId: sub.user.id,
        username: sub.user.username,
        avatarUrl: sub.user.avatar_url,
        eligibleViews: 0,
        earnings: 0,
        clipsCount: 0,
      };

      existing.eligibleViews += sub.eligible_views;
      existing.earnings += Number(sub.current_earnings);
      existing.clipsCount += 1;
      userMap.set(sub.user_id, existing);
    }

    const leaderboard = Array.from(userMap.values())
      .sort((a, b) => b.eligibleViews - a.eligibleViews)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return NextResponse.json({ data: leaderboard });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch leaderboard" }, { status: 500 });
  }
}
