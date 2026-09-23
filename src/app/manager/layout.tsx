"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  LayoutDashboard,
  Compass,
  FileCheck,
  Users,
  Trophy,
  CreditCard,
  History,
  LogOut,
  RefreshCw,
  Shield,
  Menu,
  X,
  Plus,
  Loader2,
} from "lucide-react";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [syncingViews, setSyncingViews] = useState(false);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);

  const isLoginPage = pathname === "/manager/login";

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          if (!isLoginPage) router.push("/manager/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.authenticated && (data.user.role === "MANAGER" || data.user.role === "ADMIN")) {
          setUser(data.user);
          if (isLoginPage) {
            router.push("/manager/dashboard");
          }
        } else if (!isLoginPage) {
          router.push("/manager/login");
        }
      })
      .catch(() => {
        if (!isLoginPage) router.push("/manager/login");
      });
  }, [router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/manager/login");
  };

  const handleTriggerSync = async () => {
    try {
      setSyncingViews(true);
      setSyncSummary(null);
      const res = await fetch("/api/cron/sync-views", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncSummary(
          `Sync completed! Processed ${data.summary.totalProcessed} clips (+${data.summary.totalEligibleViewsGenerated.toLocaleString()} views, +$${data.summary.totalEarningsGenerated.toFixed(2)})`
        );
        setTimeout(() => setSyncSummary(null), 6000);
      } else {
        alert("Sync failed: " + data.error);
      }
    } catch {
      alert("Network error triggering view sync worker");
    } finally {
      setSyncingViews(false);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
    { label: "Campaigns", href: "/manager/campaigns", icon: Compass },
    { label: "Submissions Review", href: "/manager/submissions", icon: FileCheck },
    { label: "Clippers Directory", href: "/manager/clippers", icon: Users },
    { label: "Leaderboards", href: "/manager/leaderboard", icon: Trophy },
    { label: "Payout Approvals", href: "/manager/payouts", icon: CreditCard },
    { label: "System Audit Logs", href: "/manager/audit-logs", icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0A0F1D] border-b border-slate-800 sticky top-0 z-40">
        <ClipEarnLogo size="sm" href="/manager/dashboard" />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* Manager Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-[#0A0F1D] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 overflow-y-auto">
          <div className="pb-6 border-b border-slate-800/80 flex items-center justify-between gap-5">
            <ClipEarnLogo size="sm" href="/manager/dashboard" />
            <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold text-[9px] uppercase border border-purple-500/30 shrink-0 ml-5">
              Staff
            </span>
          </div>

          <div className="mt-6">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">
              Management
            </span>
            <div className="mt-2 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/80"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Manager User & Worker Trigger */}
        <div className="p-5 border-t border-slate-800/80 bg-[#080C17] space-y-3">
          {/* Worker Sync Button */}
          <button
            onClick={handleTriggerSync}
            disabled={syncingViews}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            title="Trigger 8-Hour View Sync Worker Manually"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-cyan ${syncingViews ? "animate-spin" : ""}`} />
            <span>{syncingViews ? "Syncing Views..." : "Trigger View Worker"}</span>
          </button>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                <Shield className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate max-w-[100px]">
                  {user?.username || "Manager"}
                </div>
                <div className="text-[10px] text-purple-400 font-semibold">{user?.role}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {syncSummary && (
          <div className="mb-6 p-4 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-xs font-semibold text-brand-emerald flex items-center justify-between">
            <span>{syncSummary}</span>
            <button onClick={() => setSyncSummary(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
