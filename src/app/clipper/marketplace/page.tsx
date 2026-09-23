"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  Sparkles,
  Scissors,
  Music,
  Download,
  ExternalLink,
  Flame,
  CheckCircle,
  Star,
} from "lucide-react";

export default function ClipperMarketplacePage() {
  const categories = [
    { id: "all", name: "All Assets" },
    { id: "hooks", name: "Viral Hook Packs" },
    { id: "templates", name: "CapCut & Premiere" },
    { id: "sounds", name: "Trending Sounds" },
    { id: "guides", name: "Clipping Masterclasses" },
  ];

  const items = [
    {
      id: "1",
      title: "Viral Retention Hooks & Subtitle Presets (CapCut)",
      category: "CapCut & Premiere",
      badge: "HOT",
      rating: "4.9",
      downloads: "12.4K",
      author: "ClipEarn Studio",
      description: "Auto-caption animations, sound effects, and 1-second retention zooms used by top 1% clippers.",
      free: true,
      fileSize: "48 MB",
    },
    {
      id: "2",
      title: "Top 100 Royalty-Free Streamer Background Soundtracks",
      category: "Trending Sounds",
      badge: "POPULAR",
      rating: "4.8",
      downloads: "8.9K",
      author: "AudioVault",
      description: "High-energy, lo-fi, and suspense background audio optimized for TikTok and YouTube Shorts algorithms.",
      free: true,
      fileSize: "185 MB",
    },
    {
      id: "3",
      title: "The 10M Views Clipping Blueprint (2026 Edition)",
      category: "Clipping Masterclasses",
      badge: "FEATURED",
      rating: "5.0",
      downloads: "15.2K",
      author: "Alex Morgan (Top Clipper)",
      description: "Step-by-step breakdown on identifying podcast punchlines, pacing edits, and avoiding algorithm shadowbans.",
      free: true,
      fileSize: "PDF Guide",
    },
    {
      id: "4",
      title: "Dynamic 4K Zoom In/Out & Split Screen Template",
      category: "CapCut & Premiere",
      badge: "NEW",
      rating: "4.7",
      downloads: "6.1K",
      author: "MotionFX",
      description: "Pre-built vertical canvas with dual webcam + gameplay split layouts for gaming & IRL streamer clips.",
      free: true,
      fileSize: "72 MB",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-brand-cyan" />
            ClipEarn Marketplace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Free clipper resources, viral CapCut presets, trending audio packs, and clipping masterclasses.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan text-xs font-bold">
          <Sparkles className="w-4 h-4" />
          <span>All Resources Free for Verified Clippers</span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c, i) => (
          <button
            key={c.id}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              i === 0
                ? "bg-brand-cyan text-slate-950 shadow-md shadow-cyan-500/25"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-[#0D131D] border border-slate-800/80 p-5 hover:border-slate-700 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 uppercase tracking-wider">
                    {item.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{item.category}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{item.rating}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-white mt-2.5 group-hover:text-brand-cyan transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">{item.downloads}</span> downloads •{" "}
                <span className="text-slate-500">{item.fileSize}</span>
              </div>

              <button
                onClick={() => alert(`Download initiated: ${item.title}`)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-brand-cyan hover:text-slate-950 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get Free</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
