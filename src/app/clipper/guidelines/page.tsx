"use client";

import React from "react";
import { Video, CheckCircle2, XCircle } from "lucide-react";

export default function GuidelinesPage() {
  const allowedRules = [
    "Keep all communication respectful when interacting with ClipEarn managers, admins, and other clippers.",
    "Only connect and submit content through social media accounts that you personally own and control.",
    "Every submitted clip goes through a review process before it becomes eligible for earnings.",
    "Submit quality edits only. Spam posting, extremely low-effort clips, or repetitive content may be rejected.",
    "Your submitted videos must remain public and accessible while their views are being tracked.",
    "For questions or issues regarding a campaign, use the available ClipEarn support channel to contact the campaign team.",
  ];

  const prohibitedRules = [
    "Artificial views, bots, fake engagement, or other forms of manipulation can result in a permanent ban.",
    "Suspicious or abnormal engagement patterns may cause a clip to be rejected and flagged for review.",
    "If a social media account or submitted video becomes unavailable, restricted, or banned, the associated views may become ineligible for payment.",
    "A clip may be reviewed again after approval as part of the campaign's final review process.",
    "If a clip is rejected, the rejection reason will be shown when available, and the campaign review decision will be final.",
  ];

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Section Header */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.25)] shrink-0">
          <Video className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 stroke-[1.8]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            ClipEarn Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Rules every clipper must follow
          </p>
        </div>
      </div>

      {/* Rules Container Card */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#0B0F19] border border-slate-800/90 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Left Column = Accepted / Required Behavior */}
          <div className="space-y-5 sm:space-y-6">
            {allowedRules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 stroke-[1.75] mt-0.5" />
                <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed font-normal">
                  {rule}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column = Prohibited / Rejection Behavior */}
          <div className="space-y-5 sm:space-y-6">
            {prohibitedRules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-3.5">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 stroke-[1.75] mt-0.5" />
                <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed font-normal">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
