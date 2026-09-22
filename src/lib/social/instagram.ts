import { Platform } from "@prisma/client";
import { SocialProvider, SocialAccountData, VerificationResult, VideoMetadata } from "./types";
import { MockSocialProvider } from "./mock-provider";

export class InstagramProvider implements SocialProvider {
  public platform = Platform.INSTAGRAM;
  private mockFallback = new MockSocialProvider(Platform.INSTAGRAM);

  parsePostId(postUrl: string): string | null {
    return this.mockFallback.parsePostId(postUrl);
  }

  async connect(code: string): Promise<SocialAccountData> {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret || appId === "your_meta_app_id") {
      return this.mockFallback.connect(code);
    }

    // Official Meta Graph API OAuth token exchange
    try {
      const redirectUri = process.env.META_REDIRECT_URI || "";
      const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&client_secret=${appSecret}&code=${code}`;

      const res = await fetch(tokenUrl);
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Instagram token exchange failed");
      }

      // Fetch user profile
      const userRes = await fetch(
        `https://graph.facebook.com/v20.0/me?fields=id,username&access_token=${data.access_token}`
      );
      const userData = await userRes.json();

      return {
        platform: Platform.INSTAGRAM,
        platform_user_id: userData.id,
        username: userData.username || `ig_user_${userData.id}`,
        profile_url: `https://instagram.com/${userData.username}`,
        access_token: data.access_token,
        token_expires_at: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : undefined,
      };
    } catch {
      return this.mockFallback.connect(code);
    }
  }

  async verifyAccount(username: string, verificationCode: string): Promise<VerificationResult> {
    return this.mockFallback.verifyAccount(username, verificationCode);
  }

  async getProfile(platformUserId: string) {
    return this.mockFallback.getProfile(platformUserId);
  }

  async getVideo(postUrl: string): Promise<VideoMetadata> {
    return this.mockFallback.getVideo(postUrl);
  }

  async getVideoViews(platformPostId: string): Promise<number> {
    return this.mockFallback.getVideoViews(platformPostId);
  }
}
