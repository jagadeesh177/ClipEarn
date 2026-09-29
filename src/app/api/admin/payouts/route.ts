import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, PayoutStatus, SubmissionStatus, Prisma } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

/**
 * GET /api/admin/payouts
 * Returns all campaign-clipper payout eligibility items and payout history.
 * Restricted to ADMIN only.
 */
export async function GET() {
  try {
    const admin = await requireRole([UserRole.ADMIN]);

    // 1. Fetch all campaigns with approved submissions and payouts
    const [campaigns, allPayouts] = await Promise.all([
      prisma.campaign.findMany({
        orderBy: { created_at: "desc" },
        include: {
          submissions: {
            where: { status: SubmissionStatus.APPROVED },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  payout_account: {
                    select: {
                      id: true,
                      provider: true,
                      account_reference: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
          payouts: {
            orderBy: { requested_at: "desc" },
            include: {
              user: {
                select: { id: true, username: true, email: true },
              },
              processor: {
                select: { id: true, username: true },
              },
            },
          },
        },
      }),
      prisma.payout.findMany({
        orderBy: { created_at: "desc" },
        include: {
          user: { select: { id: true, username: true, email: true } },
          campaign: { select: { id: true, name: true, brand_name: true } },
          processor: { select: { id: true, username: true } },
          payment_account: { select: { provider: true, account_reference: true } },
        },
      }),
    ]);

    // 2. Build list of eligibility items by campaign & clipper
    const eligibilityItems: any[] = [];

    for (const camp of campaigns) {
      const minViews = camp.minimum_views_for_payout || 0;
      const cpm = Number(camp.cpm);

      // Group submissions by user
      const userSubsMap = new Map<string, { user: any; approvedViews: number; earnings: number }>();

      for (const sub of camp.submissions) {
        const existing = userSubsMap.get(sub.user_id) || {
          user: sub.user,
          approvedViews: 0,
          earnings: 0,
        };
        existing.approvedViews += sub.current_views;
        existing.earnings += Number(sub.current_earnings);
        userSubsMap.set(sub.user_id, existing);
      }

      // Check existing payout for this campaign
      for (const [userId, stats] of userSubsMap) {
        const isEligibleByViews = minViews > 0 ? stats.approvedViews >= minViews : true;
        const hasPaymentProfile = !!stats.user.payout_account;

        // Find latest payout for this campaign and user
        const existingPayout = camp.payouts.find((p) => p.user_id === userId);

        let payoutStatus = "NOT_ELIGIBLE";
        if (existingPayout) {
          payoutStatus = existingPayout.status;
        } else if (isEligibleByViews && hasPaymentProfile) {
          payoutStatus = "ELIGIBLE";
        } else if (isEligibleByViews && !hasPaymentProfile) {
          payoutStatus = "ELIGIBLE_NO_PAYMENT_DETAILS";
        }

        eligibilityItems.push({
          campaignId: camp.id,
          campaignName: camp.name,
          brandName: camp.brand_name,
          cpm,
          minViews,
          userId: stats.user.id,
          username: stats.user.username,
          email: stats.user.email,
          approvedViews: stats.approvedViews,
          earnings: stats.earnings,
          isEligible: isEligibleByViews,
          hasPaymentProfile,
          paymentAccount: stats.user.payout_account
            ? {
                provider: stats.user.payout_account.provider,
                accountReference: stats.user.payout_account.account_reference,
              }
            : null,
          payoutStatus,
          existingPayout: existingPayout
            ? {
                id: existingPayout.id,
                amount: Number(existingPayout.amount),
                status: existingPayout.status,
                transactionId: existingPayout.transaction_id,
                paidAt: existingPayout.paid_at,
                processedAt: existingPayout.processed_at,
              }
            : null,
        });
      }
    }

    return NextResponse.json({
      data: {
        eligibilityItems,
        payoutHistory: allPayouts.map((p) => ({
          id: p.id,
          campaignId: p.campaign_id,
          campaignName: p.campaign?.name || "General Payout",
          userId: p.user_id,
          username: p.user.username,
          amount: Number(p.amount),
          currency: p.currency,
          method: p.method,
          accountReference: p.payment_account?.account_reference || (p.account_details as any)?.accountReference || "—",
          status: p.status,
          transactionId: p.transaction_id,
          failureReason: p.failure_reason,
          requestedAt: p.requested_at,
          paidAt: p.paid_at,
          processedAt: p.processed_at,
          processedBy: p.processor?.username || "Admin",
        })),
      },
    });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }
    return NextResponse.json({ error: err?.message || "Failed to fetch payouts" }, { status: 500 });
  }
}

/**
 * POST /api/admin/payouts
 * Admin initiates a payout for an eligible clipper.
 * Transitions to PROCESSING state.
 */
export async function POST(request: Request) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);
    const body = await request.json();
    const { campaignId, userId } = body;

    if (!campaignId || !userId) {
      return NextResponse.json(
        { error: "campaignId and userId are required to initiate payment." },
        { status: 400 }
      );
    }

    // Server-side verification
    const [campaign, user, userAccount, existingPayouts] = await Promise.all([
      prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          submissions: {
            where: {
              user_id: userId,
              status: SubmissionStatus.APPROVED,
            },
          },
        },
      }),
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.payoutAccount.findUnique({ where: { user_id: userId } }),
      prisma.payout.findMany({
        where: {
          campaign_id: campaignId,
          user_id: userId,
          status: { in: [PayoutStatus.PAID, PayoutStatus.PROCESSING, PayoutStatus.PENDING] },
        },
      }),
    ]);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (!userAccount) {
      return NextResponse.json(
        { error: "Cannot process payout: Clipper has not entered their payment details yet." },
        { status: 400 }
      );
    }

    if (existingPayouts.length > 0) {
      const active = existingPayouts[0];
      return NextResponse.json(
        { error: `A payout is already ${active.status} for this clipper on this campaign (ID: ${active.id}).` },
        { status: 400 }
      );
    }

    const totalApprovedViews = campaign.submissions.reduce(
      (sum, s) => sum + s.current_views,
      0
    );
    const minViews = campaign.minimum_views_for_payout || 0;

    if (minViews > 0 && totalApprovedViews < minViews) {
      return NextResponse.json(
        { error: `Clipper has not reached the minimum payout threshold (${totalApprovedViews.toLocaleString()} / ${minViews.toLocaleString()} views).` },
        { status: 400 }
      );
    }

    // Recalculate amount strictly server-side
    const calculatedEarnings = campaign.submissions.reduce(
      (sum, s) => sum + Number(s.current_earnings),
      0
    );

    if (calculatedEarnings <= 0) {
      return NextResponse.json(
        { error: "Calculated payout amount is $0.00." },
        { status: 400 }
      );
    }

    // Create payout record with PROCESSING status
    const payout = await prisma.$transaction(async (tx) => {
      const record = await tx.payout.create({
        data: {
          user_id: userId,
          campaign_id: campaignId,
          payment_account_id: userAccount.id,
          amount: new Prisma.Decimal(calculatedEarnings),
          currency: "USD",
          method: userAccount.provider,
          status: PayoutStatus.PROCESSING,
          processed_by: admin.id,
          requested_at: new Date(),
        },
      });

      // Notify the clipper
      await tx.notification.create({
        data: {
          user_id: userId,
          type: "PAYOUT_PROCESSING",
          title: "Payout Initiated 💸",
          message: `Your payout of $${calculatedEarnings.toFixed(2)} for campaign "${campaign.name}" is now processing via ${userAccount.provider}.`,
        },
      });

      return record;
    });

    await logAuditEvent({
      actorId: admin.id,
      action: "ADMIN_PAYOUT_INITIATED",
      targetType: "PAYOUT",
      targetId: payout.id,
      newValue: {
        campaignId,
        userId,
        amount: calculatedEarnings,
        method: userAccount.provider,
        accountReference: userAccount.account_reference,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payout initiated and transitioned to PROCESSING.",
      payout,
    });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }
    return NextResponse.json({ error: err?.message || "Failed to initiate payout" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/payouts
 * Admin confirms successful payment or marks it failed.
 */
export async function PATCH(request: Request) {
  try {
    const admin = await requireRole([UserRole.ADMIN]);
    const body = await request.json();
    const { payoutId, action, transactionId, failureReason } = body;

    if (!payoutId || !action) {
      return NextResponse.json({ error: "payoutId and action are required." }, { status: 400 });
    }

    const existing = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { campaign: true, user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payout not found." }, { status: 404 });
    }

    if (action === "CONFIRM_PAID") {
      const updated = await prisma.$transaction(async (tx) => {
        const p = await tx.payout.update({
          where: { id: payoutId },
          data: {
            status: PayoutStatus.PAID,
            paid_at: new Date(),
            processed_at: new Date(),
            transaction_id: transactionId?.trim() || `TXN-${Date.now().toString(36).toUpperCase()}`,
            processed_by: admin.id,
            failure_reason: null,
          },
        });

        await tx.notification.create({
          data: {
            user_id: existing.user_id,
            type: "PAYOUT_COMPLETED",
            title: "Payout Received! 💰",
            message: `Your payout of $${Number(existing.amount).toFixed(2)} for "${existing.campaign?.name || 'ClipEarn'}" has been paid! (Ref: ${p.transaction_id})`,
          },
        });

        return p;
      });

      await logAuditEvent({
        actorId: admin.id,
        action: "ADMIN_PAYOUT_COMPLETED",
        targetType: "PAYOUT",
        targetId: payoutId,
        oldValue: { status: existing.status },
        newValue: { status: PayoutStatus.PAID, transactionId: updated.transaction_id },
      });

      return NextResponse.json({
        success: true,
        message: "Payout confirmed as PAID.",
        payout: updated,
      });
    } else if (action === "MARK_FAILED") {
      if (!failureReason || !failureReason.trim()) {
        return NextResponse.json(
          { error: "A failure reason is mandatory when marking payout as failed." },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const p = await tx.payout.update({
          where: { id: payoutId },
          data: {
            status: PayoutStatus.FAILED,
            failure_reason: failureReason.trim(),
            processed_at: new Date(),
            processed_by: admin.id,
          },
        });

        await tx.notification.create({
          data: {
            user_id: existing.user_id,
            type: "PAYOUT_FAILED",
            title: "Payout Issue ⚠️",
            message: `Your payout of $${Number(existing.amount).toFixed(2)} could not be processed. Reason: ${failureReason.trim()}. Please update your payment details.`,
          },
        });

        return p;
      });

      await logAuditEvent({
        actorId: admin.id,
        action: "ADMIN_PAYOUT_FAILED",
        targetType: "PAYOUT",
        targetId: payoutId,
        oldValue: { status: existing.status },
        newValue: { status: PayoutStatus.FAILED, failureReason: failureReason.trim() },
      });

      return NextResponse.json({
        success: true,
        message: "Payout marked as FAILED.",
        payout: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action. Use CONFIRM_PAID or MARK_FAILED." }, { status: 400 });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }
    return NextResponse.json({ error: err?.message || "Failed to update payout" }, { status: 500 });
  }
}
