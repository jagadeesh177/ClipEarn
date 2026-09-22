"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  LayoutDashboard,
  Compass,
  Video,
  Bell,
  UserCheck,
  DollarSign,
  Share2,
  BookOpen,
  Trophy,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
} from "lucide-react";

export default function ClipperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) router.push("/login");
        return res.json();
      })
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
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
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const personalNav = [
    { label: "Dashboard", href: "/clipper/dashboard", icon: LayoutDashboard },
    { label: "Browse Campaigns", href: "/clipper/campaigns", icon: Compass },
    { label: "My Submissions", href: "/clipper/submissions", icon: Video },
    { label: "Notifications", href: "/clipper/notifications", icon: Bell, badge: unreadNotifications },
    { label: "Profile & Accounts", href: "/clipper/profile", icon: UserCheck },
    { label: "Earnings", href: "/clipper/earnings", icon: DollarSign },
    { label: "Referrals", href: "/clipper/referrals", icon: Share2 },
  ];

  const communityNav = [
    { label: "Guidelines", href: "/clipper/guidelines", icon: BookOpen },
    { label: "Leaderboard", href: "/clipper/leaderboard", icon: Trophy },
    { label: "ClipEarn Chat", href: "/clipper/chat", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0A0F1D] border-b border-slate-800 sticky top-0 z-40">
        <ClipEarnLogo size="sm" href="/clipper/dashboard" />
        <div className="flex items-center gap-3">
          <Link
            href="/clipper/notifications"
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

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-[#0A0F1D] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 overflow-y-auto">
          <div className="pb-6 border-b border-slate-800/80">
            <ClipEarnLogo size="md" href="/clipper/dashboard" />
          </div>

          {/* Personal Group */}
          <div className="mt-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
              Personal
            </span>
            <div className="mt-2 space-y-1">
              {personalNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 shadow-[0_0_15px_-3px_rgba(0,242,254,0.15)]"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-brand-cyan" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-brand-cyan text-black font-bold text-[10px]">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Community Group */}
          <div className="mt-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
              Community
            </span>
            <div className="mt-2 space-y-1">
              {communityNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/80"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-brand-cyan" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-[#080C17]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  user?.avatar_url ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || "clipper"}`
                }
                alt="Avatar"
                className="w-9 h-9 rounded-xl border border-slate-700 bg-slate-800 object-cover"
              />
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate max-w-[100px]">
                  {user?.username || "Loading..."}
                </div>
                <span className="inline-block px-1.5 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/30 text-[9px] font-bold text-brand-cyan uppercase tracking-wider">
                  Clipper
                </span>
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
        {children}
      </main>
    </div>
  );
}
