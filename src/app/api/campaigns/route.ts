import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireRole } from "@/lib/auth";
import { UserRole, CampaignStatus, Platform, Prisma, SubmissionStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const platform = searchParams.get("platform") as Platform | null;
    const status = searchParams.get("status") as CampaignStatus | null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const user = await getSessionUser();

    const where: Prisma.CampaignWhereInput = {
      ...(status ? { status } : { status: { in: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED] } }),
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
      ...(user?.role === UserRole.MANAGER
        ? {
            access_codes: {
              some: {
                redeemed_by: user.id,
                status: "REDEEMED",
              },
            },
          }
        : {}),
    };

    const [total, campaigns] = await Promise.all([
      prisma.campaign.count({ where }),
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          memberships: user ? { where: { user_id: user.id } } : false,
          access_codes: user?.role === UserRole.ADMIN ? {
            select: {
              id: true,
              code_preview: true,
              status: true,
              expires_at: true,
              created_at: true,
              redeemed_at: true,
              manager: {
                select: { id: true, username: true, email: true },
              },
            },
            orderBy: { created_at: "desc" },
          } : false,
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
              eligible_views: true,
            },
          },
        },
      }),
    ]);

    const formattedCampaigns = campaigns.map((c) => {
      const approvedSubmissions = c.submissions.filter(
        (s) => s.status === SubmissionStatus.APPROVED
      );
      const totalApprovedViews = approvedSubmissions.reduce(
        (sum, s) => sum + (s.eligible_views || s.current_views),
        0
      );
      const eligibleViews = approvedSubmissions.reduce((sum, s) => sum + s.eligible_views, 0);
      const minViews = c.minimum_views_for_payout || 0;
      // Only once approved views reach minimum_views_for_payout does budget used increase
      const hasReachedMinViews = minViews > 0 ? totalApprovedViews >= minViews : true;
      const usedBudget = hasReachedMinViews ? Number(c.used_budget) : 0;
      const isJoined = user ? c.memberships.length > 0 : false;
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
        allowed_platforms: c.allowed_platforms,
        view_eligibility_mode: c.view_eligibility_mode,
        total_views: totalApprovedViews,
        eligible_views: eligibleViews,
        max_payable_views: maxPayableViews,
        clippers_count: c._count.memberships,
        submissions_count: c._count.submissions,
        is_joined: isJoined,
        requirements: c.requirements,
        created_at: c.created_at,
        access_codes: user?.role === UserRole.ADMIN ? (c as any).access_codes : undefined,
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
    return NextResponse.json({ error: err?.message || "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
    const body = await request.json();

    const {
      name,
      brand_name,
      description,
      image_url,
      cpm,
      total_budget,
      minimum_views_for_payout,
      maximum_views_per_clip,
      allowed_platforms,
      requirements,
      prohibited_content,
      view_eligibility_mode,
    } = body;

    if (!name || !cpm || !total_budget) {
      return NextResponse.json({ error: "Missing required campaign fields (name, cpm, total_budget)" }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        brand_name: brand_name || name,
        description: description || "",
        image_url: image_url || null,
        cpm: new Prisma.Decimal(cpm),
        total_budget: new Prisma.Decimal(total_budget),
        minimum_views_for_payout: minimum_views_for_payout || 100000,
        maximum_views_per_clip: maximum_views_per_clip || null,
        allowed_platforms: allowed_platforms || [Platform.INSTAGRAM, Platform.TIKTOK, Platform.YOUTUBE],
        requirements: requirements || [],
        prohibited_content: prohibited_content || [],
        view_eligibility_mode: view_eligibility_mode || "FROM_SUBMISSION",
        created_by: user.id,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      action: "CAMPAIGN_CREATED",
      targetType: "CAMPAIGN",
      targetId: campaign.id,
      newValue: { name, brand_name, budget: total_budget, cpm },
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create campaign" }, { status: 500 });
  }
}
