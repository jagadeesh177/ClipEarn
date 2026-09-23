"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Flame, Download, Users } from "lucide-react";

export default function ManagerLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard?period=all")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setLeaderboard(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-yellow-400" />
            Executive Leaderboard Rankings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global clipper rankings calculated on approved eligible views and cumulative payout claims.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No rankings available.
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
                  <th className="pb-3">Gross Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {leaderboard.map((item) => (
                  <tr key={item.userId} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 pr-2 font-bold">
                      <span className="font-mono text-brand-cyan">#{item.rank}</span>
                    </td>
                    <td className="py-3.5 pr-3 flex items-center gap-2.5 text-white font-bold">
                      <img
                        src={item.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full border border-slate-700 bg-slate-800"
                      />
                      <span>@{item.username}</span>
                    </td>
                    <td className="py-3.5 pr-3 text-slate-200 font-semibold">
                      {item.eligibleViews.toLocaleString()} views
                    </td>
                    <td className="py-3.5 pr-3 text-slate-400">{item.approvedClips} clips</td>
                    <td className="py-3.5 font-bold text-brand-emerald">
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
