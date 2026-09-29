"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  ArrowRight,
  ChevronDown,
  Building2,
  CheckCircle2,
  Share2,
  Target,
  RefreshCw,
  Video,
  ShieldCheck,
  Search,
  Eye,
  Sliders,
  Sparkles,
  BarChart3,
  Menu,
  X,
  Compass,
  FileCheck2,
  Lock,
  Layers,
  Zap,
} from "lucide-react";

export interface HomepageCampaign {
  id: string;
  name: string;
  brand_name: string;
  image_url: string | null;
  cpm: number;
  total_budget: number;
  used_budget: number;
  total_approved_views: number;
  max_payable_views: number;
  allowed_platforms: string[];
  status: string;
}

interface LandingViewProps {
  campaigns: HomepageCampaign[];
}

const PLATFORM_PRIORITY: Record<string, number> = {
  TikTok: 1,
  Instagram: 2,
  YouTube: 3,
};

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
};

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    const val = (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "");
    return `${val}B`;
  }
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${val}M`;
  }
  if (num >= 1_000) {
    const val = (num / 1_000).toFixed(1).replace(/\.0$/, "");
    return `${val}K`;
  }
  return num.toLocaleString();
}

export default function LandingView({ campaigns }: LandingViewProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [modalSubmitted, setModalSubmitted] = useState(false);

  // 4 Core Capabilities (Section 6)
  const capabilities = [
    {
      num: "01",
      title: "PERFORMANCE-BASED",
      desc: "Campaigns built around measurable performance.",
      icon: Target,
    },
    {
      num: "02",
      title: "MULTI-PLATFORM",
      desc: "Distribute content across TikTok, Instagram and YouTube.",
      icon: Share2,
    },
    {
      num: "03",
      title: "VERIFIED METRICS",
      desc: "Track performance using platform data.",
      icon: CheckCircle2,
    },
    {
      num: "04",
      title: "AUTOMATED TRACKING",
      desc: "Keep campaign metrics synchronized automatically.",
      icon: RefreshCw,
    },
  ];

  // 4 Steps (Section 7)
  const steps = [
    {
      num: "01",
      title: "Launch",
      desc: "Brands set budgets, CPM rates, editorial guidelines, and campaign goals.",
    },
    {
      num: "02",
      title: "Create",
      desc: "Distributed clippers turn content into engaging clips published across platforms.",
    },
    {
      num: "03",
      title: "Track",
      desc: "Submissions enter automated sync to verify real views via direct platform APIs.",
    },
    {
      num: "04",
      title: "Earn",
      desc: "Verified performance converts to clear, transparent clipper payouts.",
    },
  ];

  // Brand Pillars (Section 9)
  const brandPillars = [
    {
      tag: "DISTRIBUTION",
      title: "Reach Distributed Audiences",
      desc: "Reach audiences through a distributed network of short-form clippers specializing in hooks, edits, and viral formats.",
      icon: Share2,
    },
    {
      tag: "PERFORMANCE",
      title: "Verified Analytics",
      desc: "Measure campaign performance using verified platform metrics pulled directly from social endpoints.",
      icon: BarChart3,
    },
    {
      tag: "SCALE",
      title: "Controlled Expansion",
      desc: "Expand campaigns based on measurable results with predictable CPM costs and view caps.",
      icon: Sliders,
    },
  ];

  // Clipper Workflow (Section 10)
  const clipperWorkflow = [
    { step: "01", title: "Find Campaign", desc: "Discover active campaigns with high CPM rates and brand assets." },
    { step: "02", title: "Create Clip", desc: "Edit compelling short-form videos aligned with campaign guidelines." },
    { step: "03", title: "Submit", desc: "Submit published clip URLs with your verified social handles." },
    { step: "04", title: "Get Verified", desc: "Automated engine checks guidelines and establishes live sync." },
    { step: "05", title: "Earn", desc: "Accrue auditable earnings per 1,000 verified platform views." },
  ];

  // Performance Engine Pipeline (Section 11)
  const engineStages = [
    { step: "01", label: "CLIPPER", desc: "Authentic channel account" },
    { step: "02", label: "PUBLISHED CLIP", desc: "TikTok / IG / YouTube" },
    { step: "03", label: "SUBMISSION", desc: "URL & post ID captured" },
    { step: "04", label: "REVIEW", desc: "Guidelines validation" },
    { step: "05", label: "PLATFORM METRICS", desc: "Direct API snapshot" },
    { step: "06", label: "APPROVED VIEWS", desc: "Verified attention count" },
    { step: "07", label: "EARNINGS", desc: "Immutable ledger deposit" },
  ];

  // Trust Section (Section 12)
  const trustPoints = [
    {
      title: "VERIFIED METRICS",
      desc: "Platform-based performance tracking.",
      icon: CheckCircle2,
    },
    {
      title: "SUBMISSION REVIEW",
      desc: "Campaign managers review submitted content.",
      icon: FileCheck2,
    },
    {
      title: "FRAUD MONITORING",
      desc: "Suspicious activity can be identified and reviewed.",
      icon: ShieldCheck,
    },
    {
      title: "AUDITABLE EARNINGS",
      desc: "Campaign performance and earnings are traceable.",
      icon: Lock,
    },
  ];

  // FAQs (Section 21)
  const faqs = [
    {
      q: "What is ClipEarn?",
      a: "ClipEarn is a performance-based short-form content distribution platform connecting brands with video clippers. Brands launch campaigns with specified CPM rates and budgets, while clippers turn brand content into short-form videos and earn from verified view performance.",
    },
    {
      q: "How do clippers get paid?",
      a: "Clippers earn based on the campaign's CPM (cost per 1,000 views) and eligible verified views. Once your clip is approved and views are synchronized from the platform, your earnings are credited to your balance and can be withdrawn via your configured payout account.",
    },
    {
      q: "How are views verified?",
      a: "ClipEarn captures views directly from platform endpoints (TikTok, Instagram Reels, and YouTube Shorts). Our automated worker captures periodic snapshots to record real attention and eliminate self-reported numbers.",
    },
    {
      q: "Which platforms are supported?",
      a: "ClipEarn natively integrates with TikTok, Instagram Reels, and YouTube Shorts & Videos. Each campaign specifies which platforms are allowed.",
    },
    {
      q: "How do I verify my social account?",
      a: "When you link a social profile, ClipEarn generates a temporary unique verification code. You simply paste this code into your profile bio on that platform, click Verify, and our system confirms channel ownership instantly.",
    },
    {
      q: "Can brands launch custom campaigns?",
      a: "Yes. Brands work directly with ClipEarn to establish custom budgets, CPM rates, platform requirements, and editorial guidelines for distributed clipper campaigns.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#05080C] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#1CF7FD]/20 selection:text-[#1CF7FD]">
      {/* ================================================== */}
      {/* 1. NAVIGATION                                      */}
      {/* ================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#05080C]/85 border-b border-[#1B2A35] w-full transition-colors">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <ClipEarnLogo size="md" href="/" />
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#A7B4C2]"
          >
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#campaigns" className="hover:text-white transition-colors">
              Campaigns
            </a>
            <a href="#for-brands" className="hover:text-white transition-colors">
              For Brands
            </a>
            <a href="#for-clippers" className="hover:text-white transition-colors">
              For Clippers
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <Link
              href="/manager/login"
              className="text-xs sm:text-sm font-medium text-[#A7B4C2] hover:text-white px-4 py-2.5 rounded-[11px] bg-transparent hover:bg-[#0C131B] border border-[#1B2A35] hover:border-[#33424D] transition-all"
            >
              Manager Portal
            </Link>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-[#05080C] px-5 py-2.5 rounded-[11px] bg-[#1CF7FD] hover:bg-[#34f8fe] hover:shadow-[0_0_24px_rgba(28,247,253,0.22)] transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#1CF7FD] focus:ring-offset-2 focus:ring-offset-[#05080C]"
            >
              <span>Start Clipping</span>
              <ArrowRight className="w-4 h-4 text-[#05080C]" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl text-[#A7B4C2] hover:text-white hover:bg-[#0C131B] border border-[#1B2A35] transition focus:outline-none focus:ring-2 focus:ring-[#1CF7FD]"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#1B2A35] bg-[#080D13] px-4 sm:px-6 py-5 space-y-4">
            <nav className="flex flex-col gap-3 text-sm font-medium text-[#A7B4C2]">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition py-1"
              >
                How It Works
              </a>
              <a
                href="#campaigns"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition py-1"
              >
                Campaigns
              </a>
              <a
                href="#for-brands"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition py-1"
              >
                For Brands
              </a>
              <a
                href="#for-clippers"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition py-1"
              >
                For Clippers
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition py-1"
              >
                FAQ
              </a>
            </nav>
            <div className="pt-4 border-t border-[#1B2A35] flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-[11px] bg-[#1CF7FD] hover:bg-[#34f8fe] text-[#05080C] text-center font-bold text-sm transition"
              >
                Start Clipping
              </Link>
              <Link
                href="/manager/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-[11px] bg-[#0C131B] hover:bg-[#111C26] border border-[#1B2A35] text-[#F8FAFC] text-center font-medium text-sm transition"
              >
                Manager Portal
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ================================================== */}
        {/* 2. HERO SECTION (2 Columns on Desktop)              */}
        {/* ================================================== */}
        <section className="relative pt-16 pb-20 sm:pt-28 sm:pb-36 overflow-hidden border-b border-[#1B2A35]">
          {/* Very subtle radial cyan glow behind hero (rgba(28, 247, 253, 0.08)) */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[90vw] h-[500px] pointer-events-none rounded-full"
            style={{
              background: "radial-gradient(ellipse at center, rgba(28, 247, 253, 0.08) 0%, rgba(5, 8, 12, 0) 70%)",
            }}
          />

          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* Left Column: Hero Content */}
              <div className="lg:col-span-7 flex flex-col items-start text-left">
                {/* Small Eyebrow */}
                <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#0C131B] border border-[#1B2A35] text-[10px] sm:text-xs font-mono font-semibold text-[#1CF7FD] tracking-wider uppercase mb-6 sm:mb-8 max-w-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1CF7FD] animate-pulse shrink-0" />
                  <span className="truncate">PERFORMANCE-BASED CONTENT DISTRIBUTION</span>
                </div>

                {/* Headline */}
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.12] sm:leading-[1.08] break-words">
                  Turn Content Into{" "}
                  <span className="text-[#1CF7FD]">Massive Reach.</span>
                </h1>

                {/* Description */}
                <p className="mt-4 sm:mt-6 text-sm sm:text-lg lg:text-xl text-[#A7B4C2] leading-relaxed max-w-xl">
                  ClipEarn connects brands with a distributed network of short-form clippers who turn content into high-performing videos across TikTok, Instagram, and YouTube.
                </p>

                {/* Action Buttons */}
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 min-h-[48px] rounded-[11px] bg-[#1CF7FD] hover:bg-[#34f8fe] text-[#05080C] font-bold text-sm sm:text-base transition-all hover:shadow-[0_0_24px_rgba(28,247,253,0.18)] flex items-center justify-center gap-2 text-center"
                  >
                    <span>Start Clipping</span>
                    <ArrowRight className="w-4 h-4 text-[#05080C]" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setBrandModalOpen(true)}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 min-h-[48px] rounded-[11px] bg-transparent hover:bg-[#0C131B] border border-[#33424D] hover:border-[#1CF7FD] text-[#F8FAFC] hover:text-[#1CF7FD] font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Launch a Campaign</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Abstract Performance Engine Visual */}
              <div className="lg:col-span-5 w-full">
                <div className="rounded-[18px] bg-[#0C131B] border border-[#1B2A35] p-4 sm:p-7 shadow-2xl relative overflow-hidden">
                  {/* Visual Top Bar */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#1B2A35]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1CF7FD]/80" />
                      <span className="text-xs font-mono text-[#A7B4C2] tracking-wider uppercase">
                        DISTRIBUTION PIPELINE
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#1CF7FD] bg-[#1CF7FD]/10 px-2 py-0.5 rounded border border-[#1CF7FD]/20">
                      ACTIVE
                    </span>
                  </div>

                  {/* Flow Diagram */}
                  <div className="mt-6 space-y-3">
                    {/* Node 1: Brand Content */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-[#080D13] border border-[#1B2A35] flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#1CF7FD]/10 border border-[#1CF7FD]/20 flex items-center justify-center text-[#1CF7FD] shrink-0">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white uppercase tracking-wider truncate">BRAND CONTENT</div>
                          <div className="text-[11px] text-[#64748B] truncate">Source video & guidelines</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#1CF7FD] shrink-0 ml-2">INSPECTED</span>
                    </div>

                    {/* Connecting indicator */}
                    <div className="flex justify-center">
                      <div className="w-px h-3 sm:h-4 bg-[#1CF7FD]/40" />
                    </div>

                    {/* Node 2: ClipEarn Core Engine */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-[#080D13] border border-[#1CF7FD]/30 flex items-center justify-between relative shadow-[0_0_15px_rgba(28,247,253,0.06)]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#1CF7FD] flex items-center justify-center text-[#05080C] font-black text-xs shrink-0">
                          CE
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white uppercase tracking-wider truncate">CLIPEARN PLATFORM</div>
                          <div className="text-[11px] text-[#A7B4C2] truncate">Campaign allocation & ledger</div>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-[#1CF7FD] animate-ping shrink-0 ml-2" />
                    </div>

                    {/* Connecting indicator */}
                    <div className="flex justify-center">
                      <div className="w-px h-3 sm:h-4 bg-[#1CF7FD]/40" />
                    </div>

                    {/* Node 3: Clipper Distribution Channels */}
                    <div className="p-3 rounded-xl bg-[#080D13] border border-[#1B2A35]">
                      <div className="text-[10px] font-mono uppercase text-[#64748B] mb-2 tracking-wider">
                        CLIPPER DISTRIBUTION
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                        <div className="py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg bg-[#0C131B] border border-[#1B2A35] text-[10px] sm:text-[11px] font-medium text-slate-200 truncate">
                          TikTok
                        </div>
                        <div className="py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg bg-[#0C131B] border border-[#1B2A35] text-[10px] sm:text-[11px] font-medium text-slate-200 truncate">
                          Instagram
                        </div>
                        <div className="py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg bg-[#0C131B] border border-[#1B2A35] text-[10px] sm:text-[11px] font-medium text-slate-200 truncate">
                          YouTube
                        </div>
                      </div>
                    </div>

                    {/* Connecting indicator */}
                    <div className="flex justify-center">
                      <div className="w-px h-3 sm:h-4 bg-[#1CF7FD]/40" />
                    </div>

                    {/* Node 4: Verified Performance */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-[#080D13] border border-[#1CF7FD]/40 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#1CF7FD]/10 border border-[#1CF7FD]/20 flex items-center justify-center text-[#1CF7FD] shrink-0">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white uppercase tracking-wider truncate">VERIFIED PERFORMANCE</div>
                          <div className="text-[11px] text-[#A7B4C2] truncate">API snapshots & CPM settlement</div>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-[#1CF7FD] shrink-0 ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 3. CORE PLATFORM CAPABILITIES (Section 6)          */}
        {/* ================================================== */}
        <section className="py-16 sm:py-28 bg-[#080D13] border-b border-[#1B2A35]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {capabilities.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 sm:p-7 rounded-[18px] bg-[#0C131B] border border-[#1B2A35] hover:bg-[#111C26] hover:border-[#1CF7FD]/45 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-xs font-mono font-bold text-[#1CF7FD]">
                          {item.num}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#080D13] border border-[#1B2A35] flex items-center justify-center text-[#1CF7FD]">
                          <IconComponent className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-white tracking-wide">
                        {item.title}
                      </h3>
                      <p className="mt-2.5 text-sm text-[#A7B4C2] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 4. HOW IT WORKS (Section 7)                        */}
        {/* ================================================== */}
        <section id="how-it-works" className="py-16 sm:py-28 border-b border-[#1B2A35] scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10 sm:mb-16">
              <p className="text-xs font-mono font-semibold text-[#1CF7FD] uppercase tracking-wider">
                HOW IT WORKS
              </p>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                From Content to Performance.
              </h2>
              <p className="text-sm sm:text-lg text-[#A7B4C2] mt-3 sm:mt-4 leading-relaxed">
                A streamlined, 4-step pipeline that connects brand campaign goals to verified short-form clipper output.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-7 rounded-[18px] bg-[#0C131B] border border-[#1B2A35] hover:bg-[#111C26] hover:border-[#1CF7FD]/40 transition-all flex flex-col justify-between relative group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#1CF7FD]/10 border border-[#1CF7FD]/20 text-[#1CF7FD] font-mono font-bold text-sm flex items-center justify-center mb-6">
                      {st.num}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                      {st.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A7B4C2] leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 5. FEATURED CAMPAIGNS (Section 8)                  */}
        {/* ================================================== */}
        <section id="campaigns" className="py-16 sm:py-28 bg-[#080D13] border-b border-[#1B2A35] scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10 sm:mb-16">
              <p className="text-xs font-mono font-semibold text-[#1CF7FD] uppercase tracking-wider">
                FEATURED CAMPAIGNS
              </p>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                Featured Campaigns
              </h2>
              <p className="text-sm sm:text-lg text-[#A7B4C2] mt-3 sm:mt-4 leading-relaxed">
                Explore active campaigns and start earning from verified performance.
              </p>
            </div>

            {campaigns.length === 0 ? (
              /* Intentional Dark Premium Empty State */
              <div className="rounded-[20px] bg-[#0C131B] border border-[#1CF7FD]/30 p-6 sm:p-12 text-center max-w-2xl mx-auto shadow-sm relative">
                <div className="w-14 h-14 rounded-2xl bg-[#1CF7FD]/10 border border-[#1CF7FD]/25 flex items-center justify-center mx-auto mb-6 text-[#1CF7FD]">
                  <Compass className="w-7 h-7" />
                </div>
                <div className="inline-block text-[11px] font-mono uppercase tracking-wider text-[#1CF7FD] bg-[#1CF7FD]/10 px-3 py-1 rounded-full border border-[#1CF7FD]/20 mb-3">
                  NO ACTIVE CAMPAIGNS
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">
                  New campaigns are launching soon.
                </h3>
                <p className="text-sm sm:text-base text-[#A7B4C2] max-w-md mx-auto mb-8 leading-relaxed">
                  Create your ClipEarn account now so you're ready when the next campaign goes live.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-[11px] bg-[#1CF7FD] hover:bg-[#34f8fe] text-[#05080C] font-bold text-sm transition hover:shadow-[0_0_24px_rgba(28,247,253,0.18)] flex items-center justify-center gap-2"
                  >
                    <span>Create Clipper Account</span>
                    <ArrowRight className="w-4 h-4 text-[#05080C]" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setBrandModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-[11px] bg-transparent hover:bg-[#111C26] text-[#F8FAFC] hover:text-[#1CF7FD] font-medium text-sm border border-[#33424D] hover:border-[#1CF7FD] transition flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-[#1CF7FD]" />
                    <span>Launch a Campaign</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Real Database-Driven Active Campaign Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {campaigns.map((camp) => {
                  const cpmFormatted = `$${camp.cpm.toFixed(2)}`;
                  const budgetFormatted = `$${camp.total_budget.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}`;
                  const usedFormatted = `$${camp.used_budget.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`;
                  const budgetPercent =
                    camp.total_budget > 0
                      ? Math.min(100, Math.max(0, (camp.used_budget / camp.total_budget) * 100))
                      : 0;

                  const viewsDelivered =
                    camp.max_payable_views > 0
                      ? `${formatCompactNumber(camp.total_approved_views)} / ${formatCompactNumber(camp.max_payable_views)} views`
                      : `${formatCompactNumber(camp.total_approved_views)} views`;

                  const displayPlatforms = (camp.allowed_platforms || [])
                    .map((p) => PLATFORM_LABELS[p] || p)
                    .sort((a, b) => (PLATFORM_PRIORITY[a] ?? 99) - (PLATFORM_PRIORITY[b] ?? 99));

                  return (
                    <div
                      key={camp.id}
                      className="rounded-[18px] bg-[#0C131B] border border-[#1B2A35] hover:border-[#1CF7FD]/40 transition overflow-hidden flex flex-col justify-between"
                    >
                      <div className="h-44 w-full relative overflow-hidden bg-[#080D13]">
                        {camp.image_url ? (
                          <img
                            src={camp.image_url}
                            alt={camp.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0C131B] to-[#080D13] flex items-center justify-center p-4 text-center">
                            <span className="text-base font-bold text-[#64748B] uppercase tracking-widest line-clamp-1">
                              {camp.brand_name || camp.name}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-xs font-bold text-[#1CF7FD]">
                          {cpmFormatted} CPM
                        </div>
                      </div>

                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-[#1CF7FD] font-semibold uppercase tracking-wider">
                            {camp.brand_name}
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold text-white mt-1 mb-3 line-clamp-1">
                            {camp.name}
                          </h3>

                          {displayPlatforms.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {displayPlatforms.map((p, pidx) => (
                                <span
                                  key={pidx}
                                  className="px-2.5 py-1 rounded-md bg-[#080D13] border border-[#1B2A35] text-xs font-medium text-[#A7B4C2]"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="space-y-3 py-3 border-y border-[#1B2A35] text-xs">
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
                                  Budget Allocated
                                </span>
                                <span className="text-white font-semibold">
                                  {usedFormatted}{" "}
                                  <span className="text-[#64748B] font-normal">/ {budgetFormatted}</span>
                                </span>
                              </div>
                              <div
                                className="w-full h-1.5 bg-[#080D13] rounded-full overflow-hidden"
                                role="progressbar"
                                aria-label={`${camp.name} budget allocated`}
                                aria-valuenow={Math.round(budgetPercent)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <div
                                  className="h-full bg-[#1CF7FD] rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, Math.max(camp.used_budget > 0 ? 2 : 0, budgetPercent))}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
                                Views Delivered
                              </span>
                              <span className="text-white font-semibold">{viewsDelivered}</span>
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/login?redirect=/clipper/campaigns/${camp.id}`}
                          className="mt-6 w-full py-2.5 px-4 rounded-[11px] bg-[#1CF7FD] hover:bg-[#34f8fe] text-[#05080C] font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 min-h-[44px]"
                        >
                          <span>Join Campaign</span>
                          <ArrowRight className="w-4 h-4 text-[#05080C]" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ================================================== */}
        {/* 6. BRAND SECTION (Section 9 - 2 Columns)           */}
        {/* ================================================== */}
        <section id="for-brands" className="py-16 sm:py-28 border-b border-[#1B2A35] scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              {/* Left Column */}
              <div className="lg:col-span-5">
                <p className="text-xs font-mono font-semibold text-[#1CF7FD] uppercase tracking-wider">
                  FOR BRANDS & ADVERTISERS
                </p>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight leading-tight">
                  Your Content. <br />
                  <span className="text-[#1CF7FD]">Distributed at Scale.</span>
                </h2>
                <p className="text-sm sm:text-lg text-[#A7B4C2] mt-3 sm:mt-4 leading-relaxed">
                  Give ClipEarn your content and campaign goals. Our clipper distribution network turns that content into short-form videos across the platforms where attention is happening.
                </p>
                <div className="mt-6 sm:mt-8">
                  <button
                    type="button"
                    onClick={() => setBrandModalOpen(true)}
                    className="px-6 sm:px-7 py-3 sm:py-3.5 min-h-[44px] rounded-[11px] bg-[#1CF7FD] hover:bg-[#34f8fe] text-[#05080C] font-bold text-sm transition flex items-center justify-center gap-2 hover:shadow-[0_0_24px_rgba(28,247,253,0.18)] w-full sm:w-auto"
                  >
                    <Building2 className="w-4 h-4 text-[#05080C]" />
                    <span>Launch a Campaign</span>
                  </button>
                </div>
              </div>

              {/* Right Column: 3 Pillar Cards */}
              <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
                {brandPillars.map((p, idx) => {
                  const IconComp = p.icon;
                  return (
                    <div
                      key={idx}
                      className="p-5 sm:p-7 rounded-[18px] bg-[#0C131B] border border-[#1B2A35] hover:bg-[#111C26] hover:border-[#1CF7FD]/40 transition-all flex items-start gap-4 sm:gap-5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#1CF7FD]/10 border border-[#1CF7FD]/20 text-[#1CF7FD] flex items-center justify-center shrink-0 mt-0.5">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#1CF7FD]">
                          {p.tag}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 mb-1.5">
                          {p.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#A7B4C2] leading-relaxed">
                          {p.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 7. CLIPPER SECTION (Section 10 - 2 Columns)        */}
        {/* ================================================== */}
        <section id="for-clippers" className="py-16 sm:py-28 bg-[#080D13] border-b border-[#1B2A35] scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              {/* Left Column */}
              <div className="lg:col-span-5">
                <p className="text-xs font-mono font-semibold text-[#1CF7FD] uppercase tracking-wider">
                  FOR SHORT-FORM CLIPPERS
                </p>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight leading-tight">
                  Turn Your Editing <br />
                  <span className="text-[#1CF7FD]">Into Earnings.</span>
                </h2>
                <p className="text-sm sm:text-lg text-[#A7B4C2] mt-3 sm:mt-4 leading-relaxed">
                  Join campaigns, create short-form content, submit your published clips, and earn from verified performance.
                </p>
                <div className="mt-6 sm:mt-8">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 min-h-[44px] rounded-[11px] bg-[#1CF7FD] hover:bg-[#34f8fe] text-[#05080C] font-bold text-sm transition hover:shadow-[0_0_24px_rgba(28,247,253,0.18)] w-full sm:w-auto"
                  >
                    <span>Start Clipping</span>
                    <ArrowRight className="w-4 h-4 text-[#05080C]" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Workflow Steps with Progression Line */}
              <div className="lg:col-span-7 space-y-3">
                {clipperWorkflow.map((cw, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-[16px] bg-[#0C131B] border border-[#1B2A35] hover:border-[#1CF7FD]/35 transition-all flex items-start gap-3.5 sm:gap-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#1CF7FD]/10 border border-[#1CF7FD]/20 text-[#1CF7FD] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {cw.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{cw.title}</h4>
                      <p className="text-xs text-[#A7B4C2] mt-1 leading-relaxed">{cw.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 8. PERFORMANCE ENGINE SECTION (Section 11)         */}
        {/* ================================================== */}
        <section className="py-16 sm:py-28 border-b border-[#1B2A35]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10 sm:mb-16">
              <p className="text-xs font-mono font-semibold text-[#1CF7FD] uppercase tracking-wider">
                ENGINE ARCHITECTURE
              </p>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                Built Around Verified Performance.
              </h2>
              <p className="text-sm sm:text-lg text-[#A7B4C2] mt-3 sm:mt-4 leading-relaxed">
                ClipEarn's tracking infrastructure directly validates published content and measures real attention across major platforms.
              </p>
            </div>

            {/* Platform Badges */}
            <div className="mb-8 sm:mb-10 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs font-mono uppercase text-[#64748B] mr-2">
                SUPPORTED PLATFORMS:
              </span>
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#0C131B] border border-[#1B2A35] text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1CF7FD]" />
                <span>TikTok</span>
              </div>
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#0C131B] border border-[#1B2A35] text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1CF7FD]" />
                <span>Instagram Reels</span>
              </div>
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#0C131B] border border-[#1B2A35] text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1CF7FD]" />
                <span>YouTube Shorts</span>
              </div>
            </div>

            {/* Sequential Engine Pipeline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
              {engineStages.map((es, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-[14px] bg-[#0C131B] border border-[#1B2A35] hover:border-[#1CF7FD]/40 transition-colors flex flex-col justify-between"
                >
                  <span className="text-[10px] font-mono text-[#1CF7FD] mb-2">{es.step}</span>
                  <div>
                    <div className="text-xs font-bold text-white tracking-wide">{es.label}</div>
                    <div className="text-[11px] text-[#64748B] mt-1 leading-snug">{es.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 9. TRUST & INTEGRITY SECTION (Section 12 - 4 Cols) */}
        {/* ================================================== */}
        <section className="py-16 sm:py-28 bg-[#080D13] border-b border-[#1B2A35]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10 sm:mb-16">
              <p className="text-xs font-mono font-semibold text-[#1CF7FD] uppercase tracking-wider">
                SECURITY & AUDITABILITY
              </p>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                Built for Real Performance.
              </h2>
              <p className="text-sm sm:text-lg text-[#A7B4C2] mt-3 sm:mt-4 leading-relaxed">
                Designed to protect campaigns from invalid activity through multi-layered verification and auditable tracking.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {trustPoints.map((tp, idx) => {
                const IconComponent = tp.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 sm:p-7 rounded-[18px] bg-[#0C131B] border border-[#1B2A35] hover:bg-[#111C26] hover:border-[#1CF7FD]/40 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#1CF7FD]/10 border border-[#1CF7FD]/20 text-[#1CF7FD] flex items-center justify-center mb-5">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-wide mb-2">
                      {tp.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A7B4C2] leading-relaxed">
                      {tp.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 10. FAQ SECTION (Section 21)                       */}
        {/* ================================================== */}
        <section id="faq" className="py-16 sm:py-28 border-b border-[#1B2A35] scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10 sm:mb-16">
              <p className="text-xs font-mono font-semibold text-[#1CF7FD] uppercase tracking-wider">
                FAQ
              </p>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="max-w-3xl rounded-[20px] bg-[#0C131B] border border-[#1B2A35] divide-y divide-[#1B2A35] overflow-hidden">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div key={idx} className="transition-colors">
                    <button
                      id={`faq-btn-${idx}`}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${idx}`}
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className={`w-full p-4 sm:p-6 text-left flex justify-between items-center text-sm sm:text-base font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1CF7FD] group ${
                        isOpen ? "text-[#1CF7FD]" : "text-white hover:text-[#1CF7FD]"
                      }`}
                    >
                      <span className="pr-4">{faq.q}</span>
                      <span className="shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#080D13] border border-[#1B2A35] text-[#A7B4C2] group-hover:border-[#1CF7FD]/40 group-hover:text-[#1CF7FD] transition-all">
                        <ChevronDown
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-[#1CF7FD]" : ""
                          }`}
                        />
                      </span>
                    </button>
                    {isOpen && (
                      <div
                        id={`faq-answer-${idx}`}
                        role="region"
                        aria-labelledby={`faq-btn-${idx}`}
                        className="px-4 pb-4 sm:px-6 sm:pb-6 text-xs sm:text-sm text-[#A7B4C2] leading-relaxed pt-1 border-l-2 border-[#1CF7FD]"
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 11. FINAL CTA (Section 22)                         */}
        {/* ================================================== */}
        <section className="py-16 sm:py-28 relative overflow-hidden">
          {/* Subtle cyan glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw] h-[400px] pointer-events-none rounded-full"
            style={{
              background: "radial-gradient(ellipse at center, rgba(28, 247, 253, 0.07) 0%, rgba(5, 8, 12, 0) 70%)",
            }}
          />

          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
            <div className="rounded-[24px] bg-[#0C131B] border border-[#1CF7FD]/30 p-6 sm:p-12 lg:p-16 text-center max-w-4xl mx-auto shadow-2xl">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                Ready to Turn Content <br className="hidden sm:inline" />
                Into <span className="text-[#1CF7FD]">Performance?</span>
              </h2>
              <p className="text-sm sm:text-lg text-[#A7B4C2] mt-3 sm:mt-4 max-w-xl mx-auto leading-relaxed">
                Whether you're a brand scaling short-form distribution or a clipper ready to monetize your attention, join the ClipEarn platform today.
              </p>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 min-h-[48px] rounded-[11px] bg-[#1CF7FD] hover:bg-[#34f8fe] text-[#05080C] font-bold text-sm sm:text-base transition hover:shadow-[0_0_24px_rgba(28,247,253,0.18)] flex items-center justify-center gap-2"
                >
                  <span>Start Clipping</span>
                  <ArrowRight className="w-4 h-4 text-[#05080C]" />
                </Link>
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(true)}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 min-h-[48px] rounded-[11px] bg-transparent hover:bg-[#111C26] border border-[#33424D] hover:border-[#1CF7FD] text-[#F8FAFC] hover:text-[#1CF7FD] font-semibold text-sm sm:text-base transition flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-[#1CF7FD]" />
                  <span>Launch a Campaign</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================================================== */}
      {/* 12. FOOTER (Section 23)                            */}
      {/* ================================================== */}
      <footer className="border-t border-[#1B2A35] bg-[#05080C] py-12 sm:py-16 text-xs text-[#A7B4C2]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10 pb-10 sm:pb-12 border-b border-[#1B2A35]">
            {/* Brand column */}
            <div className="sm:col-span-2">
              <ClipEarnLogo size="md" href="/" />
              <p className="mt-4 text-xs sm:text-sm text-[#A7B4C2] max-w-sm leading-relaxed">
                Performance-based short-form content distribution. Connecting brands with distributed clipper networks across TikTok, Instagram, and YouTube.
              </p>
            </div>

            {/* Links Columns */}
            <div>
              <div className="font-semibold text-white uppercase tracking-wider text-xs mb-3.5 sm:mb-4">
                Platform
              </div>
              <ul className="space-y-2.5">
                <li>
                  <a href="#how-it-works" className="hover:text-white transition">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#campaigns" className="hover:text-white transition">
                    Campaigns
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-white uppercase tracking-wider text-xs mb-3.5 sm:mb-4">
                Portals
              </div>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/login" className="hover:text-white transition">
                    Start Clipping
                  </Link>
                </li>
                <li>
                  <Link href="/clipper/guidelines" className="hover:text-white transition">
                    Clipper Guidelines
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setBrandModalOpen(true)}
                    className="hover:text-white transition text-left"
                  >
                    Launch Campaign
                  </button>
                </li>
                <li>
                  <Link href="/manager/login" className="hover:text-white transition">
                    Manager Portal
                  </Link>
                </li>
                <li>
                  <Link href="/admin/login" className="hover:text-white transition">
                    Admin Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-white uppercase tracking-wider text-xs mb-3.5 sm:mb-4">
                Legal
              </div>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/data-deletion" className="hover:text-white transition">
                    Data Deletion
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <span className="text-[#64748B]">
              &copy; {new Date().getFullYear()} ClipEarn Inc. All rights reserved.
            </span>
            <div className="flex items-center gap-2 text-[11px] text-[#64748B] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span>System Status: Operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ================================================== */}
      {/* 13. BRAND PARTNERSHIP MODAL                        */}
      {/* ================================================== */}
      {brandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0C131B] border border-[#1B2A35] rounded-[20px] max-w-md w-full p-5 sm:p-8 relative shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setBrandModalOpen(false);
                setModalSubmitted(false);
              }}
              className="absolute top-5 right-5 text-[#64748B] hover:text-white transition p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {modalSubmitted ? (
              <div className="py-6 sm:py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#1CF7FD]/10 border border-[#1CF7FD]/20 text-[#1CF7FD] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Inquiry Received</h3>
                <p className="text-xs text-[#A7B4C2] max-w-xs mx-auto leading-relaxed">
                  Thank you! Our brand partnership director will reach out to schedule your campaign onboarding.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandModalOpen(false);
                      setModalSubmitted(false);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-[11px] bg-[#1CF7FD] hover:bg-[#34f8fe] text-[#05080C] font-bold text-xs transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 pr-6">
                  Launch a Clipping Campaign
                </h3>
                <p className="text-xs text-[#A7B4C2] mb-6 leading-relaxed">
                  Connect with our team to distribute your brand's content across our verified clipper network with custom performance targets.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setModalSubmitted(true);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Company / Brand Name
                    </label>
                    <input
                      required
                      placeholder="e.g. Acme Media"
                      className="w-full bg-[#080D13] border border-[#1B2A35] rounded-[10px] p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#1CF7FD]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Work Email
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="marketing@acme.com"
                      className="w-full bg-[#080D13] border border-[#1B2A35] rounded-[10px] p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#1CF7FD]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Target Monthly Budget
                    </label>
                    <select className="w-full bg-[#080D13] border border-[#1B2A35] rounded-[10px] p-3 text-white focus:outline-none focus:border-[#1CF7FD]">
                      <option>$5,000 - $10,000</option>
                      <option>$10,000 - $25,000</option>
                      <option>$25,000 - $50,000</option>
                      <option>$50,000+</option>
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-[#1B2A35]">
                    <button
                      type="button"
                      onClick={() => setBrandModalOpen(false)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-[10px] bg-transparent hover:bg-[#111C26] text-slate-300 font-medium text-xs border border-[#1B2A35] transition text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] bg-[#1CF7FD] hover:bg-[#34f8fe] text-[#05080C] font-bold text-xs transition hover:shadow-[0_0_24px_rgba(28,247,253,0.18)] text-center"
                    >
                      Request Consultation
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
