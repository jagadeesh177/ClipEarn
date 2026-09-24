import { Platform } from "@prisma/client";
import { SocialProvider, SocialAccountData, VerificationResult, VideoMetadata } from "./types";
import { verifySocialBio } from "./bio-verifier";

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

  async getVideo(postUrl: string): Promise<VideoMetadata> {
    const resolvedUrl = await this.resolveCanonicalUrl(postUrl);
    const postId = this.parsePostId(resolvedUrl) || this.parsePostId(postUrl) || postUrl;
    let authorUsername: string | undefined = undefined;

    // 1. Try extracting handle from resolved or post URL: https://www.tiktok.com/@username/video/12345
    for (const u of [resolvedUrl, postUrl]) {
      try {
        const parsed = new URL(u.trim());
        const m = parsed.pathname.match(/@([^/?#&]+)/);
        if (m) {
          const raw = m[1].replace(/^@/, "").trim();
          if (raw && !/\s/.test(raw)) {
            authorUsername = raw;
            break;
          }
        }
      } catch {}
    }

    let views = 0;
    let likes = 0;
    let comments = 0;
    let authorDisplayName: string | undefined = undefined;

    try {
      const targetFetchUrl = resolvedUrl !== postUrl ? resolvedUrl : postUrl;
      const metrics = await this.fetchPublicMetrics(targetFetchUrl);
      if (metrics) {
        views = metrics.views;
        likes = metrics.likes;
        comments = metrics.comments;
        if (metrics.author && !/\s/.test(metrics.author)) {
          authorUsername = metrics.author;
        }
        if (metrics.displayName) {
          authorDisplayName = metrics.displayName;
        }
      }
    } catch {}

    // Ensure authorUsername is clean and strictly a handle (no spaces)
    if (authorUsername && (/\s/.test(authorUsername) || !/^[a-zA-Z0-9_.-]+$/.test(authorUsername))) {
      if (!authorDisplayName) authorDisplayName = authorUsername;
      authorUsername = undefined;
    }

    return {
      platform: Platform.TIKTOK,
      platform_post_id: postId,
      post_url: resolvedUrl || postUrl,
      author_username: authorUsername,
      author_display_name: authorDisplayName,
      current_views: views,
      likes,
      comments,
      is_available: true,
      is_private: false,
    };
  }

  async getVideoViews(platformPostId: string): Promise<number> {
    const metrics = await this.getVideoMetrics(platformPostId);
    return metrics.views;
  }

  async getVideoMetrics(platformPostId: string, postUrl?: string): Promise<{ views: number; likes: number; comments: number }> {
    if (postUrl) {
      try {
        const metrics = await this.fetchPublicMetrics(postUrl);
        if (metrics) {
          return { views: metrics.views, likes: metrics.likes, comments: metrics.comments };
        }
      } catch {}
    }
    return { views: 0, likes: 0, comments: 0 };
  }

  private async fetchPublicMetrics(
    postUrl: string
  ): Promise<{ views: number; likes: number; comments: number; author?: string; displayName?: string } | null> {
    try {
      const res = await fetch(postUrl, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) return null;
      const html = await res.text();

      let views = 0;
      let likes = 0;
      let comments = 0;
      let author: string | undefined = undefined;
      let displayName: string | undefined = undefined;

      // Extract handle from final redirected URL: https://www.tiktok.com/@username/video/12345
      const urlsToCheck = [res.url, postUrl].filter(Boolean);
      for (const u of urlsToCheck) {
        try {
          const parsed = new URL(u);
          const m = parsed.pathname.match(/@([^/?#&]+)/);
          if (m) {
            const raw = m[1].replace(/^@/, "").trim();
            if (raw && !/\s/.test(raw)) {
              author = raw;
              break;
            }
          }
        } catch {}
      }

      // 1. Try JSON-LD schema
      const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
      if (jsonLdMatch) {
        try {
          const ld = JSON.parse(jsonLdMatch[1]);
          if (ld.interactionStatistic) {
            const stats = Array.isArray(ld.interactionStatistic) ? ld.interactionStatistic : [ld.interactionStatistic];
            for (const stat of stats) {
              const count = parseInt(stat.userInteractionCount || "0", 10);
              const type = stat.interactionType?.["@type"] || "";
              if (type.includes("Watch") || type.includes("View")) views = count;
              if (type.includes("Like")) likes = count;
              if (type.includes("Comment")) comments = count;
            }
          }
          // Note: ld.author.url has the handle: https://www.tiktok.com/@brendanarcade
          if (ld.author?.url && !author) {
            const uMatch = String(ld.author.url).match(/@([^/?#&]+)/);
            if (uMatch) {
              const raw = uMatch[1].replace(/^@/, "").trim();
              if (raw && !/\s/.test(raw)) author = raw;
            }
          }
          // ld.author.name is display nickname
          if (ld.author?.name) {
            displayName = String(ld.author.name).trim();
          }
        } catch {}
      }

      // 2. Try universal data hydration script (__UNIVERSAL_DATA_FOR_REHYDRATION__)
      const hydrationMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/i);
      if (hydrationMatch) {
        try {
          const data = JSON.parse(hydrationMatch[1]);
          const itemInfo = data?.["__DEFAULT_SCOPE__"]?.["webapp.video-detail"]?.itemInfo?.itemStruct;
          if (itemInfo) {
            if (itemInfo.stats) {
              views = itemInfo.stats.playCount || views;
              likes = itemInfo.stats.diggCount || likes;
              comments = itemInfo.stats.commentCount || comments;
            }
            if (itemInfo.statsV2) {
              views = parseInt(itemInfo.statsV2.playCount || "0", 10) || views;
              likes = parseInt(itemInfo.statsV2.diggCount || "0", 10) || likes;
              comments = parseInt(itemInfo.statsV2.commentCount || "0", 10) || comments;
            }
            // itemInfo.author.uniqueId is the handle (e.g. brendanarcade)
            if (itemInfo.author?.uniqueId) {
              const raw = String(itemInfo.author.uniqueId).replace(/^@/, "").trim();
              if (raw && !/\s/.test(raw)) author = raw;
            }
            if (itemInfo.author?.nickname) {
              displayName = String(itemInfo.author.nickname).trim();
            }
          }
        } catch {}
      }

      // 3. SIGI_STATE or __NEXT_DATA__
      if (!author) {
        const uMatch =
          html.match(/"uniqueId":"([a-zA-Z0-9_.-]+)"/) ||
          html.match(/"authorUniqueId":"([a-zA-Z0-9_.-]+)"/) ||
          html.match(/property="og:url"\s+content="https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.-]+)/i) ||
          html.match(/content="https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.-]+)[^"]*"\s+property="og:url"/i) ||
          html.match(/<link[^>]*rel="canonical"[^>]*href="https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.-]+)/i) ||
          html.match(/property="al:ios:url"\s+content="[^"]*@([a-zA-Z0-9_.-]+)/i);
        if (uMatch) {
          author = uMatch[1].replace(/^@/, "").trim();
        }
      }

      // 4. Fallback regexes for stats on raw HTML
      if (!views) {
        const playMatch = html.match(/"playCount":\s*(\d+)/) || html.match(/"play_count":\s*(\d+)/);
        if (playMatch) views = parseInt(playMatch[1], 10);
      }
      if (!likes) {
        const diggMatch = html.match(/"diggCount":\s*(\d+)/) || html.match(/"digg_count":\s*(\d+)/);
        if (diggMatch) likes = parseInt(diggMatch[1], 10);
      }
      if (!comments) {
        const commMatch = html.match(/"commentCount":\s*(\d+)/) || html.match(/"comment_count":\s*(\d+)/);
        if (commMatch) comments = parseInt(commMatch[1], 10);
      }

      // Ensure author has no spaces (a handle cannot have spaces)
      if (author && /\s/.test(author)) {
        if (!displayName) displayName = author;
        author = undefined;
      }

      if (views > 0 || likes > 0 || comments > 0 || author || displayName) {
        return { views, likes, comments, author, displayName };
      }
      return null;
    } catch {
      return null;
    }
  }
}
