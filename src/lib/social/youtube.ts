import { Platform } from "@prisma/client";
import {
  SocialProvider,
  SocialAccountData,
  VerificationResult,
  VideoMetadata,
  VideoMetrics,
  NormalizedMetrics,
  OwnershipVerificationResult,
} from "./types";
import { verifySocialBio } from "./bio-verifier";
import { isAuthorMatch } from "./author-match";

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
    const customHandle = channel?.snippet?.customUrl?.replace(/^@/, "");

    return {
      platform: Platform.YOUTUBE,
      platform_user_id: channelId,
      username: customHandle || channelTitle,
      profile_url: customHandle ? `https://www.youtube.com/@${customHandle}` : `https://www.youtube.com/channel/${channelId}`,
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

  async verifyOwnership(
    videoIdOrUrl: string,
    account: { platform_user_id: string; username: string; access_token?: string | null }
  ): Promise<OwnershipVerificationResult> {
    const videoId = this.parsePostId(videoIdOrUrl) || videoIdOrUrl;
    const apiKey = process.env.GOOGLE_API_KEY;
    const token = account.access_token;

    let channelId: string | undefined = undefined;
    let channelTitle: string | undefined = undefined;
    let customHandle: string | undefined = undefined;

    // 1. Try YouTube Data API v3 if apiKey or access_token is available
    if (apiKey || token) {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const url = apiKey
          ? `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoId}&key=${apiKey}`
          : `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoId}`;

        const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
        const data = await res.json();
        const item = data.items?.[0];
        if (item) {
          channelId = item.snippet?.channelId;
          channelTitle = item.snippet?.channelTitle;

          // Fetch channel snippet to get customUrl / handle
          if (channelId && apiKey) {
            try {
              const chRes = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`,
                { signal: AbortSignal.timeout(4000) }
              );
              const chData = await chRes.json();
              const cUrl = chData.items?.[0]?.snippet?.customUrl;
              if (cUrl) {
                customHandle = cUrl.replace(/^@/, "");
              }
            } catch {}
          }
        }
      } catch {}
    }

    // 2. Fallback to oEmbed if handle or channelTitle was not retrieved
    if (!customHandle) {
      const oembedHandle = await this.fetchAuthorHandleFromOembed(videoId);
      if (oembedHandle) {
        customHandle = oembedHandle;
      }
    }

    // 3. Match against account
    // Direct Channel ID match
    if (channelId && account.platform_user_id && channelId === account.platform_user_id) {
      return {
        isOwned: true,
        ownerPlatformUserId: channelId,
        ownerUsername: customHandle,
        ownerDisplayName: channelTitle,
      };
    }

    // Handle or Channel Title match
    if (customHandle || channelTitle) {
      const matches = isAuthorMatch(customHandle || "", account.username, channelTitle);
      if (matches) {
        return {
          isOwned: true,
          ownerPlatformUserId: channelId,
          ownerUsername: customHandle,
          ownerDisplayName: channelTitle,
        };
      }
      return {
        isOwned: false,
        ownerPlatformUserId: channelId,
        ownerUsername: customHandle,
        ownerDisplayName: channelTitle,
        reason: `This YouTube video was published by ${customHandle ? "@" + customHandle : channelTitle || "another channel"}, which does not match your verified YouTube account (@${account.username}).`,
      };
    }

    // If channel info could not be determined at all (e.g. quota limits)
    return {
      isOwned: true,
      ownerPlatformUserId: channelId,
      ownerUsername: customHandle,
    };
  }

  async getNormalizedMetrics(
    videoIdOrUrl: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<NormalizedMetrics> {
    const videoId = this.parsePostId(videoIdOrUrl) || videoIdOrUrl;
    const apiKey = process.env.GOOGLE_API_KEY;
    const token = account?.access_token;

    let views: number | null = null;
    let likes: number | null = null;
    let comments: number | null = null;
    let isPrivate = false;
    let authorDisplayName: string | undefined = undefined;
    let authorPlatformUserId: string | undefined = undefined;

    if (apiKey || token) {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const url = apiKey
          ? `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status&id=${videoId}&key=${apiKey}`
          : `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status&id=${videoId}`;

        const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
        const data = await res.json();

        if (data.items && data.items.length === 0) {
          return {
            views: null,
            likes: null,
            comments: null,
            shares: null,
            saves: null,
            fetchedAt: new Date(),
            platform: Platform.YOUTUBE,
            platformVideoId: videoId,
            isAvailable: false,
            isPrivate: false,
            error: "Video not found or removed from YouTube",
          };
        }

        const item = data.items?.[0];
        if (item) {
          authorPlatformUserId = item.snippet?.channelId;
          authorDisplayName = item.snippet?.channelTitle;
          isPrivate = item.status?.privacyStatus === "private";

          if (item.statistics?.viewCount != null) {
            views = parseInt(item.statistics.viewCount, 10);
          }
          if (item.statistics?.likeCount != null) {
            likes = parseInt(item.statistics.likeCount, 10);
          }
          if (item.statistics?.commentCount != null) {
            comments = parseInt(item.statistics.commentCount, 10);
          }

          // YouTube Data API v3 does not expose shares or saves
          const oembedHandle = await this.fetchAuthorHandleFromOembed(videoId);

          return {
            views,
            likes,
            comments,
            shares: null,
            saves: null,
            fetchedAt: new Date(),
            platform: Platform.YOUTUBE,
            platformVideoId: videoId,
            isAvailable: true,
            isPrivate,
            authorPlatformUserId,
            authorDisplayName,
            authorUsername: oembedHandle || undefined,
          };
        }
      } catch (err: any) {
        return {
          views: null,
          likes: null,
          comments: null,
          shares: null,
          saves: null,
          fetchedAt: new Date(),
          platform: Platform.YOUTUBE,
          platformVideoId: videoId,
          isAvailable: false,
          isPrivate: false,
          errorCode: "YOUTUBE_API_ERROR",
          errorMessage: err?.message || "Error calling YouTube Data API",
        };
      }
    }

    // When API key or OAuth token is not configured
    const oembedHandle = await this.fetchAuthorHandleFromOembed(videoId);
    return {
      views: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      fetchedAt: new Date(),
      platform: Platform.YOUTUBE,
      platformVideoId: videoId,
      isAvailable: false,
      isPrivate: false,
      authorUsername: oembedHandle || undefined,
      errorCode: "YOUTUBE_API_KEY_REQUIRED",
      errorMessage: "YouTube Data API v3 key (GOOGLE_API_KEY or YOUTUBE_API_KEY) is required to fetch official metrics.",
    };
  }

  async getVideo(postUrl: string): Promise<VideoMetadata> {
    const videoId = this.parsePostId(postUrl) || postUrl;
    const norm = await this.getNormalizedMetrics(videoId);

    return {
      platform: Platform.YOUTUBE,
      platform_post_id: videoId,
      post_url: postUrl,
      author_username: norm.authorUsername,
      author_display_name: norm.authorDisplayName,
      author_platform_user_id: norm.authorPlatformUserId,
      current_views: norm.views ?? 0,
      likes: norm.likes,
      comments: norm.comments,
      shares: null,
      saves: null,
      is_available: norm.isAvailable,
      is_private: norm.isPrivate,
    };
  }

  async getVideoViews(platformPostId: string): Promise<number> {
    const metrics = await this.getNormalizedMetrics(platformPostId);
    if (metrics.views != null) {
      return metrics.views;
    }
    throw new Error(metrics.errorMessage || "Unable to fetch YouTube video views via official Data API v3.");
  }

  async getVideoMetrics(platformPostId: string): Promise<VideoMetrics> {
    const norm = await this.getNormalizedMetrics(platformPostId);
    return {
      views: norm.views ?? 0,
      likes: norm.likes,
      comments: norm.comments,
      shares: null,
      saves: null,
    };
  }

  private async fetchAuthorHandleFromOembed(videoId: string): Promise<string> {
    try {
      const oRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (oRes.ok) {
        const oData = await oRes.json();
        if (oData.author_url) {
          const hMatch = oData.author_url.match(/@([^/?#&]+)/);
          if (hMatch) return hMatch[1].replace(/^@/, "").trim();
          const cMatch = oData.author_url.match(/\/(?:c|user)\/([^/?#&]+)/);
          if (cMatch) return cMatch[1].trim();
        }
      }
    } catch {}
    return "";
  }
}
