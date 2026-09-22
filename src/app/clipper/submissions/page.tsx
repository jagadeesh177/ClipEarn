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
  Eye,
  DollarSign,
  Calendar,
} from "lucide-react";

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  useEffect(() => {
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
  }, [statusFilter]);

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
            Track review status, eligible views velocity, and earnings ledger updates for your clips.
          </p>
        </div>

        <Link
          href="/clipper/campaigns"
          className="px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-brand-cyan/90 text-black font-bold text-xs transition-colors flex items-center gap-2 shadow-[0_0_20px_-3px_rgba(0,242,254,0.3)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Submission</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#0F141F] border border-slate-800 rounded-xl text-xs font-semibold w-fit">
        {["ALL", "APPROVED", "PENDING", "REJECTED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              statusFilter === st
                ? "bg-brand-cyan text-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {st === "ALL" ? "All Submissions" : st}
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
              ? "Join a campaign and submit your first video URL to start earning."
              : `No ${statusFilter.toLowerCase()} clips found.`}
          </p>
          <Link
            href="/clipper/campaigns"
            className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-brand-cyan text-black font-bold text-xs"
          >
            Browse Campaigns
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const isApproved = sub.status === "APPROVED";
            const isPending = sub.status === "PENDING";
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
                      <span>{sub.post_url}</span>
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
                      {isPending ? (
                        <span className="text-yellow-400/80 font-normal text-xs italic">Pending Review</span>
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

                  <div className="min-w-[110px] text-right">
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

                    {isRejected && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                          <XCircle className="w-3.5 h-3.5" />
                          REJECTED
                        </span>
                        {sub.rejection_reason && (
                          <button
                            onClick={() => setSelectedReason(sub.rejection_reason)}
                            className="text-[10px] text-red-400 hover:underline"
                          >
                            View Reason
                          </button>
                        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Submission Rejection Reason
            </h3>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 leading-relaxed my-4">
              {selectedReason}
            </div>
            <p className="text-xs text-slate-400 mb-6">
              You can modify your clip according to the campaign requirements and submit a revised version from your verified account.
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
    </div>
  );
}
