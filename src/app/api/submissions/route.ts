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
      },
      orderBy: { created_at: "desc" },
    });

    const formatted = submissions.map((s) => ({
      id: s.id,
      campaign_id: s.campaign_id,
      campaign_name: s.campaign.name,
      brand_name: s.campaign.brand_name,
      cpm: Number(s.campaign.cpm),
      platform: s.platform,
      post_url: s.post_url,
      platform_post_id: s.platform_post_id,
      account_username: s.social_account.username,
      status: s.status,
      current_views: s.current_views,
      eligible_views: s.eligible_views,
      current_earnings: Number(s.current_earnings),
      rejection_reason: s.rejection_reason,
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

    if (!campaign_id || !social_account_id || !post_url) {
      return NextResponse.json({ error: "Campaign, social account, and video URL are required." }, { status: 400 });
    }

    // 1. Check Campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaign_id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      return NextResponse.json({ error: "This campaign is no longer accepting submissions." }, { status: 400 });
    }

    // 2. Check Membership
    const membership = await prisma.campaignMembership.findUnique({
      where: {
        campaign_id_user_id: {
          campaign_id,
          user_id: user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "You must join this campaign before submitting clips." }, { status: 403 });
    }

    // 3. Check Connected Social Account & Verification
    const account = await prisma.socialAccount.findUnique({
      where: { id: social_account_id },
    });

    if (!account || account.user_id !== user.id) {
      return NextResponse.json({ error: "Social account not found." }, { status: 404 });
    }

    if (account.verification_status !== VerificationStatus.VERIFIED) {
      return NextResponse.json(
        { error: "You must verify your social account before submitting content." },
        { status: 400 }
      );
    }

    // 4. Detect Platform from URL & Validate Platform Allowed
    const detectedPlatform = detectPlatformFromUrl(post_url);
    if (!detectedPlatform) {
      return NextResponse.json({ error: "Invalid video URL. Please provide an Instagram, TikTok, or YouTube link." }, { status: 400 });
    }

    if (detectedPlatform !== account.platform) {
      return NextResponse.json(
        { error: `The submitted link is for ${detectedPlatform}, but you selected a ${account.platform} account.` },
        { status: 400 }
      );
    }

    if (!campaign.allowed_platforms.includes(detectedPlatform)) {
      return NextResponse.json(
        { error: `The ${detectedPlatform} platform is not permitted for this campaign.` },
        { status: 400 }
      );
    }

    // 5. Parse Platform Post ID
    const provider = getSocialProvider(detectedPlatform);
    const platformPostId = provider.parsePostId(post_url);

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
      const videoMeta = await provider.getVideo(post_url);
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
          post_url,
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
