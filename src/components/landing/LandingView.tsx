"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import { ArrowRight, Menu, X } from "lucide-react";

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
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return num.toLocaleString();
}

function formatMoney(n: number, fractionDigits = 2): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

/* Example rows for the hero ledger. Labelled as example figures in the UI. */
const EXAMPLE_LEDGER = [
  { handle: "@frameshift", platform: "TikTok", views: 412_880, cpm: 1.5 },
  { handle: "@nightcuts", platform: "YouTube", views: 1_204_551, cpm: 1.2 },
  { handle: "@reelroom", platform: "Instagram", views: 96_310, cpm: 2.0 },
];

const STEPS = [
  {
    title: "Join a campaign",
    desc: "Each campaign shows its rate per 1,000 views, the platforms it allows and the brand's guidelines before you commit to anything.",
  },
  {
    title: "Post from your own account",
    desc: "Link your TikTok, Instagram or YouTube account once. You prove it's yours by putting a short code in your bio.",
  },
  {
    title: "Submit the link",
    desc: "Paste the URL of the published clip. A campaign manager checks it against the brief.",
  },
  {
    title: "Get paid as views come in",
    desc: "Once approved, ClipEarn reads the view count from the platform on a schedule and credits your balance at the campaign rate.",
  },
];

const VERIFICATION = [
  {
    title: "Your account, proven",
    desc: "Clips only count from social accounts you've verified with a one-time code in your bio. Nobody can submit another creator's video as their own.",
  },
  {
    title: "Views from the platform",
    desc: "View counts are read from YouTube, TikTok and Instagram directly. Nobody types in a number or uploads a screenshot.",
  },
  {
    title: "A person reviews every clip",
    desc: "A campaign manager approves each submission against the brief before it starts earning.",
  },
  {
    title: "Every cent on a ledger",
    desc: "Earnings, reversals and payouts are recorded as ledger entries, so a balance can always be traced back to the clips that earned it.",
  },
];

const FAQS = [
  {
    q: "What is ClipEarn?",
    a: "A marketplace where brands pay clippers per 1,000 verified views. Brands set a budget and a rate; clippers turn the brand's content into short-form videos and post them on their own accounts.",
  },
  {
    q: "How do clippers get paid?",
    a: "You earn the campaign's rate for every 1,000 eligible views on an approved clip. Earnings land in your balance as views are verified, and you can withdraw to the payout account you've set up.",
  },
  {
    q: "How are views verified?",
    a: "ClipEarn reads view counts from TikTok, Instagram Reels and YouTube Shorts on a schedule and keeps a snapshot each time, so earnings are based on what the platform reports.",
  },
  {
    q: "Which platforms are supported?",
    a: "TikTok, Instagram Reels and YouTube (Shorts and regular videos). Each campaign lists which of these it accepts.",
  },
  {
    q: "How do I verify my social account?",
    a: "When you link an account, ClipEarn gives you a short code. Put it in your profile bio, press Verify, and once we find it the account is yours to submit from. You can remove the code afterwards.",
  },
  {
    q: "Can brands run their own campaigns?",
    a: "Yes. Brands set the budget, the rate per 1,000 views, the allowed platforms, an optional cap per clip and the content guidelines.",
  },
];

const NAV_LINKS = [
  { href: "#how-it-works", label: "How payouts work" },
  { href: "#campaigns", label: "Campaigns" },
  { href: "#for-brands", label: "For brands" },
  { href: "#faq", label: "FAQ" },
];

/* Shared control styles: colour changes on hover (never a fade), scale on press. */
const btnPrimary =
  "press inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-[var(--signal)] text-[var(--ink-0)] font-semibold text-[15px] hover:bg-[#8afcfe] active:bg-[var(--signal-press)]";
const btnSecondary =
  "press inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl border border-[var(--line-strong)] text-[var(--fg)] font-semibold text-[15px] hover:bg-[var(--ink-2)] hover:border-[#41566a]";
const navLink =
  "rounded-md px-1 py-1 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors duration-150";

function SectionHeading({
  id,
  title,
  lede,
}: {
  id?: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="max-w-2xl">
      <h2
        id={id}
        className="font-display text-[clamp(1.875rem,4vw,3rem)] font-extrabold leading-[1.05] text-white"
      >
        {title}
      </h2>
      {lede && <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--fg-muted)]">{lede}</p>}
    </div>
  );
}

export default function LandingView({ campaigns }: LandingViewProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /* Brand modal, driven by the transitions.dev modal recipe (.is-open / .is-closing). */
  const [modalMounted, setModalMounted] = useState(false);
  const [modalState, setModalState] = useState<"opening" | "open" | "closing">("opening");
  const [modalSubmitted, setModalSubmitted] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const openBrandModal = useCallback(() => {
    setModalSubmitted(false);
    setModalMounted(true);
    setModalState("opening");
    // Next frame: flip to .is-open so the scale/opacity transition runs.
    requestAnimationFrame(() => requestAnimationFrame(() => setModalState("open")));
  }, []);

  const closeBrandModal = useCallback(() => {
    setModalState("closing");
    const closeMs =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--modal-close-dur")) || 150;
    window.setTimeout(() => {
      setModalMounted(false);
      setModalSubmitted(false);
    }, closeMs);
  }, []);

  useEffect(() => {
    if (!modalMounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBrandModal();
    };
    window.addEventListener("keydown", onKey);
    if (modalState === "open") firstFieldRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [modalMounted, modalState, closeBrandModal]);

  const ledgerTotal = EXAMPLE_LEDGER.reduce((sum, r) => sum + Math.round((r.views / 1000) * r.cpm * 100) / 100, 0);

  return (
    <div className="min-h-screen bg-[var(--ink-0)] text-[var(--fg)] flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-[var(--ink-0)] border-b border-[var(--line)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <ClipEarnLogo size="md" href="/" />

          <nav aria-label="Primary" className="hidden lg:flex items-center gap-7 text-sm font-medium">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className={navLink}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-5 shrink-0">
            <Link href="/manager/login" className={`${navLink} text-sm font-medium`}>
              Manager login
            </Link>
            <Link href="/login" className={`${btnPrimary} min-h-[40px] px-4 text-sm`}>
              Start clipping
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="press sm:hidden -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--fg)] hover:bg-[var(--ink-2)]"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="sm:hidden border-t border-[var(--line)] px-4 pb-5 pt-2">
            <nav aria-label="Mobile" className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-base font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] border-b border-[var(--line)]"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="mt-5 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={btnPrimary}>
                Start clipping
              </Link>
              <Link href="/manager/login" onClick={() => setMobileMenuOpen(false)} className={btnSecondary}>
                Manager login
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section aria-labelledby="hero-title" className="border-b border-[var(--line)]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 pb-20 sm:pt-24 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <h1
                id="hero-title"
                className="font-display text-[clamp(2.5rem,6.2vw,5.25rem)] font-extrabold leading-[0.98] text-white"
              >
                Get paid for every thousand views your clips pull.
              </h1>
              <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-[var(--fg-muted)]">
                Pick a campaign, post the clip on your own TikTok, Instagram or YouTube account, and ClipEarn pays
                the campaign&apos;s rate for every 1,000 views it verifies with the platform.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link href="/login" className={btnPrimary}>
                  Start clipping
                  <ArrowRight className="h-4 w-4 -mr-0.5" strokeWidth={2.25} aria-hidden />
                </Link>
                <button type="button" onClick={openBrandModal} className={btnSecondary}>
                  Launch a campaign
                </button>
              </div>
            </div>

            {/* Example payout ledger: the page's single authored motion moment */}
            <figure className="lg:col-span-5 rounded-2xl border border-[var(--line)] bg-[var(--ink-1)] shadow-raised">
              <figcaption className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
                <span className="text-sm font-semibold text-white">Payout ledger</span>
                <span className="text-xs text-[var(--fg-subtle)]">Example figures</span>
              </figcaption>
              <table className="w-full text-[13px] sm:text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--fg-subtle)]">
                    <th scope="col" className="px-4 sm:px-5 pt-4 pb-2 font-medium">Clip</th>
                    <th scope="col" className="px-1 sm:px-2 pt-4 pb-2 font-medium text-right">Views</th>
                    <th scope="col" className="px-4 sm:px-5 pt-4 pb-2 font-medium text-right">Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLE_LEDGER.map((row, i) => {
                    const earned = Math.round((row.views / 1000) * row.cpm * 100) / 100;
                    return (
                      <tr
                        key={row.handle}
                        className="ledger-row border-t border-[var(--line)]"
                        style={{ "--row": i } as React.CSSProperties}
                      >
                        <td className="px-4 sm:px-5 py-3.5">
                          <div className="font-medium text-white">{row.handle}</div>
                          <div className="text-xs text-[var(--fg-subtle)]">
                            {row.platform} · {formatMoney(row.cpm)}/1K
                          </div>
                        </td>
                        <td className="px-1 sm:px-2 py-3.5 text-right whitespace-nowrap text-[var(--fg-muted)]">{row.views.toLocaleString("en-US")}</td>
                        <td className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap font-semibold text-white">{formatMoney(earned)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr
                    className="ledger-row border-t border-[var(--line-strong)]"
                    style={{ "--row": EXAMPLE_LEDGER.length } as React.CSSProperties}
                  >
                    <th scope="row" colSpan={2} className="px-4 sm:px-5 py-4 text-left text-sm font-medium text-[var(--fg-muted)]">
                      Balance
                    </th>
                    <td className="px-4 sm:px-5 py-4 text-right whitespace-nowrap font-display text-xl sm:text-2xl font-extrabold text-[var(--signal)]">
                      {formatMoney(ledgerTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </figure>
          </div>
        </section>

        {/* How payouts work */}
        <section aria-labelledby="how-title" id="how-it-works" className="scroll-mt-16 border-b border-[var(--line)]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <SectionHeading
              id="how-title"
              title="The rate is fixed before you post. The views decide the rest."
              lede="Every campaign publishes one number up front: what it pays per 1,000 views. There's no bidding, no follower minimum and no guessing what a clip is worth."
            />

            {/* The payout formula, worked through once */}
            <div
              className="mt-12 rounded-2xl border border-[var(--line)] bg-[var(--ink-1)] px-5 py-7 sm:px-8 sm:py-9"
              role="img"
              aria-label="Example: 250,000 verified views divided by 1,000, times a $1.50 rate, equals $375.00"
            >
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-end gap-x-6 gap-y-6 sm:gap-x-8" aria-hidden>
                <div>
                  <div className="font-display tabular text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-none text-white">
                    250,000
                  </div>
                  <div className="mt-2 text-sm text-[var(--fg-subtle)]">verified views</div>
                </div>
                <div className="hidden sm:block pb-6 text-2xl text-[var(--fg-subtle)]">÷ 1,000 ×</div>
                <div>
                  <div className="font-display tabular text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-none text-white">
                    $1.50
                  </div>
                  <div className="mt-2 text-sm text-[var(--fg-subtle)]">campaign rate</div>
                </div>
                <div className="hidden sm:block pb-6 text-2xl text-[var(--fg-subtle)]">=</div>
                <div className="col-span-2 sm:col-span-1 border-t border-[var(--line)] pt-6 sm:border-0 sm:pt-0">
                  <div className="font-display tabular text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-none text-[var(--signal)]">
                    $375.00
                  </div>
                  <div className="mt-2 text-sm text-[var(--fg-subtle)]">in your balance</div>
                </div>
              </div>
            </div>

            <ol className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-x-12">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-5 border-t border-[var(--line)] py-7">
                  <span className="tabular w-6 shrink-0 pt-0.5 text-sm font-semibold text-[var(--fg-subtle)]" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-[var(--fg-muted)]">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Live campaigns */}
        <section aria-labelledby="campaigns-title" id="campaigns" className="scroll-mt-16 border-b border-[var(--line)] bg-[var(--ink-1)]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <SectionHeading
              id="campaigns-title"
              title="Live campaigns"
              lede="These are paying right now. Rates and remaining budget update as clips earn."
            />

            {campaigns.length === 0 ? (
              <div className="mt-12 max-w-xl border-t border-[var(--line)] pt-8">
                <h3 className="text-xl font-semibold text-white">No campaigns are live this minute.</h3>
                <p className="mt-3 leading-relaxed text-[var(--fg-muted)]">
                  New ones open regularly. Create your account and verify your social accounts now so you can submit
                  the day the next one launches.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <Link href="/login" className={btnPrimary}>
                    Create a clipper account
                  </Link>
                  <button type="button" onClick={openBrandModal} className={btnSecondary}>
                    Launch a campaign
                  </button>
                </div>
              </div>
            ) : (
              <ul className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {campaigns.map((camp) => {
                  const budgetPercent =
                    camp.total_budget > 0
                      ? Math.min(100, Math.max(0, (camp.used_budget / camp.total_budget) * 100))
                      : 0;
                  const remaining = Math.max(0, camp.total_budget - camp.used_budget);
                  const platforms = (camp.allowed_platforms || [])
                    .map((p) => PLATFORM_LABELS[p] || p)
                    .sort((a, b) => (PLATFORM_PRIORITY[a] ?? 99) - (PLATFORM_PRIORITY[b] ?? 99));

                  return (
                    <li
                      key={camp.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink-0)] transition-colors duration-150 hover:border-[var(--line-strong)]"
                    >
                      <div className="relative aspect-[16/9] bg-[var(--ink-2)]">
                        {camp.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={camp.image_url}
                            alt=""
                            className="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-6 text-center">
                            <span className="font-display text-2xl font-extrabold uppercase text-[var(--fg-subtle)] line-clamp-2">
                              {camp.brand_name || camp.name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <p className="text-sm text-[var(--fg-subtle)]">{camp.brand_name}</p>
                        <h3 className="mt-1 text-lg font-semibold text-white line-clamp-2">{camp.name}</h3>

                        <p className="mt-4">
                          <span className="font-display tabular text-3xl font-extrabold text-[var(--signal)]">
                            {formatMoney(camp.cpm)}
                          </span>
                          <span className="ml-1.5 text-sm text-[var(--fg-muted)]">per 1,000 views</span>
                        </p>

                        {platforms.length > 0 && (
                          <p className="mt-2 text-sm text-[var(--fg-muted)]">{platforms.join(" · ")}</p>
                        )}

                        <dl className="mt-5 space-y-3 border-t border-[var(--line)] pt-5 text-sm">
                          <div>
                            <div className="flex items-baseline justify-between gap-4">
                              <dt className="text-[var(--fg-subtle)]">Budget left</dt>
                              <dd className="tabular font-medium text-white">
                                {formatMoney(remaining, 0)}
                                <span className="font-normal text-[var(--fg-subtle)]"> of {formatMoney(camp.total_budget, 0)}</span>
                              </dd>
                            </div>
                            <div
                              className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ink-2)]"
                              role="progressbar"
                              aria-label={`${camp.name} budget used`}
                              aria-valuenow={Math.round(budgetPercent)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="h-full rounded-full bg-[var(--signal)]"
                                style={{ width: `${Math.max(camp.used_budget > 0 ? 2 : 0, budgetPercent)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-baseline justify-between gap-4">
                            <dt className="text-[var(--fg-subtle)]">Views paid so far</dt>
                            <dd className="tabular font-medium text-white">
                              {formatCompactNumber(camp.total_approved_views)}
                              {camp.max_payable_views > 0 && (
                                <span className="font-normal text-[var(--fg-subtle)]">
                                  {" "}of {formatCompactNumber(camp.max_payable_views)}
                                </span>
                              )}
                            </dd>
                          </div>
                        </dl>

                        <Link
                          href={`/login?redirect=/clipper/campaigns/${camp.id}`}
                          className={`${btnPrimary} mt-6 w-full min-h-[44px] text-sm`}
                          aria-label={`Join ${camp.name}`}
                        >
                          Join campaign
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* For brands */}
        <section aria-labelledby="brands-title" id="for-brands" className="scroll-mt-16 border-b border-[var(--line)]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <SectionHeading
                id="brands-title"
                title="For brands: pay for views that actually happened."
                lede="Hand ClipEarn your long-form content and a budget. Clippers cut it into short-form videos and post them on accounts that already have an audience. You pay only for the views those clips earn."
              />
              <button type="button" onClick={openBrandModal} className={`${btnPrimary} mt-9`}>
                Launch a campaign
              </button>
            </div>

            <dl className="lg:col-span-6 lg:col-start-7 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              <div className="py-7">
                <dt className="text-lg font-semibold text-white">You set the rate and the ceiling</dt>
                <dd className="mt-2 leading-relaxed text-[var(--fg-muted)]">
                  Choose what you pay per 1,000 views, your total budget, and an optional cap on views per clip. The
                  campaign pauses itself when the budget is spent.
                </dd>
              </div>
              <div className="py-7">
                <dt className="text-lg font-semibold text-white">Real accounts, not bought reach</dt>
                <dd className="mt-2 leading-relaxed text-[var(--fg-muted)]">
                  Clips are posted from verified TikTok, Instagram and YouTube accounts, and your team approves each one
                  before it can earn.
                </dd>
              </div>
              <div className="py-7">
                <dt className="text-lg font-semibold text-white">Numbers you can audit</dt>
                <dd className="mt-2 leading-relaxed text-[var(--fg-muted)]">
                  Views are pulled from the platforms on a schedule and kept as snapshots. Export any campaign to see
                  exactly what was paid, per clip.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Verification */}
        <section aria-labelledby="trust-title" id="for-clippers" className="scroll-mt-16 border-b border-[var(--line)] bg-[var(--ink-1)]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <SectionHeading id="trust-title" title="How the numbers stay honest" />
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-x-12">
              {VERIFICATION.map((item) => (
                <div key={item.title} className="border-t border-[var(--line)] py-7">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 max-w-[60ch] leading-relaxed text-[var(--fg-muted)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" id="faq" className="scroll-mt-16 border-b border-[var(--line)]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <SectionHeading id="faq-title" title="Questions" />
            </div>
            <div className="lg:col-span-8 border-b border-[var(--line)]">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                const panelId = `faq-panel-${idx}`;
                const headId = `faq-head-${idx}`;
                return (
                  <div key={faq.q} className="t-acc border-t border-[var(--line)]" data-open={isOpen ? "true" : "false"}>
                    <h3>
                      <button
                        id={headId}
                        type="button"
                        className="t-acc-head flex w-full items-center justify-between gap-6 py-5 text-left text-base sm:text-lg font-semibold text-white hover:text-[var(--signal)] transition-colors duration-150"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                      >
                        {faq.q}
                        <span className="t-acc-chevron shrink-0 text-[var(--fg-subtle)]" aria-hidden>
                          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 6.5L8 10.5L12 6.5" />
                          </svg>
                        </span>
                      </button>
                    </h3>
                    <div id={panelId} role="region" aria-labelledby={headId} className="t-acc-panel">
                      <div className="t-acc-panel-inner">
                        <p className="max-w-[62ch] pb-6 leading-relaxed text-[var(--fg-muted)]">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section aria-labelledby="cta-title">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-24 sm:py-32">
            <h2
              id="cta-title"
              className="max-w-4xl font-display text-[clamp(2.25rem,5.5vw,4.5rem)] font-extrabold leading-[1] text-white"
            >
              Your next clip could already be earning.
            </h2>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link href="/login" className={btnPrimary}>
                Start clipping
                <ArrowRight className="h-4 w-4 -mr-0.5" strokeWidth={2.25} aria-hidden />
              </Link>
              <Link href="/clipper/guidelines" className={btnSecondary}>
                Read the clipper guidelines
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] text-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-10">
            <div className="col-span-2 md:col-span-5">
              <ClipEarnLogo size="md" href="/" />
              <p className="mt-4 max-w-sm leading-relaxed text-[var(--fg-muted)]">
                Brands pay per 1,000 verified views. Clippers post on their own accounts and get paid for what their
                clips earn.
              </p>
            </div>
            <nav aria-label="Platform" className="md:col-span-2 md:col-start-7">
              <h2 className="font-semibold text-white">Platform</h2>
              <ul className="mt-4 space-y-3 text-[var(--fg-muted)]">
                <li><a href="#how-it-works" className="hover:text-white transition-colors duration-150">How payouts work</a></li>
                <li><a href="#campaigns" className="hover:text-white transition-colors duration-150">Campaigns</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors duration-150">FAQ</a></li>
              </ul>
            </nav>
            <nav aria-label="Accounts" className="md:col-span-2">
              <h2 className="font-semibold text-white">Accounts</h2>
              <ul className="mt-4 space-y-3 text-[var(--fg-muted)]">
                <li><Link href="/login" className="hover:text-white transition-colors duration-150">Clipper login</Link></li>
                <li><Link href="/clipper/guidelines" className="hover:text-white transition-colors duration-150">Clipper guidelines</Link></li>
                <li><Link href="/manager/login" className="hover:text-white transition-colors duration-150">Manager login</Link></li>
                <li><Link href="/admin/login" className="hover:text-white transition-colors duration-150">Admin login</Link></li>
              </ul>
            </nav>
            <nav aria-label="Legal" className="md:col-span-2">
              <h2 className="font-semibold text-white">Legal</h2>
              <ul className="mt-4 space-y-3 text-[var(--fg-muted)]">
                <li><Link href="/privacy" className="hover:text-white transition-colors duration-150">Privacy policy</Link></li>
                <li><Link href="/data-deletion" className="hover:text-white transition-colors duration-150">Data deletion</Link></li>
              </ul>
            </nav>
          </div>
          <p className="mt-14 border-t border-[var(--line)] pt-6 text-[var(--fg-subtle)]">
            &copy; {new Date().getFullYear()} ClipEarn. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Brand campaign modal (transitions.dev modal recipe) */}
      {modalMounted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/70 transition-opacity"
          style={{
            opacity: modalState === "open" ? 1 : 0,
            transitionDuration: modalState === "closing" ? "var(--modal-close-dur)" : "var(--modal-open-dur)",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeBrandModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-modal-title"
            className={`t-modal ${modalState === "open" ? "is-open" : ""} ${modalState === "closing" ? "is-closing" : ""} relative my-8 w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--ink-1)] p-6 sm:p-8 shadow-overlay`}
          >
            <button
              type="button"
              onClick={closeBrandModal}
              className="press absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--fg-subtle)] hover:bg-[var(--ink-2)] hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>

            {modalSubmitted ? (
              <div className="py-4">
                <h3 id="brand-modal-title" className="pr-10 text-xl font-semibold text-white">
                  Thanks, we&apos;ve got your details.
                </h3>
                <p className="mt-3 leading-relaxed text-[var(--fg-muted)]">
                  We&apos;ll reply to the email you gave us to set up your campaign.
                </p>
                <button type="button" onClick={closeBrandModal} className={`${btnPrimary} mt-7 w-full sm:w-auto`}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 id="brand-modal-title" className="pr-10 text-xl font-semibold text-white">
                  Launch a campaign
                </h3>
                <p className="mt-2 leading-relaxed text-[var(--fg-muted)]">
                  Tell us who you are and roughly what you want to spend. We&apos;ll get back to you to set the rate,
                  platforms and guidelines.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setModalSubmitted(true);
                  }}
                  className="mt-7 space-y-5 text-sm"
                >
                  <div>
                    <label htmlFor="brand-name" className="block font-medium text-[var(--fg)]">
                      Company or brand
                    </label>
                    <input
                      ref={firstFieldRef}
                      id="brand-name"
                      required
                      autoComplete="organization"
                      placeholder="Acme Media"
                      className="mt-2 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--ink-0)] px-3.5 py-3 text-white placeholder:text-[var(--fg-subtle)] focus:border-[var(--signal)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="brand-email" className="block font-medium text-[var(--fg)]">
                      Work email
                    </label>
                    <input
                      id="brand-email"
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="you@acme.com"
                      className="mt-2 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--ink-0)] px-3.5 py-3 text-white placeholder:text-[var(--fg-subtle)] focus:border-[var(--signal)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="brand-budget" className="block font-medium text-[var(--fg)]">
                      Monthly budget
                    </label>
                    <select
                      id="brand-budget"
                      className="mt-2 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--ink-0)] px-3.5 py-3 text-white focus:border-[var(--signal)] focus:outline-none"
                    >
                      <option>$5,000 to $10,000</option>
                      <option>$10,000 to $25,000</option>
                      <option>$25,000 to $50,000</option>
                      <option>Over $50,000</option>
                    </select>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                    <button type="button" onClick={closeBrandModal} className={`${btnSecondary} min-h-[44px] text-sm`}>
                      Cancel
                    </button>
                    <button type="submit" className={`${btnPrimary} min-h-[44px] text-sm`}>
                      Send details
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
