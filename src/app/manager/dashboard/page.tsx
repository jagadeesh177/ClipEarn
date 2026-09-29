"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Compass,
} from "lucide-react";
import {
  DashboardHeader,
  MetricCards,
  ActionCenter,
  CampaignOverview,
  SubmissionQueue,
  Leaderboard,
  PayoutOverview,
} from "@/components/dashboard";

export default function ManagerDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick redeem inline state
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/manager/dashboard");
      const json = await res.json();
      if (res.ok && json.data) {
        setData(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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
        text: `Success! You now have operational access to manage "${json.campaign.name}".`,
      });
      setRedeemCode("");
      await fetchDashboardData();
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
      <div className="p-8 sm:p-16 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <p className="text-xs font-semibold text-slate-400">
          Loading assigned campaign operations...
        </p>
      </div>
    );
  }

  const hasAssigned =
    data?.hasAssignedCampaigns !== false && (data?.assignedCampaignsCount || 0) > 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fadeIn">
      {/* 1. Header with Assigned Campaigns Scope Badge */}
      <DashboardHeader
        title="Campaign Manager Hub"
        scopeBadge="ASSIGNED CAMPAIGNS ONLY"
        badgeVariant="manager"
        description="Review submissions and inspect verified performance strictly for campaigns assigned to your account."
        onRefresh={fetchDashboardData}
        isRefreshing={refreshing}
        actions={
          <Link
            href="/manager/redeem"
            className="px-4 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center gap-2 active:scale-95"
          >
            <Key className="w-4 h-4 text-purple-400" />
            <span>Redeem Access Code</span>
          </Link>
        }
      />

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
              className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              <span>Redeem Access Code</span>
            </button>
          </form>
        </div>
      ) : (
        /* Has Assigned Campaigns Dashboard */
        <div className="space-y-8">
          {/* 2. Manager-Scoped Approved Social Metrics */}
          <MetricCards
            approvedViews={data?.approvedViews || 0}
            approvedLikes={data?.approvedLikes || 0}
            approvedComments={data?.approvedComments || 0}
            approvedShares={data?.approvedShares || 0}
            approvedSaves={data?.approvedSaves || 0}
            variant="manager"
            scopeLabel="Assigned Campaigns Only"
          />

          {/* 3. Campaign Manager Action Center */}
          <ActionCenter
            portalType="manager"
            pendingSubmissionsCount={data?.pendingReviewsCount || 0}
          />

          {/* 4. Manager Payout Qualification Overview */}
          <PayoutOverview
            portalType="manager"
            qualifiedClippersCount={data?.qualifiedClippersCount || 0}
          />

          {/* 5. Assigned Campaigns Overview */}
          <CampaignOverview
            portalType="manager"
            campaigns={data?.campaigns || []}
            emptyMessage="No campaigns assigned yet. Redeem an access code above to begin."
          />

          {/* 6. Two-Column Layout: Submission Review Queue (Oldest First) & Campaign Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submissions Queue: Oldest Submission First (ORDER BY submitted_at ASC, id ASC) */}
            <SubmissionQueue
              portalType="manager"
              submissions={data?.pendingSubmissions || []}
              onSubmissionReviewed={fetchDashboardData}
            />

            {/* Campaign Leaderboard: Highest Approved Views to Lowest */}
            <Leaderboard
              portalType="manager"
              campaigns={data?.campaigns || []}
            />
          </div>
        </div>
      )}
    </div>
  );
}
