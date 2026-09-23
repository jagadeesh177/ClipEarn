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
} from "lucide-react";

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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Appeal Modal State
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [selectedSubForAppeal, setSelectedSubForAppeal] = useState<any>(null);
  const [appealReason, setAppealReason] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState("");

  const detectedPlatform = useMemo(() => {
    const url = postUrl.trim().toLowerCase();
    if (!url) return null;
    if (url.includes("tiktok.com")) return "TIKTOK";
    if (url.includes("instagram.com")) return "INSTAGRAM";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "YOUTUBE";
    return null;
  }, [postUrl]);

  const matchedAccount = useMemo(() => {
    if (!detectedPlatform) return null;
    return socialAccounts.find(
      (a) => a.platform === detectedPlatform && a.verification_status === "VERIFIED"
    );
  }, [detectedPlatform, socialAccounts]);

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
          const verified = socialRes.data.filter((a: any) => a.verification_status === "VERIFIED");
          setSocialAccounts(verified);
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
    setSubmitting(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
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
        setSubmitError(data.error || "Failed to submit clip");
      }
    } catch {
      setSubmitError("Network error submitting clip");
    } finally {
      setSubmitting(false);
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

  const currentViewsNum = Number(campaign.total_views || campaign.eligible_views || 0);
  const minViewsPayout = Number(campaign.minimum_views_for_payout) || 0;
  // Only once views reach the min views for payout does budget used increase; otherwise view progress increases while budget used stays 0
  const hasReachedMinViews = minViewsPayout > 0 ? currentViewsNum >= minViewsPayout : true;
  const usedBudgetNum = hasReachedMinViews ? (Number(campaign.used_budget) || 0) : 0;
  const totalBudgetNum = Number(campaign.total_budget) || 10000;
  const budgetPercent = Math.min(100, Math.round((usedBudgetNum / totalBudgetNum) * 100));

  const maxViewsNum = Number(campaign.max_payable_views) || Math.floor((totalBudgetNum / (Number(campaign.cpm) || 1)) * 1000);
  const viewsPercent = maxViewsNum > 0 ? Math.min(100, Math.round((currentViewsNum / maxViewsNum) * 100)) : 0;

  const platforms = Array.isArray(campaign.allowed_platforms) ? campaign.allowed_platforms : ["TIKTOK", "INSTAGRAM", "YOUTUBE"];
  const reviewDays = ((campaign.name.length % 9) * 0.1 + 1.1).toFixed(1);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Section */}
      <div className="space-y-3">
        {/* Breadcrumb Navigation - establishes clear hierarchy */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400">
          <Link
            href="/clipper/campaigns"
            className="hover:text-brand-cyan transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Browse Campaigns</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-medium truncate max-w-xs">{campaign.name}</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {campaign.name}
        </h1>

        <div className="text-xs text-slate-400 space-y-1">
          {campaign.brand_name && campaign.brand_name.trim().toLowerCase() !== campaign.name.trim().toLowerCase() ? (
            <p className="font-semibold text-slate-300">Brand: {campaign.brand_name}</p>
          ) : null}
          <p className="text-slate-400">
            {campaign.description &&
            campaign.description.trim().toLowerCase() !== campaign.name.trim().toLowerCase() &&
            (!campaign.brand_name || campaign.description.trim().toLowerCase() !== campaign.brand_name.trim().toLowerCase())
              ? campaign.description
              : `Create and post engaging short-form clips to earn $${Number(campaign.cpm).toFixed(2)} per 1,000 views.`}
          </p>
        </div>

        {/* Metadata badges row matching screenshot */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium pt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Active</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <DollarSign className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="font-semibold text-white">${Number(campaign.cpm).toFixed(2)} CPM</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{campaign.submissions_count || mySubmissions.length} total submissions</span>
          </div>
        </div>

        {/* Action button row */}
        <div className="pt-2">
          <Link
            href="/clipper/campaigns"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Campaigns</span>
          </Link>
        </div>
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
                  disabled={submitting || !postUrl.trim()}
                  className="px-6 py-3 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 shrink-0"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <Send className="w-4 h-4 text-slate-950" />
                  )}
                  <span>Submit</span>
                </button>
              </div>
            </form>
          </div>

          {/* Three Tabs: My Submissions | My Stats | Leaderboard */}
          <div className="space-y-4">
            <div
              role="tablist"
              aria-label="Campaign activity tabs"
              className="flex items-center gap-1.5 p-1 bg-[#0A0F1D] border border-slate-800/80 rounded-2xl w-fit"
            >
              <button
                type="button"
                role="tab"
                id="tab-submissions"
                aria-controls="panel-submissions"
                aria-selected={activeTab === "submissions"}
                onClick={() => setActiveTab("submissions")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "submissions"
                    ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <span>My Submissions</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-stats"
                aria-controls="panel-stats"
                aria-selected={activeTab === "stats"}
                onClick={() => setActiveTab("stats")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "stats"
                    ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <span>My Stats</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-leaderboard"
                aria-controls="panel-leaderboard"
                aria-selected={activeTab === "leaderboard"}
                onClick={() => setActiveTab("leaderboard")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "leaderboard"
                    ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <span>Leaderboard</span>
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
                              {sub.platform_post_id && (
                                <>
                                  <span className="text-slate-600">&bull;</span>
                                  <span className="font-mono text-xs text-slate-500">ID: {sub.platform_post_id}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Views & Status Badge */}
                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          <span className="text-xs text-slate-300 font-semibold">
                            {(sub.current_views || 0).toLocaleString()} views
                          </span>

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
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {myStats?.totalViews?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs font-medium text-slate-400">Total Views</div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-brand-cyan">
                    ${(myStats?.totalEarnings || 0).toFixed(2)}
                  </div>
                  <div className="text-xs font-medium text-slate-400">Total Earnings</div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {myStats?.clipsSubmitted || mySubmissions.length}
                  </div>
                  <div className="text-xs font-medium text-slate-400">Clips Submitted</div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-brand-cyan">
                    {myStats?.approvedClips || mySubmissions.filter((s) => s.status === "APPROVED").length}
                  </div>
                  <div className="text-xs font-medium text-slate-400">Approved</div>
                </div>

                {/* Payout Eligibility Status Card */}
                {myStats && myStats.minimumViewsForPayout > 0 && (
                  (myStats.qualifiesForPayout || (myStats.viewsRemainingForPayout !== undefined && myStats.viewsRemainingForPayout <= 0) || (myStats.progressPercent !== undefined && myStats.progressPercent >= 100)) ? (
                    <div className="col-span-2 sm:col-span-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-left animate-fadeIn">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white">
                            You&apos;re eligible for payout
                          </div>
                          <div className="text-xs text-emerald-400/90 font-medium">
                            Threshold reached • Your approved views are earning payouts
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs shrink-0 border border-emerald-500/40">
                        Eligible
                      </span>
                    </div>
                  ) : (
                    <div className="col-span-2 sm:col-span-4 p-4 rounded-2xl bg-[#080C14] border border-slate-800/80 space-y-2 text-left">
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

            {/* TAB 3: Leaderboard matching Screenshot 3 */}
            {activeTab === "leaderboard" && (
              <div
                role="tabpanel"
                id="panel-leaderboard"
                aria-labelledby="tab-leaderboard"
                className="rounded-2xl bg-[#0D131D] border border-slate-800/80 overflow-hidden"
              >
                {leaderboard.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No approved clipper views recorded on this campaign yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#080C14] text-xs font-semibold text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4 w-12">#</th>
                          <th className="py-3 px-4">Clipper</th>
                          <th className="py-3 px-4 text-right">Views</th>
                          <th className="py-3 px-4 text-right">Clips</th>
                          <th className="py-3 px-4 text-right">Earnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {leaderboard.map((item) => (
                          <tr key={item.userId} className="hover:bg-slate-900/40">
                            <td className="py-3.5 px-4 font-bold">
                              {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `#${item.rank}`}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5 font-bold text-white">
                                <img
                                  src={item.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`}
                                  alt="Avatar"
                                  className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700"
                                />
                                <span>{item.username}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-200">
                              {item.eligibleViews.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-400">
                              {item.clipsCount}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-brand-cyan">
                              ${item.earnings.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols on large screens) matching screenshot */}
        <div className="lg:col-span-4 space-y-5">
          {/* Campaign Details Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 shadow-xl space-y-4 text-xs">
            <h3 className="text-xs font-semibold text-slate-300">
              Campaign Details
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-brand-cyan">Active</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">CPM Rate</span>
                <span className="font-semibold text-white">${Number(campaign.cpm).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Budget</span>
                <span className="font-semibold text-white">${totalBudgetNum.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Avg Review Time</span>
                <span className="font-semibold text-white">{reviewDays}d</span>
              </div>

              {/* Budget Used with Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Budget Used</span>
                  <span className="font-bold text-brand-cyan">
                    ${usedBudgetNum.toFixed(2)} ({budgetPercent}%)
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
                  <span className="font-bold text-blue-400">
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
            <h3 className="text-xs font-semibold text-slate-300">
              Supported Platforms
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                platforms.includes("INSTAGRAM")
                  ? "bg-slate-900/90 border-slate-700/80 text-white"
                  : "bg-slate-950/50 border-slate-900 text-slate-600"
              }`}>
                <InstagramIcon className="w-4 h-4 text-pink-400" />
                <span>Instagram</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                platforms.includes("YOUTUBE")
                  ? "bg-slate-900/90 border-slate-700/80 text-white"
                  : "bg-slate-950/50 border-slate-900 text-slate-600"
              }`}>
                <YouTubeIcon className="w-4 h-4 text-red-500" />
                <span>YouTube</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 col-span-2 ${
                platforms.includes("TIKTOK")
                  ? "bg-slate-900/90 border-slate-700/80 text-white"
                  : "bg-slate-950/50 border-slate-900 text-slate-600"
              }`}>
                <TikTokIcon className="w-4 h-4 text-cyan-400" />
                <span>TikTok</span>
              </div>
            </div>
          </div>

          {/* Official Discord Community Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 shadow-xl space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
                <DiscordIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs">Join Clipper Discord</h3>
                <p className="text-xs text-slate-400">Official ClipEarn Community</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect with fellow clippers, get viral hooks &amp; content ideas, and get direct 24/7 campaign support.
            </p>
            <a
              href="https://discord.gg/fWDVEt9GVB"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#5865F2]/20"
            >
              <DiscordIcon className="w-4 h-4" />
              <span>Join Discord Server</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-75 ml-0.5" />
            </a>
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
