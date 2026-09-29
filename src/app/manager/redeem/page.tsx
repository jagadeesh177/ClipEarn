"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Key, ArrowRight, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Compass } from "lucide-react";

export default function ManagerRedeemPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [successCampaign, setSuccessCampaign] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessCampaign(null);

      const res = await fetch("/api/manager/access-code/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Invalid or expired access code.");
      }

      setSuccessCampaign(json.campaign);
      setCode("");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to redeem code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white">Redeem Campaign Access Code</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            CAMPAIGN ASSIGNMENT
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Enter the single-use Campaign Access Code provided by an administrator to begin managing a brand campaign.
        </p>
      </div>

      {successCampaign ? (
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-emerald-500/30 text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Access Granted!</h3>
            <p className="text-xs text-slate-400 mt-1">
              You are now an authorized Campaign Manager for:
            </p>
            <div className="mt-2 text-sm font-bold text-emerald-400">
              {successCampaign.name} ({successCampaign.brand_name})
            </div>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href={`/manager/campaigns/${successCampaign.id}`}
              className="px-5 py-2.5 rounded-xl bg-brand-cyan text-slate-950 font-bold text-xs hover:bg-brand-cyan/90 transition flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" /> Open Campaign Command Center
            </Link>
            <button
              onClick={() => setSuccessCampaign(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:text-white transition"
            >
              Redeem Another Code
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Campaign Access Code <span className="text-purple-400">*</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CE-MGR-XXXX-XXXX-XXXX"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition tracking-wider uppercase"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Format: CE-MGR-••••-••••-•••• (case-insensitive)
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Need a code? Contact an administrator.
            </span>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <span>Redeem Code</span> <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Security Info */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Campaign Access Codes enforce strict least-privilege isolation. You will only be granted review and performance monitoring capabilities for the specific campaign linked to your code.
        </p>
      </div>
    </div>
  );
}
