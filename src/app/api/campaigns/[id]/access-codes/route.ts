import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { generateAccessCode } from "@/lib/campaignAccess";
import { logAuditEvent } from "@/lib/audit";

/**
 * GET /api/campaigns/[id]/access-codes
 * Admin-only: list all manager access codes for this campaign.
 * Securely exposes only masked code previews, never raw cryptographic hashes or full plaintext.
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
      select: {
        id: true,
        campaign_id: true,
        code_preview: true,
        status: true,
        expires_at: true,
        created_at: true,
        redeemed_at: true,
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
 * Admin-only: generate a cryptographically secure, high-entropy manager access code.
 *
 * Security:
 * - Only the SHA-256 hash and masked preview are saved to the database.
 * - The complete plaintext code is NEVER logged in audit trails or stored in plaintext.
 * - The plaintext code is returned ONCE to the authorized Admin in the generation response.
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

    // Generate high-entropy code with retry in case of hash collision
    let generated = generateAccessCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.campaignAccessCode.findUnique({
        where: { code: generated.codeHash },
      });
      if (!existing) break;
      generated = generateAccessCode();
      attempts++;
    }

    // 30 days expiration window
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const accessCodeRecord = await prisma.campaignAccessCode.create({
      data: {
        campaign_id: campaign.id,
        code: generated.codeHash, // Store SHA-256 hash in database
        code_preview: generated.codePreview, // Safe masked preview for Admin UI
        status: "ACTIVE",
        expires_at: expiresAt,
        created_by: admin.id,
      },
      select: {
        id: true,
        campaign_id: true,
        code_preview: true,
        status: true,
        expires_at: true,
        created_at: true,
        creator: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    // Audit log: only log the masked preview, NEVER the plaintext code
    await logAuditEvent({
      actorId: admin.id,
      action: "CAMPAIGN_ACCESS_CODE_GENERATED",
      targetType: "CAMPAIGN",
      targetId: campaign.id,
      newValue: {
        campaign_name: campaign.name,
        code_preview: generated.codePreview,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Manager access code generated successfully.",
        code: generated.plaintextCode, // Provided once to the authorized Admin
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
