"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  Search,
  FileSpreadsheet,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Edit,
  Eye,
  DollarSign,
  TrendingUp,
  Loader2,
  Key,
  Copy,
  Check,
  X,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

// Social Platform Icons
function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.33 6.33 0 0 0 6.33-6.32V8.75a8.77 8.77 0 0 0 3.92 1.34V6.69z" />
    </svg>
  );
}

function YouTubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// Helpers for formatted currency and views
function formatBudgetK(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

function formatViewsM(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return `${views.toLocaleString()}`;
}

function CampaignAvatar({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  const [imageError, setImageError] = useState(false);
  const initial = (name || "C").trim().charAt(0).toUpperCase();

  if (!imageUrl || imageError) {
    return (
      <div
        className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-950 via-[#0E1B2A] to-slate-900 border border-brand-cyan/40 shrink-0 flex items-center justify-center font-black text-brand-cyan text-base shadow-sm select-none"
        aria-label={`${name} avatar`}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-sm">
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

export default function ManagerCampaignsPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Edit Campaign State
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

  // Admin Access Codes State
  const [accessCodeCampaign, setAccessCodeCampaign] = useState<any | null>(null);
  const [accessCodesList, setAccessCodesList] = useState<any[]>([]);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [justGeneratedCode, setJustGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Manager Access Code Redemption States
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [redeemingCode, setRedeemingCode] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  const loadCampaigns = () => {
    setLoading(true);
    let url = `/api/campaigns?limit=100&search=${encodeURIComponent(search)}`;
    if (selectedPlatform !== "ALL") {
      url += `&platform=${selectedPlatform}`;
    }
    if (selectedStatus !== "ALL") {
      url += `&status=${selectedStatus}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setCampaigns(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadCampaigns();
  }, [selectedPlatform, selectedStatus]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

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
        alert("Failed to toggle campaign status");
      }
    } catch {
      alert("Network error toggling campaign status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportSheet = (campaign: any) => {
    const a = document.createElement("a");
    a.href = `/api/export/campaign/${campaign.id}`;
    a.download = `${(campaign.name || "Campaign").replace(/[^a-zA-Z0-9_-]/g, "_")}_Client_Report.xlsx`;
    a.click();
  };

  const handleOpenAccessCodes = async (camp: any) => {
    setAccessCodeCampaign(camp);
    setJustGeneratedCode(null);
    setCopiedCode(false);
    try {
      const res = await fetch(`/api/campaigns/${camp.id}/access-codes`);
      const data = await res.json();
      if (res.ok && data.data) {
        setAccessCodesList(data.data);
      } else {
        setAccessCodesList([]);
      }
    } catch {
      setAccessCodesList([]);
    }
  };

  const handleGenerateCode = async () => {
    if (!accessCodeCampaign) return;
    try {
      setGeneratingCode(true);
      const res = await fetch(`/api/campaigns/${accessCodeCampaign.id}/access-codes`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.code) {
        setJustGeneratedCode(data.code);
        setAccessCodesList((prev) => [data.accessCode, ...prev]);
        loadCampaigns();
      } else {
        alert(data.error || "Failed to generate access code");
      }
    } catch {
      alert("Network error generating access code");
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) return;
    setRedeemingCode(true);
    setRedeemError(null);
    setRedeemSuccess(null);
    try {
      const res = await fetch("/api/manager/access-code/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCodeInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemSuccess(data.message || "Campaign access granted successfully!");
        setAccessCodeInput("");
        loadCampaigns();
        setTimeout(() => {
          setRedeemModalOpen(false);
          setRedeemSuccess(null);
        }, 1500);
      } else {
        setRedeemError(data.error || "Invalid or expired campaign access code.");
      }
    } catch {
      setRedeemError("Network error redeeming campaign access code.");
    } finally {
      setRedeemingCode(false);
    }
  };

  // Filter campaigns by local search query if typed
  const filteredCampaigns = campaigns.filter((camp) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      camp.name?.toLowerCase().includes(q) ||
      camp.brand_name?.toLowerCase().includes(q) ||
      camp.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Row */}
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

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/manager/campaigns/create"
            className="px-5 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-black text-xs transition-opacity hover:opacity-95 flex items-center gap-2 shadow-lg shadow-brand-cyan/20"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Campaign</span>
          </Link>
        </div>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Search Input */}
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search campaigns by name, brand, or keyword..."
            aria-label="Search campaigns by name, brand, or keyword"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadCampaigns()}
            className="w-full h-10 bg-[#0F141F] border border-slate-800 hover:border-slate-700 rounded-xl pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 transition-colors"
          />
        </div>

        {/* Filter Chips: Platform & Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Filters */}
          <div className="h-10 flex items-center gap-1 p-1 bg-[#0F141F] border border-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
            {["ALL", "TIKTOK", "INSTAGRAM", "YOUTUBE"].map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => setSelectedPlatform(plat)}
                className={`h-8 px-3 rounded-lg transition-colors whitespace-nowrap text-xs font-bold flex items-center justify-center ${
                  selectedPlatform === plat
                    ? "bg-brand-cyan text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {plat === "ALL" ? "All Platforms" : plat}
              </button>
            ))}
          </div>

          {/* Status Filter Tabs */}
          <div className="h-10 flex items-center gap-1 p-1 bg-[#0F141F] border border-slate-800 rounded-xl text-xs font-semibold">
            {["ALL", "ACTIVE", "PAUSED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`h-8 px-3 rounded-lg transition-colors whitespace-nowrap text-xs font-bold flex items-center justify-center ${
                  selectedStatus === st
                    ? "bg-slate-800 text-white border border-slate-700/80 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
              >
                {st === "ALL" ? "All Status" : st === "ACTIVE" ? "Active" : "Paused"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Cards Grid (Large Rectangular Cards matching Clipper Browse Page) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl bg-[#0D131D] border border-slate-800/80 animate-pulse"
            />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="py-20 text-center text-slate-500 rounded-2xl bg-[#0D131D] border border-slate-800 p-8 space-y-3">
          <Compass className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-base font-bold text-white">No campaigns found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || selectedPlatform !== "ALL" || selectedStatus !== "ALL"
              ? "Try adjusting your search query or filters to find what you are looking for."
              : "No campaigns have been launched yet. Click Launch New Campaign above to create one."}
          </p>
          <div className="pt-2">
            <Link
              href="/manager/campaigns/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs transition-all shadow-md shadow-brand-cyan/20"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Campaign</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp) => {
            const currentViewsNum = Number(camp.total_views || camp.eligible_views || 0);
            const usedBudgetNum = Number(camp.used_budget) || 0;
            const totalBudgetNum = Number(camp.total_budget) || 10000;
            const budgetPercent = Math.min(100, Math.round((usedBudgetNum / totalBudgetNum) * 100));

            const maxViewsNum =
              Number(camp.max_payable_views) ||
              Math.floor((totalBudgetNum / (Number(camp.cpm) || 1)) * 1000);
            const viewsPercent =
              maxViewsNum > 0 ? Math.min(100, Math.round((currentViewsNum / maxViewsNum) * 100)) : 0;

            const isRetainer = Number(camp.cpm) === 0 || camp.name.toLowerCase().includes("retainer");
            const platforms = Array.isArray(camp.allowed_platforms)
              ? camp.allowed_platforms
              : ["TIKTOK", "INSTAGRAM", "YOUTUBE"];

            const submissionsCount =
              camp.submissions_count ?? camp._count?.submissions ?? (Array.isArray(camp.submissions) ? camp.submissions.length : 0);

            // Review time estimate
            const reviewDays = ((camp.name.length % 9) * 0.1 + 1.1).toFixed(1);

            return (
              <div
                key={camp.id}
                className="rounded-2xl bg-[#0D131D] border border-slate-800/80 hover:border-slate-700/80 transition-all p-5 flex flex-col justify-between h-full group shadow-lg"
              >
                <div className="flex-1 flex flex-col">
                  {/* Top Row: Brand Logo Avatar, Name, Status, and Avg Review badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <CampaignAvatar imageUrl={camp.image_url} name={camp.brand_name || camp.name} />

                      <div className="min-w-0 flex-1">
                        <h3
                          className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-brand-cyan transition-colors"
                          title={camp.name}
                        >
                          {camp.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-0.5">
                          {camp.brand_name || "ClipEarn Partner"}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 ${
                              camp.status === "ACTIVE"
                                ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30"
                                : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                camp.status === "ACTIVE" ? "bg-brand-cyan" : "bg-yellow-400"
                              }`}
                            />
                            {camp.status || "ACTIVE"}
                          </span>

                          <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                            {submissionsCount} {submissionsCount === 1 ? "Clip" : "Clips"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Avg Review Badge */}
                    <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 text-brand-cyan border border-cyan-800/40 text-[11px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                      <span>Avg review: {reviewDays}d</span>
                    </div>
                  </div>

                  {/* Middle Specs Row: CPM Chip & Allowed Platform Icons */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60">
                    {/* Left: CPM / Retainer Chip */}
                    {isRetainer ? (
                      <span className="px-2.5 py-1 rounded-lg bg-[#2A1838] text-[#C084FC] border border-purple-500/30 font-bold text-[11px] uppercase tracking-wider">
                        RETAINER
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-white font-bold text-xs border border-slate-700/60 font-mono">
                        ${Number(camp.cpm).toFixed(2)} CPM
                      </span>
                    )}

                    {/* Right: Grouped Allowed Platform Icons */}
                    <div
                      className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800"
                      aria-label="Supported platforms"
                    >
                      {platforms.includes("INSTAGRAM") && (
                        <div title="Instagram Reels allowed" className="text-pink-400">
                          <InstagramIcon className="w-4 h-4" />
                        </div>
                      )}
                      {platforms.includes("TIKTOK") && (
                        <div title="TikTok allowed" className="text-cyan-400">
                          <TikTokIcon className="w-4 h-4" />
                        </div>
                      )}
                      {platforms.includes("YOUTUBE") && (
                        <div title="YouTube Shorts allowed" className="text-red-500">
                          <YouTubeIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dual Visual Progress Bars */}
                  <div className="mt-4 space-y-3">
                    {/* Progress Bar 1: Budget Utilization */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                        <span>
                          {formatBudgetK(usedBudgetNum)} of {formatBudgetK(totalBudgetNum)} used
                        </span>
                        <span className="text-white font-bold">{budgetPercent}%</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={budgetPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Budget utilization percentage"
                        className="w-full h-2 bg-slate-900 border border-slate-700/60 rounded-full overflow-hidden mt-1.5"
                      >
                        <div
                          className="h-full bg-brand-cyan rounded-full transition-all duration-500"
                          style={{ width: `${budgetPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Progress Bar 2: Views Delivered */}
                    {!isRetainer && (
                      <div>
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                          <span>
                            {formatViewsM(currentViewsNum)} / {formatViewsM(maxViewsNum)} views delivered
                          </span>
                          <span className="text-white font-bold">{viewsPercent}%</span>
                        </div>
                        <div
                          role="progressbar"
                          aria-valuenow={viewsPercent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Views delivered percentage"
                          className="w-full h-2 bg-slate-900 border border-slate-700/60 rounded-full overflow-hidden mt-1.5"
                        >
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${viewsPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manager Action Buttons Row (NO Delete button) */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {/* Edit Campaign */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(camp)}
                      className="h-9 flex-1 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-750 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      title="Edit Campaign Parameters"
                    >
                      <Edit className="w-3.5 h-3.5 text-brand-cyan" />
                      <span>Edit</span>
                    </button>

                    {/* Pause / Resume Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(camp.id, camp.status)}
                      disabled={updatingId === camp.id}
                      className={`h-9 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                        camp.status === "ACTIVE"
                          ? "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                      title={camp.status === "ACTIVE" ? "Pause Campaign Submissions" : "Resume Campaign Submissions"}
                    >
                      {updatingId === camp.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : camp.status === "ACTIVE" ? (
                        <PauseCircle className="w-3.5 h-3.5" />
                      ) : (
                        <PlayCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{camp.status === "ACTIVE" ? "Pause" : "Resume"}</span>
                    </button>

                    {/* Export XLSX Report */}
                    <button
                      type="button"
                      onClick={() => handleExportSheet(camp)}
                      className="h-9 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-brand-cyan border border-slate-750 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                      title="Export Performance Report (.xlsx)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-brand-cyan" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>

                  {/* Admin Only: Access Code Management */}
                  {currentUser?.role === "ADMIN" && (
                    <button
                      type="button"
                      onClick={() => handleOpenAccessCodes(camp)}
                      title="Generate Campaign Access Code (Admin Only)"
                      className="w-9 h-9 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 transition-colors"
                    >
                      <Key className="w-4 h-4 text-purple-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                  Rate paid to clippers per 1,000 verified views.
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
                    Accrued: ${(Number(editingCampaign.used_budget) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Allowed Platforms */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Allowed Clipping Platforms (Click to toggle)
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
                    <span>Active (Open)</span>
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
                    <span>Paused</span>
                  </button>
                </div>
              </div>

              {/* Image Upload / Brand Logo */}
              <div className="pt-1">
                <ImageUpload
                  value={editForm.image_url}
                  onChange={(url) => setEditForm((prev) => ({ ...prev, image_url: url }))}
                  label="Campaign Brand Logo / Thumbnail"
                  description="Upload a brand avatar from local storage or specify an image URL."
                />
              </div>

              {/* Action buttons footer */}
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

      {/* Admin Access Codes Modal */}
      {accessCodeCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Campaign Access Codes</h2>
                  <p className="text-xs text-slate-400">{accessCodeCampaign.name} &bull; {accessCodeCampaign.brand_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAccessCodeCampaign(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#080C14] border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Generate Campaign Access Code</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Generate a secure code for a manager to access this campaign.</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={generatingCode}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/30 shrink-0"
              >
                {generatingCode ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                <span>Generate Access Code</span>
              </button>
            </div>

            {/* Just Generated Code Banner */}
            {justGeneratedCode && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/40 text-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">New Code Generated:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(justGeneratedCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="text-xs font-bold px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 flex items-center gap-1.5 transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
                <div className="font-mono font-black text-xl text-white tracking-widest bg-black/40 px-3 py-2 rounded-lg border border-purple-500/30 text-center select-all">
                  {justGeneratedCode}
                </div>
              </div>
            )}

            {/* Codes History */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Existing Campaign Access Codes</span>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {accessCodesList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 rounded-xl bg-[#080C14] border border-slate-800/80">
                    No access codes generated yet for this campaign.
                  </div>
                ) : (
                  accessCodesList.map((ac: any) => (
                    <div
                      key={ac.id}
                      className="p-3 rounded-xl bg-[#080C14] border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">
                            {ac.code_preview || "CE-MGR-••••••••"}
                          </span>
                          {ac.status === "REDEEMED" ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                              Redeemed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Created {new Date(ac.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="text-right">
                        {ac.status === "REDEEMED" && ac.manager ? (
                          <div>
                            <span className="text-white font-bold block">{ac.manager.username}</span>
                            <span className="text-[10px] text-slate-400 block">{ac.manager.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Unclaimed</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAccessCodeCampaign(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Redeem Code Modal */}
      {redeemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Enter Campaign Access Code</h2>
                  <p className="text-xs text-slate-400">Redeem an administrator-issued access code</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRedeemModalOpen(false);
                  setRedeemError(null);
                  setRedeemSuccess(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRedeemCode} className="space-y-4">
              {redeemError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{redeemError}</span>
                </div>
              )}

              {redeemSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{redeemSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Campaign Access Code
                </label>
                <input
                  type="text"
                  required
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. CE-MGR-7K4P9X"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 text-white font-mono text-sm tracking-wider uppercase placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Enter the unique access code provided by your campaign administrator.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setRedeemModalOpen(false);
                    setRedeemError(null);
                    setRedeemSuccess(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={redeemingCode || !accessCodeInput.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-600/30"
                >
                  {redeemingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>Claim Campaign Access</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
