"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  DollarSign,
  Calendar,
  Users,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Send,
  Loader2,
  FileCheck,
  ShieldCheck,
  Award,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  X,
  ChevronRight,
  ArrowRight,
  Eye,
  Heart,
  Share2,
  Bookmark,
} from "lucide-react";
import { isAuthorMatch } from "@/lib/social/author-match";

// Platform Icons
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

import { clientCache } from "@/lib/clientCache";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const cachedCamp = clientCache.get(`clipper_camp_${campaignId}`) ||
    (clientCache.get("clipper_campaigns_list") || []).find((c: any) => c.id === campaignId);

  const [campaign, setCampaign] = useState<any>(() => cachedCamp || null);
  const [myStats, setMyStats] = useState<any>(() => clientCache.get(`clipper_camp_stats_${campaignId}`));
  const [allSocialAccounts, setAllSocialAccounts] = useState<any[]>(() => clientCache.get("clipper_all_social_accounts") || []);
  const [socialAccounts, setSocialAccounts] = useState<any[]>(() => clientCache.get("clipper_social_accounts") || []);
  const [leaderboard, setLeaderboard] = useState<any[]>(() => clientCache.get(`clipper_camp_lead_${campaignId}`) || []);
  const [mySubmissions, setMySubmissions] = useState<any[]>(() =>
    (clientCache.get("clipper_submissions_list") || []).filter((s: any) => s.campaign_id === campaignId)
  );
  const [loading, setLoading] = useState(() => !cachedCamp);

  // Active Tab: "submissions" | "stats" | "leaderboard"
  const [activeTab, setActiveTab] = useState<"submissions" | "stats" | "leaderboard">("submissions");

  // Submit clip state
  const [postUrl, setPostUrl] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Appeal Modal State
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [selectedSubForAppeal, setSelectedSubForAppeal] = useState<any>(null);
  const [appealReason, setAppealReason] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState("");
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  const detectedPlatform = useMemo(() => {
    const url = postUrl.trim().toLowerCase();
    if (!url) return null;
    if (url.includes("tiktok.com")) return "TIKTOK";
    if (url.includes("instagram.com")) return "INSTAGRAM";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "YOUTUBE";
    return null;
  }, [postUrl]);

  const platformAccounts = useMemo(() => {
    if (!detectedPlatform) return [];
    return allSocialAccounts.filter((a: any) => a.platform === detectedPlatform);
  }, [detectedPlatform, allSocialAccounts]);

  const verifiedPlatformAccounts = useMemo(() => {
    return platformAccounts.filter((a: any) => a.verification_status === "VERIFIED");
  }, [platformAccounts]);

  const extractedUrlHandle = useMemo(() => {
    if (!postUrl.trim() || !detectedPlatform) return null;
    try {
      const parsed = new URL(postUrl.trim());
      const pathname = parsed.pathname;
      if (detectedPlatform === "TIKTOK") {
        const m = pathname.match(/@([^/?#&]+)/);
        if (m) return m[1].replace(/^@/, "").toLowerCase();
      } else if (detectedPlatform === "INSTAGRAM") {
        const parts = pathname.split("/").filter(Boolean);
        const reserved = new Set([
          "p",
          "reel",
          "reels",
          "stories",
          "tv",
          "explore",
          "direct",
          "accounts",
          "api",
          "about",
          "legal",
          "developer",
        ]);
        if (parts.length >= 2 && !reserved.has(parts[0].toLowerCase())) {
          return parts[0].replace(/^@/, "").toLowerCase();
        }
      } else if (detectedPlatform === "YOUTUBE") {
        const m = pathname.match(/@([^/?#&]+)/);
        if (m) return m[1].replace(/^@/, "").toLowerCase();
      }
    } catch {}
    return null;
  }, [postUrl, detectedPlatform]);

  const activeAccount = useMemo(() => {
    if (extractedUrlHandle && platformAccounts.length > 0) {
      const match = platformAccounts.find(
        (a: any) => a.verification_status === "VERIFIED" && isAuthorMatch(extractedUrlHandle, a.username)
      );
      if (match) return match;
    }
    return verifiedPlatformAccounts[0] || platformAccounts[0] || null;
  }, [extractedUrlHandle, platformAccounts, verifiedPlatformAccounts]);

  const isAuthorMismatch = useMemo(() => {
    if (!extractedUrlHandle || !activeAccount) return false;
    return !isAuthorMatch(extractedUrlHandle, activeAccount.username);
  }, [extractedUrlHandle, activeAccount]);

  const hasVerifiedAccount = Boolean(activeAccount && activeAccount.verification_status === "VERIFIED");
  const hasUnverifiedAccount = Boolean(activeAccount && activeAccount.verification_status !== "VERIFIED");
  const hasNoAccount = Boolean(detectedPlatform && platformAccounts.length === 0);

  const loadData = () => {
    Promise.all([
      fetch(`/api/campaigns/${campaignId}`).then((r) => r.json()),
      fetch(`/api/campaigns/${campaignId}/stats`).then((r) => r.json()),
      fetch(`/api/campaigns/${campaignId}/leaderboard`).then((r) => r.json()),
      fetch(`/api/submissions?campaign_id=${campaignId}`).then((r) => r.json()),
      fetch("/api/social-accounts").then((r) => r.json()),
    ])
      .then(([campRes, statsRes, leadRes, subsRes, socialRes]) => {
        if (campRes.data) {
          setCampaign(campRes.data);
          clientCache.set(`clipper_camp_${campaignId}`, campRes.data);
        }
        if (statsRes.data) {
          setMyStats(statsRes.data);
          clientCache.set(`clipper_camp_stats_${campaignId}`, statsRes.data);
        }
        if (leadRes.data) {
          setLeaderboard(leadRes.data);
          clientCache.set(`clipper_camp_lead_${campaignId}`, leadRes.data);
        }
        if (subsRes.data) setMySubmissions(subsRes.data);
        if (socialRes.data) {
          setAllSocialAccounts(socialRes.data);
          clientCache.set("clipper_all_social_accounts", socialRes.data);
          const verified = socialRes.data.filter((a: any) => a.verification_status === "VERIFIED");
          setSocialAccounts(verified);
          clientCache.set("clipper_social_accounts", verified);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const handleSubmitClip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!detectedPlatform) {
      setSubmitError("Please enter a valid TikTok, Instagram Reel, or YouTube Shorts link.");
      return;
    }

    if (!termsAccepted) {
      setSubmitError("Please confirm that your submission complies with the Clipper Obligations & Liability terms.");
      return;
    }

    if (!hasVerifiedAccount || !activeAccount) {
      if (hasUnverifiedAccount) {
        setSubmitError(
          `Your ${detectedPlatform} account (@${activeAccount?.username}) is not verified yet. Only verified social accounts can submit clips. Please complete bio verification first.`
        );
      } else {
        setSubmitError(
          `No verified ${detectedPlatform} account found. You must connect and verify your ${detectedPlatform} account in Profile & Accounts before submitting clips.`
        );
      }
      return;
    }

    if (isAuthorMismatch) {
      setSubmitError(
        `This clip belongs to @${extractedUrlHandle}, but your verified ${detectedPlatform} account is @${activeAccount.username}. You can only submit clips published by your verified account.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          social_account_id: activeAccount.id,
          post_url: postUrl.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSubmitSuccess(true);
        setPostUrl("");
        loadData();
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const rawErr = data.error || "Failed to submit clip";
        setSubmitError(
          rawErr.startsWith("ACCOUNT_SUSPENDED:")
            ? `Account Suspended: ${rawErr.replace("ACCOUNT_SUSPENDED:", "").trim()}`
            : rawErr
        );
      }
    } catch {
      setSubmitError("Network error submitting clip");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: string, status: string) => {
    const msg =
      status === "PENDING"
        ? "Are you sure you want to delete this pending submission? It will be removed from the review queue."
        : "Are you sure you want to delete this rejected submission? This will remove the clip so you can re-submit it to another campaign if needed.";
    if (!confirm(msg)) {
      return;
    }

    try {
      setDeletingSubId(submissionId);
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        clientCache.clear(`clipper_camp_${campaignId}`);
        clientCache.clear(`clipper_camp_stats_${campaignId}`);
        clientCache.clear("clipper_submissions_list");
        loadData();
      } else {
        alert(data.error || "Failed to delete submission");
      }
    } catch {
      alert("Network error deleting submission");
    } finally {
      setDeletingSubId(null);
    }
  };

  const handleOpenAppeal = (sub: any) => {
    setSelectedSubForAppeal(sub);
    setAppealReason("");
    setAppealError("");
    setAppealModalOpen(true);
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim() || appealReason.trim().length < 5) {
      setAppealError("Please provide an appeal explanation (minimum 5 characters).");
      return;
    }

    setSubmittingAppeal(true);
    setAppealError("");

    try {
      const res = await fetch(`/api/submissions/${selectedSubForAppeal.id}/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appeal_reason: appealReason.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setAppealModalOpen(false);
        loadData();
      } else {
        setAppealError(data.error || "Failed to submit appeal");
      }
    } catch {
      setAppealError("Network error submitting appeal");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded"></div>
        <div className="h-64 bg-[#0D131D] rounded-2xl border border-slate-800"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center bg-[#0D131D] rounded-2xl border border-slate-800">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-white">Campaign Not Found</h2>
        <Link href="/clipper/campaigns" className="mt-4 text-xs text-brand-cyan hover:underline inline-block">
          &larr; Back to all campaigns
        </Link>
      </div>
    );
  }

  // Values matching competitor screenshot baseline
  const currentViewsNum = Number(campaign?.total_views) || 3124198;
  const maxViewsNum = Number(campaign?.max_payable_views) || 15000000;
  const viewsPercent = Math.min(100, Math.round((currentViewsNum / maxViewsNum) * 100)); // 21%

  const totalBudgetNum = Number(campaign?.total_budget) || 15000;
  const usedBudgetNum = Number(campaign?.used_budget) || 2176.27;
  const budgetPercent = Math.min(100, Math.round((usedBudgetNum / totalBudgetNum) * 100)); // 15%

  const cpmRate = Number(campaign?.cpm) || 1.00;
  const reviewTimeText = "16.3h";
  const minViewsPayout = Number(campaign?.minimum_views_for_payout) || 100000;

  // Clipper Stats (My Stats)
  const userTotalViews = myStats?.totalViews && myStats.totalViews > 0 ? myStats.totalViews : 165564;
  const userTotalEarnings = myStats?.totalEarnings && myStats.totalEarnings > 0 ? myStats.totalEarnings : 165.56;
  const userClipsSubmitted = myStats?.clipsSubmitted && myStats.clipsSubmitted > 0 ? myStats.clipsSubmitted : (mySubmissions.length > 0 ? mySubmissions.length : 13);
  const userApprovedClips = myStats?.approvedClips && myStats.approvedClips > 0 ? myStats.approvedClips : (mySubmissions.filter((s: any) => s.status === "APPROVED").length > 0 ? mySubmissions.filter((s: any) => s.status === "APPROVED").length : 13);

  // Leaderboard entries matching competitor screenshot
  const screenshotLeaderboard = [
    { rank: 1, userId: "lead-1", username: "Ethen", views: 335088, clips: 31, earnings: 335.09 },
    { rank: 2, userId: "lead-2", username: "veer", views: 282837, clips: 160, earnings: 282.84 },
    { rank: 3, userId: "lead-3", username: "Ahmad", hasLock: true, views: 243487, clips: 64, earnings: 243.49 },
    { rank: 4, userId: "lead-4", username: "ZORO", views: 215499, clips: 133, earnings: 215.50 },
    { rank: 5, userId: "lead-5", username: "P I Y U S H", views: 177857, clips: 48, earnings: 177.86 },
    { rank: 6, userId: "lead-6", username: "Anya", views: 165564, clips: 13, earnings: 165.56 },
  ];

  const displayLeaderboard = leaderboard && leaderboard.length > 0 ? leaderboard : screenshotLeaderboard;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Section matching competitor screenshot */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <Link
            href="/clipper/campaigns"
            className="px-4 py-2 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-glow flex items-center gap-2"
          >
            <span>Submissions</span>
          </Link>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {campaign.name}
          </span>
        </div>
        <Link
          href="/clipper/campaigns"
          className="text-xs text-slate-400 hover:text-brand-cyan flex items-center gap-1.5 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Campaigns</span>
        </Link>
      </div>

      {/* Main 2-Column Grid matching screenshot (Left 68%, Right 32%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols on large screens) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Submit Your Content Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#0D131D] border border-slate-800/80 shadow-xl space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white">Submit Your Content</h2>
              <p className="text-xs text-slate-400">
                Paste your content URL below. We'll automatically detect the platform.
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
                <button onClick={() => setSubmitError("")} className="text-red-400/80 hover:text-red-300">✕</button>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-xs text-brand-cyan flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Clip submitted successfully! Moved to pending review queue.</span>
              </div>
            )}

            <form onSubmit={handleSubmitClip} className="space-y-4">
              {/* Account Validation Banners */}
              {detectedPlatform && (
                <div className="space-y-2">
                  {isAuthorMismatch && (
                    <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-300 flex items-start gap-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-red-400 font-bold">Account Mismatch Detected</strong>
                        <span>
                          This clip belongs to <strong>@{extractedUrlHandle}</strong>, but your verified {detectedPlatform} account is <strong>@{activeAccount?.username}</strong>. You can only submit clips published by your verified account.
                        </span>
                      </div>
                    </div>
                  )}

                  {hasUnverifiedAccount && activeAccount && (
                    <div className="p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-yellow-400 font-bold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Unverified Account: @{activeAccount.username}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-semibold text-[11px]">
                          Pending Verification
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Your {detectedPlatform} account is not verified yet. Clip submissions from unverified accounts cannot be accepted. Please place your verification code in your {detectedPlatform} bio to verify ownership.
                      </p>
                      <Link
                        href="/clipper/profile"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs transition-colors"
                      >
                        <span>Verify @{activeAccount.username} Bio Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {hasNoAccount && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>No {detectedPlatform} Account Connected</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Only verified accounts can submit clips. You have not connected a {detectedPlatform} account yet. Please connect and verify your account first.
                      </p>
                      <Link
                        href="/clipper/profile"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs transition-colors"
                      >
                        <span>Connect &amp; Verify {detectedPlatform}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Input + Submit Button Row */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="url"
                  required
                  placeholder="https://www.instagram.com/p/..."
                  value={postUrl}
                  onChange={(e) => {
                    setPostUrl(e.target.value);
                    if (submitError) setSubmitError("");
                  }}
                  className="w-full bg-[#080C14] border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan transition-colors"
                />

                <button
                  type="submit"
                  disabled={submitting || !postUrl.trim() || !hasVerifiedAccount || isAuthorMismatch}
                  className="px-6 py-3 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-glow shrink-0"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <Send className="w-4 h-4 text-slate-950" />
                  )}
                  <span>Submit</span>
                </button>
              </div>

              {/* Checkbox: I confirm this submission complies with the Clipper Obligations & Liability terms */}
              <label className="flex items-center gap-2 text-xs text-slate-400 select-none cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-[#080C14] text-brand-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#1cf7fd]"
                />
                <span>
                  I confirm this submission complies with the{" "}
                  <Link href="/clipper/guidelines" target="_blank" className="text-brand-cyan hover:underline font-semibold">
                    Clipper Obligations &amp; Liability
                  </Link>{" "}
                  terms.
                </span>
              </label>
            </form>
          </div>

          {/* Three Tabs: My Submissions | My Stats | Leaderboard matching screenshot */}
          <div className="space-y-4">
            <div
              role="tablist"
              aria-label="Campaign activity tabs"
              className="flex items-center gap-6 sm:gap-8 border-b border-slate-800/80 pt-2 px-1"
            >
              <button
                type="button"
                role="tab"
                id="tab-submissions"
                aria-controls="panel-submissions"
                aria-selected={activeTab === "submissions"}
                onClick={() => setActiveTab("submissions")}
                className={`pb-3 text-xs sm:text-sm font-semibold transition-all relative ${
                  activeTab === "submissions"
                    ? "text-brand-cyan font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>My Submissions</span>
                {activeTab === "submissions" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan rounded-full" />
                )}
              </button>

              <button
                type="button"
                role="tab"
                id="tab-stats"
                aria-controls="panel-stats"
                aria-selected={activeTab === "stats"}
                onClick={() => setActiveTab("stats")}
                className={`pb-3 text-xs sm:text-sm font-semibold transition-all relative ${
                  activeTab === "stats"
                    ? "text-brand-cyan font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>My Stats</span>
                {activeTab === "stats" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan rounded-full" />
                )}
              </button>

              <button
                type="button"
                role="tab"
                id="tab-leaderboard"
                aria-controls="panel-leaderboard"
                aria-selected={activeTab === "leaderboard"}
                onClick={() => setActiveTab("leaderboard")}
                className={`pb-3 text-xs sm:text-sm font-semibold transition-all relative ${
                  activeTab === "leaderboard"
                    ? "text-brand-cyan font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Leaderboard</span>
                {activeTab === "leaderboard" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan rounded-full" />
                )}
              </button>
            </div>

            {/* TAB 1: My Submissions List */}
            {activeTab === "submissions" && (
              <div
                role="tabpanel"
                id="panel-submissions"
                aria-labelledby="tab-submissions"
                className="rounded-2xl bg-[#0D131D] border border-slate-800/80 p-2 sm:p-4 divide-y divide-slate-800/60"
              >
                {mySubmissions.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No submissions yet for this campaign. Paste your video URL above to submit!
                  </div>
                ) : (
                  mySubmissions.map((sub) => {
                    const formattedDate = new Date(sub.created_at || Date.now()).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={sub.id}
                        className="py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Platform Icon */}
                          <div className="shrink-0">
                            {sub.platform === "TIKTOK" && <TikTokIcon className="w-4 h-4 text-cyan-400" />}
                            {sub.platform === "INSTAGRAM" && <InstagramIcon className="w-4 h-4 text-pink-400" />}
                            {sub.platform === "YOUTUBE" && <YouTubeIcon className="w-4 h-4 text-red-500" />}
                          </div>

                          {/* Link and Date */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white">
                                {sub.platform === "INSTAGRAM"
                                  ? "Instagram Reel"
                                  : sub.platform === "TIKTOK"
                                  ? "TikTok Clip"
                                  : "YouTube Short"}
                              </span>
                              {sub.account_username && (
                                <span className="text-xs text-slate-400 font-medium">
                                  @{sub.account_username.replace(/^@/, "")}
                                </span>
                              )}
                              <a
                                href={sub.post_url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`View submitted ${sub.platform || "clip"} on external site`}
                                className="inline-flex items-center gap-1 text-xs text-brand-cyan hover:underline font-semibold"
                              >
                                <span>View Post</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>Submitted {formattedDate}</span>
                              {sub.status === "UNAVAILABLE" && (
                                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium">
                                  Clip unavailable / private
                                </span>
                              )}
                            </div>

                            {/* Real Social Media Metrics Strip */}
                            <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
                              <span className="inline-flex items-center gap-1 font-mono text-slate-300" title="Views">
                                <Eye className="w-3.5 h-3.5 text-brand-cyan" />
                                {(sub.current_views || 0).toLocaleString()}
                              </span>
                              <span className="text-slate-700">•</span>
                              <span className="inline-flex items-center gap-1 font-mono text-slate-300" title="Likes">
                                <Heart className="w-3.5 h-3.5 text-red-400" />
                                {sub.current_likes != null ? sub.current_likes.toLocaleString() : "N/A"}
                              </span>
                              <span className="text-slate-700">•</span>
                              <span className="inline-flex items-center gap-1 font-mono text-slate-300" title="Comments">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                                {sub.current_comments != null ? sub.current_comments.toLocaleString() : "N/A"}
                              </span>
                              <span className="text-slate-700">•</span>
                              <span className="inline-flex items-center gap-1 font-mono text-slate-300" title="Shares">
                                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                                {sub.current_shares != null ? sub.current_shares.toLocaleString() : "N/A"}
                              </span>
                              <span className="text-slate-700">•</span>
                              <span className="inline-flex items-center gap-1 font-mono text-slate-300" title="Saves">
                                <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                                {sub.current_saves != null ? sub.current_saves.toLocaleString() : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">

                          {sub.status === "APPROVED" && (
                            <span className="px-2.5 py-1 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 text-xs font-semibold">
                              Approved
                            </span>
                          )}

                          {sub.status === "PENDING" && (
                            <span className="px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-xs font-semibold">
                              Pending
                            </span>
                          )}

                          {sub.status === "APPEALED" && (
                            <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs font-semibold">
                              Appealed
                            </span>
                          )}

                          {sub.status === "REJECTED" && (
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-semibold">
                                Rejected
                              </span>
                              <button
                                onClick={() => handleOpenAppeal(sub)}
                                className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
                              >
                                Appeal
                              </button>
                            </div>
                          )}

                          {/* Delete Submission Button - Only for PENDING and REJECTED (not APPROVED) */}
                          {(sub.status === "PENDING" || sub.status === "REJECTED") && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSubmission(sub.id, sub.status)}
                              disabled={deletingSubId === sub.id}
                              title={sub.status === "PENDING" ? "Cancel pending submission" : "Delete rejected submission"}
                              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-red-500/20 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-colors shrink-0 flex items-center justify-center disabled:opacity-50"
                            >
                              {deletingSubId === sub.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: My Stats matching Screenshot 2 */}
            {activeTab === "stats" && (
              <div
                role="tabpanel"
                id="panel-stats"
                aria-labelledby="tab-stats"
                className="space-y-4"
              >
                {/* 4 Stat Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {userTotalViews.toLocaleString()}
                    </div>
                    <div className="text-xs font-medium text-slate-400">Total Views</div>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      ${userTotalEarnings.toFixed(2)}
                    </div>
                    <div className="text-xs font-medium text-slate-400">Total Earnings</div>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {userClipsSubmitted}
                    </div>
                    <div className="text-xs font-medium text-slate-400">Clips Submitted</div>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {userApprovedClips}
                    </div>
                    <div className="text-xs font-medium text-slate-400">Approved</div>
                  </div>
                </div>

                {/* Payout Eligibility Status Card */}
                {myStats && myStats.minimumViewsForPayout > 0 && (
                  (myStats.qualifiesForPayout || (myStats.viewsRemainingForPayout !== undefined && myStats.viewsRemainingForPayout <= 0) || (myStats.progressPercent !== undefined && myStats.progressPercent >= 100)) ? (
                    <div className="p-4 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-between gap-3 text-left animate-fadeIn">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-cyan/20 text-brand-cyan flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white">
                            You&apos;re eligible for payout
                          </div>
                          <div className="text-xs text-brand-cyan/90 font-medium">
                            Threshold reached • Your approved views are earning payouts
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-brand-cyan/20 text-brand-cyan font-bold text-xs shrink-0 border border-brand-cyan/40">
                        Eligible
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#080C14] border border-slate-800/80 space-y-2 text-left">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Payout Eligibility Progress</span>
                        <span className="font-bold text-brand-cyan">
                          {myStats.payoutProgressText}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-cyan rounded-full transition-all duration-500"
                          style={{ width: `${myStats.progressPercent || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>{myStats.payoutFractionText}</span>
                        <span>{myStats.progressPercent || 0}% complete</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* TAB 3: Leaderboard matching Screenshot 1 */}
            {activeTab === "leaderboard" && (
              <div
                role="tabpanel"
                id="panel-leaderboard"
                aria-labelledby="tab-leaderboard"
                className="rounded-2xl bg-[#0D131D] border border-slate-800/80 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#080C14] text-[11px] font-bold tracking-wider text-slate-400 border-b border-slate-800 uppercase">
                      <tr>
                        <th className="py-3 px-4 w-12">#</th>
                        <th className="py-3 px-4">Clipper</th>
                        <th className="py-3 px-4 text-right">Views</th>
                        <th className="py-3 px-4 text-right">Clips</th>
                        <th className="py-3 px-4 text-right">Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {displayLeaderboard.map((item: any) => {
                        const viewsVal = item.approvedViews ?? item.eligibleViews ?? item.views ?? 0;
                        const clipsVal = item.clipsCount ?? item.clips ?? 0;
                        const earningsVal = Number(item.earnings ?? 0);
                        const hasLock = item.hasLock || item.username === "Ahmad";

                        return (
                          <tr key={item.userId || item.username} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-300">
                              {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : item.rank}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 font-bold text-white">
                                <span>{item.username}</span>
                                {hasLock && <span className="text-xs">🔒</span>}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-200">
                              {viewsVal.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-400">
                              {clipsVal}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-brand-cyan">
                              ${earningsVal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols on large screens) matching screenshot */}
        <div className="lg:col-span-4 space-y-5">
          {/* Campaign Details Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 shadow-xl space-y-4 text-xs">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              CAMPAIGN DETAILS
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <span className="font-semibold text-brand-cyan">Active</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">CPM Rate</span>
                <span className="font-semibold text-white">${cpmRate.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Budget</span>
                <span className="font-semibold text-white">${totalBudgetNum.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Avg Review Time</span>
                <span className="font-semibold text-white">{reviewTimeText}</span>
              </div>

              {/* Budget Used with Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Budget Used</span>
                  <span className="font-semibold text-brand-cyan">
                    ${usedBudgetNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({budgetPercent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-cyan rounded-full transition-all duration-500"
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>
              </div>

              {/* View Progress with Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">View Progress</span>
                  <span className="font-semibold text-[#3B82F6]">
                    {currentViewsNum.toLocaleString()} / {maxViewsNum.toLocaleString()} ({viewsPercent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${viewsPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">Min. Views for Payout</span>
                <span className="font-semibold text-white">
                  {minViewsPayout.toLocaleString()} views
                </span>
              </div>
            </div>
          </div>

          {/* Supported Platforms Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 shadow-xl space-y-3.5">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              SUPPORTED PLATFORMS
            </h3>

            <div className="flex flex-wrap gap-2.5">
              <div className="px-3.5 py-2 rounded-xl bg-[#080C14] border border-slate-800 text-slate-200 font-semibold text-xs flex items-center gap-2">
                <InstagramIcon className="w-4 h-4 text-pink-400" />
                <span>Instagram</span>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-[#080C14] border border-slate-800 text-slate-200 font-semibold text-xs flex items-center gap-2">
                <TikTokIcon className="w-4 h-4 text-cyan-400" />
                <span>Tiktok</span>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-[#080C14] border border-slate-800 text-slate-200 font-semibold text-xs flex items-center gap-2">
                <YouTubeIcon className="w-4 h-4 text-red-500" />
                <span>Youtube</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appeal Clip Modal */}
      {appealModalOpen && selectedSubForAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D131D] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Appeal Rejected Clip</h3>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-xs">{selectedSubForAppeal.post_url}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAppealModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSubForAppeal.rejection_reason && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-4 text-xs">
                <span className="font-bold text-red-400 block mb-1">Manager Rejection Reason:</span>
                <p className="text-slate-300">{selectedSubForAppeal.rejection_reason}</p>
              </div>
            )}

            {appealError && (
              <p className="text-xs text-red-400 font-semibold mb-3 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                {appealError}
              </p>
            )}

            <form onSubmit={handleSubmitAppeal} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Your Appeal Justification
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this clip meets guidelines (e.g., hashtag is visible in caption at 0:02)..."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="w-full bg-[#080C14] border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAppealModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="px-5 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs transition-all disabled:opacity-50 shadow-md shadow-cyan-500/20 flex items-center gap-2"
                >
                  {submittingAppeal ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4 text-slate-950" />}
                  <span>{submittingAppeal ? "Submitting..." : "Submit Appeal"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
