"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Compass,
  Users,
  CreditCard,
  DollarSign,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (res.ok && json.data) {
        setAnalytics(json.data);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-xs font-semibold text-slate-400">Loading platform-wide performance data...</p>
      </div>
    );
  }

  const budgetPercent =
    analytics?.totalBudget > 0
      ? Math.min(100, Math.round((analytics.usedBudget / analytics.totalBudget) * 100))
      : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">Platform Overview</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
              GLOBAL SOURCE OF TRUTH
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time aggregate performance derived strictly from approved clipper submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition text-xs font-bold flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin/campaigns/create"
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-400/10"
          >
            <PlusCircle className="w-4 h-4" />
            Create Campaign
          </Link>
        </div>
      </div>

      {/* PLATFORM-WIDE APPROVED SOCIAL METRICS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Approved Social Metrics (Approved Submissions Only)
          </h2>
          <span className="text-[11px] text-slate-500">Live platform totals</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Total Approved Views */}
          <div className="p-5 rounded-2xl bg-[#0D131D] border border-amber-500/30 relative overflow-hidden space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Approved Views</span>
              <Eye className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {(analytics?.totalApprovedViews || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-amber-400/80 font-medium">Verified platform views</p>
          </div>

          {/* Total Approved Likes */}
          <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Approved Likes</span>
              <Heart className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {(analytics?.totalApprovedLikes || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500">Across approved clips</p>
          </div>

          {/* Total Approved Comments */}
          <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Approved Comments</span>
              <MessageSquare className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {(analytics?.totalApprovedComments || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500">Across approved clips</p>
          </div>

          {/* Total Approved Shares */}
          <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Approved Shares</span>
              <Share2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {(analytics?.totalApprovedShares || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500">Across approved clips</p>
          </div>

          {/* Total Approved Saves */}
          <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Approved Saves</span>
              <Bookmark className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {(analytics?.totalApprovedSaves || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500">Across approved clips</p>
          </div>
        </div>
      </div>

      {/* PLATFORM OPERATIONS & FINANCIALS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Platform Budget Card */}
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Platform Budget
            </h3>
            <DollarSign className="w-4 h-4 text-brand-cyan" />
          </div>

          <div>
            <div className="text-3xl font-black text-white">
              ${(analytics?.totalBudget || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex justify-between">
              <span>Budget Used: ${(analytics?.usedBudget || 0).toFixed(2)}</span>
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
            <span>Remaining Capacity:</span>
            <span className="font-bold text-emerald-400">
              ${(analytics?.remainingBudget || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payout Processing Card */}
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Clipper Payout Status
            </h3>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Pending Payouts</span>
              <div className="text-xl font-black text-amber-400">
                ${(analytics?.pendingPayoutAmount || 0).toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                {analytics?.pendingPayoutCount || 0} clippers awaiting
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Completed Payouts</span>
              <div className="text-xl font-black text-emerald-400">
                ${(analytics?.paidOutAmount || 0).toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                {analytics?.paidOutCount || 0} successfully paid
              </span>
            </div>
          </div>

          <Link
            href="/admin/payouts"
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition flex items-center justify-center gap-1.5"
          >
            Review & Process Payouts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Platform Ecosystem Card */}
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Ecosystem Activity
            </h3>
            <Users className="w-4 h-4 text-purple-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Active Campaigns</span>
              <div className="text-2xl font-black text-white">
                {analytics?.totalActiveCampaigns || 0}
              </div>
              <span className="text-[10px] text-slate-500">
                {analytics?.totalCampaigns || 0} total campaigns
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Registered Clippers</span>
              <div className="text-2xl font-black text-white">
                {analytics?.totalClippers || 0}
              </div>
              <span className="text-[10px] text-slate-500">Active creators</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Submission Review Pipeline</span>
            <span className="font-bold text-amber-400">
              {analytics?.pendingReviews || 0} clips in queue
            </span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BANNER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#0D131D] to-[#0D131D] border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Admin Control Hub</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Create new campaigns, manage campaign manager invitations, and process payout batches for clippers who have achieved their view milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/campaigns"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition"
          >
            Manage Campaigns
          </Link>
          <Link
            href="/admin/payouts"
            className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold text-emerald-400 transition"
          >
            Payout Center
          </Link>
          <Link
            href="/admin/managers"
            className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-xs font-bold text-purple-300 transition"
          >
            Managers & Access Keys
          </Link>
        </div>
      </div>
    </div>
  );
}
