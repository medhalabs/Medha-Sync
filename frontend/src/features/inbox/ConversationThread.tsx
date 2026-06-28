"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/utils";
import { Send, UserCheck, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ConversationThread({ conversationId }: { conversationId: string }) {
  const [reply, setReply] = useState("");
  const qc = useQueryClient();

  const { data: msgData } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => api.get(`/api/messages/conversation/${conversationId}`).then((r) => r.data),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      api.post("/api/messages", { conversation_id: conversationId, content }),
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
    onError: () => toast.error("Failed to send"),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/api/conversations/${conversationId}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });

  const messages = msgData?.items || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
        <span className="text-sm font-medium text-gray-900">Conversation</span>
        <div className="flex gap-2">
          <button
            onClick={() => statusMutation.mutate("agent")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Take over
          </button>
          <button
            onClick={() => statusMutation.mutate("resolved")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 text-green-700"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Resolve
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.map((msg: any) => (
          <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                msg.direction === "outbound"
                  ? "bg-brand-500 text-white rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
              }`}
            >
              <p>{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.direction === "outbound" ? "text-brand-100" : "text-gray-400"}`}>
                {formatDate(msg.sent_at)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && reply.trim() && sendMutation.mutate(reply)}
            placeholder="Type a reply..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={() => reply.trim() && sendMutation.mutate(reply)}
            disabled={!reply.trim() || sendMutation.isPending}
            className="bg-brand-500 text-white rounded-lg px-4 py-2 disabled:opacity-50 hover:bg-brand-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
