import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireRole([UserRole.ADMIN]);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      action: log.action,
      targetType: log.target_type,
      targetId: log.target_id,
      oldValue: log.old_value,
      newValue: log.new_value,
      ipAddress: log.ip_address,
      createdAt: log.created_at,
      actorUsername: log.actor?.username || "System",
      actorRole: log.actor?.role || "SYSTEM",
    }));

    return NextResponse.json({ data: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch admin audit logs" }, { status: 500 });
  }
}
