"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Users,
  Video,
  Clock,
  DollarSign,
  TrendingUp,
  CreditCard,
  FileCheck,
  Plus,
  ArrowRight,
  ShieldAlert,
  Key,
  Copy,
  Check,
  X,
  Shield,
  Loader2,
  Eye,
  Heart,
  MessageSquare,
} from "lucide-react";

export default function ManagerDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Admin Manager Access Keys State
  const [keysModalOpen, setKeysModalOpen] = useState(false);
  const [accessKeysList, setAccessKeysList] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [justGeneratedKey, setJustGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleOpenKeysModal = async () => {
    setKeysModalOpen(true);
    setJustGeneratedKey(null);
    setCopiedKey(false);
    setLoadingKeys(true);
    try {
      const res = await fetch("/api/admin/manager-access-keys");
      const data = await res.json();
      if (res.ok && data.data) {
        setAccessKeysList(data.data);
      }
    } catch {
      setAccessKeysList([]);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setGeneratingKey(true);
      const res = await fetch("/api/admin/manager-access-keys", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.key) {
        setJustGeneratedKey(data.key);
        setAccessKeysList((prev) => [data.accessKey, ...prev]);
      } else {
        alert(data.error || "Failed to generate manager access code");
      }
    } catch {
      alert("Network error generating manager access code");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this manager access code? Any manager authentication in progress will be immediately blocked.")) return;
    try {
      setRevokingId(id);
      const res = await fetch(`/api/admin/manager-access-keys/${id}/revoke`, { method: "POST" });
      if (res.ok) {
        setAccessKeysList((prev) =>
          prev.map((k) => (k.id === id ? { ...k, status: "REVOKED" } : k))
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to revoke manager access code");
      }
    } catch {
      alert("Network error revoking manager access code");
    } finally {
      setRevokingId(null);
    }
  };

  useEffect(() => {
    fetch("/api/manager/analytics")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setAnalytics(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const data = analytics || {
    activeCampaignsCount: 0,
    totalClippersCount: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    approvedSubmissions: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    eligibleViews: 0,
    totalBudget: 0,
    usedBudget: 0,
    remainingBudget: 0,
    totalEarnings: 0,
    pendingPayoutAmount: 0,
    paidOutAmount: 0,
    avgViewsPerClip: 0,
    avgEarningsPerClip: 0,
  };

  const formatCurrency = (val: number) =>
    (val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">Campaign Manager Hub</h1>
          <p className="text-sm text-slate-400 mt-1">
            Platform-wide campaign budgets, submissions queue, and financial solvency monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 sm:pt-0.5">
          {currentUser?.role === "MANAGER" && (
            <Link
              href="/manager/campaigns?redeem=true"
              className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Key className="w-4 h-4 text-purple-400" />
              <span>Enter Campaign Access Code</span>
            </Link>
          )}

          <Link
            href="/manager/submissions"
            className="px-4 py-2.5 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/30 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-yellow-400" />
            <span>Pending Reviews ({data.pendingReviews})</span>
          </Link>

          {currentUser?.role === "ADMIN" && (
            <>
              <button
                onClick={handleOpenKeysModal}
                className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <Key className="w-4 h-4 text-purple-400" />
                <span>Campaign Managers</span>
              </button>

              <Link
                href="/manager/campaigns/create"
                className="px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-black text-xs transition-opacity hover:opacity-95 flex items-center gap-2 shadow-lg shadow-brand-cyan/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create Campaign</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 4 Primary Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-semibold text-slate-400 block">
            Active Campaigns
          </span>
          <div className="text-3xl font-black text-white mt-1">{data.activeCampaignsCount}</div>
          <span className="text-xs text-slate-400 mt-1 block">Live campaign budgets</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-semibold text-slate-400 block">
            Pending Clip Reviews
          </span>
          <div className="text-3xl font-black text-yellow-400 mt-1">{data.pendingReviews}</div>
          <span className="text-xs text-slate-400 mt-1 block">Awaiting human approval</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-semibold text-slate-400 block">
            Total Video Clippers
          </span>
          <div className="text-3xl font-black text-brand-cyan mt-1">{data.totalClippersCount}</div>
          <span className="text-xs text-slate-400 mt-1 block">Registered clippers</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
          <span className="text-xs font-semibold text-slate-400 block">
            Total Views Delivered
          </span>
          <div className="text-3xl font-black text-brand-cyan mt-1">
            {data.totalViews.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {data.eligibleViews.toLocaleString()} eligible
          </span>
        </div>
      </div>

      {/* Content Engagement & Reach Across Platforms */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Eye className="w-5 h-5 text-brand-cyan" />
          Clip Engagement & Reach Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 text-xs flex items-center gap-1.5 font-semibold">
              <Eye className="w-4 h-4 text-brand-cyan" /> Total Video Views
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {(data.totalViews || 0).toLocaleString()}
            </div>
            <span className="text-xs text-brand-cyan/80 mt-1 block">
              {(data.eligibleViews || 0).toLocaleString()} verified eligible views
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 text-xs flex items-center gap-1.5 font-semibold">
              <Heart className="w-4 h-4 text-red-400" /> Total Likes
            </span>
            <div className="text-2xl font-black text-red-400 mt-1">
              {(data.totalLikes || 0).toLocaleString()}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Total likes across all platforms
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 text-xs flex items-center gap-1.5 font-semibold">
              <MessageSquare className="w-4 h-4 text-blue-400" /> Total Comments
            </span>
            <div className="text-2xl font-black text-blue-400 mt-1">
              {(data.totalComments || 0).toLocaleString()}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Audience conversations & comments
            </span>
          </div>
        </div>
      </div>

      {/* Budget & Financial Solvency Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-brand-cyan" />
          Financial & Campaign Budget Health
        </h2>

        {/* 3 Stat columns aligned with page grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 text-xs block">Combined Campaign Budget</span>
            <div className="text-2xl font-black text-white mt-1">
              ${data.totalBudget.toLocaleString()}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Contracted brand funds</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 text-xs block">Budget Utilized (Accrued)</span>
            <div className="text-2xl font-black text-brand-cyan mt-1">
              ${formatCurrency(data.usedBudget)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              ${formatCurrency(data.remainingBudget)} remaining pool
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 text-xs block">Pending Payout Queue</span>
            <div className="text-2xl font-black text-purple-400 mt-1">
              ${formatCurrency(data.pendingPayoutAmount)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              ${formatCurrency(data.paidOutAmount)} already paid out
            </span>
          </div>
        </div>

        {/* Global Budget Utilization Bar */}
        <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Total Budget Absorption:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan font-bold text-xs">
                {data.totalBudget > 0
                  ? Math.round((data.usedBudget / data.totalBudget) * 100)
                  : 0}
                %
              </span>
            </div>
            <span className="text-slate-400 text-xs font-medium">
              ${formatCurrency(data.usedBudget)} / ${data.totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-brand-cyan rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(28,247,253,0.3)]"
              style={{
                width: `${
                  data.totalBudget > 0
                    ? Math.min(100, (data.usedBudget / data.totalBudget) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Panels (High-Density) */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Quick Actions</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/manager/submissions"
            className="p-4 rounded-xl bg-[#0F141F] border border-slate-800 hover:border-yellow-500/40 hover:bg-slate-900/60 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">
                  Review Submissions
                </h3>
                <span className="text-xs text-yellow-400/90 font-medium">
                  {data.pendingReviews} pending approval
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/manager/campaigns"
            className="p-4 rounded-xl bg-[#0F141F] border border-slate-800 hover:border-brand-cyan/40 hover:bg-slate-900/60 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">
                  Campaign Management
                </h3>
                <span className="text-xs text-brand-cyan/90 font-medium">
                  {data.activeCampaignsCount} active budgets
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/manager/payouts"
            className="p-4 rounded-xl bg-[#0F141F] border border-slate-800 hover:border-purple-500/40 hover:bg-slate-900/60 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Process Payouts
                </h3>
                <span className="text-xs text-purple-300/90 font-medium">
                  ${formatCurrency(data.pendingPayoutAmount)} queue
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* Admin Manager Access Codes Modal */}
      {keysModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0c1019] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-scaleIn my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800/80 flex items-start justify-between gap-4 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Campaign Manager Management
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                      Admin Only
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate one-time invitation keys to onboard Campaign Managers. Once linked with Discord, managers log in permanently without an access key.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setKeysModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Generate Key Button & Fresh Key Display */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">Generate One-Time Manager Invitation Key</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      New managers enter this invitation key once on /manager/login to permanently link their Discord account.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateKey}
                    disabled={generatingKey}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all shrink-0"
                  >
                    {generatingKey ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>{generatingKey ? "Generating..." : "Generate Code"}</span>
                  </button>
                </div>

                {justGeneratedKey && (
                  <div className="mt-4 p-4 rounded-xl bg-purple-900/40 border border-purple-500/50 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400" />
                        Manager Invitation Key Created Successfully:
                      </span>
                      <span className="text-[11px] text-amber-300 font-mono">
                        Valid for 7 days
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-black/60 border border-purple-500/60 rounded-lg px-3 py-2 text-purple-200 font-mono text-base font-bold tracking-widest selection:bg-purple-500">
                        {justGeneratedKey}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(justGeneratedKey);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="px-3 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                      >
                        {copiedKey ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Save or share this code now. Plaintext codes are not stored or shown again for security.
                    </p>
                  </div>
                )}
              </div>

              {/* Keys List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Manager Access Code History
                </h4>

                {loadingKeys ? (
                  <div className="py-8 flex items-center justify-center text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mr-2 text-purple-400" />
                    Loading access codes...
                  </div>
                ) : accessKeysList.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    No manager access codes generated yet. Click &quot;Generate Code&quot; above to create one.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-800/80">
                    {accessKeysList.map((k) => (
                      <div
                        key={k.id}
                        className="p-3 bg-[#0a0e17] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white tracking-wider">
                              {k.key_preview}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                k.status === "ACTIVE"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : k.status === "USED"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : k.status === "REVOKED"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-slate-700 text-slate-400"
                              }`}
                            >
                              {k.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>
                              Created: {new Date(k.created_at).toLocaleDateString()}
                            </span>
                            {k.used_at && (
                              <span>
                                • Used: {new Date(k.used_at).toLocaleDateString()}
                              </span>
                            )}
                            {k.used_by_user?.username && (
                              <span className="text-purple-300 font-medium">
                                • Linked Discord: @{k.used_by_user.username}
                              </span>
                            )}
                          </div>
                        </div>

                        {k.status === "ACTIVE" && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            disabled={revokingId === k.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-[11px] transition-colors shrink-0 disabled:opacity-50"
                          >
                            {revokingId === k.id ? "Revoking..." : "Revoke Invite"}
                          </button>
                        )}

                        {k.status === "USED" && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            disabled={revokingId === k.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-[11px] transition-colors shrink-0 disabled:opacity-50"
                          >
                            {revokingId === k.id ? "Revoking..." : "Revoke Access"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setKeysModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
