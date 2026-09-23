import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, UserStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/admin/managers/[id]/revoke
 * Admin-only: immediately revokes a Campaign Manager by user ID.
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

    if (managerUser.role !== UserRole.MANAGER && managerUser.status === UserStatus.SUSPENDED) {
      return NextResponse.json({ error: "Manager is already revoked" }, { status: 400 });
    }

    // Demote role and suspend status to immediately invalidate sessions and block Discord login
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        role: UserRole.CLIPPER,
        status: UserStatus.SUSPENDED,
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
      newValue: { status: "SUSPENDED", role: "CLIPPER" },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign Manager access revoked successfully.",
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
      { error: err?.message || "Failed to revoke manager" },
      { status: 500 }
    );
  }
}
