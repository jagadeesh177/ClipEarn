"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
} from "lucide-react";

function AdminSubmissionsContent() {
  const searchParams = useSearchParams();
  const initialCampaignId = searchParams.get("campaign_id") || "";

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(initialCampaignId);
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

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setCampaigns(data.data);
      })
      .catch(() => {});
  }, []);

  const loadSubmissions = () => {
    setLoading(true);
    let url = `/api/admin/submissions?limit=50`;
    if (selectedCampaignId) url += `&campaign_id=${selectedCampaignId}`;
    if (statusFilter && statusFilter !== "ALL") url += `&status=${statusFilter}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setSubmissions(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSubmissions();
  }, [selectedCampaignId, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSubmissions();
  };

  const openReviewModal = (submission: any, action: "APPROVE" | "REJECT") => {
    setSelectedSubmission(submission);
    setActionType(action);
    setRejectionReason(rejectionOptions[0]);
    setCustomReason("");
  };

  const handleReviewSubmit = async () => {
    if (!selectedSubmission) return;

    const finalReason =
      actionType === "REJECT"
        ? rejectionReason === "Other"
          ? customReason
          : rejectionReason
        : undefined;

    if (actionType === "REJECT" && !finalReason?.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch(`/api/admin/submissions/${selectedSubmission.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          rejection_reason: finalReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === selectedSubmission.id
              ? {
                  ...s,
                  status: actionType === "APPROVE" ? "APPROVED" : "REJECTED",
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: "Admin",
                  rejectionReason: finalReason,
                }
              : s
          )
        );
        setSelectedSubmission(null);
      } else {
        alert("Failed to review submission: " + data.error);
      }
    } catch {
      alert("Network error processing review.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Platform Submissions</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
              PLATFORM-WIDE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global review queue ordered by oldest submission first (FIFO). Approve or reject clips with strict database synchronization.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-[#0F141F] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        {/* Campaign Filter */}
        <div className="w-full md:w-64">
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400"
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.brand_name})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="APPEALED">Appealed</option>
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by clipper username, post URL, or ID..."
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
          />
        </form>

        <button
          onClick={loadSubmissions}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold"
        >
          Refresh
        </button>
      </div>

      {/* Submissions Table / Queue */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-xs text-slate-400">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0D131D] border border-slate-800 p-8 space-y-3">
          <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Submissions Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {statusFilter === "PENDING"
              ? "All submissions in the queue have been reviewed! Check back later."
              : "No submissions matched the selected filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const isPending = sub.status === "PENDING";
            const isApproved = sub.status === "APPROVED";
            const isRejected = sub.status === "REJECTED";

            return (
              <div
                key={sub.id}
                className="bg-[#0F141F] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                        isApproved
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : isRejected
                          ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {sub.status}
                    </span>

                    <span className="text-xs font-bold text-white">
                      {sub.campaignName}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      Clipper: <strong className="text-white">{sub.username}</strong>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Submitted: {new Date(sub.submittedAt).toLocaleDateString()} at{" "}
                      {new Date(sub.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 font-mono text-amber-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{sub.currentViews.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-slate-400">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>{sub.currentLikes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>{sub.currentComments.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-slate-400">
                      <Share2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>{sub.currentShares.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
                      <span>${sub.currentEarnings.toFixed(2)} earnings</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-3 text-xs">
                    <a
                      href={sub.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 underline truncate max-w-md font-mono text-[11px]"
                    >
                      <span>{sub.postUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  {sub.rejectionReason && (
                    <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                      <strong>Rejection reason:</strong> {sub.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => openReviewModal(sub, "APPROVE")}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => openReviewModal(sub, "REJECT")}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openReviewModal(sub, isApproved ? "REJECT" : "APPROVE")}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition"
                    >
                      Change to {isApproved ? "Reject" : "Approve"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {actionType === "APPROVE" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Approve Submission</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>Reject Submission</span>
                </>
              )}
            </h3>

            <p className="text-xs text-slate-400">
              {actionType === "APPROVE"
                ? `Approving this submission will immediately credit ${selectedSubmission.currentViews.toLocaleString()} views and calculate earnings based on the campaign CPM.`
                : "Rejecting this submission will halt view synchronization and earnings calculation for this video."}
            </p>

            {actionType === "REJECT" && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Select Rejection Reason
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
                >
                  {rejectionOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {rejectionReason === "Other" && (
                  <textarea
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Specify the reason for rejection..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                disabled={processing}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={processing}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 ${
                  actionType === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm {actionType === "APPROVE" ? "Approval" : "Rejection"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSubmissionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}>
      <AdminSubmissionsContent />
    </Suspense>
  );
}
