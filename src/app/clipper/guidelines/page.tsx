"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  DollarSign,
  Video,
  Clock,
} from "lucide-react";

export default function GuidelinesPage() {
  const sections = [
    {
      title: "1. How ClipEarn Works",
      icon: Video,
      content:
        "ClipEarn connects premier brands with short-form video editors and UGC creators. Brands sponsor dedicated campaigns with established CPM rates (e.g. $1.00 CPM = $1.00 per 1,000 views). Creators produce clips, publish them to TikTok, Instagram Reels, or YouTube Shorts, and earn cash for verified views.",
    },
    {
      title: "2. Connecting & Verifying Social Accounts",
      icon: ShieldCheck,
      content:
        "To ensure creators only submit content they legitimately own, you must verify your social account before submitting. We generate a unique verification code (e.g. clipearn-81fa2b). Add this code to your social media bio, wait ~20 seconds, and click Verify. Unverified channels cannot submit clips.",
    },
    {
      title: "3. Submission & Human Manager Review",
      icon: Clock,
      content:
        "Immediately after submitting a video link, its status is set to PENDING. A human campaign manager evaluates your clip to ensure all brand requirements (hashtags, minimum video duration, clean audio, no prohibited content) are satisfied. Only APPROVED submissions begin tracking views and generating earnings.",
    },
    {
      title: "4. View Tracking & Eligibility Modes",
      icon: BookOpen,
      content:
        "Every 8 hours, our background workers query the platform APIs to snapshot current video views. Campaigns define view eligibility: 'From Submission' (views accrued after your submission snapshot), 'From Approval' (views accrued after manager approval), or 'Lifetime' (total lifetime views).",
    },
    {
      title: "5. Financial Ledger & Earnings Formula",
      icon: DollarSign,
      content:
        "Earnings are computed strictly server-side: (Eligible Views / 1,000) × Campaign CPM. Every earnings event is written to an immutable database ledger with exact decimal precision to prevent any floating-point discrepancies. Historical earnings rates are permanently locked even if a campaign later adjusts future CPM rates.",
    },
    {
      title: "6. Anti-Fraud & Prohibited Behavior",
      icon: AlertTriangle,
      content:
        "ClipEarn maintains strict anti-fraud safeguards. We prohibit: duplicate submissions of the same video, purchasing artificial bot views, sub-licensing other creators' accounts, submitting deleted or private videos, and cross-submitting identical clips across conflicting campaigns. Suspicious activity generates fraud flags for administrative investigation.",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800/80">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-brand-cyan" />
          ClipEarn Creator Guidelines & Rules
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Everything you need to know about qualifying clips, view calculations, and getting paid.
        </p>
      </div>

      {/* Rules Grid */}
      <div className="space-y-6">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-3"
            >
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Icon className="w-5 h-5 text-brand-cyan shrink-0" />
                <span>{sec.title}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-7">
                {sec.content}
              </p>
            </div>
          );
        })}
      </div>

      {/* Checklist Summary */}
      <div className="p-6 rounded-2xl bg-[#0A0F1D] border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-brand-emerald flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4" />
            DO (Ensures Quick Approval):
          </h3>
          <ul className="text-xs text-slate-300 space-y-2">
            <li>&bull; Include all required campaign hashtags and mentions.</li>
            <li>&bull; Produce crisp 1080x1920 vertical video with animated subtitles.</li>
            <li>&bull; Submit from your verified connected channel only.</li>
            <li>&bull; Ensure the clip is public and viewable worldwide.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4" />
            DON'T (Leads to Rejection):
          </h3>
          <ul className="text-xs text-slate-300 space-y-2">
            <li>&bull; Do not use robotic spam text-to-speech with stolen footage.</li>
            <li>&bull; Do not submit videos shorter than the campaign minimum.</li>
            <li>&bull; Do not submit duplicate links across multiple campaigns.</li>
            <li>&bull; Do not buy bot views or fake engagement.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
