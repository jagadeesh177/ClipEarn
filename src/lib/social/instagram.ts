import { Platform } from "@prisma/client";
import { SocialProvider, SocialAccountData, VerificationResult, VideoMetadata } from "./types";
import { MockSocialProvider } from "./mock-provider";

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
  private mockFallback = new MockSocialProvider(Platform.INSTAGRAM);

  parsePostId(postUrl: string): string | null {
    return this.mockFallback.parsePostId(postUrl);
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
      scope: "instagram_business_basic",
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
    return this.mockFallback.getProfile(platformUserId);
  }

  async getVideo(postUrl: string): Promise<VideoMetadata> {
    const fallback = await this.mockFallback.getVideo(postUrl);
    try {
      const metrics = await this.fetchPublicMetrics(postUrl);
      if (metrics) {
        return {
          ...fallback,
          author_username: metrics.author || fallback.author_username,
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
          return { views: metrics.views, likes: metrics.likes, comments: metrics.comments };
        }
      } catch {}
    }
    return this.mockFallback.getVideoMetrics(platformPostId);
  }

  private async fetchPublicMetrics(postUrl: string): Promise<{ views: number; likes: number; comments: number; author?: string } | null> {
    try {
      const res = await fetch(postUrl, {
        headers: {
          "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const html = await res.text();

      let likes = 0;
      let comments = 0;
      let views = 0;
      let author: string | undefined = undefined;

      // 1. Check if URL path includes username (e.g. instagram.com/username/reel/CODE/)
      try {
        const parsed = new URL(postUrl.trim());
        const parts = parsed.pathname.split("/").filter(Boolean);
        const reserved = new Set(["p", "reel", "reels", "stories", "tv", "explore", "direct", "accounts", "api"]);
        if (parts.length >= 2 && !reserved.has(parts[0].toLowerCase())) {
          author = parts[0].replace(/^@/, "");
        }
      } catch {}

      const metaMatch =
        html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
        html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);

      if (metaMatch) {
        const text = metaMatch[1];
        const likesMatch = text.match(/([0-9,.]+[KMkm]?)\s+likes/i);
        const commentsMatch = text.match(/([0-9,.]+[KMkm]?)\s+comments/i);
        const viewsMatch = text.match(/([0-9,.]+[KMkm]?)\s+views/i);

        if (likesMatch) likes = this.parseCount(likesMatch[1]);
        if (commentsMatch) comments = this.parseCount(commentsMatch[1]);
        if (viewsMatch) views = this.parseCount(viewsMatch[1]);

        // Extract author from description if available: "... comments - username on ..."
        if (!author) {
          const aMatch = text.match(/[-–—]\s*([a-zA-Z0-9_.]+)\s+on/i);
          if (aMatch) author = aMatch[1].replace(/^@/, "");
        }
      }

      if (!author) {
        const titleMatch =
          html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
          html.match(/<title>([^<]*)<\/title>/i);
        if (titleMatch) {
          const tText = titleMatch[1];
          const m = tText.match(/^([a-zA-Z0-9_.]+)\s+on\s+Instagram/i) || tText.match(/@([a-zA-Z0-9_.]+)/);
          if (m) author = m[1].replace(/^@/, "");
        }
      }

      if (!likes) {
        const likeCountMatch =
          html.match(/"edge_media_preview_like":\s*\{\s*"count":\s*(\d+)/) ||
          html.match(/"edge_liked_by":\s*\{\s*"count":\s*(\d+)/);
        if (likeCountMatch) likes = parseInt(likeCountMatch[1], 10);
      }
      if (!comments) {
        const commentCountMatch =
          html.match(/"edge_media_to_comment":\s*\{\s*"count":\s*(\d+)/) ||
          html.match(/"edge_media_to_parent_comment":\s*\{\s*"count":\s*(\d+)/);
        if (commentCountMatch) comments = parseInt(commentCountMatch[1], 10);
      }
      if (!views) {
        const viewCountMatch =
          html.match(/"video_view_count":\s*(\d+)/) ||
          html.match(/"video_play_count":\s*(\d+)/);
        if (viewCountMatch) views = parseInt(viewCountMatch[1], 10);
      }

      if (views > 0 || likes > 0 || comments > 0 || author) {
        if (views === 0 && likes > 0) {
          views = Math.round(likes * 14.5);
        }
        return { views, likes, comments, author };
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
