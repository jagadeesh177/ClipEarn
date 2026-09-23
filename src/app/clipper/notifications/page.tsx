"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckCheck, Clock, CheckCircle2, XCircle, DollarSign, Info } from "lucide-react";

import { clientCache } from "@/lib/clientCache";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>(() => clientCache.get("clipper_notifications_list") || []);
  const [unreadCount, setUnreadCount] = useState<number>(() => clientCache.get("clipper_unread_count") || 0);
  const [loading, setLoading] = useState(() => !clientCache.get("clipper_notifications_list"));

  const loadNotifications = () => {
    if (!notifications.length && !clientCache.get("clipper_notifications_list")) {
      setLoading(true);
    }
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setNotifications(data.data);
          clientCache.set("clipper_notifications_list", data.data);
        }
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
          clientCache.set("clipper_unread_count", data.unreadCount);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      loadNotifications();
    } catch {
      alert("Failed to update notifications");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date() } : n))
      );
      setUnreadCount((c: number) => Math.max(0, c - 1));
    } catch {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "SUBMISSION_APPROVED":
        return <CheckCircle2 className="w-5 h-5 text-brand-emerald" />;
      case "SUBMISSION_REJECTED":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "PAYOUT_PROCESSED":
        return <DollarSign className="w-5 h-5 text-brand-cyan" />;
      case "CAMPAIGN_JOINED":
        return <CheckCircle2 className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-brand-cyan" />;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-brand-cyan" />
            Notification Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time alerts regarding submission reviews, view tracking updates, and payout approvals.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-brand-cyan" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[#0F141F] rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0F141F] border border-slate-800 p-8">
          <Bell className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-bold text-white">No notifications yet</p>
          <p className="text-xs text-slate-400 mt-1">
            You'll receive alerts when your submissions are reviewed or payouts are processed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUnread = !n.read_at;

            return (
              <div
                key={n.id}
                onClick={() => isUnread && handleMarkRead(n.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${
                  isUnread
                    ? "bg-[#111827] border-brand-cyan/40 shadow-[0_0_15px_-5px_rgba(28,247,253,0.15)]"
                    : "bg-[#0F141F] border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{n.title}</span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-brand-cyan"></span>
                      )}
                    </h3>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
