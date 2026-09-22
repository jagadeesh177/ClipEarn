"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Flame, Medal, Sparkles, Filter } from "lucide-react";

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"all" | "30d" | "7d">("all");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setLeaderboard(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-yellow-400" />
            Global Clipper Leaderboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Top short-form creators ranked strictly by approved eligible views delivered to campaigns.
          </p>
        </div>

        {/* Time period filter */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0F141F] border border-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {(["all", "30d", "7d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                period === p ? "bg-brand-cyan text-black" : "text-slate-400 hover:text-white"
              }`}
            >
              {p === "all" ? "All-Time" : p === "30d" ? "Last 30 Days" : "Last 7 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* #2 Silver */}
          <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 flex flex-col items-center text-center relative order-2 md:order-1">
            <div className="w-10 h-10 rounded-full bg-slate-300/20 text-slate-300 border border-slate-400/40 flex items-center justify-center font-black text-sm mb-3">
              #2
            </div>
            <img
              src={leaderboard[1].avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${leaderboard[1].username}`}
              alt="Avatar"
              className="w-16 h-16 rounded-full border-2 border-slate-400 mb-3 bg-slate-800"
            />
            <h3 className="text-base font-bold text-white">{leaderboard[1].username}</h3>
            <div className="text-lg font-black text-brand-cyan mt-1">
              {leaderboard[1].eligibleViews.toLocaleString()} views
            </div>
            <div className="text-xs text-brand-emerald font-bold mt-0.5">
              ${leaderboard[1].earnings.toFixed(2)} earned
            </div>
          </div>

          {/* #1 Gold */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#162032] to-[#0F141F] border-2 border-yellow-400/50 shadow-[0_0_30px_-5px_rgba(250,204,21,0.2)] flex flex-col items-center text-center relative order-1 md:order-2 transform md:-translate-y-2">
            <div className="w-12 h-12 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black text-base mb-3 shadow-lg shadow-yellow-400/30">
              #1
            </div>
            <img
              src={leaderboard[0].avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${leaderboard[0].username}`}
              alt="Avatar"
              className="w-20 h-20 rounded-full border-2 border-yellow-400 mb-3 bg-slate-800"
            />
            <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
              <span>{leaderboard[0].username}</span>
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </h3>
            <div className="text-2xl font-black text-brand-cyan mt-1">
              {leaderboard[0].eligibleViews.toLocaleString()} views
            </div>
            <div className="text-sm text-brand-emerald font-black mt-0.5">
              ${leaderboard[0].earnings.toFixed(2)} earned
            </div>
          </div>

          {/* #3 Bronze */}
          <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 flex flex-col items-center text-center relative order-3">
            <div className="w-10 h-10 rounded-full bg-amber-600/20 text-amber-500 border border-amber-600/40 flex items-center justify-center font-black text-sm mb-3">
              #3
            </div>
            <img
              src={leaderboard[2].avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${leaderboard[2].username}`}
              alt="Avatar"
              className="w-16 h-16 rounded-full border-2 border-amber-600 mb-3 bg-slate-800"
            />
            <h3 className="text-base font-bold text-white">{leaderboard[2].username}</h3>
            <div className="text-lg font-black text-brand-cyan mt-1">
              {leaderboard[2].eligibleViews.toLocaleString()} views
            </div>
            <div className="text-xs text-brand-emerald font-bold mt-0.5">
              ${leaderboard[2].earnings.toFixed(2)} earned
            </div>
          </div>
        </div>
      )}

      {/* Full Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4">Complete Rankings</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No rankings available for this time period yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-3 w-16">Rank</th>
                  <th className="pb-3">Clipper</th>
                  <th className="pb-3">Eligible Views</th>
                  <th className="pb-3">Approved Clips</th>
                  <th className="pb-3">Total Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {leaderboard.map((item) => (
                  <tr key={item.userId} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 pr-2 font-bold">
                      <span
                        className={`inline-block w-6 h-6 rounded-full text-center leading-6 text-[11px] ${
                          item.rank === 1
                            ? "bg-yellow-400 text-black font-black"
                            : item.rank === 2
                            ? "bg-slate-300 text-black font-black"
                            : item.rank === 3
                            ? "bg-amber-600 text-white font-black"
                            : "text-slate-400"
                        }`}
                      >
                        #{item.rank}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 flex items-center gap-2.5 text-white font-bold">
                      <img
                        src={item.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full border border-slate-700 bg-slate-800 object-cover"
                      />
                      <span>{item.username}</span>
                    </td>
                    <td className="py-3.5 pr-3 text-slate-200 font-semibold">
                      {item.eligibleViews.toLocaleString()} views
                    </td>
                    <td className="py-3.5 pr-3 text-slate-400">{item.approvedClips} clips</td>
                    <td className="py-3.5 font-bold text-brand-cyan">
                      ${item.earnings.toFixed(2)}
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
