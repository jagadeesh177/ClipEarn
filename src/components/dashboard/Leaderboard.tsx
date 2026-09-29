"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Flame,
} from "lucide-react";

interface CampaignOption {
  id: string;
  name: string;
  brand_name?: string | null;
  minimum_views_for_payout?: number | null;
}

interface LeaderboardProps {
  portalType: "admin" | "manager";
  campaigns: CampaignOption[];
  initialCampaignId?: string;
}

export function Leaderboard({
  portalType,
  campaigns = [],
  initialCampaignId,
}: LeaderboardProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    initialCampaignId || (campaigns.length > 0 ? campaigns[0].id : "")
  );
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [minViews, setMinViews] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCampaignId && campaigns.length > 0) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  useEffect(() => {
    if (!selectedCampaignId) {
      setLeaderboard([]);
      return;
    }

    setLoading(true);
    fetch(`/api/campaigns/${selectedCampaignId}/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          // Sort strictly: Highest approved views -> Lowest approved views
          const sorted = [...data.data].sort(
            (a, b) => (b.approvedViews || 0) - (a.approvedViews || 0)
          );
          setLeaderboard(sorted);
          setMinViews(data.meta?.minimumViewsForPayout || 0);
        } else {
          setLeaderboard([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setLeaderboard([]);
        setLoading(false);
      });
  }, [selectedCampaignId]);

  const viewAllRoute =
    portalType === "admin"
      ? `/admin/campaigns/${selectedCampaignId}`
      : `/manager/leaderboard?campaign_id=${selectedCampaignId}`;

  return (
    <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div>
            <h2 className="text-base font-bold text-white">Campaign Leaderboard</h2>
            <p className="text-xs text-slate-400">
              Ranked from highest approved views to lowest approved views.
            </p>
          </div>
        </div>

        {campaigns.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-semibold">Campaign:</span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-slate-700"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand_name || c.name} &bull; {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
          <p className="text-xs">Computing approved rankings...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          {campaigns.length === 0
            ? "No campaigns available to display leaderboard."
            : "No approved submissions for this campaign yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider pb-2.5">
                <th className="py-3 px-3 w-16">Rank</th>
                <th className="py-3 px-3">Clipper</th>
                <th className="py-3 px-3 text-right">Approved Views</th>
                <th className="py-3 px-3 text-right">Likes</th>
                <th className="py-3 px-3 text-right">Clips</th>
                <th className="py-3 px-3 text-right">Earned</th>
                <th className="py-3 px-3 text-center">Payout Qualification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {leaderboard.slice(0, 5).map((item, idx) => (
                <tr key={item.userId} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold">
                    <span
                      className={
                        idx === 0
                          ? "text-yellow-400"
                          : idx === 1
                          ? "text-slate-200"
                          : idx === 2
                          ? "text-amber-600"
                          : "text-slate-500"
                      }
                    >
                      #{idx + 1}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px] border border-slate-700">
                        {item.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-white">@{item.username}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-brand-cyan">
                    {(item.approvedViews || 0).toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {(item.approvedLikes || 0).toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {item.clipsCount}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                    ${Number(item.earnings || 0).toFixed(2)}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {item.isEligible ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Eligible</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        <AlertCircle className="w-3 h-3" />
                        <span>Needs {(minViews - (item.approvedViews || 0)).toLocaleString()} views</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCampaignId && (
        <div className="pt-2 border-t border-slate-800/60 flex justify-end">
          <Link
            href={viewAllRoute}
            className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <span>View Full Leaderboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
