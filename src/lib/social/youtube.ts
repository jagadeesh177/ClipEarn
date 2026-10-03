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
import { BROWSER_USER_AGENT, fetchJson, fetchText, getEnv, isPlaceholder, toCount } from "./http";

export class YouTubeProvider implements SocialProvider {
  public platform = Platform.YOUTUBE;

  parsePostId(postUrl: string): string | null {
    const raw = postUrl.trim();
    // Already a bare 11-character video ID
    if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
    try {
      const url = new URL(raw);
      if (url.hostname.toLowerCase().includes("youtu.be")) {
        return url.pathname.split("/").filter(Boolean)[0] || null;
      }
      const v = url.searchParams.get("v");
      if (v) return v;
      // /shorts/ID, /live/ID, /embed/ID, /v/ID
      const m = url.pathname.match(/\/(?:shorts|live|embed|v)\/([A-Za-z0-9_-]{6,})/);
      return m ? m[1] : null;
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
    const info = await this.fetchVideoInfo(videoId, account.access_token);

    const channelId = info.channelId;
    const channelTitle = info.channelTitle;
    const customHandle = info.handle;

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

    // If channel info could not be determined at all (e.g. quota limits / network)
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
    const base = {
      shares: null,
      saves: null,
      fetchedAt: new Date(),
      platform: Platform.YOUTUBE,
      platformVideoId: videoId,
      platformUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };

    const info = await this.fetchVideoInfo(videoId, account?.access_token);

    if (info.notFound) {
      return {
        ...base,
        views: null,
        likes: null,
        comments: null,
        isAvailable: false,
        isPrivate: false,
        error: "Video not found or removed from YouTube",
      };
    }

    if (info.views == null) {
      return {
        ...base,
        views: null,
        likes: info.likes,
        comments: info.comments,
        isAvailable: true,
        isPrivate: info.isPrivate,
        authorUsername: info.handle,
        authorDisplayName: info.channelTitle,
        authorPlatformUserId: info.channelId,
        errorCode: info.isPrivate ? undefined : "YOUTUBE_FETCH_FAILED",
        errorMessage: info.isPrivate
          ? undefined
          : info.error || "Unable to read view count from YouTube. Configure YOUTUBE_API_KEY for reliable metrics.",
      };
    }

    return {
      ...base,
      views: info.views,
      likes: info.likes,
      comments: info.comments,
      isAvailable: true,
      isPrivate: info.isPrivate,
      authorUsername: info.handle,
      authorDisplayName: info.channelTitle,
      authorPlatformUserId: info.channelId,
      rawDetails: { source: info.source },
    };
  }

  async getVideo(
    postUrl: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<VideoMetadata> {
    const videoId = this.parsePostId(postUrl) || postUrl;
    const norm = await this.getNormalizedMetrics(videoId, account);

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
    throw new Error(metrics.errorMessage || metrics.error || "Unable to fetch YouTube video views.");
  }

  async getVideoMetrics(
    platformPostId: string,
    _postUrl?: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<VideoMetrics> {
    const norm = await this.getNormalizedMetrics(platformPostId, account);
    if (norm.views == null) {
      throw new Error(norm.errorMessage || norm.error || "Unable to fetch YouTube video views.");
    }
    return {
      views: norm.views,
      likes: norm.likes,
      comments: norm.comments,
      shares: null,
      saves: null,
    };
  }

  /**
   * Resolves video statistics + channel info.
   * 1. YouTube Data API v3 (API key preferred, else the clipper's OAuth token)
   * 2. Public watch page (ytInitialPlayerResponse.videoDetails) when the API is
   *    not configured, over quota, or errors out.
   * 3. oEmbed for the channel handle.
   */
  private async fetchVideoInfo(videoId: string, accessToken?: string | null): Promise<YouTubeVideoInfo> {
    const info: YouTubeVideoInfo = {
      views: null,
      likes: null,
      comments: null,
      isPrivate: false,
      notFound: false,
    };

    const apiKey = getEnv("YOUTUBE_API_KEY", "GOOGLE_API_KEY");
    const token = isPlaceholder(accessToken) ? undefined : accessToken!;

    if (apiKey || token) {
      try {
        const url =
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status&id=${encodeURIComponent(videoId)}` +
          (apiKey ? `&key=${encodeURIComponent(apiKey)}` : "");
        const { ok, data } = await fetchJson(url, {
          headers: !apiKey && token ? { Authorization: `Bearer ${token}` } : {},
          timeoutMs: 8000,
        });

        if (ok && data && Array.isArray(data.items)) {
          const item = data.items[0];
          if (!item) {
            info.notFound = true;
            return info;
          }
          info.source = "youtube_data_api";
          info.channelId = item.snippet?.channelId;
          info.channelTitle = item.snippet?.channelTitle;
          info.isPrivate = item.status?.privacyStatus === "private";
          info.views = toCount(item.statistics?.viewCount);
          info.likes = toCount(item.statistics?.likeCount);
          info.comments = toCount(item.statistics?.commentCount);

          if (info.channelId && apiKey) {
            try {
              const ch = await fetchJson(
                `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(info.channelId)}&key=${encodeURIComponent(apiKey)}`,
                { timeoutMs: 5000 }
              );
              const cUrl = ch.data?.items?.[0]?.snippet?.customUrl;
              if (cUrl) info.handle = String(cUrl).replace(/^@/, "");
            } catch {}
          }
        } else {
          info.error = data?.error?.message
            ? `YouTube Data API error: ${data.error.message}`
            : "YouTube Data API request failed";
        }
      } catch (err: any) {
        info.error = `YouTube Data API error: ${err?.message || "request failed"}`;
      }
    }

    // Public InnerTube player endpoint (keyless; used by youtube.com itself)
    if (info.views == null && !info.isPrivate) {
      try {
        const { ok, data } = await fetchJson("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": BROWSER_USER_AGENT },
          body: JSON.stringify({
            context: { client: { clientName: "WEB", clientVersion: "2.20240910.00.00", hl: "en", gl: "US" } },
            videoId,
          }),
          timeoutMs: 10000,
        });
        if (ok && data) {
          const details = data.videoDetails;
          const status = data.playabilityStatus?.status;
          if (details && details.videoId === videoId) {
            info.source = info.source || "youtube_innertube";
            info.views = toCount(details.viewCount);
            info.channelId = info.channelId || details.channelId;
            info.channelTitle = info.channelTitle || details.author;
            if (details.isPrivate === true) info.isPrivate = true;
            const ownerUrl: string | undefined = data.microformat?.playerMicroformatRenderer?.ownerProfileUrl;
            const handle = ownerUrl?.match(/\/@([^/?#]+)/)?.[1];
            if (handle && !info.handle) info.handle = decodeURIComponent(handle);
          } else if (status === "ERROR") {
            info.notFound = true;
            return info;
          } else if (status === "LOGIN_REQUIRED" && /private/i.test(data.playabilityStatus?.reason || "")) {
            info.isPrivate = true;
          }
        }
      } catch (err: any) {
        info.error = info.error || `YouTube InnerTube fetch failed: ${err?.message || "network error"}`;
      }
    }

    // Public watch page fallback (no API key / quota exceeded / API error)
    if (info.views == null && !info.isPrivate) {
      try {
        const page = await fetchText(
          `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=en&gl=US`,
          { headers: { Cookie: "CONSENT=YES+cb; SOCS=CAI" }, timeoutMs: 10000 }
        );
        if (page.ok) {
          const html = page.text;
          const playability = html.match(/"playabilityStatus":\{"status":"([A-Z_]+)"/)?.[1];
          const details = html.match(/"videoDetails":\{"videoId":"([^"]+)"([\s\S]*?)"isLiveContent"/);
          const detailsStr = details && details[1] === videoId ? details[2] : "";

          if (detailsStr) {
            info.source = info.source || "youtube_watch_page";
            info.views = toCount(detailsStr.match(/"viewCount":"(\d+)"/)?.[1]);
            info.channelId = info.channelId || detailsStr.match(/"channelId":"([^"]+)"/)?.[1];
            info.channelTitle =
              info.channelTitle || decodeJsonString(detailsStr.match(/"author":"((?:[^"\\]|\\.)*)"/)?.[1]);
            if (/"isPrivate":true/.test(detailsStr)) info.isPrivate = true;
          } else if (playability === "ERROR") {
            info.notFound = true;
            return info;
          } else if (playability === "LOGIN_REQUIRED" && /This video is private/i.test(html)) {
            info.isPrivate = true;
          }

          if (!info.handle) {
            const owner = html.match(/"ownerProfileUrl":"https?:\/\/www\.youtube\.com\/@([^"/?]+)"/)?.[1];
            if (owner) info.handle = decodeURIComponent(owner);
          }
        } else {
          info.error = info.error || `YouTube page returned HTTP ${page.status}`;
        }
      } catch (err: any) {
        info.error = info.error || `YouTube page fetch failed: ${err?.message || "network error"}`;
      }
    }

    if (!info.handle) {
      const oembedHandle = await this.fetchAuthorHandleFromOembed(videoId);
      if (oembedHandle) info.handle = oembedHandle;
    }

    return info;
  }

  private async fetchAuthorHandleFromOembed(videoId: string): Promise<string> {
    try {
      const target = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
      const { ok, data } = await fetchJson(`https://www.youtube.com/oembed?url=${target}&format=json`, {
        timeoutMs: 5000,
      });
      if (ok && data?.author_url) {
        const hMatch = String(data.author_url).match(/@([^/?#&]+)/);
        if (hMatch) return decodeURIComponent(hMatch[1]).replace(/^@/, "").trim();
        const cMatch = String(data.author_url).match(/\/(?:c|user)\/([^/?#&]+)/);
        if (cMatch) return cMatch[1].trim();
      }
    } catch {}
    return "";
  }
}

interface YouTubeVideoInfo {
  views: number | null;
  likes: number | null;
  comments: number | null;
  isPrivate: boolean;
  notFound: boolean;
  channelId?: string;
  channelTitle?: string;
  handle?: string;
  source?: string;
  error?: string;
}

function decodeJsonString(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw;
  }
}
