"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  DollarSign,
  Trophy,
  Users,
  Play,
  Pause,
  StopCircle,
  Key,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  ShieldCheck,
  Film,
} from "lucide-react";

export default function AdminCampaignDetailsPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Access Code Generation State
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generatedCodePlaintext, setGeneratedCodePlaintext] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      const [campRes, leadRes, codesRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}`),
        fetch(`/api/campaigns/${campaignId}/leaderboard`),
        fetch(`/api/campaigns/${campaignId}/access-codes`),
      ]);

      const campJson = await campRes.json();
      const leadJson = await leadRes.json();
      const codesJson = await codesRes.json();

      if (campRes.ok && campJson.data) {
        setCampaign(campJson.data);
      }
      if (leadRes.ok && leadJson.data) {
        setLeaderboard(leadJson.data);
      }
      if (codesRes.ok && codesJson.data) {
        setAccessCodes(codesJson.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setActionLoading(true);
      setStatusMessage(null);
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update campaign status.");
      }
      setStatusMessage({
        type: "success",
        text: `Campaign status updated to ${newStatus}.`,
      });
      await fetchCampaignData();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to update campaign status.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateAccessCode = async () => {
    try {
      setGeneratingCode(true);
      setGeneratedCodePlaintext(null);
      setCopiedCode(false);

      const res = await fetch(`/api/campaigns/${campaignId}/access-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to generate campaign access code.");
      }

      const plaintext =
        json.data?.plaintextCode ||
        json.code ||
        json.plaintextCode ||
        json.data?.code;

      if (!plaintext) {
        throw new Error(json.error || "Failed to retrieve generated access code from server response.");
      }

      setGeneratedCodePlaintext(plaintext);
      await fetchCampaignData();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to generate access code.",
      });
    } finally {
      setGeneratingCode(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-xs font-semibold text-slate-400">Loading campaign command center...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Campaign Not Found</h2>
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>
      </div>
    );
  }

  const budgetUsed = campaign.used_budget || 0;
  const totalBudget = campaign.total_budget || 0;
  const remainingBudget = Math.max(0, totalBudget - budgetUsed);
  const budgetPercent = totalBudget > 0 ? Math.min(100, Math.round((budgetUsed / totalBudget) * 100)) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/campaigns"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{campaign.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  campaign.status === "ACTIVE"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : campaign.status === "PAUSED"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {campaign.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{campaign.brand_name} • Single Source of Truth</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {campaign.status === "ACTIVE" ? (
            <button
              onClick={() => handleUpdateStatus("PAUSED")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" /> Pause Campaign
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus("ACTIVE")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Resume Campaign
            </button>
          )}

          {campaign.status !== "ENDED" && (
            <button
              onClick={() => handleUpdateStatus("ENDED")}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 text-xs font-bold transition flex items-center gap-1.5"
            >
              <StopCircle className="w-3.5 h-3.5" /> End Campaign
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SECTION: CAMPAIGN OVERVIEW (Approved metrics only) */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          Campaign Overview (Approved Submissions Only)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="p-5 rounded-2xl bg-[#0D131D] border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Approved Views</span>
              <Eye className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {(campaign.approved_views || campaign.total_views || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-amber-400/80">Status = APPROVED</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Approved Likes</span>
              <Heart className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {(campaign.approved_likes || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500">Live verified</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Approved Comments</span>
              <MessageSquare className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {(campaign.approved_comments || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500">Live verified</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Approved Shares</span>
              <Share2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {campaign.approved_shares ? campaign.approved_shares.toLocaleString() : "N/A"}
            </div>
            <p className="text-[10px] text-slate-500">Live verified</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Approved Saves</span>
              <Bookmark className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {campaign.approved_saves ? campaign.approved_saves.toLocaleString() : "N/A"}
            </div>
            <p className="text-[10px] text-slate-500">Live verified</p>
          </div>
        </div>
      </div>

      {/* SECTION: CAMPAIGN BUDGET & PAYOUT ELIGIBILITY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Campaign Budget */}
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Campaign Budget
            </h3>
            <span className="text-xs font-bold text-amber-400 font-mono">
              CPM: ${campaign.cpm.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400">Total Budget</div>
              <div className="text-lg font-black text-white font-mono mt-0.5">
                ${totalBudget.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400">Earned / Committed</div>
              <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                ${budgetUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400">Remaining</div>
              <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                ${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Budget Consumption</span>
              <span className="font-bold text-white">{budgetPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Payout Eligibility Overview */}
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Payout Eligibility
            </h3>
            <span className="text-[11px] text-slate-500">
              Min Threshold: {(campaign.minimum_views_for_payout || 0).toLocaleString()} views
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400">Eligible Clippers</div>
              <div className="text-lg font-black text-white font-mono mt-0.5">
                {campaign.payout_summary?.eligible_clippers_count ?? 0}
              </div>
              <div className="text-[10px] text-slate-500">Reached threshold</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400">Pending Payment</div>
              <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                ${(campaign.payout_summary?.pending_payment_amount ?? 0).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500">In queue / processing</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400">Paid Out</div>
              <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                ${(campaign.payout_summary?.paid_amount ?? 0).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500">Completed payouts</div>
            </div>
          </div>

          <Link
            href="/admin/payouts"
            className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Open Payout Center to Process Eligible Clippers
          </Link>
        </div>
      </div>

      {/* SECTION: CAMPAIGN LEADERBOARD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Campaign Leaderboard (Calculated Strictly From This Campaign)
          </h2>
          <span className="text-[11px] text-slate-500">
            {leaderboard.length} active participating clippers
          </span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0D131D] border border-slate-800 text-center text-xs text-slate-500">
            No approved submissions for this campaign yet.
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0D131D] border border-slate-800/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080C14] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                    <th className="py-3.5 px-4">Clipper</th>
                    <th className="py-3.5 px-4 text-right">Approved Views</th>
                    <th className="py-3.5 px-4 text-right">Earnings</th>
                    <th className="py-3.5 px-4 text-center">Payout Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {leaderboard.map((item) => (
                    <tr key={item.userId} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-4 text-center font-bold text-slate-300">
                        {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `#${item.rank}`}
                      </td>

                      <td className="py-4 px-4 font-bold text-white">
                        {item.username}
                      </td>

                      <td className="py-4 px-4 text-right font-bold text-slate-200 font-mono">
                        {item.approvedViews.toLocaleString()}
                      </td>

                      <td className="py-4 px-4 text-right font-bold text-amber-400 font-mono">
                        ${item.earnings.toFixed(2)}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.payoutStatus === "PAID"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : item.payoutStatus === "PROCESSING"
                              ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                              : item.payoutStatus === "ELIGIBLE"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-slate-800 text-slate-500 border-slate-700"
                          }`}
                        >
                          {item.payoutStatus === "ELIGIBLE"
                            ? "Eligible"
                            : item.payoutStatus === "PAID"
                            ? "Paid"
                            : item.payoutStatus === "PROCESSING"
                            ? "Processing"
                            : "Not Eligible"}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        {item.payoutStatus === "ELIGIBLE" ? (
                          <Link
                            href="/admin/payouts"
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-bold text-xs transition"
                          >
                            Pay Clipper
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION: CAMPAIGN MANAGER ASSIGNMENTS */}
      <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Key className="w-3.5 h-3.5" />
              Campaign Manager Delegation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate Campaign Access Codes to assign Campaign Managers to operate this campaign.
            </p>
          </div>

          <button
            onClick={handleGenerateAccessCode}
            disabled={generatingCode}
            className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Key className="w-3.5 h-3.5" />
            {generatingCode ? "Generating..." : "Generate Manager Code"}
          </button>
        </div>

        {generatedCodePlaintext && (
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-200">
                New Manager Access Code Generated (One-Time Display):
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCodePlaintext);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold transition flex items-center gap-1"
              >
                {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedCode ? "Copied" : "Copy Code"}
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-black/60 border border-purple-500/30 font-mono text-sm font-black text-purple-300 tracking-wider">
              {generatedCodePlaintext}
            </div>
            <p className="text-[11px] text-slate-400">
              Provide this code to your Campaign Manager. Once redeemed, they can review submissions and manage this campaign without gaining admin financial powers.
            </p>
          </div>
        )}

        {accessCodes.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <div className="text-[11px] font-bold text-slate-400">Existing Manager Access Codes:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {accessCodes.map((code) => (
                <div
                  key={code.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-300">{code.code_preview}</span>
                    <div className="text-[10px] text-slate-500">
                      {code.status === "REDEEMED" && code.manager
                        ? `Assigned to: ${code.manager.username}`
                        : "Unredeemed / Active"}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      code.status === "REDEEMED"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {code.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
