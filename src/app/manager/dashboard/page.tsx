"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Users,
  Video,
  Clock,
  DollarSign,
  TrendingUp,
  CreditCard,
  FileCheck,
  Plus,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function ManagerDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/manager/analytics")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setAnalytics(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const data = analytics || {
    activeCampaignsCount: 0,
    totalClippersCount: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    approvedSubmissions: 0,
    totalViews: 0,
    eligibleViews: 0,
    totalBudget: 0,
    usedBudget: 0,
    remainingBudget: 0,
    totalEarnings: 0,
    pendingPayoutAmount: 0,
    paidOutAmount: 0,
    avgViewsPerClip: 0,
    avgEarningsPerClip: 0,
  };

  const formatCurrency = (val: number) =>
    (val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">Campaign Manager Hub</h1>
          <p className="text-sm text-slate-400 mt-1">
            Platform-wide campaign budgets, submissions queue, and financial solvency monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 sm:pt-0.5">
          <Link
            href="/manager/submissions"
            className="px-4 py-2.5 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/30 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-yellow-400" />
            <span>Pending Reviews ({data.pendingReviews})</span>
          </Link>

          <Link
            href="/manager/campaigns/create"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-black font-black text-xs transition-opacity hover:opacity-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-semibold text-slate-400 block">
            Active Campaigns
          </span>
          <div className="text-3xl font-black text-white mt-1">{data.activeCampaignsCount}</div>
          <span className="text-xs text-slate-400 mt-1 block">Live creator budgets</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-semibold text-slate-400 block">
            Pending Clip Reviews
          </span>
          <div className="text-3xl font-black text-yellow-400 mt-1">{data.pendingReviews}</div>
          <span className="text-xs text-slate-400 mt-1 block">Awaiting human approval</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-semibold text-slate-400 block">
            Total UGC Clippers
          </span>
          <div className="text-3xl font-black text-brand-cyan mt-1">{data.totalClippersCount}</div>
          <span className="text-xs text-slate-400 mt-1 block">Registered creators</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-semibold text-slate-400 block">
            Total Views Delivered
          </span>
          <div className="text-3xl font-black text-brand-emerald mt-1">
            {data.totalViews.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {data.eligibleViews.toLocaleString()} eligible
          </span>
        </div>
      </div>

      {/* Budget & Financial Solvency Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-brand-emerald" />
          Financial & Campaign Budget Health
        </h2>

        {/* 3 Stat columns aligned with page grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 text-xs block">Combined Campaign Budget</span>
            <div className="text-2xl font-black text-white mt-1">
              ${data.totalBudget.toLocaleString()}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Contracted brand funds</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 text-xs block">Budget Utilized (Accrued)</span>
            <div className="text-2xl font-black text-brand-cyan mt-1">
              ${formatCurrency(data.usedBudget)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              ${formatCurrency(data.remainingBudget)} remaining pool
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 text-xs block">Pending Payout Queue</span>
            <div className="text-2xl font-black text-purple-400 mt-1">
              ${formatCurrency(data.pendingPayoutAmount)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              ${formatCurrency(data.paidOutAmount)} already paid out
            </span>
          </div>
        </div>

        {/* Global Budget Utilization Bar */}
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Total Budget Absorption:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan font-bold text-xs">
                {data.totalBudget > 0
                  ? Math.round((data.usedBudget / data.totalBudget) * 100)
                  : 0}
                %
              </span>
            </div>
            <span className="text-slate-400 text-xs font-medium">
              ${formatCurrency(data.usedBudget)} / ${data.totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-brand-cyan rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(28,247,253,0.3)]"
              style={{
                width: `${
                  data.totalBudget > 0
                    ? Math.min(100, (data.usedBudget / data.totalBudget) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Panels (High-Density) */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Quick Actions</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/manager/submissions"
            className="p-4 rounded-xl bg-[#0F141F] border border-slate-800 hover:border-yellow-500/40 hover:bg-slate-900/60 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">
                  Review Submissions
                </h3>
                <span className="text-xs text-yellow-400/90 font-medium">
                  {data.pendingReviews} pending approval
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/manager/campaigns"
            className="p-4 rounded-xl bg-[#0F141F] border border-slate-800 hover:border-brand-cyan/40 hover:bg-slate-900/60 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">
                  Campaign Management
                </h3>
                <span className="text-xs text-brand-cyan/90 font-medium">
                  {data.activeCampaignsCount} active budgets
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/manager/payouts"
            className="p-4 rounded-xl bg-[#0F141F] border border-slate-800 hover:border-purple-500/40 hover:bg-slate-900/60 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Process Payouts
                </h3>
                <span className="text-xs text-purple-300/90 font-medium">
                  ${formatCurrency(data.pendingPayoutAmount)} queue
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
