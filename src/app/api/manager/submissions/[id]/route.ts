import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const manager = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
    const { views, likes, comments } = await request.json();

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: { campaign: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const dataToUpdate: Record<string, any> = {};
    if (views !== undefined && !isNaN(Number(views))) {
      dataToUpdate.current_views = Math.max(0, parseInt(String(views), 10));
    }
    if (likes !== undefined && !isNaN(Number(likes))) {
      dataToUpdate.current_likes = Math.max(0, parseInt(String(likes), 10));
    }
    if (comments !== undefined && !isNaN(Number(comments))) {
      dataToUpdate.current_comments = Math.max(0, parseInt(String(comments), 10));
    }

    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.update({
        where: { id: params.id },
        data: dataToUpdate,
      });

      if (views !== undefined) {
        await tx.viewSnapshot.create({
          data: {
            submission_id: sub.id,
            views: sub.current_views,
            likes: sub.current_likes || 0,
            comments: sub.current_comments || 0,
          },
        });
      }

      return sub;
    });

    await logAuditEvent({
      actorId: manager.id,
      action: "SUBMISSION_METRICS_MANUAL_UPDATE",
      targetType: "SUBMISSION",
      targetId: submission.id,
      oldValue: {
        views: submission.current_views,
        likes: submission.current_likes,
        comments: submission.current_comments,
      },
      newValue: dataToUpdate,
    });

    return NextResponse.json({ success: true, submission: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update submission" }, { status: 500 });
  }
}
