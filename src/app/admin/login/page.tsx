"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  Shield,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const reasonParam = searchParams.get("reason");

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState(
    errorParam === "not_authorized"
      ? "Access Denied: You do not have Administrator permissions to enter this portal."
      : errorParam === "account_suspended"
      ? reasonParam
        ? `Account Suspended: "${reasonParam}"`
        : "Your account has been suspended."
      : errorParam === "oauth_failed"
      ? "Discord administrator authentication failed. Please try again."
      : errorParam === "missing_code"
      ? "Authorization code missing."
      : ""
  );

  // If already authenticated as an Admin, redirect to Admin dashboard
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.authenticated && data.user?.role === "ADMIN") {
          router.push("/admin/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleAdminCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdminLoading(true);

    try {
      const res = await fetch("/api/auth/manager-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword, portal: "admin" }),
      });
      const data = await res.json();

      if (res.ok && data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        setError(data.error || "Invalid administrator credentials.");
        setAdminLoading(false);
      }
    } catch {
      setError("Network error during administrator authentication");
      setAdminLoading(false);
    }
  };

  const handleDiscordOAuthAdmin = () => {
    window.location.href = "/api/auth/discord?portal=admin";
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[380px] bg-red-950/20 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <ClipEarnLogo size="lg" href="/" />
          <h1 className="text-2xl font-black text-white mt-6">
            Admin / Staff Portal
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-red-900/40 text-xs font-semibold text-red-400 mt-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Authorized System Administration</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-8 shadow-2xl relative">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Admin Credentials Form */}
          <form onSubmit={handleAdminCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@clipearn.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B0E14] border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B0E14] border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={adminLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 text-white font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 mt-2 shadow-lg"
            >
              {adminLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
              <span>Sign In as Admin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              Or Authenticate Via
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Discord OAuth Admin Access */}
          <button
            type="button"
            onClick={handleDiscordOAuthAdmin}
            className="w-full py-2.5 px-4 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4 fill-current text-[#5865F2]" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>Linked Discord Admin Account</span>
          </button>

          {/* Navigation Links to Other Portals */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs space-y-2">
            <div>
              <span className="text-slate-500">Looking for Campaign Management? </span>
              <Link href="/manager/login" className="text-purple-400 hover:underline font-medium">
                Manager Login
              </Link>
            </div>
            <div>
              <span className="text-slate-500">Are you a clipper? </span>
              <Link href="/login" className="text-brand-cyan hover:underline font-medium">
                Clipper Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-red-400" />
          <span>Restricted to Authorized System Administrators</span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/data-deletion" className="hover:text-slate-300 transition-colors">Data Deletion</Link>
          <span>•</span>
          <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
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
