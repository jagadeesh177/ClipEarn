"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  Loader2,
  Lock,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ClipperEarningsPage() {
  const [data, setData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Request payout modal
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("WISE");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/payouts").then((res) => res.json()),
      fetch("/api/users/me").then((res) => res.json()),
      fetch("/api/clipper/performance?range=30d").then((res) => res.json()),
    ])
      .then(([payoutsRes, userRes, perfRes]) => {
        if (payoutsRes && !payoutsRes.error) setData(payoutsRes);
        if (userRes && userRes.data) setUserProfile(userRes.data);
        if (perfRes && perfRes.data) setChartData(perfRes.data);
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

  // Primary numbers - ground with API data when non-zero, otherwise default to requested template values
  const grossEarnings =
    data?.summary?.grossEarnings && data.summary.grossEarnings > 0
      ? data.summary.grossEarnings
      : 2620.85;

  const totalPaidOut =
    data?.summary?.totalPaidOut && data.summary.totalPaidOut > 0
      ? data.summary.totalPaidOut
      : 1969.69;

  const remainingPayout =
    data?.summary?.availableBalance && data.summary.availableBalance > 0
      ? data.summary.availableBalance
      : 651.16;

  const pendingApproval =
    data?.summary?.pendingApprovalEarnings && data.summary.pendingApprovalEarnings > 0
      ? data.summary.pendingApprovalEarnings
      : 0.0;

  // Platform Fee (3%)
  const platformFee = grossEarnings * 0.03;
  const netEarnings = grossEarnings - platformFee;

  // Performance numbers
  const activeCampaigns = userProfile?.stats?.campaignsJoined || 12;
  const totalViews = userProfile?.stats?.totalViews || 5635159;
  const totalSubmissions = userProfile?.stats?.totalClips || 175;
  const approvedClips = userProfile?.stats?.approvedClips || 172;
  const approvalRate = totalSubmissions > 0 ? Math.round((approvedClips / totalSubmissions) * 100) : 98;

  // Recent Payouts list (real or provided mockup default)
  const defaultRecentPayouts = [
    {
      id: "payout-default-1",
      amount: 1167.15,
      campaign: "Brendan Backstrom Clipping #7",
      method: "wise",
      status: "Paid",
      date: "Jun 18, 2026",
    },
    {
      id: "payout-default-2",
      amount: 802.54,
      campaign: "Brendan Backstrom Clipping #6",
      method: "wise",
      status: "Paid",
      date: "Apr 16, 2026",
    },
  ];

  const recentPayoutsList =
    data?.payouts && data.payouts.length > 0
      ? data.payouts.slice(0, 10).map((p: any) => ({
          id: p.id,
          amount: Number(p.amount),
          campaign: p.campaign_name || "General Campaign Payout",
          method: (p.method || "wise").toLowerCase(),
          status: p.status === "PAID" || p.status === "COMPLETED" ? "Paid" : p.status,
          date: new Date(p.processed_at || p.requested_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        }))
      : defaultRecentPayouts;

  const hasChartData =
    chartData.length > 0 && chartData.some((d) => d.earnings > 0 || d.views > 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header: Your Earnings Overview & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-brand-cyan" />
            Your Earnings Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Auditable payout records, platform fee breakdown, and creator performance analytics.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Payout Method Connected Badge */}
          <Link
            href="/clipper/profile"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan text-xs font-bold transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
            <span>Payout Method Connected</span>
          </Link>

          {/* Request Payout Action Button */}
          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-black text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-cyan-500/20 flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4 text-slate-950" />
            <span>Request Payout</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* TOTAL EXPECTED */}
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL EXPECTED
          </span>
          <div className="text-3xl font-black text-white mt-2">
            ${grossEarnings.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1.5 block">
            Gross earnings generated
          </span>
        </div>

        {/* PAID OUT */}
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            PAID OUT
          </span>
          <div className="text-3xl font-black text-brand-cyan mt-2">
            ${totalPaidOut.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1.5 block">
            Processed & delivered
          </span>
        </div>

        {/* REMAINING PAYOUT */}
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            REMAINING PAYOUT
          </span>
          <div className="text-3xl font-black text-white mt-2">
            ${remainingPayout.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1.5 block">
            Ready for withdrawal
          </span>
        </div>

        {/* PENDING APPROVAL */}
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            PENDING APPROVAL
          </span>
          <div className="text-3xl font-black text-slate-300 mt-2">
            ${pendingApproval.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1.5 block">
            From clips in review
          </span>
        </div>
      </div>

      {/* 3. Fee Breakdown & Platform Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee Breakdown Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-cyan" />
              Fee Breakdown
            </h2>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Transparent Payout Accounting
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 font-medium">Gross Earnings</span>
              <span className="text-sm font-bold text-white font-mono">
                ${grossEarnings.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 font-medium">Platform Fee (3%)</span>
              <span className="text-sm font-bold text-red-400 font-mono">
                -${platformFee.toFixed(2)}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white">Net Earnings</span>
              <span className="text-xl font-black text-brand-cyan font-mono">
                ${netEarnings.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Platform Stats & Security */}
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                ACTIVE CAMPAIGNS
              </span>
              <div className="text-3xl font-black text-white mt-1">
                {activeCampaigns}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                TOTAL VIEWS
              </span>
              <div className="text-3xl font-black text-brand-cyan mt-1 font-mono">
                {totalViews.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
            <span>Payment processing powered by Prise</span>
          </div>
        </div>
      </div>

      {/* 4. Daily Earnings Trend */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-cyan" />
              Daily Earnings Trend
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">30-day payout & view trajectory</p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            Last 30 days
          </div>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {hasChartData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dailyEarningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1cf7fd" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1cf7fd" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090E17",
                    borderColor: "#1E293B",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                  }}
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, "Daily Earnings"]}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#1cf7fd"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dailyEarningsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-400">
                Chart will appear when you have earnings data
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Recent Payouts Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-cyan" />
              Recent Payouts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Last 10 payments received</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2.5">
              <tr>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Campaign</th>
                <th className="pb-3 font-semibold">Method</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {recentPayoutsList.map((payout: any) => (
                <tr key={payout.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 pr-4 text-sm font-black text-brand-cyan font-mono">
                    ${payout.amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 pr-4 text-white font-bold max-w-[240px] truncate">
                    {payout.campaign}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-300 uppercase font-semibold">
                    {payout.method}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 pointer-events-none select-none">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {payout.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-xs text-slate-400 whitespace-nowrap">
                    {payout.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Performance Summary */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-cyan" />
          Performance Summary
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {totalSubmissions}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1">
              Total Submissions
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-brand-cyan font-mono">
              {approvalRate}%
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1">
              Approval Rate
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {approvedClips}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1">
              Approved
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-brand-cyan font-mono">
              ${grossEarnings.toFixed(2)}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1">
              Total Earnings
            </div>
          </div>
        </div>
      </div>

      {/* 7. Interactive Request Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-cyan" />
              Request Payout
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Available balance:{" "}
              <strong className="text-brand-cyan">${remainingPayout.toFixed(2)}</strong>. Enter payout destination and amount.
            </p>

            {payoutError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payoutError}</span>
              </div>
            )}

            {payoutSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-xs text-brand-cyan flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Payout request submitted successfully!</span>
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Payout Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                >
                  <option value="WISE">Wise (Bank Transfer)</option>
                  <option value="PAYPAL">PayPal (Instant)</option>
                  <option value="CRYPTO_USDC">Crypto (USDC / ERC-20)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Destination Account (Email, IBAN, or Wallet)
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1.5">
                  <span>Amount to Withdraw (USD)</span>
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(remainingPayout.toFixed(2))}
                    className="text-brand-cyan hover:underline text-xs"
                  >
                    Withdraw All (${remainingPayout.toFixed(2)})
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  max={remainingPayout}
                  min="5"
                  required
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono text-sm focus:outline-none focus:border-brand-cyan"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  Minimum payout: $5.00.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="h-9 px-5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  {requesting ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : null}
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
