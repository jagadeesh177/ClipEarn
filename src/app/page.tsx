"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  Video,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  PlayCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Flame,
  Zap,
  Building2,
  Plus,
} from "lucide-react";

const PLATFORM_PRIORITY: Record<string, number> = {
  TikTok: 1,
  Instagram: 2,
  YouTube: 3,
};

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [brandModalOpen, setBrandModalOpen] = useState(false);

  const sampleCampaigns = [
    {
      name: "Steve Wynn #2",
      brand: "Steve Wynn Media",
      cpm: "$1.00",
      budget: "$10,000",
      used: "$122.02",
      views: "363.5K / 10M views",
      platforms: ["Instagram", "TikTok", "YouTube"],
      image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600",
    },
    {
      name: "Apex Energy Drink Launch",
      brand: "Apex Nutrition Co.",
      cpm: "$1.50",
      budget: "$15,000",
      used: "$3,450.00",
      views: "2.3M / 10M views",
      platforms: ["TikTok", "Instagram"],
      image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600",
    },
    {
      name: "CryptoPulse App Tour",
      brand: "CryptoPulse Global",
      cpm: "$2.00",
      budget: "$25,000",
      used: "$8,940.00",
      views: "4.5M / 12.5M views",
      platforms: ["YouTube", "TikTok", "Instagram"],
      image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600",
    },
  ];

  const faqs = [
    {
      q: "What is ClipEarn?",
      a: "ClipEarn is a platform where clippers earn money by creating and posting clips for active campaigns.",
    },
    {
      q: "When do I get paid?",
      a: "Earnings are calculated based on the campaign's payout rate and your eligible views. You'll get paid once campaign reach Goal Views.",
    },
    {
      q: "How does ClipEarn calculate my earnings?",
      a: "Every campaign specifies a CPM (cost per 1,000 views), such as $1.00 or $2.00 CPM. Once a campaign manager approves your clip, our automated view sync engine captures historical snapshots every 8 hours and calculates your payable earnings straight into an immutable ledger.",
    },
    {
      q: "Which social media platforms are supported?",
      a: "ClipEarn natively integrates with Instagram (Reels), TikTok, and YouTube (Shorts & Videos). Campaigns can allow one, two, or all three platforms.",
    },
    {
      q: "How do I verify ownership of my social accounts?",
      a: "When you connect an account, ClipEarn generates a unique verification code (e.g. clipearn-81fa2b). You simply paste this code into your profile bio on that platform, wait ~20 seconds, and click Verify. This ensures clippers only submit content from channels they genuinely own.",
    },
    {
      q: "Can brands launch custom clipping campaigns?",
      a: "Yes! Brands partner with ClipEarn to syndicate content through thousands of talented clippers, setting custom budgets, CPM rates, hashtag requirements, and brand safety guidelines.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col selection:bg-brand-cyan/20 selection:text-brand-cyan">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070A0F]/90 border-b border-slate-800/80 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center shrink-0">
            <ClipEarnLogo size="sm" href="/" className="sm:hidden" />
            <ClipEarnLogo size="md" href="/" className="hidden sm:inline-flex" />
          </div>

          <nav aria-label="Global navigation" className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#campaigns" className="hover:text-white transition-colors">Campaigns</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/manager/login"
              className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-200 hover:text-white px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <span className="sm:hidden">Manager</span>
              <span className="hidden sm:inline">Manager Portal</span>
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-black font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-[#070A0F]"
            >
              <span>Start Clipping</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black shrink-0" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Glow backdrop blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-brand-cyan/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-brand-emerald/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-brand-cyan font-medium mb-8 shadow-inner">
            <Zap className="w-3.5 h-3.5" />
            <span>The #1 Short-Form Clipper Payout Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Get Paid to Post{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#1cf7fd] to-[#1cf7fd]">
              Short-Form Clips
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Brands sponsor high-paying clipping campaigns. You post dynamic clips to TikTok, Instagram Reels, and YouTube Shorts. Earn verified cash for every 1,000 views.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-black font-black text-base shadow-[0_0_30px_-5px_rgba(28,247,253,0.4)] hover:shadow-[0_0_40px_-5px_rgba(28,247,253,0.6)] transition-all flex items-center justify-center gap-2.5"
            >
              Start Clipping Now
              <ArrowRight className="w-5 h-5 text-black" />
            </Link>

            <button
              onClick={() => setBrandModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-500/80 hover:border-brand-cyan text-white hover:text-brand-cyan font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-[0_0_20px_-3px_rgba(28,247,253,0.15)] focus:outline-none focus:ring-2 focus:ring-brand-cyan"
            >
              <Building2 className="w-5 h-5 text-brand-cyan shrink-0" />
              <span>For Brands & Advertisers</span>
            </button>
          </div>

          {/* Social Proof Strip */}
          <div className="mt-16 pt-8 border-t border-slate-800/60 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            <div className="w-full px-2 flex flex-col items-center">
              <div className="text-2xl sm:text-3xl font-black text-white">$150,000+</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Paid to Clippers</div>
            </div>
            <div className="w-full px-2 flex flex-col items-center">
              <div className="text-2xl sm:text-3xl font-black text-brand-cyan">18.5M+</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Verified Views</div>
            </div>
            <div className="w-full px-2 flex flex-col items-center">
              <div className="text-2xl sm:text-3xl font-black text-brand-cyan">3 Platforms</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">TikTok, IG & YouTube</div>
            </div>
            <div className="w-full px-2 flex flex-col items-center">
              <div className="text-2xl sm:text-3xl font-black text-white">8-Hour Sync</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Automated Tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* How Clipping Works */}
      <section id="how-it-works" className="py-24 bg-[#0A0F1D]/60 border-y border-slate-800/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-bold text-brand-cyan uppercase tracking-widest">Workflow</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              How You Earn on ClipEarn
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              A transparent, fraud-protected pipeline ensuring clippers get paid fairly for real attention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 relative group hover:border-brand-cyan/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Join Campaign</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Browse high-CPM campaigns, review brand requirements, and join with one click.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 relative group hover:border-brand-cyan/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 flex items-center justify-center text-brand-emerald font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Connect & Verify</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Add your unique bio code to verify social account ownership on TikTok, Instagram, or YouTube.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 relative group hover:border-brand-cyan/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Post & Submit</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload your video clip with the required tags, copy the published link, and submit for review.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 relative group hover:border-brand-cyan/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400 font-bold mb-4">
                4
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Track & Cash Out</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every 8 hours, our worker syncs your views and deposits earnings into your auditable balance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Campaigns Section */}
      <section id="campaigns" className="py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-bold text-brand-cyan uppercase tracking-widest">Active Budgets</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Featured Clipping Campaigns
            </h2>
            <div className="mt-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-cyan hover:underline"
              >
                Browse all campaigns <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleCampaigns.map((camp, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#0F141F] border border-slate-800 overflow-hidden group hover:border-slate-700 transition-all flex flex-col"
              >
                <div className="h-44 w-full relative overflow-hidden bg-slate-900">
                  <img
                    src={camp.image}
                    alt={camp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F141F] via-[#0F141F]/30 to-transparent" />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-brand-cyan">
                    {camp.cpm} CPM
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-brand-emerald font-semibold">
                      {camp.brand}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1 mb-3">{camp.name}</h3>

                    <div className="flex flex-wrap gap-2 mb-4" aria-label="Supported platforms">
                      {camp.platforms
                        .slice()
                        .sort((a, b) => (PLATFORM_PRIORITY[a] ?? 99) - (PLATFORM_PRIORITY[b] ?? 99))
                        .map((p, pidx) => (
                          <span
                            key={pidx}
                            className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/50 text-xs font-medium text-slate-300"
                          >
                            {p}
                          </span>
                        ))}
                    </div>

                    <div className="space-y-3 py-3 border-y border-slate-800/80 text-xs">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Budget Allocated</span>
                          <span className="text-white font-semibold">
                            {camp.used} <span className="text-slate-500 font-normal">/ {camp.budget}</span>
                          </span>
                        </div>
                        <div
                          className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"
                          role="progressbar"
                          aria-label={`${camp.name} budget allocated`}
                          aria-valuenow={Math.round((parseFloat(camp.used.replace(/[$,]/g, '')) / parseFloat(camp.budget.replace(/[$,]/g, ''))) * 100)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-brand-cyan to-brand-emerald rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.max(2, (parseFloat(camp.used.replace(/[$,]/g, '')) / parseFloat(camp.budget.replace(/[$,]/g, ''))) * 100))}%`
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Views Delivered</span>
                        <span className="text-white font-semibold">{camp.views}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/login"
                    className="mt-6 w-full py-2.5 px-4 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-black font-bold text-xs sm:text-sm transition-all shadow-[0_0_15px_-3px_rgba(28,247,253,0.3)] hover:shadow-[0_0_20px_-3px_rgba(28,247,253,0.5)] flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                  >
                    <span>Join Campaign</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-brand-cyan uppercase tracking-widest">Questions</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="rounded-2xl bg-[#0F141F] border border-slate-800/80 divide-y divide-slate-800/80 overflow-hidden shadow-sm">
            {faqs.map((faq, idx) => (
              <div key={idx} className="transition-colors">
                <button
                  id={`faq-btn-${idx}`}
                  aria-expanded={activeFaq === idx}
                  aria-controls={`faq-answer-${idx}`}
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-center text-sm sm:text-base font-semibold text-white hover:text-brand-cyan hover:bg-slate-900/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan group"
                >
                  <span className="pr-4">{faq.q}</span>
                  <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 group-hover:border-brand-cyan/50 group-hover:text-brand-cyan transition-all">
                    <Plus
                      className={`w-4 h-4 stroke-[2.5] transition-transform duration-200 ${
                        activeFaq === idx ? "rotate-45 text-brand-cyan" : ""
                      }`}
                    />
                  </span>
                </button>
                {activeFaq === idx && (
                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-btn-${idx}`}
                    className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-3"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-800 bg-[#05080E] text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <ClipEarnLogo size="sm" href="/" />
            <span className="text-slate-400">&copy; {new Date().getFullYear()} ClipEarn Inc. All rights reserved.</span>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
            <Link href="/privacy" className="text-slate-400 hover:text-slate-200 transition-colors">Privacy Policy</Link>
            <Link href="/data-deletion" className="text-slate-400 hover:text-slate-200 transition-colors">Data Deletion</Link>
            <Link href="/clipper/guidelines" className="text-slate-400 hover:text-slate-200 transition-colors">Guidelines</Link>
            <Link href="/manager/login" className="text-slate-400 hover:text-slate-200 transition-colors">Manager Login</Link>
            <Link href="/admin/login" className="text-slate-400 hover:text-slate-200 transition-colors">Admin Login</Link>
            <Link href="/login" className="text-slate-400 hover:text-slate-200 transition-colors">Clipper Sign In</Link>
          </nav>
        </div>
      </footer>

      {/* Brand Partnership Modal */}
      {brandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold text-white mb-2">Launch a Clipping Campaign</h3>
            <p className="text-xs text-slate-400 mb-6">
              Connect with our partnership team to allocate budget and deploy hundreds of verified clippers to scale your brand.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Thank you! Our brand partnership director will reach out within 2 hours.");
                setBrandModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 mb-1">Company / Brand Name</label>
                <input
                  required
                  placeholder="e.g. Acme Media"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Work Email</label>
                <input
                  required
                  type="email"
                  placeholder="marketing@acme.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Target Monthly Budget</label>
                <select className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white">
                  <option>$5,000 - $10,000</option>
                  <option>$10,000 - $25,000</option>
                  <option>$25,000 - $50,000</option>
                  <option>$50,000+</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand-cyan text-black font-bold hover:opacity-90"
                >
                  Request Consultation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
