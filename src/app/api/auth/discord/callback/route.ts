import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, COOKIE_NAME, isAllowedAdminEmail } from "@/lib/auth";
import { UserRole, UserStatus, ReferralStatus } from "@prisma/client";
import { verifyPreAuthTicket, PREAUTH_COOKIE_NAME } from "@/lib/managerAccessKey";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  let referralCode: string | null = null;
  let requestedPortal: "clipper" | "manager" = "clipper";
  let managerKeyId: string | null = null;

  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      referralCode = decoded.ref || null;
      managerKeyId = decoded.managerKeyId || null;
      if (decoded.portal === "manager" || decoded.role === "MANAGER" || decoded.portal === "admin" || decoded.role === "ADMIN") {
        requestedPortal = "manager";
      } else {
        requestedPortal = "clipper";
      }
    } catch {
      // ignore state decode error
    }
  }

  const getLoginRedirect = (errorParam: string, reason?: string) => {
    const base = requestedPortal === "manager" ? "/manager/login" : "/login";
    const reasonParam = reason ? `&reason=${encodeURIComponent(reason)}` : "";
    return `${base}?error=${errorParam}${reasonParam}`;
  };

  // If Manager portal with invite key was requested: First-Time Manager Invitation linking
  let validatedKeyRecord: any = null;
  const isManagerInvite = requestedPortal === "manager" && Boolean(managerKeyId);

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
    return NextResponse.redirect(new URL(getLoginRedirect("missing_code"), request.url));
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
    return NextResponse.redirect(new URL(getLoginRedirect("oauth_failed"), request.url));
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

    // 2. Server-Side Authorization Check for Requested Portal
    // (Never trust client; authenticate intent against actual database permissions)

    // A. MANAGER PORTAL CHECK:
    if (requestedPortal === "manager") {
      const hasManagerAccess = user && (
        user.role === UserRole.MANAGER ||
        (user.role === UserRole.ADMIN && isAllowedAdminEmail(user.email)) ||
        isManagerInvite
      );

      if (user && (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED)) {
        return NextResponse.redirect(new URL(getLoginRedirect("account_suspended", user.suspension_reason || undefined), request.url));
      }

      if (!hasManagerAccess && !isManagerInvite) {
        return NextResponse.redirect(new URL("/manager/login?error=not_authorized", request.url));
      }
    }

    // B. CLIPPER PORTAL CHECK:
    if (requestedPortal === "clipper") {
      if (user && (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED)) {
        return NextResponse.redirect(new URL(getLoginRedirect("account_suspended", user.suspension_reason || undefined), request.url));
      }
    }

    // 3. User provisioning / account linking
    if (!user) {
      // Manager portal without valid invite key does NOT auto-create users
      if (requestedPortal === "manager" && !isManagerInvite) {
        return NextResponse.redirect(new URL("/manager/login?error=not_authorized", request.url));
      }

      let referrerId: string | null = null;
      if (referralCode && requestedPortal === "clipper") {
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

    // Destination is strictly governed by login intent + authorization!
    // Never automatically redirect to highest role!
    const destination = requestedPortal === "manager"
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
    if (requestedPortal === "manager") {
      response.cookies.delete(PREAUTH_COOKIE_NAME);
    }

    return response;
  } catch (err: any) {
    console.error("Discord profile provisioning error:", err);
    return NextResponse.redirect(new URL(getLoginRedirect("profile_failed"), request.url));
  }
}
