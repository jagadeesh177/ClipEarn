import { Platform } from "@prisma/client";
import { SocialProvider } from "./types";
import { InstagramProvider } from "./instagram";
import { TikTokProvider } from "./tiktok";
import { YouTubeProvider } from "./youtube";
import { MockSocialProvider } from "./mock-provider";

export function getSocialProvider(platform: Platform): SocialProvider {
  const isMock = process.env.MOCK_SOCIAL_PROVIDERS === "true";
  if (isMock) {
    return new MockSocialProvider(platform);
  }

  switch (platform) {
    case Platform.INSTAGRAM:
      return new InstagramProvider();
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

export * from "./types";
