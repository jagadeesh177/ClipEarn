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
import { isAuthorMatch } from "./author-match";
import { fetchJson, isPlaceholder, toCount } from "./http";

/**
 * Normalizes bio text and matches the exact verification code.
 * Rules:
 * - Trims whitespace safely
 * - Normalizes line breaks (\r\n -> \n)
 * - Exact code matching (does not remove characters from code)
 * - Rejects partial/substring collisions (e.g. clipearn-552zhusv does NOT match clipearn-552zhusvg)
 */
export function verifyCodeInBiography(
  biography: string | undefined | null,
  code: string
): boolean {
  if (!biography || !code) return false;

  const targetCode = code.trim().toLowerCase();
  if (targetCode.length < 6) return false;

  // Normalize line breaks and casing
  const normalizedBio = biography
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .toLowerCase();

  if (normalizedBio.includes(targetCode)) {
    // Check all occurrences to see if any is a valid match
    let searchFrom = 0;
    while (searchFrom < normalizedBio.length) {
      const idx = normalizedBio.indexOf(targetCode, searchFrom);
      if (idx === -1) break;

      const before = idx > 0 ? normalizedBio[idx - 1] : "";
      const after =
        idx + targetCode.length < normalizedBio.length
          ? normalizedBio.slice(idx + targetCode.length)
          : "";

      // 'before' can be anything non-alphanumeric, or end of another clipearn code
      const validBefore =
        !before ||
        !/[a-zA-Z0-9]/.test(before) ||
        /clipearn-[a-z0-9]{5,8}$/.test(normalizedBio.slice(0, idx));

      // 'after' can be non-alphanumeric, end of string, or start of another clipearn code
      const validAfter =
        !after ||
        !/^[a-zA-Z0-9]/.test(after) ||
        after.startsWith("clipearn-");

      if (validBefore && validAfter) {
        return true;
      }

      searchFrom = idx + 1;
    }
  }

  return false;
}

export interface InstagramProfileData {
  id: string;
  user_id?: string;
  username: string;
  name?: string;
  biography?: string;
  profile_picture_url?: string;
}

export class InstagramProvider implements SocialProvider {
  public platform = Platform.INSTAGRAM;

  parsePostId(postUrl: string): string | null {
    try {
      const url = new URL(postUrl.trim());
      const match = url.pathname.match(/\/(?:reel|reels|p)\/([^/?#&]+)/);
      return match ? match[1] : url.pathname.split("/").filter(Boolean).pop() || null;
    } catch {
      return null;
    }
  }

  /**
   * Generates the official Instagram OAuth Authorization URL.
   * Uses Instagram Business Login / Instagram API with Instagram Login.
   * Minimum required scope: instagram_business_basic
   */
  getAuthorizationUrl(redirectUri: string, state: string): string {
    const appId =
      process.env.INSTAGRAM_APP_ID ||
      process.env.META_APP_ID ||
      "1716880756043945";

    const params = new URLSearchParams({
      enable_fb_login: "0",
      force_authentication: "1",
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: "code",
      // insights permission is required to read Reel view counts
      scope: "instagram_business_basic,instagram_business_manage_insights",
      state: state,
    });

    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchanges an OAuth authorization code for an Instagram access token.
   * First exchanges for short-lived token, then attempts long-lived exchange.
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<{
    access_token: string;
    user_id?: string;
    expires_in?: number;
  }> {
    const appId =
      process.env.INSTAGRAM_APP_ID ||
      process.env.META_APP_ID ||
      "1716880756043945";
    const appSecret =
      process.env.INSTAGRAM_APP_SECRET ||
      process.env.META_APP_SECRET ||
      "";

    if (!appSecret || appSecret.includes("your_")) {
      // In development fallback if credentials not configured
      return {
        access_token: `mock_ig_token_${code}`,
        user_id: `ig_user_${Date.now()}`,
        expires_in: 5184000, // 60 days
      };
    }

    // 1. Primary: Instagram Business Login token exchange (POST to api.instagram.com)
    try {
      const formData = new URLSearchParams();
      formData.append("client_id", appId);
      formData.append("client_secret", appSecret);
      formData.append("grant_type", "authorization_code");
      formData.append("redirect_uri", redirectUri);
      formData.append("code", code);

      const res = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const data = await res.json();
      if (res.ok && data.access_token) {
        let finalToken = data.access_token;
        let expiresIn = data.expires_in || 3600;

        // Try exchanging for long-lived token (60 days)
        try {
          const longLivedRes = await fetch(
            `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
              appSecret
            )}&access_token=${encodeURIComponent(finalToken)}`
          );
          const longLivedData = await longLivedRes.json();
          if (longLivedRes.ok && longLivedData.access_token) {
            finalToken = longLivedData.access_token;
            expiresIn = longLivedData.expires_in || 5184000;
          }
        } catch {
          // Keep short-lived token if long-lived exchange is unavailable
        }

        return {
          access_token: finalToken,
          user_id: data.user_id ? String(data.user_id) : undefined,
          expires_in: expiresIn,
        };
      }
    } catch {
      // Fall through to Meta Graph fallback
    }

    // 2. Fallback: Facebook Graph API token exchange (for Facebook Login for Business apps)
    try {
      const fbTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&client_secret=${appSecret}&code=${code}`;

      const fbRes = await fetch(fbTokenUrl);
      const fbData = await fbRes.json();

      if (fbRes.ok && fbData.access_token) {
        return {
          access_token: fbData.access_token,
          expires_in: fbData.expires_in || 5184000,
        };
      }
    } catch {
      // Failed token exchange
    }

    throw new Error(
      "Instagram authorization failed. Please ensure your redirect URI and Instagram app credentials match in Meta App Dashboard."
    );
  }

  /**
   * Retrieves the authorized Instagram profile using the official Meta API.
   * Endpoint: GET https://graph.instagram.com/v21.0/me?fields=id,user_id,username,name,biography,profile_picture_url
   */
  async getProfileByToken(accessToken: string): Promise<InstagramProfileData> {
    // 1. Primary: Instagram Graph host
    try {
      const igRes = await fetch(
        `https://graph.instagram.com/v21.0/me?fields=id,user_id,username,name,biography,profile_picture_url&access_token=${encodeURIComponent(
          accessToken
        )}`
      );
      const igData = await igRes.json();

      if (igRes.ok && (igData.username || igData.id)) {
        return {
          id: igData.id || igData.user_id,
          user_id: igData.user_id,
          username: igData.username || "",
          name: igData.name,
          biography: igData.biography || "",
          profile_picture_url: igData.profile_picture_url,
        };
      }
    } catch {
      // Fall through to Graph Facebook host
    }

    // 2. Fallback: Facebook Graph host (graph.facebook.com)
    try {
      const fbRes = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,username,name,biography,profile_picture_url&access_token=${encodeURIComponent(
          accessToken
        )}`
      );
      const fbData = await fbRes.json();

      if (fbRes.ok && (fbData.username || fbData.id)) {
        return {
          id: fbData.id,
          username: fbData.username || "",
          name: fbData.name,
          biography: fbData.biography || "",
          profile_picture_url: fbData.profile_picture_url,
        };
      }
    } catch {
      // Profile fetch failed
    }

    throw new Error(
      "Unable to retrieve profile from Meta Instagram API. Please verify the access token."
    );
  }

  /**
   * Connect implementation for social provider interface.
   */
  async connect(code: string): Promise<SocialAccountData> {
    const redirectUri =
      process.env.INSTAGRAM_REDIRECT_URI ||
      process.env.META_REDIRECT_URI ||
      "";

    const { access_token, user_id, expires_in } = await this.exchangeCodeForToken(
      code,
      redirectUri
    );

    const profile = await this.getProfileByToken(access_token);
    const cleanUsername = profile.username.replace(/^@/, "");

    return {
      platform: Platform.INSTAGRAM,
      platform_user_id: profile.id || user_id || `ig_${cleanUsername}`,
      username: cleanUsername,
      profile_url: `https://www.instagram.com/${cleanUsername}`,
      access_token: access_token,
      token_expires_at: expires_in
        ? new Date(Date.now() + expires_in * 1000)
        : undefined,
    };
  }

  /**
   * Verifies an Instagram account by reading the official biography via the official Meta API.
   * Validates:
   * 1. Authorized Instagram account matches the requested username.
   * 2. Exact verification code exists in the official biography field.
   */
  async verifyAccount(
    username: string,
    verificationCode: string,
    tokenOverride?: string
  ): Promise<VerificationResult> {
    const cleanUsername = username.trim().replace(/^@/, "");
    const cleanTargetCode = verificationCode.trim();

    if (!cleanUsername) {
      return { is_verified: false, error: "Username cannot be empty." };
    }

    if (!cleanTargetCode || cleanTargetCode.length < 6) {
      return { is_verified: false, error: "Invalid verification code." };
    }

    // Determine access token: explicit token > env test token > env fallback
    const token =
      tokenOverride ||
      process.env.INSTAGRAM_TEST_ACCESS_TOKEN ||
      process.env.META_ACCESS_TOKEN;

    if (!token) {
      const { verifySocialBio } = await import("./bio-verifier");
      return verifySocialBio(Platform.INSTAGRAM, cleanUsername, cleanTargetCode);
    }

    // Fetch official profile via Meta API
    let profile: InstagramProfileData;
    try {
      profile = await this.getProfileByToken(token);
    } catch {
      const { verifySocialBio } = await import("./bio-verifier");
      return verifySocialBio(Platform.INSTAGRAM, cleanUsername, cleanTargetCode);
    }

    // Validate that the authorized Instagram account matches the requested username
    if (
      profile.username &&
      profile.username.toLowerCase().replace(/^@/, "") !== cleanUsername.toLowerCase()
    ) {
      return {
        is_verified: false,
        error: `The authorized Instagram account (@${profile.username}) does not match the username you entered (@${cleanUsername}). Please authorize the matching account.`,
      };
    }

    // Read the official biography field and match exact code
    const biography = profile.biography || "";
    const isCodePresent = verifyCodeInBiography(biography, cleanTargetCode);

    if (isCodePresent) {
      return {
        is_verified: true,
        bio_text: biography,
        verification_code_found: true,
      };
    }

    return {
      is_verified: false,
      bio_text: biography,
      verification_code_found: false,
      error:
        "The verification code was not found in the Instagram bio. Please make sure the exact code is present in your bio and try again.",
    };
  }

  async getProfile(platformUserId: string) {
    return {
      username: `ig_${platformUserId.slice(0, 8)}`,
      profile_url: `https://www.instagram.com/${platformUserId}`,
      bio: "",
    };
  }

  async verifyOwnership(
    videoIdOrUrl: string,
    account: { platform_user_id: string; username: string; access_token?: string | null }
  ): Promise<OwnershipVerificationResult> {
    const shortcode = this.parsePostId(videoIdOrUrl) || videoIdOrUrl;

    // 1. If OAuth access token exists, query user's official media list from Meta Graph
    if (account.access_token && !isPlaceholder(account.access_token)) {
      try {
        const endpoints = [
          `https://graph.instagram.com/v21.0/me/media?fields=id,shortcode,permalink&limit=100&access_token=${encodeURIComponent(
            account.access_token
          )}`,
          `https://graph.facebook.com/v21.0/me/media?fields=id,shortcode,permalink&limit=100&access_token=${encodeURIComponent(
            account.access_token
          )}`,
        ];

        for (const url of endpoints) {
          try {
            const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
            const data = await res.json();
            if (res.ok && data?.data && Array.isArray(data.data)) {
              const matched = data.data.find(
                (m: any) =>
                  m.shortcode === shortcode ||
                  (m.permalink && m.permalink.includes(shortcode))
              );
              if (matched) {
                return {
                  isOwned: true,
                  ownerPlatformUserId: account.platform_user_id,
                  ownerUsername: account.username,
                };
              }
            }
          } catch {}
        }
      } catch {}
    }

    // 2. Extract author handle from URL path: https://www.instagram.com/username/reel/CODE/
    let authorHandle: string | undefined = undefined;
    try {
      const parsed = new URL(videoIdOrUrl.trim());
      const parts = parsed.pathname.split("/").filter(Boolean);
      const reserved = new Set([
        "p",
        "reel",
        "reels",
        "stories",
        "tv",
        "explore",
        "direct",
        "accounts",
        "api",
        "about",
        "legal",
        "developer",
      ]);
      if (parts.length >= 2 && !reserved.has(parts[0].toLowerCase())) {
        authorHandle = parts[0].replace(/^@/, "").trim();
      }
    } catch {}

    // 3. Match against account username
    if (authorHandle) {
      const match = isAuthorMatch(authorHandle, account.username);
      if (match) {
        return {
          isOwned: true,
          ownerPlatformUserId: account.platform_user_id,
          ownerUsername: authorHandle,
        };
      }
      return {
        isOwned: false,
        ownerUsername: authorHandle,
        reason: `This Instagram clip was published by @${authorHandle}, which does not match your verified Instagram account (@${account.username}).`,
      };
    }

    // Default if author cannot be resolved from URL
    return {
      isOwned: true,
      ownerUsername: account.username,
    };
  }

  async getNormalizedMetrics(
    videoIdOrUrl: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<NormalizedMetrics> {
    const shortcode = this.parsePostId(videoIdOrUrl) || videoIdOrUrl;
    const base = {
      fetchedAt: new Date(),
      platform: Platform.INSTAGRAM,
      platformVideoId: shortcode,
      platformUrl: `https://www.instagram.com/reel/${shortcode}/`,
    };
    const token = account?.access_token && !isPlaceholder(account.access_token) ? account.access_token : null;

    if (!token) {
      return {
        ...base,
        views: null,
        likes: null,
        comments: null,
        shares: null,
        saves: null,
        isAvailable: true,
        isPrivate: false,
        authorUsername: this.extractHandle(videoIdOrUrl) || account?.username,
        errorCode: "INSTAGRAM_OAUTH_REQUIRED",
        errorMessage:
          "Instagram views are only available through the official Graph API. The clipper must connect their Instagram Professional account with “Connect Instagram” (OAuth).",
      };
    }

    // 1. Locate the media item by shortcode in the authorized account's media list (paginated)
    let media: { id: string; media_type?: string; media_product_type?: string; like_count?: number; comments_count?: number } | null = null;
    let apiError: string | undefined;
    try {
      let next: string | null =
        `https://graph.instagram.com/v21.0/me/media?fields=id,shortcode,permalink,media_type,media_product_type,like_count,comments_count&limit=100&access_token=${encodeURIComponent(token)}`;
      for (let page = 0; next && page < 10 && !media; page++) {
        const res: { ok: boolean; data: any } = await fetchJson(next, { timeoutMs: 8000 });
        if (!res.ok || !Array.isArray(res.data?.data)) {
          apiError = res.data?.error?.message
            ? `Instagram API error: ${res.data.error.message}`
            : "Instagram API request failed";
          break;
        }
        media =
          res.data.data.find(
            (m: any) =>
              m.shortcode === shortcode ||
              (typeof m.permalink === "string" && m.permalink.includes(`/${shortcode}`))
          ) || null;
        next = res.data.paging?.next || null;
      }
    } catch (err: any) {
      apiError = `Instagram API error: ${err?.message || "request failed"}`;
    }

    if (!media) {
      return {
        ...base,
        views: null,
        likes: null,
        comments: null,
        shares: null,
        saves: null,
        isAvailable: true,
        isPrivate: false,
        authorUsername: this.extractHandle(videoIdOrUrl) || account?.username,
        errorCode: apiError ? "INSTAGRAM_API_ERROR" : "INSTAGRAM_MEDIA_NOT_FOUND",
        errorMessage:
          apiError ||
          "Reel not found under the authorized Instagram account. It may have been deleted or posted from a different account.",
      };
    }

    const likes = toCount(media.like_count);
    const comments = toCount(media.comments_count);
    let views: number | null = null;
    let shares: number | null = null;
    let saves: number | null = null;

    // 2. Insights. If one metric is unsupported for the media type the whole call fails,
    //    so retry with progressively smaller metric sets.
    const metricSets = [["views", "shares", "saved"], ["views"], ["plays"]];
    for (const metrics of metricSets) {
      try {
        const res = await fetchJson(
          `https://graph.instagram.com/v21.0/${media.id}/insights?metric=${metrics.join(",")}&access_token=${encodeURIComponent(token)}`,
          { timeoutMs: 8000 }
        );
        if (res.ok && Array.isArray(res.data?.data)) {
          for (const item of res.data.data) {
            const val = toCount(item.values?.[0]?.value ?? item.total_value?.value);
            if (val == null) continue;
            if (item.name === "views" || item.name === "plays") views = val;
            if (item.name === "shares") shares = val;
            if (item.name === "saved") saves = val;
          }
          if (views != null) break;
        }
      } catch {}
    }

    return {
      ...base,
      views,
      likes,
      comments,
      shares,
      saves,
      isAvailable: true,
      isPrivate: false,
      authorUsername: account?.username,
      ...(views == null
        ? {
            errorCode: "INSTAGRAM_INSIGHTS_UNAVAILABLE",
            errorMessage:
              "Instagram did not return view insights for this media. Make sure the account granted the instagram_business_manage_insights permission.",
          }
        : { rawDetails: { source: "instagram_graph_api" } }),
    };
  }

  private extractHandle(videoIdOrUrl: string): string | undefined {
    try {
      const parts = new URL(videoIdOrUrl.trim()).pathname.split("/").filter(Boolean);
      const reserved = new Set(["p", "reel", "reels", "stories", "tv", "explore", "direct", "accounts", "api"]);
      if (parts.length >= 2 && !reserved.has(parts[0].toLowerCase())) {
        return parts[0].replace(/^@/, "");
      }
    } catch {}
    return undefined;
  }

  async getVideo(
    postUrl: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<VideoMetadata> {
    const shortcode = this.parsePostId(postUrl) || postUrl;
    const norm = await this.getNormalizedMetrics(postUrl, account);

    return {
      platform: Platform.INSTAGRAM,
      platform_post_id: shortcode,
      post_url: postUrl,
      author_username: norm.authorUsername,
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
    throw new Error(metrics.errorMessage || "Unable to fetch Instagram Reel views via official Graph API.");
  }

  async getVideoMetrics(
    platformPostId: string,
    postUrl?: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<VideoMetrics> {
    const norm = await this.getNormalizedMetrics(postUrl || platformPostId, account);
    if (norm.views == null) {
      throw new Error(norm.errorMessage || "Unable to fetch Instagram Reel views via official Graph API.");
    }
    return {
      views: norm.views,
      likes: norm.likes,
      comments: norm.comments,
      shares: norm.shares,
      saves: norm.saves,
    };
  }
}
