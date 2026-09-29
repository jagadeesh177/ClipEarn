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
  ArrowRight,
  Info,
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
  const [payoutsData, setPayoutsData] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/clipper/payouts").then((res) => res.json()),
      fetch("/api/users/me").then((res) => res.json()),
      fetch("/api/clipper/performance?range=30d").then((res) => res.json()),
    ])
      .then(([payoutsRes, userRes, perfRes]) => {
        if (payoutsRes?.data) {
          setPayoutsData(payoutsRes.data);
        }
        if (userRes?.data) {
          setUserProfile(userRes.data);
        }
        if (perfRes?.data) {
          setChartData(perfRes.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const campaignEarnings = payoutsData?.campaignEarnings || [];
  const paymentHistory = payoutsData?.paymentHistory || [];
  const hasPaymentDetails = payoutsData?.hasPaymentDetails;
  const paymentProfile = payoutsData?.paymentProfile;

  // Calculate high-level financial totals strictly from real campaign earnings and payouts
  const totalApprovedEarnings = campaignEarnings.reduce(
    (sum: number, c: any) => sum + Number(c.earnings || 0),
    0
  );

  const totalPaidOut = paymentHistory
    .filter((p: any) => p.status === "PAID")
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const totalProcessing = paymentHistory
    .filter((p: any) => p.status === "PROCESSING" || p.status === "PENDING")
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const eligibleUnpaid = campaignEarnings
    .filter((c: any) => c.payoutStatus === "ELIGIBLE")
    .reduce((sum: number, c: any) => sum + Number(c.earnings || 0), 0);

  // Performance numbers
  const activeCampaigns = Number(userProfile?.stats?.campaignsJoined || campaignEarnings.length || 0);
  const totalViews = Number(userProfile?.stats?.totalViews || 0);
  const totalSubmissions = Number(userProfile?.stats?.totalClips || 0);
  const approvedClips = Number(userProfile?.stats?.approvedClips || 0);
  const approvalRate = totalSubmissions > 0 ? Math.round((approvedClips / totalSubmissions) * 100) : 0;

  const hasChartData =
    chartData.length > 0 && chartData.some((d) => d.earnings > 0 || d.views > 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header: Earnings & Payout Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-brand-cyan" />
            Your Earnings & Payouts
          </h1>
          {hasPaymentDetails ? (
            <Link
              href="/clipper/payment-details"
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cyan hover:underline group"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="group-hover:text-[#1cf7fd]">
                Payout Method Connected: {paymentProfile?.provider} ({paymentProfile?.accountReference})
              </span>
            </Link>
          ) : (
            <Link
              href="/clipper/payment-details"
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 group"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>No payout method connected &bull; Click to configure payment details</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/clipper/payment-details"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 hover:scale-[1.02] active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-slate-950" />
            <span>Manage Payment Details</span>
          </Link>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* TOTAL APPROVED EARNINGS */}
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            APPROVED EARNINGS
          </span>
          <div className="text-3xl font-black text-white mt-2">
            ${totalApprovedEarnings.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1.5 block">
            From verified & approved views
          </span>
        </div>

        {/* PAID OUT */}
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            PAID OUT
          </span>
          <div className="text-3xl font-black text-emerald-400 mt-2">
            ${totalPaidOut.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1.5 block">
            Processed & delivered to account
          </span>
        </div>

        {/* IN PROCESSING */}
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            IN PROCESSING
          </span>
          <div className="text-3xl font-black text-blue-400 mt-2">
            ${totalProcessing.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1.5 block">
            Queued for disbursement
          </span>
        </div>

        {/* ELIGIBLE UNPAID */}
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            ELIGIBLE UNPAID
          </span>
          <div className="text-3xl font-black text-brand-cyan mt-2">
            ${eligibleUnpaid.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1.5 block">
            Threshold met &bull; ready for payout
          </span>
        </div>
      </div>

      {/* 3. Campaign Earnings & Real Payout Status Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-cyan" />
              Campaign Earnings & Payout Status
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown by campaign based strictly on verified views and minimum payout thresholds.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            {campaignEarnings.length} Campaigns
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/30">
                <th className="py-3 px-3">Campaign</th>
                <th className="py-3 px-3 text-right">Approved Views</th>
                <th className="py-3 px-3 text-right">Threshold</th>
                <th className="py-3 px-3 text-right">CPM</th>
                <th className="py-3 px-3 text-right">Accrued Earned</th>
                <th className="py-3 px-3 text-center">Payout Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-cyan mb-2" />
                    Loading campaign earnings...
                  </td>
                </tr>
              ) : campaignEarnings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    You have not submitted clips to any campaigns yet. Browse active campaigns to start earning.
                  </td>
                </tr>
              ) : (
                campaignEarnings.map((camp: any) => {
                  const neededViews = Math.max(0, camp.minimumViews - camp.approvedViews);

                  return (
                    <tr key={camp.campaignId} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">{camp.campaignName}</div>
                        <div className="text-[11px] text-slate-400">{camp.brandName}</div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-brand-cyan">
                        {camp.approvedViews.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                        {camp.minimumViews > 0 ? camp.minimumViews.toLocaleString() : "None"}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                        ${camp.cpm.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-black text-white text-sm">
                        ${camp.earnings.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {camp.payoutStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Paid</span>
                          </span>
                        ) : camp.payoutStatus === "PROCESSING" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing</span>
                          </span>
                        ) : camp.payoutStatus === "ELIGIBLE" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Eligible for Payout</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{neededViews > 0 ? `Needs ${neededViews.toLocaleString()} views` : "Not Eligible"}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Complete Payment History Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-cyan" />
              Disbursement Payment History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Permanent record of payments dispatched to your account</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/30">
                <th className="py-3 px-3">Campaign</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Transaction ID</th>
                <th className="py-3 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {paymentHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    No payment disbursements recorded yet.
                  </td>
                </tr>
              ) : (
                paymentHistory.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 text-white font-bold">{p.campaignName}</td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-400 text-sm">
                      ${p.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === "PAID"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : p.status === "PROCESSING"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400 text-xs">
                      {p.transactionId}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(p.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Daily Earnings Trend Chart */}
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
              Approved Clips
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-brand-cyan font-mono">
              ${totalApprovedEarnings.toFixed(2)}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1">
              Total Earned
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
