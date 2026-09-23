import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InstagramProvider, verifyCodeInBiography } from "@/lib/social/instagram";
import { encryptToken } from "@/lib/encryption";
import { VerificationStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.SESSION_SECRET ||
  "clipearn_ultra_secure_jwt_session_secret_change_in_prod";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const baseUrl = url.origin;

  // Handle user cancellation or Meta authorization errors
  if (error) {
    const errorMsg = errorDescription || error || "Authorization was cancelled.";
    return NextResponse.redirect(
      new URL(
        `/clipper/profile?error=instagram_auth_failed&msg=${encodeURIComponent(errorMsg)}`,
        baseUrl
      )
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/clipper/profile?error=missing_code", baseUrl)
    );
  }

  // Verify and decode state token
  let decodedState: { userId: string; accountId: string; username?: string };
  try {
    decodedState = jwt.verify(state, JWT_SECRET) as any;
    if (!decodedState?.userId || !decodedState?.accountId) {
      throw new Error("Invalid state payload");
    }
  } catch {
    return NextResponse.redirect(
      new URL("/clipper/profile?error=invalid_state", baseUrl)
    );
  }

  const { accountId, userId } = decodedState;

  // Fetch target social account from database
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || account.user_id !== userId) {
    return NextResponse.redirect(
      new URL("/clipper/profile?error=account_not_found", baseUrl)
    );
  }

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const defaultRedirectUri = `${protocol}://${host}/api/social-accounts/callback/instagram`;

  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ||
    process.env.META_REDIRECT_URI ||
    defaultRedirectUri;

  const provider = new InstagramProvider();

  try {
    // 1. Exchange OAuth code for Access Token
    const tokenData = await provider.exchangeCodeForToken(code, redirectUri);
    const accessToken = tokenData.access_token;

    // 2. Fetch authorized profile via official Meta API
    const profile = await provider.getProfileByToken(accessToken);

    const apiUsername = profile.username.trim().replace(/^@/, "").toLowerCase();
    const targetUsername = account.username.trim().replace(/^@/, "").toLowerCase();

    // 3. Username Validation (Requirement F)
    // Make sure authorized Instagram account corresponds to the username being verified
    if (apiUsername && apiUsername !== targetUsername) {
      return NextResponse.redirect(
        new URL(
          `/clipper/profile?error=username_mismatch&expected=${encodeURIComponent(
            account.username
          )}&authorized=${encodeURIComponent(profile.username)}`,
          baseUrl
        )
      );
    }

    // 4. Bio Verification (Requirement G)
    const verificationCode = account.verification_code || "";
    const isCodeInBio = verifyCodeInBiography(profile.biography, verificationCode);

    // Encrypt access token before storing
    const encryptedToken = encryptToken(accessToken);
    const tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined;

    if (isCodeInBio) {
      // Status = VERIFIED
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          verification_status: VerificationStatus.VERIFIED,
          verified_at: new Date(),
          platform_user_id: profile.id || profile.user_id || account.platform_user_id,
          access_token_encrypted: encryptedToken,
          token_expires_at: tokenExpiresAt,
          profile_url: `https://www.instagram.com/${profile.username}`,
        },
      });

      // Send in-app notification
      await prisma.notification.create({
        data: {
          user_id: userId,
          type: "SOCIAL_VERIFIED",
          title: "Instagram Account Verified! ✅",
          message: `Your Instagram account @${account.username} was verified successfully. You can now submit clips from this account!`,
        },
      });

      await logAuditEvent({
        actorId: userId,
        action: "SOCIAL_ACCOUNT_VERIFIED",
        targetType: "SOCIAL_ACCOUNT",
        targetId: account.id,
        newValue: { platform: "INSTAGRAM", username: account.username },
      });

      return NextResponse.redirect(
        new URL(
          `/clipper/profile?verified=true&platform=INSTAGRAM&username=${encodeURIComponent(
            account.username
          )}`,
          baseUrl
        )
      );
    } else {
      // Code was NOT in the bio yet.
      // Save the encrypted token so the user can just add the code to bio and click "Verify Now" without re-authenticating
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          platform_user_id: profile.id || profile.user_id || account.platform_user_id,
          access_token_encrypted: encryptedToken,
          token_expires_at: tokenExpiresAt,
          verification_status: VerificationStatus.PENDING,
        },
      });

      return NextResponse.redirect(
        new URL(
          `/clipper/profile?error=code_not_found&platform=INSTAGRAM&accountId=${account.id}`,
          baseUrl
        )
      );
    }
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/clipper/profile?error=meta_api_error&msg=${encodeURIComponent(
          err?.message || "Instagram API error"
        )}`,
        baseUrl
      )
    );
  }
}
