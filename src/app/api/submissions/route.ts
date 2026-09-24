import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { detectPlatformFromUrl, getSocialProvider, extractAccountFromUrl, isAuthorMatch } from "@/lib/social";
import { CampaignStatus, SubmissionStatus, VerificationStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { flagSuspiciousActivity } from "@/lib/fraud";
import { decryptToken } from "@/lib/encryption";

export async function GET(request: Request) {
  try {
    const user = await requireAuth({ allowSuspended: true });
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id");
    const status = searchParams.get("status") as SubmissionStatus | null;

    const submissions = await prisma.submission.findMany({
      where: {
        user_id: user.id,
        ...(campaignId ? { campaign_id: campaignId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            brand_name: true,
            cpm: true,
            minimum_views_for_payout: true,
          },
        },
        social_account: {
          select: {
            id: true,
            platform: true,
            username: true,
          },
        },
        view_snapshots: {
          orderBy: { captured_at: "desc" },
          take: 5,
        },
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const extractHandle = (url: string, fallback: string) => {
      try {
        const parsed = new URL(url);
        if (parsed.hostname.includes("tiktok.com")) {
          const m = parsed.pathname.match(/@([^/?#]+)/);
          if (m) return m[1];
        }
        if (parsed.hostname.includes("instagram.com")) {
          const parts = parsed.pathname.split("/").filter(Boolean);
          if (parts.length > 0 && !["p", "reel", "stories", "tv"].includes(parts[0])) {
            return parts[0].replace(/^@/, "");
          }
        }
      } catch {}
      return fallback;
    };

    const formatted = submissions.map((s) => ({
      id: s.id,
      campaign_id: s.campaign_id,
      campaign_name: s.campaign.name,
      brand_name: s.campaign.brand_name,
      cpm: Number(s.campaign.cpm),
      platform: s.platform,
      post_url: s.post_url,
      platform_post_id: s.platform_post_id,
      account_username: s.social_account?.username || extractHandle(s.post_url, s.user?.username || "clipper"),
      status: s.status,
      current_views: s.current_views,
      current_likes: s.current_likes,
      current_comments: s.current_comments,
      current_shares: s.current_shares,
      current_saves: s.current_saves,
      eligible_views: s.eligible_views,
      current_earnings: Number(s.current_earnings),
      rejection_reason: s.rejection_reason,
      appeal_reason: s.appeal_reason,
      appealed_at: s.appealed_at,
      submitted_at: s.submitted_at,
      created_at: s.created_at,
      reviewed_at: s.reviewed_at,
      last_view_update: s.last_view_update,
      last_sync_status: s.last_sync_status,
      recent_snapshots: s.view_snapshots.map((snap) => ({
        views: snap.views,
        likes: snap.likes,
        comments: snap.comments,
        shares: snap.shares,
        saves: snap.saves,
        captured_at: snap.captured_at,
      })),
    }));

    return NextResponse.json({ data: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch submissions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { campaign_id, social_account_id, post_url } = await request.json();

    if (!campaign_id || !post_url || !post_url.trim()) {
      return NextResponse.json({ error: "Campaign and video URL are required." }, { status: 400 });
    }

    const trimmedUrl = post_url.trim();

    // 1. Detect Platform from URL
    const detectedPlatform = detectPlatformFromUrl(trimmedUrl);
    if (!detectedPlatform) {
      return NextResponse.json({
        error: "Invalid video URL. Please provide a valid TikTok, Instagram Reel, or YouTube Shorts link."
      }, { status: 400 });
    }

    // 2. Check Campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaign_id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      return NextResponse.json({ error: "This campaign is no longer accepting submissions." }, { status: 400 });
    }

    if (!campaign.allowed_platforms.includes(detectedPlatform)) {
      return NextResponse.json(
        { error: `The ${detectedPlatform} platform is not permitted for this campaign. Allowed: ${campaign.allowed_platforms.join(", ")}.` },
        { status: 400 }
      );
    }

    // 3. Auto-join campaign membership if needed
    let membership = await prisma.campaignMembership.findUnique({
      where: {
        campaign_id_user_id: {
          campaign_id,
          user_id: user.id,
        },
      },
    });

    if (!membership) {
      membership = await prisma.campaignMembership.create({
        data: {
          campaign_id,
          user_id: user.id,
        },
      });
    }

    // 4. Validate and Bind Social Account (ONLY VERIFIED ACCOUNTS ALLOWED)
    let account = null;

    if (social_account_id) {
      account = await prisma.socialAccount.findUnique({
        where: { id: social_account_id },
      });

      if (!account || account.user_id !== user.id) {
        return NextResponse.json(
          { error: "Selected social account was not found or does not belong to your ClipEarn profile." },
          { status: 404 }
        );
      }

      if (account.platform !== detectedPlatform) {
        return NextResponse.json(
          { error: `The selected account (@${account.username}) is for ${account.platform}, but your video link is from ${detectedPlatform}.` },
          { status: 400 }
        );
      }

      if (account.verification_status !== VerificationStatus.VERIFIED) {
        await flagSuspiciousActivity({
          userId: user.id,
          type: "UNVERIFIED_ACCOUNT_SUBMISSION_ATTEMPT",
          description: `User attempted to submit clip using unverified ${detectedPlatform} account @${account.username} (status: ${account.verification_status})`,
        });

        return NextResponse.json(
          { error: `Your ${detectedPlatform} account (@${account.username}) is not verified yet (status: ${account.verification_status}). Only verified social accounts can submit clips. Please place your verification code in your bio to verify ownership.` },
          { status: 400 }
        );
      }
    } else {
      // Find the verified account for this platform
      account = await prisma.socialAccount.findFirst({
        where: {
          user_id: user.id,
          platform: detectedPlatform,
          verification_status: VerificationStatus.VERIFIED,
        },
      });

      if (!account) {
        // Check if user has an unverified account for this platform to provide precise error
        const unverified = await prisma.socialAccount.findFirst({
          where: {
            user_id: user.id,
            platform: detectedPlatform,
          },
        });

        if (unverified) {
          await flagSuspiciousActivity({
            userId: user.id,
            type: "UNVERIFIED_ACCOUNT_SUBMISSION_ATTEMPT",
            description: `User attempted to submit ${detectedPlatform} clip while account @${unverified.username} is unverified (status: ${unverified.verification_status})`,
          });

          return NextResponse.json(
            { error: `Your ${detectedPlatform} account (@${unverified.username}) is not verified yet. Only verified social accounts can submit clips. Please complete bio verification in Profile & Accounts first.` },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: `No verified ${detectedPlatform} account found. You must connect and verify your ${detectedPlatform} account in Profile & Accounts before submitting clips.` },
          { status: 400 }
        );
      }
    }

    const verifiedHandle = account.username.toLowerCase().replace(/^@/, "").trim();

    // 5. Author Matching Check: Prevent submitting clips belonging to other accounts
    const urlAuthor = extractAccountFromUrl(trimmedUrl, detectedPlatform);
    if (urlAuthor && !isAuthorMatch(urlAuthor, account.username)) {
      // Check if user owns another verified account that matches this handle
      const allVerifiedAccounts = await prisma.socialAccount.findMany({
        where: {
          user_id: user.id,
          platform: detectedPlatform,
          verification_status: VerificationStatus.VERIFIED,
        },
      });

      const matchingAlt = allVerifiedAccounts.find((a) => isAuthorMatch(urlAuthor, a.username));

      if (!matchingAlt) {
        await flagSuspiciousActivity({
          userId: user.id,
          type: "ACCOUNT_MISMATCH_SUBMISSION_ATTEMPT",
          description: `User submitted clip belonging to @${urlAuthor} while verified account is @${account.username}`,
        });

        return NextResponse.json(
          {
            error: `This clip belongs to @${urlAuthor}, but your verified ${detectedPlatform} account is @${account.username}. You can only submit clips published by your own verified account.`
          },
          { status: 400 }
        );
      } else {
        account = matchingAlt;
      }
    }

    // 6. Parse Platform Post ID
    const provider = getSocialProvider(detectedPlatform);
    const platformPostId = provider.parsePostId(trimmedUrl);

    if (!platformPostId) {
      return NextResponse.json({ error: "Could not extract video identifier from the provided URL." }, { status: 400 });
    }

    // 7. Check Duplicate Video (Anti-fraud Constraint)
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        campaign_id_platform_platform_post_id: {
          campaign_id,
          platform: detectedPlatform,
          platform_post_id: platformPostId,
        },
      },
    });

    if (existingSubmission) {
      await flagSuspiciousActivity({
        userId: user.id,
        type: "DUPLICATE_SUBMISSION_ATTEMPT",
        description: `User attempted to re-submit video ${platformPostId} which already exists in campaign ${campaign_id}`,
      });

      return NextResponse.json(
        { error: "This video has already been submitted to this campaign." },
        { status: 409 }
      );
    }

    // 8. Decrypt Access Token & Verify Ownership
    const decryptedToken = account.access_token_encrypted
      ? decryptToken(account.access_token_encrypted)
      : null;

    if (provider.verifyOwnership) {
      const ownership = await provider.verifyOwnership(trimmedUrl, {
        platform_user_id: account.platform_user_id,
        username: account.username,
        access_token: decryptedToken,
      });

      if (!ownership.isOwned) {
        // Also check if user has another verified account that matches this author
        if (ownership.ownerUsername) {
          const allVerified = await prisma.socialAccount.findMany({
            where: {
              user_id: user.id,
              platform: detectedPlatform,
              verification_status: VerificationStatus.VERIFIED,
            },
          });
          const matchingAcc = allVerified.find((a) =>
            isAuthorMatch(ownership.ownerUsername!, a.username, ownership.ownerDisplayName)
          );
          if (matchingAcc) {
            account = matchingAcc;
          } else {
            await flagSuspiciousActivity({
              userId: user.id,
              type: "ACCOUNT_MISMATCH_SUBMISSION_ATTEMPT",
              description:
                ownership.reason ||
                `Ownership verification failed for video ${platformPostId} with account @${account.username}`,
            });

            return NextResponse.json(
              {
                error:
                  ownership.reason ||
                  `This clip was published by @${ownership.ownerUsername}, which does not match your verified ${detectedPlatform} account (@${account.username}). You can only submit clips from your verified social account.`,
              },
              { status: 400 }
            );
          }
        } else {
          await flagSuspiciousActivity({
            userId: user.id,
            type: "ACCOUNT_MISMATCH_SUBMISSION_ATTEMPT",
            description:
              ownership.reason ||
              `Ownership verification failed for video ${platformPostId} with account @${account.username}`,
          });

          return NextResponse.json(
            {
              error:
                ownership.reason ||
                `This clip does not belong to your verified ${detectedPlatform} account (@${account.username}). You can only submit clips published by your verified account.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // 9. Fetch Real Official Platform Metrics
    let initialViews = 0;
    let initialLikes: number | null = null;
    let initialComments: number | null = null;
    let initialShares: number | null = null;
    let initialSaves: number | null = null;

    try {
      if (provider.getNormalizedMetrics) {
        const norm = await provider.getNormalizedMetrics(trimmedUrl, {
          platform_user_id: account.platform_user_id,
          username: account.username,
          access_token: decryptedToken,
        });
        initialViews = norm.views ?? 0;
        initialLikes = norm.likes ?? null;
        initialComments = norm.comments ?? null;
        initialShares = norm.shares ?? null;
        initialSaves = norm.saves ?? null;
      } else {
        const videoMeta = await provider.getVideo(trimmedUrl, {
          platform_user_id: account.platform_user_id,
          username: account.username,
          access_token: decryptedToken,
        });
        initialViews = videoMeta.current_views || 0;
        initialLikes = videoMeta.likes ?? null;
        initialComments = videoMeta.comments ?? null;
        initialShares = videoMeta.shares ?? null;
        initialSaves = videoMeta.saves ?? null;
      }
    } catch {
      initialViews = 0;
      initialLikes = null;
      initialComments = null;
      initialShares = null;
      initialSaves = null;
    }

    // 10. Create Submission & Baseline Snapshot in Transaction
    const submission = await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.create({
        data: {
          campaign_id,
          user_id: user.id,
          social_account_id: account.id,
          platform: detectedPlatform,
          post_url: trimmedUrl,
          platform_post_id: platformPostId,
          status: SubmissionStatus.PENDING,
          current_views: initialViews,
          current_likes: initialLikes,
          current_comments: initialComments,
          current_shares: initialShares,
          current_saves: initialSaves,
          eligible_views: 0,
          current_earnings: 0,
          last_view_update: new Date(),
          last_sync_status: "SUCCESS",
          last_successful_sync: new Date(),
        },
      });

      // Baseline snapshot
      if (initialViews > 0 || (initialLikes ?? 0) > 0) {
        await tx.viewSnapshot.create({
          data: {
            submission_id: sub.id,
            views: initialViews,
            likes: initialLikes,
            comments: initialComments,
            shares: initialShares,
            saves: initialSaves,
            source: "SUBMISSION_INITIAL",
          },
        });
      }

      // Notification
      await tx.notification.create({
        data: {
          user_id: user.id,
          type: "SUBMISSION_PENDING",
          title: "Clip Submitted! ⏳",
          message: `Your clip for "${campaign.name}" was submitted and is pending review by a campaign manager.`,
        },
      });

      return sub;
    });

    await logAuditEvent({
      actorId: user.id,
      action: "SUBMISSION_CREATED",
      targetType: "SUBMISSION",
      targetId: submission.id,
      newValue: { campaign_id, platform: detectedPlatform, platformPostId },
    });

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to submit clip" }, { status: 500 });
  }
}
