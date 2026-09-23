"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  Download,
  FileSpreadsheet,
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
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function ManagerCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{
    cpm: string;
    total_budget: string;
    allowed_platforms: string[];
    status: string;
    image_url: string;
  }>({
    cpm: "1.00",
    total_budget: "10000",
    allowed_platforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE"],
    status: "ACTIVE",
    image_url: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const handleOpenEdit = (camp: any) => {
    setEditingCampaign(camp);
    setEditForm({
      cpm: String(camp.cpm || "1.00"),
      total_budget: String(camp.total_budget || "10000"),
      allowed_platforms:
        Array.isArray(camp.allowed_platforms) && camp.allowed_platforms.length > 0
          ? camp.allowed_platforms
          : ["TIKTOK", "INSTAGRAM", "YOUTUBE"],
      status: camp.status || "ACTIVE",
      image_url: camp.image_url || "",
    });
  };

  const togglePlatform = (plat: string) => {
    setEditForm((prev) => {
      const exists = prev.allowed_platforms.includes(plat);
      if (exists) {
        if (prev.allowed_platforms.length === 1) {
          alert("A campaign must allow at least one platform.");
          return prev;
        }
        return { ...prev, allowed_platforms: prev.allowed_platforms.filter((p) => p !== plat) };
      } else {
        return { ...prev, allowed_platforms: [...prev.allowed_platforms, plat] };
      }
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    const cpmNum = parseFloat(editForm.cpm);
    const budgetNum = parseFloat(editForm.total_budget);

    if (isNaN(cpmNum) || cpmNum <= 0) {
      alert("Please enter a valid CPM rate (e.g. 1.50).");
      return;
    }
    if (isNaN(budgetNum) || budgetNum <= 0) {
      alert("Please enter a valid budget amount (e.g. 15000).");
      return;
    }
    const accrued = Number(editingCampaign.used_budget) || 0;
    if (budgetNum < accrued) {
      alert(`Budget cannot be lower than the already accrued spend of $${accrued.toFixed(2)}.`);
      return;
    }

    try {
      setSavingEdit(true);
      const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpm: cpmNum,
          total_budget: budgetNum,
          allowed_platforms: editForm.allowed_platforms,
          status: editForm.status,
          image_url: editForm.image_url,
        }),
      });

      if (res.ok) {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === editingCampaign.id
              ? {
                  ...c,
                  cpm: cpmNum,
                  total_budget: budgetNum,
                  allowed_platforms: editForm.allowed_platforms,
                  status: editForm.status,
                  image_url: editForm.image_url,
                }
              : c
          )
        );
        setEditingCampaign(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update campaign parameters");
      }
    } catch {
      alert("Network error updating campaign parameters");
    } finally {
      setSavingEdit(false);
    }
  };

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
            Configure budgets, CPM parameters, platform rules, and export branded client Excel performance sheets (.xlsx).
          </p>
        </div>

        <Link
          href="/manager/campaigns/create"
          className="px-5 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-black text-xs transition-opacity hover:opacity-95 flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-brand-cyan/20"
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
                  const usedBudget = Number(camp.used_budget) || 0;
                  const totalBudget = Number(camp.total_budget) || 1;
                  const budgetPercent = Math.min(
                    100,
                    Math.round((usedBudget / totalBudget) * 100)
                  );
                  const platforms: string[] = Array.isArray(camp.allowed_platforms)
                    ? camp.allowed_platforms
                    : [];

                  return (
                    <tr key={camp.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 pr-3">
                        <div className="font-bold text-white text-sm">{camp.name || "Untitled Campaign"}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {platforms.length > 0 ? (
                            platforms.map((p: string) => (
                              <span
                                key={p}
                                className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-semibold text-slate-300"
                              >
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-slate-500">All Platforms</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 pr-3 text-slate-300 font-semibold">
                        {camp.brand_name || "N/A"}
                      </td>

                      <td className="py-4 pr-3 font-mono font-bold text-brand-cyan">
                        ${(Number(camp.cpm) || 0).toFixed(2)}
                      </td>

                      <td className="py-4 pr-3 min-w-[170px] max-w-[210px]">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-white font-bold">
                              ${usedBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-slate-400">
                              ${(Number(camp.total_budget) || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-cyan rounded-full transition-all duration-300"
                              style={{ width: `${budgetPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 pr-3">
                        <span className="text-slate-200 font-bold">
                          {(Number(camp.eligible_views) || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {camp.submissions_count ?? camp._count?.submissions ?? 0} submissions
                        </span>
                      </td>

                      <td className="py-4 pr-3">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              camp.status === "ACTIVE"
                                ? "bg-brand-cyan shadow-[0_0_8px_rgba(0,242,254,0.6)]"
                                : camp.status === "PAUSED"
                                ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                                : "bg-slate-500"
                            }`}
                          />
                          <span
                            className={
                              camp.status === "ACTIVE"
                                ? "text-brand-cyan font-semibold"
                                : camp.status === "PAUSED"
                                ? "text-yellow-400 font-semibold"
                                : "text-slate-400 font-semibold"
                            }
                          >
                            {camp.status === "ACTIVE" ? "Active" : camp.status === "PAUSED" ? "Paused" : camp.status}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5 sm:gap-3">
                          {/* Edit Parameters (CPM, Budget, Platforms) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(camp)}
                            title="Edit Campaign Parameters (CPM, Budget, Platforms)"
                            aria-label={`Edit Parameters for ${camp.name}`}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/90 hover:bg-brand-cyan/20 text-slate-300 hover:text-brand-cyan border border-slate-700/60 hover:border-brand-cyan/40 transition-colors flex items-center justify-center shrink-0"
                          >
                            <Edit className="w-4 h-4 text-brand-cyan" />
                          </button>

                          {/* Toggle pause/resume */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(camp.id, camp.status)}
                            disabled={updatingId === camp.id}
                            title={camp.status === "ACTIVE" ? "Pause Campaign" : "Resume Campaign"}
                            aria-label={camp.status === "ACTIVE" ? `Pause ${camp.name}` : `Resume ${camp.name}`}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center justify-center shrink-0"
                          >
                            {camp.status === "ACTIVE" ? (
                              <PauseCircle className="w-4 h-4 text-yellow-400" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-brand-cyan" />
                            )}
                          </button>

                          {/* Export Client Sheet (.xlsx) */}
                          <button
                            type="button"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = `/api/export/campaign/${camp.id}`;
                              a.download = `${camp.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Client_Report.xlsx`;
                              a.click();
                            }}
                            title="Export Client Performance Sheet (.xlsx)"
                            aria-label={`Export Client Performance Sheet for ${camp.name}`}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center justify-center shrink-0"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-brand-cyan" />
                          </button>

                          {/* Delete Campaign */}
                          <button
                            type="button"
                            onClick={() => setCampaignToDelete(camp)}
                            title="Delete Campaign"
                            aria-label={`Delete ${camp.name}`}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/90 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/60 hover:border-red-500/40 transition-colors flex items-center justify-center shrink-0"
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

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Edit Campaign Parameters</h2>
                  <span className="text-xs text-slate-400 font-medium">
                    {editingCampaign.brand_name} &bull; {editingCampaign.name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close edit modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4 text-xs">
              {/* CPM Rate */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Cost Per 1,000 Views (CPM Rate in USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={editForm.cpm}
                    onChange={(e) => setEditForm({ ...editForm, cpm: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
                    placeholder="1.00"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-normal">
                  Rate paid to creators per 1,000 verified views. Changing this immediately updates payout calculations for future view syncs.
                </p>
              </div>

              {/* Total Budget */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Total Campaign Budget (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={editForm.total_budget}
                    onChange={(e) => setEditForm({ ...editForm, total_budget: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
                    placeholder="10000"
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-1.5">
                  <span>Contracted brand sponsor budget pool.</span>
                  <span className="text-slate-300 font-medium">
                    Accrued spend: ${(Number(editingCampaign.used_budget) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Allowed Platforms */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Allowed Clipping Platforms (Click to enable / disable)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "TIKTOK", label: "TikTok" },
                    { id: "INSTAGRAM", label: "Instagram" },
                    { id: "YOUTUBE", label: "YouTube" },
                  ].map((p) => {
                    const isSelected = editForm.allowed_platforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={`h-10 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40"
                            : "bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300"
                        }`}
                      >
                        <span>{p.label}</span>
                        {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Creators can only submit clip links from the selected platforms above.
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Campaign Operational Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, status: "ACTIVE" })}
                    className={`h-10 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      editForm.status === "ACTIVE"
                        ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-brand-cyan" />
                    <span>Active (Accepting clips)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, status: "PAUSED" })}
                    className={`h-10 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      editForm.status === "PAUSED"
                        ? "bg-slate-800 text-white border-slate-600"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Paused (Submissions paused)</span>
                  </button>
                </div>
              </div>

              {/* Image Upload / Brand Logo */}
              <div className="pt-1">
                <ImageUpload
                  value={editForm.image_url}
                  onChange={(url) => setEditForm((prev) => ({ ...prev, image_url: url }))}
                  label="Campaign Brand Logo / Creative Image"
                  description="Upload a brand avatar from local storage or specify an image URL."
                />
              </div>

              {/* Sticky Action buttons footer (Issue 6) */}
              <div className="sticky bottom-0 bg-[#0F141F] pt-3 pb-1 border-t border-slate-800/80 flex items-center justify-end gap-3 mt-4 shrink-0">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setEditingCampaign(null)}
                  className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="h-10 px-5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-brand-cyan/20"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : null}
                  <span>{savingEdit ? "Saving..." : "Save Parameters"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Delete Campaign?</h2>
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
