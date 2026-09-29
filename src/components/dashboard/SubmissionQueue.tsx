"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface SubmissionItem {
  id: string;
  campaign: {
    id: string;
    name: string;
    brand_name?: string | null;
    cpm: number;
  };
  clipper: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
  platform: string;
  post_url: string;
  status: string;
  current_views: number;
  current_likes?: number | null;
  current_comments?: number | null;
  current_shares?: number | null;
  current_saves?: number | null;
  submitted_at: string;
}

interface SubmissionQueueProps {
  portalType: "admin" | "manager";
  submissions: SubmissionItem[];
  onSubmissionReviewed?: () => void;
}

export function SubmissionQueue({
  portalType,
  submissions = [],
  onSubmissionReviewed,
}: SubmissionQueueProps) {
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [rejectionReason, setRejectionReason] = useState("Campaign requirement not followed");
  const [customReason, setCustomReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const rejectionOptions = [
    "Campaign requirement not followed",
    "Missing required hashtag or caption mention",
    "Video length does not meet minimum duration",
    "Wrong account / Handle mismatch",
    "Low quality / Distorted audio or resolution",
    "Duplicate video already submitted",
    "Prohibited content / Guideline violation",
    "Copyright issue / Muted audio track",
    "Other",
  ];

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    setProcessing(true);
    const finalReason =
      rejectionReason === "Other" && customReason.trim()
        ? customReason.trim()
        : rejectionReason;

    try {
      const res = await fetch(`/api/manager/submissions/${selectedSub.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          rejection_reason: actionType === "REJECT" ? finalReason : null,
        }),
      });

      if (res.ok) {
        setSelectedSub(null);
        setCustomReason("");
        if (onSubmissionReviewed) onSubmissionReviewed();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to submit review");
      }
    } catch {
      alert("Network error processing review");
    } finally {
      setProcessing(false);
    }
  };

  const queueTitle =
    portalType === "admin"
      ? "Submission Review Pipeline (Oldest First)"
      : "Assigned Submissions Queue (Oldest First)";

  return (
    <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <FileCheck className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-base font-bold text-white">{queueTitle}</h2>
            <p className="text-xs text-slate-400">
              Ordered strictly by submission timestamp (oldest first) to guarantee fair review queues.
            </p>
          </div>
        </div>

        <Link
          href="/manager/submissions"
          className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
        >
          <span>Open Full Review Queue ({submissions.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {submissions.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="font-bold text-white">Review Queue is Clear!</p>
          <p className="text-slate-400 mt-0.5">No pending clips currently waiting for review.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider pb-2.5">
                <th className="py-3 px-3">Submitted</th>
                <th className="py-3 px-3">Clipper</th>
                <th className="py-3 px-3">Campaign</th>
                <th className="py-3 px-3">Platform</th>
                <th className="py-3 px-3 text-right">Views</th>
                <th className="py-3 px-3 text-right">Likes</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {submissions.slice(0, 5).map((sub) => {
                const submittedDate = new Date(sub.submitted_at);
                const timeAgo = formatTimeAgo(submittedDate);

                return (
                  <tr key={sub.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {timeAgo}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px] border border-slate-700">
                          {sub.clipper.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-white">@{sub.clipper.username}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-white font-medium max-w-[160px] truncate" title={sub.campaign.name}>
                      {sub.campaign.name}
                    </td>

                    <td className="py-3.5 px-3">
                      <a
                        href={sub.post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-brand-cyan hover:underline font-semibold"
                        title={sub.post_url}
                      >
                        <span>{sub.platform}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-200">
                      {(sub.current_views || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono text-rose-400">
                      {sub.current_likes != null ? sub.current_likes.toLocaleString() : "—"}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSub(sub);
                            setActionType("APPROVE");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1 transition"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSub(sub);
                            setActionType("REJECT");
                            setRejectionReason("Campaign requirement not followed");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-bold text-xs flex items-center gap-1 transition"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              {actionType === "APPROVE" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Approve Clip Submission</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>Reject Clip Submission</span>
                </>
              )}
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1 my-3">
              <div className="text-slate-300">
                <strong>Clipper:</strong> @{selectedSub.clipper.username}
              </div>
              <div className="text-slate-300">
                <strong>Campaign:</strong> {selectedSub.campaign.name}
              </div>
              <div className="text-slate-300">
                <strong>Detected Views:</strong> {(selectedSub.current_views || 0).toLocaleString()}
              </div>
              <div className="pt-1">
                <a
                  href={selectedSub.post_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-cyan hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <span>Open published post</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <form onSubmit={handleReview} className="space-y-4 text-xs">
              {actionType === "REJECT" ? (
                <div className="space-y-3">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Mandatory Rejection Reason
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-400"
                  >
                    {rejectionOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  {rejectionReason === "Other" && (
                    <textarea
                      required
                      rows={2}
                      placeholder="Specify reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-400"
                    />
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  Approving this clip adds its verified views to the approved count immediately.
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 ${
                    actionType === "APPROVE"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                      : "bg-rose-500 hover:bg-rose-400 text-white"
                  }`}
                >
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirm {actionType === "APPROVE" ? "Approval" : "Rejection"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
