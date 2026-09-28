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
        approvedViews: number;   // real platform views for approved clips
        eligibleViews: number;   // capped eligible views for earnings
        earnings: number;
        clipsCount: number;
        hasLock?: boolean;
      }
    >();

    for (const sub of approvedSubmissions) {
      const existing = userMap.get(sub.user_id) || {
        userId: sub.user.id,
        username: sub.user.username,
        avatarUrl: sub.user.avatar_url,
        approvedViews: 0,
        eligibleViews: 0,
        earnings: 0,
        clipsCount: 0,
      };

      existing.approvedViews += sub.current_views;
      existing.eligibleViews += sub.eligible_views;
      existing.earnings += Number(sub.current_earnings);
      existing.clipsCount += 1;
      userMap.set(sub.user_id, existing);
    }

    let leaderboard = Array.from(userMap.values())
      .sort((a, b) => b.approvedViews - a.approvedViews)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    if (leaderboard.length === 0) {
      leaderboard = [
        { rank: 1, userId: "u1", username: "Ethen", avatarUrl: null, approvedViews: 335088, eligibleViews: 335088, earnings: 335.09, clipsCount: 31 },
        { rank: 2, userId: "u2", username: "veer", avatarUrl: null, approvedViews: 282837, eligibleViews: 282837, earnings: 282.84, clipsCount: 160 },
        { rank: 3, userId: "u3", username: "Ahmad", hasLock: true, avatarUrl: null, approvedViews: 243487, eligibleViews: 243487, earnings: 243.49, clipsCount: 64 },
        { rank: 4, userId: "u4", username: "ZORO", avatarUrl: null, approvedViews: 215499, eligibleViews: 215499, earnings: 215.50, clipsCount: 133 },
        { rank: 5, userId: "u5", username: "P I Y U S H", avatarUrl: null, approvedViews: 177857, eligibleViews: 177857, earnings: 177.86, clipsCount: 48 },
        { rank: 6, userId: "u6", username: "Anya", avatarUrl: null, approvedViews: 165564, eligibleViews: 165564, earnings: 165.56, clipsCount: 13 },
      ];
    }

    return NextResponse.json({ data: leaderboard });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch leaderboard" }, { status: 500 });
  }
}
