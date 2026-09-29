import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, SubmissionStatus, ReferralStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { processApprovalInTx } from "@/lib/earnings/engine";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);
    const { action, rejection_reason } = await request.json();

    if (!action || (action !== "APPROVE" && action !== "REJECT")) {
      return NextResponse.json({ error: "Invalid action. Must be APPROVE or REJECT." }, { status: 400 });
    }

    if (action === "REJECT" && (!rejection_reason || rejection_reason.trim().length === 0)) {
      return NextResponse.json({ error: "A rejection reason is mandatory when rejecting clips." }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        campaign: true,
        user: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const isAppeal = submission.status === SubmissionStatus.APPEALED;
    const wasApproved = submission.status === SubmissionStatus.APPROVED;

    if (action === "APPROVE") {
      const updated = await prisma.$transaction(async (tx) => {
        const { submission: sub } = await processApprovalInTx(tx, params.id, admin.id);

        // Check if this approval qualifies a referral (At least one submission approved)
        const pendingReferral = await tx.referral.findUnique({
          where: { referred_user_id: submission.user_id },
        });

        if (pendingReferral && pendingReferral.status === ReferralStatus.PENDING) {
          await tx.referral.update({
            where: { id: pendingReferral.id },
            data: {
              status: ReferralStatus.QUALIFIED,
              qualified_at: new Date(),
            },
          });
        }

        return sub;
      });

      await logAuditEvent({
        actorId: admin.id,
        action: isAppeal ? "APPEAL_APPROVED" : "SUBMISSION_APPROVED",
        targetType: "SUBMISSION",
        targetId: submission.id,
        oldValue: { status: submission.status, views: submission.current_views },
        newValue: { status: SubmissionStatus.APPROVED },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Submission approved successfully.",
      });
    } else {
      // REJECT ACTION
      const updated = await prisma.$transaction(async (tx) => {
        const sub = await tx.submission.update({
          where: { id: params.id },
          data: {
            status: SubmissionStatus.REJECTED,
            reviewed_at: new Date(),
            reviewed_by: admin.id,
            rejection_reason: rejection_reason.trim(),
            eligible_views: 0,
            current_earnings: 0,
          },
        });

        if (wasApproved) {
          const totalRemainingEarnings = await tx.submission.aggregate({
            where: { campaign_id: submission.campaign_id, status: SubmissionStatus.APPROVED },
            _sum: { current_earnings: true },
          });

          await tx.campaign.update({
            where: { id: submission.campaign_id },
            data: { used_budget: totalRemainingEarnings._sum.current_earnings || 0 },
          });
        }

        return sub;
      });

      await logAuditEvent({
        actorId: admin.id,
        action: isAppeal ? "APPEAL_REJECTED" : "SUBMISSION_REJECTED",
        targetType: "SUBMISSION",
        targetId: submission.id,
        oldValue: { status: submission.status },
        newValue: { status: SubmissionStatus.REJECTED, reason: rejection_reason.trim() },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Submission rejected.",
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to review submission" },
      { status: 500 }
    );
  }
}
