import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, SubmissionStatus, ReferralStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { processApprovalInTx, syncSubmissionViews } from "@/lib/earnings/engine";

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

      // Refresh views right away so approved earnings reflect the latest platform count
      try {
        await syncSubmissionViews(updated.id);
      } catch (e) {
        console.warn("Initial sync after approval error:", e);
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Submission approved successfully.",
      });
    } else {
      // REJECT ACTION
      const updated = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "submissions" WHERE id = ${params.id} FOR UPDATE`;
        const locked = await tx.submission.findUniqueOrThrow({ where: { id: params.id } });
        const earningsToRefund = Number(locked.current_earnings) || 0;

        // Reverse accumulated earnings in the ledger (balances/payouts are computed from it)
        // and give the budget back to the campaign.
        if (earningsToRefund > 0) {
          await tx.earningsLedger.create({
            data: {
              user_id: submission.user_id,
              campaign_id: submission.campaign_id,
              submission_id: submission.id,
              event_type: "SUBMISSION_REVOKED",
              views: -locked.eligible_views,
              rate_per_1000: submission.campaign.cpm,
              amount: -earningsToRefund,
            },
          });
          await tx.campaign.update({
            where: { id: submission.campaign_id },
            data: { used_budget: { decrement: earningsToRefund } },
          });
        }

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
