import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isAllowedAdminEmail } from "@/lib/auth";
import { UserRole, UserStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/admin/managers/[id]/revoke
 * Admin-only: immediately revokes a Campaign Manager's management privileges.
 *
 * Requirements:
 * - Does NOT ban or delete the user account.
 * - Downgrades role from MANAGER to CLIPPER.
 * - Preserves existing status (ACTIVE) so they can log in as a regular user.
 * - Preserves previous submissions, campaigns, and activity history.
 * - Immediately invalidates Manager permissions on the backend.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);

    const managerUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!managerUser) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    if (managerUser.role === UserRole.ADMIN || isAllowedAdminEmail(managerUser.email)) {
      return NextResponse.json({ error: "Cannot revoke an Admin account." }, { status: 400 });
    }

    if (managerUser.role !== UserRole.MANAGER) {
      return NextResponse.json(
        { error: "User is not currently an active Campaign Manager." },
        { status: 400 }
      );
    }

    // Demote role to CLIPPER while preserving their account and existing status (ACTIVE)
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        role: UserRole.CLIPPER,
        // If status was previously marked SUSPENDED by old revocation logic, ensure it is restored to ACTIVE
        status: managerUser.status === UserStatus.SUSPENDED ? UserStatus.ACTIVE : managerUser.status,
        suspension_reason: managerUser.status === UserStatus.SUSPENDED ? null : managerUser.suspension_reason,
        suspended_at: managerUser.status === UserStatus.SUSPENDED ? null : managerUser.suspended_at,
      },
    });

    // Mark any manager access keys used by this manager as REVOKED
    await prisma.managerAccessKey.updateMany({
      where: { used_by: params.id },
      data: { status: "REVOKED" },
    });

    await logAuditEvent({
      actorId: admin.id,
      action: "MANAGER_REVOKED",
      targetType: "USER",
      targetId: params.id,
      oldValue: { role: "MANAGER" },
      newValue: { role: "CLIPPER", status: updated.status },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign Manager access revoked successfully. Account preserved as a regular Clipper.",
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
      { error: err?.message || "Failed to revoke manager access" },
      { status: 500 }
    );
  }
}
