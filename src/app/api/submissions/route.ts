import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { detectPlatformFromUrl, getSocialProvider } from "@/lib/social";
import { CampaignStatus, SubmissionStatus, VerificationStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { flagSuspiciousActivity } from "@/lib/fraud";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
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
      eligible_views: s.eligible_views,
      current_earnings: Number(s.current_earnings),
      rejection_reason: s.rejection_reason,
      appeal_reason: s.appeal_reason,
      appealed_at: s.appealed_at,
      submitted_at: s.submitted_at,
      reviewed_at: s.reviewed_at,
      last_view_update: s.last_view_update,
      recent_snapshots: s.view_snapshots.map((snap) => ({
        views: snap.views,
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

    // 4. Auto-bind to Verified Social Account for detectedPlatform
    let account = null;
    if (social_account_id) {
      account = await prisma.socialAccount.findUnique({
        where: { id: social_account_id },
      });
    }

    // If no social_account_id passed or account doesn't match detectedPlatform, find verified account
    if (!account || account.platform !== detectedPlatform || account.user_id !== user.id) {
      account = await prisma.socialAccount.findFirst({
        where: {
          user_id: user.id,
          platform: detectedPlatform,
          verification_status: VerificationStatus.VERIFIED,
        },
      });
    }

    if (!account) {
      return NextResponse.json(
        {
          error: `No verified ${detectedPlatform} account found. Please connect and verify your ${detectedPlatform} handle with your bio code in Profile & Accounts first.`
        },
        { status: 400 }
      );
    }

    if (account.verification_status !== VerificationStatus.VERIFIED) {
      return NextResponse.json(
        { error: `Your ${detectedPlatform} account (@${account.username}) is not verified yet. Please add your bio code in Profile & Accounts.` },
        { status: 400 }
      );
    }

    // 5. Parse Platform Post ID
    const provider = getSocialProvider(detectedPlatform);
    const platformPostId = provider.parsePostId(trimmedUrl);

    if (!platformPostId) {
      return NextResponse.json({ error: "Could not extract video identifier from the provided URL." }, { status: 400 });
    }

    // 6. Check Duplicate Video (Anti-fraud Constraint)
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

    // 7. Fetch Initial Video Metadata & Views
    let initialViews = 0;
    try {
      const videoMeta = await provider.getVideo(trimmedUrl);
      initialViews = videoMeta.current_views || 0;
    } catch {
      initialViews = 0;
    }

    // 8. Create Submission & Baseline Snapshot in Transaction
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
          eligible_views: 0,
          current_earnings: 0,
          last_view_update: new Date(),
        },
      });

      // Baseline snapshot
      if (initialViews > 0) {
        await tx.viewSnapshot.create({
          data: {
            submission_id: sub.id,
            views: initialViews,
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
