import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole, PayoutStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    await requireRole([UserRole.MANAGER, UserRole.ADMIN]);

    const payouts = await prisma.payout.findMany({
      orderBy: { requested_at: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            discord_id: true,
          },
        },
      },
    });

    const formatted = payouts.map((p) => ({
      id: p.id,
      userId: p.user_id,
      username: p.user.username,
      email: p.user.email,
      amount: Number(p.amount),
      currency: p.currency,
      method: p.method,
      status: p.status,
      transactionId: p.transaction_id,
      failureReason: p.failure_reason,
      requestedAt: p.requested_at,
      processedAt: p.processed_at,
    }));

    return NextResponse.json({ data: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch payouts" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const manager = await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
    const { payoutId, status, transactionId, failureReason } = await request.json();

    if (!payoutId || !status) {
      return NextResponse.json({ error: "Payout ID and status are required." }, { status: 400 });
    }

    const existing = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payout not found." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: status as PayoutStatus,
          transaction_id: transactionId || existing.transaction_id,
          failure_reason: failureReason || null,
          processed_at: status === PayoutStatus.PAID || status === PayoutStatus.FAILED ? new Date() : null,
        },
      });

      // Notify user
      const isPaid = status === PayoutStatus.PAID;
      await tx.notification.create({
        data: {
          user_id: p.user_id,
          type: isPaid ? "PAYOUT_PROCESSED" : "PAYOUT_FAILED",
          title: isPaid ? "Payout Completed! 💰" : "Payout Failed",
          message: isPaid
            ? `Your payout of $${Number(p.amount).toFixed(2)} via ${p.method} was processed with Transaction ID: ${transactionId || "N/A"}.`
            : `Your payout request was rejected. Reason: ${failureReason || "Verification issue"}`,
        },
      });

      return p;
    });

    await logAuditEvent({
      actorId: manager.id,
      action: `PAYOUT_${status}`,
      targetType: "PAYOUT",
      targetId: payoutId,
      oldValue: { status: existing.status },
      newValue: { status, transactionId },
    });

    return NextResponse.json({ success: true, payout: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to process payout" }, { status: 500 });
  }
}
