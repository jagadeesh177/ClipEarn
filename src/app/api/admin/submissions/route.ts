import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, SubmissionStatus, Platform, Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireRole([UserRole.ADMIN]);
    const { searchParams } = new URL(request.url);

    const campaignId = searchParams.get("campaign_id");
    const platform = searchParams.get("platform") as Platform | null;
    const status = searchParams.get("status") as SubmissionStatus | null;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: Prisma.SubmissionWhereInput = {
      ...(campaignId ? { campaign_id: campaignId } : {}),
      ...(platform ? { platform } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { user: { username: { contains: search, mode: "insensitive" } } },
              { social_account: { username: { contains: search, mode: "insensitive" } } },
              { post_url: { contains: search, mode: "insensitive" } },
              { platform_post_id: { contains: search, mode: "insensitive" } },
              { campaign: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, submissions] = await Promise.all([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ submitted_at: "asc" }, { id: "asc" }],
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              brand_name: true,
              cpm: true,
              total_budget: true,
              used_budget: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar_url: true,
              status: true,
            },
          },
          social_account: {
            select: {
              id: true,
              platform: true,
              username: true,
              verification_status: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
    ]);

    const formatted = submissions.map((s) => ({
      id: s.id,
      campaignId: s.campaign_id,
      campaignName: s.campaign.name,
      brandName: s.campaign.brand_name,
      cpm: Number(s.campaign.cpm),
      userId: s.user_id,
      username: s.user.username,
      userAvatar: s.user.avatar_url,
      userStatus: s.user.status,
      platform: s.platform,
      postUrl: s.post_url,
      platformPostId: s.platform_post_id,
      socialUsername: s.social_account?.username || null,
      socialVerified: s.social_account?.verification_status === "VERIFIED",
      status: s.status,
      submittedAt: s.submitted_at.toISOString(),
      reviewedAt: s.reviewed_at?.toISOString() || null,
      reviewedBy: s.reviewer?.username || null,
      rejectionReason: s.rejection_reason,
      appealReason: s.appeal_reason,
      currentViews: s.current_views,
      currentLikes: s.current_likes || 0,
      currentComments: s.current_comments || 0,
      currentShares: s.current_shares || 0,
      currentSaves: s.current_saves || 0,
      eligibleViews: s.eligible_views,
      currentEarnings: Number(s.current_earnings),
      lastSyncStatus: s.last_sync_status,
      lastSyncError: s.last_sync_error,
    }));

    return NextResponse.json({
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch admin submissions" },
      { status: 500 }
    );
  }
}
