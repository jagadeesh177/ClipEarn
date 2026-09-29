"use client";

import React from "react";
import { Eye, Heart, MessageSquare, Share2, Bookmark, ShieldCheck } from "lucide-react";

interface MetricCardsProps {
  approvedViews: number;
  approvedLikes: number;
  approvedComments: number;
  approvedShares: number;
  approvedSaves: number;
  variant?: "admin" | "manager";
  scopeLabel?: string;
}

export function MetricCards({
  approvedViews = 0,
  approvedLikes = 0,
  approvedComments = 0,
  approvedShares = 0,
  approvedSaves = 0,
  variant = "admin",
  scopeLabel = "Approved Submissions Only",
}: MetricCardsProps) {
  const accentColor = variant === "admin" ? "text-amber-400" : "text-purple-400";
  const viewsBorder = variant === "admin" ? "border-amber-500/30" : "border-purple-500/30";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <ShieldCheck className={`w-3.5 h-3.5 ${accentColor}`} />
          <span>Approved Social Reach ({scopeLabel})</span>
        </h2>
        <span className="text-[11px] text-slate-500">Live verified engagement</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Approved Views */}
        <div className={`p-5 rounded-2xl bg-[#0D131D] ${viewsBorder} border relative overflow-hidden space-y-1 shadow-sm`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Approved Views</span>
            <Eye className={`w-4 h-4 ${accentColor}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {Number(approvedViews || 0).toLocaleString()}
          </div>
          <p className={`text-[10px] ${accentColor} font-medium`}>
            {variant === "admin" ? "Verified platform views" : "Your assigned campaigns"}
          </p>
        </div>

        {/* Approved Likes */}
        <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Approved Likes</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {Number(approvedLikes || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500">Across approved clips</p>
        </div>

        {/* Approved Comments */}
        <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Approved Comments</span>
            <MessageSquare className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {Number(approvedComments || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500">Across approved clips</p>
        </div>

        {/* Approved Shares */}
        <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Approved Shares</span>
            <Share2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {Number(approvedShares || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500">Across approved clips</p>
        </div>

        {/* Approved Saves */}
        <div className="p-5 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Approved Saves</span>
            <Bookmark className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {Number(approvedSaves || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500">Across approved clips</p>
        </div>
      </div>
    </div>
  );
}
