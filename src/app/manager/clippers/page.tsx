"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, ShieldAlert, ShieldCheck, Video, DollarSign, Eye } from "lucide-react";

export default function ManagerClippersPage() {
  const [clippers, setClippers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadClippers = () => {
    setLoading(true);
    fetch(`/api/manager/clippers?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setClippers(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadClippers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (
      !confirm(
        `Are you sure you want to ${nextStatus === "SUSPENDED" ? "SUSPEND" : "ACTIVATE"} this clipper?`
      )
    )
      return;

    try {
      setUpdatingId(userId);
      const res = await fetch("/api/manager/clippers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      if (res.ok) {
        setClippers((prev) =>
          prev.map((c) => (c.id === userId ? { ...c, status: nextStatus } : c))
        );
      } else {
        alert("Failed to update user status");
      }
    } catch {
      alert("Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-brand-cyan" />
            Clippers Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor registered clippers, connected social channels, approved clips, and account statuses.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by username, email, or Discord ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadClippers()}
          className="w-full bg-[#0F141F] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan"
        />
      </div>

      {/* Clippers Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : clippers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No clippers found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-3">Clipper</th>
                  <th className="pb-3">Discord / Email</th>
                  <th className="pb-3">Verified Channels</th>
                  <th className="pb-3">Joined Campaigns</th>
                  <th className="pb-3">Clips (Approved / Total)</th>
                  <th className="pb-3">Total Earnings</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {clippers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 pr-3 flex items-center gap-2.5">
                      <img
                        src={
                          c.avatar_url ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${c.username}`
                        }
                        alt="Avatar"
                        className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800"
                      />
                      <span className="font-bold text-white text-sm">@{c.username}</span>
                    </td>

                    <td className="py-4 pr-3 text-slate-400 font-mono text-[11px]">
                      {c.discord_id || c.email}
                    </td>

                    <td className="py-4 pr-3">
                      <span className="px-2 py-0.5 rounded bg-brand-emerald/10 text-brand-emerald font-bold text-[11px]">
                        {c.verified_accounts_count} of {c.connected_accounts_count} verified
                      </span>
                    </td>

                    <td className="py-4 pr-3 text-slate-200 font-bold">
                      {c.campaigns_joined_count}
                    </td>

                    <td className="py-4 pr-3">
                      <span className="text-brand-emerald font-bold">{c.approved_clips}</span>
                      <span className="text-slate-500"> / {c.total_clips} clips</span>
                    </td>

                    <td className="py-4 pr-3 font-black text-brand-cyan">
                      ${c.total_earnings.toFixed(2)}
                    </td>

                    <td className="py-4 pr-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === "ACTIVE"
                            ? "bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(c.id, c.status)}
                        disabled={updatingId === c.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          c.status === "ACTIVE"
                            ? "bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30"
                            : "bg-brand-emerald/15 hover:bg-brand-emerald/25 text-brand-emerald border border-brand-emerald/30"
                        }`}
                      >
                        {c.status === "ACTIVE" ? "Suspend" : "Re-activate"}
                      </button>
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
