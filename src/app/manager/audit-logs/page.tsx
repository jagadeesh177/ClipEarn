"use client";

import React, { useState, useEffect } from "react";
import { History, Shield, Search, Calendar, User } from "lucide-react";

export default function ManagerAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/manager/audit-logs")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setLogs(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800/80">
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <History className="w-7 h-7 text-brand-cyan" />
          System Audit Logs
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Immutable tracking of all sensitive actions, status modifications, and financial events.
        </p>
      </div>

      {/* Logs Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No audit logs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Actor</th>
                  <th className="pb-3">Target</th>
                  <th className="pb-3">Details / Value Delta</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 pr-3">
                      <span className="px-2 py-0.5 rounded bg-brand-cyan/15 text-brand-cyan font-bold font-sans text-[10px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 pr-3 text-white font-sans font-bold">
                      {log.actor?.username || "System Worker"}
                    </td>

                    <td className="py-3 pr-3 text-slate-300">
                      {log.target_type} {log.target_id ? `(${log.target_id.slice(0, 8)}...)` : ""}
                    </td>

                    <td className="py-3 pr-3 text-slate-400 max-w-xs truncate">
                      {log.new_value ? JSON.stringify(log.new_value) : "—"}
                    </td>

                    <td className="py-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
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
