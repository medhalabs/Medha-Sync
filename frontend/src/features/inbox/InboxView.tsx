"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { formatRelative } from "@/shared/lib/utils";
import Badge from "@/shared/components/Badge";
import ConversationThread from "./ConversationThread";
import { MessageSquare, Mail } from "lucide-react";

type Channel = "all" | "whatsapp" | "email";

export default function InboxView() {
  const [channel, setChannel] = useState<Channel>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["conversations", channel],
    queryFn: () => api.get("/api/conversations", { params: { channel: channel === "all" ? undefined : channel, size: 50 } }).then((r) => r.data),
    refetchInterval: 10000,
  });

  const conversations = data?.items || [];

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h1 className="font-semibold text-gray-900 mb-3">Inbox</h1>
          <div className="flex gap-1">
            {(["all", "whatsapp", "email"] as Channel[]).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${channel === c ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {c === "all" ? "All" : c === "whatsapp" ? "WhatsApp" : "Email"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv: any) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedId === conv.id ? "bg-brand-50 border-l-2 border-l-brand-500" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {conv.channel === "whatsapp" ? (
                    <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                    {conv.contact_id}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {conv.last_message_at ? formatRelative(conv.last_message_at) : ""}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Badge
                  variant={conv.status === "resolved" ? "success" : conv.status === "agent" ? "warning" : "default"}
                >
                  {conv.status}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedId ? (
          <ConversationThread conversationId={selectedId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
