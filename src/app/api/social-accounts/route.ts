import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Platform, VerificationStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { flagSuspiciousActivity } from "@/lib/fraud";

export async function GET() {
  try {
    const user = await requireAuth();
    const accounts = await prisma.socialAccount.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: accounts });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch social accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { platform, username } = await request.json();

    if (!platform || !username) {
      return NextResponse.json({ error: "Platform and username are required" }, { status: 400 });
    }

    const cleanUsername = username.trim().replace(/^@/, "");
    const platformEnum = platform as Platform;

    // Platform user ID generation (authoritative identity)
    const platformUserId = `${platformEnum.toLowerCase()}_${cleanUsername.toLowerCase()}`;

    // Check if another user has already connected this account
    const existing = await prisma.socialAccount.findUnique({
      where: {
        platform_platform_user_id: {
          platform: platformEnum,
          platform_user_id: platformUserId,
        },
      },
    });

    if (existing) {
      if (existing.user_id !== user.id) {
        await flagSuspiciousActivity({
          userId: user.id,
          type: "DUPLICATE_SOCIAL_CLAIM",
          description: `User ${user.id} attempted to claim @${cleanUsername} on ${platform} which already belongs to user ${existing.user_id}`,
        });

        return NextResponse.json(
          { error: "This social account is already connected to another ClipEarn account." },
          { status: 409 }
        );
      } else {
        return NextResponse.json({
          success: true,
          message: "Account already linked",
          account: existing,
        });
      }
    }

    // Generate unique verification code
    const randomHex = Math.random().toString(36).substring(2, 8);
    const verificationCode = `clipearn-${randomHex}`;

    let profileUrl = `https://${platformEnum.toLowerCase()}.com/@${cleanUsername}`;
    if (platformEnum === Platform.YOUTUBE) {
      profileUrl = `https://youtube.com/@${cleanUsername}`;
    }

    const account = await prisma.socialAccount.create({
      data: {
        user_id: user.id,
        platform: platformEnum,
        platform_user_id: platformUserId,
        username: cleanUsername,
        profile_url: profileUrl,
        verification_code: verificationCode,
        verification_status: VerificationStatus.PENDING,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      action: "SOCIAL_ACCOUNT_CONNECTED",
      targetType: "SOCIAL_ACCOUNT",
      targetId: account.id,
      newValue: { platform: platformEnum, username: cleanUsername },
    });

    return NextResponse.json({ success: true, account }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to connect social account" }, { status: 500 });
  }
}
