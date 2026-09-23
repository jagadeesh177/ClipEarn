import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { SubmissionStatus, VerificationStatus } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();

    const [socialAccounts, campaignsCount, submissions, ledgerSum] = await Promise.all([
      prisma.socialAccount.findMany({
        where: {
          user_id: user.id,
          verification_status: { not: VerificationStatus.DISCONNECTED },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.campaignMembership.count({
        where: { user_id: user.id },
      }),
      prisma.submission.findMany({
        where: { user_id: user.id },
        select: {
          status: true,
          current_views: true,
          eligible_views: true,
        },
      }),
      prisma.earningsLedger.aggregate({
        where: { user_id: user.id },
        _sum: { amount: true, views: true },
      }),
    ]);

    const totalClips = submissions.length;
    const approvedClips = submissions.filter((s) => s.status === SubmissionStatus.APPROVED).length;
    const totalViews = submissions.reduce((sum, s) => sum + s.current_views, 0);
    const eligibleViews = Number(ledgerSum._sum.views || 0);
    const totalEarnings = Number(ledgerSum._sum.amount || 0);

    return NextResponse.json({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        discord_id: user.discord_id,
        avatar_url: user.avatar_url,
        role: user.role,
        status: user.status,
        referral_code: user.referral_code,
        created_at: user.created_at,
        stats: {
          totalViews,
          eligibleViews,
          totalEarnings,
          totalClips,
          approvedClips,
          campaignsJoined: campaignsCount,
        },
        socialAccounts,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch profile" }, { status: 500 });
  }
}
