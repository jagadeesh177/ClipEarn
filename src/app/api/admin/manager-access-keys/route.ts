import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { generateManagerAccessKey } from "@/lib/managerAccessKey";
import { logAuditEvent } from "@/lib/audit";

/**
 * GET /api/admin/manager-access-keys
 * Admin-only: list all generated Campaign Manager Access Keys.
 * Exposes only masked previews (e.g. CE-MGR-••••-7K4P), never raw hashes or plaintext.
 */
export async function GET() {
  try {
    await requireRole([UserRole.ADMIN]);

    const keys = await prisma.managerAccessKey.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        key_preview: true,
        status: true,
        expires_at: true,
        created_at: true,
        used_at: true,
        creator: {
          select: { id: true, username: true, email: true },
        },
        used_by_user: {
          select: { id: true, username: true, email: true, discord_id: true, avatar_url: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: keys,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }
    return NextResponse.json(
      { error: err?.message || "Failed to fetch manager access codes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/manager-access-keys
 * Admin-only: generate a new high-entropy Campaign Manager Access Key.
 *
 * Security:
 * - Plaintext is returned ONCE to the Admin in this response to copy.
 * - Database stores only the SHA-256 hash.
 * - Audit logs record only the masked preview.
 */
export async function POST(request: Request) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);

    // Generate unique key with retry in case of collision
    let generated = generateManagerAccessKey();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.managerAccessKey.findUnique({
        where: { key_hash: generated.keyHash },
      });
      if (!existing) break;
      generated = generateManagerAccessKey();
      attempts++;
    }

    // Default 14 days expiration
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const record = await prisma.managerAccessKey.create({
      data: {
        key_hash: generated.keyHash,
        key_preview: generated.keyPreview,
        status: "ACTIVE",
        expires_at: expiresAt,
        created_by: admin.id,
      },
      select: {
        id: true,
        key_preview: true,
        status: true,
        expires_at: true,
        created_at: true,
        creator: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    await logAuditEvent({
      actorId: admin.id,
      action: "MANAGER_ACCESS_KEY_GENERATED",
      targetType: "MANAGER_AUTH",
      targetId: record.id,
      newValue: {
        preview: generated.keyPreview,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Campaign Manager access code generated successfully.",
        key: generated.plaintextKey, // Returned once to the Admin
        accessKey: record,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }
    return NextResponse.json(
      { error: err?.message || "Failed to generate manager access code" },
      { status: 500 }
    );
  }
}
