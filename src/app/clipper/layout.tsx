"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  LayoutDashboard,
  Compass,
  FileText,
  Bell,
  UserCheck,
  DollarSign,
  Share2,
  BookOpen,
  MessageSquare,
  LogOut,
  Menu,
  X,
  HelpCircle,
  ExternalLink,
  MessageCircle,
  ShieldAlert,
} from "lucide-react";
import { clientCache } from "@/lib/clientCache";

export default function ClipperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(() => clientCache.get("clipper_user_me"));
  const [unreadNotifications, setUnreadNotifications] = useState<number>(() => clientCache.get("clipper_unread_count") || 0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    // Keep strictly dark (pure black) theme
    try {
      localStorage.removeItem("clipearn_theme");
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } catch {}

    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) router.push("/login");
        return res.json();
      })
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          clientCache.set("clipper_user_me", data.user);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));

    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.unreadCount !== undefined) {
          setUnreadNotifications(data.unreadCount);
          clientCache.set("clipper_unread_count", data.unreadCount);
        }
      })
      .catch(() => {});

    // 1. Prefetch Next.js routes so clicking tabs is 0ms instant
    const routesToPrefetch = [
      "/clipper/dashboard",
      "/clipper/campaigns",
      "/clipper/submissions",
      "/clipper/earnings",
      "/clipper/profile",
      "/clipper/referrals",
      "/clipper/notifications",
      "/clipper/guidelines",
    ];
    routesToPrefetch.forEach((r) => {
      try {
        router.prefetch(r);
      } catch {}
    });

    // 2. Pre-warm data cache in the background on initial load
    if (!clientCache.get("clipper_campaigns_list")) {
      fetch("/api/campaigns?limit=50")
        .then((r) => r.json())
        .then((d) => {
          if (d.data) clientCache.set("clipper_campaigns_list", d.data);
        })
        .catch(() => {});
    }

    if (!clientCache.get("clipper_submissions_list")) {
      fetch("/api/submissions")
        .then((r) => r.json())
        .then((d) => {
          if (d.data) clientCache.set("clipper_submissions_list", d.data);
        })
        .catch(() => {});
    }

    if (!clientCache.get("clipper_user_profile")) {
      fetch("/api/users/me")
        .then((r) => r.json())
        .then((d) => {
          if (d.data) {
            clientCache.set("clipper_user_profile", d.data);
            if (d.data.socialAccounts) {
              clientCache.set("clipper_social_accounts", d.data.socialAccounts);
            }
          }
        })
        .catch(() => {});
    }

    if (!clientCache.get("clipper_earnings_payouts")) {
      fetch("/api/payouts")
        .then((r) => r.json())
        .then((d) => {
          if (d.data) clientCache.set("clipper_earnings_payouts", d.data);
        })
        .catch(() => {});
    }

    if (!clientCache.get("clipper_perf_30d")) {
      fetch("/api/clipper/performance?range=30d")
        .then((r) => r.json())
        .then((d) => {
          if (d.data) clientCache.set("clipper_perf_30d", d.data);
        })
        .catch(() => {});
    }

    if (!clientCache.get("clipper_referrals")) {
      fetch("/api/referrals")
        .then((r) => r.json())
        .then((d) => {
          if (d) clientCache.set("clipper_referrals", d);
        })
        .catch(() => {});
    }
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const personalNav = [
    { label: "Dashboard", href: "/clipper/dashboard", icon: LayoutDashboard },
    { label: "Browse Campaigns", href: "/clipper/campaigns", icon: Compass },
    { label: "My Submissions", href: "/clipper/submissions", icon: FileText },
    { label: "Notifications", href: "/clipper/notifications", icon: Bell, badge: unreadNotifications },
    { label: "Profile & Accounts", href: "/clipper/profile", icon: UserCheck },
    { label: "Earnings", href: "/clipper/earnings", icon: DollarSign },
    { label: "Referrals", href: "/clipper/referrals", icon: Share2 },
  ];

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : "A";

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col md:flex-row relative">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0A0F1D] border-b border-slate-800 sticky top-0 z-40">
        <ClipEarnLogo size="sm" href="/clipper/dashboard" />
        <div className="flex items-center gap-2">
          <Link
            href="/clipper/notifications"
            prefetch={true}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 relative text-slate-300"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-cyan text-black font-bold text-[10px] rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-[#0B0F17] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 overflow-y-auto flex-1 min-h-0">
          {/* Logo */}
          <div className="pb-5 border-b border-slate-800/60">
            <ClipEarnLogo size="md" href="/clipper/dashboard" />
          </div>

          {/* PERSONAL Group */}
          <div className="mt-5">
            <span className="text-xs font-semibold text-slate-400 px-3 tracking-normal">
              Clipper Workspace
            </span>
            <div className="mt-2.5 space-y-1.5">
              {personalNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 font-bold"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-brand-cyan stroke-[2.2]" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${isActive ? "bg-brand-cyan text-slate-950" : "bg-slate-800 text-slate-300"}`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Resources & Support Group to balance sidebar vertical rhythm */}
          <div className="mt-6 pt-5 border-t border-slate-800/60">
            <span className="text-xs font-semibold text-slate-400 px-3 tracking-normal">
              Help & Resources
            </span>
            <div className="mt-2.5 space-y-1.5">
              <Link
                href="/clipper/guidelines"
                prefetch={true}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  pathname === "/clipper/guidelines"
                    ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent"
                }`}
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>Clipping Rules</span>
              </Link>
              <a
                href="https://discord.gg/fWDVEt9GVB"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent transition-all"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Discord Community</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar Footer with User Info */}
        <div className="p-5 pb-6 border-t border-slate-800/80 bg-[#080C14] shrink-0 space-y-3.5">
          <div className="flex items-center gap-3">
            {user?.avatar_url && !avatarError ? (
              <img
                src={user.avatar_url}
                alt={user?.username || "Avatar"}
                onError={() => setAvatarError(true)}
                className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-800 shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-cyan text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                {userInitial}
              </div>
            )}

            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {user?.username || "Clipper"}
              </div>
              {user?.status === "SUSPENDED" ? (
                <span className="inline-block px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-[10px] font-bold text-red-400">
                  Suspended
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded-full bg-brand-cyan/15 border border-brand-cyan/30 text-xs font-semibold text-brand-cyan">
                  Clipper
                </span>
              )}
            </div>
          </div>

          {/* Action buttons with increased breathing room */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area with padding at bottom for floating elements */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-28 max-w-7xl mx-auto w-full">
        {user?.status === "SUSPENDED" && (
          <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-red-500/20 via-red-950/40 to-slate-900 border border-red-500/40 text-slate-100 shadow-2xl relative overflow-hidden animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 shrink-0 border border-red-500/30">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-black text-white tracking-tight">Account Suspended</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/40 uppercase tracking-wider">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Your Clipper account has been suspended by management. Submitting new clips, joining campaigns, and requesting payouts are disabled.
                  </p>
                  <div className="mt-3 p-3.5 rounded-xl bg-[#070A0F]/90 border border-red-500/30">
                    <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block mb-1">
                      Reason for Suspension:
                    </span>
                    <p className="text-sm font-semibold text-white">
                      &ldquo;{user.suspension_reason || "Account suspended due to policy or verification review."}&rdquo;
                    </p>
                    {user.suspended_at && (
                      <span className="text-[10px] text-slate-400 block mt-1.5">
                        Suspended on: {new Date(user.suspended_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex sm:flex-col gap-2.5 w-full md:w-auto">
                <a
                  href="https://discord.gg/fWDVEt9GVB"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/25"
                >
                  <span>Appeal on Discord</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
        {children}
      </main>

      {/* Floating "Need help?" Button in Brand Cyan cleanly docked bottom-right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setHelpOpen(true)}
          aria-label="Open help and support dialog"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-cyan hover:bg-[#1cf7fd] text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <MessageCircle className="w-4 h-4 fill-slate-950" />
          <span>Need help?</span>
        </button>
      </div>

      {/* Help Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D131D] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ClipEarn Support</h3>
                  <p className="text-xs text-slate-400">Get assistance from managers &amp; community</p>
                </div>
              </div>
              <button
                onClick={() => setHelpOpen(false)}
                aria-label="Close help dialog"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <a
                href="https://discord.gg/fWDVEt9GVB"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-cyan/40 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block group-hover:text-brand-cyan">
                      Join Clipper Discord
                    </span>
                    <span className="text-xs text-slate-400">
                      Live 24/7 staff support &amp; clipping tips
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </a>

              <Link
                href="/clipper/guidelines"
                onClick={() => setHelpOpen(false)}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-cyan/40 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block group-hover:text-brand-cyan">
                      Clipping Guidelines &amp; Rules
                    </span>
                    <span className="text-xs text-slate-400">
                      Pacing, hashtags, and view eligibility
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </Link>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors"
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
