"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Loader2 } from "lucide-react";
import {
  DashboardHeader,
  MetricCards,
  ActionCenter,
  CampaignOverview,
  SubmissionQueue,
  Leaderboard,
  PayoutOverview,
} from "@/components/dashboard";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (res.ok && json.data) {
        setData(json.data);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-xs font-semibold text-slate-400">
          Loading platform-wide administrative dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fadeIn">
      {/* 1. Header with Global Platform Scope Badge */}
      <DashboardHeader
        title="Admin Platform Dashboard"
        scopeBadge="GLOBAL SOURCE OF TRUTH"
        badgeVariant="admin"
        description="Platform-wide administration derived strictly from approved submissions and live database records."
        onRefresh={fetchDashboardData}
        isRefreshing={refreshing}
        actions={
          <Link
            href="/admin/campaigns/create"
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-400/10 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Campaign</span>
          </Link>
        }
      />

      {/* 2. Platform-wide Approved Social Metrics Cards */}
      <MetricCards
        approvedViews={data?.totalApprovedViews || 0}
        approvedLikes={data?.totalApprovedLikes || 0}
        approvedComments={data?.totalApprovedComments || 0}
        approvedShares={data?.totalApprovedShares || 0}
        approvedSaves={data?.totalApprovedSaves || 0}
        variant="admin"
        scopeLabel="Platform-Wide Live Totals"
      />

      {/* 3. Admin Action Center */}
      <ActionCenter
        portalType="admin"
        pendingSubmissionsCount={data?.pendingReviewsCount || 0}
      />

      {/* 4. Platform Budgets & Payout Processing Overview */}
      <PayoutOverview
        portalType="admin"
        totalBudget={data?.totalBudget || 0}
        usedBudget={data?.usedBudget || 0}
        remainingBudget={data?.remainingBudget || 0}
        pendingPayoutAmount={data?.pendingPayoutAmount || 0}
        pendingPayoutCount={data?.pendingPayoutCount || 0}
        paidOutAmount={data?.paidOutAmount || 0}
        paidOutCount={data?.paidOutCount || 0}
      />

      {/* 5. Campaign Overview (All Campaigns for Admin) */}
      <CampaignOverview
        portalType="admin"
        campaigns={data?.campaigns || []}
        emptyMessage="No campaigns deployed yet. Click Create Campaign above to launch one."
      />

      {/* 6. Two-Column Layout: Submission Review Queue (Oldest First) & Campaign Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions Queue: Oldest Submission First */}
        <SubmissionQueue
          portalType="admin"
          submissions={data?.pendingSubmissions || []}
          onSubmissionReviewed={fetchDashboardData}
        />

        {/* Campaign Leaderboard: Highest Approved Views to Lowest */}
        <Leaderboard
          portalType="admin"
          campaigns={data?.campaigns || []}
        />
      </div>
    </div>
  );
}
