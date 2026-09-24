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
  AlertTriangle,
  UserMinus,
  UserCheck,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function ManagerDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Admin Manager Access Keys & Managers State
  const [keysModalOpen, setKeysModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"MANAGERS" | "INVITES">("MANAGERS");
  const [managersList, setManagersList] = useState<any[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [accessKeysList, setAccessKeysList] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [justGeneratedKey, setJustGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  // Confirmation Modals State
  const [revokingManager, setRevokingManager] = useState<{ id: string; username: string } | null>(null);
  const [restoringManager, setRestoringManager] = useState<{ id: string; username: string } | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const fetchManagersData = async () => {
    setLoadingManagers(true);
    try {
      const res = await fetch("/api/admin/managers");
      const json = await res.json();
      if (res.ok && json.data) {
        setManagersList(json.data);
      }
    } catch {
      setManagersList([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  const fetchKeysData = async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch("/api/admin/manager-access-keys");
      const json = await res.json();
      if (res.ok && json.data) {
        setAccessKeysList(json.data);
      }
    } catch {
      setAccessKeysList([]);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleOpenKeysModal = async () => {
    setKeysModalOpen(true);
    setJustGeneratedKey(null);
    setCopiedKey(false);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);
    await Promise.all([fetchManagersData(), fetchKeysData()]);
  };

  const handleGenerateKey = async () => {
    try {
      setGeneratingKey(true);
      const res = await fetch("/api/admin/manager-access-keys", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.key) {
        setJustGeneratedKey(data.key);
        setAccessKeysList((prev) => [data.accessKey, ...prev]);
        setActionSuccessMessage("One-time manager invitation key generated successfully.");
        setTimeout(() => setActionSuccessMessage(null), 4000);
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
    if (!confirm("Are you sure you want to revoke this manager invitation code? Any manager authentication using this code will be immediately blocked.")) return;
    try {
      setRevokingKeyId(id);
      const res = await fetch(`/api/admin/manager-access-keys/${id}/revoke`, { method: "POST" });
      if (res.ok) {
        setAccessKeysList((prev) =>
          prev.map((k) => (k.id === id ? { ...k, status: "REVOKED" } : k))
        );
        // Refresh managers in case a linked user was demoted
        fetchManagersData();
        setActionSuccessMessage("Manager invitation key revoked.");
        setTimeout(() => setActionSuccessMessage(null), 4000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to revoke manager access code");
      }
    } catch {
      alert("Network error revoking manager access code");
    } finally {
      setRevokingKeyId(null);
    }
  };

  const handleConfirmRevokeManager = async () => {
    if (!revokingManager) return;
    setActionSubmitting(true);
    setActionErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/managers/${revokingManager.id}/revoke`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setManagersList((prev) =>
          prev.map((m) =>
            m.id === revokingManager.id
              ? { ...m, managerAccessStatus: "REVOKED", role: "CLIPPER" }
              : m
          )
        );
        // Also update keys list
        setAccessKeysList((prev) =>
          prev.map((k) =>
            k.used_by_user?.id === revokingManager.id ? { ...k, status: "REVOKED" } : k
          )
        );
        setActionSuccessMessage(
          `Manager privileges revoked for @${revokingManager.username}. Account preserved as Clipper.`
        );
        setTimeout(() => setActionSuccessMessage(null), 5000);
        setRevokingManager(null);
      } else {
        setActionErrorMessage(data.error || "Failed to revoke manager access.");
      }
    } catch {
      setActionErrorMessage("Network error revoking manager access.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleConfirmRestoreManager = async () => {
    if (!restoringManager) return;
    setActionSubmitting(true);
    setActionErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/managers/${restoringManager.id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setManagersList((prev) =>
          prev.map((m) =>
            m.id === restoringManager.id
              ? { ...m, managerAccessStatus: "ACTIVE", role: "MANAGER" }
              : m
          )
        );
        setAccessKeysList((prev) =>
          prev.map((k) =>
            k.used_by_user?.id === restoringManager.id ? { ...k, status: "USED" } : k
          )
        );
        setActionSuccessMessage(
          `Campaign Manager privileges restored for @${restoringManager.username}.`
        );
        setTimeout(() => setActionSuccessMessage(null), 5000);
        setRestoringManager(null);
      } else {
        setActionErrorMessage(data.error || "Failed to restore manager access.");
      }
    } catch {
      setActionErrorMessage("Network error restoring manager access.");
    } finally {
      setActionSubmitting(false);
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
          if (data.user.role === "ADMIN") {
            // Preload managers and keys list for Admin view
            fetch("/api/admin/managers")
              .then((r) => r.json())
              .then((j) => {
                if (j.data) setManagersList(j.data);
              })
              .catch(() => {});
          }
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

  const activeManagersCount = managersList.filter((m) => m.managerAccessStatus === "ACTIVE").length;
  const revokedManagersCount = managersList.filter((m) => m.managerAccessStatus === "REVOKED").length;

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
                <Users className="w-4 h-4 text-purple-400" />
                <span>Campaign Managers ({activeManagersCount})</span>
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
            {(data.totalViews || 0).toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {(data.eligibleViews || 0).toLocaleString()} eligible
          </span>
        </div>
      </div>

      {/* Admin Quick Control Card: Campaign Managers Access Management */}
      {currentUser?.role === "ADMIN" && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#0F141F] to-[#0F141F] border border-purple-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Campaign Manager Access & Permissions</h3>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Grant, revoke, or restore Campaign Manager access. Revoking removes management privileges immediately without banning or deleting the user.
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs">
              <span className="text-emerald-400 font-medium">
                • {activeManagersCount} Active {activeManagersCount === 1 ? "Manager" : "Managers"}
              </span>
              {revokedManagersCount > 0 && (
                <span className="text-amber-400 font-medium">
                  • {revokedManagersCount} Revoked (Active Clippers)
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleOpenKeysModal}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all shrink-0"
          >
            <Users className="w-4 h-4" />
            <span>Manage Campaign Managers</span>
          </button>
        </div>
      )}

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
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Financial Solvency & Escrow Budgets
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-xs font-semibold text-slate-400 block">
              Total Platform Budget
            </span>
            <div className="text-2xl font-black text-white mt-1">
              ${formatCurrency(data.totalBudget)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Committed by brands</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-xs font-semibold text-slate-400 block">
              Budget Utilized
            </span>
            <div className="text-2xl font-black text-brand-cyan mt-1">
              ${formatCurrency(data.usedBudget)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              {data.totalBudget > 0
                ? Math.round((data.usedBudget / data.totalBudget) * 100)
                : 0}
              % pool consumption
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-xs font-semibold text-slate-400 block">
              Solvency Reserve
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              ${formatCurrency(data.remainingBudget)}
            </div>
            <span className="text-xs text-emerald-400/80 mt-1 block">Guaranteed unallocated</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F141F] border border-slate-800 hover:border-slate-700 transition-colors">
            <span className="text-xs font-semibold text-slate-400 block">
              Pending Clipper Payouts
            </span>
            <div className="text-2xl font-black text-purple-400 mt-1">
              ${formatCurrency(data.pendingPayoutAmount)}
            </div>
            <span className="text-xs text-purple-400/80 mt-1 block">Awaiting admin transfer</span>
          </div>
        </div>
      </div>

      {/* Quick Operational Actions */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Manager Action Center</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/manager/submissions"
            className="p-4 rounded-xl bg-[#0F141F] border border-slate-800 hover:border-brand-cyan/40 hover:bg-slate-900/60 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">
                  Review Submissions
                </h3>
                <span className="text-xs text-yellow-400/90 font-medium">
                  {data.pendingReviews} awaiting check
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/manager/clippers"
            className="p-4 rounded-xl bg-[#0F141F] border border-slate-800 hover:border-brand-cyan/40 hover:bg-slate-900/60 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">
                  Clipper Directory
                </h3>
                <span className="text-xs text-blue-400/90 font-medium">
                  {data.totalClippersCount} creators
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/manager/campaigns"
            className="p-4 rounded-xl bg-[#0F141F] border border-slate-800 hover:border-brand-cyan/40 hover:bg-slate-900/60 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
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

      {/* Admin Campaign Managers & Access Control Modal */}
      {keysModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0c1019] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative animate-scaleIn my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800/80 flex items-start justify-between gap-4 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Campaign Manager Management
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                      Admin Only
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    View active managers, revoke or restore manager privileges, and generate one-time onboarding keys.
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

            {/* Success / Error notification inside modal */}
            {actionSuccessMessage && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/60">
              <button
                onClick={() => setModalTab("MANAGERS")}
                className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
                  modalTab === "MANAGERS"
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Campaign Managers ({managersList.length})</span>
              </button>
              <button
                onClick={() => setModalTab("INVITES")}
                className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
                  modalTab === "INVITES"
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Invite Keys ({accessKeysList.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {modalTab === "MANAGERS" ? (
                /* TAB 1: Campaign Managers List */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Campaign Manager Directory</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Revoking manager access immediately disables manager privileges while keeping their Clipper account active and data preserved.
                      </p>
                    </div>
                    <button
                      onClick={() => setModalTab("INVITES")}
                      className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Invite New</span>
                    </button>
                  </div>

                  {loadingManagers ? (
                    <div className="py-12 flex items-center justify-center text-slate-400 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin mr-2 text-purple-400" />
                      Loading Campaign Managers...
                    </div>
                  ) : managersList.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs space-y-2">
                      <Users className="w-8 h-8 mx-auto text-slate-600" />
                      <p>No Campaign Managers found.</p>
                      <button
                        onClick={() => setModalTab("INVITES")}
                        className="text-purple-400 hover:underline font-semibold"
                      >
                        Generate an invitation code to onboard a manager
                      </button>
                    </div>
                  ) : (
                    <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
                      {managersList.map((m) => {
                        const isActive = m.managerAccessStatus === "ACTIVE";
                        return (
                          <div
                            key={m.id}
                            className="p-3.5 bg-[#0a0e17] flex items-center justify-between gap-3 text-xs hover:bg-slate-900/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {m.avatar_url ? (
                                <img
                                  src={m.avatar_url}
                                  alt={m.username}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                                  {m.username.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm">
                                    @{m.username}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isActive
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    }`}
                                  >
                                    {isActive ? "Active Manager" : "Access Revoked (Clipper)"}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  {m.email && <span>{m.email}</span>}
                                  {m.discord_id && (
                                    <span className="text-purple-300/80 font-mono">
                                      • Discord ID: {m.discord_id}
                                    </span>
                                  )}
                                  {m.key_preview && (
                                    <span className="text-slate-500 font-mono">
                                      • Key: {m.key_preview}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isActive ? (
                                <button
                                  onClick={() => setRevokingManager(m)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  <span>Revoke Access</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setRestoringManager(m)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restore Access</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* TAB 2: Invite Keys & Code Generation */
                <div className="space-y-6">
                  {/* Generate Key Box */}
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
                            Valid for 14 days
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
                                    • Linked: @{k.used_by_user.username}
                                  </span>
                                )}
                              </div>
                            </div>

                            {k.status === "ACTIVE" && (
                              <button
                                onClick={() => handleRevokeKey(k.id)}
                                disabled={revokingKeyId === k.id}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-[11px] transition-colors shrink-0 disabled:opacity-50"
                              >
                                {revokingKeyId === k.id ? "Revoking..." : "Revoke Invite"}
                              </button>
                            )}

                            {k.status === "USED" && (
                              <button
                                onClick={() => handleRevokeKey(k.id)}
                                disabled={revokingKeyId === k.id}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-[11px] transition-colors shrink-0 disabled:opacity-50"
                              >
                                {revokingKeyId === k.id ? "Revoking..." : "Revoke Key"}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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

      {/* CONFIRMATION DIALOG 1: REVOKE MANAGER ACCESS */}
      {revokingManager && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f141f] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleIn space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Revoke Manager Access?</h3>
                <p className="text-xs text-rose-300">Action takes effect immediately</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                Are you sure you want to revoke Campaign Manager privileges for <strong className="text-white">@{revokingManager.username}</strong>?
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li><span className="text-emerald-400 font-semibold">Account preserved:</span> The user will remain active as a regular Clipper.</li>
                <li><span className="text-emerald-400 font-semibold">Zero data loss:</span> Submissions, campaigns, earnings, and history are kept intact.</li>
                <li><span className="text-rose-400 font-semibold">Permissions:</span> Access to the Manager Dashboard and campaign management is immediately disabled.</li>
                <li>You can restore their Manager access at any time.</li>
              </ul>
            </div>

            {actionErrorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {actionErrorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRevokingManager(null);
                  setActionErrorMessage(null);
                }}
                disabled={actionSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevokeManager}
                disabled={actionSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                <span>{actionSubmitting ? "Revoking..." : "Confirm Revoke"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG 2: RESTORE MANAGER ACCESS */}
      {restoringManager && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f141f] border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleIn space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Restore Manager Access?</h3>
                <p className="text-xs text-emerald-300">Grant full campaign management</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                Are you sure you want to restore Campaign Manager privileges for <strong className="text-white">@{restoringManager.username}</strong>?
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>They will immediately regain access to the Manager Dashboard.</li>
                <li>They will be authorized to create, edit, and review campaigns and submissions.</li>
              </ul>
            </div>

            {actionErrorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {actionErrorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRestoringManager(null);
                  setActionErrorMessage(null);
                }}
                disabled={actionSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestoreManager}
                disabled={actionSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>{actionSubmitting ? "Restoring..." : "Confirm Restore"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
