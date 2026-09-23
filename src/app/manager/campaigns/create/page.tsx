"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function CreateCampaignPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [cpm, setCpm] = useState("1.00");
  const [totalBudget, setTotalBudget] = useState("10000");
  const [minViews, setMinViews] = useState("100000");
  const [maxViewsPerClip, setMaxViewsPerClip] = useState("");
  const [eligibilityMode, setEligibilityMode] = useState("FROM_SUBMISSION");

  const [allowedPlatforms, setAllowedPlatforms] = useState<string[]>([
    "TIKTOK",
    "INSTAGRAM",
    "YOUTUBE",
  ]);

  const [requirements, setRequirements] = useState<string[]>([
    "Minimum 30 seconds length in 9:16 vertical format (1080x1920)",
    "Include campaign official hashtags in caption",
    "Dynamic captions with clear audio",
  ]);
  const [newReq, setNewReq] = useState("");

  const [prohibited, setProhibited] = useState<string[]>([
    "No hate speech or discriminatory content",
    "No stolen video without meaningful transformative editing",
  ]);
  const [newPro, setNewPro] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const togglePlatform = (p: string) => {
    setAllowedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const addRequirement = () => {
    if (!newReq.trim()) return;
    setRequirements((prev) => [...prev, newReq.trim()]);
    setNewReq("");
  };

  const removeRequirement = (idx: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== idx));
  };

  const addProhibited = () => {
    if (!newPro.trim()) return;
    setProhibited((prev) => [...prev, newPro.trim()]);
    setNewPro("");
  };

  const removeProhibited = (idx: number) => {
    setProhibited((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (allowedPlatforms.length === 0) {
      setError("Please select at least one allowed platform.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand_name: name.trim(),
          description: name.trim(),
          image_url: imageUrl.trim() || null,
          cpm: parseFloat(cpm),
          total_budget: parseFloat(totalBudget),
          minimum_views_for_payout: parseInt(minViews, 10),
          maximum_views_per_clip: maxViewsPerClip ? parseInt(maxViewsPerClip, 10) : null,
          allowed_platforms: allowedPlatforms,
          requirements,
          prohibited_content: prohibited,
          view_eligibility_mode: eligibilityMode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/manager/campaigns");
      } else {
        setError(data.error || "Failed to create campaign");
        setLoading(false);
      }
    } catch {
      setError("Network error creating campaign");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <Link
        href="/manager/campaigns"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Campaigns</span>
      </Link>

      <div className="pb-4 border-b border-slate-800/80">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <Compass className="w-7 h-7 text-brand-cyan" />
          Create New Clipping Campaign
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Deploy a sponsored budget pool, establish creator requirements, and configure CPM view limits.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 text-xs">
        {/* Basic Info */}
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white mb-2">Campaign Overview</h2>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Campaign Title</label>
            <input
              type="text"
              required
              placeholder="Campaign title..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Campaign Brand Logo / Creative Image"
            description="Upload a high-resolution logo or banner from your local computer, or paste an external URL."
          />
        </div>

        {/* Financials & Payout Parameters */}
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brand-cyan" />
            Financial & View Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                CPM Rate (USD / 1,000 views)
              </label>
              <input
                type="number"
                step="0.10"
                min="0.10"
                required
                value={cpm}
                onChange={(e) => setCpm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Total Budget Pool (USD)
              </label>
              <input
                type="number"
                step="100"
                min="100"
                required
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Minimum Views For Payout
              </label>
              <input
                type="number"
                step="1000"
                min="1000"
                required
                value={minViews}
                onChange={(e) => setMinViews(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Max Payable Views Per Clip (Optional Cap)
              </label>
              <input
                type="number"
                placeholder="Unlimited if empty"
                value={maxViewsPerClip}
                onChange={(e) => setMaxViewsPerClip(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                View Eligibility Mode
              </label>
              <select
                value={eligibilityMode}
                onChange={(e) => setEligibilityMode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-cyan"
              >
                <option value="FROM_SUBMISSION">FROM_SUBMISSION (accrued post-submission)</option>
                <option value="FROM_APPROVAL">FROM_APPROVAL (accrued post-manager review)</option>
                <option value="LIFETIME">LIFETIME (entire view count)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Platforms Selection */}
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white mb-2">Permitted Social Platforms</h2>
          <div className="flex gap-4">
            {["TIKTOK", "INSTAGRAM", "YOUTUBE"].map((plat) => {
              const isChecked = allowedPlatforms.includes(plat);
              return (
                <button
                  type="button"
                  key={plat}
                  onClick={() => togglePlatform(plat)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                    isChecked
                      ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {plat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Requirements Builder */}
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-brand-emerald" />
            Configurable Clip Requirements
          </h2>

          <div className="space-y-2">
            {requirements.map((req, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
              >
                <span>&bull; {req}</span>
                <button
                  type="button"
                  onClick={() => removeRequirement(idx)}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add requirement (e.g. Include official hashtag in caption)"
              value={newReq}
              onChange={(e) => setNewReq(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRequirement();
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-brand-cyan"
            />
            <button
              type="button"
              onClick={addRequirement}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Prohibited Content Builder */}
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Prohibited Content Rules
          </h2>

          <div className="space-y-2">
            {prohibited.map((pro, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
              >
                <span>&bull; {pro}</span>
                <button
                  type="button"
                  onClick={() => removeProhibited(idx)}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add prohibited rule (e.g. No vulgar language)"
              value={newPro}
              onChange={(e) => setNewPro(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addProhibited();
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-brand-cyan"
            />
            <button
              type="button"
              onClick={addProhibited}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
          <Link
            href="/manager/campaigns"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-black font-black flex items-center gap-2 hover:opacity-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : null}
            <span>Publish Campaign</span>
          </button>
        </div>
      </form>
    </div>
  );
}
