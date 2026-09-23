import { Platform } from "@prisma/client";
import { SocialProvider, SocialAccountData, VerificationResult, VideoMetadata } from "./types";

import { verifySocialBio } from "./bio-verifier";

export class MockSocialProvider implements SocialProvider {
  public platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  parsePostId(postUrl: string): string | null {
    try {
      const url = new URL(postUrl);
      if (this.platform === Platform.TIKTOK) {
        // e.g. https://www.tiktok.com/@creator/video/7345678901234567890
        const match = url.pathname.match(/video\/(\d+)/);
        return match ? match[1] : url.pathname.split("/").pop() || null;
      }
      if (this.platform === Platform.INSTAGRAM) {
        // e.g. https://www.instagram.com/reel/C3x4y5z/ or /p/C3x4y5z/
        const match = url.pathname.match(/\/(?:reel|reels|p)\/([^/?#&]+)/);
        return match ? match[1] : url.pathname.split("/").filter(Boolean).pop() || null;
      }
      if (this.platform === Platform.YOUTUBE) {
        // e.g. https://www.youtube.com/shorts/dQw4w9WgXcQ or watch?v=dQw4w9WgXcQ
        if (url.pathname.includes("/shorts/")) {
          return url.pathname.split("/shorts/")[1].split("/")[0];
        }
        return url.searchParams.get("v") || url.pathname.split("/").pop() || null;
      }
      return url.pathname.split("/").filter(Boolean).pop() || null;
    } catch {
      return null;
    }
  }

  async connect(code: string): Promise<SocialAccountData> {
    const mockId = `mock_${this.platform.toLowerCase()}_${Date.now()}`;
    const mockUsername = `creator_${this.platform.toLowerCase()}`;
    return {
      platform: this.platform,
      platform_user_id: mockId,
      username: mockUsername,
      profile_url:
        this.platform === "INSTAGRAM"
          ? `https://www.instagram.com/${mockUsername}`
          : `https://${this.platform.toLowerCase()}.com/@${mockUsername}`,
      access_token: `mock_token_${code}`,
      token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    };
  }

  async verifyAccount(username: string, verificationCode: string): Promise<VerificationResult> {
    return verifySocialBio(this.platform, username, verificationCode);
  }

  async getProfile(platformUserId: string): Promise<{ username: string; profile_url: string; bio?: string }> {
    const username = `creator_${platformUserId.slice(0, 8)}`;
    return {
      username,
      profile_url:
        this.platform === "INSTAGRAM"
          ? `https://www.instagram.com/${username}`
          : `https://${this.platform.toLowerCase()}.com/@${username}`,
      bio: "Short-form clips & UGC creator",
    };
  }

  async getVideo(postUrl: string): Promise<VideoMetadata> {
    const postId = this.parsePostId(postUrl) || `post_${Date.now()}`;
    // Generate deterministic initial view count based on postId
    let hash = 0;
    for (let i = 0; i < postId.length; i++) {
      hash = (hash << 5) - hash + postId.charCodeAt(i);
      hash |= 0;
    }
    const initialViews = Math.abs(hash % 50000) + 12000;

    return {
      platform: this.platform,
      platform_post_id: postId,
      post_url: postUrl,
      current_views: initialViews,
      is_available: true,
      is_private: false,
    };
  }

  async getVideoViews(platformPostId: string): Promise<number> {
    // Deterministic growth calculation for mock
    let hash = 0;
    for (let i = 0; i < platformPostId.length; i++) {
      hash = (hash << 5) - hash + platformPostId.charCodeAt(i);
      hash |= 0;
    }
    // Simulate natural view growth
    const base = Math.abs(hash % 100000) + 25000;
    const additional = Math.floor(Math.random() * 5000) + 1000;
    return base + additional;
  }
}
