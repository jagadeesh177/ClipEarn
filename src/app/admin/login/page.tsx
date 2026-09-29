"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  Shield,
  ArrowRight,
  AlertCircle,
  Loader2,
  Mail,
  Lock,
} from "lucide-react";

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (errorParam === "not_authorized") {
      setError("This account is not authorized for administrator access. Only designated platform administrators may enter.");
    } else if (errorParam === "account_suspended") {
      const reason = searchParams.get("reason");
      setError(
        reason
          ? `Your administrator account has been suspended: "${reason}"`
          : "Your administrator account has been suspended."
      );
    } else if (errorParam === "oauth_failed") {
      setError("Discord authentication was cancelled or failed. Please try again.");
    } else if (errorParam === "missing_code") {
      setError("OAuth authorization code was missing. Please try again.");
    }
  }, [errorParam, searchParams]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();

      if (res.ok && data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        setError(data.error || "Invalid administrator credentials.");
        setLoading(false);
      }
    } catch {
      setError("A network error occurred during administrator login.");
      setLoading(false);
    }
  };

  const handleDiscordAdminLogin = () => {
    window.location.href = "/api/auth/discord?portal=admin";
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background amber glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <ClipEarnLogo size="lg" href="/" />
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-6">
            Administrator Sign In
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400 mt-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Authorized Administrators Only</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 sm:p-8 shadow-2xl relative">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Administrator Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@clipearn.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : null}
              <span>Sign In as Administrator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              OR DIRECT AUTH
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Discord Administrator Sign In */}
          <button
            type="button"
            onClick={handleDiscordAdminLogin}
            className="w-full py-3 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs transition-all flex items-center justify-center gap-2.5 shadow-md"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>Sign In as Administrator with Discord</span>
          </button>

          {/* Links to Manager Portal & Clipper Portal */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs space-y-2.5">
            <div>
              <Link
                href="/manager/login"
                className="text-slate-400 hover:text-purple-400 transition-colors font-medium"
              >
                ← Back to Campaign Manager Portal
              </Link>
            </div>
            <div className="text-slate-500">
              <span>Are you a video clipper? </span>
              <Link href="/login" className="text-brand-cyan hover:underline font-medium">
                Clipper Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <AdminLoginContent />
    </Suspense>
  );
}
