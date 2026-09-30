"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Key,
  Shield,
  Plus,
  Copy,
  Check,
  RotateCcw,
  UserMinus,
  UserCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function AdminManagersPage() {
  const [modalTab, setModalTab] = useState<"MANAGERS" | "INVITES">("MANAGERS");
  const [managersList, setManagersList] = useState<any[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [accessKeysList, setAccessKeysList] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [justGeneratedKey, setJustGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  // Confirmation Modals
  const [revokingManager, setRevokingManager] = useState<{ id: string; username: string } | null>(null);
  const [restoringManager, setRestoringManager] = useState<{ id: string; username: string } | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const fetchManagersData = async () => {
    setLoadingManagers(true);
    try {
      const res = await fetch("/api/admin/managers");
      const json = await res.json();
      if (res.ok && json.data) {
        setManagersList(json.data);
      }
    } catch {
      setManagersList([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  const fetchKeysData = async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch("/api/admin/manager-access-keys");
      const json = await res.json();
      if (res.ok && json.data) {
        setAccessKeysList(json.data);
      }
    } catch {
      setAccessKeysList([]);
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchManagersData();
    fetchKeysData();
  }, []);

  const handleGenerateKey = async () => {
    try {
      setGeneratingKey(true);
      setActionSuccessMessage(null);
      setActionErrorMessage(null);
      const res = await fetch("/api/admin/manager-access-keys", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const plaintext =
          data.data?.plaintextKey ||
          data.key ||
          data.plaintextKey ||
          data.data?.key;

        if (plaintext) {
          setJustGeneratedKey(plaintext);
          await fetchKeysData();
        } else {
          setActionErrorMessage("Failed to retrieve generated key from server response");
        }
      } else {
        setActionErrorMessage(data.error || "Failed to generate key");
      }
    } catch {
      setActionErrorMessage("Network error generating key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      setRevokingKeyId(id);
      setActionSuccessMessage(null);
      setActionErrorMessage(null);
      const res = await fetch(`/api/admin/manager-access-keys/${id}/revoke`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMessage("Invite key revoked successfully");
        await fetchKeysData();
      } else {
        setActionErrorMessage(data.error || "Failed to revoke key");
      }
    } catch {
      setActionErrorMessage("Network error revoking key");
    } finally {
      setRevokingKeyId(null);
    }
  };

  const handleConfirmRevokeManager = async () => {
    if (!revokingManager) return;
    try {
      setActionSubmitting(true);
      setActionSuccessMessage(null);
      setActionErrorMessage(null);
      const res = await fetch(`/api/admin/managers/${revokingManager.id}/revoke`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMessage(`Access revoked for ${revokingManager.username}`);
        setRevokingManager(null);
        await fetchManagersData();
      } else {
        setActionErrorMessage(data.error || "Failed to revoke manager access");
      }
    } catch {
      setActionErrorMessage("Network error revoking manager access");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleConfirmRestoreManager = async () => {
    if (!restoringManager) return;
    try {
      setActionSubmitting(true);
      setActionSuccessMessage(null);
      setActionErrorMessage(null);
      const res = await fetch(`/api/admin/managers/${restoringManager.id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMessage(`Access restored for ${restoringManager.username}`);
        setRestoringManager(null);
        await fetchManagersData();
      } else {
        setActionErrorMessage(data.error || "Failed to restore manager access");
      }
    } catch {
      setActionErrorMessage("Network error restoring manager access");
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">Campaign Managers</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
              DELEGATION & ACCESS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authorize campaign managers and generate cryptographically secure single-use access keys.
          </p>
        </div>

        <button
          onClick={handleGenerateKey}
          disabled={generatingKey}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition shadow-lg shadow-purple-500/20 disabled:opacity-50"
        >
          {generatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Generate Manager Access Code
        </button>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{actionErrorMessage}</span>
        </div>
      )}

      {/* Just Generated Key Banner */}
      {justGeneratedKey && (
        <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/40 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200">
              🔑 New Manager Access Code Generated (Save Now — Shown ONCE):
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(justGeneratedKey);
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
              }}
              className="px-3 py-1.5 rounded-lg bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey ? "Copied to Clipboard!" : "Copy Code"}
            </button>
          </div>
          <div className="p-3 rounded-xl bg-black/70 border border-purple-500/30 font-mono text-sm font-bold text-purple-300 select-all tracking-wider">
            {justGeneratedKey}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Provide this access code to a new manager. They can enter it on the Manager Sign In page (/manager/login) to activate their Campaign Manager account.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setModalTab("MANAGERS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            modalTab === "MANAGERS"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          Manager Accounts ({managersList.length})
        </button>
        <button
          onClick={() => setModalTab("INVITES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            modalTab === "INVITES"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Key className="w-4 h-4" />
          Single-Use Access Codes ({accessKeysList.length})
        </button>
      </div>

      {/* Tab Content */}
      {modalTab === "MANAGERS" ? (
        <div className="rounded-2xl bg-[#0D131D] border border-slate-800/80 overflow-hidden shadow-xl">
          {loadingManagers ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <span className="text-xs">Loading manager accounts...</span>
            </div>
          ) : managersList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No campaign manager accounts created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080C14] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Manager</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Assigned via Key</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {managersList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                          {m.username.charAt(0).toUpperCase()}
                        </div>
                        <span>{m.username}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{m.email || "—"}</td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            m.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-400">
                        {m.usedKeyPreview || "Direct / Admin"}
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {m.status === "ACTIVE" ? (
                          <button
                            onClick={() => setRevokingManager({ id: m.id, username: m.username })}
                            className="px-3 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold transition inline-flex items-center gap-1"
                          >
                            <UserMinus className="w-3 h-3" /> Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => setRestoringManager({ id: m.id, username: m.username })}
                            className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" /> Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Invite Keys Table */
        <div className="rounded-2xl bg-[#0D131D] border border-slate-800/80 overflow-hidden shadow-xl">
          {loadingKeys ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <span className="text-xs">Loading access keys...</span>
            </div>
          ) : accessKeysList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No invite keys created yet. Click &ldquo;Generate New Invite Key&rdquo; above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080C14] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Code Preview</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Redeemed By</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {accessKeysList.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-4 font-mono font-bold text-slate-300">
                        {k.key_preview}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            k.status === "ACTIVE"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : k.status === "USED"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-slate-800 text-slate-500 border-slate-700"
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {k.used_by_user ? k.used_by_user.username : "—"}
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        {new Date(k.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {k.status === "ACTIVE" && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            disabled={revokingKeyId === k.id}
                            className="px-3 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold transition disabled:opacity-50"
                          >
                            {revokingKeyId === k.id ? "Revoking..." : "Revoke"}
                          </button>
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

      {/* Confirmation Modal: Revoke Manager */}
      {revokingManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-rose-500/30 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <UserMinus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Revoke Manager Access?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to revoke manager access for <strong>{revokingManager.username}</strong>? Their permissions will be downgraded.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRevokingManager(null)}
                className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevokeManager}
                disabled={actionSubmitting}
                className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {actionSubmitting ? "Revoking..." : "Confirm Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Restore Manager */}
      {restoringManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F141F] border border-emerald-500/30 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Restore Manager Access?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Restore Campaign Manager access for <strong>{restoringManager.username}</strong>?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRestoringManager(null)}
                className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestoreManager}
                disabled={actionSubmitting}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition disabled:opacity-50"
              >
                {actionSubmitting ? "Restoring..." : "Confirm Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
