import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPreAuthTicket, PREAUTH_COOKIE_NAME } from "@/lib/managerAccessKey";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const requestedRole = searchParams.get("role"); // "MANAGER" or default "CLIPPER"

  let managerKeyId: string | null = null;

  // Campaign Manager: if a pre-auth ticket exists (first-time invitation onboarding), validate it.
  // If no ticket exists, managerKeyId remains null (returning manager logging in with linked Discord account).
  if (requestedRole === "MANAGER") {
    const cookieHeader = request.headers.get("cookie") || "";
    const ticketMatch = cookieHeader.match(new RegExp(`${PREAUTH_COOKIE_NAME}=([^;]+)`));
    const ticketToken = ticketMatch ? decodeURIComponent(ticketMatch[1]) : null;

    if (ticketToken) {
      const verification = verifyPreAuthTicket(ticketToken);
      if (!verification.valid || !verification.keyId) {
        return NextResponse.redirect(new URL("/manager/login?error=key_invalid", request.url));
      }

      // Verify key record in DB is still ACTIVE and not revoked in the interim
      const keyRecord = await prisma.managerAccessKey.findUnique({
        where: { id: verification.keyId },
      });

      if (!keyRecord || keyRecord.status !== "ACTIVE" || (keyRecord.expires_at && keyRecord.expires_at < new Date())) {
        return NextResponse.redirect(new URL("/manager/login?error=key_revoked", request.url));
      }

      managerKeyId = verification.keyId;
    }
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const urlObj = new URL(request.url);
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${urlObj.origin}/api/auth/discord/callback`;

  const stateObj = {
    ref: ref || null,
    role: requestedRole === "MANAGER" ? "MANAGER" : "CLIPPER",
    managerKeyId,
    nonce: Math.random().toString(36).substring(7),
  };
  const encodedState = Buffer.from(JSON.stringify(stateObj)).toString("base64");

  if (!clientId || clientId === "your_discord_client_id") {
    // If Discord credentials not set in .env, redirect to callback with a mock code so testing still succeeds smoothly
    const mockCallbackUrl = new URL(redirectUri);
    mockCallbackUrl.searchParams.set("code", "mock_discord_code_" + Date.now());
    mockCallbackUrl.searchParams.set("state", encodedState);
    if (ref) mockCallbackUrl.searchParams.set("ref", ref);
    return NextResponse.redirect(mockCallbackUrl.toString());
  }

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=identify%20email&state=${encodedState}`;

  return NextResponse.redirect(discordAuthUrl);
}
