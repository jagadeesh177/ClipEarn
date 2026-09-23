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
  current_views: number;
  likes?: number;
  comments?: number;
  is_available: boolean;
  is_private: boolean;
}

export interface VideoMetrics {
  views: number;
  likes: number;
  comments: number;
}

export interface SocialProvider {
  platform: Platform;
  connect(code: string): Promise<SocialAccountData>;
  verifyAccount(username: string, verificationCode: string): Promise<VerificationResult>;
  getProfile(platformUserId: string): Promise<{ username: string; profile_url: string; bio?: string }>;
  getVideo(postUrl: string): Promise<VideoMetadata>;
  getVideoViews(platformPostId: string): Promise<number>;
  getVideoMetrics?(platformPostId: string, postUrl?: string): Promise<VideoMetrics>;
  refreshToken?(refreshToken: string): Promise<{ access_token: string; expires_at: Date }>;
  parsePostId(postUrl: string): string | null;
}
