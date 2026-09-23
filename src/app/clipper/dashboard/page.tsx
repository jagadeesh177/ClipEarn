"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  CheckCircle2,
  DollarSign,
  Compass,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink,
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

export default function ClipperDashboardPage() {
  const [userProfile, setUserProfile] = useState<any>(() => clientCache.get("clipper_user_profile"));
  const [performanceRange, setPerformanceRange] = useState<"7d" | "30d" | "90d">("30d");
  const [chartData, setChartData] = useState<any[]>(() => clientCache.get("clipper_perf_30d") || []);
  const [loading, setLoading] = useState(() => !clientCache.get("clipper_user_profile"));

  useEffect(() => {
    const cachedPerf = clientCache.get(`clipper_perf_${performanceRange}`);
    if (cachedPerf) {
      setChartData(cachedPerf);
    }

    Promise.all([
      fetch("/api/users/me").then((res) => res.json()),
      fetch(`/api/clipper/performance?range=${performanceRange}`).then((res) => res.json()),
    ])
      .then(([profileRes, perfRes]) => {
        if (profileRes.data) {
          setUserProfile(profileRes.data);
          clientCache.set("clipper_user_profile", profileRes.data);
        }
        if (perfRes.data) {
          setChartData(perfRes.data);
          clientCache.set(`clipper_perf_${performanceRange}`, perfRes.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [performanceRange]);

  const stats = userProfile?.stats || {
    totalViews: 0,
    eligibleViews: 0,
    totalEarnings: 0,
    totalClips: 0,
    approvedClips: 0,
    campaignsJoined: 0,
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Welcome back, <span className="text-brand-cyan">{userProfile?.username || "Clipper"}</span>!
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here's an overview of your clipping performance and revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/clipper/campaigns"
            className="px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-brand-cyan/90 text-black font-bold text-xs transition-colors flex items-center gap-2 shadow-[0_0_20px_-3px_rgba(28,247,253,0.3)]"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Campaigns</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs font-semibold text-slate-400">Total Submissions</div>
            <div className="text-3xl font-black text-white mt-1">{stats.totalClips}</div>
            <div className="text-[11px] text-slate-500 mt-1">Clips uploaded</div>
          </div>
          <div className="text-blue-400/80 p-2" aria-hidden="true">
            <Video className="w-7 h-7 stroke-[1.75]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs font-semibold text-slate-400">Approved</div>
            <div className="text-3xl font-black text-brand-cyan mt-1">{stats.approvedClips}</div>
            <div className="text-[11px] text-slate-500 mt-1">Actively generating views</div>
          </div>
          <div className="text-brand-cyan/80 p-2" aria-hidden="true">
            <CheckCircle2 className="w-7 h-7 stroke-[1.75]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs font-semibold text-slate-400">Total Earnings</div>
            <div className="text-3xl font-black text-brand-cyan mt-1">
              ${stats.totalEarnings.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Available via ledger</div>
          </div>
          <div className="text-emerald-400/80 p-2" aria-hidden="true">
            <DollarSign className="w-7 h-7 stroke-[1.75]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs font-semibold text-slate-400">Active Campaigns</div>
            <div className="text-3xl font-black text-purple-400 mt-1">{stats.campaignsJoined}</div>
            <div className="text-[11px] text-slate-500 mt-1">Joined & eligible</div>
          </div>
          <div className="text-purple-400/80 p-2" aria-hidden="true">
            <Compass className="w-7 h-7 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* Performance Analytics Chart */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 leading-snug">
              <TrendingUp className="w-5 h-5 text-brand-cyan shrink-0" aria-hidden="true" />
              <span>Earnings & Views Velocity</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verified views and earnings snapshots captured every 8 hours.
            </p>
          </div>

          {/* Time range selector: 7d, 30d, 90d vertically aligned */}
          <div
            role="group"
            aria-label="Time range selector"
            className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold self-start sm:self-center"
          >
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={performanceRange === r}
                onClick={() => setPerformanceRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  performanceRange === r
                    ? "bg-brand-cyan text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Last {r}
              </button>
            ))}
          </div>
        </div>

        {/* Chart render or clean empty state */}
        <div className="h-72 w-full">
          {chartData.length > 0 && chartData.some((d) => d.earnings > 0 || d.views > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1cf7fd" stopOpacity={0.4} />
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
                  formatter={(val: any, name: string) => [
                    name === "earnings" ? `$${Number(val).toFixed(2)}` : val.toLocaleString(),
                    name === "earnings" ? "Earnings" : "Eligible Views",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#1cf7fd"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#earningsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <TrendingUp className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-400">
                Your earnings chart will appear once your approved clips start generating views.
              </p>
              <Link
                href="/clipper/campaigns"
                className="mt-3 text-xs text-brand-cyan hover:underline font-semibold"
              >
                Join an active campaign to start earning &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
