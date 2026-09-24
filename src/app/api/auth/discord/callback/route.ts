import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, COOKIE_NAME } from "@/lib/auth";
import { UserRole, UserStatus, ReferralStatus } from "@prisma/client";
import { verifyPreAuthTicket, PREAUTH_COOKIE_NAME } from "@/lib/managerAccessKey";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  let referralCode: string | null = null;
  let requestedRole: string = "CLIPPER";
  let managerKeyId: string | null = null;

  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      referralCode = decoded.ref;
      if (decoded.role === "MANAGER") {
        requestedRole = "MANAGER";
        managerKeyId = decoded.managerKeyId || null;
      }
    } catch {
      // ignore state decode error
    }
  }

  // If Manager role was requested:
  // - If managerKeyId is present: First-Time Manager Invitation linking.
  // - If managerKeyId is null: Returning Manager login with linked Discord account.
  let validatedKeyRecord: any = null;
  const isManagerInvite = requestedRole === "MANAGER" && Boolean(managerKeyId);

  if (isManagerInvite) {
    const cookieHeader = request.headers.get("cookie") || "";
    const ticketMatch = cookieHeader.match(new RegExp(`${PREAUTH_COOKIE_NAME}=([^;]+)`));
    const ticketToken = ticketMatch ? decodeURIComponent(ticketMatch[1]) : null;

    if (!ticketToken || !managerKeyId) {
      return NextResponse.redirect(new URL("/manager/login?error=key_required", request.url));
    }

    const verification = verifyPreAuthTicket(ticketToken);
    if (!verification.valid || verification.keyId !== managerKeyId) {
      return NextResponse.redirect(new URL("/manager/login?error=key_invalid", request.url));
    }

    // Verify key in DB is STILL active
    validatedKeyRecord = await prisma.managerAccessKey.findUnique({
      where: { id: managerKeyId },
    });

    if (!validatedKeyRecord || validatedKeyRecord.status !== "ACTIVE" || (validatedKeyRecord.expires_at && validatedKeyRecord.expires_at < new Date())) {
      return NextResponse.redirect(new URL("/manager/login?error=key_revoked", request.url));
    }
  }

  if (!code) {
    const failureRedirect = requestedRole === "MANAGER" ? "/manager/login?error=missing_code" : "/login?error=missing_code";
    return NextResponse.redirect(new URL(failureRedirect, request.url));
  }

  let discordId: string;
  let username: string;
  let email: string | null = null;
  let avatarUrl: string | null = null;

  // Official Discord OAuth token exchange
  try {
    const clientId = process.env.DISCORD_CLIENT_ID!;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
    const urlObj = new URL(request.url);
    const redirectUri = process.env.DISCORD_REDIRECT_URI || `${urlObj.origin}/api/auth/discord/callback`;

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      throw new Error(tokenData.error_description || "Failed to exchange Discord code");
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    discordId = userData.id;
    username = userData.global_name || userData.username;
    email = userData.email || null;
    avatarUrl = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
      : null;
  } catch (err: any) {
    console.error("Discord OAuth Error:", err);
    const failureRedirect = requestedRole === "MANAGER" ? "/manager/login?error=oauth_failed" : "/login?error=oauth_failed";
    return NextResponse.redirect(new URL(failureRedirect, request.url));
  }

  try {
    // 1. Find user by discord_id
    let user = await prisma.user.findUnique({
      where: { discord_id: discordId },
    });

    // If not found by discord_id, check if user exists by email to link account
    if (!user && email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        user = existingUser;
      }
    }

    // 2. Returning Campaign Manager Authorization Check:
    // If Manager role requested without an invite key, user MUST already be an active linked MANAGER.
    if (requestedRole === "MANAGER" && !isManagerInvite) {
      if (!user || user.role !== UserRole.MANAGER) {
        return NextResponse.redirect(new URL("/manager/login?error=not_authorized", request.url));
      }
      if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED) {
        return NextResponse.redirect(new URL("/manager/login?error=account_suspended", request.url));
      }
    }

    // 3. First-Time Manager Invitation Check:
    if (requestedRole === "MANAGER" && isManagerInvite) {
      if (user && (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED)) {
        return NextResponse.redirect(new URL("/manager/login?error=account_suspended", request.url));
      }
    }

    if (!user) {
      let referrerId: string | null = null;
      if (referralCode && requestedRole === "CLIPPER") {
        const referrer = await prisma.user.findUnique({
          where: { referral_code: referralCode },
        });
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      const uniqueCode = `CLIP${Math.floor(100000 + Math.random() * 900000)}`;
      user = await prisma.user.create({
        data: {
          discord_id: discordId,
          username,
          email,
          avatar_url: avatarUrl,
          role: isManagerInvite ? UserRole.MANAGER : UserRole.CLIPPER,
          status: UserStatus.ACTIVE,
          referral_code: uniqueCode,
          referred_by_id: referrerId,
          last_login_at: new Date(),
        },
      });

      if (referrerId) {
        await prisma.referral.create({
          data: {
            referrer_id: referrerId,
            referred_user_id: user.id,
            referral_code: referralCode!,
            status: ReferralStatus.PENDING,
          },
        });
      }
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          discord_id: discordId,
          username: user.username || username,
          avatar_url: avatarUrl || user.avatar_url,
          last_login_at: new Date(),
          ...(isManagerInvite ? { role: UserRole.MANAGER, status: UserStatus.ACTIVE } : {}),
        },
      });
    }

    // If manager role was authorized via access key, mark key as USED
    if (isManagerInvite && validatedKeyRecord) {
      await prisma.managerAccessKey.update({
        where: { id: validatedKeyRecord.id },
        data: {
          status: "USED",
          used_by: user.id,
          used_at: new Date(),
        },
      });
    }

    const token = signSessionToken({
      userId: user.id,
      role: user.role,
      username: user.username,
      email: user.email,
    });

    const destination = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN
      ? "/manager/dashboard"
      : "/clipper/dashboard";

    const response = NextResponse.redirect(new URL(destination, request.url));
    const isHttps = request.headers.get("x-forwarded-proto") === "https" || request.url.startsWith("https://");

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Clear manager preauth ticket once successfully consumed
    if (requestedRole === "MANAGER") {
      response.cookies.delete(PREAUTH_COOKIE_NAME);
    }

    return response;
  } catch (err: any) {
    console.error("Discord profile provisioning error:", err);
    const failureRedirect = requestedRole === "MANAGER" ? "/manager/login?error=profile_failed" : "/login?error=profile_failed";
    return NextResponse.redirect(new URL(failureRedirect, request.url));
  }
}
