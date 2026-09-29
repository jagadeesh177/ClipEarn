"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  X,
  Plus,
  ShieldCheck,
} from "lucide-react";

export default function AdminCreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields matching Campaign Prisma model
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [cpm, setCpm] = useState("1.50");
  const [totalBudget, setTotalBudget] = useState("15000");
  const [minimumViewsForPayout, setMinimumViewsForPayout] = useState("50000");
  const [maximumViewsPerClip, setMaximumViewsPerClip] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["INSTAGRAM", "TIKTOK", "YOUTUBE"]);
  const [eligibilityMode, setEligibilityMode] = useState("FROM_SUBMISSION");

  // Dynamic Rule Lists
  const [requirements, setRequirements] = useState<string[]>([
    "Must tag brand in video caption",
    "Must feature product in first 3 seconds",
  ]);
  const [newRequirement, setNewRequirement] = useState("");

  const [prohibitedContent, setProhibitedContent] = useState<string[]>([
    "No hate speech or harassment",
    "No misleading promotional claims",
  ]);
  const [newProhibited, setNewProhibited] = useState("");

  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      if (platforms.length === 1) return; // Keep at least one platform
      setPlatforms(platforms.filter((x) => x !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const handleRemoveRequirement = (idx: number) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  const handleAddProhibited = () => {
    if (newProhibited.trim()) {
      setProhibitedContent([...prohibitedContent, newProhibited.trim()]);
      setNewProhibited("");
    }
  };

  const handleRemoveProhibited = (idx: number) => {
    setProhibitedContent(prohibitedContent.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cpmNum = parseFloat(cpm);
    const budgetNum = parseFloat(totalBudget);
    const minViewsNum = parseInt(minimumViewsForPayout, 10);
    const maxViewsNum = maximumViewsPerClip ? parseInt(maximumViewsPerClip, 10) : null;

    if (!name.trim()) {
      setErrorMessage("Campaign name is required.");
      return;
    }
    if (isNaN(cpmNum) || cpmNum <= 0) {
      setErrorMessage("Please enter a valid CPM rate greater than $0.");
      return;
    }
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setErrorMessage("Please enter a valid total budget greater than $0.");
      return;
    }
    if (platforms.length === 0) {
      setErrorMessage("At least one platform must be allowed.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand_name: brandName.trim() || name.trim(),
          description: description.trim(),
          image_url: imageUrl.trim() || null,
          cpm: cpmNum,
          total_budget: budgetNum,
          minimum_views_for_payout: isNaN(minViewsNum) ? 0 : minViewsNum,
          maximum_views_per_clip: maxViewsNum,
          allowed_platforms: platforms,
          requirements,
          prohibited_content: prohibitedContent,
          view_eligibility_mode: eligibilityMode,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create campaign.");
      }

      router.push(`/admin/campaigns/${json.campaign.id}`);
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/campaigns"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Create New Campaign</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure campaign budget, CPM rate, platform guidelines, and payout parameters.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details */}
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
            1. Campaign Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Campaign Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Energy Drink Launch"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Brand / Sponsor Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Apex Nutrition Co."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Campaign Description & Guidelines
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="High-energy gym, gaming, and lifestyle clips featuring Apex Energy drink..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Banner / Cover Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
        </div>

        {/* Financial & View Configuration */}
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
            2. Budget, Rate & View Milestones
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                CPM Rate ($) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.10"
                  required
                  value={cpm}
                  onChange={(e) => setCpm(e.target.value)}
                  placeholder="1.50"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400 transition"
                />
              </div>
              <p className="text-[10px] text-slate-500">Earnings per 1,000 approved views</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Total Budget ($) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="100"
                  min="100"
                  required
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="15000"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400 transition"
                />
              </div>
              <p className="text-[10px] text-slate-500">Max budget pool across all clippers</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Min. Views for Payout
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                value={minimumViewsForPayout}
                onChange={(e) => setMinimumViewsForPayout(e.target.value)}
                placeholder="50000"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-400 transition"
              />
              <p className="text-[10px] text-slate-500">Clipper must reach before payout</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Max Views per Clip (Cap)
              </label>
              <input
                type="number"
                step="5000"
                min="0"
                value={maximumViewsPerClip}
                onChange={(e) => setMaximumViewsPerClip(e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-400 transition"
              />
              <p className="text-[10px] text-slate-500">Earnings cap (views continue tracking)</p>
            </div>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
            3. Allowed Social Platforms
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "INSTAGRAM", name: "Instagram Reels", desc: "Shorts & Reels submissions" },
              { id: "TIKTOK", name: "TikTok Videos", desc: "TikTok video posts" },
              { id: "YOUTUBE", name: "YouTube Shorts", desc: "YouTube Shorts clips" },
            ].map((p) => {
              const selected = platforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`p-4 rounded-xl border text-left transition ${
                    selected
                      ? "bg-amber-500/10 border-amber-500/50 text-white"
                      : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                        selected
                          ? "bg-amber-400 text-slate-950 border-amber-400 font-bold"
                          : "border-slate-700"
                      }`}
                    >
                      {selected && "✓"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Requirements & Prohibited Content */}
        <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
            4. Rules & Mandatory Guidelines
          </h2>

          {/* Requirements */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Content Requirements
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRequirement();
                  }
                }}
                placeholder="Add a required condition (e.g. Must include #ApexEnergy)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddRequirement}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {requirements.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
                >
                  <span>• {req}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Prohibited Content */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300">
              Prohibited Content
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProhibited}
                onChange={(e) => setNewProhibited(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddProhibited();
                  }
                }}
                placeholder="Add prohibited item (e.g. No bots or artificial views)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddProhibited}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {prohibitedContent.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
                >
                  <span className="text-rose-300/90">• {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProhibited(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/campaigns"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-400/10 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating Campaign...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" /> Launch Campaign
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
