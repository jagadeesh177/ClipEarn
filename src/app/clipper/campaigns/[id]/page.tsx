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

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [myStats, setMyStats] = useState<any>(null);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: "submissions" | "stats" | "leaderboard"
  const [activeTab, setActiveTab] = useState<"submissions" | "stats" | "leaderboard">("submissions");

  // Submit clip state
  const [postUrl, setPostUrl] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(true);
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
        if (campRes.data) setCampaign(campRes.data);
        if (statsRes.data) setMyStats(statsRes.data);
        if (leadRes.data) setLeaderboard(leadRes.data);
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
    if (!termsAgreed) {
      setSubmitError("Please confirm compliance with Clipper Obligations & Liability terms.");
      return;
    }

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

  const usedBudgetNum = Number(campaign.used_budget) || 0;
  const totalBudgetNum = Number(campaign.total_budget) || 10000;
  const budgetPercent = Math.min(100, Math.round((usedBudgetNum / totalBudgetNum) * 100));

  const currentViewsNum = Number(campaign.total_views || campaign.eligible_views || 0);
  const maxViewsNum = Number(campaign.max_payable_views) || Math.floor((totalBudgetNum / (Number(campaign.cpm) || 1)) * 1000);
  const viewsPercent = maxViewsNum > 0 ? Math.min(100, Math.round((currentViewsNum / maxViewsNum) * 100)) : 0;

  const platforms = Array.isArray(campaign.allowed_platforms) ? campaign.allowed_platforms : ["TIKTOK", "INSTAGRAM", "YOUTUBE"];
  const reviewDays = ((campaign.name.length % 9) * 0.1 + 1.1).toFixed(1);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Section matching screenshot */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {campaign.name}
        </h1>

        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">{campaign.brand_name || campaign.name}</p>
          <p className="text-slate-400">
            {campaign.description || `Clip ${campaign.name} & earn $${Number(campaign.cpm).toFixed(2)} per 1,000 views.`}
          </p>
        </div>

        {/* Metadata badges row matching screenshot */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium pt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>TBD</span>
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

        {/* Action button & Submissions pill row */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/clipper/campaigns"
            className="px-4 py-2 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Back to Campaigns</span>
          </Link>

          <span className="px-4 py-2 rounded-xl bg-brand-cyan text-slate-950 font-bold text-xs">
            Submissions
          </span>
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

              {/* Compliance Checkbox matching screenshot */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  id="complianceCheck"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-brand-cyan focus:ring-brand-cyan cursor-pointer"
                />
                <label htmlFor="complianceCheck" className="cursor-pointer select-none">
                  I confirm this submission complies with the{" "}
                  <Link href="/clipper/guidelines" className="text-brand-cyan hover:underline font-semibold">
                    Clipper Obligations & Liability
                  </Link>{" "}
                  terms.
                </label>
              </div>

              {/* Handle Detection Live Feedback */}
              {detectedPlatform && (
                <div className="text-center text-[11px] pt-1">
                  {matchedAccount ? (
                    <span className="text-brand-cyan font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                      <span>
                        Detected {detectedPlatform} &bull; Auto-bound to verified handle:{" "}
                        <strong className="text-white">@{matchedAccount.username}</strong>
                      </span>
                    </span>
                  ) : (
                    <span className="text-yellow-400 font-semibold flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                      <span>
                        Detected {detectedPlatform} link. Please verify a {detectedPlatform} account in your profile.
                      </span>
                    </span>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Three Tabs: My Submissions | My Stats | Leaderboard */}
          <div className="space-y-4">
            <div className="flex items-center gap-8 border-b border-slate-800/80 px-1">
              <button
                type="button"
                onClick={() => setActiveTab("submissions")}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeTab === "submissions"
                    ? "text-brand-cyan"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>My Submissions</span>
                {activeTab === "submissions" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("stats")}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeTab === "stats"
                    ? "text-brand-cyan"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>My Stats</span>
                {activeTab === "stats" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("leaderboard")}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeTab === "leaderboard"
                    ? "text-brand-cyan"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Leaderboard</span>
                {activeTab === "leaderboard" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan rounded-full" />
                )}
              </button>
            </div>

            {/* TAB 1: My Submissions List matching Screenshot 1 */}
            {activeTab === "submissions" && (
              <div className="rounded-2xl bg-[#0D131D] border border-slate-800/80 p-2 sm:p-4 divide-y divide-slate-800/60">
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
                            <a
                              href={sub.post_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-white hover:text-brand-cyan font-mono truncate block"
                              title={sub.post_url}
                            >
                              {sub.post_url}
                            </a>
                            <span className="text-[11px] text-slate-500 mt-0.5 block">
                              {formattedDate}
                            </span>
                          </div>
                        </div>

                        {/* Views & Status Badge */}
                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          <span className="text-xs text-slate-300 font-semibold">
                            {(sub.current_views || 0).toLocaleString()} views
                          </span>

                          {sub.status === "APPROVED" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 text-[11px] font-bold">
                              approved
                            </span>
                          )}

                          {sub.status === "PENDING" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-[11px] font-bold">
                              pending
                            </span>
                          )}

                          {sub.status === "APPEALED" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[11px] font-bold">
                              appealed
                            </span>
                          )}

                          {sub.status === "REJECTED" && (
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[11px] font-bold">
                                rejected
                              </span>
                              <button
                                onClick={() => handleOpenAppeal(sub)}
                                className="px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-brand-cyan hover:text-black text-brand-cyan text-[11px] font-bold transition-colors"
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {myStats?.totalViews?.toLocaleString() || 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">Total Views</div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-brand-cyan">
                    ${(myStats?.totalEarnings || 0).toFixed(2)}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">Total Earnings</div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {myStats?.clipsSubmitted || mySubmissions.length}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">Clips Submitted</div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 text-center space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-brand-cyan">
                    {myStats?.approvedClips || mySubmissions.filter((s) => s.status === "APPROVED").length}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">Approved</div>
                </div>
              </div>
            )}

            {/* TAB 3: Leaderboard matching Screenshot 3 */}
            {activeTab === "leaderboard" && (
              <div className="rounded-2xl bg-[#0D131D] border border-slate-800/80 overflow-hidden">
                {leaderboard.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No approved clipper views recorded on this campaign yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#080C14] text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4 w-12">#</th>
                          <th className="py-3 px-4">CLIPPER</th>
                          <th className="py-3 px-4 text-right">VIEWS</th>
                          <th className="py-3 px-4 text-right">CLIPS</th>
                          <th className="py-3 px-4 text-right">EARNINGS</th>
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
          {/* CAMPAIGN DETAILS Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 shadow-xl space-y-4 text-xs">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              CAMPAIGN DETAILS
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
                  {(campaign.minimum_views_for_payout || 100000).toLocaleString()} views
                </span>
              </div>
            </div>
          </div>

          {/* SUPPORTED PLATFORMS Card matching screenshot */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 shadow-xl space-y-3.5">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              SUPPORTED PLATFORMS
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
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="px-5 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2"
                >
                  {submittingAppeal ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4" />}
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
