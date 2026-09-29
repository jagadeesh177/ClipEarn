"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Video,
  DollarSign,
  Eye,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";

export default function AdminClippersPage() {
  const [clippers, setClippers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [suspendingClipper, setSuspendingClipper] = useState<{ id: string; username: string } | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadClippers = () => {
    setLoading(true);
    fetch(`/api/admin/clippers?search=${encodeURIComponent(search)}`)
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadClippers();
  };

  const handleConfirmSuspend = async () => {
    if (!suspendingClipper) return;
    if (!suspensionReason.trim()) {
      alert("Please enter a reason for suspending this clipper.");
      return;
    }

    try {
      setSubmittingAction(true);
      const res = await fetch("/api/admin/clippers", {
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
              ? { ...c, status: "SUSPENDED", suspension_reason: suspensionReason.trim() }
              : c
          )
        );
        setSuspendingClipper(null);
      } else {
        alert("Failed to suspend clipper: " + data.error);
      }
    } catch {
      alert("Network error updating clipper.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRestoreClipper = async (id: string) => {
    if (!confirm("Are you sure you want to restore this clipper to ACTIVE status?")) return;

    try {
      setSubmittingAction(true);
      const res = await fetch("/api/admin/clippers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: id,
          status: "ACTIVE",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setClippers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "ACTIVE", suspension_reason: null } : c))
        );
      } else {
        alert("Failed to restore clipper: " + data.error);
      }
    } catch {
      alert("Network error restoring clipper.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredClippers = clippers.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Registered Clippers</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
              PLATFORM-WIDE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global directory of all content creators registered on ClipEarn, their verified submissions, approved views, and account standing.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0F141F] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full md:flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username, email, discord ID, or referral code..."
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
          />
        </form>

        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
            <option value="BANNED">Banned Only</option>
          </select>
        </div>

        <button
          onClick={loadClippers}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold"
        >
          Refresh
        </button>
      </div>

      {/* Clippers Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-xs text-slate-400">Loading registered clippers...</p>
        </div>
      ) : filteredClippers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0D131D] border border-slate-800 p-8 space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Clippers Found</h3>
          <p className="text-xs text-slate-400">
            No clipper accounts match your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClippers.map((c) => {
            const isActive = c.status === "ACTIVE";
            const isSuspended = c.status === "SUSPENDED";

            return (
              <div
                key={c.id}
                className="bg-[#0F141F] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-slate-300 font-bold shrink-0">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt={c.username} className="w-full h-full object-cover" />
                    ) : (
                      c.username.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{c.username}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Ref: {c.referral_code}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                      <span>Email: {c.email || "No email"}</span>
                      {c.discord_id && <span className="font-mono text-slate-500">Discord ID: {c.discord_id}</span>}
                      <span>Accounts: {c.connected_accounts_count}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                      <div className="flex items-center gap-1 font-mono text-slate-300">
                        <Video className="w-3.5 h-3.5 text-blue-400" />
                        <span>{c.total_clips} clips ({c.approved_clips} approved)</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-amber-400">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{c.approved_views.toLocaleString()} approved views</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>${c.total_earnings.toFixed(2)} earned</span>
                      </div>
                    </div>

                    {c.suspension_reason && (
                      <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg mt-2">
                        <strong>Suspension Reason:</strong> {c.suspension_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {isActive ? (
                    <button
                      onClick={() => {
                        setSuspendingClipper({ id: c.id, username: c.username });
                        setSuspensionReason("");
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Suspend Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestoreClipper(c.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Restore to Active</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendingClipper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Suspend Clipper: {suspendingClipper.username}</span>
            </h3>

            <p className="text-xs text-slate-400">
              Suspended clippers will be immediately prevented from submitting new clips, participating in campaigns, and requesting payouts.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Reason for Suspension
              </label>
              <textarea
                rows={3}
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="e.g. Artificial view fraud, bot traffic, guidelines violation..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setSuspendingClipper(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                disabled={submittingAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
