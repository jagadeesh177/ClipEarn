import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");

  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/auth/discord/callback";

  if (!clientId || clientId === "your_discord_client_id") {
    // If Discord credentials not set in .env, redirect to callback with a mock code so testing still succeeds smoothly
    const mockCallbackUrl = new URL(redirectUri);
    mockCallbackUrl.searchParams.set("code", "mock_discord_code_" + Date.now());
    if (ref) mockCallbackUrl.searchParams.set("ref", ref);
    return NextResponse.redirect(mockCallbackUrl.toString());
  }

  const state = JSON.stringify({ ref: ref || null, nonce: Math.random().toString(36).substring(7) });
  const encodedState = Buffer.from(state).toString("base64");

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=identify%20email&state=${encodedState}`;

  return NextResponse.redirect(discordAuthUrl);
}
