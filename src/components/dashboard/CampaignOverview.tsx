"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  ArrowRight,
  Eye,
  FileCheck,
  PlusCircle,
  Key,
  Edit,
  Clock,
  ExternalLink,
  Search,
} from "lucide-react";

interface CampaignItem {
  id: string;
  name: string;
  brand_name?: string | null;
  image_url?: string | null;
  status: string;
  cpm: number;
  total_budget: number;
  used_budget?: number;
  total_views?: number;
  approved_views?: number;
  submissions_count?: number;
  pending_submissions_count?: number;
  clippers_count?: number;
}

interface CampaignOverviewProps {
  portalType: "admin" | "manager";
  campaigns: CampaignItem[];
  emptyMessage?: string;
}

export function CampaignOverview({
  portalType,
  campaigns = [],
  emptyMessage,
}: CampaignOverviewProps) {
  const [search, setSearch] = useState("");

  const title = portalType === "admin" ? "All Campaigns" : "My Assigned Campaigns";
  const baseRoute = portalType === "admin" ? "/admin/campaigns" : "/manager/campaigns";
  const viewAllRoute = portalType === "admin" ? "/admin/campaigns" : "/manager/campaigns";

  const filteredCampaigns = campaigns.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.brand_name && c.brand_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <Compass className={`w-5 h-5 ${portalType === "admin" ? "text-amber-400" : "text-purple-400"}`} />
          <div>
            <h2 className="text-base font-bold text-white">{title}</h2>
            <p className="text-xs text-slate-400">
              {portalType === "admin"
                ? "Platform-wide active and archived campaigns"
                : "Operational access scoped strictly to your assigned campaigns"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={viewAllRoute}
            className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <span>View All ({campaigns.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Search Filter */}
      {campaigns.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter campaigns by title or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>
      )}

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-3">
          <Compass className="w-10 h-10 mx-auto text-slate-600" />
          <div className="text-sm font-bold text-white">
            {campaigns.length === 0
              ? emptyMessage || (portalType === "admin" ? "No campaigns have been created yet." : "No assigned campaigns found.")
              : "No campaigns matching your filter."}
          </div>
          {portalType === "admin" && campaigns.length === 0 && (
            <Link
              href="/admin/campaigns/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Campaign</span>
            </Link>
          )}
          {portalType === "manager" && campaigns.length === 0 && (
            <Link
              href="/manager/redeem"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs"
            >
              <Key className="w-4 h-4" />
              <span>Redeem Campaign Access Code</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.slice(0, 6).map((camp) => {
            const approvedViews = camp.approved_views ?? camp.total_views ?? 0;
            const pendingCount = camp.pending_submissions_count ?? 0;

            return (
              <div
                key={camp.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {camp.image_url ? (
                        <img
                          src={camp.image_url}
                          alt={camp.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-950"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-850 border border-slate-750 text-white font-black flex items-center justify-center shrink-0 text-sm">
                          {(camp.brand_name || camp.name).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`${baseRoute}/${camp.id}`}
                          className="font-bold text-white text-sm hover:underline truncate block"
                          title={camp.name}
                        >
                          {camp.name}
                        </Link>
                        <p className="text-[11px] text-slate-400 truncate">
                          {camp.brand_name || "ClipEarn Partner"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        camp.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>

                  {/* Metrics snippet */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">
                        Approved Views
                      </div>
                      <div className="text-sm font-bold text-brand-cyan font-mono mt-0.5">
                        {approvedViews.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">
                        CPM Rate
                      </div>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">
                        ${Number(camp.cpm).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  {pendingCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                      <Clock className="w-3 h-3" />
                      <span>{pendingCount} Pending</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      {camp.submissions_count || 0} clips total
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    {portalType === "admin" && (
                      <Link
                        href={`/admin/campaigns/${camp.id}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Edit className="w-3 h-3 text-amber-400" />
                        <span>Manage</span>
                      </Link>
                    )}
                    <Link
                      href={`${baseRoute}/${camp.id}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </Link>
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
