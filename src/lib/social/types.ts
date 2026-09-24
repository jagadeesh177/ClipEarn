import { Platform } from "@prisma/client";

export interface SocialAccountData {
  platform: Platform;
  platform_user_id: string;
  username: string;
  profile_url: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
}

export interface VerificationResult {
  is_verified: boolean;
  is_login_wall?: boolean;
  bio_text?: string;
  verification_code_found?: boolean;
  error?: string;
}

export interface VideoMetadata {
  platform: Platform;
  platform_post_id: string;
  post_url: string;
  author_platform_user_id?: string;
  author_username?: string;
  author_display_name?: string;
  current_views: number;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  is_available: boolean;
  is_private: boolean;
}

export interface VideoMetrics {
  views: number;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
}

export interface NormalizedMetrics {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  fetchedAt: Date;
  platform: Platform;
  platformVideoId: string;
  platformUrl?: string;
  isAvailable: boolean;
  isPrivate: boolean;
  authorUsername?: string;
  authorDisplayName?: string;
  authorPlatformUserId?: string;
  rawDetails?: Record<string, any>;
  errorCode?: string;
  errorMessage?: string;
  error?: string;
}

export interface OwnershipVerificationResult {
  isOwned: boolean;
  ownerPlatformUserId?: string;
  ownerUsername?: string;
  ownerDisplayName?: string;
  reason?: string;
}

export interface SocialProvider {
  platform: Platform;
  connect(code: string): Promise<SocialAccountData>;
  verifyAccount(username: string, verificationCode: string): Promise<VerificationResult>;
  getProfile(platformUserId: string): Promise<{ username: string; profile_url: string; bio?: string }>;
  getVideo(
    postUrl: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<VideoMetadata>;
  getVideoViews(platformPostId: string): Promise<number>;
  getVideoMetrics?(
    platformPostId: string,
    postUrl?: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<VideoMetrics>;
  getNormalizedMetrics?(
    videoIdOrUrl: string,
    account?: { platform_user_id?: string; username?: string; access_token?: string | null } | null
  ): Promise<NormalizedMetrics>;
  verifyOwnership?(
    videoIdOrUrl: string,
    account: { platform_user_id: string; username: string; access_token?: string | null }
  ): Promise<OwnershipVerificationResult>;
  refreshToken?(refreshToken: string): Promise<{ access_token: string; expires_at: Date }>;
  parsePostId(postUrl: string): string | null;
}
