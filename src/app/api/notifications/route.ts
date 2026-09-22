import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: {
          user_id: user.id,
          read_at: null,
        },
      }),
    ]);

    return NextResponse.json({
      data: notifications,
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const { notificationId, markAll } = await request.json();

    if (markAll) {
      await prisma.notification.updateMany({
        where: { user_id: user.id, read_at: null },
        data: { read_at: new Date() },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId, user_id: user.id },
        data: { read_at: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update notifications" }, { status: 500 });
  }
}
