import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { SubmissionStatus, UserRole } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        campaign: { select: { id: true, name: true, used_budget: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    // Allow user to delete their own submission, or managers/admins
    const isOwner = submission.user_id === user.id;
    const isStaff = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { error: "Unauthorized. You can only delete your own submissions." },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Remove linked view snapshots
      await tx.viewSnapshot.deleteMany({
        where: { submission_id: submission.id },
      });

      // 2. Remove any linked fraud flags
      await tx.fraudFlag.deleteMany({
        where: { submission_id: submission.id },
      });

      // 3. If submission was approved and had earnings, restore campaign budget
      if (
        submission.status === SubmissionStatus.APPROVED &&
        Number(submission.current_earnings) > 0
      ) {
        await tx.campaign.update({
          where: { id: submission.campaign_id },
          data: {
            used_budget: {
              decrement: submission.current_earnings,
            },
          },
        });
      }

      // 4. Delete the submission
      await tx.submission.delete({
        where: { id: submission.id },
      });
    });

    await logAuditEvent({
      actorId: user.id,
      action: "SUBMISSION_DELETED",
      targetType: "SUBMISSION",
      targetId: submission.id,
      oldValue: {
        campaign_id: submission.campaign_id,
        platform: submission.platform,
        post_url: submission.post_url,
        status: submission.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully. You can now re-submit to the correct campaign.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete submission" },
      { status: 500 }
    );
  }
}
