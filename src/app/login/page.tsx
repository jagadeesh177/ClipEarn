"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import { Sparkles, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

function ClipperLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const errorParam = searchParams.get("error");

  const [loadingDemo, setLoadingDemo] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    errorParam === "oauth_failed"
      ? "Discord authentication failed. Please try again."
      : errorParam === "missing_code"
      ? "Authorization code missing."
      : ""
  );

  const handleDemoLogin = async () => {
    try {
      setLoadingDemo(true);
      setErrorMessage("");
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "CLIPPER" }),
      });
      const data = await res.json();
      if (res.ok && data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        setErrorMessage(data.error || "Demo login failed");
        setLoadingDemo(false);
      }
    } catch {
      setErrorMessage("Network error during demo login");
      setLoadingDemo(false);
    }
  };

  const handleDiscordOAuth = () => {
    let url = "/api/auth/discord";
    if (refCode) url += `?ref=${encodeURIComponent(refCode)}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Glow background effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-brand-cyan/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <ClipEarnLogo size="lg" href="/" />
          <h2 className="text-2xl font-black text-white mt-6">Welcome back!</h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-brand-cyan mt-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clipper Portal</span>
          </div>
          {refCode && (
            <div className="mt-3 text-xs text-brand-cyan font-medium bg-brand-cyan/10 border border-brand-cyan/20 px-3 py-1.5 rounded-lg inline-block">
              Referred by friend: <span className="font-bold">{refCode}</span>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-8 shadow-2xl relative">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Primary Discord OAuth Login */}
            <button
              onClick={handleDiscordOAuth}
              className="w-full py-3.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[#5865F2]/25"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>Login with Discord</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Or Instant Preview
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Instant Demo Clipper Login */}
            <button
              onClick={handleDemoLogin}
              disabled={loadingDemo}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              {loadingDemo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-cyan" />
                  <span>Entering Dashboard...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-brand-cyan" />
                  <span>1-Click Demo Clipper Login</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <span>Looking for campaign administration? </span>
            <Link href="/manager/login" className="text-brand-cyan hover:underline font-semibold">
              Manager Login
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-emerald" />
          <span>Automated view verification & auditable ledger payouts</span>
        </div>
      </div>
    </div>
  );
}

export default function ClipperLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <ClipperLoginContent />
    </Suspense>
  );
}
