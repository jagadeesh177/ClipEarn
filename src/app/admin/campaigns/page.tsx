"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  PlusCircle,
  Play,
  Pause,
  StopCircle,
  Eye,
  DollarSign,
  Users,
  Film,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/campaigns?limit=100");
      const json = await res.json();
      if (res.ok && json.data) {
        setCampaigns(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleUpdateStatus = async (campaignId: string, newStatus: string) => {
    try {
      setUpdatingId(campaignId);
      setStatusMessage(null);
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update campaign status.");
      }
      setStatusMessage({
        type: "success",
        text: `Campaign status changed to ${newStatus}.`,
      });
      await fetchCampaigns();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to update campaign.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.brand_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Campaign Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, monitor, pause, and control all brand clip campaigns.
          </p>
        </div>

        <Link
          href="/admin/campaigns/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-400/10"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Campaign
        </Link>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns by name or brand..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0D131D] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ACTIVE", "PAUSED", "ENDED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-[#0D131D] border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-xs">Loading campaign registry...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#0D131D] border border-slate-800 text-center space-y-3">
          <Compass className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No campaigns found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || statusFilter !== "ALL"
              ? "Try adjusting your search query or status filter."
              : "No campaigns have been created yet. Launch your first campaign."}
          </p>
          <Link
            href="/admin/campaigns/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition"
          >
            <PlusCircle className="w-4 h-4" /> Create Campaign
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0D131D] border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080C14] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Campaign</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">CPM Rate</th>
                  <th className="py-3.5 px-4 text-right">Budget Used</th>
                  <th className="py-3.5 px-4 text-right">Approved Views</th>
                  <th className="py-3.5 px-4 text-center">Clippers</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredCampaigns.map((camp) => {
                  const isUpdating = updatingId === camp.id;
                  const budgetUsedPct =
                    camp.total_budget > 0
                      ? Math.min(100, Math.round((camp.used_budget / camp.total_budget) * 100))
                      : 0;

                  return (
                    <tr key={camp.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-5">
                        <Link
                          href={`/admin/campaigns/${camp.id}`}
                          className="group block"
                        >
                          <div className="font-bold text-white group-hover:text-amber-400 transition flex items-center gap-1.5">
                            {camp.name}
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {camp.brand_name}
                          </div>
                        </Link>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            camp.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : camp.status === "PAUSED"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right font-bold text-white font-mono">
                        ${camp.cpm.toFixed(2)}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="font-bold text-white font-mono">
                          ${camp.used_budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          of ${camp.total_budget.toLocaleString()} ({budgetUsedPct}%)
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="font-bold text-amber-400 font-mono">
                          {(camp.total_views || camp.eligible_views || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">approved views</div>
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-slate-300">
                        {camp.clippers_count || 0}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {camp.status === "ACTIVE" ? (
                            <button
                              onClick={() => handleUpdateStatus(camp.id, "PAUSED")}
                              disabled={isUpdating}
                              title="Pause Campaign"
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(camp.id, "ACTIVE")}
                              disabled={isUpdating}
                              title="Resume Campaign"
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <Link
                            href={`/admin/campaigns/${camp.id}`}
                            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition"
                          >
                            Manage
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
