import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isAllowedAdminEmail } from "@/lib/auth";
import { UserRole, UserStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/admin/managers/[id]/restore
 * Admin-only: restores Campaign Manager role to a previously revoked manager or user.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === UserRole.ADMIN || isAllowedAdminEmail(targetUser.email)) {
      return NextResponse.json(
        { error: "Admin accounts already possess full administrative privileges." },
        { status: 400 }
      );
    }

    if (targetUser.role === UserRole.MANAGER) {
      return NextResponse.json(
        { error: "User is already an active Campaign Manager." },
        { status: 400 }
      );
    }

    // Restore role to MANAGER and ensure status is ACTIVE
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        suspension_reason: null,
        suspended_at: null,
      },
    });

    // Mark any manager access keys used by this manager as USED / active
    await prisma.managerAccessKey.updateMany({
      where: { used_by: params.id },
      data: { status: "USED" },
    });

    await logAuditEvent({
      actorId: admin.id,
      action: "MANAGER_RESTORED",
      targetType: "USER",
      targetId: params.id,
      oldValue: { role: targetUser.role },
      newValue: { role: "MANAGER", status: "ACTIVE" },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign Manager access restored successfully.",
      user: {
        id: updated.id,
        username: updated.username,
        role: updated.role,
        status: updated.status,
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }
    return NextResponse.json(
      { error: err?.message || "Failed to restore manager access" },
      { status: 500 }
    );
  }
}
