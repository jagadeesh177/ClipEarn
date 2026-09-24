"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function ProfileAndAccountsContent() {
  const searchParams = useSearchParams();
  const verifiedParam = searchParams.get("verified");
  const errorParam = searchParams.get("error");
  const accountIdParam = searchParams.get("accountId");
  const expectedUsername = searchParams.get("expected");
  const authorizedUsername = searchParams.get("authorized");

  const [profile, setProfile] = useState<any>(() => clientCache.get("clipper_user_profile"));
  const [accounts, setAccounts] = useState<any[]>(() => clientCache.get("clipper_social_accounts") || []);
  const [loading, setLoading] = useState(() => !clientCache.get("clipper_user_profile"));

  // Top banner alert
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(() => {
    if (verifiedParam === "true") {
      return {
        type: "success",
        message: "✓ Instagram account verified",
      };
    }
    if (errorParam === "code_not_found") {
      return {
        type: "error",
        message:
          "The verification code was not found in the Instagram bio. Please make sure the exact code is present in your bio and try again.",
      };
    }
    if (errorParam === "username_mismatch") {
      return {
        type: "error",
        message: `The authorized Instagram account (@${authorizedUsername || ""}) does not match the username you entered (@${expectedUsername || ""}). Please authorize the matching account.`,
      };
    }
    if (errorParam === "instagram_auth_failed") {
      return {
        type: "error",
        message: "Instagram authorization was cancelled or encountered an error. Please try again.",
      };
    }
    return null;
  });

  // Add account modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [username, setUsername] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Verification modal
  const [verifyingAccount, setVerifyingAccount] = useState<any>(null);
  const [checkingBio, setCheckingBio] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);
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
          const validAccounts = accRes.data.filter((a: any) => a.verification_status !== "DISCONNECTED");
          setAccounts(validAccounts);
          clientCache.set("clipper_social_accounts", validAccounts);

          // If coming back from callback with code_not_found, auto-open the verification modal for that account
          if (errorParam === "code_not_found" && accountIdParam) {
            const acc = validAccounts.find((a: any) => a.id === accountIdParam);
            if (acc) {
              setVerifyingAccount(acc);
              setVerificationError(
                "The verification code was not found in the Instagram bio. Please make sure the exact code is present in your bio and try again."
              );
            }
          }
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
        setVerificationError("");
        setVerificationSuccess(false);
      } else {
        const rawErr = data.error || "Failed to connect account";
        setAddError(
          rawErr.startsWith("ACCOUNT_SUSPENDED:")
            ? `Account Suspended: ${rawErr.replace("ACCOUNT_SUSPENDED:", "").trim()}`
            : rawErr
        );
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
    setVerificationSuccess(false);
    setCheckingBio(true);

    try {
      const res = await fetch(`/api/social-accounts/${verifyingAccount.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok && data.is_verified) {
        setVerificationSuccess(true);
        setStatusBanner({
          type: "success",
          message: "✓ Instagram account verified",
        });
        loadData();
        setTimeout(() => {
          setVerifyingAccount(null);
          setVerificationSuccess(false);
        }, 1800);
      } else {
        const rawErr = data.error;
        setVerificationError(
          rawErr && rawErr.startsWith("ACCOUNT_SUSPENDED:")
            ? `Account Suspended: ${rawErr.replace("ACCOUNT_SUSPENDED:", "").trim()}`
            : rawErr ||
              "The verification code was not found in the Instagram bio. Please make sure the exact code is present in your bio and try again."
        );
      }
    } catch {
      setVerificationError("Network error during verification. Please try again.");
    } finally {
      setCheckingBio(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this social account? Only the social profile will be removed. All your submitted clips, views, and earnings will remain 100% intact on the website."
      )
    )
      return;

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
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Profile &amp; Accounts</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your creator profile and connected social channels.
          </p>
        </div>

        <button
          onClick={() => {
            setAddError("");
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-black font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_-5px_rgba(28,247,253,0.3)] flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 text-black stroke-[2.5]" />
          <span>Connect Social Account</span>
        </button>
      </div>

      {/* Status Banner */}
      {statusBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
            statusBanner.type === "success"
              ? "bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan font-bold"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusBanner.type === "success" ? (
              <Check className="w-4 h-4 shrink-0 text-brand-cyan" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Creator Profile Card */}
      <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-cyan to-brand-emerald p-[2px] shrink-0">
            <div className="w-full h-full rounded-2xl bg-[#090E17] flex items-center justify-center text-2xl font-black text-white">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                profile?.username?.charAt(0)?.toUpperCase() || "C"
              )}
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-bold text-white">{profile?.username || "Clipper"}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 w-fit mx-auto sm:mx-0">
                <Sparkles className="w-3 h-3" />
                <span>Verified Clipper</span>
              </span>
            </div>

            <p className="text-xs text-slate-400">
              {profile?.email || "No email linked (Discord OAuth)"}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <span>Member since: {new Date(profile?.created_at || Date.now()).toLocaleDateString()}</span>
              <span>•</span>
              <span>
                Referral Code: <span className="font-mono text-brand-cyan">{profile?.referral_code}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-cyan" />
            <span>Connected Social Media Accounts ({accounts.length})</span>
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
              onClick={() => {
                setAddError("");
                setIsAddModalOpen(true);
              }}
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
                            : acc.profile_url?.replace("instagram.com/@", "instagram.com/") ||
                              `https://${acc.platform.toLowerCase()}.com/@${acc.username.replace(/^@/, "")}`
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
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => {
                            setVerifyingAccount(acc);
                            setVerificationError("");
                            setVerificationSuccess(false);
                          }}
                          className="flex-1 py-2 rounded-xl bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Verify Bio Code</span>
                        </button>
                        {acc.platform === "INSTAGRAM" && (
                          <a
                            href={`/api/social-accounts/oauth/instagram?accountId=${acc.id}`}
                            className="py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center justify-center gap-1.5"
                            title="Authorize with Instagram"
                          >
                            <span>OAuth</span>
                          </a>
                        )}
                      </div>
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
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="TIKTOK">TikTok</option>
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
              <span>Verify {verifyingAccount.platform === "INSTAGRAM" ? "Instagram" : ""} Account</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              To prevent unauthorized submissions, prove that you control @{verifyingAccount.username} on{" "}
              {verifyingAccount.platform}.
            </p>

            {verificationSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-xs text-brand-cyan flex items-center gap-2.5">
                <Check className="w-4 h-4 shrink-0 text-brand-cyan" />
                <span className="font-bold">✓ Instagram account verified</span>
              </div>
            )}

            {verificationError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="leading-relaxed">{verificationError}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 mb-6">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Instagram username:</span>
                <span className="font-bold text-white">@{verifyingAccount.username}</span>
              </div>

              <div className="text-xs text-slate-300 font-semibold pt-1">Your verification code:</div>
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

              <ol className="text-xs text-slate-400 space-y-1.5 pt-2 list-decimal pl-4">
                <li>Copy the verification code above.</li>
                <li>Paste it into your Instagram profile bio.</li>
                <li>Make sure your Instagram account is public.</li>
                <li>Click <strong>&quot;Verify Now&quot;</strong> to confirm ownership.</li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setVerifyingAccount(null);
                  setVerificationError("");
                  setVerificationSuccess(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleVerifyBio()}
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

export default function ProfileAndAccountsPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-slate-500 text-xs">Loading profile...</div>}>
      <ProfileAndAccountsContent />
    </Suspense>
  );
}
