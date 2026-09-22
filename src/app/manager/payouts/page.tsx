"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function ManagerPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [statusAction, setStatusAction] = useState<"PAID" | "FAILED">("PAID");
  const [transactionId, setTransactionId] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadPayouts = () => {
    setLoading(true);
    fetch("/api/manager/payouts")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setPayouts(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/manager/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: selectedPayout.id,
          status: statusAction,
          transactionId: statusAction === "PAID" ? transactionId.trim() : null,
          failureReason: statusAction === "FAILED" ? failureReason.trim() : null,
        }),
      });

      if (res.ok) {
        setSelectedPayout(null);
        setTransactionId("");
        setFailureReason("");
        loadPayouts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to process payout");
      }
    } catch {
      alert("Network error processing payout");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-brand-cyan" />
            Payout Approvals & Processing
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authorize creator withdrawals, issue external transaction IDs, and maintain auditable settlement records.
          </p>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No payout requests in system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-3">Clipper</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Requested</th>
                  <th className="pb-3">Tx Reference</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 pr-3">
                      <div className="font-bold text-white text-sm">@{p.username}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.email || p.userId}</div>
                    </td>

                    <td className="py-4 pr-3 text-base font-black text-white">
                      ${p.amount.toFixed(2)}
                    </td>

                    <td className="py-4 pr-3 text-slate-300 font-bold uppercase text-[10px]">
                      {p.method}
                    </td>

                    <td className="py-4 pr-3">
                      {p.status === "PAID" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30">
                          PAID
                        </span>
                      )}
                      {p.status === "PENDING" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
                          PENDING APPROVAL
                        </span>
                      )}
                      {p.status === "FAILED" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                          FAILED
                        </span>
                      )}
                    </td>

                    <td className="py-4 pr-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(p.requestedAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 pr-3 font-mono text-[10px] text-slate-400">
                      {p.transactionId || "—"}
                    </td>

                    <td className="py-4 text-right">
                      {p.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayout(p);
                              setStatusAction("PAID");
                              setTransactionId(`TX-${Date.now().toString().slice(-8)}`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-brand-emerald hover:bg-brand-emerald/90 text-black font-bold text-xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Paid</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedPayout(p);
                              setStatusAction("FAILED");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Processed {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Processing Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F141F] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-cyan" />
              {statusAction === "PAID" ? "Complete Payout" : "Reject Payout Request"}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Settling payout of <strong>${selectedPayout.amount.toFixed(2)}</strong> for @{selectedPayout.username} via {selectedPayout.method}.
            </p>

            <form onSubmit={handleProcess} className="space-y-4 text-xs">
              {statusAction === "PAID" ? (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    External Transaction Reference ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PAYPAL-782910398 or WISE-991283"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-brand-cyan"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    This reference will be visible to the creator on their payout history.
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Failure / Rejection Reason
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Invalid PayPal email or suspicious activity detected..."
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-400"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 ${
                    statusAction === "PAID"
                      ? "bg-brand-emerald text-black hover:opacity-90"
                      : "bg-red-500 text-white hover:opacity-90"
                  }`}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Confirm {statusAction === "PAID" ? "Payment" : "Rejection"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
