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
      const randomHex = Math.random().toString(36).substring(2, 8);
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

      // Retrieve token if available, otherwise verify directly by public bio
      let token = process.env.INSTAGRAM_TEST_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
      if (!token && account.access_token_encrypted) {
        token = decryptToken(account.access_token_encrypted) || undefined;
      }

      // Verify bio directly (via public bio crawling or official token if available)
      let result = await instagramProvider.verifyAccount(
        account.username,
        verificationCode,
        token
      );

      // If current code not found, check if bio contains any other valid clipearn code from previous attempts
      if (!result.is_verified && result.bio_text) {
        const foundCodes = result.bio_text.match(/clipearn-[a-z0-9]{6}/gi);
        if (foundCodes && foundCodes.length > 0) {
          for (const fc of foundCodes) {
            const check = await instagramProvider.verifyAccount(
              account.username,
              fc,
              token
            );
            if (check.is_verified) {
              result = check;
              verificationCode = fc;
              break;
            }
          }
        }
      }

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
