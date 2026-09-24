"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Filter,
  Search,
  AlertCircle,
  Loader2,
  Video,
  Eye,
  Heart,
  MessageSquare,
} from "lucide-react";

export default function ManagerSubmissionsReviewPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Review modal
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
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
    "Incorrect platform link",
    "Other",
  ];

  const loadSubmissions = () => {
    setLoading(true);
    let url = `/api/manager/submissions?search=${encodeURIComponent(search)}`;
    if (statusFilter !== "ALL") url += `&status=${statusFilter}`;

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

  const handleReviewAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setProcessing(true);
    const finalReason =
      rejectionReason === "Other" && customReason.trim()
        ? customReason.trim()
        : rejectionReason;

    try {
      const res = await fetch(`/api/manager/submissions/${selectedSubmission.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          rejection_reason: actionType === "REJECT" ? finalReason : null,
        }),
      });

      if (res.ok) {
        setSelectedSubmission(null);
        setCustomReason("");
        loadSubmissions();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to process review");
      }
    } catch {
      alert("Network error processing review");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-yellow-400" />
            Submission Review Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit submitted clipper video links against campaign requirements before approving view tracking.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search clipper username, video URL, or post ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadSubmissions()}
            className="w-full h-10 bg-[#0F141F] border border-slate-800 rounded-xl pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan transition-colors"
          />
        </div>

        <div
          role="tablist"
          aria-label="Submission status filters"
          className="flex items-center gap-1.5 p-1 bg-[#0F141F] border border-slate-800 rounded-xl text-xs font-semibold overflow-x-auto shrink-0"
        >
          {[
            { id: "PENDING", label: "Pending Queue" },
            { id: "APPEALED", label: "Appeals Queue" },
            { id: "APPROVED", label: "Approved" },
            { id: "REJECTED", label: "Rejected" },
            { id: "ALL", label: "All Submissions" },
          ].map((st) => (
            <button
              key={st.id}
              role="tab"
              aria-selected={statusFilter === st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-xs font-semibold ${
                statusFilter === st.id
                  ? "bg-brand-cyan text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-800"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Review Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-brand-emerald" />
            <p className="text-sm font-bold text-white">Queue is Clear!</p>
            <p className="text-xs text-slate-400 mt-1">
              {statusFilter === "PENDING"
                ? "No submissions awaiting review right now."
                : `No ${statusFilter.toLowerCase()} submissions found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-xs font-semibold text-slate-400 border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-3 pr-3">Clipper</th>
                  <th className="pb-3 pr-3">Campaign</th>
                  <th className="pb-3 pr-3">Platform &amp; Handle</th>
                  <th className="pb-3 pr-3">Video Link</th>
                  <th className="pb-3 pr-3">Views</th>
                  <th className="pb-3 pr-3">Likes</th>
                  <th className="pb-3 pr-3">Comments</th>
                  <th className="pb-3 pr-3">Submitted</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {submissions.map((sub) => {
                  const platformLabel =
                    sub.platform === "INSTAGRAM"
                      ? "Instagram Reel"
                      : sub.platform === "TIKTOK"
                      ? "TikTok Video"
                      : sub.platform === "YOUTUBE"
                      ? "YouTube Short"
                      : "View Clip";

                  return (
                    <tr key={sub.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 pr-3 flex items-center gap-2">
                        <img
                          src={
                            sub.clipper.avatar_url ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${sub.clipper.username}`
                          }
                          alt="Avatar"
                          className="w-7 h-7 rounded-full border border-slate-700 bg-slate-800"
                        />
                        <span className="font-bold text-white">{sub.clipper.username}</span>
                      </td>

                      <td
                        title={sub.campaign.name}
                        className="py-4 pr-3 text-brand-emerald font-semibold max-w-[220px]"
                      >
                        <span className="line-clamp-2">{sub.campaign.name}</span>
                      </td>

                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-bold text-slate-300">
                            {sub.platform}
                          </span>
                          <span className="text-slate-400">@{sub.social_account?.username || "unlinked"}</span>
                        </div>
                      </td>

                      <td className="py-4 pr-3 whitespace-nowrap">
                        <a
                          href={sub.post_url}
                          target="_blank"
                          rel="noreferrer"
                          title={sub.post_url}
                          className="inline-flex items-center gap-1.5 text-xs text-brand-cyan hover:underline font-semibold"
                        >
                          <span>{platformLabel}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      </td>

                      <td className="py-4 pr-3 font-mono font-bold text-slate-200 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          {(sub.current_views || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-4 pr-3 font-mono font-bold text-red-400 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-red-400" />
                          {(sub.current_likes || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-4 pr-3 font-mono font-bold text-blue-400 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                          {(sub.current_comments || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-4 pr-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </td>

                      <td className="py-4 pr-3">
                        {sub.status === "APPROVED" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30">
                            Approved
                          </span>
                        )}
                        {sub.status === "PENDING" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
                            Pending
                          </span>
                        )}
                        {sub.status === "APPEALED" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-purple-400" />
                            Appealed
                          </span>
                        )}
                        {sub.status === "REJECTED" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-4 text-right">
                        {sub.status === "PENDING" || sub.status === "APPEALED" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setActionType("APPROVE");
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-brand-emerald hover:bg-brand-emerald/90 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setActionType("REJECT");
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : sub.status === "APPROVED" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setActionType("REJECT");
                                setRejectionReason("Campaign requirement not followed");
                                setCustomReason("");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                              title="Reject approved clip"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium">
                              Reviewed by {sub.reviewer_username || "Staff"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium">
                              Reviewed by {sub.reviewer_username || "Staff"}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Confirmation / Reason Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              {actionType === "APPROVE" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-brand-emerald" />
                  {selectedSubmission.status === "APPEALED" ? "Approve Clipper Appeal" : "Approve Clip Submission"}
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-400" />
                  {selectedSubmission.status === "APPROVED"
                    ? "Reject Approved Clip"
                    : selectedSubmission.status === "APPEALED"
                    ? "Deny Clipper Appeal"
                    : "Reject Clip Submission"}
                </>
              )}
            </h3>

            {/* Warning Banner if Rejecting an Already Approved Clip */}
            {selectedSubmission.status === "APPROVED" && actionType === "REJECT" && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs space-y-1.5 my-3">
                <div className="flex items-center gap-1.5 text-red-400 font-bold">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Rejecting Approved Clip</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  This clip was previously approved. Rejecting it will immediately stop automated view tracking, reset its earnings to $0.00, refund any allocated campaign budget, and notify the clipper with your mandatory reason.
                </p>
              </div>
            )}

            {/* Appeal Context Banner if Appealed */}
            {selectedSubmission.status === "APPEALED" && (
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-2.5 my-3">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Clipper Appeal Re-Evaluation</span>
                </div>

                <div className="space-y-1 text-slate-300 pl-5 text-[11px]">
                  <div>
                    <span className="text-red-400 font-bold block">Previous Rejection Reason:</span>
                    <span>{selectedSubmission.rejection_reason || "Campaign requirement not followed"}</span>
                  </div>
                  <div className="pt-1 border-t border-purple-500/20">
                    <span className="text-purple-300 font-bold block">Clipper's Appeal Explanation:</span>
                    <span className="text-white italic">"{selectedSubmission.appeal_reason}"</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs text-slate-300 my-4">
              <div className="space-y-1.5">
                <div>
                  <strong>Clipper:</strong> @{selectedSubmission.clipper.username}
                </div>
                <div>
                  <strong>Campaign:</strong> {selectedSubmission.campaign.name}
                </div>
                <div>
                  <strong>Video URL:</strong>{" "}
                  <a
                    href={selectedSubmission.post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-cyan hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Open published clip</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Engagement Metrics Summary */}
              <div className="pt-2.5 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" /> Views
                  </div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {(selectedSubmission.current_views || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-red-950/20 border border-red-900/30">
                  <div className="text-[11px] text-red-300 flex items-center justify-center gap-1">
                    <Heart className="w-3 h-3 text-red-400" /> Likes
                  </div>
                  <div className="text-sm font-bold font-mono text-red-400 mt-0.5">
                    {(selectedSubmission.current_likes || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-950/20 border border-blue-900/30">
                  <div className="text-[11px] text-blue-300 flex items-center justify-center gap-1">
                    <MessageSquare className="w-3 h-3 text-blue-400" /> Comments
                  </div>
                  <div className="text-sm font-bold font-mono text-blue-400 mt-0.5">
                    {(selectedSubmission.current_comments || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleReviewAction} className="space-y-4 text-xs">
              {actionType === "REJECT" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Select Mandatory Rejection Reason
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-400"
                    >
                      {rejectionOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preset quick-select chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {rejectionOptions.slice(0, 5).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setRejectionReason(opt);
                          setCustomReason("");
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          rejectionReason === opt
                            ? "bg-red-500/20 text-red-300 border-red-500/50"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {rejectionReason === "Other" && (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Specific Explanation (Required)
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Detail the exact reason for rejection so the clipper knows what to fix..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-400"
                      />
                    </div>
                  )}

                  <p className="text-xs text-slate-400">
                    This reason is immediately sent to the clipper's notification inbox and dashboard so they know why the clip was rejected.
                  </p>
                </div>
              )}

              {actionType === "APPROVE" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-xs text-brand-emerald">
                    <p className="font-semibold">Ready to approve this clip?</p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Initial views detected: {(selectedSubmission.current_views || 0).toLocaleString()} views. Approving this submission initiates automated view tracking and calculates payable clipper earnings based on the campaign's CPM (${Number(selectedSubmission.campaign.cpm).toFixed(2)} CPM).
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                    actionType === "APPROVE"
                      ? "bg-brand-emerald text-slate-950 hover:bg-brand-emerald/90 shadow-emerald-500/20"
                      : "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"
                  }`}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>
                    Confirm {actionType === "APPROVE" ? (selectedSubmission.status === "APPEALED" ? "Appeal Approval" : "Approval") : (selectedSubmission.status === "APPROVED" ? "Revocation & Rejection" : selectedSubmission.status === "APPEALED" ? "Appeal Rejection" : "Rejection")}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

