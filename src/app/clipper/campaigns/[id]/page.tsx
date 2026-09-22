"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  DollarSign,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  TrendingUp,
  FileCheck,
  Send,
  Loader2,
} from "lucide-react";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [myStats, setMyStats] = useState<any>(null);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit clip modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadData = () => {
    Promise.all([
      fetch(`/api/campaigns/${campaignId}`).then((r) => r.json()),
      fetch(`/api/campaigns/${campaignId}/stats`).then((r) => r.json()),
      fetch(`/api/campaigns/${campaignId}/leaderboard`).then((r) => r.json()),
      fetch("/api/social-accounts").then((r) => r.json()),
    ])
      .then(([campRes, statsRes, leadRes, socialRes]) => {
        if (campRes.data) setCampaign(campRes.data);
        if (statsRes.data) setMyStats(statsRes.data);
        if (leadRes.data) setLeaderboard(leadRes.data);
        if (socialRes.data) {
          const verified = socialRes.data.filter((a: any) => a.verification_status === "VERIFIED");
          setSocialAccounts(verified);
          if (verified.length > 0) setSelectedAccountId(verified[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const handleJoin = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/join`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCampaign((prev: any) => ({ ...prev, is_joined: true }));
        loadData();
      } else {
        alert(data.error || "Failed to join campaign");
      }
    } catch {
      alert("Network error");
    }
  };

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
          social_account_id: selectedAccountId,
          post_url: postUrl.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSubmitSuccess(true);
        setPostUrl("");
        loadData();
        setTimeout(() => {
          setSubmitSuccess(false);
          setIsSubmitModalOpen(false);
        }, 1500);
      } else {
        setSubmitError(data.error || "Failed to submit clip");
      }
    } catch {
      setSubmitError("Network error submitting clip");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded"></div>
        <div className="h-48 bg-[#0F141F] rounded-2xl border border-slate-800"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center bg-[#0F141F] rounded-2xl border border-slate-800">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-white">Campaign Not Found</h2>
        <Link href="/clipper/campaigns" className="mt-4 text-xs text-brand-cyan hover:underline inline-block">
          &larr; Back to all campaigns
        </Link>
      </div>
    );
  }

  const budgetPercent = Math.min(100, Math.round((campaign.used_budget / campaign.total_budget) * 100));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back button */}
      <Link
        href="/clipper/campaigns"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Campaigns</span>
      </Link>

      {/* Campaign Banner Header */}
      <div className="relative rounded-3xl bg-[#0F141F] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="h-64 sm:h-80 w-full relative bg-slate-900">
          <img
            src={campaign.image_url || "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200"}
            alt={campaign.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F141F] via-[#0F141F]/60 to-transparent" />

          {/* Floated Header Info */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 text-[10px] font-bold text-brand-cyan uppercase tracking-wider">
                  {campaign.brand_name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-emerald/20 border border-brand-emerald/40 text-[10px] font-bold text-brand-emerald uppercase tracking-wider">
                  {campaign.status}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white">{campaign.name}</h1>
            </div>

            <div className="flex items-center gap-3">
              {campaign.is_joined ? (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-brand-cyan hover:bg-brand-cyan/90 text-black font-black text-xs transition-all shadow-[0_0_20px_-3px_rgba(0,242,254,0.4)] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit Video Clip</span>
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-black font-black text-xs transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Join Campaign</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Metrics Bar */}
        <div className="p-6 bg-[#0B101D] border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">CPM Rate</span>
            <span className="text-xl font-black text-brand-cyan mt-0.5 block">
              ${campaign.cpm.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500">Per 1,000 views</span>
          </div>

          <div>
            <span className="text-slate-400 block">Total Budget Pool</span>
            <span className="text-xl font-black text-white mt-0.5 block">
              ${campaign.total_budget.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">
              ${campaign.used_budget.toLocaleString()} utilized ({budgetPercent}%)
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Min Views For Payout</span>
            <span className="text-xl font-black text-brand-emerald mt-0.5 block">
              {campaign.minimum_views_for_payout.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">Approved view threshold</span>
          </div>

          <div>
            <span className="text-slate-400 block">Supported Platforms</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {campaign.allowed_platforms.map((p: string) => (
                <span key={p} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* "My Stats" Section (Rule 35) */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-cyan" />
            My Campaign Performance
          </h2>
          <span className="text-xs text-slate-400">Personal performance on this campaign</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 mb-4 text-center">
          <div>
            <div className="text-2xl font-black text-white">{myStats?.totalViews?.toLocaleString() || 0}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Total Views</div>
          </div>
          <div>
            <div className="text-2xl font-black text-brand-cyan">${(myStats?.totalEarnings || 0).toFixed(2)}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Total Earnings</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{myStats?.clipsSubmitted || 0}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Clips Submitted</div>
          </div>
          <div>
            <div className="text-2xl font-black text-brand-emerald">{myStats?.approvedClips || 0}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Approved</div>
          </div>
        </div>

        {/* Payout Progress Threshold Bar */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
          <div className="flex justify-between font-semibold">
            <span className="text-slate-300">Payout Eligibility Progress:</span>
            <span className="text-brand-cyan font-bold">{myStats?.payoutProgressText}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-cyan to-brand-emerald rounded-full transition-all duration-500"
              style={{ width: `${myStats?.progressPercent || 0}%` }}
            />
          </div>
          <div className="text-right text-[11px] text-slate-500">
            {myStats?.payoutFractionText}
          </div>
        </div>
      </div>

      {/* Campaign Requirements & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <FileCheck className="w-5 h-5 text-brand-emerald" />
            Campaign Requirements
          </h2>

          <div className="space-y-3 text-xs text-slate-300">
            {campaign.requirements && campaign.requirements.length > 0 ? (
              campaign.requirements.map((req: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
                  <span>{req}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">Standard short-form clipping guidelines apply.</p>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-400" />
            Prohibited Content & Restrictions
          </h2>

          <div className="space-y-3 text-xs text-slate-300">
            {campaign.prohibited_content && campaign.prohibited_content.length > 0 ? (
              campaign.prohibited_content.map((pro: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{pro}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No hate speech, copyright violations, or artificial view manipulation.</p>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Leaderboard Section */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-cyan" />
          Campaign Clipper Leaderboard
        </h2>

        {leaderboard.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No approved views on this campaign yet. Submit the first clip and claim the #1 spot!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-3 w-16">Rank</th>
                  <th className="pb-3">Clipper</th>
                  <th className="pb-3">Eligible Views</th>
                  <th className="pb-3">Clips</th>
                  <th className="pb-3">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {leaderboard.map((item) => (
                  <tr key={item.userId} className="hover:bg-slate-900/40">
                    <td className="py-3.5 pr-2">
                      <span
                        className={`inline-block w-6 h-6 rounded-full text-center leading-6 font-bold text-[11px] ${
                          item.rank === 1
                            ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/40"
                            : item.rank === 2
                            ? "bg-slate-300/20 text-slate-200 border border-slate-400/40"
                            : item.rank === 3
                            ? "bg-amber-600/20 text-amber-500 border border-amber-600/40"
                            : "text-slate-500"
                        }`}
                      >
                        #{item.rank}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 flex items-center gap-2 text-white font-bold">
                      <img
                        src={item.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full border border-slate-700 bg-slate-800"
                      />
                      <span>{item.username}</span>
                    </td>
                    <td className="py-3.5 pr-3 text-slate-200 font-semibold">
                      {item.eligibleViews.toLocaleString()} views
                    </td>
                    <td className="py-3.5 pr-3 text-slate-400">{item.clipsCount}</td>
                    <td className="py-3.5 font-bold text-brand-cyan">
                      ${item.earnings.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Clip Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Send className="w-5 h-5 text-brand-cyan" />
              Submit Clip for Review
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Only submissions from connected, verified accounts are eligible. Our review team verifies all brand guidelines before approving.
            </p>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-xs text-brand-emerald flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Clip submitted successfully! Sent to manager review queue.</span>
              </div>
            )}

            <form onSubmit={handleSubmitClip} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Select Verified Social Account
                </label>
                {socialAccounts.length === 0 ? (
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
                    <p className="font-semibold">No verified accounts found.</p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      You must connect and verify your social account before submitting content.
                    </p>
                    <Link
                      href="/clipper/profile"
                      className="mt-2 inline-block text-xs text-brand-cyan font-bold hover:underline"
                    >
                      Go to Profile & Accounts &rarr;
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-cyan"
                  >
                    {socialAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        [{acc.platform}] @{acc.username}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Published Video URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://www.tiktok.com/@creator/video/7398123456789012345"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Paste the full public URL from TikTok, Instagram Reels, or YouTube Shorts.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || socialAccounts.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-brand-cyan text-black font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : null}
                  <span>Submit for Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
