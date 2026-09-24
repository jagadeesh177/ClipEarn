import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * GET /api/admin/managers
 * Admin-only: list all active Campaign Managers and previously revoked managers.
 */
export async function GET() {
  try {
    await requireRole([UserRole.ADMIN]);

    // 1. Fetch all users who currently have role = MANAGER
    const activeManagers = await prisma.user.findMany({
      where: {
        role: UserRole.MANAGER,
      },
      select: {
        id: true,
        username: true,
        email: true,
        discord_id: true,
        avatar_url: true,
        role: true,
        status: true,
        created_at: true,
        last_login_at: true,
        used_manager_access_keys: {
          select: {
            id: true,
            key_preview: true,
            status: true,
            used_at: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
          take: 1,
        },
        _count: {
          select: {
            campaigns_created: true,
            submissions_reviewed: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // 2. Fetch all users who are not Admins, are currently CLIPPERS, but either:
    //    - Have used a manager access key
    //    - Or have a MANAGER_REVOKED audit log
    const [revokedUsersWithKeys, auditLogs] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: UserRole.CLIPPER,
          used_manager_access_keys: {
            some: {},
          },
        },
        select: {
          id: true,
          username: true,
          email: true,
          discord_id: true,
          avatar_url: true,
          role: true,
          status: true,
          created_at: true,
          last_login_at: true,
          used_manager_access_keys: {
            select: {
              id: true,
              key_preview: true,
              status: true,
              used_at: true,
              created_at: true,
            },
            orderBy: { created_at: "desc" },
            take: 1,
          },
          _count: {
            select: {
              campaigns_created: true,
              submissions_reviewed: true,
            },
          },
        },
        orderBy: { updated_at: "desc" },
      }),
      prisma.auditLog.findMany({
        where: {
          action: { in: ["MANAGER_REVOKED", "MANAGER_RESTORED"] },
          target_type: "USER",
        },
        select: {
          target_id: true,
        },
      }),
    ]);

    const auditTargetIds = auditLogs
      .map((l) => l.target_id)
      .filter((id): id is string => Boolean(id));

    let auditUsers: any[] = [];
    if (auditTargetIds.length > 0) {
      auditUsers = await prisma.user.findMany({
        where: {
          id: { in: auditTargetIds },
          role: UserRole.CLIPPER,
        },
        select: {
          id: true,
          username: true,
          email: true,
          discord_id: true,
          avatar_url: true,
          role: true,
          status: true,
          created_at: true,
          last_login_at: true,
          used_manager_access_keys: {
            select: {
              id: true,
              key_preview: true,
              status: true,
              used_at: true,
              created_at: true,
            },
            orderBy: { created_at: "desc" },
            take: 1,
          },
          _count: {
            select: {
              campaigns_created: true,
              submissions_reviewed: true,
            },
          },
        },
      });
    }

    const managerMap = new Map<string, any>();

    for (const m of activeManagers) {
      managerMap.set(m.id, {
        id: m.id,
        username: m.username,
        email: m.email,
        discord_id: m.discord_id,
        avatar_url: m.avatar_url,
        role: m.role,
        status: m.status,
        managerAccessStatus: "ACTIVE", // Active Campaign Manager
        last_login_at: m.last_login_at,
        created_at: m.created_at,
        key_preview: m.used_manager_access_keys[0]?.key_preview || null,
        campaigns_count: m._count.campaigns_created,
        submissions_reviewed_count: m._count.submissions_reviewed,
      });
    }

    for (const m of [...revokedUsersWithKeys, ...auditUsers]) {
      if (!managerMap.has(m.id)) {
        managerMap.set(m.id, {
          id: m.id,
          username: m.username,
          email: m.email,
          discord_id: m.discord_id,
          avatar_url: m.avatar_url,
          role: m.role,
          status: m.status,
          managerAccessStatus: "REVOKED", // Manager access was revoked; user is a regular Clipper
          last_login_at: m.last_login_at,
          created_at: m.created_at,
          key_preview: m.used_manager_access_keys[0]?.key_preview || null,
          campaigns_count: m._count.campaigns_created,
          submissions_reviewed_count: m._count.submissions_reviewed,
        });
      }
    }

    const managersList = Array.from(managerMap.values());

    return NextResponse.json({
      success: true,
      data: managersList,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }
    return NextResponse.json(
      { error: err?.message || "Failed to fetch managers" },
      { status: 500 }
    );
  }
}
