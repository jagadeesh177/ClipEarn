import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { SubmissionStatus, UserRole } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { appeal_reason } = await request.json();

    if (!appeal_reason || typeof appeal_reason !== "string" || appeal_reason.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a valid appeal explanation (at least 5 characters)." },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        campaign: { select: { id: true, name: true, brand_name: true } },
        social_account: { select: { username: true, platform: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    if (submission.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized. You can only appeal your own submissions." }, { status: 403 });
    }

    if (submission.status !== SubmissionStatus.REJECTED) {
      return NextResponse.json(
        { error: `Only rejected submissions can be appealed. Current status: ${submission.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.update({
        where: { id: params.id },
        data: {
          status: SubmissionStatus.APPEALED,
          appeal_reason: appeal_reason.trim(),
          appealed_at: new Date(),
        },
      });

      // Confirmation notification to clipper
      await tx.notification.create({
        data: {
          user_id: user.id,
          type: "SUBMISSION_APPEALED",
          title: "Appeal Submitted",
          message: `Your appeal for "${submission.campaign.name}" was received and routed to the manager appeals review queue.`,
        },
      });

      // Find active managers/admins to notify
      const managers = await tx.user.findMany({
        where: {
          role: { in: [UserRole.MANAGER, UserRole.ADMIN] },
          status: "ACTIVE",
        },
        select: { id: true },
        take: 5,
      });

      for (const mgr of managers) {
        await tx.notification.create({
          data: {
            user_id: mgr.id,
            type: "APPEAL_SUBMITTED",
            title: "New Clipper Appeal Submitted ⚠️",
            message: `@${user.username} appealed a rejected clip for "${submission.campaign.name}". Reason: ${appeal_reason.trim().substring(0, 100)}`,
          },
        });
      }

      return sub;
    });

    await logAuditEvent({
      actorId: user.id,
      action: "SUBMISSION_APPEALED",
      targetType: "SUBMISSION",
      targetId: submission.id,
      oldValue: { status: SubmissionStatus.REJECTED, rejection_reason: submission.rejection_reason },
      newValue: { status: SubmissionStatus.APPEALED, appeal_reason: appeal_reason.trim() },
    });

    return NextResponse.json({ success: true, submission: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to submit appeal" }, { status: 500 });
  }
}
