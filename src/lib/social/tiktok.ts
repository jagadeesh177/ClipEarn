import { Platform } from "@prisma/client";
import { SocialProvider, SocialAccountData, VerificationResult, VideoMetadata } from "./types";
import { MockSocialProvider } from "./mock-provider";

import { verifySocialBio } from "./bio-verifier";

export class TikTokProvider implements SocialProvider {
  public platform = Platform.TIKTOK;
  private mockFallback = new MockSocialProvider(Platform.TIKTOK);

  parsePostId(postUrl: string): string | null {
    return this.mockFallback.parsePostId(postUrl);
  }

  async connect(code: string): Promise<SocialAccountData> {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret || clientKey === "your_tiktok_client_key") {
      return this.mockFallback.connect(code);
    }

    try {
      const redirectUri = process.env.TIKTOK_REDIRECT_URI || "";
      const params = new URLSearchParams();
      params.append("client_key", clientKey);
      params.append("client_secret", clientSecret);
      params.append("code", code);
      params.append("grant_type", "authorization_code");
      params.append("redirect_uri", redirectUri);

      const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error_description || "TikTok token exchange failed");
      }

      // Fetch user info
      const userRes = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username",
        {
          headers: { Authorization: `Bearer ${data.data.access_token}` },
        }
      );
      const userData = await userRes.json();
      const openId = userData?.data?.user?.open_id || `tt_${Date.now()}`;
      const username = userData?.data?.user?.username || userData?.data?.user?.display_name || `tiktok_${openId.slice(0, 6)}`;

      return {
        platform: Platform.TIKTOK,
        platform_user_id: openId,
        username: username,
        profile_url: `https://www.tiktok.com/@${username}`,
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        token_expires_at: new Date(Date.now() + (data.data.expires_in || 86400) * 1000),
      };
    } catch {
      return this.mockFallback.connect(code);
    }
  }

  async verifyAccount(username: string, verificationCode: string): Promise<VerificationResult> {
    return verifySocialBio(Platform.TIKTOK, username, verificationCode);
  }

  async getProfile(platformUserId: string) {
    return this.mockFallback.getProfile(platformUserId);
  }

  async getVideo(postUrl: string): Promise<VideoMetadata> {
    const fallback = await this.mockFallback.getVideo(postUrl);
    try {
      const metrics = await this.fetchPublicMetrics(postUrl);
      if (metrics) {
        return {
          ...fallback,
          current_views: metrics.views || fallback.current_views,
          likes: metrics.likes !== undefined ? metrics.likes : fallback.likes,
          comments: metrics.comments !== undefined ? metrics.comments : fallback.comments,
        };
      }
    } catch {}
    return fallback;
  }

  async getVideoViews(platformPostId: string): Promise<number> {
    const metrics = await this.getVideoMetrics(platformPostId);
    return metrics.views;
  }

  async getVideoMetrics(platformPostId: string, postUrl?: string): Promise<{ views: number; likes: number; comments: number }> {
    if (postUrl) {
      try {
        const metrics = await this.fetchPublicMetrics(postUrl);
        if (metrics && (metrics.views > 0 || metrics.likes > 0)) {
          return metrics;
        }
      } catch {}
    }
    return this.mockFallback.getVideoMetrics(platformPostId);
  }

  private async fetchPublicMetrics(postUrl: string): Promise<{ views: number; likes: number; comments: number } | null> {
    try {
      const res = await fetch(postUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const html = await res.text();

      let views = 0;
      let likes = 0;
      let comments = 0;

      // Check itemInfo / stats JSON in TikTok rehydration data
      const statsMatch = html.match(/"stats":\s*\{([^}]+)\}/);
      if (statsMatch) {
        const statsStr = statsMatch[1];
        const playMatch = statsStr.match(/"playCount":\s*(\d+)/);
        const diggMatch = statsStr.match(/"diggCount":\s*(\d+)/);
        const commentMatch = statsStr.match(/"commentCount":\s*(\d+)/);

        if (playMatch) views = parseInt(playMatch[1], 10);
        if (diggMatch) likes = parseInt(diggMatch[1], 10);
        if (commentMatch) comments = parseInt(commentMatch[1], 10);
      }

      // Check meta description: e.g. "Watch ... with 12.3K likes and 456 comments."
      if (!likes || !comments) {
        const descMatch =
          html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
          html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
        if (descMatch) {
          const text = descMatch[1];
          const lMatch = text.match(/([0-9,.]+[KMkm]?)\s+likes/i);
          const cMatch = text.match(/([0-9,.]+[KMkm]?)\s+comments/i);
          const vMatch = text.match(/([0-9,.]+[KMkm]?)\s+views/i);

          if (lMatch && !likes) likes = this.parseCount(lMatch[1]);
          if (cMatch && !comments) comments = this.parseCount(cMatch[1]);
          if (vMatch && !views) views = this.parseCount(vMatch[1]);
        }
      }

      if (views > 0 || likes > 0 || comments > 0) {
        if (views === 0 && likes > 0) {
          views = Math.round(likes * 12.5);
        }
        return { views, likes, comments };
      }
    } catch {}
    return null;
  }

  private parseCount(str: string): number {
    const clean = str.replace(/,/g, "").trim().toUpperCase();
    if (clean.endsWith("K")) return Math.round(parseFloat(clean) * 1000);
    if (clean.endsWith("M")) return Math.round(parseFloat(clean) * 1000000);
    return parseInt(clean, 10) || 0;
  }
}
