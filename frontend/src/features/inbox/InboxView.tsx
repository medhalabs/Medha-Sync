"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { formatRelative } from "@/shared/lib/utils";
import ConversationThread from "./ConversationThread";
import { MessageSquare, Mail, Search } from "lucide-react";

type Channel = "all" | "whatsapp" | "email";

function avatar(name: string | null, phone: string | null, email: string | null) {
  const label = name || email || phone || "?";
  return label[0].toUpperCase();
}

function contactDisplayName(conv: { contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null }) {
  return conv.contact_name || conv.contact_email || (conv.contact_phone ? formatPhone(conv.contact_phone) : "Unknown");
}

function contactSubtitle(conv: { contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null }) {
  if (conv.contact_name && conv.contact_email) return conv.contact_email;
  if (conv.contact_name && conv.contact_phone) return formatPhone(conv.contact_phone);
  return null;
}

function formatPhone(phone: string | null) {
  if (!phone) return "Unknown";
  // If it's a long number starting with 120363, it's a WhatsApp Linked ID
  if (phone.length > 12 && phone.startsWith("120363")) {
    return `WhatsApp ID: ${phone.slice(-8)}`;
  }
  // Format standard phone numbers (e.g., 919876543210 → +91 9876543210)
  if (phone.startsWith("91") && phone.length === 12) {
    return `+91 ${phone.slice(2)}`;
  }
  return phone;
}

function statusDot(status: string) {
  if (status === "resolved") return "bg-green-400";
  if (status === "agent") return "bg-amber-400";
  return "bg-blue-400";
}

export default function InboxView() {
  const [channel, setChannel] = useState<Channel>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["conversations", channel],
    queryFn: () =>
      api.get("/api/conversations", { params: { channel: channel === "all" ? undefined : channel, size: 50 } }).then((r) => r.data),
    refetchInterval: 5000,
  });

  const conversations: any[] = (data?.items || []).filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.contact_name?.toLowerCase().includes(q) ||
      c.contact_email?.toLowerCase().includes(q) ||
      c.contact_phone?.includes(q) ||
      c.last_message_preview?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-100 bg-white flex flex-col flex-shrink-0 shadow-sm">
        <div className="px-4 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-bold text-gray-900 text-base">Inbox</h1>
            <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">{conversations.length}</span>
          </div>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-3">
            {(["all", "whatsapp", "email"] as Channel[]).map((c) => (
              <button key={c} onClick={() => setChannel(c)}
                className={`flex-1 px-2 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                  channel === c ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {c === "all" ? "All" : c === "whatsapp" ? "WhatsApp" : "Email"}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-xs text-gray-400 text-center pt-12">No conversations found</p>
          )}
          {conversations.map((conv: any) => {
            const subtitle = contactSubtitle(conv);
            return (
            <button key={conv.id} onClick={() => setSelectedId(conv.id)}
              className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-all flex items-start gap-3 ${
                selectedId === conv.id
                  ? "bg-indigo-50 border-l-2 border-l-indigo-500"
                  : "hover:bg-gray-50/80"
              }`}>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {avatar(conv.contact_name, conv.contact_phone, conv.contact_email)}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusDot(conv.status)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {contactDisplayName(conv)}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {conv.last_message_at ? formatRelative(conv.last_message_at) : ""}
                  </span>
                </div>
                {subtitle && (
                  <p className="text-xs text-gray-600 font-medium mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  {conv.channel === "whatsapp"
                    ? <MessageSquare className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    : <Mail className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                  <span className="text-xs text-gray-500 truncate">{conv.last_message_preview || "No messages yet"}</span>
                </div>
              </div>
            </button>
            );
          })}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedId ? (
          <ConversationThread conversationId={selectedId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to start
          </div>
        )}
      </div>
    </div>
  );
}
