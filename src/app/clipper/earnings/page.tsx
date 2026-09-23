"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  History,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function ClipperEarningsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Request payout modal
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("PAYPAL");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetch("/api/payouts")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError("");
    setRequesting(true);

    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(payoutAmount),
          method: payoutMethod,
          accountDetails: { identifier: accountIdentifier },
        }),
      });
      const resData = await res.json();

      if (res.ok) {
        setPayoutSuccess(true);
        setPayoutAmount("");
        setAccountIdentifier("");
        loadData();
        setTimeout(() => {
          setPayoutSuccess(false);
          setIsPayoutModalOpen(false);
        }, 1500);
      } else {
        setPayoutError(resData.error || "Failed to submit payout request");
      }
    } catch {
      setPayoutError("Network error requesting payout");
    } finally {
      setRequesting(false);
    }
  };

  const summary = data?.summary || {
    grossEarnings: 0,
    platformFeeRate: 3.0,
    platformFeeAmount: 0,
    netEarnings: 0,
    totalPaidOut: 0,
    pendingPayouts: 0,
    availableBalance: 0,
    pendingApprovalEarnings: 0,
    totalApprovedViews: 0,
  };

  const payouts = data?.payouts || [];
  const ledger = data?.ledger || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-brand-cyan" />
            Earnings & Payouts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Auditable revenue breakdown, platform fee calculations, and transaction history.
          </p>
        </div>

        <button
          onClick={() => setIsPayoutModalOpen(true)}
          disabled={summary.availableBalance <= 0}
          className="px-5 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-colors flex items-center gap-2 shadow-[0_0_20px_-3px_rgba(28,247,253,0.3)] self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4" />
          <span>Request Payout (${summary.availableBalance.toFixed(2)})</span>
        </button>
      </div>

      {/* 4 Primary Financial Metric Cards (Rule 38) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL EXPECTED
          </span>
          <div className="text-3xl font-black text-white mt-1">
            ${summary.grossEarnings.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {summary.totalApprovedViews.toLocaleString()} approved views
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            PAID OUT
          </span>
          <div className="text-3xl font-black text-brand-emerald mt-1">
            ${summary.totalPaidOut.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Processed & delivered</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            REMAINING PAYOUT
          </span>
          <div className="text-3xl font-black text-brand-cyan mt-1">
            ${summary.availableBalance.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {summary.pendingPayouts > 0 ? `$${summary.pendingPayouts.toFixed(2)} in processing` : "Available to withdraw"}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            PENDING APPROVAL
          </span>
          <div className="text-3xl font-black text-yellow-400 mt-1">
            ${summary.pendingApprovalEarnings.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Estimated from pending clips</span>
        </div>
      </div>

      {/* Accounting Breakdown Strip */}
      <div className="p-5 rounded-2xl bg-[#0A0F1D] border border-slate-800/80 flex flex-wrap items-center justify-between gap-6 text-xs">
        <div>
          <span className="text-slate-400 block font-medium">Gross Earnings</span>
          <span className="text-base font-bold text-white">${summary.grossEarnings.toFixed(2)}</span>
        </div>

        <div className="text-slate-600 font-black text-base">&minus;</div>

        <div>
          <span className="text-slate-400 block font-medium">
            Platform Fee ({summary.platformFeeRate}%)
          </span>
          <span className="text-base font-bold text-slate-300">
            ${summary.platformFeeAmount.toFixed(2)}
          </span>
        </div>

        <div className="text-slate-600 font-black text-base">=</div>

        <div>
          <span className="text-slate-400 block font-medium">Net Creator Earnings</span>
          <span className="text-base font-bold text-brand-emerald">
            ${summary.netEarnings.toFixed(2)}
          </span>
        </div>

        <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

        <div>
          <span className="text-slate-400 block font-medium">Payout Availability Status</span>
          <span className="text-base font-bold text-brand-cyan">
            {summary.availableBalance > 0 ? "Ready for Payout" : "Minimum Not Met"}
          </span>
        </div>
      </div>

      {/* Tables Layout: Left = Ledger, Right = Payout History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Immutable Earnings Ledger Table (Rule 31) */}
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-cyan" />
                Immutable Earnings Ledger
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Auditable entries</span>
            </div>

            {ledger.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No ledger entries recorded yet. Views synced from approved clips will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                    <tr>
                      <th className="pb-2.5">Campaign</th>
                      <th className="pb-2.5">Eligible Views</th>
                      <th className="pb-2.5">Rate</th>
                      <th className="pb-2.5">Amount</th>
                      <th className="pb-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {ledger.slice(0, 8).map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 pr-2 text-white font-bold max-w-[130px] truncate">
                          {entry.campaignName}
                        </td>
                        <td className="py-2.5 pr-2 text-slate-300">
                          +{entry.views.toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-2 text-slate-400 font-mono">
                          ${entry.ratePer1000.toFixed(2)}
                        </td>
                        <td className="py-2.5 pr-2 text-brand-cyan font-bold">
                          +${entry.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
            <span>Ledger entries are permanent and verified server-side.</span>
          </div>
        </div>

        {/* Payout Requests History */}
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-brand-emerald" />
                Payout History
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Withdrawal requests</span>
            </div>

            {payouts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No payout requests made yet. When your balance reaches the threshold, request payouts here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                    <tr>
                      <th className="pb-2.5">Amount</th>
                      <th className="pb-2.5">Method</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Tx ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {payouts.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 pr-2 font-black text-white">
                          ${Number(p.amount).toFixed(2)}
                        </td>
                        <td className="py-2.5 pr-2 text-slate-300 uppercase text-[10px] font-bold">
                          {p.method}
                        </td>
                        <td className="py-2.5 pr-2">
                          {p.status === "PAID" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30">
                              PAID
                            </span>
                          )}
                          {p.status === "PENDING" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
                              PENDING
                            </span>
                          )}
                          {p.status === "PROCESSING" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              PROCESSING
                            </span>
                          )}
                          {p.status === "FAILED" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                              FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-2 text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(p.requested_at).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 text-[10px] font-mono text-slate-400 max-w-[100px] truncate">
                          {p.transaction_id || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Payouts are typically processed within 24-48 hours.</span>
          </div>
        </div>
      </div>

      {/* Request Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-cyan" />
              Request Payout
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Available balance: <strong className="text-brand-cyan">${summary.availableBalance.toFixed(2)}</strong>. Enter payout destination and amount.
            </p>

            {payoutError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payoutError}</span>
              </div>
            )}

            {payoutSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-xs text-brand-emerald flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Payout request submitted successfully!</span>
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-cyan"
                >
                  <option value="PAYPAL">PayPal (Instant)</option>
                  <option value="WISE">Wise / Bank Transfer</option>
                  <option value="CRYPTO_USDC">Crypto (USDC / ERC-20)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Destination Account (Email or Wallet)
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    payoutMethod === "PAYPAL"
                      ? "paypal@account.com"
                      : payoutMethod === "WISE"
                      ? "IBAN or Wise Tag"
                      : "0x..."
                  }
                  value={accountIdentifier}
                  onChange={(e) => setAccountIdentifier(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1.5">
                  <span>Amount to Withdraw (USD)</span>
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(summary.availableBalance.toFixed(2))}
                    className="text-brand-cyan hover:underline text-[11px]"
                  >
                    Withdraw All (${summary.availableBalance.toFixed(2)})
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  max={summary.availableBalance}
                  min="5"
                  required
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono text-sm focus:outline-none focus:border-brand-cyan"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Minimum payout: $5.00.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="px-5 py-2.5 rounded-xl bg-brand-cyan text-black font-bold text-xs flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  {requesting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : null}
                  <span>Confirm Payout Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
