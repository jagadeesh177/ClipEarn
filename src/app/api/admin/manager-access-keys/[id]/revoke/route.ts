import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, UserStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/admin/manager-access-keys/[id]/revoke
 * Admin-only: immediately revokes an active Campaign Manager Access Key.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);

    const existing = await prisma.managerAccessKey.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Manager access code not found" }, { status: 404 });
    }

    if (existing.status === "REVOKED") {
      return NextResponse.json({ error: "Manager access code is already revoked" }, { status: 400 });
    }

    const updated = await prisma.managerAccessKey.update({
      where: { id: params.id },
      data: { status: "REVOKED" },
    });

    // If key was used by a manager, immediately revoke the manager's access and suspend user
    if (existing.used_by) {
      await prisma.user.update({
        where: { id: existing.used_by },
        data: {
          role: UserRole.CLIPPER,
          status: UserStatus.SUSPENDED,
        },
      });

      await logAuditEvent({
        actorId: admin.id,
        action: "MANAGER_REVOKED",
        targetType: "USER",
        targetId: existing.used_by,
        newValue: { status: "SUSPENDED", role: "CLIPPER" },
      });
    }

    await logAuditEvent({
      actorId: admin.id,
      action: "MANAGER_ACCESS_KEY_REVOKED",
      targetType: "MANAGER_AUTH",
      targetId: params.id,
      oldValue: { status: existing.status },
      newValue: { status: "REVOKED" },
    });

    return NextResponse.json({
      success: true,
      message: existing.used_by
        ? "Campaign Manager access revoked successfully."
        : "Manager invitation code revoked successfully.",
      accessKey: updated,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }
    return NextResponse.json(
      { error: err?.message || "Failed to revoke manager access code" },
      { status: 500 }
    );
  }
}
