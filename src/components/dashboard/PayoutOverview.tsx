"use client";

import React from "react";
import Link from "next/link";
import {
  CreditCard,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";

interface PayoutOverviewProps {
  portalType: "admin" | "manager";
  totalBudget?: number;
  usedBudget?: number;
  remainingBudget?: number;
  pendingPayoutAmount?: number;
  pendingPayoutCount?: number;
  paidOutAmount?: number;
  paidOutCount?: number;
  qualifiedClippersCount?: number;
}

export function PayoutOverview({
  portalType,
  totalBudget = 0,
  usedBudget = 0,
  remainingBudget = 0,
  pendingPayoutAmount = 0,
  pendingPayoutCount = 0,
  paidOutAmount = 0,
  paidOutCount = 0,
  qualifiedClippersCount = 0,
}: PayoutOverviewProps) {
  if (portalType === "admin") {
    const budgetPercent =
      totalBudget > 0 ? Math.min(100, Math.round((usedBudget / totalBudget) * 100)) : 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Platform Budget Card */}
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Platform Campaign Budgets
            </h3>
            <DollarSign className="w-4 h-4 text-brand-cyan" />
          </div>

          <div>
            <div className="text-3xl font-black text-white font-mono">
              ${Number(totalBudget || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex justify-between">
              <span>Used: ${Number(usedBudget || 0).toFixed(2)}</span>
              <span className="font-bold text-amber-400">{budgetPercent}%</span>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${budgetPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80 text-slate-400">
            <span>Remaining Budget:</span>
            <span className="font-bold text-emerald-400 font-mono">
              ${Number(remainingBudget || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payout Processing Summary */}
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Settlement & Payout Status
            </h3>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Pending Payouts</span>
              <div className="text-xl font-black text-amber-400 font-mono">
                ${Number(pendingPayoutAmount || 0).toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                {pendingPayoutCount} clippers awaiting
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Completed Payouts</span>
              <div className="text-xl font-black text-emerald-400 font-mono">
                ${Number(paidOutAmount || 0).toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                {paidOutCount} settled
              </span>
            </div>
          </div>

          <Link
            href="/admin/payouts"
            className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <span>Review & Disburse Payouts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // Manager Payout Overview (Strictly read-only qualification for assigned campaigns)
  return (
    <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-base font-bold text-white">Payout Qualification Overview</h3>
            <p className="text-xs text-slate-400">
              Clipper qualification metrics for your assigned campaigns
            </p>
          </div>
        </div>

        <Link
          href="/manager/payouts"
          className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition"
        >
          <span>View Detailed Eligibility</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">
            Qualified Clippers (View Threshold Met)
          </span>
          <div className="text-2xl font-black text-white font-mono">
            {qualifiedClippersCount}
          </div>
          <p className="text-[11px] text-purple-300 font-medium">
            Eligible for administrative disbursement
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Financial execution and bank transfers are processed centrally by Platform Administrators. Campaign Managers can monitor qualification statuses and progress milestones.
          </p>
        </div>
      </div>
    </div>
  );
}
