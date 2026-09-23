"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Plus,
  AlertCircle,
  Send,
  Loader2,
  Calendar,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // In-place Quick Submit State
  const [showQuickSubmit, setShowQuickSubmit] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [quickCampaignId, setQuickCampaignId] = useState("");
  const [quickUrl, setQuickUrl] = useState("");
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [submittingClip, setSubmittingClip] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Rejection Reason Modal State
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  // Appeal Modal State
  const [appealingSubmission, setAppealingSubmission] = useState<any | null>(null);
  const [appealExplanation, setAppealExplanation] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState("");
  const [appealSuccess, setAppealSuccess] = useState("");

  // View Appeal Modal State
  const [selectedAppeal, setSelectedAppeal] = useState<any | null>(null);

  const loadSubmissions = () => {
    let url = "/api/submissions";
    if (statusFilter !== "ALL") url += `?status=${statusFilter}`;

    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setSubmissions(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter]);

  // Load campaigns & social accounts for quick in-place submission
  useEffect(() => {
    Promise.all([
      fetch("/api/campaigns?limit=50").then((r) => r.json()),
      fetch("/api/social-accounts").then((r) => r.json()),
    ])
      .then(([campRes, socialRes]) => {
        if (campRes.data) {
          setCampaigns(campRes.data);
          if (campRes.data.length > 0) setQuickCampaignId(campRes.data[0].id);
        }
        if (socialRes.data) {
          setSocialAccounts(socialRes.data.filter((a: any) => a.verification_status === "VERIFIED"));
        }
      })
      .catch(() => {});
  }, []);

  // Detect platform & verified account for quick submit
  const detectedPlatform = React.useMemo(() => {
    const url = quickUrl.trim().toLowerCase();
    if (!url) return null;
    if (url.includes("tiktok.com")) return "TIKTOK";
    if (url.includes("instagram.com")) return "INSTAGRAM";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "YOUTUBE";
    return null;
  }, [quickUrl]);

  const matchedAccount = React.useMemo(() => {
    if (!detectedPlatform) return null;
    return socialAccounts.find((a) => a.platform === detectedPlatform);
  }, [detectedPlatform, socialAccounts]);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    if (!quickCampaignId || !quickUrl.trim()) return;

    try {
      setSubmittingClip(true);
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: quickCampaignId,
          post_url: quickUrl.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSubmitSuccess("Clip submitted successfully! Sent to manager review queue.");
        setQuickUrl("");
        loadSubmissions();
        setTimeout(() => {
          setSubmitSuccess("");
          setShowQuickSubmit(false);
        }, 3000);
      } else {
        setSubmitError(data.error || "Failed to submit clip");
      }
    } catch {
      setSubmitError("Network error submitting clip");
    } finally {
      setSubmittingClip(false);
    }
  };

  const handleOpenAppeal = (sub: any) => {
    setAppealingSubmission(sub);
    setAppealExplanation("");
    setAppealError("");
    setAppealSuccess("");
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealingSubmission) return;
    if (!appealExplanation.trim() || appealExplanation.trim().length < 5) {
      setAppealError("Please provide an explanation of at least 5 characters.");
      return;
    }

    try {
      setSubmittingAppeal(true);
      setAppealError("");
      const res = await fetch(`/api/submissions/${appealingSubmission.id}/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appeal_reason: appealExplanation.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setAppealSuccess("Appeal submitted! Routed to manager appeals queue for re-evaluation.");
        loadSubmissions();
        setTimeout(() => {
          setAppealingSubmission(null);
          setAppealSuccess("");
        }, 2000);
      } else {
        setAppealError(data.error || "Failed to submit appeal");
      }
    } catch {
      setAppealError("Network error submitting appeal");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Video className="w-7 h-7 text-brand-cyan" />
            My Clip Submissions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track review status, appeal rejected clips, and monitor verified views and earnings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowQuickSubmit((prev) => !prev)}
          className="px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-brand-cyan/90 text-black font-bold text-xs transition-all flex items-center gap-2 shadow-[0_0_20px_-3px_rgba(0,242,254,0.3)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{showQuickSubmit ? "Hide Submit Form" : "Quick Submit Clip"}</span>
          {showQuickSubmit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* In-Place Quick Submit Clip Card (No page redirect required) */}
      {showQuickSubmit && (
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-cyan" />
                Submit Video Clip Directly Here
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                No need to leave this page. Select your campaign and paste the video URL — verified handle binds automatically.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {["TIKTOK", "INSTAGRAM", "YOUTUBE"].map((p) => {
                const verified = socialAccounts.find((a) => a.platform === p);
                return (
                  <span
                    key={p}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      verified
                        ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/30"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                    }`}
                  >
                    {p}: {verified ? `@${verified.username}` : "Unlinked"}
                  </span>
                );
              })}
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
              <button onClick={() => setSubmitError("")} className="text-red-400 hover:text-red-300">✕</button>
            </div>
          )}

          {submitSuccess && (
            <div className="p-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-xs text-brand-emerald flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          <form onSubmit={handleQuickSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-slate-300 font-semibold text-xs mb-1.5">
                  Select Campaign
                </label>
                <select
                  value={quickCampaignId}
                  onChange={(e) => setQuickCampaignId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-brand-cyan"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (${c.cpm ? Number(c.cpm).toFixed(2) : "1.00"} CPM)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold text-xs mb-1.5">
                  Published Video URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="url"
                      required
                      placeholder="Paste TikTok, Instagram Reel, or YouTube Shorts public URL..."
                      value={quickUrl}
                      onChange={(e) => {
                        setQuickUrl(e.target.value);
                        if (submitError) setSubmitError("");
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingClip || !quickUrl.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-black font-black text-xs transition-all hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {submittingClip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{submittingClip ? "Submitting..." : "Submit Clip"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic auto-binding pill */}
            <div className="text-[11px] text-slate-400 pt-0.5">
              {detectedPlatform ? (
                matchedAccount ? (
                  <span className="text-brand-emerald font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                    <span>
                      Detected {detectedPlatform} clip &bull; Auto-bound to verified handle: <strong className="text-white">@{matchedAccount.username}</strong>
                    </span>
                  </span>
                ) : (
                  <span className="text-yellow-400 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span>
                      Detected {detectedPlatform} link, but you have no verified {detectedPlatform} account.{" "}
                      <Link href="/clipper/profile" className="text-brand-cyan underline font-bold ml-1">
                        Verify Account &rarr;
                      </Link>
                    </span>
                  </span>
                )
              ) : (
                <span className="text-slate-500">
                  Paste any public link. Verified social handle binds automatically without dropdown selection.
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#0F141F] border border-slate-800 rounded-xl text-xs font-semibold overflow-x-auto w-fit">
        {[
          { id: "ALL", label: "All Submissions" },
          { id: "PENDING", label: "Pending" },
          { id: "APPEALED", label: "Under Appeal" },
          { id: "APPROVED", label: "Approved" },
          { id: "REJECTED", label: "Rejected" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === tab.id
                ? "bg-brand-cyan text-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#0F141F] border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0F141F] border border-slate-800 p-8">
          <Video className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-base font-bold text-white">No submissions found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter === "ALL"
              ? "Submit your first video link above to start tracking views and earnings."
              : `No ${statusFilter.toLowerCase()} clips found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const isApproved = sub.status === "APPROVED";
            const isPending = sub.status === "PENDING";
            const isAppealed = sub.status === "APPEALED";
            const isRejected = sub.status === "REJECTED";

            return (
              <div
                key={sub.id}
                className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left side details */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                      {sub.platform}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">@{sub.account_username}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-xs font-bold text-brand-emerald">{sub.campaign_name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">(${sub.cpm.toFixed(2)} CPM)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={sub.post_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold text-white hover:text-brand-cyan transition-colors truncate max-w-md flex items-center gap-1.5"
                    >
                      <span className="truncate">{sub.post_url}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Submitted: {new Date(sub.submitted_at).toLocaleDateString()}
                    </span>

                    {sub.last_view_update && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Last synced: {new Date(sub.last_view_update).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side metrics and status */}
                <div className="flex flex-wrap items-center gap-6 self-end lg:self-center">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                      Current Views
                    </span>
                    <span className="text-base font-bold text-white">
                      {isPending || isAppealed ? (
                        <span className="text-yellow-400/80 font-normal text-xs italic">
                          {isAppealed ? "Under Appeal" : "Pending Review"}
                        </span>
                      ) : (
                        sub.current_views.toLocaleString()
                      )}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                      Eligible Views
                    </span>
                    <span className="text-base font-bold text-slate-200">
                      {isApproved ? sub.eligible_views.toLocaleString() : "—"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                      Earnings
                    </span>
                    <span className="text-lg font-black text-brand-cyan">
                      {isApproved ? `$${sub.current_earnings.toFixed(2)}` : "—"}
                    </span>
                  </div>

                  <div className="min-w-[130px] text-right">
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        APPROVED
                      </span>
                    )}

                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
                        <Clock className="w-3.5 h-3.5" />
                        PENDING
                      </span>
                    )}

                    {isAppealed && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          APPEALED
                        </span>
                        <button
                          onClick={() => setSelectedAppeal(sub)}
                          className="text-[10px] text-purple-400 hover:text-purple-300 underline font-medium"
                        >
                          View Appeal
                        </button>
                      </div>
                    )}

                    {isRejected && (
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                          <XCircle className="w-3.5 h-3.5" />
                          REJECTED
                        </span>
                        <div className="flex items-center gap-2">
                          {sub.rejection_reason && (
                            <button
                              onClick={() => setSelectedReason(sub.rejection_reason)}
                              className="text-[10px] text-slate-400 hover:text-white underline"
                            >
                              Reason
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenAppeal(sub)}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-bold transition-colors"
                          >
                            Appeal Clip
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {selectedReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Submission Rejection Reason
            </h3>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 leading-relaxed my-4">
              {selectedReason}
            </div>
            <p className="text-xs text-slate-400 mb-6">
              You can appeal this decision below or modify your clip according to the campaign requirements.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedReason(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appeal Submission Modal */}
      {appealingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Appeal Clip Rejection
              </h3>
              <button
                onClick={() => setAppealingSubmission(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Original Rejection Details */}
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs space-y-1 mb-4">
              <div className="text-red-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Original Staff Rejection Reason:</span>
              </div>
              <p className="text-slate-300 pl-5">
                {appealingSubmission.rejection_reason || "Campaign requirement not followed"}
              </p>
            </div>

            {appealError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{appealError}</span>
              </div>
            )}

            {appealSuccess && (
              <div className="p-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-xs text-brand-emerald mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{appealSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAppeal} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Appeal Explanation & Justification
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain why this clip should be reconsidered (e.g. hashtags added, audio fixed, clip conforms to guidelines, timestamp proof)..."
                  value={appealExplanation}
                  onChange={(e) => setAppealExplanation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Staff managers will re-evaluate your clip link alongside your explanation.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={submittingAppeal}
                  onClick={() => setAppealingSubmission(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal || !appealExplanation.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-brand-cyan text-black font-black text-xs transition-opacity hover:opacity-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  {submittingAppeal ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Send className="w-4 h-4" />}
                  <span>{submittingAppeal ? "Submitting Appeal..." : "Submit Appeal to Managers"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Appeal Details Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Appeal Under Review
              </h3>
              <button
                onClick={() => setSelectedAppeal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block mb-1">
                  Original Rejection Reason
                </span>
                <p className="text-slate-300">{selectedAppeal.rejection_reason || "None recorded"}</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                  Your Submitted Appeal Justification
                </span>
                <p className="text-slate-200">{selectedAppeal.appeal_reason || "Pending justification"}</p>
                {selectedAppeal.appealed_at && (
                  <span className="text-[10px] text-slate-500 block mt-2">
                    Appealed on {new Date(selectedAppeal.appealed_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAppeal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
