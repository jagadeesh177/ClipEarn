"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Wallet,
  Building,
  Mail,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function ClipperPaymentDetailsPage() {
  const [provider, setProvider] = useState<"PAYPAL" | "BANK_TRANSFER" | "CRYPTO">("PAYPAL");
  const [accountReference, setAccountReference] = useState("");
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("TRC20");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  useEffect(() => {
    fetchPaymentDetails();
  }, []);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clipper/payment-details");
      const json = await res.json();
      if (res.ok && json.data) {
        setHasExistingProfile(true);
        const prov = json.data.provider;
        if (prov === "PAYPAL" || prov === "BANK_TRANSFER" || prov === "CRYPTO") {
          setProvider(prov);
        }
        setAccountReference(json.data.accountReference || "");
      }
    } catch {
      // Ignore initial load failure
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!accountReference.trim()) {
      setStatusMessage({
        type: "error",
        text: provider === "PAYPAL"
          ? "Please enter a valid PayPal email address."
          : provider === "CRYPTO"
          ? "Please enter your wallet address."
          : "Please enter your bank account or IBAN number.",
      });
      return;
    }

    try {
      setSaving(true);
      const extraDetails: any = {};
      if (provider === "BANK_TRANSFER") {
        if (bankName) extraDetails.bankName = bankName.trim();
        if (routingNumber) extraDetails.routingNumber = routingNumber.trim();
      } else if (provider === "CRYPTO") {
        extraDetails.network = cryptoNetwork;
      }

      const res = await fetch("/api/clipper/payment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          accountReference: accountReference.trim(),
          extraDetails,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save payment details.");
      }

      setHasExistingProfile(true);
      setStatusMessage({
        type: "success",
        text: "Payment details saved securely! You are eligible to receive payouts once campaign thresholds are reached.",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "An unexpected error occurred while saving.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">Payment Details</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Private & Secure
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure your payout destination for campaign view earnings.
          </p>
        </div>
        <Link
          href="/clipper/earnings"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-700 transition"
        >
          View Earnings & History <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-2xl bg-[#0D131D] border border-brand-cyan/20 flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white">Zero-Knowledge Financial Security</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Your payment account identifier is encrypted and kept private. Campaign managers and other clippers cannot see your payment information. It is strictly used by administrators to transfer approved campaign payouts.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-cyan" />
          <span className="text-xs">Loading secure payment profile...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300">
              Select Payout Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* PayPal */}
              <button
                type="button"
                onClick={() => setProvider("PAYPAL")}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  provider === "PAYPAL"
                    ? "bg-brand-cyan/10 border-brand-cyan/50 text-white shadow-lg shadow-brand-cyan/5"
                    : "bg-[#0D131D] border-slate-800/80 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className={`p-2 rounded-lg ${provider === "PAYPAL" ? "bg-brand-cyan/20 text-brand-cyan" : "bg-slate-800/80 text-slate-400"}`}>
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">PayPal</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Instant transfer via email</div>
                </div>
              </button>

              {/* Bank Transfer */}
              <button
                type="button"
                onClick={() => setProvider("BANK_TRANSFER")}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  provider === "BANK_TRANSFER"
                    ? "bg-brand-cyan/10 border-brand-cyan/50 text-white shadow-lg shadow-brand-cyan/5"
                    : "bg-[#0D131D] border-slate-800/80 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className={`p-2 rounded-lg ${provider === "BANK_TRANSFER" ? "bg-brand-cyan/20 text-brand-cyan" : "bg-slate-800/80 text-slate-400"}`}>
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Bank Transfer</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">ACH / Wire / IBAN</div>
                </div>
              </button>

              {/* Crypto */}
              <button
                type="button"
                onClick={() => setProvider("CRYPTO")}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  provider === "CRYPTO"
                    ? "bg-brand-cyan/10 border-brand-cyan/50 text-white shadow-lg shadow-brand-cyan/5"
                    : "bg-[#0D131D] border-slate-800/80 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className={`p-2 rounded-lg ${provider === "CRYPTO" ? "bg-brand-cyan/20 text-brand-cyan" : "bg-slate-800/80 text-slate-400"}`}>
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Crypto (USDT)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">TRC20 / ERC20</div>
                </div>
              </button>
            </div>
          </div>

          {/* Form Fields Based on Provider */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0D131D] border border-slate-800/80 space-y-4">
            {provider === "PAYPAL" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  PayPal Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={accountReference}
                  onChange={(e) => setAccountReference(e.target.value)}
                  placeholder="your-paypal@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan transition"
                />
                <p className="text-[11px] text-slate-500">
                  Payouts will be sent directly to this PayPal account upon administrator approval.
                </p>
              </div>
            )}

            {provider === "BANK_TRANSFER" && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Account Holder Name / Bank Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. John Doe - Chase Bank"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Account Number / IBAN <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountReference}
                    onChange={(e) => setAccountReference(e.target.value)}
                    placeholder="Account Number or IBAN"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Routing Number / SWIFT Code
                  </label>
                  <input
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="9-digit Routing Number or SWIFT/BIC code"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan transition"
                  />
                </div>
              </div>
            )}

            {provider === "CRYPTO" && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Network
                  </label>
                  <select
                    value={cryptoNetwork}
                    onChange={(e) => setCryptoNetwork(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-cyan transition"
                  >
                    <option value="TRC20">USDT (TRC20 - Tron Network) - Recommended</option>
                    <option value="ERC20">USDT (ERC20 - Ethereum Network)</option>
                    <option value="POLYGON">USDT / USDC (Polygon Network)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Wallet Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountReference}
                    onChange={(e) => setAccountReference(e.target.value)}
                    placeholder="e.g. T..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan transition font-mono"
                  />
                  <p className="text-[11px] text-amber-400/80">
                    Ensure your address strictly matches the selected network to prevent loss of funds.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              {hasExistingProfile
                ? "You can update your payment profile at any time before payment processing."
                : "No payment details configured yet."}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-cyan text-slate-950 hover:bg-brand-cyan/90 transition shadow-lg shadow-brand-cyan/10 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" /> Save Payment Details
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
