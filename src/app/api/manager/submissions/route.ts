import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, SubmissionStatus, Platform, Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
    const { searchParams } = new URL(request.url);

    const campaignId = searchParams.get("campaign_id");
    const platform = searchParams.get("platform") as Platform | null;
    const status = searchParams.get("status") as SubmissionStatus | null;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
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
        orderBy: { created_at: "desc" },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              brand_name: true,
              cpm: true,
              requirements: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              discord_id: true,
            },
          },
          social_account: {
            select: {
              id: true,
              username: true,
              platform: true,
              profile_url: true,
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
      campaign: s.campaign,
      clipper: s.user,
      social_account: s.social_account,
      platform: s.platform,
      post_url: s.post_url,
      platform_post_id: s.platform_post_id,
      status: s.status,
      current_views: s.current_views,
      eligible_views: s.eligible_views,
      current_earnings: Number(s.current_earnings),
      rejection_reason: s.rejection_reason,
      appeal_reason: s.appeal_reason,
      appealed_at: s.appealed_at,
      submitted_at: s.submitted_at,
      reviewed_at: s.reviewed_at,
      reviewer_username: s.reviewer?.username,
      last_sync_status: s.last_sync_status,
      created_at: s.created_at,
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
    return NextResponse.json({ error: err?.message || "Failed to fetch manager submissions" }, { status: 500 });
  }
}
