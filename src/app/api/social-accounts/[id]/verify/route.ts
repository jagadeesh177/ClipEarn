import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getSocialProvider } from "@/lib/social";
import { VerificationStatus } from "@prisma/client";
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
      return NextResponse.json({ error: "Social account not found" }, { status: 404 });
    }

    if (account.verification_status === VerificationStatus.VERIFIED) {
      return NextResponse.json({ success: true, message: "Account is already verified", account });
    }

    let verificationCode = account.verification_code;
    if (!verificationCode || verificationCode.startsWith("verified-") || verificationCode.length < 6) {
      const randomHex = Math.random().toString(36).substring(2, 8);
      verificationCode = `clipearn-${randomHex}`;
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { verification_code: verificationCode },
      });
    }

    let bioText = "";
    let confirmCode = false;
    try {
      const body = await request.json();
      bioText = typeof body?.bioText === "string" ? body.bioText.trim() : "";
      confirmCode = body?.confirmCode === true;
    } catch {
      // No body or empty
    }

    let isVerified = false;
    let failureError = "";
    let isLoginWall = false;

    if (bioText) {
      if (bioText.toLowerCase().includes(verificationCode.toLowerCase())) {
        isVerified = true;
      } else {
        failureError = `Verification code "${verificationCode}" was not found in the bio text provided. Please make sure your bio contains "${verificationCode}".`;
      }
    } else if (confirmCode) {
      isVerified = true;
    } else {
      const provider = getSocialProvider(account.platform);
      const result = await provider.verifyAccount(account.username, verificationCode);
      isVerified = result.is_verified;
      failureError = result.error || "Verification code not found in bio. Please check and try again in a few moments.";
      isLoginWall = !!result.is_login_wall;
    }

    if (isVerified) {
      const updated = await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          verification_status: VerificationStatus.VERIFIED,
          verified_at: new Date(),
          // Clear or mark code expired
          verification_code: `verified-${Date.now()}`,
        },
      });

      // Notification
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

      return NextResponse.json({ success: true, account: updated });
    } else {
      return NextResponse.json(
        {
          error: failureError,
          is_login_wall: isLoginWall,
          verification_code: verificationCode,
        },
        { status: 422 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Verification failed" }, { status: 500 });
  }
}
