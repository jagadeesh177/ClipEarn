import { Platform } from "@prisma/client";
import { SocialProvider, SocialAccountData, VerificationResult, VideoMetadata } from "./types";
import { MockSocialProvider } from "./mock-provider";

import { verifySocialBio } from "./bio-verifier";

export class YouTubeProvider implements SocialProvider {
  public platform = Platform.YOUTUBE;
  private mockFallback = new MockSocialProvider(Platform.YOUTUBE);

  parsePostId(postUrl: string): string | null {
    return this.mockFallback.parsePostId(postUrl);
  }

  async connect(code: string): Promise<SocialAccountData> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId === "your_google_client_id") {
      return this.mockFallback.connect(code);
    }

    try {
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || "";
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error_description || "YouTube token exchange failed");
      }

      // Fetch YouTube Channel info
      const chRes = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        {
          headers: { Authorization: `Bearer ${data.access_token}` },
        }
      );
      const chData = await chRes.json();
      const channel = chData.items?.[0];
      const channelId = channel?.id || `yt_${Date.now()}`;
      const channelTitle = channel?.snippet?.title || `yt_creator_${channelId.slice(0, 6)}`;

      return {
        platform: Platform.YOUTUBE,
        platform_user_id: channelId,
        username: channelTitle,
        profile_url: `https://www.youtube.com/channel/${channelId}`,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      };
    } catch {
      return this.mockFallback.connect(code);
    }
  }

  async verifyAccount(username: string, verificationCode: string): Promise<VerificationResult> {
    return verifySocialBio(Platform.YOUTUBE, username, verificationCode);
  }

  async getProfile(platformUserId: string) {
    return this.mockFallback.getProfile(platformUserId);
  }

  async getVideo(postUrl: string): Promise<VideoMetadata> {
    const videoId = this.parsePostId(postUrl);
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey || !videoId) {
      return this.mockFallback.getVideo(postUrl);
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
      );
      const data = await res.json();
      const item = data.items?.[0];
      if (!item) {
        return this.mockFallback.getVideo(postUrl);
      }

      const views = parseInt(item.statistics?.viewCount || "0", 10);
      const likes = parseInt(item.statistics?.likeCount || "0", 10);
      const comments = parseInt(item.statistics?.commentCount || "0", 10);
      return {
        platform: Platform.YOUTUBE,
        platform_post_id: videoId,
        post_url: postUrl,
        author_platform_user_id: item.snippet?.channelId,
        author_username: item.snippet?.channelTitle,
        current_views: views,
        likes,
        comments,
        is_available: true,
        is_private: false,
      };
    } catch {
      return this.mockFallback.getVideo(postUrl);
    }
  }

  async getVideoViews(platformPostId: string): Promise<number> {
    const metrics = await this.getVideoMetrics(platformPostId);
    return metrics.views;
  }

  async getVideoMetrics(platformPostId: string): Promise<{ views: number; likes: number; comments: number }> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return this.mockFallback.getVideoMetrics(platformPostId);
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${platformPostId}&key=${apiKey}`
      );
      const data = await res.json();
      const stats = data.items?.[0]?.statistics;
      if (!stats) {
        return this.mockFallback.getVideoMetrics(platformPostId);
      }
      return {
        views: parseInt(stats.viewCount || "0", 10),
        likes: parseInt(stats.likeCount || "0", 10),
        comments: parseInt(stats.commentCount || "0", 10),
      };
    } catch {
      return this.mockFallback.getVideoMetrics(platformPostId);
    }
  }
}
