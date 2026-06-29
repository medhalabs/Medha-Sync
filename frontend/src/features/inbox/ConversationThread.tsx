"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/utils";
import { Send, UserCheck, CheckCircle, Bot, Phone, Tag, StickyNote, ChevronDown, Zap, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const QUICK_REPLIES = [
  "Hi! Thanks for reaching out. How can I help you today?",
  "Could you please share more details about your requirement?",
  "I'll get back to you shortly.",
  "Thank you! Our team will contact you soon.",
  "Please type *menu* to see our services.",
];

export default function ConversationThread({ conversationId }: { conversationId: string }) {
  const [reply, setReply] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: conv } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => api.get(`/api/conversations/${conversationId}`).then((r) => r.data),
    refetchInterval: 8000,
  });

  const { data: msgData } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => api.get(`/api/messages/conversation/${conversationId}`).then((r) => r.data),
    refetchInterval: 3000,
  });

  const messages: any[] = msgData?.items || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post("/api/messages", { conversation_id: conversationId, content }),
    onSuccess: () => {
      setReply("");
      setShowQuick(false);
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Failed to send"),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/api/conversations/${conversationId}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      toast.success(status === "agent" ? "Took over conversation" : "Conversation resolved");
    },
  });

  const updateContact = useMutation({
    mutationFn: (data: any) => api.patch(`/api/contacts/${conv?.contact_id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      toast.success("Contact updated");
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => api.delete(`/api/messages/${messageId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      toast.success("Message deleted");
    },
    onError: () => toast.error("Failed to delete message"),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => api.delete(`/api/messages/conversation/${conversationId}/all`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      toast.success("All messages deleted");
    },
    onError: () => toast.error("Failed to delete messages"),
  });

  const send = () => {
    const text = reply.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  const displayName = conv?.contact_name || conv?.contact_phone || "Unknown";
  const initials = displayName[0]?.toUpperCase() || "?";
  const isBot = conv?.status === "bot";
  const isResolved = conv?.status === "resolved";

  return (
    <div className="flex h-full">
      {/* Message area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              {conv?.contact_phone && (
                <p className="text-xs text-gray-400">{conv.contact_phone}</p>
              )}
            </div>
            {isBot && (
              <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <Bot className="w-3 h-3" /> Bot active
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!isResolved && (
              <>
                {isBot && (
                  <button
                    onClick={() => statusMutation.mutate("agent")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Take over
                  </button>
                )}
                {!isBot && (
                  <button
                    onClick={() => statusMutation.mutate("bot")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 text-blue-600"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Hand to bot
                  </button>
                )}
                <button
                  onClick={() => statusMutation.mutate("resolved")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 text-green-700"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolve
                </button>
              </>
            )}
            {isResolved && (
              <button
                onClick={() => statusMutation.mutate("bot")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                Reopen
              </button>
            )}
            <button
              onClick={() => {
                if (confirm("Delete all messages in this conversation? This cannot be undone.")) {
                  deleteAllMutation.mutate();
                }
              }}
              disabled={deleteAllMutation.isPending || messages.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40"
              title="Delete all messages"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {messages.map((msg: any) => (
            <div key={msg.id} className={`flex group ${msg.direction === "outbound" ? "justify-end" : "justify-start"} gap-2`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  msg.direction === "outbound"
                    ? "bg-brand-500 text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.direction === "outbound" ? "text-brand-100" : "text-gray-400"}`}>
                  {formatDate(msg.sent_at)}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Delete this message?")) {
                    deleteMessageMutation.mutate(msg.id);
                  }
                }}
                disabled={deleteMessageMutation.isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-full hover:bg-red-100 text-red-500 flex-shrink-0"
                title="Delete message"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        <div className="border-t border-gray-200 bg-white flex-shrink-0">
          {/* Quick replies */}
          {showQuick && (
            <div className="px-4 pt-3 pb-1 border-b border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Quick replies</p>
              <div className="space-y-1">
                {QUICK_REPLIES.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setReply(r)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-brand-50 text-gray-700 border border-transparent hover:border-brand-100 transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-end gap-2 p-3">
            <button
              onClick={() => setShowQuick((v) => !v)}
              className={`p-2 rounded-lg transition-colors ${showQuick ? "bg-brand-100 text-brand-600" : "hover:bg-gray-100 text-gray-400"}`}
              title="Quick replies"
            >
              <Zap className="w-4 h-4" />
            </button>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a reply… (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
            <button
              onClick={send}
              disabled={!reply.trim() || sendMutation.isPending}
              className="bg-brand-500 text-white rounded-xl px-4 py-2 disabled:opacity-50 hover:bg-brand-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contact panel */}
      <ContactPanel conv={conv} onUpdateContact={updateContact} />
    </div>
  );
}

function ContactPanel({ conv, onUpdateContact }: { conv: any; onUpdateContact: any }) {
  const [noteText, setNoteText] = useState("");
  const [newTag, setNewTag] = useState("");

  if (!conv) return <div className="w-64 border-l border-gray-200 bg-white" />;

  const tags: string[] = conv.contact_tags || [];

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag || tags.includes(tag)) return;
    onUpdateContact.mutate({ tags: [...tags, tag] });
    setNewTag("");
  };

  const removeTag = (t: string) => {
    onUpdateContact.mutate({ tags: tags.filter((x: string) => x !== t) });
  };

  const saveNote = () => {
    if (!noteText.trim()) return;
    onUpdateContact.mutate({ notes: noteText });
    toast.success("Note saved");
  };

  return (
    <div className="w-64 border-l border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
      {/* Contact info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold">
            {(conv.contact_name || conv.contact_phone || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{conv.contact_name || "Unknown"}</p>
            <p className="text-xs text-gray-400">{conv.contact_phone || ""}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {conv.contact_phone && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              {conv.contact_phone}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Tag className="w-3 h-3" /> Tags
        </p>
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
              {t}
              <button onClick={() => removeTag(t)} className="hover:text-red-500">×</button>
            </span>
          ))}
          {tags.length === 0 && <span className="text-xs text-gray-400">No tags</span>}
        </div>
        <div className="flex gap-1">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            placeholder="Add tag…"
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button onClick={addTag} className="px-2 py-1 bg-brand-500 text-white rounded-lg text-xs hover:bg-brand-600">+</button>
        </div>
      </div>

      {/* Conversation status */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Status</p>
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
          conv.status === "resolved" ? "bg-green-50 text-green-700" :
          conv.status === "agent" ? "bg-amber-50 text-amber-700" :
          "bg-blue-50 text-blue-700"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            conv.status === "resolved" ? "bg-green-500" :
            conv.status === "agent" ? "bg-amber-500" : "bg-blue-500"
          }`} />
          {conv.status}
        </span>
      </div>

      {/* Note */}
      <div className="p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
          <StickyNote className="w-3 h-3" /> Note
        </p>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a private note about this contact…"
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
        />
        <button
          onClick={saveNote}
          disabled={!noteText.trim()}
          className="mt-1.5 w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-1.5 transition-colors disabled:opacity-50"
        >
          Save note
        </button>
      </div>
    </div>
  );
}
