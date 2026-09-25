import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyPreAuthTicket, PREAUTH_COOKIE_NAME } from "@/lib/managerAccessKey";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const portalParam = searchParams.get("portal")?.toLowerCase();
  const roleParam = searchParams.get("role")?.toLowerCase();
  const ticketParam = searchParams.get("ticket");

  let requestedPortal: "clipper" | "manager" = "clipper";
  if (portalParam === "manager" || roleParam === "manager" || portalParam === "admin" || roleParam === "admin") {
    requestedPortal = "manager";
  } else {
    requestedPortal = "clipper";
  }

  let managerKeyId: string | null = null;
  let validatedTicket: string | null = null;

  // Campaign Manager: if a pre-auth ticket exists (from query param or cookie), validate it.
  if (requestedPortal === "manager") {
    const cookieHeader = request.headers.get("cookie") || "";
    const ticketMatch = cookieHeader.match(new RegExp(`${PREAUTH_COOKIE_NAME}=([^;]+)`));
    const ticketToken = ticketParam ? decodeURIComponent(ticketParam) : ticketMatch ? decodeURIComponent(ticketMatch[1]) : null;

    if (ticketToken) {
      const verification = verifyPreAuthTicket(ticketToken);
      if (!verification.valid || !verification.keyId) {
        return NextResponse.redirect(new URL("/manager/login?error=key_invalid", request.url));
      }

      // Verify key record in DB is still ACTIVE and not revoked in the interim
      const keyRecord = await prisma.managerAccessKey.findUnique({
        where: { id: verification.keyId },
      });

      if (!keyRecord) {
        return NextResponse.redirect(new URL("/manager/login?error=key_invalid", request.url));
      }
      if (keyRecord.status === "USED") {
        return NextResponse.redirect(new URL("/manager/login?error=key_already_used", request.url));
      }
      if (keyRecord.status === "REVOKED") {
        return NextResponse.redirect(new URL("/manager/login?error=key_revoked", request.url));
      }
      if (keyRecord.expires_at && keyRecord.expires_at < new Date()) {
        return NextResponse.redirect(new URL("/manager/login?error=key_expired", request.url));
      }

      managerKeyId = verification.keyId;
      validatedTicket = ticketToken;
    }
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const urlObj = new URL(request.url);
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${urlObj.origin}/api/auth/discord/callback`;

  const stateObj = {
    ref: ref || null,
    portal: requestedPortal,
    role: requestedPortal.toUpperCase(),
    managerKeyId,
    ticket: validatedTicket,
    nonce: crypto.randomBytes(8).toString("hex"),
  };
  const encodedState = Buffer.from(JSON.stringify(stateObj)).toString("base64");

  if (!clientId || clientId === "your_discord_client_id") {
    // Development / mock fallback redirect for testing and local environments
    const mockCallbackUrl = new URL(redirectUri);
    mockCallbackUrl.searchParams.set("code", `mock_discord_code_${requestedPortal}_${Date.now()}`);
    mockCallbackUrl.searchParams.set("state", encodedState);
    return NextResponse.redirect(mockCallbackUrl.toString());
  }

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=identify%20email&state=${encodedState}`;

  return NextResponse.redirect(discordAuthUrl);
}
