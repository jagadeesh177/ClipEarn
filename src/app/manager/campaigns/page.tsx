"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  Download,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit,
  Eye,
  DollarSign,
  TrendingUp,
  Trash2,
  Loader2,
} from "lucide-react";

export default function ManagerCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCampaigns = () => {
    setLoading(true);
    fetch("/api/campaigns?limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setCampaigns(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      setUpdatingId(campaignId);
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? { ...c, status: nextStatus } : c))
        );
      } else {
        alert("Failed to toggle status");
      }
    } catch {
      alert("Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/campaigns/${campaignToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete.id));
        setCampaignToDelete(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete campaign");
      }
    } catch {
      alert("Network error deleting campaign");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-brand-cyan" />
            Campaign Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure budgets, CPM parameters, platform rules, and download brand CSV performance exports.
          </p>
        </div>

        <Link
          href="/manager/campaigns/create"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-black font-black text-xs transition-opacity hover:opacity-95 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Campaign</span>
        </Link>
      </div>

      {/* Campaigns Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No campaigns found. Create your first campaign above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-3">Campaign</th>
                  <th className="pb-3">Brand</th>
                  <th className="pb-3">CPM</th>
                  <th className="pb-3">Budget (Used / Total)</th>
                  <th className="pb-3">Views Delivered</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {campaigns.map((camp) => {
                  const budgetPercent = Math.min(
                    100,
                    Math.round((camp.used_budget / camp.total_budget) * 100)
                  );

                  return (
                    <tr key={camp.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 pr-3">
                        <div className="font-bold text-white text-sm">{camp.name}</div>
                        <div className="flex gap-1 mt-1">
                          {camp.allowed_platforms.map((p: string) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-semibold text-slate-300"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 pr-3 text-brand-emerald font-semibold">
                        {camp.brand_name}
                      </td>

                      <td className="py-4 pr-3 font-mono font-bold text-brand-cyan">
                        ${camp.cpm.toFixed(2)}
                      </td>

                      <td className="py-4 pr-3 max-w-[200px]">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-white font-bold">${camp.used_budget.toFixed(2)}</span>
                          <span className="text-slate-500">${camp.total_budget.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-cyan to-brand-emerald rounded-full"
                            style={{ width: `${budgetPercent}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-4 pr-3">
                        <span className="text-slate-200 font-bold">
                          {camp.eligible_views.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {camp.submissions_count} submissions
                        </span>
                      </td>

                      <td className="py-4 pr-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            camp.status === "ACTIVE"
                              ? "bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30"
                              : camp.status === "PAUSED"
                              ? "bg-yellow-400/15 text-yellow-400 border border-yellow-400/30"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>

                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle pause/resume */}
                          <button
                            onClick={() => handleToggleStatus(camp.id, camp.status)}
                            disabled={updatingId === camp.id}
                            title={camp.status === "ACTIVE" ? "Pause Campaign" : "Resume Campaign"}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            {camp.status === "ACTIVE" ? (
                              <PauseCircle className="w-4 h-4 text-yellow-400" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-brand-emerald" />
                            )}
                          </button>

                          {/* Export CSV (Rule 74) */}
                          <a
                            href={`/api/export/campaign/${camp.id}`}
                            download
                            title="Export Campaign Submissions CSV"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-brand-cyan hover:text-black text-slate-300 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          {/* Delete Campaign */}
                          <button
                            onClick={() => setCampaignToDelete(camp)}
                            title="Delete Campaign"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/60 hover:border-red-500/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Campaign?</h3>
                <span className="text-xs text-slate-400 font-medium">This action cannot be undone.</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl mb-6">
              Are you sure you want to delete <span className="text-white font-bold">{campaignToDelete.name}</span> ({campaignToDelete.brand_name})?
              All associated creator memberships, submissions, and view snapshots will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setCampaignToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCampaign}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{deleting ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
