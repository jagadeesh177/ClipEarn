import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireRole } from "@/lib/auth";
import { UserRole, Prisma } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        memberships: user ? { where: { user_id: user.id } } : false,
        _count: {
          select: {
            memberships: true,
            submissions: true,
          },
        },
        submissions: {
          select: {
            current_views: true,
            eligible_views: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const totalViews = campaign.submissions.reduce((sum, s) => sum + s.current_views, 0);
    const eligibleViews = campaign.submissions.reduce((sum, s) => sum + s.eligible_views, 0);
    const isJoined = user ? campaign.memberships.length > 0 : false;
    const maxPayableViews = Math.floor((Number(campaign.total_budget) / Number(campaign.cpm)) * 1000);

    return NextResponse.json({
      data: {
        id: campaign.id,
        name: campaign.name,
        brand_name: campaign.brand_name,
        description: campaign.description,
        image_url: campaign.image_url,
        status: campaign.status,
        cpm: Number(campaign.cpm),
        total_budget: Number(campaign.total_budget),
        used_budget: Number(campaign.used_budget),
        remaining_budget: Math.max(0, Number(campaign.total_budget) - Number(campaign.used_budget)),
        minimum_views_for_payout: campaign.minimum_views_for_payout,
        maximum_views_per_clip: campaign.maximum_views_per_clip,
        allowed_platforms: campaign.allowed_platforms,
        view_eligibility_mode: campaign.view_eligibility_mode,
        requirements: campaign.requirements || [],
        prohibited_content: campaign.prohibited_content || [],
        total_views: totalViews,
        eligible_views: eligibleViews,
        max_payable_views: maxPayableViews,
        clippers_count: campaign._count.memberships,
        submissions_count: campaign._count.submissions,
        is_joined: isJoined,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        created_at: campaign.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch campaign" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
    const body = await request.json();

    const existing = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const updated = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.brand_name && { brand_name: body.brand_name }),
        ...(body.description && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.cpm && { cpm: new Prisma.Decimal(body.cpm) }),
        ...(body.total_budget && { total_budget: new Prisma.Decimal(body.total_budget) }),
        ...(body.requirements && { requirements: body.requirements }),
        ...(body.prohibited_content && { prohibited_content: body.prohibited_content }),
        ...(body.allowed_platforms && { allowed_platforms: body.allowed_platforms }),
      },
    });

    await logAuditEvent({
      actorId: user.id,
      action: "CAMPAIGN_UPDATED",
      targetType: "CAMPAIGN",
      targetId: params.id,
      oldValue: { status: existing.status, cpm: Number(existing.cpm), budget: Number(existing.total_budget) },
      newValue: body,
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update campaign" }, { status: 500 });
  }
}
