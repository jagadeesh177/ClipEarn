"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Send,
  X,
  Check,
} from "lucide-react";

export default function AdminPayoutsPage() {
  const [eligibilityItems, setEligibilityItems] = useState<any[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ELIGIBLE_ONLY" | "ALL" | "HISTORY">("ELIGIBLE_ONLY");
  const [search, setSearch] = useState("");

  // Pay Action Modal
  const [selectedPayItem, setSelectedPayItem] = useState<any | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [confirmModalPayout, setConfirmModalPayout] = useState<any | null>(null);
  const [transactionIdInput, setTransactionIdInput] = useState("");
  const [confirmingPaid, setConfirmingPaid] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPayoutsData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payouts");
      const json = await res.json();
      if (res.ok && json.data) {
        setEligibilityItems(json.data.eligibilityItems || []);
        setPayoutHistory(json.data.payoutHistory || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutsData();
  }, []);

  // Step 1: Admin initiates payment -> transitions to PROCESSING
  const handleInitiatePayout = async () => {
    if (!selectedPayItem) return;
    try {
      setInitiating(true);
      setStatusMessage(null);

      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedPayItem.campaignId,
          userId: selectedPayItem.userId,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to initiate payout.");
      }

      setStatusMessage({
        type: "success",
        text: `Payout of $${selectedPayItem.earnings.toFixed(2)} initiated for ${selectedPayItem.username}. State transitioned to PROCESSING.`,
      });

      const initiatedRecord = json.payout;
      setSelectedPayItem(null);
      await fetchPayoutsData();

      // Open the confirmation step
      setConfirmModalPayout(initiatedRecord);
      setTransactionIdInput(`TXN-${Date.now().toString(36).toUpperCase()}`);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to initiate payout.",
      });
    } finally {
      setInitiating(false);
    }
  };

  // Step 2: Admin confirms payment sent -> transitions to PAID
  const handleConfirmPaid = async () => {
    if (!confirmModalPayout) return;
    try {
      setConfirmingPaid(true);
      setStatusMessage(null);

      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: confirmModalPayout.id,
          action: "CONFIRM_PAID",
          transactionId: transactionIdInput.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to confirm payment.");
      }

      setStatusMessage({
        type: "success",
        text: `Payout confirmed and marked as PAID with transaction reference ${transactionIdInput.trim()}.`,
      });

      setConfirmModalPayout(null);
      await fetchPayoutsData();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to confirm payment.",
      });
    } finally {
      setConfirmingPaid(false);
    }
  };

  // Filter items
  const filteredPayableItems = eligibilityItems.filter((item) => {
    const matchesSearch =
      item.username.toLowerCase().includes(search.toLowerCase()) ||
      item.campaignName.toLowerCase().includes(search.toLowerCase()) ||
      item.brandName.toLowerCase().includes(search.toLowerCase());

    if (filter === "ELIGIBLE_ONLY") {
      return matchesSearch && item.isEligible && item.payoutStatus !== "PAID";
    }
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">Clipper Payout Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PAYMENT WORKFLOW
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real transactional payouts for clippers who achieved campaign view eligibility thresholds.
          </p>
        </div>

        <button
          onClick={fetchPayoutsData}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold transition flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          Refresh
        </button>
      </div>

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

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter("ELIGIBLE_ONLY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === "ELIGIBLE_ONLY"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-[#0D131D] border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Eligible for Payout (Actionable)
          </button>
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === "ALL"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-[#0D131D] border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All Campaign Clippers
          </button>
          <button
            onClick={() => setFilter("HISTORY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === "HISTORY"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "bg-[#0D131D] border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Payment History ({payoutHistory.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by clipper or campaign..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0D131D] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-xs">Loading payout records...</p>
        </div>
      ) : filter === "HISTORY" ? (
        /* History View */
        <div className="rounded-2xl bg-[#0D131D] border border-slate-800/80 overflow-hidden shadow-xl">
          {payoutHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No historical payouts recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080C14] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Campaign</th>
                    <th className="py-3.5 px-4">Clipper</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4">Method / Destination</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Transaction ID</th>
                    <th className="py-3.5 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {payoutHistory.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-4 font-bold text-white">
                        {p.campaignName}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-200">
                        {p.username}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-emerald-400 font-mono">
                        ${p.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-mono text-[11px]">
                        {p.method}: {p.accountReference}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.status === "PAID"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : p.status === "PROCESSING"
                              ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                              : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                        {p.transactionId}
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        {new Date(p.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Actionable Eligible Items View */
        <div className="rounded-2xl bg-[#0D131D] border border-slate-800/80 overflow-hidden shadow-xl">
          {filteredPayableItems.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">All caught up!</h3>
              <p className="text-xs text-slate-400">
                {filter === "ELIGIBLE_ONLY"
                  ? "No clippers are currently awaiting payout approval."
                  : "No clipper records match your query."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080C14] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Campaign</th>
                    <th className="py-3.5 px-4">Clipper</th>
                    <th className="py-3.5 px-4 text-right">Approved Views</th>
                    <th className="py-3.5 px-4 text-right">Calculated Earnings</th>
                    <th className="py-3.5 px-4">Payment Profile</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredPayableItems.map((item) => (
                    <tr key={`${item.campaignId}-${item.userId}`} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{item.campaignName}</div>
                        <div className="text-[10px] text-slate-500">
                          Threshold: {item.minViews.toLocaleString()} views
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{item.username}</div>
                        <div className="text-[10px] text-slate-500">{item.email}</div>
                      </td>

                      <td className="py-4 px-4 text-right font-mono font-bold text-slate-200">
                        {item.approvedViews.toLocaleString()}
                      </td>

                      <td className="py-4 px-4 text-right font-mono font-black text-emerald-400">
                        ${item.earnings.toFixed(2)}
                      </td>

                      <td className="py-4 px-4">
                        {item.hasPaymentProfile && item.paymentAccount ? (
                          <div className="font-mono text-[11px] text-slate-300">
                            <span className="font-bold text-white">{item.paymentAccount.provider}:</span>{" "}
                            {item.paymentAccount.accountReference}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Missing Payment Info
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.payoutStatus === "ELIGIBLE"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : item.payoutStatus === "PROCESSING"
                              ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                              : item.payoutStatus === "PAID"
                              ? "bg-slate-800 text-slate-400 border-slate-700"
                              : item.payoutStatus === "ELIGIBLE_NO_PAYMENT_DETAILS"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-slate-800 text-slate-500 border-slate-700"
                          }`}
                        >
                          {item.payoutStatus === "ELIGIBLE"
                            ? "ELIGIBLE"
                            : item.payoutStatus === "PROCESSING"
                            ? "PROCESSING"
                            : item.payoutStatus === "PAID"
                            ? "PAID"
                            : item.payoutStatus === "ELIGIBLE_NO_PAYMENT_DETAILS"
                            ? "NEEDS PAYMENT INFO"
                            : "NOT ELIGIBLE"}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        {item.payoutStatus === "ELIGIBLE" ? (
                          <button
                            onClick={() => setSelectedPayItem(item)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 ml-auto"
                          >
                            <Send className="w-3 h-3" /> PAY
                          </button>
                        ) : item.payoutStatus === "PROCESSING" ? (
                          <button
                            onClick={() => {
                              setConfirmModalPayout(item.existingPayout);
                              setTransactionIdInput(item.existingPayout?.transactionId || `TXN-${Date.now().toString(36).toUpperCase()}`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-xs hover:bg-sky-500/30 transition flex items-center gap-1.5 ml-auto"
                          >
                            <Check className="w-3 h-3" /> Confirm Paid
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* STEP 1 MODAL: ADMIN INITIATES PAYMENT */}
      {selectedPayItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Initiate Payout
              </h3>
              <button
                onClick={() => setSelectedPayItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Campaign:</span>
                <span className="font-bold text-white">{selectedPayItem.campaignName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Clipper:</span>
                <span className="font-bold text-white">{selectedPayItem.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approved Views:</span>
                <span className="font-mono text-white">{selectedPayItem.approvedViews.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payout Method:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {selectedPayItem.paymentAccount?.provider} ({selectedPayItem.paymentAccount?.accountReference})
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                <span className="font-bold text-slate-300">Amount to Transfer:</span>
                <span className="font-black text-emerald-400 font-mono">
                  ${selectedPayItem.earnings.toFixed(2)} USD
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Clicking &ldquo;Initiate Payment&rdquo; transitions this payout from <strong>ELIGIBLE</strong> to <strong>PROCESSING</strong> and creates an audit record.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPayItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiatePayout}
                disabled={initiating}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {initiating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Initiate Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 MODAL: ADMIN CONFIRMS SUCCESSFUL PAYMENT */}
      {confirmModalPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Confirm Payment Completed
              </h3>
              <button
                onClick={() => setConfirmModalPayout(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter the bank/PayPal/blockchain transaction ID once you have completed the payout transfer:
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Transaction / Reference ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={transactionIdInput}
                onChange={(e) => setTransactionIdInput(e.target.value)}
                placeholder="e.g. TXN-9X4K2P..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModalPayout(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={handleConfirmPaid}
                disabled={confirmingPaid || !transactionIdInput.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {confirmingPaid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Mark as PAID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
