"use client";

import React from "react";
import { RefreshCw, Shield, Sparkles } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  scopeBadge: string;
  badgeVariant?: "admin" | "manager";
  description: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  actions?: React.ReactNode;
}

export function DashboardHeader({
  title,
  scopeBadge,
  badgeVariant = "admin",
  description,
  onRefresh,
  isRefreshing,
  actions,
}: DashboardHeaderProps) {
  const badgeClasses =
    badgeVariant === "admin"
      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
      : "bg-purple-500/20 text-purple-400 border-purple-500/30";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/80">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 ${badgeClasses}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                badgeVariant === "admin" ? "bg-amber-400" : "bg-purple-400"
              }`}
            />
            {scopeBadge}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">{description}</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition text-xs font-bold flex items-center gap-2 disabled:opacity-50"
          title="Refresh dashboard metrics"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              isRefreshing
                ? "animate-spin " + (badgeVariant === "admin" ? "text-amber-400" : "text-purple-400")
                : ""
            }`}
          />
          <span>Refresh</span>
        </button>

        {actions}
      </div>
    </div>
  );
}
