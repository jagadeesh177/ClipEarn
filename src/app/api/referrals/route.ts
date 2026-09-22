import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ReferralStatus } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();

    const referrals = await prisma.referral.findMany({
      where: { referrer_id: user.id },
      include: {
        referred_user: {
          select: {
            username: true,
            avatar_url: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const totalSignups = referrals.length;
    const qualifiedCount = referrals.filter((r) => r.status === ReferralStatus.QUALIFIED).length;
    const pendingCount = totalSignups - qualifiedCount;

    const formatted = referrals.map((r) => ({
      id: r.id,
      username: r.referred_user.username,
      avatarUrl: r.referred_user.avatar_url,
      status: r.status,
      joinedAt: r.created_at,
      qualifiedAt: r.qualified_at,
    }));

    return NextResponse.json({
      referralCode: user.referral_code,
      stats: {
        totalSignups,
        qualifiedCount,
        pendingCount,
      },
      referrals: formatted,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch referrals" }, { status: 500 });
  }
}
