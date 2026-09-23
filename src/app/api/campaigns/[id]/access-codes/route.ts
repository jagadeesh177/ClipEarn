import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { generateAccessCode } from "@/lib/campaignAccess";
import { logAuditEvent } from "@/lib/audit";

/**
 * GET /api/campaigns/[id]/access-codes
 * Admin-only: list all manager access codes for this campaign
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole([UserRole.ADMIN]);

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, brand_name: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const accessCodes = await prisma.campaignAccessCode.findMany({
      where: { campaign_id: params.id },
      orderBy: { created_at: "desc" },
      include: {
        creator: {
          select: { id: true, username: true, email: true },
        },
        manager: {
          select: { id: true, username: true, email: true, avatar_url: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      campaign,
      data: accessCodes,
    });
  } catch (err: any) {
    if (err.message === "FORBIDDEN" || err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }
    return NextResponse.json(
      { error: err?.message || "Failed to fetch access codes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns/[id]/access-codes
 * Admin-only: generate a new manager access code for this campaign
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Generate unique code with retry in case of collision
    let code = generateAccessCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.campaignAccessCode.findUnique({
        where: { code },
      });
      if (!existing) break;
      code = generateAccessCode();
      attempts++;
    }

    const accessCodeRecord = await prisma.campaignAccessCode.create({
      data: {
        campaign_id: campaign.id,
        code,
        status: "ACTIVE",
        created_by: admin.id,
      },
      include: {
        creator: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    await logAuditEvent({
      actorId: admin.id,
      action: "CAMPAIGN_ACCESS_CODE_GENERATED",
      targetType: "CAMPAIGN",
      targetId: campaign.id,
      newValue: {
        campaign_name: campaign.name,
        code: accessCodeRecord.code,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Manager access code generated successfully.",
        code: accessCodeRecord.code,
        accessCode: accessCodeRecord,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.message === "FORBIDDEN" || err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }
    return NextResponse.json(
      { error: err?.message || "Failed to generate access code" },
      { status: 500 }
    );
  }
}
