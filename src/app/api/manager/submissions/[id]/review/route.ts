import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, SubmissionStatus, ReferralStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { syncSubmissionViews } from "@/lib/earnings/engine";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const manager = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
    const { action, rejection_reason, verified_views } = await request.json();

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

    if (action === "APPROVE") {
      const parsedVerifiedViews =
        verified_views !== undefined && verified_views !== null && !isNaN(Number(verified_views))
          ? Math.max(0, parseInt(String(verified_views), 10))
          : null;

      const updated = await prisma.$transaction(async (tx) => {
        const sub = await tx.submission.update({
          where: { id: params.id },
          data: {
            status: SubmissionStatus.APPROVED,
            reviewed_at: new Date(),
            reviewed_by: manager.id,
            rejection_reason: null,
            ...(parsedVerifiedViews !== null ? { current_views: parsedVerifiedViews } : {}),
          },
        });

        if (parsedVerifiedViews !== null) {
          await tx.viewSnapshot.create({
            data: {
              submission_id: sub.id,
              views: parsedVerifiedViews,
              likes: sub.current_likes || 0,
              comments: sub.current_comments || 0,
            },
          });
        }

        // Check if this approval qualifies a referral (Rule 41: At least one submission approved)
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

          // Reward notification to referrer
          await tx.notification.create({
            data: {
              user_id: pendingReferral.referrer_id,
              type: "REFERRAL_QUALIFIED",
              title: "Qualified Referral! 🎉",
              message: `Your referral @${submission.user.username} just had their first clip approved!`,
            },
          });
        }

        // Notification to clipper
        await tx.notification.create({
          data: {
            user_id: submission.user_id,
            type: isAppeal ? "APPEAL_ACCEPTED" : "SUBMISSION_APPROVED",
            title: isAppeal ? "Appeal Accepted! Clip Approved 🎉" : "Clip Approved! 🎉",
            message: isAppeal
              ? `Your appeal for "${submission.campaign.name}" was accepted by staff! Your clip is now actively tracking views and earnings.`
              : `Your submission for "${submission.campaign.name}" was approved by a manager and is now actively tracking views and earnings!`,
          },
        });

        return sub;
      });

      await logAuditEvent({
        actorId: manager.id,
        action: isAppeal ? "APPEAL_APPROVED" : "SUBMISSION_APPROVED",
        targetType: "SUBMISSION",
        targetId: submission.id,
        oldValue: { status: submission.status, appeal_reason: submission.appeal_reason },
        newValue: { status: SubmissionStatus.APPROVED },
      });

      // Trigger initial view snapshot and sync
      try {
        await syncSubmissionViews(updated.id);
      } catch (e) {
        console.warn("Initial sync after approval error:", e);
      }

      return NextResponse.json({ success: true, submission: updated });
    } else {
      // REJECT
      const updated = await prisma.$transaction(async (tx) => {
        const sub = await tx.submission.update({
          where: { id: params.id },
          data: {
            status: SubmissionStatus.REJECTED,
            reviewed_at: new Date(),
            reviewed_by: manager.id,
            rejection_reason,
            eligible_views: 0,
            current_earnings: 0,
          },
        });

        // Notification to clipper
        await tx.notification.create({
          data: {
            user_id: submission.user_id,
            type: isAppeal ? "APPEAL_REJECTED" : "SUBMISSION_REJECTED",
            title: isAppeal ? "Appeal Denied" : "Submission Not Approved",
            message: isAppeal
              ? `Your appeal for "${submission.campaign.name}" was reviewed and rejected. Final reason: ${rejection_reason}`
              : `Your clip for "${submission.campaign.name}" was rejected. Reason: ${rejection_reason}`,
          },
        });

        return sub;
      });

      await logAuditEvent({
        actorId: manager.id,
        action: isAppeal ? "APPEAL_REJECTED" : "SUBMISSION_REJECTED",
        targetType: "SUBMISSION",
        targetId: submission.id,
        oldValue: { status: submission.status, appeal_reason: submission.appeal_reason },
        newValue: { status: SubmissionStatus.REJECTED, reason: rejection_reason },
      });

      return NextResponse.json({ success: true, submission: updated });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to review submission" }, { status: 500 });
  }
}
