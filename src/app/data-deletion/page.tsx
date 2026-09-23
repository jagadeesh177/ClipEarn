import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  Trash2,
  ShieldCheck,
  Mail,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Unlink,
  FileCheck2,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "User Data Deletion Instructions | ClipEarn",
  description:
    "Step-by-step instructions on how users can request the deletion of their personal data and social account connections from ClipEarn.",
};

export default function DataDeletionPage() {
  const lastUpdated = "September 24, 2026";

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col selection:bg-brand-cyan/20 selection:text-brand-cyan">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070A0F]/90 border-b border-slate-800/80 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <ClipEarnLogo size="md" href="/" />
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
              <Link href="/#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/#campaigns" className="hover:text-white transition-colors">
                Campaigns
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-black font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_-5px_rgba(28,247,253,0.3)]"
            >
              Clipper Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header Hero */}
        <div className="mb-12 border-b border-slate-800/80 pb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 mb-4">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Data Protection &amp; Compliance</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            User Data Deletion Instructions
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Effective Date: {lastUpdated}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Deletion Request Desk: clipearnbusiness@gmail.com</span>
            </div>
          </div>

          <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed">
            At <span className="font-semibold text-white">ClipEarn</span>, we respect your right to control your personal data. In compliance with developer platform requirements (including Meta Platform Terms, TikTok for Developers, and YouTube API Services) as well as global privacy laws (such as GDPR and CCPA/CPRA), this page provides clear instructions on how you can disconnect your social media accounts or request full deletion of your ClipEarn user profile and associated data.
          </p>
        </div>

        {/* Step-by-Step Deletion Methods */}
        <div className="space-y-12">
          {/* Method 1 */}
          <section className="rounded-2xl bg-[#0D131D] border border-slate-800 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-brand-cyan tracking-wider">Method 1 (Instant)</span>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  In-App Disconnect: Unlink Social Accounts
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              If you wish to stop ClipEarn from tracking your social channels without closing your entire account, you can instantly disconnect individual social accounts yourself at any time:
            </p>

            <ol className="space-y-4 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <span className="font-mono text-brand-cyan font-bold shrink-0 bg-slate-900 w-6 h-6 rounded flex items-center justify-center text-xs">1</span>
                <div>
                  <strong className="text-white">Log in to ClipEarn:</strong> Sign in with your Discord account at <Link href="/login" className="text-brand-cyan hover:underline">https://clipearn.vercel.app/login</Link>.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-brand-cyan font-bold shrink-0 bg-slate-900 w-6 h-6 rounded flex items-center justify-center text-xs">2</span>
                <div>
                  <strong className="text-white">Go to Social Accounts:</strong> Open the sidebar and click on <strong className="text-white">&quot;Social Accounts&quot;</strong> (or visit <Link href="/clipper/social-accounts" className="text-brand-cyan hover:underline">/clipper/social-accounts</Link>).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-brand-cyan font-bold shrink-0 bg-slate-900 w-6 h-6 rounded flex items-center justify-center text-xs">3</span>
                <div>
                  <strong className="text-white">Click &quot;Disconnect&quot;:</strong> Locate the connected TikTok, Instagram, or YouTube profile you wish to remove and click the <strong className="text-red-400">&quot;Disconnect&quot;</strong> button.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-brand-cyan font-bold shrink-0 bg-slate-900 w-6 h-6 rounded flex items-center justify-center text-xs">4</span>
                <div>
                  <strong className="text-white">Instant Unlinking:</strong> Your channel handle, public ID, and active tracking credentials are immediately removed from our active database.
                </div>
              </li>
            </ol>
          </section>

          {/* Method 2 */}
          <section className="rounded-2xl bg-[#0D131D] border border-slate-800 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-purple-400 tracking-wider">Method 2 (Complete Purge)</span>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Full Account &amp; Personal Data Deletion Request (Email)
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              If you want your entire ClipEarn account, Discord identity mapping, profile data, and associated records permanently erased from our systems, follow these simple steps:
            </p>

            <div className="p-5 rounded-xl bg-[#090E17] border border-slate-800/80 mb-6 space-y-3">
              <div className="text-xs text-slate-400">
                Send an email with the following details to our dedicated privacy desk:
              </div>
              <div className="text-sm font-mono text-brand-cyan bg-black/60 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between">
                <span>To: clipearnbusiness@gmail.com</span>
                <a href="mailto:clipearnbusiness@gmail.com?subject=ClipEarn%20Data%20Deletion%20Request" className="text-xs text-white hover:underline">Draft Email</a>
              </div>
              <div className="text-xs text-slate-300 space-y-1.5 pt-2">
                <div><strong className="text-white">Subject line:</strong> <code className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-200">Data Deletion Request - [Your Discord Username / ID]</code></div>
                <div><strong className="text-white">Body content to include:</strong></div>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Your Discord Username and 18-digit Discord ID (e.g. <code className="text-slate-300">jaxz / 123456789012345678</code>)</li>
                  <li>The registered email address associated with your Discord account</li>
                  <li>Any connected social handles (Instagram handle, TikTok username, or YouTube channel URL) you wish to confirm deleted</li>
                  <li>An explicit statement requesting the complete deletion of your ClipEarn account and records</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <Clock className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">30-Day Processing Window</strong>
                  <span className="text-slate-400">All authenticated deletion requests are verified and permanently fulfilled within 30 calendar days.</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <FileCheck2 className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Confirmation Notification</strong>
                  <span className="text-slate-400">Once your data has been purged from our databases, a confirmation email with a completion code will be sent to you.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Scope of What Is Deleted */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-cyan" />
              <span>What Data Is Permanently Deleted?</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              When an account deletion request is finalized, the following categories of data are irrevocably wiped from active production systems and caches:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Discord Identity &amp; Auth Tokens</span>
                </div>
                <p className="text-slate-400 pl-6">
                  Discord User ID, OAuth tokens, email, avatar URL, and stored session tokens are erased.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Social Account Handles &amp; Links</span>
                </div>
                <p className="text-slate-400 pl-6">
                  Connected Instagram, TikTok, and YouTube profile records, bio verification codes, and tracking references.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Unsubmitted Drafts &amp; Preferences</span>
                </div>
                <p className="text-slate-400 pl-6">
                  Saved drafts, clipper guidelines acceptance flags, and interface settings.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Support Messages &amp; Inquiry Logs</span>
                </div>
                <p className="text-slate-400 pl-6">
                  Past support communications and tickets associated with your user ID.
                </p>
              </div>
            </div>
          </section>

          {/* Legal / Financial Retention Exceptions */}
          <section className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Financial &amp; Statutory Audit Retention Notice</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Under applicable statutory regulations (including corporate accounting standards, anti-fraud rules, and tax compliance), ClipEarn is legally obligated to maintain historical records of <strong className="text-white">completed financial payouts, transaction hashes, and ledger disbursements</strong> for a retention period of up to 7 years.
            </p>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              When account deletion is fulfilled, these financial audit records are completely decoupled and anonymized from your active social accounts and personal identifiers, and are isolated strictly for regulatory compliance and audit purposes.
            </p>
          </section>

          {/* Revoking Access on Third-Party Platforms Directly */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Unlink className="w-5 h-5 text-brand-cyan" />
              <span>How to Revoke Permissions on Third-Party Platforms</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              You can also revoke ClipEarn&apos;s connection directly from each social platform&apos;s external security dashboard:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <div className="font-semibold text-white mb-1 flex items-center justify-between">
                  <span>Discord</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-slate-400 text-xs mb-2">
                  Go to Discord <strong className="text-white">User Settings &gt; Authorized Apps</strong>, find &quot;ClipEarn&quot;, and click <strong className="text-red-400">Deauthorize</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <div className="font-semibold text-white mb-1 flex items-center justify-between">
                  <span>Google / YouTube</span>
                  <Link
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-cyan inline-flex items-center gap-1"
                  >
                    Google Permissions <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-slate-400 text-xs mb-2">
                  Visit Google&apos;s Third-Party Apps with Account Access page and click &quot;Remove Access&quot; for ClipEarn.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <div className="font-semibold text-white mb-1 flex items-center justify-between">
                  <span>Meta / Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-slate-400 text-xs mb-2">
                  Go to Instagram <strong className="text-white">Settings &gt; Apps and Websites &gt; Active</strong>, select ClipEarn, and click <strong className="text-red-400">Remove</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <div className="font-semibold text-white mb-1 flex items-center justify-between">
                  <span>TikTok</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-slate-400 text-xs mb-2">
                  In the TikTok mobile app, go to <strong className="text-white">Profile &gt; Settings and Privacy &gt; Security &gt; Manage App Permissions</strong>, select ClipEarn, and remove access.
                </p>
              </div>
            </div>
          </section>

          {/* Need Assistance Card */}
          <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0D131D] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-cyan" />
                <span>Questions or Need Assistance?</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
                Our compliance and support staff will assist you with verifying account identity and processing deletion promptly.
              </p>
            </div>
            <a
              href="mailto:clipearnbusiness@gmail.com?subject=ClipEarn%20Data%20Deletion%20Inquiry"
              className="px-6 py-3 rounded-xl bg-brand-cyan hover:bg-[#1cf7fd] text-black font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_-5px_rgba(28,247,253,0.3)] shrink-0 flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-black" />
              <span>Contact Deletion Desk</span>
            </a>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-slate-800 bg-[#05080E] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <ClipEarnLogo size="sm" href="/" />
            <span className="text-slate-400">&copy; {new Date().getFullYear()} ClipEarn Inc. All rights reserved.</span>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 font-medium">
            <Link href="/privacy" className="text-slate-400 hover:text-slate-200 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/data-deletion" className="text-brand-cyan hover:underline">
              Data Deletion
            </Link>
            <Link href="/clipper/guidelines" className="text-slate-400 hover:text-slate-200 transition-colors">
              Guidelines
            </Link>
            <Link href="/manager/login" className="text-slate-400 hover:text-slate-200 transition-colors">
              Manager Login
            </Link>
            <Link href="/login" className="text-slate-400 hover:text-slate-200 transition-colors">
              Clipper Sign In
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
