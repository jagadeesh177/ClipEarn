import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
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

    return NextResponse.json({ data: logs });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch audit logs" }, { status: 500 });
  }
}
