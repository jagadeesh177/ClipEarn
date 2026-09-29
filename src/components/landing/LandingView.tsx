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

  const capabilities = [
    {
      num: "01",
      title: "PERFORMANCE-BASED",
      desc: "Brands pay based on measurable campaign performance, aligning budgets with verified short-form reach.",
      icon: Target,
    },
    {
      num: "02",
      title: "MULTI-PLATFORM",
      desc: "Distribute content seamlessly across TikTok, Instagram Reels, and YouTube Shorts from one unified dashboard.",
      icon: Share2,
    },
    {
      num: "03",
      title: "VERIFIED METRICS",
      desc: "Track campaign performance using direct platform APIs, eliminating manual reporting and guesswork.",
      icon: CheckCircle2,
    },
    {
      num: "04",
      title: "AUTOMATED TRACKING",
      desc: "Campaign metrics and creator view snapshots are synchronized automatically on an automated schedule.",
      icon: RefreshCw,
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Launch a Campaign",
      desc: "Brands provide content, campaign requirements, budget, and performance goals.",
    },
    {
      num: "02",
      title: "Creators Distribute",
      desc: "Creators turn approved content into short-form videos and publish across supported platforms.",
    },
    {
      num: "03",
      title: "ClipEarn Tracks",
      desc: "Published content is submitted and tracked using verified platform metrics.",
    },
    {
      num: "04",
      title: "Performance Pays",
      desc: "Eligible creators earn based on verified campaign performance and CPM rates.",
    },
  ];

  const brandPillars = [
    {
      tag: "DISTRIBUTION",
      title: "Creator Network",
      desc: "Get your content in front of a distributed network of short-form creators specializing in hooks, edits, and viral formats.",
      icon: Share2,
    },
    {
      tag: "PERFORMANCE",
      title: "Verified Analytics",
      desc: "Track views, engagement, and reach through verified platform metrics captured directly from social endpoints.",
      icon: BarChart3,
    },
    {
      tag: "SCALE",
      title: "Predictable Growth",
      desc: "Scale campaigns with defined budgets, CPM caps, and view thresholds that ensure predictable unit economics.",
      icon: Sliders,
    },
  ];

  const creatorBenefits = [
    {
      title: "Find active campaigns",
      desc: "Browse vetted campaigns with clear CPM payout rates, brand rules, and available budgets.",
    },
    {
      title: "Connect your social accounts",
      desc: "Verify ownership easily via bio verification codes across TikTok, Instagram, and YouTube.",
    },
    {
      title: "Submit published clips",
      desc: "Paste your video link with campaign hashtags to enter our automated review queue.",
    },
    {
      title: "Track verified performance",
      desc: "Our engine tracks your clip views and automatically calculates eligible payouts.",
    },
    {
      title: "Earn from eligible views",
      desc: "Get compensated directly based on verified view milestones deposited into your ledger balance.",
    },
  ];

  const engineFlow = [
    { step: "01", label: "Creator publishes", note: "TikTok, IG, YouTube" },
    { step: "02", label: "Clip submitted", note: "Post link & ID validation" },
    { step: "03", label: "Clip reviewed", note: "Compliance & guidelines" },
    { step: "04", label: "Metrics verified", note: "Direct API snapshot" },
    { step: "05", label: "Performance tracked", note: "Continuous view sync" },
    { step: "06", label: "Earnings calculated", note: "Ledger recorded" },
  ];

  const trustPoints = [
    {
      title: "Platform-Based Metric Verification",
      desc: "Views are verified directly through official platform APIs to ensure accurate performance metrics.",
    },
    {
      title: "Submission Review",
      desc: "Clips are checked against brand guidelines, caption tags, and editorial criteria before approval.",
    },
    {
      title: "Duplicate Detection",
      desc: "Platform post identifiers ensure the same video cannot be submitted multiple times or across accounts.",
    },
    {
      title: "Campaign-Specific Tracking",
      desc: "Views are tracked accurately within the active campaign lifecycle to align with brand budgets.",
    },
    {
      title: "Audit-Ready Earnings",
      desc: "Every view increment and rate calculation is stored in an auditable ledger for complete transparency.",
    },
    {
      title: "Fraud Monitoring",
      desc: "Designed to protect campaigns from invalid activity, artificial view spikes, and non-organic engagement.",
    },
  ];

  const faqs = [
    {
      q: "What is ClipEarn?",
      a: "ClipEarn is a performance-based short-form content distribution platform connecting brands with video creators. Brands launch campaigns with specified CPM rates and budgets, while creators turn brand content into short-form videos and earn from verified view performance.",
    },
    {
      q: "How do creators get paid?",
      a: "Creators earn based on the campaign's CPM (cost per 1,000 views) and eligible verified views. Once your clip is approved and views are synchronized from the platform, your earnings are credited to your balance and can be withdrawn via your configured payout account.",
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
      a: "Yes. Brands work directly with ClipEarn to establish custom budgets, CPM rates, platform requirements, and editorial guidelines for distributed creator campaigns.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#F8FAFC] flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-400">
      {/* ================================================== */}
      {/* 1. NAVIGATION                                      */}
      {/* ================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070A0F]/85 border-b border-[#1E293B] w-full transition-colors">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <ClipEarnLogo size="md" href="/" />
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#94A3B8]"
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
            <a href="#for-creators" className="hover:text-white transition-colors">
              For Creators
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <Link
              href="/manager/login"
              className="text-xs sm:text-sm font-semibold text-[#94A3B8] hover:text-white px-4 py-2 rounded-lg bg-[#0B111A] hover:bg-[#101722] border border-[#1E293B] transition-all"
            >
              Manager Portal
            </Link>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-white px-4 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] transition-all shadow-sm flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#070A0F]"
            >
              <span>Start Clipping</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#101722] border border-[#1E293B] transition focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#1E293B] bg-[#0B111A] px-6 py-6 space-y-4">
            <nav className="flex flex-col gap-3 text-sm font-medium text-[#94A3B8]">
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
                href="#for-creators"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition py-1"
              >
                For Creators
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition py-1"
              >
                FAQ
              </a>
            </nav>
            <div className="pt-4 border-t border-[#1E293B] flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-center font-semibold text-sm transition"
              >
                Start Clipping
              </Link>
              <Link
                href="/manager/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#101722] hover:bg-[#141C2B] border border-[#1E293B] text-[#F8FAFC] text-center font-medium text-sm transition"
              >
                Manager Portal
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ================================================== */}
        {/* 2. HERO SECTION                                    */}
        {/* ================================================== */}
        <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32 overflow-hidden border-b border-[#1E293B]/60">
          <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101722] border border-[#1E293B] text-[11px] sm:text-xs font-semibold text-[#60A5FA] tracking-wider uppercase mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                <span>PERFORMANCE-BASED CONTENT DISTRIBUTION</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                Turn Content Into{" "}
                <span className="text-[#60A5FA]">Massive Reach.</span>
              </h1>

              {/* Subheading */}
              <p className="mt-6 text-base sm:text-lg lg:text-xl text-[#94A3B8] leading-relaxed max-w-2xl mx-auto">
                ClipEarn connects brands with a distributed network of short-form creators who turn existing content into high-performing videos across TikTok, Instagram, and YouTube.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-base transition-all shadow-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <span>Start Clipping</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>

                <button
                  type="button"
                  onClick={() => setBrandModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#101722] hover:bg-[#141C2B] border border-[#1E293B] text-[#F8FAFC] font-semibold text-base transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#60A5FA]"
                >
                  <Building2 className="w-4 h-4 text-[#60A5FA]" />
                  <span>Launch a Campaign</span>
                </button>
              </div>
            </div>

            {/* ================================================== */}
            {/* 3. HERO VISUAL (Engine Composition)                */}
            {/* ================================================== */}
            <div className="mt-16 sm:mt-20 max-w-4xl mx-auto">
              <div className="rounded-2xl bg-[#101722] border border-[#1E293B] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                {/* Visual Top Bar */}
                <div className="flex flex-wrap items-center justify-between pb-6 border-b border-[#1E293B] gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-xs font-mono text-[#64748B] ml-2">clipearn-distribution-engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#60A5FA] bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                      LIVE PIPELINE
                    </span>
                  </div>
                </div>

                {/* Engine Flow Grid */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#0B111A] border border-[#1E293B]/80 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">STAGE 01</div>
                      <div className="text-sm font-bold text-white mt-1">Brand Content</div>
                      <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                        Source video, podcast, or campaign assets deposited.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#1E293B] text-[11px] font-mono text-[#60A5FA]">
                      CAMPAIGN ASSETS
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B111A] border border-[#1E293B]/80 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">STAGE 02</div>
                      <div className="text-sm font-bold text-white mt-1">Creator Network</div>
                      <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                        Distributed editors produce native short-form clips.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#1E293B] text-[11px] font-mono text-emerald-400">
                      ACTIVE CREATORS
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B111A] border border-[#1E293B]/80 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">STAGE 03</div>
                      <div className="text-sm font-bold text-white mt-1">Multi-Platform</div>
                      <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                        Published across TikTok, Instagram Reels & YouTube.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#1E293B] text-[11px] font-mono text-blue-300">
                      TIKTOK / IG / YT
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B111A] border border-blue-500/30 flex flex-col justify-between bg-gradient-to-b from-[#101722] to-[#0B111A]">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#60A5FA]">STAGE 04</div>
                      <div className="text-sm font-bold text-white mt-1">Verified Output</div>
                      <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                        Automated API verification & measurable CPM payouts.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#1E293B] text-[11px] font-mono text-white">
                      PERFORMANCE-BASED
                    </div>
                  </div>
                </div>

                {/* Capability Badges Strip */}
                <div className="mt-6 pt-6 border-t border-[#1E293B] flex flex-wrap items-center justify-between text-xs text-[#64748B] gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    <span className="text-[#94A3B8] font-mono text-[11px] uppercase">
                      VERIFIED VIEWS
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                    <span className="text-[#94A3B8] font-mono text-[11px] uppercase">
                      TRACKED PERFORMANCE
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-[#94A3B8] font-mono text-[11px] uppercase">
                      CREATOR DISTRIBUTION
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[#94A3B8] font-mono text-[11px] uppercase">
                      AUDITABLE LEDGER
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 4. CORE PLATFORM CAPABILITIES                      */}
        {/* ================================================== */}
        <section className="py-20 sm:py-28 bg-[#0B111A] border-b border-[#1E293B]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {capabilities.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-[#101722] border border-[#1E293B] hover:border-[#3B82F6]/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono font-bold text-[#60A5FA]">
                          {item.num}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#0B111A] border border-[#1E293B] flex items-center justify-center text-[#60A5FA]">
                          <IconComponent className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-white tracking-wide">
                        {item.title}
                      </h3>
                      <p className="mt-2.5 text-sm text-[#94A3B8] leading-relaxed">
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
        {/* 5. HOW IT WORKS                                    */}
        {/* ================================================== */}
        <section id="how-it-works" className="py-24 sm:py-32 border-b border-[#1E293B] scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mb-16">
              <p className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider">
                HOW IT WORKS
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                From Content to Measurable Reach.
              </h2>
              <p className="text-base sm:text-lg text-[#94A3B8] mt-4 leading-relaxed">
                A streamlined end-to-end pipeline connecting brand content to short-form attention with verified performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#101722] border border-[#1E293B] flex flex-col justify-between relative group hover:border-[#3B82F6]/40 transition-colors"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#60A5FA] font-bold text-sm flex items-center justify-center mb-6">
                      {st.num}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {st.title}
                    </h3>
                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 6. FEATURED CAMPAIGNS                              */}
        {/* ================================================== */}
        <section id="campaigns" className="py-24 sm:py-32 bg-[#0B111A] border-b border-[#1E293B] scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mb-16">
              <p className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider">
                CAMPAIGNS
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                Featured Campaigns
              </h2>
              <p className="text-base sm:text-lg text-[#94A3B8] mt-4 leading-relaxed">
                Explore active campaigns and start earning from verified performance.
              </p>
            </div>

            {campaigns.length === 0 ? (
              /* Intentional, High-Quality Empty State */
              <div className="rounded-2xl bg-[#101722] border border-[#1E293B] p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6 text-[#60A5FA]">
                  <Compass className="w-7 h-7" />
                </div>
                <div className="inline-block text-[11px] font-mono uppercase tracking-wider text-[#60A5FA] bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mb-3">
                  NO ACTIVE CAMPAIGNS
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                  New campaigns are launching soon.
                </h3>
                <p className="text-sm sm:text-base text-[#94A3B8] max-w-md mx-auto mb-8 leading-relaxed">
                  Create your ClipEarn account now so you're ready when the next campaign goes live.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Create Clipper Account</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setBrandModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0B111A] hover:bg-[#141C2B] text-slate-200 hover:text-white font-medium text-sm border border-[#1E293B] transition flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-[#60A5FA]" />
                    <span>Launch a Campaign</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Real Database-Driven Active Campaign Cards */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      className="rounded-2xl bg-[#101722] border border-[#1E293B] overflow-hidden flex flex-col justify-between hover:border-slate-700 transition"
                    >
                      <div className="h-44 w-full relative overflow-hidden bg-[#0B111A]">
                        {camp.image_url ? (
                          <img
                            src={camp.image_url}
                            alt={camp.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#101722] to-[#0B111A] flex items-center justify-center p-4 text-center">
                            <span className="text-base font-bold text-slate-500 uppercase tracking-widest line-clamp-1">
                              {camp.brand_name || camp.name}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-[#60A5FA]">
                          {cpmFormatted} CPM
                        </div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                            {camp.brand_name}
                          </span>
                          <h3 className="text-xl font-bold text-white mt-1 mb-3 line-clamp-1">
                            {camp.name}
                          </h3>

                          {displayPlatforms.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {displayPlatforms.map((p, pidx) => (
                                <span
                                  key={pidx}
                                  className="px-2.5 py-1 rounded-md bg-[#0B111A] border border-[#1E293B] text-xs font-medium text-slate-300"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="space-y-3 py-3 border-y border-[#1E293B] text-xs">
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">
                                  Budget Allocated
                                </span>
                                <span className="text-white font-semibold">
                                  {usedFormatted}{" "}
                                  <span className="text-slate-500 font-normal">/ {budgetFormatted}</span>
                                </span>
                              </div>
                              <div
                                className="w-full h-1.5 bg-[#0B111A] rounded-full overflow-hidden"
                                role="progressbar"
                                aria-label={`${camp.name} budget allocated`}
                                aria-valuenow={Math.round(budgetPercent)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, Math.max(camp.used_budget > 0 ? 2 : 0, budgetPercent))}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">
                                Views Delivered
                              </span>
                              <span className="text-white font-semibold">{viewsDelivered}</span>
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/login?redirect=/clipper/campaigns/${camp.id}`}
                          className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
                        >
                          <span>Join Campaign</span>
                          <ArrowRight className="w-4 h-4 text-white" />
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
        {/* 7. BRAND SECTION                                   */}
        {/* ================================================== */}
        <section id="for-brands" className="py-24 sm:py-32 border-b border-[#1E293B] scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mb-16">
              <p className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider">
                FOR BRANDS & ADVERTISERS
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                Your Content. Distributed at Scale.
              </h2>
              <p className="text-base sm:text-lg text-[#94A3B8] mt-4 leading-relaxed">
                Give ClipEarn your content and campaign goals. Our creator distribution network turns that content into short-form videos across the platforms where attention is happening.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {brandPillars.map((p, idx) => {
                const IconComp = p.icon;
                return (
                  <div
                    key={idx}
                    className="p-8 rounded-2xl bg-[#101722] border border-[#1E293B] flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#60A5FA] flex items-center justify-center mb-6">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#60A5FA]">
                        {p.tag}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1 mb-3">
                        {p.title}
                      </h3>
                      <p className="text-sm text-[#94A3B8] leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12">
              <button
                type="button"
                onClick={() => setBrandModalOpen(true)}
                className="px-8 py-3.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm transition flex items-center gap-2 shadow-sm"
              >
                <Building2 className="w-4 h-4 text-white" />
                <span>Launch a Campaign</span>
              </button>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 8. CREATOR SECTION                                 */}
        {/* ================================================== */}
        <section id="for-creators" className="py-24 sm:py-32 bg-[#0B111A] border-b border-[#1E293B] scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6">
                <p className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider">
                  FOR SHORT-FORM CREATORS
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                  Turn Your Editing Into Earnings.
                </h2>
                <p className="text-base sm:text-lg text-[#94A3B8] mt-4 leading-relaxed">
                  Join campaigns, create short-form content, submit your published clips, and earn from verified performance.
                </p>

                <div className="mt-8">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm transition shadow-sm"
                  >
                    <span>Start Clipping</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                {creatorBenefits.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-[#101722] border border-[#1E293B] flex items-start gap-4 hover:border-slate-700 transition"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#60A5FA] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 9. VERIFIED PERFORMANCE ENGINE                     */}
        {/* ================================================== */}
        <section className="py-24 sm:py-32 border-b border-[#1E293B]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mb-16">
              <p className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider">
                ENGINE ARCHITECTURE
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                Built Around Verified Performance.
              </h2>
              <p className="text-base sm:text-lg text-[#94A3B8] mt-4 leading-relaxed">
                ClipEarn's tracking infrastructure directly validates published content and measures real attention across major platforms.
              </p>
            </div>

            {/* Social Platforms Row */}
            <div className="mb-10 flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono uppercase text-[#64748B] mr-2">
                SUPPORTED PLATFORMS:
              </span>
              <div className="px-4 py-2 rounded-xl bg-[#101722] border border-[#1E293B] text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>TikTok</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#101722] border border-[#1E293B] text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                <span>Instagram Reels</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#101722] border border-[#1E293B] text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>YouTube Shorts & Video</span>
              </div>
            </div>

            {/* Linear Pipeline Stages */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {engineFlow.map((ef, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#101722] border border-[#1E293B] flex flex-col justify-between"
                >
                  <span className="text-[10px] font-mono text-[#60A5FA] mb-2">{ef.step}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{ef.label}</div>
                    <div className="text-[11px] text-[#64748B] mt-1">{ef.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 10. TRUST / FRAUD PROTECTION                       */}
        {/* ================================================== */}
        <section className="py-24 sm:py-32 bg-[#0B111A] border-b border-[#1E293B]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mb-16">
              <p className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider">
                INTEGRITY & COMPLIANCE
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                Built for Real Performance.
              </h2>
              <p className="text-base sm:text-lg text-[#94A3B8] mt-4 leading-relaxed">
                Designed to protect campaigns from invalid activity through multi-layered verification and auditable tracking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trustPoints.map((tp, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#101722] border border-[#1E293B]"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#60A5FA] flex items-center justify-center mb-4">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    {tp.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    {tp.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 11. FAQ                                            */}
        {/* ================================================== */}
        <section id="faq" className="py-24 sm:py-32 border-b border-[#1E293B] scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mb-16">
              <p className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider">
                FAQ
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="max-w-3xl rounded-2xl bg-[#101722] border border-[#1E293B] divide-y divide-[#1E293B] overflow-hidden">
              {faqs.map((faq, idx) => (
                <div key={idx} className="transition-colors">
                  <button
                    id={`faq-btn-${idx}`}
                    type="button"
                    aria-expanded={activeFaq === idx}
                    aria-controls={`faq-answer-${idx}`}
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full p-6 text-left flex justify-between items-center text-base font-semibold text-white hover:text-[#60A5FA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#0B111A] border border-[#1E293B] text-[#94A3B8]">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          activeFaq === idx ? "rotate-180 text-[#60A5FA]" : ""
                        }`}
                      />
                    </span>
                  </button>
                  {activeFaq === idx && (
                    <div
                      id={`faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`faq-btn-${idx}`}
                      className="px-6 pb-6 text-sm text-[#94A3B8] leading-relaxed pt-2"
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 12. FINAL CTA                                      */}
        {/* ================================================== */}
        <section className="py-24 sm:py-32">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="rounded-3xl bg-gradient-to-b from-[#101722] to-[#0B111A] border border-blue-500/20 p-10 sm:p-16 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
                Ready to Turn Content <br className="hidden sm:inline" />
                Into Performance?
              </h2>
              <p className="text-base sm:text-lg text-[#94A3B8] mt-4 max-w-xl mx-auto leading-relaxed">
                Whether you're a brand scaling short-form distribution or a creator ready to earn from verified attention, join the ClipEarn platform today.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-base transition shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Start Clipping</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#0B111A] hover:bg-[#141C2B] border border-[#1E293B] text-[#F8FAFC] font-semibold text-base transition flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-[#60A5FA]" />
                  <span>Launch a Campaign</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================================================== */}
      {/* 13. FOOTER                                         */}
      {/* ================================================== */}
      <footer className="border-t border-[#1E293B] bg-[#070A0F] py-16 text-xs text-[#94A3B8]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#1E293B]">
            {/* Brand column */}
            <div className="md:col-span-2">
              <ClipEarnLogo size="md" href="/" />
              <p className="mt-4 text-sm text-[#94A3B8] max-w-sm leading-relaxed">
                Performance-based short-form content distribution. Connecting brands with distributed creator networks across TikTok, Instagram, and YouTube.
              </p>
            </div>

            {/* Links Columns */}
            <div>
              <div className="font-semibold text-white uppercase tracking-wider text-xs mb-4">
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
              <div className="font-semibold text-white uppercase tracking-wider text-xs mb-4">
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
              <div className="font-semibold text-white uppercase tracking-wider text-xs mb-4">
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

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
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
      {/* 14. BRAND PARTNERSHIP MODAL                        */}
      {/* ================================================== */}
      {brandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101722] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setBrandModalOpen(false);
                setModalSubmitted(false);
              }}
              className="absolute top-5 right-5 text-[#64748B] hover:text-white transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {modalSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Inquiry Received</h3>
                <p className="text-xs text-[#94A3B8] max-w-xs mx-auto leading-relaxed">
                  Thank you! Our brand partnership director will reach out to schedule your campaign onboarding.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandModalOpen(false);
                      setModalSubmitted(false);
                    }}
                    className="px-5 py-2.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium text-xs transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-white mb-1.5">
                  Launch a Clipping Campaign
                </h3>
                <p className="text-xs text-[#94A3B8] mb-6 leading-relaxed">
                  Connect with our team to distribute your brand's content across our verified creator network with custom performance targets.
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
                      className="w-full bg-[#0B111A] border border-[#1E293B] rounded-lg p-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#3B82F6]"
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
                      className="w-full bg-[#0B111A] border border-[#1E293B] rounded-lg p-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Target Monthly Budget
                    </label>
                    <select className="w-full bg-[#0B111A] border border-[#1E293B] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#3B82F6]">
                      <option>$5,000 - $10,000</option>
                      <option>$10,000 - $25,000</option>
                      <option>$25,000 - $50,000</option>
                      <option>$50,000+</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
                    <button
                      type="button"
                      onClick={() => setBrandModalOpen(false)}
                      className="px-4 py-2.5 rounded-lg bg-[#0B111A] hover:bg-[#141C2B] text-slate-300 font-medium text-xs border border-[#1E293B] transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-xs transition shadow-sm"
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
