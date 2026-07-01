"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/utils";
import { Send, UserCheck, CheckCircle, Bot, Phone, Mail, Tag, StickyNote, Zap, Trash2, Paperclip, Download, X, Loader2, ChevronLeft, User } from "lucide-react";
import toast from "react-hot-toast";
import MessageContent from "./MessageContent";

type PendingAttachment = {
  filename: string;
  path: string;
  content_type: string;
  size: number;
  url: string;
};

type MessageAttachment = {
  filename: string;
  path: string;
  content_type: string;
  size: number;
  url: string;
};

const QUICK_REPLIES = [
  "Hi! Thanks for reaching out. How can I help you today?",
  "Could you please share more details about your requirement?",
  "I'll get back to you shortly.",
  "Thank you! Our team will contact you soon.",
  "Please type *menu* to see our services.",
];

export default function ConversationThread({ conversationId, onBack }: { conversationId: string; onBack?: () => void }) {
  const [reply, setReply] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    mutationFn: (payload: { content: string; attachments: PendingAttachment[] }) =>
      api.post("/api/messages", {
        conversation_id: conversationId,
        content: payload.content,
        attachments: payload.attachments.map(({ filename, path, content_type, size }) => ({
          filename,
          path,
          content_type,
          size,
        })),
      }),
    onSuccess: () => {
      setReply("");
      setPendingAttachments([]);
      setShowQuick(false);
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to send");
    },
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

  const handleAttachmentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/api/messages/attachments/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPendingAttachments((prev) => [...prev, res.data]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  const send = () => {
    const text = reply.trim();
    if ((!text && pendingAttachments.length === 0) || sendMutation.isPending) return;
    sendMutation.mutate({ content: text, attachments: pendingAttachments });
  };

  const displayName = conv?.contact_name || conv?.contact_email || conv?.contact_phone || "Unknown";
  const initials = (conv?.contact_name || conv?.contact_email || conv?.contact_phone || "?")[0]?.toUpperCase() || "?";
  const isBot = conv?.status === "bot";
  const isResolved = conv?.status === "resolved";
  const isEmail = conv?.channel === "email";

  return (
    <div className="flex h-full min-h-0 relative">
      {/* Message area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 bg-white flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {onBack && (
              <button
                onClick={onBack}
                className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 flex-shrink-0"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              {conv?.contact_name && conv?.contact_email && (
                <p className="text-xs text-gray-400 truncate">{conv.contact_email}</p>
              )}
              {conv?.contact_name && !conv?.contact_email && conv?.contact_phone && (
                <p className="text-xs text-gray-400 truncate">{conv.contact_phone}</p>
              )}
            </div>
            {isBot && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                <Bot className="w-3 h-3" /> Bot active
              </span>
            )}
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setShowContactPanel((v) => !v)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${showContactPanel ? "bg-brand-100 text-brand-600" : "hover:bg-gray-100 text-gray-500"}`}
              title="Contact info"
            >
              <User className="w-4 h-4" />
            </button>
            {!isResolved && (
              <>
                {isBot && (
                  <button
                    onClick={() => statusMutation.mutate("agent")}
                    className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                    title="Take over"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Take over</span>
                  </button>
                )}
                {!isBot && (
                  <button
                    onClick={() => statusMutation.mutate("bot")}
                    className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 text-blue-600"
                    title="Hand to bot"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hand to bot</span>
                  </button>
                )}
                <button
                  onClick={() => statusMutation.mutate("resolved")}
                  className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 text-green-700"
                  title="Resolve"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Resolve</span>
                </button>
              </>
            )}
            {isResolved && (
              <button
                onClick={() => statusMutation.mutate("bot")}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                <span className="hidden sm:inline">Reopen</span>
                <span className="sm:hidden text-xs">Open</span>
              </button>
            )}
            <button
              onClick={() => {
                if (confirm("Delete all messages in this conversation? This cannot be undone.")) {
                  deleteAllMutation.mutate();
                }
              }}
              disabled={deleteAllMutation.isPending || messages.length === 0}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40"
              title="Delete all messages"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50">
          {isEmail && conv?.subject && (
            <div className="max-w-2xl mx-auto w-full px-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{conv.subject}</p>
            </div>
          )}
          {messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex group ${msg.direction === "outbound" ? "justify-end" : "justify-start"} gap-2 ${
                isEmail ? "max-w-2xl mx-auto w-full" : ""
              }`}
            >
              <div
                className={
                  isEmail
                    ? `w-full px-4 py-3.5 rounded-xl text-sm shadow-sm border ${
                        msg.direction === "outbound"
                          ? "bg-brand-500 text-white border-brand-600"
                          : "bg-white border-gray-200 text-gray-900"
                      }`
                    : `max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        msg.direction === "outbound"
                          ? "bg-brand-500 text-white rounded-br-sm"
                          : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                      }`
                }
              >
                {msg.content && (
                  <MessageContent
                    content={msg.content}
                    direction={msg.direction}
                    sentAt={formatDate(msg.sent_at)}
                    isEmail={isEmail}
                  />
                )}
                {!msg.content && (
                  <p className={`text-xs ${msg.direction === "outbound" ? "text-brand-100" : "text-gray-400"}`}>
                    {formatDate(msg.sent_at)}
                  </p>
                )}
                {msg.attachments?.length > 0 && (
                  <div className={`space-y-1 ${msg.content ? "mt-2" : ""}`}>
                    {msg.attachments.map((att: MessageAttachment) => (
                      <a
                        key={`${msg.id}-${att.path}`}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={att.filename}
                        className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${
                          msg.direction === "outbound"
                            ? "bg-brand-600/40 text-white hover:bg-brand-600/60"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Download className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{att.filename}</span>
                      </a>
                    ))}
                  </div>
                )}
                {!msg.content && msg.attachments?.length > 0 && (
                  <p className={`text-xs mt-2 ${msg.direction === "outbound" ? "text-brand-100" : "text-gray-400"}`}>
                    {formatDate(msg.sent_at)}
                  </p>
                )}
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
          {pendingAttachments.length > 0 && (
            <div className="px-4 pt-3 flex flex-wrap gap-2 border-b border-gray-100">
              {pendingAttachments.map((att) => (
                <span
                  key={att.path}
                  className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="max-w-[140px] truncate">{att.filename}</span>
                  <button
                    type="button"
                    onClick={() => setPendingAttachments((prev) => prev.filter((a) => a.path !== att.path))}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 p-3 safe-bottom">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleAttachmentSelect}
            />
            <button
              onClick={() => setShowQuick((v) => !v)}
              className={`p-2 rounded-lg transition-colors ${showQuick ? "bg-brand-100 text-brand-600" : "hover:bg-gray-100 text-gray-400"}`}
              title="Quick replies"
            >
              <Zap className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || isResolved}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-400 disabled:opacity-50"
              title="Attach file"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a reply…"
              rows={2}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
            <button
              onClick={send}
              disabled={(!reply.trim() && pendingAttachments.length === 0) || sendMutation.isPending || isResolved}
              className="bg-brand-500 text-white rounded-xl px-4 py-2 disabled:opacity-50 hover:bg-brand-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contact panel — desktop sidebar, mobile overlay */}
      {showContactPanel && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setShowContactPanel(false)}
        />
      )}
      <div
        className={
          showContactPanel
            ? "fixed inset-y-0 right-0 z-50 w-full max-w-xs lg:relative lg:inset-auto lg:z-auto lg:max-w-none flex"
            : "hidden lg:flex"
        }
      >
        <ContactPanel conv={conv} onUpdateContact={updateContact} onClose={() => setShowContactPanel(false)} />
      </div>
    </div>
  );
}

function ContactPanel({ conv, onUpdateContact, onClose }: { conv: any; onUpdateContact: any; onClose?: () => void }) {
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
    <div className="w-64 border-l border-gray-200 bg-white flex-shrink-0 overflow-y-auto h-full">
      {onClose && (
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">Contact info</span>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Contact info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold">
            {(conv.contact_name || conv.contact_email || conv.contact_phone || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {conv.contact_name || conv.contact_email || conv.contact_phone || "Unknown"}
            </p>
            <p className="text-xs text-gray-400">
              {conv.contact_name ? (conv.contact_email || conv.contact_phone || "") : ""}
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          {conv.contact_phone && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              {conv.contact_phone}
            </div>
          )}
          {conv.contact_email && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              {conv.contact_email}
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
