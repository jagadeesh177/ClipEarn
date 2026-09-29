"use client";

import React from "react";
import Link from "next/link";
import {
  PlusCircle,
  Compass,
  FileCheck,
  CreditCard,
  Users,
  Trophy,
  Key,
  Shield,
  ArrowRight,
} from "lucide-react";

interface ActionCenterProps {
  portalType: "admin" | "manager";
  pendingSubmissionsCount?: number;
}

export function ActionCenter({
  portalType,
  pendingSubmissionsCount = 0,
}: ActionCenterProps) {
  if (portalType === "admin") {
    const adminActions = [
      {
        title: "Create Campaign",
        desc: "Deploy new budget pool & CPM terms",
        href: "/admin/campaigns/create",
        icon: PlusCircle,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40",
      },
      {
        title: "Manage Campaigns",
        desc: "Edit, pause, or view campaign details",
        href: "/admin/campaigns",
        icon: Compass,
        color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40",
      },
      {
        title: "Review Submissions",
        desc: `${pendingSubmissionsCount} submissions in queue`,
        href: "/admin/submissions",
        icon: FileCheck,
        badge: pendingSubmissionsCount > 0 ? `${pendingSubmissionsCount} Pending` : undefined,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40",
      },
      {
        title: "Manage Payouts",
        desc: "Execute 2-step financial settlements",
        href: "/admin/payouts",
        icon: CreditCard,
        color: "text-brand-emerald bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40",
      },
      {
        title: "Manage Campaign Managers",
        desc: "Issue access keys & manage accounts",
        href: "/admin/managers",
        icon: Users,
        color: "text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40",
      },
      {
        title: "System Audit Logs",
        desc: "Inspect compliance ledger records",
        href: "/admin/audit-logs",
        icon: Shield,
        color: "text-slate-300 bg-slate-800/40 border-slate-700/40 hover:border-slate-600/40",
      },
    ];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Action Center</span>
          </h2>
          <span className="text-[11px] text-slate-500">Platform Operations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {adminActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between group bg-[#0D131D] ${action.color}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                      {action.title}
                    </span>
                    {action.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{action.desc}</p>
                </div>
                <Icon className="w-5 h-5 shrink-0 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Manager Actions: Review Submissions, My Campaigns, Campaign Leaderboard, Redeem Access Code
  const managerActions = [
    {
      title: "Review Submissions",
      desc: `${pendingSubmissionsCount} pending clips awaiting review`,
      href: "/manager/submissions",
      icon: FileCheck,
      badge: pendingSubmissionsCount > 0 ? `${pendingSubmissionsCount} Pending` : undefined,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40",
    },
    {
      title: "My Assigned Campaigns",
      desc: "Manage active campaigns and inspect metrics",
      href: "/manager/campaigns",
      icon: Compass,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40",
    },
    {
      title: "Campaign Leaderboard",
      desc: "Rankings derived from approved submissions",
      href: "/manager/leaderboard",
      icon: Trophy,
      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40",
    },
    {
      title: "Redeem Access Code",
      desc: "Enter a code to unlock additional campaigns",
      href: "/manager/redeem",
      icon: Key,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <FileCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Campaign Manager Action Center</span>
        </h2>
        <span className="text-[11px] text-slate-500">Operational Actions</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {managerActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between group bg-[#0D131D] ${action.color}`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">
                    {action.title}
                  </span>
                  {action.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {action.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{action.desc}</p>
              </div>
              <Icon className="w-5 h-5 shrink-0 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
