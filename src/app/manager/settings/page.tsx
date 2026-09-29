"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Shield,
  User,
  Compass,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ExternalLink,
} from "lucide-react";

export default function ManagerSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [assignedCampaigns, setAssignedCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/manager/campaigns").then((r) => r.json()),
    ])
      .then(([userData, campData]) => {
        if (userData?.user) setUser(userData.user);
        if (campData?.data) setAssignedCampaigns(campData.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/manager/login";
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Campaign Manager Settings</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/15 text-purple-400 border border-purple-500/30">
              OPERATIONS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review your manager credentials, assigned campaigns portfolio, and operational review standard operating procedures.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 hover:border-rose-500/30 text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Manager Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">Username</span>
            <span className="text-sm font-bold text-white block">{user?.username || "Loading..."}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">Role</span>
            <span className="text-sm font-bold text-purple-400 block font-mono">{user?.role || "MANAGER"}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">Discord ID</span>
            <span className="text-sm font-mono text-slate-300 block">{user?.discord_id || "Linked"}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">Email</span>
            <span className="text-sm text-slate-300 block">{user?.email || "No email provided"}</span>
          </div>
        </div>
      </div>

      {/* Assigned Campaigns */}
      <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-cyan" />
            <h2 className="text-base font-bold text-white">Assigned Campaigns</h2>
          </div>
          <Link
            href="/manager/redeem"
            className="text-xs font-bold text-brand-cyan hover:underline"
          >
            + Redeem New Campaign Code
          </Link>
        </div>

        {assignedCampaigns.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
            <p className="text-xs text-slate-400">You currently have no assigned campaigns.</p>
            <Link
              href="/manager/redeem"
              className="inline-block px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
            >
              Redeem Access Code
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            {assignedCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-white text-xs block">{camp.name}</span>
                  <span className="text-[11px] text-slate-500">{camp.brand_name}</span>
                </div>
                <Link
                  href={`/manager/campaigns/${camp.id}`}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Guidelines & SOP */}
      <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Submission Review Guidelines</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">FIFO Queue Order</strong>
              Always review submissions in chronological order (oldest first). Submissions at the top of your queue have waited longest.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Verification Checklist</strong>
              Verify that the video features the brand appropriately, contains all mandatory hashtags in caption, and is hosted on an authorized platform.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Rejection Requirements</strong>
              Every rejection must include a clear, professional reason to allow the clipper to correct their video or appeal if appropriate.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
