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
          };
        }
      } catch {}
    }

    // Fallback: public metrics via oEmbed / page
    const publicMetrics = await this.fetchPublicMetrics(videoId);
    return {
      views: publicMetrics.views,
      likes: publicMetrics.likes,
      comments: publicMetrics.comments,
      shares: null,
      saves: null,
      fetchedAt: new Date(),
      platform: Platform.YOUTUBE,
      platformVideoId: videoId,
      isAvailable: true,
      isPrivate: false,
      authorUsername: publicMetrics.author,
      authorDisplayName: publicMetrics.displayName,
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
          let authorHandle = "";
          // Fetch channel customUrl / handle if channelId exists
          if (item.snippet?.channelId) {
            try {
              const chRes = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${item.snippet.channelId}&key=${apiKey}`,
                { signal: AbortSignal.timeout(4000) }
              );
              const chData = await chRes.json();
              const customUrl = chData.items?.[0]?.snippet?.customUrl;
              if (customUrl) {
                authorHandle = customUrl.replace(/^@/, "");
              }
            } catch {}
          }

          // If no handle from API, try oEmbed author_url
          if (!authorHandle) {
            authorHandle = await this.fetchAuthorHandleFromOembed(videoId);
          }

          const channelTitle = item.snippet?.channelTitle;
          const cleanAuthorHandle = authorHandle && !/\s/.test(authorHandle) ? authorHandle : undefined;

          return {
            platform: Platform.YOUTUBE,
            platform_post_id: videoId,
            post_url: postUrl,
            author_platform_user_id: item.snippet?.channelId,
            author_username: cleanAuthorHandle,
            author_display_name: channelTitle,
            current_views: parseInt(item.statistics?.viewCount || "0", 10),
            likes: item.statistics?.likeCount != null ? parseInt(item.statistics.likeCount, 10) : null,
            comments: item.statistics?.commentCount != null ? parseInt(item.statistics.commentCount, 10) : null,
            shares: null,
            saves: null,
            is_available: true,
            is_private: false,
          };
        }
      } catch {}
    }

    // 2. Fetch public metrics & handle from YouTube oEmbed and HTML
    const publicMetrics = await this.fetchPublicMetrics(videoId);
    return {
      platform: Platform.YOUTUBE,
      platform_post_id: videoId,
      post_url: postUrl,
      author_username: publicMetrics.author,
      author_display_name: publicMetrics.displayName,
      current_views: publicMetrics.views,
      likes: publicMetrics.likes,
      comments: publicMetrics.comments,
      shares: null,
      saves: null,
      is_available: true,
      is_private: false,
    };
  }

  async getVideoViews(platformPostId: string): Promise<number> {
    const metrics = await this.getVideoMetrics(platformPostId);
    return metrics.views;
  }

  async getVideoMetrics(platformPostId: string): Promise<VideoMetrics> {
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
            likes: stats.likeCount != null ? parseInt(stats.likeCount, 10) : null,
            comments: stats.commentCount != null ? parseInt(stats.commentCount, 10) : null,
            shares: null,
            saves: null,
          };
        }
      } catch {}
    }

    const publicMetrics = await this.fetchPublicMetrics(platformPostId);
    return {
      views: publicMetrics.views,
      likes: publicMetrics.likes,
      comments: publicMetrics.comments,
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

  private async fetchPublicMetrics(videoId: string): Promise<{ views: number; likes: number; comments: number; author?: string; displayName?: string }> {
    let views = 0;
    let likes = 0;
    let comments = 0;
    let author: string | undefined = undefined;
    let channelTitle: string | undefined = undefined;

    // 1. Fetch oEmbed - gets author_url (which has the true handle: https://www.youtube.com/@brendanarcade)
    try {
      const oRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (oRes.ok) {
        const oData = await oRes.json();
        if (oData.author_url) {
          const hMatch = oData.author_url.match(/@([^/?#&]+)/);
          if (hMatch) {
            author = hMatch[1].replace(/^@/, "").trim();
          } else {
            const cMatch = oData.author_url.match(/\/(?:c|user)\/([^/?#&]+)/);
            if (cMatch) author = cMatch[1].trim();
          }
        }
        if (oData.author_name) {
          channelTitle = oData.author_name;
        }
      }
    } catch {}

    // 2. Fetch HTML page for views, likes, and fallback handle extraction
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

        // If author handle was not in oembed, find handle from HTML
        if (!author) {
          const handleMatch =
            html.match(/"canonicalChannelUrl":"https?:\/\/www\.youtube\.com\/@([^"/?#&]+)"/i) ||
            html.match(/"channelUrl":"https?:\/\/www\.youtube\.com\/@([^"/?#&]+)"/i) ||
            html.match(/"ownerProfileUrl":"https?:\/\/www\.youtube\.com\/@([^"/?#&]+)"/i) ||
            html.match(/href="https?:\/\/www\.youtube\.com\/@([^"/?#&]+)"/i) ||
            html.match(/"webCommandMetadata":{"url":"\/@([^"/?#&]+)"/i) ||
            html.match(/<link itemprop="url" href="https?:\/\/www\.youtube\.com\/@([^"/?#&]+)"/i);

          if (handleMatch) {
            author = handleMatch[1].replace(/^@/, "").trim();
          }
        }

        if (!channelTitle) {
          const aMatch = html.match(/<link\s+itemprop="name"\s+content="([^"]+)"/i) ||
                         html.match(/"ownerChannelName":"([^"]+)"/i);
          if (aMatch) channelTitle = aMatch[1];
        }
      }
    } catch {}

    // Ensure author does not contain spaces (a handle cannot have spaces)
    if (author && /\s/.test(author)) {
      if (!channelTitle) channelTitle = author;
      author = undefined;
    }

    return { views, likes, comments, author, displayName: channelTitle };
  }
}
