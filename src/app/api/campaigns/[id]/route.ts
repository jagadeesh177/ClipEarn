import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireRole } from "@/lib/auth";
import { UserRole, Prisma, SubmissionStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { hasManagerCampaignAccess } from "@/lib/campaignAccess";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();

    if (user?.role === UserRole.MANAGER) {
      const hasAccess = await hasManagerCampaignAccess(user.id, params.id, user.role);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Access denied. You do not have permission to access this campaign." },
          { status: 403 }
        );
      }
    }
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
            status: true,
            current_views: true,
            eligible_views: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const approvedSubmissions = campaign.submissions.filter(
      (s) => s.status === SubmissionStatus.APPROVED
    );
    const totalApprovedViews = approvedSubmissions.reduce(
      (sum, s) => sum + (s.eligible_views || s.current_views),
      0
    );
    const eligibleViews = approvedSubmissions.reduce((sum, s) => sum + s.eligible_views, 0);
    const minViews = campaign.minimum_views_for_payout || 0;
    // Once approved views reach minimum_views_for_payout, then only budget used increases; otherwise view progress increases while budget used stays 0
    const hasReachedMinViews = minViews > 0 ? totalApprovedViews >= minViews : true;
    const computedUsedBudget = hasReachedMinViews ? Number(campaign.used_budget) : 0;
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
        used_budget: computedUsedBudget,
        remaining_budget: Math.max(0, Number(campaign.total_budget) - computedUsedBudget),
        minimum_views_for_payout: campaign.minimum_views_for_payout,
        maximum_views_per_clip: campaign.maximum_views_per_clip,
        allowed_platforms: campaign.allowed_platforms,
        view_eligibility_mode: campaign.view_eligibility_mode,
        requirements: campaign.requirements || [],
        prohibited_content: campaign.prohibited_content || [],
        total_views: totalApprovedViews,
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

    if (user.role === UserRole.MANAGER) {
      const hasAccess = await hasManagerCampaignAccess(user.id, params.id, user.role);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Access denied. You do not have permission to modify this campaign." },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.brand_name && { brand_name: body.brand_name }),
        ...(body.description && { description: body.description }),
        ...(body.image_url !== undefined && { image_url: body.image_url }),
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Only Administrators are permitted to delete campaigns.
    // Managers are strictly blocked from deleting campaigns.
    const user = await requireRole([UserRole.ADMIN]);

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    await prisma.campaign.delete({
      where: { id: params.id },
    });

    await logAuditEvent({
      actorId: user.id,
      action: "CAMPAIGN_DELETED",
      targetType: "CAMPAIGN",
      targetId: params.id,
      oldValue: { name: campaign.name, brand: campaign.brand_name },
    });

    return NextResponse.json({
      success: true,
      message: `Campaign "${campaign.name}" was deleted permanently.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete campaign" }, { status: 500 });
  }
}
