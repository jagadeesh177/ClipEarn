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
  ChevronRight,
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

export default function ClipperDashboardPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [performanceRange, setPerformanceRange] = useState<"7d" | "30d" | "90d">("30d");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/users/me").then((res) => res.json()),
      fetch("/api/submissions").then((res) => res.json()),
      fetch(`/api/clipper/performance?range=${performanceRange}`).then((res) => res.json()),
    ])
      .then(([profileRes, subRes, perfRes]) => {
        if (profileRes.data) setUserProfile(profileRes.data);
        if (subRes.data) setSubmissions(subRes.data);
        if (perfRes.data) setChartData(perfRes.data);
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
            Welcome back, {userProfile?.username || "Clipper"}!
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
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Submissions</div>
            <div className="text-3xl font-black text-white mt-1">{stats.totalClips}</div>
            <div className="text-[11px] text-slate-500 mt-1">Clips uploaded</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Video className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved</div>
            <div className="text-3xl font-black text-brand-emerald mt-1">{stats.approvedClips}</div>
            <div className="text-[11px] text-slate-500 mt-1">Actively generating views</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Earnings</div>
            <div className="text-3xl font-black text-brand-cyan mt-1">
              ${stats.totalEarnings.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Available via ledger</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Campaigns</div>
            <div className="text-3xl font-black text-purple-400 mt-1">{stats.campaignsJoined}</div>
            <div className="text-[11px] text-slate-500 mt-1">Joined & eligible</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Compass className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Performance Analytics Chart */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-cyan" />
              Earnings & Views Velocity
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified views and earnings snapshots captured every 8 hours.
            </p>
          </div>

          {/* Time range selector: 7d, 30d, 90d */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setPerformanceRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  performanceRange === r
                    ? "bg-brand-cyan text-black"
                    : "text-slate-400 hover:text-white"
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

      {/* Recent Submissions Overview */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Clip Submissions</h2>
          <Link
            href="/clipper/submissions"
            className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1"
          >
            View all ({submissions.length}) <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {submissions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Video className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">No submissions yet.</p>
            <p className="mt-1">Join a campaign and submit your first short-form video to start earning.</p>
            <Link
              href="/clipper/campaigns"
              className="mt-4 inline-block px-4 py-2 rounded-xl bg-slate-800 text-brand-cyan font-bold"
            >
              Browse Campaigns
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-3">Campaign</th>
                  <th className="pb-3">Platform</th>
                  <th className="pb-3">Current Views</th>
                  <th className="pb-3">Eligible Views</th>
                  <th className="pb-3">Earnings</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {submissions.slice(0, 5).map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 pr-3 text-white font-bold max-w-[180px] truncate">
                      {sub.campaign_name}
                    </td>
                    <td className="py-3.5 pr-3 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold">
                        {sub.platform}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 text-slate-200">
                      {sub.status === "PENDING" ? (
                        <span className="text-slate-500 italic">Pending review</span>
                      ) : (
                        sub.current_views.toLocaleString()
                      )}
                    </td>
                    <td className="py-3.5 pr-3 text-slate-200">
                      {sub.status === "APPROVED" ? sub.eligible_views.toLocaleString() : "—"}
                    </td>
                    <td className="py-3.5 pr-3 font-bold text-brand-cyan">
                      {sub.status === "APPROVED" ? `$${sub.current_earnings.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3.5">
                      {sub.status === "APPROVED" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30">
                          APPROVED
                        </span>
                      )}
                      {sub.status === "PENDING" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
                          PENDING
                        </span>
                      )}
                      {sub.status === "REJECTED" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                          REJECTED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
