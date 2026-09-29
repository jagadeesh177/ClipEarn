"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Shield,
  RefreshCw,
  History,
  Lock,
  Mail,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Database,
  Globe,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [syncingViews, setSyncingViews] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleManualSync = async () => {
    try {
      setSyncingViews(true);
      setSyncMessage(null);
      const res = await fetch("/api/cron/sync-views", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(
          `Sync successful: Processed ${data.summary.totalProcessed} clips (+${data.summary.totalEligibleViewsGenerated.toLocaleString()} views, +$${data.summary.totalEarningsGenerated.toFixed(2)})`
        );
      } else {
        setSyncMessage(`Sync failed: ${data.error}`);
      }
    } catch {
      setSyncMessage("Network error triggering view sync worker");
    } finally {
      setSyncingViews(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Platform Settings</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global platform governance, authorized administrator whitelists, background synchronization workers, and financial rule configurations.
          </p>
        </div>

        <Link
          href="/admin/audit-logs"
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto"
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>View Audit Logs</span>
        </Link>
      </div>

      {syncMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Authorized Administrators Section */}
      <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Designated Platform Administrators</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          ClipEarn strictly enforces that only the two designated administrator email addresses have access to the Admin Portal and platform financial execution.
        </p>

        <div className="space-y-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-white text-xs block">aronyesh63@gmail.com</span>
                <span className="text-[11px] text-slate-500">Super Administrator • Full Platform Control</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Active Whitelist
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-white text-xs block">easalajagadeesh@gmail.com</span>
                <span className="text-[11px] text-slate-500">Super Administrator • Full Platform Control</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Active Whitelist
            </span>
          </div>
        </div>
      </div>

      {/* Automated View Sync Worker Section */}
      <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-brand-cyan" />
            <h2 className="text-base font-bold text-white">Social Metric Synchronization Worker</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            8-Hour Cron Cycle
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          ClipEarn polls YouTube, TikTok, and Instagram social APIs every 8 hours to refresh approved clips, calculate eligible view increments, and update the ledger in immutable database transactions.
        </p>

        <div className="pt-2">
          <button
            onClick={handleManualSync}
            disabled={syncingViews}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncingViews ? "animate-spin text-amber-400" : ""}`} />
            <span>{syncingViews ? "Executing Worker..." : "Trigger Manual View Sync Now"}</span>
          </button>
        </div>
      </div>

      {/* Platform Financial Governance */}
      <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Financial & Payout Rules</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Standard Default CPM</span>
            <span className="text-xl font-bold text-white font-mono">$1.00 USD</span>
            <span className="text-[11px] text-slate-500 block mt-1">Configurable per campaign during creation</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Default Payout View Threshold</span>
            <span className="text-xl font-bold text-white font-mono">100,000 views</span>
            <span className="text-[11px] text-slate-500 block mt-1">Clippers qualify once approved views reach minimum</span>
          </div>
        </div>
      </div>

      {/* Production Canonical URLs */}
      <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Production Portal Route Architecture</h2>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-amber-400 font-semibold">https://clipearn.vercel.app/admin/dashboard</span>
            <span className="text-slate-500">Administrator Console</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-purple-400 font-semibold">https://clipearn.vercel.app/manager/dashboard</span>
            <span className="text-slate-500">Campaign Manager Portal</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-brand-cyan font-semibold">https://clipearn.vercel.app/clipper/dashboard</span>
            <span className="text-slate-500">Clipper Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
