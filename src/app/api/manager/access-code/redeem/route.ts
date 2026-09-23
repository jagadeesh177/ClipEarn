import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, CampaignStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/manager/access-code/redeem
 * Validates and redeems a campaign access code for the logged-in Campaign Manager.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
    const body = await request.json();
    const rawCode = body?.code;

    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json(
        { error: "Invalid or expired campaign access code." },
        { status: 400 }
      );
    }

    const code = rawCode.trim().toUpperCase();

    // 1. Look up the code in the database
    const accessCode = await prisma.campaignAccessCode.findUnique({
      where: { code },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            brand_name: true,
            status: true,
          },
        },
      },
    });

    // 2. Validate code existence and active status
    if (!accessCode || accessCode.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Invalid or expired campaign access code." },
        { status: 400 }
      );
    }

    // 3. Validate campaign eligibility (must exist and not be cancelled)
    if (!accessCode.campaign || accessCode.campaign.status === CampaignStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Invalid or expired campaign access code." },
        { status: 400 }
      );
    }

    // 4. Check if this manager already has access to this campaign
    const existingManagerAccess = await prisma.campaignAccessCode.findFirst({
      where: {
        campaign_id: accessCode.campaign_id,
        redeemed_by: user.id,
        status: "REDEEMED",
      },
    });

    if (existingManagerAccess) {
      return NextResponse.json(
        { error: "You already have access to this campaign." },
        { status: 400 }
      );
    }

    // 5. Grant access: record redemption in database
    const updated = await prisma.campaignAccessCode.update({
      where: { id: accessCode.id },
      data: {
        status: "REDEEMED",
        redeemed_by: user.id,
        redeemed_at: new Date(),
      },
      include: {
        campaign: true,
      },
    });

    // 6. Log audit event
    await logAuditEvent({
      actorId: user.id,
      action: "CAMPAIGN_ACCESS_CODE_REDEEMED",
      targetType: "CAMPAIGN",
      targetId: accessCode.campaign_id,
      newValue: {
        campaign_name: accessCode.campaign.name,
        code,
        manager_username: user.username,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Access granted to campaign: ${accessCode.campaign.name}`,
      campaign: {
        id: updated.campaign.id,
        name: updated.campaign.name,
        brand_name: updated.campaign.brand_name,
        status: updated.campaign.status,
      },
    });
  } catch (err: any) {
    if (err.message === "FORBIDDEN" || err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized. Campaign Manager or Admin role required." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: err?.message || "Invalid or expired campaign access code." },
      { status: 500 }
    );
  }
}
