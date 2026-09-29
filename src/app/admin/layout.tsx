"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  CreditCard,
  Users,
  History,
  LogOut,
  RefreshCw,
  Shield,
  Menu,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [syncingViews, setSyncingViews] = useState(false);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/manager/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.authenticated && data.user.role === "ADMIN") {
          setUser(data.user);
          setLoading(false);
        } else {
          setUnauthorized(true);
          setLoading(false);
        }
      })
      .catch(() => {
        router.push("/manager/login");
      });
  }, [router]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A0F] text-slate-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-xs font-semibold text-slate-400">Verifying Administrator Access...</p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-[#070A0F] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0D131D] border border-rose-500/30 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Admin Portal is strictly restricted to platform administrators. Campaign Managers should access their assigned campaigns via the Campaign Manager Portal.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/manager/dashboard"
              className="w-full py-2.5 rounded-xl bg-brand-cyan text-slate-950 font-bold text-xs hover:bg-brand-cyan/90 transition text-center"
            >
              Go to Campaign Manager Portal
            </Link>
            <button
              onClick={handleLogout}
              className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs hover:text-white transition"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Platform Overview", href: "/admin", icon: LayoutDashboard },
    { label: "All Campaigns", href: "/admin/campaigns", icon: Compass },
    { label: "Create Campaign", href: "/admin/campaigns/create", icon: PlusCircle },
    { label: "Clipper Payouts", href: "/admin/payouts", icon: CreditCard },
    { label: "Campaign Managers", href: "/admin/managers", icon: Users },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0A0F1D] border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <ClipEarnLogo size="sm" href="/admin" />
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
            ADMIN
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0A0F1D] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <ClipEarnLogo size="md" href="/admin" />
              <div className="flex items-center gap-1.5 pt-1">
                <Shield className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Admin Console
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                    isActive
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          {syncSummary && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-400 leading-tight">
              {syncSummary}
            </div>
          )}

          <button
            onClick={handleTriggerSync}
            disabled={syncingViews}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingViews ? "animate-spin text-amber-400" : ""}`} />
            {syncingViews ? "Syncing Views..." : "Trigger Social Sync"}
          </button>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs truncate max-w-[140px]">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 text-xs">
                {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="truncate">
                <div className="font-bold text-white truncate text-xs">{user?.username}</div>
                <div className="text-[10px] text-slate-500 truncate">Administrator</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-rose-400 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
