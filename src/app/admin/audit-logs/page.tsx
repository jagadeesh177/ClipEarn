"use client";

import React, { useState, useEffect } from "react";
import { History, Shield, Search, Calendar, User, RefreshCw, Loader2 } from "lucide-react";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/manager/audit-logs");
      const json = await res.json();
      if (res.ok && json.data) {
        setLogs(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.actorUsername && log.actorUsername.toLowerCase().includes(q)) ||
      log.targetType.toLowerCase().includes(q) ||
      (log.targetId && log.targetId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">System Audit Trail</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">
              IMMUTABLE LOGS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Permanent cryptographic ledger tracking campaign lifecycle, status changes, and payout operations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold transition flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit events by action, actor, target..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0D131D] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
        />
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#0D131D] border border-slate-800/80 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs">Loading audit ledger...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit records found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080C14] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Event Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Target Type & ID</th>
                  <th className="py-3.5 px-4">Delta / Event Payload</th>
                  <th className="py-3.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-bold text-amber-400">
                      {log.action}
                    </td>

                    <td className="py-3.5 px-4 text-slate-200">
                      {log.actorUsername || log.actorId ? (
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {log.actorUsername || log.actorId?.slice(0, 8)}
                        </span>
                      ) : (
                        <span className="text-slate-500">SYSTEM</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="font-bold text-white">{log.targetType}</span>
                      {log.targetId && (
                        <span className="text-slate-500 text-[10px] block truncate max-w-[150px]">
                          {log.targetId}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {log.newValue ? JSON.stringify(log.newValue) : "—"}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500 text-[10px]">
                      {new Date(log.createdAt).toLocaleString()}
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
