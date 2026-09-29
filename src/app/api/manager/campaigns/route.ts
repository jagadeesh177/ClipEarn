import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, CampaignStatus, Platform, Prisma, SubmissionStatus } from "@prisma/client";
import { getAccessibleCampaignIdsForManager } from "@/lib/campaignAccess";

export async function GET(request: Request) {
  try {
    const user = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const platform = searchParams.get("platform") as Platform | null;
    const status = searchParams.get("status") as CampaignStatus | null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    let accessibleCampaignIds: string[] = [];
    if (user.role === UserRole.MANAGER) {
      accessibleCampaignIds = await getAccessibleCampaignIdsForManager(user.id);
      if (accessibleCampaignIds.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }

    const where: Prisma.CampaignWhereInput = {
      ...(user.role === UserRole.MANAGER
        ? { id: { in: accessibleCampaignIds } }
        : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { brand_name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(platform ? { allowed_platforms: { has: platform } } : {}),
    };

    const [total, campaigns] = await Promise.all([
      prisma.campaign.count({ where }),
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          _count: {
            select: {
              memberships: true,
              submissions: true,
            },
          },
          submissions: {
            select: {
              status: true,
              current_views: true,
              current_likes: true,
              current_comments: true,
              current_shares: true,
              current_saves: true,
              eligible_views: true,
              current_earnings: true,
            },
          },
        },
      }),
    ]);

    const formattedCampaigns = campaigns.map((c) => {
      const approvedSubmissions = c.submissions.filter(
        (s) => s.status === SubmissionStatus.APPROVED
      );
      const pendingSubmissions = c.submissions.filter(
        (s) => s.status === SubmissionStatus.PENDING
      );

      const totalApprovedViews = approvedSubmissions.reduce(
        (sum, s) => sum + s.current_views,
        0
      );
      const totalApprovedLikes = approvedSubmissions.reduce(
        (sum, s) => sum + (s.current_likes || 0),
        0
      );
      const totalApprovedComments = approvedSubmissions.reduce(
        (sum, s) => sum + (s.current_comments || 0),
        0
      );
      const totalApprovedShares = approvedSubmissions.reduce(
        (sum, s) => sum + (s.current_shares || 0),
        0
      );
      const totalApprovedSaves = approvedSubmissions.reduce(
        (sum, s) => sum + (s.current_saves || 0),
        0
      );

      const minViews = c.minimum_views_for_payout || 0;
      const hasReachedMinViews = minViews > 0 ? totalApprovedViews >= minViews : true;
      const usedBudget = hasReachedMinViews ? Number(c.used_budget) : 0;
      const maxPayableViews = Math.floor((Number(c.total_budget) / Number(c.cpm)) * 1000);

      return {
        id: c.id,
        name: c.name,
        brand_name: c.brand_name,
        description: c.description,
        image_url: c.image_url,
        status: c.status,
        cpm: Number(c.cpm),
        total_budget: Number(c.total_budget),
        used_budget: usedBudget,
        remaining_budget: Math.max(0, Number(c.total_budget) - usedBudget),
        minimum_views_for_payout: c.minimum_views_for_payout,
        maximum_views_per_clip: c.maximum_views_per_clip,
        allowed_platforms: c.allowed_platforms,
        view_eligibility_mode: c.view_eligibility_mode,
        total_views: totalApprovedViews,
        approved_views: totalApprovedViews,
        approved_likes: totalApprovedLikes,
        approved_comments: totalApprovedComments,
        approved_shares: totalApprovedShares,
        approved_saves: totalApprovedSaves,
        eligible_views: totalApprovedViews,
        max_payable_views: maxPayableViews,
        clippers_count: c._count.memberships,
        submissions_count: c._count.submissions,
        approved_submissions_count: approvedSubmissions.length,
        pending_submissions_count: pendingSubmissions.length,
        requirements: c.requirements,
        created_at: c.created_at,
      };
    });

    return NextResponse.json({
      data: formattedCampaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch manager campaigns" },
      { status: 500 }
    );
  }
}
