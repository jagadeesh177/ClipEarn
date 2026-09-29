"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Flame,
  Users,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Clock,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const initialCampaignId = searchParams.get("campaign_id") || "";

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(initialCampaignId);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [minViewsForPayout, setMinViewsForPayout] = useState<number>(0);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Load manager's assigned campaigns
  useEffect(() => {
    setLoadingCampaigns(true);
    fetch("/api/manager/campaigns?limit=100")
      .then((res) => res.json())
      .then((data) => {
        const camps = data.data || [];
        setCampaigns(camps);
        if (camps.length > 0) {
          if (!selectedCampaignId || !camps.some((c: any) => c.id === selectedCampaignId)) {
            setSelectedCampaignId(camps[0].id);
          }
        }
        setLoadingCampaigns(false);
      })
      .catch(() => setLoadingCampaigns(false));
  }, []);

  // When selected campaign changes, fetch that campaign's leaderboard
  useEffect(() => {
    if (!selectedCampaignId) {
      setLeaderboard([]);
      return;
    }

    setLoadingLeaderboard(true);
    fetch(`/api/campaigns/${selectedCampaignId}/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setLeaderboard(data.data);
          setMinViewsForPayout(data.meta?.minimumViewsForPayout || 0);
        } else {
          setLeaderboard([]);
        }
        setLoadingLeaderboard(false);
      })
      .catch(() => setLoadingLeaderboard(false));
  }, [selectedCampaignId]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-yellow-400" />
            Campaign Leaderboards
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time clipper rankings and payout eligibility for your assigned campaigns, derived strictly from approved submissions.
          </p>
        </div>

        {/* Campaign Selector Dropdown */}
        {campaigns.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">
              Campaign:
            </span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-[#0F141F] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand_name} &bull; {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadingCampaigns ? (
        <div className="py-16 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-2" />
          <p className="text-xs">Loading assigned campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#0D131D] border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">No Assigned Campaigns</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Leaderboards are available for campaigns assigned to your management account. Redeem an access code to get started.
          </p>
          <div className="pt-2">
            <Link
              href="/manager/redeem"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs transition-colors"
            >
              <Key className="w-4 h-4" />
              <span>Redeem Access Code</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Campaign Overview Banner */}
          {selectedCampaign && (
            <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold flex items-center justify-center shrink-0">
                  {(selectedCampaign.brand_name || selectedCampaign.name).charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{selectedCampaign.name}</div>
                  <div className="text-slate-400 text-[11px]">{selectedCampaign.brand_name}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">CPM Rate</span>
                  <span className="font-mono font-bold text-slate-200">${Number(selectedCampaign.cpm).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Payout Threshold</span>
                  <span className="font-mono font-bold text-brand-cyan">
                    {minViewsForPayout > 0 ? `${minViewsForPayout.toLocaleString()} views` : "None"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Ranked Clippers</span>
                  <span className="font-mono font-bold text-white">{leaderboard.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
            {loadingLeaderboard ? (
              <div className="py-12 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                <p className="text-xs">Calculating approved rankings...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No approved submissions for this campaign yet. Once clips are approved, rankings will appear here automatically.
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
                      <th className="py-3 px-3 text-right">Comments</th>
                      <th className="py-3 px-3 text-right">Approved Clips</th>
                      <th className="py-3 px-3 text-right">Accrued Earned</th>
                      <th className="py-3 px-3 text-center">Payout Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {leaderboard.map((item) => (
                      <tr key={item.userId} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold">
                          <span
                            className={
                              item.rank === 1
                                ? "text-yellow-400"
                                : item.rank === 2
                                ? "text-slate-200"
                                : item.rank === 3
                                ? "text-amber-600"
                                : "text-slate-400"
                            }
                          >
                            #{item.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 text-white font-bold">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px] uppercase border border-purple-500/30">
                              {item.username.charAt(0)}
                            </div>
                            <span>@{item.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-brand-cyan">
                          {item.approvedViews.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {(item.approvedLikes || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {(item.approvedComments || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {item.clipsCount}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          ${item.earnings.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {item.isEligible ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Eligible</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              <AlertCircle className="w-3 h-3" />
                              <span>Needs {(minViewsForPayout - item.approvedViews).toLocaleString()} views</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManagerLeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-2" />
          <p className="text-xs">Loading leaderboards...</p>
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
