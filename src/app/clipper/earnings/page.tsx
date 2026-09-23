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

import { clientCache } from "@/lib/clientCache";

export default function ClipperEarningsPage() {
  const [data, setData] = useState<any>(() => clientCache.get("clipper_earnings_payouts"));
  const [userProfile, setUserProfile] = useState<any>(() => clientCache.get("clipper_user_profile"));
  const [chartData, setChartData] = useState<any[]>(() => clientCache.get("clipper_perf_30d") || []);
  const [loading, setLoading] = useState(() => !clientCache.get("clipper_earnings_payouts"));

  // Set Up Payout Method Modal State
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [setupPaymentMethod, setSetupPaymentMethod] = useState("Bank (IBAN)");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [iban, setIban] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [wiseEmail, setWiseEmail] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [setupSuccessMessage, setSetupSuccessMessage] = useState("");
  const [hasSavedDetails, setHasSavedDetails] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("clipearn_payout_details");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.paymentMethod) setSetupPaymentMethod(parsed.paymentMethod);
        if (parsed.accountHolderName) setAccountHolderName(parsed.accountHolderName);
        if (parsed.accountNumber) setAccountNumber(parsed.accountNumber);
        if (parsed.ifscCode) setIfscCode(parsed.ifscCode);
        if (parsed.routingNumber) setRoutingNumber(parsed.routingNumber);
        if (parsed.iban) setIban(parsed.iban);
        if (parsed.swiftCode) setSwiftCode(parsed.swiftCode);
        if (parsed.paypalEmail) setPaypalEmail(parsed.paypalEmail);
        if (parsed.wiseEmail) setWiseEmail(parsed.wiseEmail);
        if (parsed.usdtAddress) setUsdtAddress(parsed.usdtAddress);
        setHasSavedDetails(Boolean(
          parsed.accountNumber || parsed.iban || parsed.paypalEmail || parsed.wiseEmail || parsed.usdtAddress
        ));
      }
    } catch {}
  }, []);

  const handleSavePayoutDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    const details = {
      paymentMethod: setupPaymentMethod,
      accountHolderName,
      accountNumber,
      ifscCode,
      routingNumber,
      iban,
      swiftCode,
      paypalEmail,
      wiseEmail,
      usdtAddress,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem("clipearn_payout_details", JSON.stringify(details));
    } catch {}
    setTimeout(() => {
      setSavingDetails(false);
      setHasSavedDetails(true);
      setSetupSuccessMessage("Payment details saved successfully!");
      setTimeout(() => {
        setSetupSuccessMessage("");
        setIsSetupModalOpen(false);
      }, 1200);
    }, 400);
  };

  const handleDisconnectPayoutDetails = () => {
    try {
      localStorage.removeItem("clipearn_payout_details");
    } catch {}
    setAccountHolderName("");
    setAccountNumber("");
    setIfscCode("");
    setRoutingNumber("");
    setIban("");
    setSwiftCode("");
    setPaypalEmail("");
    setWiseEmail("");
    setUsdtAddress("");
    setHasSavedDetails(false);
    setSetupSuccessMessage("Payment method disconnected.");
    setTimeout(() => {
      setSetupSuccessMessage("");
      setIsSetupModalOpen(false);
    }, 1000);
  };

  const loadData = () => {
    if (!data && !clientCache.get("clipper_earnings_payouts")) {
      setLoading(true);
    }
    Promise.all([
      fetch("/api/payouts").then((res) => res.json()),
      fetch("/api/users/me").then((res) => res.json()),
      fetch("/api/clipper/performance?range=30d").then((res) => res.json()),
    ])
      .then(([payoutsRes, userRes, perfRes]) => {
        if (payoutsRes && !payoutsRes.error) {
          setData(payoutsRes);
          clientCache.set("clipper_earnings_payouts", payoutsRes);
        }
        if (userRes && userRes.data) {
          setUserProfile(userRes.data);
          clientCache.set("clipper_user_profile", userRes.data);
        }
        if (perfRes && perfRes.data) {
          setChartData(perfRes.data);
          clientCache.set("clipper_perf_30d", perfRes.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Primary numbers - ground with real API data, defaulting cleanly to 0
  const grossEarnings = Number(data?.summary?.grossEarnings || 0);
  const totalPaidOut = Number(data?.summary?.totalPaidOut || 0);
  const remainingPayout = Number(data?.summary?.availableBalance || 0);
  const pendingApproval = Number(data?.summary?.pendingApprovalEarnings || 0);

  // Platform Fee (3%)
  const platformFee = grossEarnings * 0.03;
  const netEarnings = grossEarnings - platformFee;

  // Performance numbers
  const activeCampaigns = Number(userProfile?.stats?.campaignsJoined || 0);
  const totalViews = Number(userProfile?.stats?.totalViews || 0);
  const totalSubmissions = Number(userProfile?.stats?.totalClips || 0);
  const approvedClips = Number(userProfile?.stats?.approvedClips || 0);
  const approvalRate = totalSubmissions > 0 ? Math.round((approvedClips / totalSubmissions) * 100) : 0;

  // Recent Payouts list (real payouts or empty array)
  const recentPayoutsList =
    data?.payouts && Array.isArray(data.payouts) && data.payouts.length > 0
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
      : [];

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
          {hasSavedDetails ? (
            <button
              type="button"
              onClick={() => setIsSetupModalOpen(true)}
              className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-cyan hover:underline cursor-pointer group"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="group-hover:text-[#1cf7fd]">Payout Method Connected ({setupPaymentMethod})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSetupModalOpen(true)}
              className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer group"
            >
              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>No Payout Method Connected</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSetupModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-slate-950" />
            <span>Set Up Payout Method</span>
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
              {recentPayoutsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    No payouts recorded yet.
                  </td>
                </tr>
              ) : (
                recentPayoutsList.map((payout: any) => (
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
                ))
              )}
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

      {/* Set Up Payout Method Modal */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-cyan" />
              Set Up Payout Method
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Enter your payment details so we can send you your earnings
            </p>

            {setupSuccessMessage && (
              <div className="mb-4 p-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-xs text-brand-cyan flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{setupSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSavePayoutDetails} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Payment Method
                </label>
                <select
                  value={setupPaymentMethod}
                  onChange={(e) => setSetupPaymentMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                >
                  <option value="Bank (IBAN)">Bank (IBAN)</option>
                  <option value="Bank (US)">Bank (US)</option>
                  <option value="Bank (India)">Bank (India)</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Wise">Wise</option>
                  <option value="USDT (ERC-20)">USDT (ERC-20)</option>
                </select>
              </div>

              {/* Bank (India) Fields */}
              {setupPaymentMethod === "Bank (India)" && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Account Holder Name"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Account Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Account Number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC0001234"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan font-mono uppercase"
                    />
                  </div>
                </>
              )}

              {/* Bank (US) Fields */}
              {setupPaymentMethod === "Bank (US)" && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Routing Number (ACH)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="9-digit Routing Number"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Account Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Account Number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                </>
              )}

              {/* Bank (IBAN) Fields */}
              {setupPaymentMethod === "Bank (IBAN)" && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      IBAN
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="GB33 BUKB 2020 1555 5555 55"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      SWIFT / BIC Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="BUKBGB22"
                      value={swiftCode}
                      onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono uppercase focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                </>
              )}

              {/* PayPal Fields */}
              {setupPaymentMethod === "PayPal" && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      PayPal Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="paypal@example.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                </>
              )}

              {/* Wise Fields */}
              {setupPaymentMethod === "Wise" && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Wise Account Email / Tag
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="wise@example.com"
                      value={wiseEmail}
                      onChange={(e) => setWiseEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                </>
              )}

              {/* USDT (ERC-20) Crypto Fields */}
              {setupPaymentMethod === "USDT (ERC-20)" && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Recipient / Account Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name / Handle"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      USDT (ERC-20) Wallet Address
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="0x71C... (Ethereum Mainnet ERC-20 Address)"
                      value={usdtAddress}
                      onChange={(e) => setUsdtAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan font-mono"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="text-[11px] font-bold text-brand-cyan flex items-center gap-1.5">
                      <span>Network: Ethereum (ERC-20)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ensure your wallet or exchange address supports USDT on Ethereum (ERC-20). Payouts to non-ERC20 networks cannot be recovered.
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                {hasSavedDetails ? (
                  <button
                    type="button"
                    onClick={handleDisconnectPayoutDetails}
                    className="h-9 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors border border-rose-500/20 cursor-pointer"
                  >
                    Disconnect Method
                  </button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSetupModalOpen(false)}
                    className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDetails}
                    className="h-9 px-6 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {savingDetails ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : null}
                    <span>Save Details</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
