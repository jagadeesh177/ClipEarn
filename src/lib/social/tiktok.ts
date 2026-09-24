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

export class TikTokProvider implements SocialProvider {
  public platform = Platform.TIKTOK;

  parsePostId(postUrl: string): string | null {
    try {
      const url = new URL(postUrl.trim());
      const match = url.pathname.match(/video\/(\d+)/);
      return match ? match[1] : url.pathname.split("/").pop() || null;
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

  private async resolveCanonicalUrl(postUrl: string): Promise<string> {
    try {
      if (
        postUrl.includes("vm.tiktok.com") ||
        postUrl.includes("vt.tiktok.com") ||
        postUrl.includes("/t/") ||
        postUrl.includes("/v/") ||
        !postUrl.includes("@")
      ) {
        const res = await fetch(postUrl, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(6000),
        });
        if (res.url && res.url !== postUrl) {
          return res.url;
        }
      }
    } catch {}
    return postUrl;
  }

  async verifyOwnership(
    videoIdOrUrl: string,
    account: { platform_user_id: string; username: string; access_token?: string | null }
  ): Promise<OwnershipVerificationResult> {
    const resolvedUrl = await this.resolveCanonicalUrl(videoIdOrUrl);
    const postId = this.parsePostId(resolvedUrl) || this.parsePostId(videoIdOrUrl) || videoIdOrUrl;

    // 1. If OAuth token exists, verify via TikTok Video Query API v2
    if (account.access_token && !account.access_token.startsWith("mock_")) {
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

    let views: number | null = null;
    let likes: number | null = null;
    let comments: number | null = null;
    let shares: number | null = null;

    // 1. If access token available, query official TikTok Video Query API
    if (account?.access_token && !account.access_token.startsWith("mock_")) {
      try {
        const res = await fetch(
          "https://open.tiktokapis.com/v2/video/query/?fields=id,title,view_count,like_count,comment_count,share_count",
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
        const video = data?.data?.videos?.[0];
        if (video) {
          return {
            views: video.view_count ?? null,
            likes: video.like_count ?? null,
            comments: video.comment_count ?? null,
            shares: video.share_count ?? null,
            saves: null, // TikTok API v2 does not expose saves/bookmarks count
            fetchedAt: new Date(),
            platform: Platform.TIKTOK,
            platformVideoId: postId,
            isAvailable: true,
            isPrivate: false,
            authorUsername: account.username,
          };
        }
      } catch {}
    }

    // When no access token or video query failed
    const oembedData = await this.fetchOembedMetadata(resolvedUrl || videoIdOrUrl);
    return {
      views: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null, // Unsupported on TikTok
      fetchedAt: new Date(),
      platform: Platform.TIKTOK,
      platformVideoId: postId,
      isAvailable: false,
      isPrivate: false,
      authorUsername: oembedData.authorUsername,
      authorDisplayName: oembedData.authorDisplayName,
      errorCode: "TIKTOK_OAUTH_REQUIRED",
      errorMessage: "TikTok account must be connected with OAuth to query video metrics through the official Video Query API.",
    };
  }

  async getVideo(postUrl: string): Promise<VideoMetadata> {
    const resolvedUrl = await this.resolveCanonicalUrl(postUrl);
    const postId = this.parsePostId(resolvedUrl) || this.parsePostId(postUrl) || postUrl;
    const norm = await this.getNormalizedMetrics(resolvedUrl || postUrl);

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
    throw new Error(metrics.errorMessage || "Unable to fetch TikTok video views via official Video Query API.");
  }

  async getVideoMetrics(platformPostId: string): Promise<VideoMetrics> {
    const norm = await this.getNormalizedMetrics(platformPostId);
    return {
      views: norm.views ?? 0,
      likes: norm.likes,
      comments: norm.comments,
      shares: norm.shares,
      saves: null,
    };
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
