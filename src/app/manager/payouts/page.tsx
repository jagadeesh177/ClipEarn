"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Info,
} from "lucide-react";

export default function ManagerPayoutsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = () => {
    setLoading(true);
    fetch("/api/manager/payouts")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setItems(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = items.filter((item) => {
    if (statusFilter !== "ALL") {
      if (statusFilter === "ELIGIBLE" && item.payoutStatus !== "ELIGIBLE") return false;
      if (statusFilter === "PROCESSING" && item.payoutStatus !== "PROCESSING") return false;
      if (statusFilter === "PAID" && item.payoutStatus !== "PAID") return false;
      if (statusFilter === "NOT_ELIGIBLE" && item.payoutStatus !== "NOT_ELIGIBLE") return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.username.toLowerCase().includes(q) ||
        item.campaignName.toLowerCase().includes(q) ||
        item.brandName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-purple-400" />
            Payout Eligibility Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track clipper qualification and payment disbursement statuses for your assigned campaigns.
          </p>
        </div>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-white">Disbursement Policy Notice:</span> Financial payout execution is handled strictly by Platform Administrators to ensure audit compliance. Campaign Managers have visibility into clipper qualification, view progress, and settlement statuses.
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by clipper or campaign..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 bg-[#0F141F] border border-slate-800 rounded-xl pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#0F141F] border border-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
          {[
            { id: "ALL", label: "All Clippers" },
            { id: "ELIGIBLE", label: "Eligible" },
            { id: "PROCESSING", label: "In Processing" },
            { id: "PAID", label: "Paid" },
            { id: "NOT_ELIGIBLE", label: "Below Threshold" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-xs ${
                statusFilter === tab.id
                  ? "bg-purple-500 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
            <p className="text-xs">Loading payout eligibility data...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No clipper payout data found for your assigned campaigns.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider pb-2.5">
                  <th className="py-3 px-3">Clipper</th>
                  <th className="py-3 px-3">Campaign</th>
                  <th className="py-3 px-3 text-right">Approved Views</th>
                  <th className="py-3 px-3 text-right">Threshold</th>
                  <th className="py-3 px-3 text-right">Earned</th>
                  <th className="py-3 px-3 text-center">Payout Status</th>
                  <th className="py-3 px-3 text-right">Settlement Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredItems.map((item, idx) => (
                  <tr key={`${item.campaignId}-${item.clipperId}-${idx}`} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs uppercase border border-purple-500/30">
                          {item.username.charAt(0)}
                        </div>
                        <span className="font-bold text-white">@{item.username}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-white">{item.campaignName}</div>
                      <div className="text-[11px] text-slate-500">{item.brandName}</div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-brand-cyan">
                      {item.approvedViews.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                      {item.thresholdViews > 0 ? `${item.thresholdViews.toLocaleString()} views` : "None"}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400">
                      ${item.earnings.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {item.payoutStatus === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      ) : item.payoutStatus === "PROCESSING" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>Processing</span>
                        </span>
                      ) : item.payoutStatus === "ELIGIBLE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Eligible</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <AlertCircle className="w-3 h-3" />
                          <span>Below Threshold</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono text-slate-400 text-[11px]">
                      {item.transactionId || (item.payoutStatus === "PAID" ? "Settled" : "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
