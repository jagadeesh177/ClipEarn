"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Key,
  Users,
  Compass,
  History,
  Copy,
  Check,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Manager Access Keys state
  const [accessKeys, setAccessKeys] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [justGeneratedKey, setJustGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  // Managers Directory state
  const [managersList, setManagersList] = useState<any[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [revokingManagerId, setRevokingManagerId] = useState<string | null>(null);

  // System Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Initial data loading
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setCurrentUser(data.user);
      })
      .catch(() => {});

    loadAccessKeys();
    loadManagers();
    loadAuditLogs();
    setLoading(false);
  }, []);

  const loadAccessKeys = async () => {
    try {
      setLoadingKeys(true);
      const res = await fetch("/api/admin/manager-access-keys");
      const data = await res.json();
      if (res.ok && data.data) {
        setAccessKeys(data.data);
      }
    } catch {
      setAccessKeys([]);
    } finally {
      setLoadingKeys(false);
    }
  };

  const loadManagers = async () => {
    try {
      setLoadingManagers(true);
      const res = await fetch("/api/manager/clippers?limit=100");
      const data = await res.json();
      if (res.ok && data.data) {
        const managers = data.data.filter((u: any) => u.role === "MANAGER");
        setManagersList(managers);
      }
    } catch {
      setManagersList([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch("/api/manager/audit-logs?limit=10");
      const data = await res.json();
      if (res.ok && data.data) {
        setAuditLogs(data.data);
      }
    } catch {
      setAuditLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setGeneratingKey(true);
      const res = await fetch("/api/admin/manager-access-keys", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.key) {
        setJustGeneratedKey(data.key);
        setAccessKeys((prev) => [data.accessKey, ...prev]);
      } else {
        alert(data.error || "Failed to generate manager access key");
      }
    } catch {
      alert("Network error generating manager access key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this manager invitation key? Any pending authentication will be immediately blocked.")) return;
    try {
      setRevokingKeyId(id);
      const res = await fetch(`/api/admin/manager-access-keys/${id}/revoke`, { method: "POST" });
      if (res.ok) {
        setAccessKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, status: "REVOKED" } : k))
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to revoke key");
      }
    } catch {
      alert("Network error revoking key");
    } finally {
      setRevokingKeyId(null);
    }
  };

  const handleRevokeManager = async (id: string) => {
    if (!confirm("Are you sure you want to revoke Campaign Manager access for this user? They will be demoted to standard Clipper status.")) return;
    try {
      setRevokingManagerId(id);
      const res = await fetch(`/api/admin/managers/${id}/revoke`, { method: "POST" });
      if (res.ok) {
        setManagersList((prev) => prev.filter((m) => m.id !== id));
        alert("Manager privileges successfully revoked.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to revoke manager privileges");
      }
    } catch {
      alert("Network error revoking manager");
    } finally {
      setRevokingManagerId(null);
    }
  };

  const handleCopyKey = () => {
    if (!justGeneratedKey) return;
    navigator.clipboard.writeText(justGeneratedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#0F141F] to-[#0A0D14] border border-red-900/40">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/30 border border-red-700/40 text-xs font-bold text-red-400 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Root Administrator Control</span>
          </div>
          <h1 className="text-2xl font-black text-white">System Administration Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage Campaign Manager authorization keys, review administrative audit logs, and oversee portal security.
          </p>
        </div>

        {/* Quick Cross-Portal Access */}
        <div className="flex items-center gap-3">
          <Link
            href="/manager/dashboard"
            className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-bold text-xs transition-all flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Open Manager Portal</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            href="/clipper/dashboard"
            className="px-4 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Open Clipper Portal</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#0F141F] border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Authorized Real Admins</div>
          <div className="text-2xl font-black text-white mt-1">2 Accounts</div>
          <div className="text-[11px] text-slate-500 mt-1">aronyesh63@gmail.com, easalajagadeesh@gmail.com</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0F141F] border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Active Campaign Managers</div>
          <div className="text-2xl font-black text-purple-400 mt-1">{managersList.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Authorized via key redemption</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0F141F] border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Active Manager Invitation Keys</div>
          <div className="text-2xl font-black text-red-400 mt-1">
            {accessKeys.filter((k) => k.status === "ACTIVE").length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Single-use cryptographically hashed keys</div>
        </div>
      </div>

      {/* Manager Access Keys Generator Section */}
      <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              <span>Manager Access Keys</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate one-time secret keys to onboard new trusted Campaign Managers.
            </p>
          </div>

          <button
            onClick={handleGenerateKey}
            disabled={generatingKey}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 text-white font-bold text-xs transition-all hover:opacity-90 flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {generatingKey ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Plus className="w-4 h-4" />}
            <span>Generate New Manager Key</span>
          </button>
        </div>

        {/* Just generated key banner */}
        {justGeneratedKey && (
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
            <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Manager Invitation Key Generated (Shown Once Only):</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-purple-500/30 font-mono text-sm text-purple-200 select-all">
                {justGeneratedKey}
              </code>
              <button
                onClick={handleCopyKey}
                className="py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="text-[11px] text-purple-400/80">
              Provide this key to the intended manager. They enter it at <code>/manager/login</code> to link their Discord profile.
            </p>
          </div>
        )}

        {/* Keys Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0E14] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Key Preview</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4">Used By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loadingKeys ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                    Loading invitation keys...
                  </td>
                </tr>
              ) : accessKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No manager invitation keys generated yet.
                  </td>
                </tr>
              ) : (
                accessKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {k.key_preview || "••••••••"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          k.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : k.status === "USED"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            : "bg-red-500/10 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {k.used_by_user ? k.used_by_user.username : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {k.status === "ACTIVE" && (
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          disabled={revokingKeyId === k.id}
                          className="px-2.5 py-1 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-bold transition-all disabled:opacity-50"
                        >
                          {revokingKeyId === k.id ? "Revoking..." : "Revoke"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Managers Management Section */}
      <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-cyan" />
            <span>Active Campaign Managers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            View active managers and revoke manager privileges if necessary.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0E14] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Manager Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loadingManagers ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-cyan" />
                    Loading managers...
                  </td>
                </tr>
              ) : managersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No active campaign managers found.
                  </td>
                </tr>
              ) : (
                managersList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{m.username}</td>
                    <td className="py-3 px-4 text-slate-400">{m.email || "Discord Account"}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRevokeManager(m.id)}
                        disabled={revokingManagerId === m.id}
                        className="px-2.5 py-1 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-bold transition-all disabled:opacity-50"
                      >
                        {revokingManagerId === m.id ? "Revoking..." : "Revoke Manager"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Audit Logs Section */}
      <div className="rounded-2xl bg-[#0F141F] border border-slate-800 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-red-400" />
            <span>Recent System Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable security and audit ledger of administrator actions.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0E14] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loadingLogs ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-red-400" />
                    Loading audit logs...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No recent administrative logs.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-red-400">{log.action}</td>
                    <td className="py-3 px-4 text-slate-300">{log.actor?.username || "System"}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{log.target_type || "N/A"}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
