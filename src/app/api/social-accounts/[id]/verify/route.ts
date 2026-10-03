import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getSocialProvider } from "@/lib/social";
import { InstagramProvider } from "@/lib/social/instagram";
import { decryptToken } from "@/lib/encryption";
import { Platform, VerificationStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const account = await prisma.socialAccount.findUnique({
      where: { id: params.id },
    });

    if (!account || account.user_id !== user.id) {
      return NextResponse.json(
        { error: "Social account not found" },
        { status: 404 }
      );
    }

    if (account.verification_status === VerificationStatus.VERIFIED) {
      return NextResponse.json({
        success: true,
        is_verified: true,
        message: "Instagram account verified",
        account,
      });
    }

    let verificationCode = account.verification_code;
    if (
      !verificationCode ||
      verificationCode.startsWith("verified-") ||
      verificationCode.length < 6
    ) {
      // Math.random().toString(36) can yield fewer than 6 chars; use a CSPRNG with fixed length
      const randomHex = crypto.randomBytes(4).toString("hex").slice(0, 6);
      verificationCode = `clipearn-${randomHex}`;
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { verification_code: verificationCode },
      });
    }

    let isVerified = false;
    let failureError = "";

    if (account.platform === Platform.INSTAGRAM) {
      const instagramProvider = new InstagramProvider();

      // Prefer the clipper's own OAuth token; a global env token belongs to a single
      // Instagram account and would fail the "authorized account matches" check for everyone else.
      let token: string | undefined =
        (account.access_token_encrypted ? decryptToken(account.access_token_encrypted) : null) || undefined;
      if (!token) {
        token = process.env.INSTAGRAM_TEST_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || undefined;
      }

      // Only the code issued to THIS account record is accepted. (Accepting any
      // "clipearn-xxxxxx" found in the bio let a user claim someone else's account
      // whenever the real owner's own code was still in their bio.)
      const result = await instagramProvider.verifyAccount(
        account.username,
        verificationCode,
        token
      );

      isVerified = result.is_verified;
      failureError =
        result.error ||
        "The verification code was not found in the Instagram bio. Please make sure the exact code is present in your bio and try again.";
    } else {
      // YouTube / TikTok providers
      const provider = getSocialProvider(account.platform);
      const result = await provider.verifyAccount(account.username, verificationCode);
      isVerified = result.is_verified;
      failureError =
        result.error ||
        "The verification code was not found in your bio. Please make sure the exact code is present in your bio and try again.";
    }

    if (isVerified) {
      const updated = await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          verification_code: verificationCode,
          verification_status: VerificationStatus.VERIFIED,
          verified_at: new Date(),
        },
      });

      // User notification
      await prisma.notification.create({
        data: {
          user_id: user.id,
          type: "SOCIAL_VERIFIED",
          title: "Account Verified! ✅",
          message: `Your ${account.platform} account @${account.username} was verified successfully. You can now submit clips from this account!`,
        },
      });

      await logAuditEvent({
        actorId: user.id,
        action: "SOCIAL_ACCOUNT_VERIFIED",
        targetType: "SOCIAL_ACCOUNT",
        targetId: account.id,
      });

      return NextResponse.json({
        success: true,
        is_verified: true,
        message: "Instagram account verified",
        account: updated,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          is_verified: false,
          error: failureError,
          verification_code: verificationCode,
        },
        { status: 422 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Verification failed" },
      { status: 500 }
    );
  }
}
