"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Key, Compass, Lock } from "lucide-react";

export default function ManagerCampaignCreateRedirect() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4 animate-fadeIn">
      <div className="p-8 rounded-2xl bg-[#0D131D] border border-slate-800 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-xl font-black text-white">Campaign Creation Restricted</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Campaign creation is strictly managed by Platform Administrators. Campaign Managers are assigned operational oversight of campaigns via secure Campaign Access Codes.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/manager/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <span>Go to Manager Dashboard</span>
          </Link>

          <Link
            href="/manager/campaigns"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Assigned Campaigns</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
