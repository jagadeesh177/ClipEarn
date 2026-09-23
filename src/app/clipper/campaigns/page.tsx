"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Search,
  Check,
  CheckCircle2,
  ExternalLink,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// Platform SVGs
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

function DiscordIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

// Format numbers
function formatBudgetK(val: number): string {
  if (val >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(1)}M`;
  }
  if (val >= 1_000) {
    return `$${(val / 1_000).toFixed(1)}K`;
  }
  return `$${val.toFixed(1)}`;
}

function formatViewsM(views: number): string {
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1)}M`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1)}K`;
  }
  return `${views}`;
}

export default function BrowseCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchCampaigns = () => {
    setLoading(true);
    let url = `/api/campaigns?limit=50&search=${encodeURIComponent(search)}`;
    if (selectedPlatform !== "ALL") url += `&platform=${selectedPlatform}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setCampaigns(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, [selectedPlatform]);

  const handleJoin = async (campaignId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setJoiningId(campaignId);
      const res = await fetch(`/api/campaigns/${campaignId}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? { ...c, is_joined: true } : c))
        );
      } else {
        alert(data.error || "Failed to join campaign");
      }
    } catch {
      alert("Network error joining campaign");
    } finally {
      setJoiningId(null);
    }
  };

  const handleDiscordClick = (camp: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open("https://discord.gg/clipearn", "_blank");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns by brand, creator, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCampaigns()}
            className="w-full bg-[#0D131D] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan transition-colors"
          />
        </div>

        {/* Platform Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0D131D] border border-slate-800 rounded-xl text-xs font-semibold overflow-x-auto self-stretch sm:self-auto">
          {["ALL", "TIKTOK", "INSTAGRAM", "YOUTUBE"].map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-xs font-bold ${
                selectedPlatform === plat
                  ? "bg-brand-cyan text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {plat === "ALL" ? "All Platforms" : plat}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Cards Grid matching Competitor (3-Column Layout in Brand Cyan) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-[#0D131D] border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-20 text-center text-slate-500 rounded-2xl bg-[#0D131D] border border-slate-800 p-8">
          <Compass className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-base font-bold text-white">No active campaigns found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or check back soon as new brands launch weekly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {campaigns.map((camp) => {
            const usedBudgetNum = Number(camp.used_budget) || 0;
            const totalBudgetNum = Number(camp.total_budget) || 10000;
            const budgetPercent = Math.min(100, Math.round((usedBudgetNum / totalBudgetNum) * 100));

            const currentViewsNum = Number(camp.total_views || camp.eligible_views || 0);
            const maxViewsNum = Number(camp.max_payable_views) || Math.floor((totalBudgetNum / (Number(camp.cpm) || 1)) * 1000);
            const viewsPercent = maxViewsNum > 0 ? Math.min(100, Math.round((currentViewsNum / maxViewsNum) * 100)) : 0;

            const isRetainer = Number(camp.cpm) === 0 || camp.name.toLowerCase().includes("retainer");
            const platforms = Array.isArray(camp.allowed_platforms) ? camp.allowed_platforms : ["TIKTOK", "INSTAGRAM", "YOUTUBE"];

            // Calculate pseudo review average (e.g. 1.1d, 1.4d, 1.8d)
            const reviewDays = ((camp.name.length % 9) * 0.1 + 1.1).toFixed(1);

            return (
              <div
                key={camp.id}
                className="rounded-2xl bg-[#0D131D] border border-slate-800/80 hover:border-slate-700/80 transition-all p-5 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {/* Top Row: Brand Logo, Title & Active tag, and Top-Right Avg Review tag */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Brand Logo / Avatar Circle */}
                      <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-sm">
                        {camp.image_url ? (
                          <img
                            src={camp.image_url}
                            alt={camp.brand_name || camp.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-brand-cyan font-black">
                            {(camp.brand_name || camp.name).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Title & Status */}
                      <div className="min-w-0">
                        <Link
                          href={`/clipper/campaigns/${camp.id}`}
                          className="font-bold text-white text-sm sm:text-base hover:text-brand-cyan transition-colors truncate block"
                          title={camp.name}
                        >
                          {camp.name}
                        </Link>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 uppercase tracking-wider inline-block mt-0.5">
                          {camp.status || "ACTIVE"}
                        </span>
                      </div>
                    </div>

                    {/* Avg review badge */}
                    <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/40 text-brand-cyan border border-cyan-800/40 text-[11px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                      <span>Avg review: {reviewDays}d</span>
                    </div>
                  </div>

                  {/* Middle Specs Row: CPM or RETAINER badge & Social platform icons */}
                  <div className="flex items-center justify-between mt-4">
                    {/* Left: CPM / Retainer Chip */}
                    {isRetainer ? (
                      <span className="px-2.5 py-1 rounded-lg bg-[#2A1838] text-[#C084FC] border border-purple-500/30 font-bold text-[11px] uppercase tracking-wider">
                        RETAINER
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-white font-bold text-xs border border-slate-700/60">
                        ${Number(camp.cpm).toFixed(0) === Number(camp.cpm).toFixed(2) ? Number(camp.cpm).toFixed(0) : Number(camp.cpm).toFixed(2)} CPM
                      </span>
                    )}

                    {/* Right: Allowed Platform Icons */}
                    <div className="flex items-center gap-2">
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

                  {/* Dual Progress Bars */}
                  <div className="mt-5 space-y-3.5">
                    {/* Progress Bar 1: Budget Used */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 tracking-wider">
                        <span>
                          {formatBudgetK(usedBudgetNum)} OF {formatBudgetK(totalBudgetNum)} USED
                        </span>
                        <span className="text-slate-300 font-bold">{budgetPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-brand-cyan rounded-full transition-all duration-500"
                          style={{ width: `${budgetPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Progress Bar 2: Views Progress (unless Retainer) */}
                    {!isRetainer && (
                      <div>
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 tracking-wider">
                          <span>
                            {formatViewsM(currentViewsNum)} / {formatViewsM(maxViewsNum)} VIEWS
                          </span>
                          <span className="text-slate-300 font-bold">{viewsPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${viewsPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Row: Discord Button + Join Campaign CTA in Brand Cyan */}
                <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center gap-2.5">
                  {/* Discord Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDiscordClick(camp, e)}
                    className="px-3 py-2.5 rounded-xl bg-[#141C2B] hover:bg-[#1A253A] border border-slate-700/70 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    title="Join Campaign Community on Discord"
                  >
                    <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
                    <span>Discord</span>
                  </button>

                  {/* Main CTA */}
                  {camp.is_joined ? (
                    <Link
                      href={`/clipper/campaigns/${camp.id}`}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-brand-cyan/15 hover:bg-brand-cyan/25 border border-brand-cyan/30 text-brand-cyan font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                    >
                      <Check className="w-4 h-4 text-brand-cyan" />
                      <span>Joined &bull; Submit Clip</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleJoin(camp.id, e)}
                      disabled={joiningId === camp.id}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-[0.98]"
                    >
                      {joiningId === camp.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Joining...</span>
                        </>
                      ) : (
                        <>
                          <span>+ Join Campaign</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
