"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  AlertCircle,
  Send,
  Loader2,
  Calendar,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { clientCache } from "@/lib/clientCache";

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>(() => clientCache.get("clipper_submissions_list") || []);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(() => !clientCache.get("clipper_submissions_list"));

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

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteSubmission = async (submissionId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this rejected submission? This will remove the clip so you can re-submit to the correct campaign if needed."
      )
    ) {
      return;
    }

    try {
      setDeletingId(submissionId);
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        clientCache.clear("clipper_submissions_list");
        loadSubmissions();
      } else {
        alert(data.error || "Failed to delete submission");
      }
    } catch {
      alert("Network error deleting submission");
    } finally {
      setDeletingId(null);
    }
  };

  const loadSubmissions = () => {
    let url = "/api/submissions";
    if (statusFilter !== "ALL") url += `?status=${statusFilter}`;

    if (!submissions.length && !clientCache.get("clipper_submissions_list")) {
      setLoading(true);
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setSubmissions(data.data);
          if (statusFilter === "ALL") {
            clientCache.set("clipper_submissions_list", data.data);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter]);

  const cleanPostUrl = (rawUrl: string) => {
    try {
      const url = new URL(rawUrl);
      const cleanPath = url.pathname.replace(/\/$/, "");
      return `${url.hostname.replace(/^www\./, "")}${cleanPath}`;
    } catch {
      return rawUrl;
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
    <div className="space-y-8 pb-16 animate-fadeIn">
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

        <Link
          href="/clipper/campaigns"
          className="px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-[0_0_20px_-3px_rgba(28,247,253,0.3)] self-start sm:self-auto"
        >
          <span>Browse Campaigns &rarr;</span>
        </Link>
      </div>

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
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-xs font-semibold text-slate-300">
                      {sub.platform}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">@{sub.account_username}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-xs font-bold text-brand-cyan">{sub.campaign_name}</span>
                    <span className="text-xs text-slate-500 font-mono">(${sub.cpm.toFixed(2)} CPM)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={sub.post_url}
                      target="_blank"
                      rel="noreferrer"
                      title={sub.post_url}
                      className="text-xs sm:text-sm font-semibold text-white hover:text-brand-cyan transition-colors flex items-center gap-1.5 break-all"
                    >
                      <span>{cleanPostUrl(sub.post_url)}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
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
                    <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">
                      Current Views
                    </span>
                    <span className="text-base font-bold text-white font-mono">
                      {(sub.current_views || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">
                      Eligible Views
                    </span>
                    <span className="text-base font-bold text-slate-200">
                      {isApproved ? sub.eligible_views.toLocaleString() : "—"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">
                      Earnings
                    </span>
                    <span className="text-lg font-black text-brand-cyan">
                      {isApproved ? `$${sub.current_earnings.toFixed(2)}` : "—"}
                    </span>
                  </div>

                  <div className="min-w-[150px] flex items-center justify-end gap-2.5">
                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 pointer-events-none select-none">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved
                      </span>
                    )}

                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 pointer-events-none select-none">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}

                    {isAppealed && (
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30 pointer-events-none select-none">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          Appealed
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedAppeal(sub)}
                          className="h-8 px-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          View Appeal
                        </button>
                      </div>
                    )}

                    {isRejected && (
                      <div className="flex flex-col items-end gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 pointer-events-none select-none">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </span>
                        <div className="flex items-center gap-2">
                          {sub.rejection_reason && (
                            <button
                              type="button"
                              onClick={() => setSelectedReason(sub.rejection_reason)}
                              className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>Reason</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenAppeal(sub)}
                            className="h-8 px-3 rounded-lg bg-brand-cyan/15 hover:bg-brand-cyan/25 text-brand-cyan border border-brand-cyan/40 text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <span>Appeal Clip</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delete Submission Action - Only for rejected clips */}
                    {sub.status === "REJECTED" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSubmission(sub.id)}
                        disabled={deletingId === sub.id}
                        title="Delete rejected submission"
                        className="p-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-red-500/20 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-colors shrink-0 flex items-center justify-center disabled:opacity-50"
                      >
                        {deletingId === sub.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
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
                type="button"
                onClick={() => setSelectedReason(null)}
                className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
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
                type="button"
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
              <div className="p-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-xs text-brand-cyan mb-4 flex items-center gap-2">
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan"
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  Staff managers will re-evaluate your clip link alongside your explanation.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={submittingAppeal}
                  onClick={() => setAppealingSubmission(null)}
                  className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal || !appealExplanation.trim()}
                  className="h-9 px-5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-cyan-500/20"
                >
                  {submittingAppeal ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4 text-slate-950" />}
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
                type="button"
                onClick={() => setSelectedAppeal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">
                  Original Rejection Reason
                </span>
                <p className="text-slate-300">{selectedAppeal.rejection_reason || "None recorded"}</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
                  Your Submitted Appeal Justification
                </span>
                <p className="text-slate-200">{selectedAppeal.appeal_reason || "Pending justification"}</p>
                {selectedAppeal.appealed_at && (
                  <span className="text-xs text-slate-400 block mt-2">
                    Appealed on {new Date(selectedAppeal.appealed_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedAppeal(null)}
                className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
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
