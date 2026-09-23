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
            className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
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

      {/* Budget & Financial Solvency Strip */}
      <div className="p-6 rounded-2xl bg-[#0A0F1D] border border-slate-800/80">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-brand-emerald" />
          Financial & Campaign Budget Health
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-xs block">Combined Campaign Budget</span>
            <div className="text-2xl font-black text-white mt-1">
              ${data.totalBudget.toLocaleString()}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Contracted brand funds</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-xs block">Budget Utilized (Accrued)</span>
            <div className="text-2xl font-black text-brand-cyan mt-1">
              ${data.usedBudget.toFixed(2)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              ${data.remainingBudget.toFixed(2)} remaining pool
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-xs block">Pending Payout Queue</span>
            <div className="text-2xl font-black text-purple-400 mt-1">
              ${data.pendingPayoutAmount.toFixed(2)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              ${data.paidOutAmount.toFixed(2)} already paid out
            </span>
          </div>
        </div>

        {/* Global Budget Utilization Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Total Budget Absorption:</span>
              <span className="px-2 py-0.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan font-bold text-xs">
                {data.totalBudget > 0
                  ? Math.round((data.usedBudget / data.totalBudget) * 100)
                  : 0}
                %
              </span>
            </div>
            <span className="text-slate-400 text-xs font-medium">
              ${data.usedBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${data.totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-cyan to-brand-emerald rounded-full transition-all duration-500"
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

      {/* Quick Action Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/manager/submissions"
          className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-brand-cyan transition-colors">
              Review Submissions
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Verify published clip links, inspect video requirements, and approve or reject submissions.
            </p>
          </div>
        </Link>

        <Link
          href="/manager/campaigns"
          className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-brand-cyan transition-colors">
              Campaign Management
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Launch new campaigns, modify active CPM rates, pause budgets, or export brand CSV reports.
            </p>
          </div>
        </Link>

        <Link
          href="/manager/payouts"
          className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
              Process Payouts
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Review clipper withdrawal requests, attach transaction references, and mark as completed.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
