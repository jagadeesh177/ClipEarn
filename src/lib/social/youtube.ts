import { Platform } from "@prisma/client";
import { SocialProvider, SocialAccountData, VerificationResult, VideoMetadata } from "./types";
import { verifySocialBio } from "./bio-verifier";

export class YouTubeProvider implements SocialProvider {
  public platform = Platform.YOUTUBE;

  parsePostId(postUrl: string): string | null {
    try {
      const url = new URL(postUrl.trim());
      if (url.pathname.includes("/shorts/")) {
        return url.pathname.split("/shorts/")[1].split("/")[0].split("?")[0];
      }
      if (url.hostname.includes("youtu.be")) {
        return url.pathname.replace(/^\//, "").split("/")[0].split("?")[0];
      }
      return url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop() || null;
    } catch {
      return null;
    }
  }

  async connect(code: string): Promise<SocialAccountData> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId === "your_google_client_id") {
      const mockId = `yt_${Date.now()}`;
      return {
        platform: Platform.YOUTUBE,
        platform_user_id: mockId,
        username: `yt_creator_${mockId.slice(-6)}`,
        profile_url: `https://www.youtube.com/channel/${mockId}`,
        access_token: `yt_token_${code}`,
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      };
    }

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
  }

  async verifyAccount(username: string, verificationCode: string): Promise<VerificationResult> {
    return verifySocialBio(Platform.YOUTUBE, username, verificationCode);
  }

  async getProfile(platformUserId: string) {
    return {
      username: `yt_${platformUserId.slice(0, 8)}`,
      profile_url: `https://www.youtube.com/channel/${platformUserId}`,
      bio: "",
    };
  }

  async getVideo(postUrl: string): Promise<VideoMetadata> {
    const videoId = this.parsePostId(postUrl) || postUrl;
    const apiKey = process.env.GOOGLE_API_KEY;

    // 1. If Google API Key is provided, try official YouTube Data API v3
    if (apiKey && videoId) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`,
          { signal: AbortSignal.timeout(6000) }
        );
        const data = await res.json();
        const item = data.items?.[0];
        if (item) {
          return {
            platform: Platform.YOUTUBE,
            platform_post_id: videoId,
            post_url: postUrl,
            author_platform_user_id: item.snippet?.channelId,
            author_username: item.snippet?.channelTitle,
            current_views: parseInt(item.statistics?.viewCount || "0", 10),
            likes: parseInt(item.statistics?.likeCount || "0", 10),
            comments: parseInt(item.statistics?.commentCount || "0", 10),
            is_available: true,
            is_private: false,
          };
        }
      } catch {}
    }

    // 2. Fetch public metrics from YouTube page HTML
    const publicMetrics = await this.fetchPublicMetrics(videoId);
    return {
      platform: Platform.YOUTUBE,
      platform_post_id: videoId,
      post_url: postUrl,
      author_username: publicMetrics.author,
      current_views: publicMetrics.views,
      likes: publicMetrics.likes,
      comments: publicMetrics.comments,
      is_available: true,
      is_private: false,
    };
  }

  async getVideoViews(platformPostId: string): Promise<number> {
    const metrics = await this.getVideoMetrics(platformPostId);
    return metrics.views;
  }

  async getVideoMetrics(platformPostId: string): Promise<{ views: number; likes: number; comments: number }> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${platformPostId}&key=${apiKey}`,
          { signal: AbortSignal.timeout(6000) }
        );
        const data = await res.json();
        const stats = data.items?.[0]?.statistics;
        if (stats) {
          return {
            views: parseInt(stats.viewCount || "0", 10),
            likes: parseInt(stats.likeCount || "0", 10),
            comments: parseInt(stats.commentCount || "0", 10),
          };
        }
      } catch {}
    }

    const publicMetrics = await this.fetchPublicMetrics(platformPostId);
    return {
      views: publicMetrics.views,
      likes: publicMetrics.likes,
      comments: publicMetrics.comments,
    };
  }

  private async fetchPublicMetrics(videoId: string): Promise<{ views: number; likes: number; comments: number; author?: string }> {
    let views = 0;
    let likes = 0;
    let comments = 0;
    let author: string | undefined = undefined;

    try {
      const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(7000),
      });
      if (res.ok) {
        const html = await res.text();
        const vMatch = html.match(/itemprop="interactionCount"\s+content="(\d+)"/i) ||
                       html.match(/"viewCount":\s*"(\d+)"/i) ||
                       html.match(/"viewCount":"(\d+)"/i);
        if (vMatch) views = parseInt(vMatch[1], 10);

        const lMatch = html.match(/"likeCount":\s*"(\d+)"/i) ||
                       html.match(/"label":"([0-9,]+)\s*likes"/i);
        if (lMatch) likes = parseInt(lMatch[1].replace(/,/g, ""), 10);

        const aMatch = html.match(/<link\s+itemprop="name"\s+content="([^"]+)"/i) ||
                       html.match(/"ownerChannelName":"([^"]+)"/i);
        if (aMatch) author = aMatch[1];
      }
    } catch {}

    if (!author) {
      try {
        const oRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (oRes.ok) {
          const oData = await oRes.json();
          if (oData.author_name) author = oData.author_name;
        }
      } catch {}
    }

    return { views, likes, comments, author };
  }
}
