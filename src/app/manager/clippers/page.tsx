"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, ShieldAlert, ShieldCheck, Video, DollarSign, Eye, Trash2, X } from "lucide-react";

export default function ManagerClippersPage() {
  const [clippers, setClippers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [suspendingClipper, setSuspendingClipper] = useState<{ id: string; username: string } | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [submittingSuspension, setSubmittingSuspension] = useState(false);

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

  const handleInitiateSuspend = (clipper: any) => {
    setSuspendingClipper({ id: clipper.id, username: clipper.username });
    setSuspensionReason("");
  };

  const handleConfirmSuspend = async () => {
    if (!suspendingClipper) return;
    if (!suspensionReason.trim()) {
      alert("Please enter a reason for suspending this clipper.");
      return;
    }

    try {
      setSubmittingSuspension(true);
      const res = await fetch("/api/manager/clippers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: suspendingClipper.id,
          status: "SUSPENDED",
          reason: suspensionReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setClippers((prev) =>
          prev.map((c) =>
            c.id === suspendingClipper.id
              ? { ...c, status: "SUSPENDED", suspension_reason: suspensionReason.trim(), suspended_at: new Date() }
              : c
          )
        );
        setSuspendingClipper(null);
        setSuspensionReason("");
      } else {
        alert(data.error || "Failed to suspend clipper");
      }
    } catch {
      alert("Network error while suspending clipper");
    } finally {
      setSubmittingSuspension(false);
    }
  };

  const handleReactivate = async (clipper: any) => {
    if (!confirm(`Are you sure you want to lift the suspension for @${clipper.username}?`)) return;

    try {
      setUpdatingId(clipper.id);
      const res = await fetch("/api/manager/clippers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: clipper.id,
          status: "ACTIVE",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setClippers((prev) =>
          prev.map((c) =>
            c.id === clipper.id
              ? { ...c, status: "ACTIVE", suspension_reason: null, suspended_at: null }
              : c
          )
        );
      } else {
        alert(data.error || "Failed to re-activate clipper");
      }
    } catch {
      alert("Network error while re-activating clipper");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteClipper = async (userId: string, username: string) => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY DELETE clipper @${username}? This action cannot be undone.`
      )
    )
      return;

    try {
      setUpdatingId(userId);
      const res = await fetch(`/api/manager/clippers?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setClippers((prev) => prev.filter((c) => c.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete clipper");
      }
    } catch {
      alert("Network error deleting clipper");
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
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "ACTIVE"
                              ? "bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30"
                              : "bg-red-500/15 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {c.status}
                        </span>
                        {c.status === "SUSPENDED" && c.suspension_reason && (
                          <div className="text-[10px] text-slate-400 max-w-[180px] truncate" title={c.suspension_reason}>
                            <span className="text-red-400 font-semibold">Reason:</span> {c.suspension_reason}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleInitiateSuspend(c)}
                            disabled={updatingId === c.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(c)}
                            disabled={updatingId === c.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-brand-emerald/15 hover:bg-brand-emerald/25 text-brand-emerald border border-brand-emerald/30"
                          >
                            Re-activate
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClipper(c.id, c.username)}
                          disabled={updatingId === c.id}
                          title="Permanently Delete Clipper"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspension Modal with Required Reason */}
      {suspendingClipper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/15 text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Suspend @{suspendingClipper.username}
                  </h3>
                  <p className="text-xs text-slate-400">
                    State the reason why this clipper is being suspended
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuspendingClipper(null)}
                disabled={submittingSuspension}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                <span className="font-bold text-white">Notice:</span> This suspension reason will be immediately displayed on the clipper&apos;s screen and notifications.
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Common Reasons:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Submitting clips from unverified accounts",
                    "Artificial or botting view activity detected",
                    "Failure to follow campaign rules & hashtags",
                    "Submitting copyright-infringing content",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSuspensionReason(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left ${
                        suspensionReason === preset
                          ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Suspension Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Explain why this clipper account is being suspended..."
                  className="w-full bg-[#070A0F] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSuspendingClipper(null)}
                  disabled={submittingSuspension}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  disabled={submittingSuspension || !suspensionReason.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-600/20 flex items-center gap-2"
                >
                  {submittingSuspension ? "Suspending..." : "Confirm Suspension"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
