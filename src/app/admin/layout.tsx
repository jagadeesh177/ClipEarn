"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  ShieldAlert,
  Shield,
  LayoutDashboard,
  Compass,
  Users,
  LogOut,
  Loader2,
  Lock,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          if (!isLoginPage) {
            router.push("/admin/login");
          }
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.authenticated && data.user?.role === "ADMIN") {
          setUser(data.user);
          setAccessDenied(false);
          if (isLoginPage) {
            router.push("/admin/dashboard");
          }
        } else if (!isLoginPage) {
          if (data.authenticated) {
            setAccessDenied(true);
          } else {
            router.push("/admin/login");
          }
        }
      })
      .catch(() => {
        if (!isLoginPage) router.push("/admin/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A0F] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Verifying Administrator Permissions...</span>
        </div>
      </div>
    );
  }

  // Access Denied screen for non-admin logged-in users manually visiting /admin/dashboard
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-[#0F141F] border border-red-900/40 p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-400">
            You are logged in, but your account does not have Administrator privileges. Access to the Admin Portal is strictly restricted.
          </p>
          <div className="pt-4 flex flex-col gap-2.5">
            <Link
              href="/admin/login"
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all"
            >
              Sign In as Administrator
            </Link>
            <Link
              href="/manager/dashboard"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all"
            >
              Go to Manager Portal
            </Link>
            <Link
              href="/clipper/dashboard"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-brand-cyan font-semibold text-xs transition-all"
            >
              Go to Clipper Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col">
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#0A0D14]/90 backdrop-blur-md border-b border-red-900/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ClipEarnLogo size="sm" href="/admin/dashboard" />
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-800/40 text-[11px] font-bold text-red-400">
            <Shield className="w-3 h-3" />
            <span>ADMIN PORTAL</span>
          </div>
        </div>

        {/* Quick Portal Switcher */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/admin/dashboard"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              pathname === "/admin/dashboard"
                ? "bg-red-600/20 text-red-400 border border-red-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Admin Dashboard
          </Link>
          <Link
            href="/manager/dashboard"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-400 hover:bg-purple-950/30 border border-transparent hover:border-purple-800/30 transition-all flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Manager Portal</span>
          </Link>
          <Link
            href="/clipper/dashboard"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-cyan hover:bg-cyan-950/30 border border-transparent hover:border-cyan-800/30 transition-all flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clipper Portal</span>
          </Link>
        </div>

        {/* User Pill & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-white">{user?.username}</span>
            <span className="text-[10px] text-red-400">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out of Admin Portal"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-red-950/40 hover:border-red-800/40 text-slate-400 hover:text-red-400 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
