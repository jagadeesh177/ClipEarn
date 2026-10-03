import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
    const { searchParams } = new URL(request.url);
    const parsedLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;

    const logs = await prisma.auditLog.findMany({
      // Managers only see their own actions; the full platform log is admin-only
      where: user.role === UserRole.ADMIN ? {} : { actor_id: user.id },
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

    return NextResponse.json({ data: logs });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch audit logs" }, { status: 500 });
  }
}
