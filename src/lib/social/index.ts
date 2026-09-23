import { Platform } from "@prisma/client";
import { SocialProvider } from "./types";
import { InstagramProvider } from "./instagram";
import { TikTokProvider } from "./tiktok";
import { YouTubeProvider } from "./youtube";
import { MockSocialProvider } from "./mock-provider";

export function getSocialProvider(platform: Platform): SocialProvider {
  if (platform === Platform.INSTAGRAM) {
    return new InstagramProvider();
  }

  const isMock = process.env.MOCK_SOCIAL_PROVIDERS === "true";
  if (isMock) {
    return new MockSocialProvider(platform);
  }

  switch (platform) {
    case Platform.TIKTOK:
      return new TikTokProvider();
    case Platform.YOUTUBE:
      return new YouTubeProvider();
    default:
      return new MockSocialProvider(platform);
  }
}

export function detectPlatformFromUrl(url: string): Platform | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("tiktok.com")) return Platform.TIKTOK;
    if (host.includes("instagram.com")) return Platform.INSTAGRAM;
    if (host.includes("youtube.com") || host.includes("youtu.be")) return Platform.YOUTUBE;
    return null;
  } catch {
    return null;
  }
}

/**
 * Extracts the author or account username from a given social media clip URL, if present.
 * Returns lowercase username without '@' prefix.
 */
export function extractAccountFromUrl(url: string, platform?: Platform): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    // TikTok: https://www.tiktok.com/@username/video/12345
    if (platform === Platform.TIKTOK || host.includes("tiktok.com")) {
      const match = pathname.match(/@([^/?#&]+)/);
      if (match) return match[1].toLowerCase().replace(/^@/, "").trim();
    }

    // Instagram: https://www.instagram.com/username/reel/CODE/ or /username/p/CODE/
    if (platform === Platform.INSTAGRAM || host.includes("instagram.com")) {
      const parts = pathname.split("/").filter(Boolean);
      const reserved = new Set([
        "p",
        "reel",
        "reels",
        "stories",
        "tv",
        "explore",
        "direct",
        "accounts",
        "api",
        "about",
        "legal",
        "developer",
      ]);
      if (parts.length >= 2 && !reserved.has(parts[0].toLowerCase())) {
        return parts[0].toLowerCase().replace(/^@/, "").trim();
      }
    }

    // YouTube: https://www.youtube.com/@channel/shorts/12345
    if (
      platform === Platform.YOUTUBE ||
      host.includes("youtube.com") ||
      host.includes("youtu.be")
    ) {
      const match = pathname.match(/@([^/?#&]+)/);
      if (match) return match[1].toLowerCase().replace(/^@/, "").trim();
      if (pathname.startsWith("/c/") || pathname.startsWith("/user/")) {
        const parts = pathname.split("/").filter(Boolean);
        if (parts.length >= 2) return parts[1].toLowerCase().trim();
      }
    }
  } catch {}
  return null;
}

export * from "./types";

