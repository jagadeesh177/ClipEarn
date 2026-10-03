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
import { BROWSER_HEADERS, fetchJson, fetchText, isPlaceholder, toCount } from "./http";

export class TikTokProvider implements SocialProvider {
  public platform = Platform.TIKTOK;

  parsePostId(postUrl: string): string | null {
    const raw = postUrl.trim();
    if (/^\d{8,}$/.test(raw)) return raw;
    try {
      const url = new URL(raw);
      const m = url.pathname.match(/\/(?:video|photo|v)\/(\d+)/);
      if (m) return m[1];
      const itemId = url.searchParams.get("item_id") || url.searchParams.get("share_item_id");
      if (itemId && /^\d+$/.test(itemId)) return itemId;
      // Short links (vm.tiktok.com/XXXX, tiktok.com/t/XXXX) must be resolved first via resolveUrl()
      return null;
    } catch {
      return null;
    }
  }

  async connect(code: string): Promise<SocialAccountData> {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret || clientKey === "your_tiktok_client_key") {
      const mockId = `tt_${Date.now()}`;
      return {
        platform: Platform.TIKTOK,
        platform_user_id: mockId,
        username: `tiktok_${mockId.slice(-6)}`,
        profile_url: `https://www.tiktok.com/@tiktok_${mockId.slice(-6)}`,
        access_token: `mock_tt_token_${code}`,
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      };
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
      const mockId = `tt_${Date.now()}`;
      return {
        platform: Platform.TIKTOK,
        platform_user_id: mockId,
        username: `tiktok_${mockId.slice(-6)}`,
        profile_url: `https://www.tiktok.com/@tiktok_${mockId.slice(-6)}`,
        access_token: `mock_tt_token_${code}`,
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      };
    }
  }

  async verifyAccount(username: string, verificationCode: string): Promise<VerificationResult> {
    return verifySocialBio(Platform.TIKTOK, username, verificationCode);
  }

  async getProfile(platformUserId: string) {
    return {
      username: `tiktok_${platformUserId.slice(0, 8)}`,
      profile_url: `https://www.tiktok.com/@${platformUserId}`,
      bio: "",
    };
  }

  /** Public alias used by the submission flow to expand short links before parsing the video ID. */
  async resolveUrl(postUrl: string): Promise<string> {
    return this.resolveCanonicalUrl(postUrl);
  }

  private async resolveCanonicalUrl(postUrl: string): Promise<string> {
    const raw = postUrl.trim();
    if (!/^https?:\/\//i.test(raw)) return raw;
    // Already canonical: tiktok.com/@user/video/123
    if (/tiktok\.com\/@[^/]+\/(?:video|photo)\/\d+/.test(raw)) return raw;
    try {
      const res = await fetch(raw, {
        method: "GET",
        redirect: "follow",
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(8000),
      });
      // Region-blocked servers get redirected to /xx/about; keep the original URL in that case
      if (res.url && res.url !== raw && !/tiktok\.com\/[a-z]{2}\/about/i.test(res.url)) {
        return res.url;
      }
    } catch {}
    return raw;
  }

  async verifyOwnership(
    videoIdOrUrl: string,
    account: { platform_user_id: string; username: string; access_token?: string | null }
  ): Promise<OwnershipVerificationResult> {
    const resolvedUrl = await this.resolveCanonicalUrl(videoIdOrUrl);
    const postId = this.parsePostId(resolvedUrl) || this.parsePostId(videoIdOrUrl) || videoIdOrUrl;

    // 1. If OAuth token exists, verify via TikTok Video Query API v2
    if (account.access_token && !isPlaceholder(account.access_token)) {
      try {
        const res = await fetch(
          "https://open.tiktokapis.com/v2/video/query/?fields=id,title",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${account.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filters: {
                video_ids: [postId],
              },
            }),
            signal: AbortSignal.timeout(6000),
          }
        );
        const data = await res.json();
        if (res.ok && data?.data?.videos && data.data.videos.length > 0) {
          return {
            isOwned: true,
            ownerPlatformUserId: account.platform_user_id,
            ownerUsername: account.username,
          };
        }
      } catch {}
    }

    // 2. Extract author handle from resolved URL (e.g. tiktok.com/@username/video/12345)
    let urlHandle: string | undefined = undefined;
    for (const u of [resolvedUrl, videoIdOrUrl]) {
      try {
        const parsed = new URL(u.trim());
        const m = parsed.pathname.match(/@([^/?#&]+)/);
        if (m) {
          const raw = m[1].replace(/^@/, "").trim();
          if (raw && !/\s/.test(raw)) {
            urlHandle = raw;
            break;
          }
        }
      } catch {}
    }

    // 3. Fallback: try official TikTok oEmbed to obtain author_unique_id
    if (!urlHandle) {
      try {
        const oRes = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl || videoIdOrUrl)}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (oRes.ok) {
          const oData = await oRes.json();
          if (oData.author_unique_id) {
            urlHandle = oData.author_unique_id.replace(/^@/, "").trim();
          }
        }
      } catch {}
    }

    // 4. Compare handle with verified account
    if (urlHandle) {
      const match = isAuthorMatch(urlHandle, account.username);
      if (match) {
        return {
          isOwned: true,
          ownerPlatformUserId: account.platform_user_id,
          ownerUsername: urlHandle,
        };
      }
      return {
        isOwned: false,
        ownerUsername: urlHandle,
        reason: `This TikTok clip was published by @${urlHandle}, which does not match your verified TikTok account (@${account.username}).`,
      };
    }

    // If handle cannot be determined from URL or oembed
    return {
      isOwned: true,
      ownerUsername: account.username,
    };
  }

  async getNormalizedMetrics(
    videoIdOrUrl: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<NormalizedMetrics> {
    const resolvedUrl = await this.resolveCanonicalUrl(videoIdOrUrl);
    const postId = this.parsePostId(resolvedUrl) || this.parsePostId(videoIdOrUrl) || videoIdOrUrl;
    const base = {
      saves: null as number | null,
      fetchedAt: new Date(),
      platform: Platform.TIKTOK,
      platformVideoId: postId,
    };
    let apiError: string | undefined;

    // 1. Official TikTok Video Query API (requires the clipper's OAuth token with video.list scope)
    if (account?.access_token && !isPlaceholder(account.access_token) && /^\d+$/.test(postId)) {
      try {
        const { ok, data } = await fetchJson(
          "https://open.tiktokapis.com/v2/video/query/?fields=id,title,view_count,like_count,comment_count,share_count",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${account.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ filters: { video_ids: [postId] } }),
            timeoutMs: 8000,
          }
        );
        const errCode = data?.error?.code;
        const video = data?.data?.videos?.[0];
        if (ok && (!errCode || errCode === "ok") && video) {
          return {
            ...base,
            views: toCount(video.view_count),
            likes: toCount(video.like_count),
            comments: toCount(video.comment_count),
            shares: toCount(video.share_count),
            isAvailable: true,
            isPrivate: false,
            authorUsername: account.username,
            rawDetails: { source: "tiktok_video_query_api" },
          };
        }
        apiError = errCode && errCode !== "ok" ? `TikTok API error: ${data?.error?.message || errCode}` : undefined;
      } catch (err: any) {
        apiError = `TikTok API error: ${err?.message || "request failed"}`;
      }
    }

    // 2. Public video page (embedded __UNIVERSAL_DATA_FOR_REHYDRATION__ JSON)
    const scraped = await this.fetchPublicVideoStats(resolvedUrl, postId);
    if (scraped.notFound) {
      return {
        ...base,
        views: null,
        likes: null,
        comments: null,
        shares: null,
        isAvailable: false,
        isPrivate: false,
        error: "Video not found or removed from TikTok",
      };
    }
    if (scraped.isPrivate) {
      return {
        ...base,
        views: null,
        likes: null,
        comments: null,
        shares: null,
        isAvailable: true,
        isPrivate: true,
        authorUsername: scraped.authorUsername,
      };
    }
    if (scraped.views != null) {
      return {
        ...base,
        views: scraped.views,
        likes: scraped.likes,
        comments: scraped.comments,
        shares: scraped.shares,
        saves: scraped.saves,
        isAvailable: true,
        isPrivate: false,
        authorUsername: scraped.authorUsername,
        authorDisplayName: scraped.authorDisplayName,
        authorPlatformUserId: scraped.authorId,
        rawDetails: { source: "tiktok_public_page" },
      };
    }

    // 3. Nothing worked — report a retryable failure (do NOT mark the clip as removed)
    const oembedData = await this.fetchOembedMetadata(resolvedUrl || videoIdOrUrl);
    return {
      ...base,
      views: null,
      likes: null,
      comments: null,
      shares: null,
      isAvailable: true,
      isPrivate: false,
      authorUsername: oembedData.authorUsername,
      authorDisplayName: oembedData.authorDisplayName,
      errorCode: "TIKTOK_FETCH_FAILED",
      errorMessage:
        apiError ||
        scraped.error ||
        "Unable to read TikTok view count. Connect the TikTok account via OAuth for official metrics.",
    };
  }

  async getVideo(
    postUrl: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<VideoMetadata> {
    const resolvedUrl = await this.resolveCanonicalUrl(postUrl);
    const postId = this.parsePostId(resolvedUrl) || this.parsePostId(postUrl) || postUrl;
    const norm = await this.getNormalizedMetrics(resolvedUrl || postUrl, account);

    return {
      platform: Platform.TIKTOK,
      platform_post_id: postId,
      post_url: resolvedUrl || postUrl,
      author_username: norm.authorUsername,
      author_display_name: norm.authorDisplayName,
      current_views: norm.views ?? 0,
      likes: norm.likes,
      comments: norm.comments,
      shares: norm.shares,
      saves: norm.saves,
      is_available: norm.isAvailable,
      is_private: norm.isPrivate,
    };
  }

  async getVideoViews(platformPostId: string): Promise<number> {
    const metrics = await this.getNormalizedMetrics(platformPostId);
    if (metrics.views != null) {
      return metrics.views;
    }
    throw new Error(metrics.errorMessage || metrics.error || "Unable to fetch TikTok video views.");
  }

  async getVideoMetrics(
    platformPostId: string,
    postUrl?: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<VideoMetrics> {
    const norm = await this.getNormalizedMetrics(postUrl || platformPostId, account);
    if (norm.views == null) {
      throw new Error(norm.errorMessage || norm.error || "Unable to fetch TikTok video views.");
    }
    return {
      views: norm.views,
      likes: norm.likes,
      comments: norm.comments,
      shares: norm.shares,
      saves: norm.saves,
    };
  }

  /**
   * Reads public stats from the TikTok video web page. TikTok embeds the item
   * in a JSON script tag (__UNIVERSAL_DATA_FOR_REHYDRATION__, older pages: SIGI_STATE).
   */
  private async fetchPublicVideoStats(
    resolvedUrl: string,
    postId: string
  ): Promise<{
    views: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    saves: number | null;
    notFound?: boolean;
    isPrivate?: boolean;
    authorUsername?: string;
    authorDisplayName?: string;
    authorId?: string;
    error?: string;
  }> {
    const empty = { views: null, likes: null, comments: null, shares: null, saves: null };
    if (!/^\d+$/.test(postId)) {
      return { ...empty, error: "Could not resolve a numeric TikTok video ID from the URL." };
    }

    // The username segment is not validated by TikTok, so a bare ID still resolves.
    const pageUrl = /tiktok\.com\/@[^/]+\/(?:video|photo)\/\d+/.test(resolvedUrl)
      ? resolvedUrl.split("?")[0]
      : `https://www.tiktok.com/@_/video/${postId}`;

    try {
      const page = await fetchText(pageUrl, { timeoutMs: 12000 });
      if (/tiktok\.com\/[a-z]{2}\/about/i.test(page.url)) {
        return { ...empty, error: "TikTok is not available in this server's region (redirected to /about)." };
      }
      if (!page.ok) {
        return { ...empty, error: `TikTok page returned HTTP ${page.status}` };
      }
      const html = page.text;

      const universal = html.match(
        /<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
      )?.[1];
      if (universal) {
        try {
          const json = JSON.parse(universal);
          const detail = json?.__DEFAULT_SCOPE__?.["webapp.video-detail"];
          const statusCode = detail?.statusCode;
          // 10204 = item not found / removed, 10216/10222 = private
          if (statusCode === 10204) return { ...empty, notFound: true };
          if (statusCode === 10216 || statusCode === 10222) return { ...empty, isPrivate: true };
          const item = detail?.itemInfo?.itemStruct;
          if (item) {
            const stats = item.statsV2 || item.stats || {};
            const fallback = item.stats || {};
            return {
              views: toCount(stats.playCount ?? fallback.playCount),
              likes: toCount(stats.diggCount ?? fallback.diggCount),
              comments: toCount(stats.commentCount ?? fallback.commentCount),
              shares: toCount(stats.shareCount ?? fallback.shareCount),
              saves: toCount(stats.collectCount ?? fallback.collectCount),
              authorUsername: item.author?.uniqueId,
              authorDisplayName: item.author?.nickname,
              authorId: item.author?.id,
            };
          }
        } catch {}
      }

      // Regex fallback (SIGI_STATE or changed page layout)
      const playCount = html.match(/"playCount":"?(\d+)"?/)?.[1];
      if (playCount) {
        return {
          views: toCount(playCount),
          likes: toCount(html.match(/"diggCount":"?(\d+)"?/)?.[1]),
          comments: toCount(html.match(/"commentCount":"?(\d+)"?/)?.[1]),
          shares: toCount(html.match(/"shareCount":"?(\d+)"?/)?.[1]),
          saves: toCount(html.match(/"collectCount":"?(\d+)"?/)?.[1]),
          authorUsername: html.match(/"uniqueId":"([^"]+)"/)?.[1],
        };
      }
      return { ...empty, error: "TikTok page did not contain video stats (possibly bot-challenged)." };
    } catch (err: any) {
      return { ...empty, error: `TikTok page fetch failed: ${err?.message || "network error"}` };
    }
  }

  private async fetchOembedMetadata(
    postUrl: string
  ): Promise<{ authorUsername?: string; authorDisplayName?: string; title?: string }> {
    try {
      const oRes = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(postUrl)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (oRes.ok) {
        const oData = await oRes.json();
        return {
          authorUsername: oData.author_unique_id ? String(oData.author_unique_id).replace(/^@/, "").trim() : undefined,
          authorDisplayName: oData.author_name ? String(oData.author_name).trim() : undefined,
          title: oData.title ? String(oData.title).trim() : undefined,
        };
      }
    } catch {}

    // Fallback: extract handle from URL if present
    try {
      const parsed = new URL(postUrl.trim());
      const m = parsed.pathname.match(/@([^/?#&]+)/);
      if (m) {
        return { authorUsername: m[1].replace(/^@/, "").trim() };
      }
    } catch {}

    return {};
  }
}
