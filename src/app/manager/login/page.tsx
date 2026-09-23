"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  Shield,
  Key,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Mail,
  Lock,
  Sparkles,
} from "lucide-react";

function ManagerLoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [step, setStep] = useState<"READY" | "INVITE_VERIFIED">("READY");
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifiedKeyPreview, setVerifiedKeyPreview] = useState("");

  // Secondary Staff / Admin login toggle
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (errorParam === "not_authorized") {
      setError("This Discord account is not linked to an authorized Campaign Manager. If this is your first time, please enter your invitation key below.");
      setShowInviteInput(true);
    } else if (errorParam === "account_suspended") {
      setError("Your Campaign Manager access has been suspended or revoked by an administrator.");
    } else if (errorParam === "key_invalid") {
      setError("The invitation key is invalid or has expired.");
      setShowInviteInput(true);
    } else if (errorParam === "key_revoked") {
      setError("This invitation key has been revoked or has already been used.");
      setShowInviteInput(true);
    } else if (errorParam === "key_required") {
      setError("An invitation key is required for first-time onboarding.");
      setShowInviteInput(true);
    }
  }, [errorParam]);

  // STEP 1: Validate Invitation Key on Server
  const handleValidateAccessKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/manager-access-key/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey: accessKey.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVerifiedKeyPreview(accessKey.trim().toUpperCase());
        setStep("INVITE_VERIFIED");
      } else {
        setError(data.error || "Invalid or expired manager invitation key.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Initiate Discord OAuth as Campaign Manager
  const handleDiscordOAuth = () => {
    window.location.href = "/api/auth/discord?role=MANAGER";
  };

  // Admin / Staff Direct Login (The 2 authorized real Admins)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdminLoading(true);

    try {
      const res = await fetch("/api/auth/manager-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();

      if (res.ok && data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        setError(data.error || "Invalid admin credentials.");
        setAdminLoading(false);
      }
    } catch {
      setError("Network error during staff login");
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[380px] bg-purple-900/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <ClipEarnLogo size="lg" href="/" />
          <h1 className="text-2xl font-black text-white mt-6">
            {showAdminLogin ? "Admin / Staff Portal" : "Campaign Manager Access"}
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-purple-400 mt-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Authorized Campaign Management</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-8 shadow-2xl relative">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!showAdminLogin ? (
            step === "INVITE_VERIFIED" ? (
              /* INVITATION VERIFIED -> PROCEED TO DISCORD LINKING */
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">Invitation Key verified ✓</span>
                    <span className="text-[11px] text-emerald-300/80">
                      Code: <span className="font-mono">{verifiedKeyPreview}</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Continue with Discord to create and permanently link your Campaign Manager account. Future logins will not require an access key.
                </p>

                <button
                  type="button"
                  onClick={handleDiscordOAuth}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[#5865F2]/25"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  <span>Link Account with Discord</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("READY");
                    setError("");
                  }}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-400 py-1 transition-colors"
                >
                  Use a different invitation key
                </button>
              </div>
            ) : (
              /* PRIMARY CAMPAIGN MANAGER LOGIN VIEW */
              <div className="space-y-6">
                {/* Returning Manager 1-Click Discord Sign In */}
                <div>
                  <button
                    type="button"
                    onClick={handleDiscordOAuth}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[#5865F2]/25 group"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span>Continue with Discord</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    For returning managers with a linked Discord account
                  </p>
                </div>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    First-Time Setup
                  </span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                {/* First-Time Manager Onboarding Form */}
                <div className="rounded-xl bg-slate-900/50 border border-slate-800/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-purple-400" />
                      Redeem Manager Invitation Key
                    </span>
                    {!showInviteInput && (
                      <button
                        type="button"
                        onClick={() => setShowInviteInput(true)}
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                      >
                        Enter Key
                      </button>
                    )}
                  </div>

                  {showInviteInput ? (
                    <form onSubmit={handleValidateAccessKey} className="space-y-3 pt-1">
                      <p className="text-[11px] text-slate-400">
                        Enter the one-time invitation key provided by your administrator.
                      </p>
                      <div className="relative">
                        <Key className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={accessKey}
                          onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                          placeholder="CE-INVITE-________"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono tracking-wider text-white uppercase focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !accessKey.trim()}
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : null}
                        <span>Verify & Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      New to ClipEarn? Enter your admin invitation key once to permanently link your Discord account.
                    </p>
                  )}
                </div>
              </div>
            )
          ) : (
            /* Staff / Administrator Login Form (For the 2 authorized real Admins) */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan placeholder:text-slate-600"
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-black font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 mt-2"
              >
                {adminLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : null}
                <span>Sign In as Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Toggle between Campaign Manager portal & Staff/Admin login */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                setShowAdminLogin(!showAdminLogin);
                setError("");
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {showAdminLogin
                ? "← Back to Campaign Manager Login"
                : "Staff / Administrator Credentials"}
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            <span>Are you a clipper? </span>
            <Link href="/login" className="text-brand-cyan hover:underline font-medium">
              Clipper Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManagerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <ManagerLoginContent />
    </Suspense>
  );
}
