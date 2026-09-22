"use client";

import React, { useState, useEffect } from "react";
import { Share2, Copy, Check, Users, Gift, CheckCircle2, Clock, Sparkles } from "lucide-react";

export default function ReferralsPage() {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referrals")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const referralCode = data?.referralCode || "CLIPPER";
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const referralLink = `${origin}/login?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = data?.stats || { totalSignups: 0, qualifiedCount: 0, pendingCount: 0 };
  const referrals = data?.referrals || [];

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800/80">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <Share2 className="w-7 h-7 text-brand-cyan" />
          Creator Referral Program
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Invite other creators to ClipEarn and earn bonus rewards when their clips get approved.
        </p>
      </div>

      {/* Referral Link Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0F141F] to-[#0A0F1D] border border-slate-800 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-cyan/15 text-brand-cyan text-xs font-bold mb-4">
            <Gift className="w-3.5 h-3.5" />
            <span>Refer & Earn</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            Share Your Unique Clipper Invitation Link
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            When a friend signs up with your link, connects their accounts, and gets their first video clip approved by a campaign manager, they become a <strong>Qualified Referral</strong>.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-brand-cyan font-bold truncate">
              {referralLink}
            </div>

            <button
              onClick={copyLink}
              className="px-6 py-3.5 rounded-xl bg-brand-cyan text-black font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
              <span>{copied ? "Copied Link!" : "Copy Referral Link"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Signups
          </span>
          <div className="text-3xl font-black text-white mt-1">{stats.totalSignups}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Joined via your link</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Qualified Referrals
          </span>
          <div className="text-3xl font-black text-brand-emerald mt-1">{stats.qualifiedCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Has approved clip</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending Qualification
          </span>
          <div className="text-3xl font-black text-yellow-400 mt-1">{stats.pendingCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Awaiting first approved clip</span>
        </div>
      </div>

      {/* Referred Users Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4">Referred Creators</h2>

        {loading ? (
          <div className="py-6 text-center text-slate-500 text-xs">Loading referrals...</div>
        ) : referrals.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-bold text-white">No referrals yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Share your link with fellow video editors to start earning bonus rewards.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-3">Creator</th>
                  <th className="pb-3">Joined Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Qualified Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {referrals.map((ref: any) => (
                  <tr key={ref.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 pr-3 flex items-center gap-2.5 text-white font-bold">
                      <img
                        src={ref.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${ref.username}`}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full border border-slate-700 bg-slate-800"
                      />
                      <span>@{ref.username}</span>
                    </td>
                    <td className="py-3.5 pr-3 text-slate-400">
                      {new Date(ref.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 pr-3">
                      {ref.status === "QUALIFIED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30">
                          <CheckCircle2 className="w-3 h-3" />
                          QUALIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
                          <Clock className="w-3 h-3" />
                          PENDING CLIP
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {ref.qualifiedAt ? new Date(ref.qualifiedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
