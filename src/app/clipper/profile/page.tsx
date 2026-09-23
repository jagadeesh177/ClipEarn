"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Trash2,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { clientCache } from "@/lib/clientCache";

export default function ProfileAndAccountsPage() {
  const [profile, setProfile] = useState<any>(() => clientCache.get("clipper_user_profile"));
  const [accounts, setAccounts] = useState<any[]>(() => clientCache.get("clipper_social_accounts") || []);
  const [loading, setLoading] = useState(() => !clientCache.get("clipper_user_profile"));

  // Add account modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [platform, setPlatform] = useState("TIKTOK");
  const [username, setUsername] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Verification modal
  const [verifyingAccount, setVerifyingAccount] = useState<any>(null);
  const [checkingBio, setCheckingBio] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadData = () => {
    Promise.all([
      fetch("/api/users/me").then((r) => r.json()),
      fetch("/api/social-accounts").then((r) => r.json()),
    ])
      .then(([profRes, accRes]) => {
        if (profRes.data) {
          setProfile(profRes.data);
          clientCache.set("clipper_user_profile", profRes.data);
        }
        if (accRes.data) {
          const verified = accRes.data.filter((a: any) => a.verification_status !== "DISCONNECTED");
          setAccounts(verified);
          clientCache.set("clipper_social_accounts", verified);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);

    try {
      const res = await fetch("/api/social-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, username }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsAddModalOpen(false);
        setUsername("");
        loadData();
        // Immediately open verification instructions for the created account
        setVerifyingAccount(data.account);
      } else {
        setAddError(data.error || "Failed to connect account");
      }
    } catch {
      setAddError("Network error connecting account");
    } finally {
      setAddLoading(false);
    }
  };

  const handleVerifyBio = async () => {
    if (!verifyingAccount) return;
    setVerificationError("");
    setCheckingBio(true);

    try {
      const res = await fetch(`/api/social-accounts/${verifyingAccount.id}/verify`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        alert("Account verified successfully! 🎉 You can now submit clips from this account.");
        setVerifyingAccount(null);
        loadData();
      } else {
        setVerificationError(data.error || "Verification code not detected in your bio.");
      }
    } catch {
      setVerificationError("Network error during verification.");
    } finally {
      setCheckingBio(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this social account? Only the social profile will be removed. All your submitted clips, views, and earnings will remain 100% intact on the website.")) return;

    // Optimistically remove from state so it immediately disappears from UI
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));

    try {
      const res = await fetch(`/api/social-accounts/${accountId}/disconnect`, {
        method: "POST",
      });
      if (res.ok) {
        clientCache.clear("clipper_user_profile");
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete account from database");
        loadData();
      }
    } catch {
      alert("Network error deleting account");
      loadData();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-brand-cyan" />
            Profile & Connected Accounts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect and verify your social channels. Content can only be submitted from verified accounts.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 shadow-[0_0_20px_-3px_rgba(28,247,253,0.3)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Connect New Account</span>
        </button>
      </div>

      {/* Clipper Identity Card */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={
              profile?.avatar_url ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username || "clipper"}`
            }
            alt="Avatar"
            className="w-16 h-16 rounded-2xl border border-slate-700 bg-slate-800 object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{profile?.username}</h2>
              <span className="px-2 py-0.5 rounded bg-brand-cyan/15 text-brand-cyan font-bold text-[10px] uppercase">
                {profile?.role}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-4">
              <span>Status: <strong className="text-brand-cyan">{profile?.status}</strong></span>
              <span>Discord ID: <span className="font-mono text-slate-300">{profile?.discord_id || "Connected"}</span></span>
              <span>Referral Code: <span className="font-mono text-brand-cyan">{profile?.referral_code}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-cyan" />
            Connected Social Media Accounts ({accounts.length})
          </h2>
          <span className="text-xs text-slate-500">Supported: TikTok, Instagram, YouTube</span>
        </div>

        {accounts.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-[#0F141F] border border-slate-800 p-8">
            <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-bold text-white">No accounts connected yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Before submitting clips to any campaign, you must connect and verify your social channels.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-cyan text-black font-bold text-xs"
            >
              + Connect Social Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => {
              const isVerified = acc.verification_status === "VERIFIED";

              return (
                <div
                  key={acc.id}
                  className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                          {acc.platform}
                        </span>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                            VERIFIED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
                            UNVERIFIED
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white mt-2">@{acc.username}</h3>
                      <a
                        href={
                          acc.platform === "INSTAGRAM"
                            ? `https://www.instagram.com/${acc.username.replace(/^@/, "")}`
                            : (acc.profile_url?.replace("instagram.com/@", "instagram.com/") || `https://${acc.platform.toLowerCase()}.com/@${acc.username.replace(/^@/, "")}`)
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-400 hover:text-brand-cyan flex items-center gap-1 mt-0.5"
                      >
                        <span>View profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <button
                      onClick={() => handleDisconnect(acc.id)}
                      title="Delete Account Permanently"
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    {isVerified ? (
                      <span className="text-[11px] text-slate-400">
                        Verified on {new Date(acc.verified_at || acc.updated_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <button
                        onClick={() => setVerifyingAccount(acc)}
                        className="w-full py-2 rounded-xl bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Verify Account Bio Code</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connect Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold text-white mb-2">Connect Social Account</h3>
            <p className="text-xs text-slate-400 mb-6">
              Enter your handle. ClipEarn will generate a verification code to place in your bio to prove ownership.
            </p>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddAccount} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-cyan"
                >
                  <option value="TIKTOK">TikTok</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="YOUTUBE">YouTube</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Account Username / Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">@</span>
                  <input
                    type="text"
                    required
                    placeholder="yourhandle"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2.5 rounded-xl bg-brand-cyan text-black font-bold flex items-center gap-2 hover:opacity-90"
                >
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : null}
                  <span>Next: Verify Ownership &rarr;</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Instructions Modal */}
      {verifyingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-cyan" />
              Verify Account Ownership
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              To prevent unauthorized submissions, prove that you control @{verifyingAccount.username} on {verifyingAccount.platform}.
            </p>

            {verificationError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="leading-relaxed">{verificationError}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 mb-6">
              <div className="text-xs text-slate-300 font-semibold">Step 1: Copy this unique code:</div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-black/50 border border-brand-cyan/40 font-mono text-sm font-bold text-brand-cyan">
                <span>{verifyingAccount.verification_code || "clipearn-81fa2b"}</span>
                <button
                  onClick={() => copyToClipboard(verifyingAccount.verification_code || "clipearn-81fa2b")}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-brand-cyan" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 space-y-1 pt-2">
                <p><strong>Step 2:</strong> Paste the code anywhere into your {verifyingAccount.platform} profile bio.</p>
                <p><strong>Step 3:</strong> Save your bio, wait ~20 seconds for profile caches to update, and click <strong>Verify Now</strong>.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVerifyingAccount(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Verify Later
              </button>
              <button
                type="button"
                onClick={handleVerifyBio}
                disabled={checkingBio}
                className="px-6 py-2.5 rounded-xl bg-brand-cyan text-black font-bold text-xs flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {checkingBio ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : null}
                <span>Verify Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
