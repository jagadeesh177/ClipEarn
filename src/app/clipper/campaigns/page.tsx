"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Users,
  ChevronRight,
  ExternalLink,
  Plus,
} from "lucide-react";

export default function BrowseCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchCampaigns = () => {
    setLoading(true);
    let url = `/api/campaigns?search=${encodeURIComponent(search)}`;
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

  const totalAvailableBudget = campaigns.reduce((sum, c) => sum + c.total_budget, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-brand-cyan" />
            Browse Campaigns
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover and join clipping campaigns that match your content style and audience.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="text-slate-400 block font-medium">Total Campaign Pool:</span>
          <span className="text-lg font-black text-brand-cyan">
            ${totalAvailableBudget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns by brand, title, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCampaigns()}
            className="w-full bg-[#0F141F] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan"
          />
        </div>

        {/* Platform Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0F141F] border border-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
          {["ALL", "TIKTOK", "INSTAGRAM", "YOUTUBE"].map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                selectedPlatform === plat
                  ? "bg-brand-cyan text-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {plat === "ALL" ? "All Platforms" : plat}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl bg-[#0F141F] border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-16 text-center text-slate-500 rounded-2xl bg-[#0F141F] border border-slate-800 p-8">
          <Compass className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-base font-bold text-white">No active campaigns found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try refining your search terms or check back soon as new brands launch campaigns weekly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => {
            const budgetPercent = Math.min(
              100,
              Math.round((camp.used_budget / camp.total_budget) * 100)
            );

            return (
              <Link
                key={camp.id}
                href={`/clipper/campaigns/${camp.id}`}
                className="group rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden relative shadow-lg"
              >
                <div>
                  {/* Campaign Card Banner */}
                  <div className="h-44 w-full relative overflow-hidden bg-slate-900">
                    <img
                      src={
                        camp.image_url ||
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600"
                      }
                      alt={camp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F141F] via-[#0F141F]/30 to-transparent" />

                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-black text-brand-cyan">
                      ${camp.cpm.toFixed(2)} CPM
                    </div>

                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-brand-emerald/15 backdrop-blur-md border border-brand-emerald/30 text-[10px] font-bold text-brand-emerald uppercase tracking-wider">
                      {camp.status}
                    </div>
                  </div>

                  <div className="p-5">
                    <span className="text-[11px] font-bold text-brand-emerald uppercase tracking-wider">
                      {camp.brand_name}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1 group-hover:text-brand-cyan transition-colors">
                      {camp.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {camp.description}
                    </p>

                    {/* Platforms Badge */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {camp.allowed_platforms.map((plat: string) => (
                        <span
                          key={plat}
                          className="px-2 py-0.5 rounded bg-slate-800/90 text-[10px] font-semibold text-slate-300"
                        >
                          {plat}
                        </span>
                      ))}
                    </div>

                    {/* Budget & Views Progress */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Budget Allocated:</span>
                        <span className="text-white font-semibold">
                          ${camp.used_budget.toLocaleString()} / ${camp.total_budget.toLocaleString()}
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-cyan to-brand-emerald rounded-full"
                          style={{ width: `${budgetPercent}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                        <span>Eligible Views:</span>
                        <span className="text-slate-300 font-medium">
                          {camp.eligible_views.toLocaleString()} / {camp.max_payable_views.toLocaleString()} max
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-5 pt-0">
                  {camp.is_joined ? (
                    <div className="w-full py-2.5 rounded-xl bg-slate-900 border border-brand-emerald/30 text-brand-emerald font-bold text-xs flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Already Joined &bull; Submit Clip</span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleJoin(camp.id, e)}
                      disabled={joiningId === camp.id}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-brand-cyan hover:text-black text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{joiningId === camp.id ? "Joining..." : "+ Join Campaign"}</span>
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
