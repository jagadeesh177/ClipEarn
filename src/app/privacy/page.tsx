import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ClipEarnLogo } from "@/components/ui/ClipEarnLogo";
import {
  Shield,
  Lock,
  FileText,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Mail,
  Database,
  Eye,
  RefreshCw,
  Globe,
  Share2,
  AlertTriangle,
  Clock,
  UserCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | ClipEarn",
  description:
    "Learn how ClipEarn collects, uses, protects, and handles your data for creator payouts and performance clipping.",
};

export default function PrivacyPolicyPage() {
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
              <Link href="/#faq" className="hover:text-white transition-colors">
                FAQ
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
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header Hero */}
        <div className="mb-12 border-b border-slate-800/80 pb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-xs font-semibold text-brand-cyan mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>Legal Documentation & Transparency</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            ClipEarn Privacy Policy
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Effective Date: {lastUpdated}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Privacy Contact: clipearnbusiness@gmail.com</span>
            </div>
          </div>

          <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-4xl">
            This Privacy Policy explains how <span className="font-semibold text-white">ClipEarn</span> (&quot;ClipEarn&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects, uses, discloses, and protects your information when you access or use our website (including <Link href="https://clipearn.vercel.app" className="text-brand-cyan underline underline-offset-4">https://clipearn.vercel.app</Link>), our creator clipping platform, social verification workflows, and view-based payout services.
          </p>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800/80">
            <Lock className="w-5 h-5 text-brand-cyan mb-2" />
            <h2 className="text-sm font-bold text-white mb-1">Zero Password Access</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never ask for, collect, or store your social media account passwords.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800/80">
            <Eye className="w-5 h-5 text-brand-cyan mb-2" />
            <h2 className="text-sm font-bold text-white mb-1">Public Analytics Only</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Only public video views and metrics required to compute earnings are tracked.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800/80">
            <Database className="w-5 h-5 text-brand-cyan mb-2" />
            <h2 className="text-sm font-bold text-white mb-1">Auditable Ledger</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Financial payouts are calculated via transparent, tamper-resistant snapshot records.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800/80">
            <UserCheck className="w-5 h-5 text-brand-cyan mb-2" />
            <h2 className="text-sm font-bold text-white mb-1">Full User Control</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant profile unlinking and dedicated 30-day data deletion requests.
            </p>
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-12 text-sm sm:text-base text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section id="section-1" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">01.</span>
              <span>Overview &amp; Scope</span>
            </h2>
            <p className="mb-4">
              ClipEarn operates a specialized creator marketplace and performance-based clipping platform. Our services enable content creators (&quot;clippers&quot;) to discover campaigns sponsored by brands and advertisers, post engaging short-form video clips on platforms including Instagram, TikTok, and YouTube, and earn monetary payouts based on verified view counts (CPM) delivered to campaigns.
            </p>
            <p>
              By accessing ClipEarn, authenticating with Discord, connecting social media account handles, or submitting video clip links, you acknowledge and agree to the data collection and processing practices described in this Privacy Policy.
            </p>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">02.</span>
              <span>Information We Collect</span>
            </h2>
            <p className="mb-4">
              To operate an authentic, fraud-resistant payout network, we collect information directly from you, from your authentication providers, and from public social media platform interfaces:
            </p>

            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Account &amp; Discord Information</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  When you sign in using Discord OAuth2, we receive your Discord User ID, Discord username, discriminator, profile avatar hash, and verified email address associated with your Discord account. We use this to establish your ClipEarn creator identity and prevent duplicate accounts.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Social Media Account Information</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  To attribute clip views to the legitimate channel owner, you connect social profiles (Instagram handles, TikTok usernames, or YouTube channel links). We generate a unique, non-sensitive verification string (e.g., <code className="bg-slate-900 px-1.5 py-0.5 rounded text-brand-cyan">clipearn-xxxxxx</code>) for you to temporarily place in your channel bio or profile. We verify this publicly available bio string to validate ownership. We never request, capture, or store your social account login credentials or private messages.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Campaign Submissions &amp; Video Content URLs</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  When you submit a clip for an active campaign, we collect the public URL of the published video (e.g., Instagram Reel URL, TikTok video URL, or YouTube Short/video URL), the timestamp of submission, the designated campaign ID, and any relevant campaign hashtags or requirements.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Views, Performance Analytics &amp; Earnings Data</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Our automated view sync engine captures historical view snapshots (scheduled every 8 hours) for approved video submissions. We record starting views, cumulative views, delta changes, and calculate payable creator earnings based on the campaign&apos;s published CPM rate. These calculations are recorded into an auditable financial transaction ledger.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Payment &amp; Payout Information</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  When requesting earnings cash-outs, you provide designated payout destinations (such as a cryptocurrency wallet address, PayPal identifier, or banking routing info as supported). We store payout histories, request statuses, timestamp records, and transaction hashes/IDs for financial audit and compliance.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Device, Security &amp; Log Information</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  We automatically record standard connection telemetry when you interact with our service: IP address, device type, operating system, browser user agent, referring URLs, and system error logs. This data is utilized strictly for system diagnostics, anti-fraud defense, and stopping bot networks.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">03.</span>
              <span>Third-Party Platform API Compliance</span>
            </h2>
            <p className="mb-4">
              ClipEarn interacts with third-party social media platform APIs to verify video existence, confirm view counts, and ensure legitimate metrics. We strictly abide by the developer policies and terms of each respective platform:
            </p>

            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">Meta / Instagram Platform Services</h3>
                  <span className="text-xs text-brand-cyan font-mono">Meta Graph API</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-3">
                  ClipEarn uses public Instagram data and Meta platform developer tools solely to confirm profile authenticity and inspect public video metrics. We do not transfer, sell, or license Meta user data to ad networks, data brokers, or independent third parties. Our integration complies with Meta&apos;s Platform Terms and Developer Policies.
                </p>
                <div className="text-xs text-slate-400">
                  Learn more about Meta&apos;s privacy practices at{" "}
                  <Link
                    href="https://www.facebook.com/privacy/policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-cyan hover:underline inline-flex items-center gap-1"
                  >
                    Meta Privacy Policy <ExternalLink className="w-3 h-3" />
                  </Link>.
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">YouTube API Services</h3>
                  <span className="text-xs text-brand-cyan font-mono">Google LLC</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-3">
                  ClipEarn utilizes YouTube API Services to access public video statistics (such as public view counts and publication dates) for submitted YouTube Shorts and videos. By utilizing YouTube clipping features on ClipEarn, users agree to be bound by the{" "}
                  <Link
                    href="https://www.youtube.com/t/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-cyan hover:underline inline-flex items-center gap-1"
                  >
                    YouTube Terms of Service <ExternalLink className="w-3 h-3" />
                  </Link>{" "}
                  and acknowledge that your information is handled in accordance with the{" "}
                  <Link
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-cyan hover:underline inline-flex items-center gap-1"
                  >
                    Google Privacy Policy <ExternalLink className="w-3 h-3" />
                  </Link>.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In addition to ClipEarn&apos;s internal deletion procedures, users can view and revoke ClipEarn&apos;s access to their YouTube data at any time via the{" "}
                  <Link
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-cyan hover:underline inline-flex items-center gap-1"
                  >
                    Google Security Settings Permissions Page <ExternalLink className="w-3 h-3" />
                  </Link>.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">TikTok for Developers</h3>
                  <span className="text-xs text-brand-cyan font-mono">TikTok Pte. Ltd.</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  ClipEarn interacts with TikTok developer interfaces strictly to verify user-submitted video IDs, public view counts, and profile links. We comply with TikTok Developer Terms of Service and Privacy Policy. We do not store private user videos, direct messages, or non-public personal information from TikTok.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0D131D] border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">Discord API Services</h3>
                  <span className="text-xs text-brand-cyan font-mono">Discord Inc.</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  ClipEarn uses Discord OAuth2 to authenticate clippers and managers. We adhere to the Discord Developer Terms of Service and Discord Developer Policy. We only access scopes authorized by the user during the OAuth consent screen (<code className="bg-slate-900 px-1.5 py-0.5 rounded text-brand-cyan">identify</code>, <code className="bg-slate-900 px-1.5 py-0.5 rounded text-brand-cyan">email</code>).
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">04.</span>
              <span>How We Use Your Information</span>
            </h2>
            <p className="mb-4">
              We process personal and performance data only for explicit and legitimate business purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li><strong className="text-white">Providing &amp; Maintaining the Platform:</strong> Managing your user account, enabling campaign discovery, clip submission, and manager approvals.</li>
              <li><strong className="text-white">Social Channel Ownership Verification:</strong> Validating that clippers own the social media profiles they link by checking public verification codes.</li>
              <li><strong className="text-white">Automated View Tracking &amp; Earnings Calculations:</strong> Executing periodic view synchronization routines (every 8 hours) to calculate payable amounts based on campaign CPM rules.</li>
              <li><strong className="text-white">Disbursing Payouts:</strong> Validating balances, recording ledger transitions, processing cash-out requests, and delivering payments.</li>
              <li><strong className="text-white">Fraud Prevention &amp; Platform Integrity:</strong> Detecting view bots, click farms, falsified metrics, multi-accounting, and syndicated sybil attacks.</li>
              <li><strong className="text-white">Customer Support &amp; System Communications:</strong> Resolving submission disputes, notifying clippers of campaign statuses, and responding to help requests.</li>
              <li><strong className="text-white">Legal &amp; Regulatory Compliance:</strong> Fulfilling tax reporting, anti-money laundering (AML), and financial accounting requirements.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="section-5" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">05.</span>
              <span>How Information Is Shared</span>
            </h2>
            <p className="mb-4">
              <strong className="text-white">We never sell, rent, or trade your personal information</strong> to data brokers, advertisers, or third-party marketing agencies. Information is shared only in the specific, limited scenarios below:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-1.5">With Campaign Managers &amp; Brands</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Campaign managers inspect your submitted clip URLs, social handle names, view counts, and approval statuses to confirm campaign delivery. They never receive your private credentials, email addresses, or unrelated payout details.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-1.5">With Trusted Infrastructure Providers</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We use SOC-2 compliant cloud infrastructure (including Vercel for hosting, PostgreSQL database hosts, and monitoring tools) that process encrypted data solely under our direct instructions.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-1.5">For Legal &amp; Safety Compliance</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We may disclose information if required to do so by applicable law, lawful subpoena, governmental inquiry, or when necessary to protect the rights, property, or physical safety of ClipEarn, our users, or the public.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-1.5">Business Transfers</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In the event of a merger, acquisition, reorganization, or sale of platform assets, user data may be transferred as a business asset, subject to standard confidentiality protections.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="section-6" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">06.</span>
              <span>Data Security &amp; Storage</span>
            </h2>
            <p className="mb-4">
              We implement comprehensive technical, administrative, and physical safeguards designed to preserve the confidentiality, integrity, and availability of your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li><strong className="text-white">Encryption in Transit:</strong> All HTTP network traffic is enforced over TLS 1.3 encryption (HTTPS).</li>
              <li><strong className="text-white">Encryption at Rest:</strong> Database records, ledger entries, and backups are encrypted at rest using industry-standard AES-256 encryption.</li>
              <li><strong className="text-white">Secure Session Cookies:</strong> Authentication tokens are stored in <code className="bg-slate-900 px-1.5 py-0.5 rounded text-brand-cyan">HttpOnly</code>, <code className="bg-slate-900 px-1.5 py-0.5 rounded text-brand-cyan">Secure</code>, and <code className="bg-slate-900 px-1.5 py-0.5 rounded text-brand-cyan">SameSite=Lax</code> cookies to prevent cross-site scripting (XSS) and cross-site request forgery (CSRF).</li>
              <li><strong className="text-white">Access Control:</strong> Administrative and manager access is strictly restricted by role-based access control (RBAC) and monitored with audit logs.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="section-7" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">07.</span>
              <span>Cookies &amp; Tracking Technologies</span>
            </h2>
            <p className="mb-4">
              ClipEarn uses strictly necessary cookies to operate authentication and session state. Specifically, we set an encrypted session cookie (<code className="bg-slate-900 px-1.5 py-0.5 rounded text-brand-cyan">clipearn_session</code>) when you sign in. This cookie allows our server to identify your active session across protected pages.
            </p>
            <p>
              We do <strong className="text-white">not</strong> utilize third-party advertising tracking cookies, retargeting pixels, or invasive behavioral fingerprinting tools. You may configure your browser to reject cookies, but doing so will prevent you from signing in to the Clipper or Manager dashboards.
            </p>
          </section>

          {/* Section 8 */}
          <section id="section-8" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">08.</span>
              <span>Data Retention &amp; Financial Ledger Records</span>
            </h2>
            <p className="mb-4">
              We retain personal data for as long as your account is active or as necessary to provide our services. You can disconnect your social media accounts or request account deletion at any time.
            </p>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Financial &amp; Tax Audit Retention Exception</span>
              </div>
              <p>
                In accordance with applicable corporate, anti-fraud, and tax accounting regulations, records of finalized payouts, transaction hashes, and immutable ledger balance entries must be retained for statutory audit periods (up to 7 years). In the event of an account deletion request, your profile and social connections will be purged, while ledger records are decoupled and archived strictly for statutory audit compliance.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section id="section-9" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">09.</span>
              <span>Your Privacy Rights (GDPR, CCPA/CPRA &amp; Global)</span>
            </h2>
            <p className="mb-4">
              Depending on your country or state of residence (including the European Economic Area, United Kingdom, and California), you possess specific privacy rights:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-1">Right to Access &amp; Portability</h3>
                <p className="text-xs text-slate-400">Request a copy of the personal and submission data ClipEarn holds regarding your account in an electronic format.</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-1">Right to Rectification</h3>
                <p className="text-xs text-slate-400">Correct inaccurate or outdated information in your profile or connected channel list.</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-1">Right to Erasure (&quot;Right to be Forgotten&quot;)</h3>
                <p className="text-xs text-slate-400">Request the permanent deletion of your account and personal data. Learn more on our dedicated <Link href="/data-deletion" className="text-brand-cyan hover:underline">Data Deletion Instructions page</Link>.</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0D131D] border border-slate-800">
                <h3 className="font-semibold text-white mb-1">Right to Restrict or Object</h3>
                <p className="text-xs text-slate-400">Object to specific processing activities or request restriction of processing in designated legal circumstances.</p>
              </div>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-slate-400">
              To exercise any of these rights, please email us at <a href="mailto:clipearnbusiness@gmail.com" className="text-brand-cyan hover:underline font-semibold">clipearnbusiness@gmail.com</a>. We respond to all verified requests within 30 days without discrimination.
            </p>
          </section>

          {/* Section 10 */}
          <section id="section-10" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">10.</span>
              <span>Children&apos;s Privacy</span>
            </h2>
            <p>
              ClipEarn is strictly intended for individuals who are at least 13 years of age (or 16 years of age in jurisdictions where required by local law). We do not knowingly collect or solicit personal information from children under 13. If we become aware that a child under the legal age has provided us with personal information, we will immediately delete that information and terminate the associated account. If you believe a minor has registered an account, contact us at <a href="mailto:clipearnbusiness@gmail.com" className="text-brand-cyan hover:underline">clipearnbusiness@gmail.com</a>.
            </p>
          </section>

          {/* Section 11 */}
          <section id="section-11" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">11.</span>
              <span>International Data Transfers</span>
            </h2>
            <p>
              ClipEarn&apos;s servers and core infrastructure are situated in the United States and globally distributed edge locations. If you access our platform from the European Union, United Kingdom, or other regions whose laws govern data collection and use, please note that your information may be transferred to and processed in jurisdictions where data protection laws may differ from those in your home country. We utilize standard contractual clauses and recognized transfer mechanisms to safeguard international data transfers.
            </p>
          </section>

          {/* Section 12 */}
          <section id="section-12" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">12.</span>
              <span>Changes to this Privacy Policy</span>
            </h2>
            <p>
              We may revise this Privacy Policy periodically to reflect changes in our service offerings, technical architecture, or legal requirements. When updates occur, we will revise the &quot;Effective Date&quot; at the top of this document. Continued use of ClipEarn after any changes constitutes your acceptance of the updated terms.
            </p>
          </section>

          {/* Section 13 */}
          <section id="section-13" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="text-brand-cyan font-mono text-base sm:text-lg">13.</span>
              <span>Contact Us</span>
            </h2>
            <p className="mb-4">
              If you have any questions, feedback, or concerns regarding this Privacy Policy or our data protection practices, please contact our Data Protection and Compliance team directly:
            </p>
            <div className="p-6 rounded-2xl bg-[#0D131D] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-white font-bold text-base mb-1">ClipEarn Privacy &amp; Compliance Team</div>
                <div className="text-sm text-slate-400">Direct Inquiries: <a href="mailto:clipearnbusiness@gmail.com" className="text-brand-cyan font-semibold hover:underline">clipearnbusiness@gmail.com</a></div>
                <div className="text-xs text-slate-500 mt-1">Platform URL: https://clipearn.vercel.app</div>
              </div>
              <a
                href="mailto:clipearnbusiness@gmail.com"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-colors flex items-center gap-2 shrink-0"
              >
                <Mail className="w-4 h-4 text-brand-cyan" />
                <span>Email Privacy Team</span>
              </a>
            </div>
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
            <Link href="/privacy" className="text-brand-cyan hover:underline">
              Privacy Policy
            </Link>
            <Link href="/data-deletion" className="text-slate-400 hover:text-slate-200 transition-colors">
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
