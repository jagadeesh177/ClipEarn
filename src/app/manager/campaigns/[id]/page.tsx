"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Trophy,
  FileSpreadsheet,
  ShieldAlert,
  Loader2,
  Lock,
} from "lucide-react";

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export default function ManagerCampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<any | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/campaigns/${campaignId}`),
      fetch(`/api/campaigns/${campaignId}/leaderboard`),
    ])
      .then(async ([campRes, leadRes]) => {
        if (!campRes.ok) {
          if (campRes.status === 403) {
            throw new Error("Access denied. You do not have operational access assigned for this campaign.");
          }
          throw new Error("Campaign not found or failed to load.");
        }
        const campData = await campRes.json();
        const leadData = leadRes.ok ? await leadRes.json() : { data: [] };

        setCampaign(campData.data);
        setLeaderboard(leadData.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load campaign");
        setLoading(false);
      });
  }, [campaignId]);

  const handleExportSheet = () => {
    if (!campaign) return;
    const a = document.createElement("a");
    a.href = `/api/export/campaign/${campaign.id}`;
    a.download = `${(campaign.name || "Campaign").replace(/[^a-zA-Z0-9_-]/g, "_")}_Performance_Report.xlsx`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading campaign details & metrics...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-fadeIn">
        <div className="p-8 rounded-2xl bg-[#0D131D] border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-white">Campaign Access Error</h2>
          <p className="text-xs text-slate-400">{error || "Campaign not available"}</p>
          <div className="pt-2">
            <Link
              href="/manager/campaigns"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Assigned Campaigns</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const approvedViews = Number(campaign.approved_views || campaign.total_views || 0);
  const approvedLikes = Number(campaign.approved_likes || 0);
  const approvedComments = Number(campaign.approved_comments || 0);
  const approvedShares = Number(campaign.approved_shares || 0);
  const approvedSaves = Number(campaign.approved_saves || 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/manager/campaigns"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Campaigns</span>
        </Link>
      </div>

      {/* Campaign Header Card */}
      <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {campaign.image_url ? (
              <img
                src={campaign.image_url}
                alt={campaign.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-700/80 shrink-0 bg-slate-900"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-950 via-[#130E20] to-slate-900 border border-purple-500/40 text-purple-400 font-black text-xl flex items-center justify-center shrink-0">
                {(campaign.brand_name || campaign.name).charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white">{campaign.name}</h1>
                <span
                  className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 ${
                    campaign.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      campaign.status === "ACTIVE" ? "bg-emerald-400" : "bg-yellow-400"
                    }`}
                  />
                  {campaign.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-medium mt-1">
                {campaign.brand_name} &bull; Created on {new Date(campaign.created_at).toLocaleDateString()}
              </p>

              <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-850 text-slate-200 border border-slate-750 font-mono font-bold">
                  ${Number(campaign.cpm).toFixed(2)} CPM
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-850 text-slate-300 border border-slate-750 font-medium">
                  {campaign.clippers_count || 0} Joined Clippers
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-850 text-slate-300 border border-slate-750 font-medium">
                  {campaign.submissions_count || 0} Total Clips
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href={`/manager/submissions?campaign_id=${campaign.id}`}
              className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <FileCheck className="w-4 h-4" />
              <span>Review Submissions</span>
            </Link>

            <button
              type="button"
              onClick={handleExportSheet}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-brand-emerald" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Approved Social Performance Cards */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Approved Campaign Social Reach
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
              <Eye className="w-4 h-4 text-brand-cyan" />
              <span>Approved Views</span>
            </div>
            <div className="text-xl font-black text-brand-cyan font-mono">
              {formatNumber(approvedViews)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
              <Heart className="w-4 h-4 text-pink-400" />
              <span>Approved Likes</span>
            </div>
            <div className="text-xl font-black text-white font-mono">
              {formatNumber(approvedLikes)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span>Comments</span>
            </div>
            <div className="text-xl font-black text-white font-mono">
              {formatNumber(approvedComments)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Shares</span>
            </div>
            <div className="text-xl font-black text-white font-mono">
              {formatNumber(approvedShares)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>Saves</span>
            </div>
            <div className="text-xl font-black text-white font-mono">
              {formatNumber(approvedSaves)}
            </div>
          </div>
        </div>
      </div>

      {/* Requirements & Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requirements */}
        <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Clip Requirements</span>
          </div>
          {Array.isArray(campaign.requirements) && campaign.requirements.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {campaign.requirements.map((req: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">&bull;</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">Standard platform guidelines apply.</p>
          )}
        </div>

        {/* Prohibited Content */}
        <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Prohibited Content</span>
          </div>
          {Array.isArray(campaign.prohibited_content) && campaign.prohibited_content.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {campaign.prohibited_content.map((pro: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">&bull;</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">Standard platform prohibited content policies.</p>
          )}
        </div>
      </div>

      {/* Campaign Leaderboard & Payout Eligibility */}
      <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div>
              <h2 className="text-sm font-bold text-white">Campaign Leaderboard & Clipper Eligibility</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Clipper performance derived strictly from approved submissions. Minimum views for payout:{" "}
                <span className="text-white font-bold">{campaign.minimum_views_for_payout?.toLocaleString() || "None"}</span>
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            {leaderboard.length} Ranked Clippers
          </span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No approved submissions for this campaign yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Clipper</th>
                  <th className="py-3 px-3 text-right">Approved Views</th>
                  <th className="py-3 px-3 text-right">Likes</th>
                  <th className="py-3 px-3 text-right">Approved Clips</th>
                  <th className="py-3 px-3 text-right">Earned</th>
                  <th className="py-3 px-3 text-center">Payout Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {leaderboard.map((item, idx) => (
                  <tr key={item.clipper.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs uppercase border border-purple-500/30">
                          {item.clipper.username.charAt(0)}
                        </div>
                        <span className="font-bold text-white">{item.clipper.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-brand-cyan">
                      {item.approved_views.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {(item.approved_likes || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {item.clips_count}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      ${item.earned.toFixed(2)}
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
                          <span>Needs {((campaign.minimum_views_for_payout || 0) - item.approved_views).toLocaleString()} views</span>
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
  );
}
