"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  FileCheck,
  Trophy,
  Eye,
  Heart,
  MessageSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Share2,
  Bookmark,
} from "lucide-react";

export default function ManagerDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick redeem inline state
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/manager/analytics");
      const json = await res.json();
      if (res.ok && json.data) {
        setAnalytics(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleInlineRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;

    try {
      setRedeeming(true);
      setRedeemMessage(null);
      const res = await fetch("/api/manager/access-code/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Invalid or expired access code.");
      }
      setRedeemMessage({
        type: "success",
        text: `Success! You now have access to manage "${json.campaign.name}".`,
      });
      setRedeemCode("");
      await fetchAnalytics();
    } catch (err: any) {
      setRedeemMessage({
        type: "error",
        text: err?.message || "Failed to redeem code.",
      });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <p className="text-xs font-semibold text-slate-400">Loading assigned campaign operations...</p>
      </div>
    );
  }

  const hasAssigned = analytics?.hasAssignedCampaigns !== false && (analytics?.assignedCampaignsCount || 0) > 0;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">Campaign Manager Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">
              ASSIGNED CAMPAIGNS ONLY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review submissions and track verified performance for campaigns delegated to you.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={refreshing}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold transition flex items-center gap-2 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-purple-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* If No Assigned Campaigns Yet */}
      {!hasAssigned ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-[#0D131D] border border-slate-800 text-center max-w-xl mx-auto space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Key className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">No Assigned Campaigns Yet</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              As a Campaign Manager, your access is strictly scoped to the campaigns assigned to you. Enter the Campaign Access Code provided by your administrator to begin managing.
            </p>
          </div>

          <form onSubmit={handleInlineRedeem} className="space-y-3 text-left">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Campaign Access Code
              </label>
              <input
                type="text"
                required
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="CE-MGR-XXXX-XXXX-XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-400 tracking-wider uppercase"
              />
            </div>

            {redeemMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  redeemMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                {redeemMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{redeemMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={redeeming || !redeemCode.trim()}
              className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Redeem Access Code
            </button>
          </form>
        </div>
      ) : (
        /* Has Assigned Campaigns Dashboard */
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Approved Views */}
            <div className="p-5 rounded-2xl bg-[#0D131D] border border-purple-500/30 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Approved Views</span>
                <Eye className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {(analytics?.approvedViews || 0).toLocaleString()}
              </div>
              <p className="text-[10px] text-purple-400/80 font-medium">Your assigned campaigns</p>
            </div>

            {/* Approved Likes */}
            <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Approved Likes</span>
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {(analytics?.approvedLikes || 0).toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500">Live verified engagement</p>
            </div>

            {/* Approved Comments */}
            <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Approved Comments</span>
                <MessageSquare className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {(analytics?.approvedComments || 0).toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500">Live verified engagement</p>
            </div>

            {/* Pending Submissions Queue */}
            <div className="p-5 rounded-2xl bg-[#0D131D] border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Pending Reviews</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {analytics?.pendingReviews || 0}
              </div>
              <p className="text-[10px] text-slate-500">Awaiting your approval</p>
            </div>
          </div>

          {/* Operational Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Review Pipeline Card */}
            <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Review Queue
                </h3>
                <FileCheck className="w-4 h-4 text-purple-400" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Total Submissions Received</span>
                  <span className="font-bold text-white font-mono">{analytics?.totalSubmissions || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Approved Submissions</span>
                  <span className="font-bold text-emerald-400 font-mono">{analytics?.approvedSubmissions || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Rejected Submissions</span>
                  <span className="font-bold text-rose-400 font-mono">{analytics?.rejectedSubmissions || 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-semibold">Pending Review Queue</span>
                  <span className="font-black text-amber-400 font-mono">{analytics?.pendingReviews || 0}</span>
                </div>
              </div>

              <Link
                href="/manager/submissions"
                className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/10"
              >
                <span>Open Submission Review Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Assigned Campaigns Card */}
            <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Assigned Campaigns
                </h3>
                <Compass className="w-4 h-4 text-brand-cyan" />
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-black text-white font-mono">
                  {analytics?.assignedCampaignsCount || 0}
                </div>
                <div className="text-xs text-slate-400">
                  {analytics?.activeCampaignsCount || 0} active campaigns
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                You can review submissions, inspect verified live metrics, and view real-time leaderboards for your assigned campaigns.
              </p>

              <Link
                href="/manager/campaigns"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <span>View Assigned Campaigns</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Campaign Delegation & Codes */}
            <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Assign Another Campaign
                </h3>
                <Key className="w-4 h-4 text-purple-400" />
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Have another Campaign Access Code from your platform administrator? Redeem it to expand your managed portfolio.
              </p>

              <form onSubmit={handleInlineRedeem} className="space-y-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="CE-MGR-XXXX-XXXX..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-400 uppercase"
                />
                <button
                  type="submit"
                  disabled={redeeming || !redeemCode.trim()}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {redeeming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                  Redeem Code
                </button>
              </form>

              {redeemMessage && (
                <div
                  className={`p-2.5 rounded-lg border text-[11px] ${
                    redeemMessage.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  {redeemMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
