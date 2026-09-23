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
  Moon,
  Sun,
} from "lucide-react";
import { clientCache } from "@/lib/clientCache";

export default function ClipperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(() => clientCache.get("clipper_user_me"));
  const [unreadNotifications, setUnreadNotifications] = useState<number>(() => clientCache.get("clipper_unread_count") || 0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Read theme preference
    const savedTheme = (localStorage.getItem("clipearn_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }

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
  }, [router]);

  const toggleTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    localStorage.setItem("clipearn_theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  };

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
          {/* Black / White Toggle for Mobile */}
          <button
            type="button"
            onClick={() => toggleTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title={`Switch to ${theme === "dark" ? "White" : "Black"} mode`}
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-brand-cyan" />}
          </button>

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
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3">
              CLIPPER WORKSPACE
            </span>
            <div className="mt-2 space-y-1">
              {personalNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href === "/clipper/campaigns" && pathname.startsWith("/clipper/campaigns"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-brand-cyan text-slate-950 font-bold shadow-md shadow-cyan-500/25"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-slate-950 stroke-[2.2]" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${isActive ? "bg-slate-950 text-brand-cyan" : "bg-brand-cyan text-black"}`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer with Theme Toggle and User Info */}
        <div className="p-4 border-t border-slate-800/80 bg-[#080C14] shrink-0">
          {/* Theme Toggle: Black & White */}
          <div className="p-2 mb-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Theme
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-950/80 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => toggleTheme("dark")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  theme === "dark"
                    ? "bg-slate-800 text-brand-cyan shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>Black</span>
              </button>
              <button
                type="button"
                onClick={() => toggleTheme("light")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  theme === "light"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>White</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Circular initial avatar in bright cyan circle */}
            <div className="w-10 h-10 rounded-full bg-brand-cyan text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
              {userInitial}
            </div>

            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {user?.username || "Anya"}
              </div>
              <span className="inline-block px-1.5 py-0.2 rounded bg-brand-cyan/15 border border-brand-cyan/30 text-[9px] font-bold text-brand-cyan uppercase tracking-wider">
                CLIPPER
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Floating Top-Right Theme Toggle for Desktop */}
      <div className="fixed top-5 right-6 z-40 hidden md:flex items-center gap-1.5 p-1 bg-[#0F141F]/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl">
        <button
          type="button"
          onClick={() => toggleTheme("dark")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            theme === "dark"
              ? "bg-slate-800 text-brand-cyan shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
          title="Switch to Black mode"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Black</span>
        </button>
        <button
          type="button"
          onClick={() => toggleTheme("light")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            theme === "light"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
          title="Switch to White mode"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>White</span>
        </button>
      </div>

      {/* Main Content Area with padding at bottom for floating elements */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-28 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Floating "Need help?" Button in Brand Cyan */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setHelpOpen(true)}
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
                  <p className="text-xs text-slate-400">Get assistance from managers & community</p>
                </div>
              </div>
              <button
                onClick={() => setHelpOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
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
                    <span className="text-[11px] text-slate-400">
                      Live 24/7 staff support & clipping tips
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
                      Clipping Guidelines & Rules
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Pacing, hashtags, and view eligibility
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </Link>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 text-center">
              <button
                onClick={() => setHelpOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
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
