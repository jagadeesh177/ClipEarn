"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Hash, Users, Sparkles, Shield, User } from "lucide-react";

export default function ClipEarnChatPage() {
  const [activeChannel, setActiveChannel] = useState("general-chat");
  const [messages, setMessages] = useState<Array<{
    id: string;
    channel: string;
    user: string;
    badge: string;
    avatar: string;
    text: string;
    time: string;
  }>>([]);

  const [inputMessage, setInputMessage] = useState("");

  const channels = [
    { id: "general-chat", name: "general-chat", desc: "Clipper discussions & clipping tips" },
    { id: "payout-support", name: "payout-support", desc: "Inquiries regarding payouts and ledgers" },
    { id: "campaign-requests", name: "campaign-requests", desc: "Suggest brands you want to clip for" },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      channel: activeChannel,
      user: "You",
      badge: "Clipper",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
  };

  const channelMessages = messages.filter((m) => m.channel === activeChannel);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row rounded-2xl bg-[#0F141F] border border-slate-800 overflow-hidden animate-fadeIn">
      {/* Channels Sidebar */}
      <div className="w-full md:w-64 bg-[#0A0F1D] border-b md:border-b-0 md:border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            <MessageSquare className="w-4 h-4 text-brand-cyan" />
            <span>ClipEarn Clipper Chat</span>
          </div>

          <div className="space-y-1">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                  activeChannel === ch.id
                    ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-500 hidden md:block">
          <Shield className="w-4 h-4 text-brand-cyan mb-1" />
          <span>Moderated clipper community. Keep discussions productive and respectful.</span>
        </div>
      </div>

      {/* Chat Messages & Input Area */}
      <div className="flex-1 flex flex-col justify-between min-w-0 bg-[#0F141F]">
        {/* Chat Channel Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-brand-cyan" />
            <h2 className="text-sm font-bold text-white">{activeChannel}</h2>
          </div>
          <span className="text-[11px] text-slate-500">
            {channels.find((c) => c.id === activeChannel)?.desc}
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {channelMessages.length === 0 ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-bold text-white">No messages yet</p>
              <p className="text-xs text-slate-400 mt-1">Be the first to say hello in #{activeChannel}!</p>
            </div>
          ) : (
            channelMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 group">
                <img
                  src={msg.avatar}
                  alt="Avatar"
                  className="w-9 h-9 rounded-xl border border-slate-700 bg-slate-800 object-cover shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{msg.user}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                        msg.badge === "Staff"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : msg.badge.includes("Top")
                          ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {msg.badge}
                    </span>
                    <span className="text-[10px] text-slate-500">{msg.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed break-words">{msg.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-[#0B101D] flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message #${activeChannel}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="p-2.5 rounded-xl bg-brand-cyan text-black hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
