import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, COOKIE_NAME } from "@/lib/auth";
import { UserRole, ReferralStatus } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  let referralCode: string | null = null;
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      referralCode = decoded.ref;
    } catch {
      // ignore state decode error
    }
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  let discordId: string;
  let username: string;
  let email: string | null = null;
  let avatarUrl: string | null = null;

  if (code.startsWith("mock_discord_code")) {
    // Development fallback mock
    discordId = "123456789012345678";
    username = "DemoClipper";
    email = "clipper@clipearn.com";
    avatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
  } else {
    // Official Discord OAuth token exchange
    try {
      const clientId = process.env.DISCORD_CLIENT_ID!;
      const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
      const redirectUri = process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/auth/discord/callback";

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
      return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
    }
  }

  // Automatic profile provisioning
  let user = await prisma.user.findUnique({
    where: { discord_id: discordId },
  });

  if (!user) {
    let referrerId: string | null = null;
    if (referralCode) {
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
        role: UserRole.CLIPPER,
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
        username,
        avatar_url: avatarUrl || user.avatar_url,
        last_login_at: new Date(),
      },
    });
  }

  const token = signSessionToken({
    userId: user.id,
    role: user.role,
    username: user.username,
    email: user.email,
  });

  const response = NextResponse.redirect(new URL("/clipper/dashboard", request.url));
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
