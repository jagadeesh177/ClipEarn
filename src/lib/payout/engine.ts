import { prisma } from "@/lib/prisma";
import { PayoutStatus, Prisma, SubmissionStatus } from "@prisma/client";

export interface ClipperEarningsSummary {
  grossEarnings: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  netEarnings: number;
  totalPaidOut: number;
  pendingPayouts: number;
  availableBalance: number;
  pendingApprovalEarnings: number;
  totalApprovedViews: number;
  totalSubmissions: number;
  approvedSubmissions: number;
}

export async function getClipperEarningsSummary(userId: string): Promise<ClipperEarningsSummary> {
  const feePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "3.0");

  // Sum all earnings from the immutable ledger
  const ledgerAggregate = await prisma.earningsLedger.aggregate({
    where: { user_id: userId },
    _sum: {
      amount: true,
      views: true,
    },
  });

  const grossEarnings = Number(ledgerAggregate._sum.amount || 0);
  const totalApprovedViews = Number(ledgerAggregate._sum.views || 0);

  // Platform fee calculation
  const platformFeeAmount = Math.round((grossEarnings * (feePercentage / 100)) * 100) / 100;
  const netEarnings = Math.max(0, grossEarnings - platformFeeAmount);

  // Payout aggregations
  const payouts = await prisma.payout.findMany({
    where: { user_id: userId },
  });

  let totalPaidOut = 0;
  let pendingPayouts = 0;

  for (const p of payouts) {
    const amt = Number(p.amount);
    if (p.status === PayoutStatus.PAID) {
      totalPaidOut += amt;
    } else if (p.status === PayoutStatus.PENDING || p.status === PayoutStatus.PROCESSING) {
      pendingPayouts += amt;
    }
  }

  const availableBalance = Math.max(0, netEarnings - totalPaidOut - pendingPayouts);

  // Estimated pending earnings (from pending submissions)
  const pendingSubmissions = await prisma.submission.findMany({
    where: {
      user_id: userId,
      status: SubmissionStatus.PENDING,
    },
    include: {
      campaign: true,
    },
  });

  let pendingApprovalEarnings = 0;
  for (const s of pendingSubmissions) {
    // Estimating pending based on current view count and campaign cpm
    if (s.current_views > 0) {
      pendingApprovalEarnings += (s.current_views / 1000) * Number(s.campaign.cpm);
    }
  }

  const submissionCounts = await prisma.submission.groupBy({
    by: ["status"],
    where: { user_id: userId },
    _count: true,
  });

  let totalSubmissions = 0;
  let approvedSubmissions = 0;
  for (const group of submissionCounts) {
    totalSubmissions += group._count;
    if (group.status === SubmissionStatus.APPROVED) {
      approvedSubmissions = group._count;
    }
  }

  return {
    grossEarnings,
    platformFeeRate: feePercentage,
    platformFeeAmount,
    netEarnings,
    totalPaidOut,
    pendingPayouts,
    availableBalance,
    pendingApprovalEarnings,
    totalApprovedViews,
    totalSubmissions,
    approvedSubmissions,
  };
}

export async function requestPayout(
  userId: string,
  amount: number,
  method: string,
  accountDetails?: any
) {
  if (amount <= 0) {
    throw new Error("Payout amount must be greater than zero");
  }

  return await prisma.$transaction(async (tx) => {
    // Calculate current available balance within the transaction
    const ledgerAgg = await tx.earningsLedger.aggregate({
      where: { user_id: userId },
      _sum: { amount: true },
    });

    const feePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "3.0");
    const gross = Number(ledgerAgg._sum.amount || 0);
    const fee = Math.round((gross * (feePercentage / 100)) * 100) / 100;
    const net = Math.max(0, gross - fee);

    const userPayouts = await tx.payout.findMany({
      where: {
        user_id: userId,
        status: { in: [PayoutStatus.PAID, PayoutStatus.PROCESSING, PayoutStatus.PENDING] },
      },
    });

    const reserved = userPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
    const available = Math.max(0, net - reserved);

    if (amount > available) {
      throw new Error(`Insufficient funds. Available balance: $${available.toFixed(2)}`);
    }

    const payout = await tx.payout.create({
      data: {
        user_id: userId,
        amount: new Prisma.Decimal(amount),
        currency: "USD",
        method,
        account_details: accountDetails || null,
        status: PayoutStatus.PENDING,
      },
    });

    // Create notification
    await tx.notification.create({
      data: {
        user_id: userId,
        type: "PAYOUT_REQUESTED",
        title: "Payout Requested",
        message: `Your payout request of $${amount.toFixed(2)} via ${method} has been submitted for review.`,
      },
    });

    return payout;
  });
}
