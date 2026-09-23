import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InstagramProvider } from "@/lib/social/instagram";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.SESSION_SECRET ||
  "clipearn_ultra_secure_jwt_session_secret_change_in_prod";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required to initiate authorization." },
        { status: 400 }
      );
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || account.user_id !== user.id) {
      return NextResponse.json(
        { error: "Social account not found." },
        { status: 404 }
      );
    }

    // Sign a state payload to protect against CSRF and verify upon callback
    const statePayload = {
      userId: user.id,
      accountId: account.id,
      username: account.username,
      nonce: Math.random().toString(36).substring(2, 10),
      timestamp: Date.now(),
    };
    const state = jwt.sign(statePayload, JWT_SECRET, { expiresIn: "1h" });

    // Determine redirect URI (byte-for-byte exact match with Meta App Settings)
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const defaultRedirectUri = `${protocol}://${host}/api/social-accounts/callback/instagram`;

    const redirectUri =
      process.env.INSTAGRAM_REDIRECT_URI ||
      process.env.META_REDIRECT_URI ||
      defaultRedirectUri;

    const provider = new InstagramProvider();
    const authUrl = provider.getAuthorizationUrl(redirectUri, state);

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to initiate Instagram authorization." },
      { status: 500 }
    );
  }
}
