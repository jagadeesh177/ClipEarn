"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Search,
  FileSpreadsheet,
  FileCheck,
  Trophy,
  ArrowRight,
  Key,
  Eye,
  Clock,
  Sparkles,
  Users,
} from "lucide-react";

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
        className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-950 via-[#130E20] to-slate-900 border border-purple-500/40 shrink-0 flex items-center justify-center font-black text-purple-400 text-base shadow-sm select-none"
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
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const loadCampaigns = () => {
    setLoading(true);
    let url = `/api/manager/campaigns?limit=50&search=${encodeURIComponent(search)}`;
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

  const handleExportSheet = (campaign: any) => {
    const a = document.createElement("a");
    a.href = `/api/export/campaign/${campaign.id}`;
    a.download = `${(campaign.name || "Campaign").replace(/[^a-zA-Z0-9_-]/g, "_")}_Performance_Report.xlsx`;
    a.click();
  };

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
            <Compass className="w-7 h-7 text-purple-400" />
            Assigned Campaigns
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Operational dashboard for campaigns assigned to your management account. Review submissions, track verified views, and view leaderboards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/manager/redeem"
            className="px-4 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            <Key className="w-4 h-4 text-purple-400" />
            <span>Redeem Access Code</span>
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
            placeholder="Search assigned campaigns..."
            aria-label="Search assigned campaigns"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadCampaigns()}
            className="w-full h-10 bg-[#0F141F] border border-slate-800 hover:border-slate-700 rounded-xl pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-colors"
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
                    ? "bg-purple-500 text-white shadow-sm"
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

      {/* Campaign Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl bg-[#0D131D] border border-slate-800/80 animate-pulse"
            />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#0D131D] border border-slate-800 p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Assigned Campaigns Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              {search || selectedPlatform !== "ALL" || selectedStatus !== "ALL"
                ? "No campaigns matched your current search filters."
                : "You do not currently have operational access to any campaigns. If you have been issued a Campaign Access Code by an Administrator, redeem it to gain access."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/manager/redeem"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-500/20"
            >
              <Key className="w-4 h-4" />
              <span>Redeem Campaign Access Code</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp) => {
            const currentViewsNum = Number(camp.total_views || 0);
            const platforms = Array.isArray(camp.allowed_platforms)
              ? camp.allowed_platforms
              : ["TIKTOK", "INSTAGRAM", "YOUTUBE"];

            const pendingCount = Number(camp.pending_submissions_count || 0);
            const approvedCount = Number(camp.approved_submissions_count || 0);
            const totalCount = Number(camp.submissions_count || 0);

            return (
              <div
                key={camp.id}
                className="rounded-2xl bg-[#0D131D] border border-slate-800/80 hover:border-slate-700/80 transition-all p-5 flex flex-col justify-between h-full group shadow-lg"
              >
                <div className="flex-1 flex flex-col">
                  {/* Top Row: Avatar, Brand, Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <CampaignAvatar imageUrl={camp.image_url} name={camp.brand_name || camp.name} />

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/manager/campaigns/${camp.id}`}
                          className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-purple-400 transition-colors"
                          title={camp.name}
                        >
                          {camp.name}
                        </Link>
                        <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-0.5">
                          {camp.brand_name || "ClipEarn Partner"}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 ${
                              camp.status === "ACTIVE"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                camp.status === "ACTIVE" ? "bg-emerald-400" : "bg-yellow-400"
                              }`}
                            />
                            {camp.status || "ACTIVE"}
                          </span>

                          <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                            {camp.clippers_count || 0} Clippers
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pending Review Badge */}
                    {pendingCount > 0 ? (
                      <Link
                        href={`/manager/submissions?campaign_id=${camp.id}&status=PENDING`}
                        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-bold hover:bg-amber-500/25 transition-colors"
                        title="Submissions awaiting review"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{pendingCount} Pending</span>
                      </Link>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-slate-500 border border-slate-800 text-[11px] font-medium">
                        Queue Clear
                      </span>
                    )}
                  </div>

                  {/* Middle Specs: CPM & Allowed Platforms */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-white font-bold text-xs border border-slate-700/60 font-mono">
                      ${Number(camp.cpm).toFixed(2)} CPM
                    </span>

                    <div
                      className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800"
                      aria-label="Supported platforms"
                    >
                      {platforms.includes("INSTAGRAM") && (
                        <div title="Instagram Reels" className="text-pink-400">
                          <InstagramIcon className="w-4 h-4" />
                        </div>
                      )}
                      {platforms.includes("TIKTOK") && (
                        <div title="TikTok" className="text-cyan-400">
                          <TikTokIcon className="w-4 h-4" />
                        </div>
                      )}
                      {platforms.includes("YOUTUBE") && (
                        <div title="YouTube Shorts" className="text-red-500">
                          <YouTubeIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approved Performance Stats (No Financial Spend Leaks) */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Approved Views
                      </div>
                      <div className="text-sm font-bold text-brand-cyan mt-0.5">
                        {formatViewsM(currentViewsNum)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Submissions
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {approvedCount} / {totalCount} approved
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manager Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {/* View Details */}
                    <Link
                      href={`/manager/campaigns/${camp.id}`}
                      className="h-9 flex-1 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-750 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>Details</span>
                    </Link>

                    {/* Review Submissions */}
                    <Link
                      href={`/manager/submissions?campaign_id=${camp.id}`}
                      className="h-9 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                      title="Review Submissions"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </Link>

                    {/* Leaderboard */}
                    <Link
                      href={`/manager/leaderboard?campaign_id=${camp.id}`}
                      className="h-9 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-yellow-400 border border-slate-750 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                      title="Campaign Leaderboard"
                    >
                      <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                    </Link>

                    {/* Export Report */}
                    <button
                      type="button"
                      onClick={() => handleExportSheet(camp)}
                      className="h-9 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-750 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                      title="Export Performance Report (.xlsx)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-brand-emerald" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
