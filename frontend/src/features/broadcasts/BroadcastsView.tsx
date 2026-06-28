"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/utils";
import Badge from "@/shared/components/Badge";
import EmptyState from "@/shared/components/EmptyState";
import { Megaphone, Plus, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function BroadcastsView() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", message_template: "", channel: "whatsapp" });
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["broadcasts"],
    queryFn: () => api.get("/api/broadcasts").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post("/api/broadcasts", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["broadcasts"] }); setShowNew(false); toast.success("Broadcast created"); },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/broadcasts/${id}/send`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["broadcasts"] }); toast.success("Broadcast queued"); },
  });

  const broadcasts: any[] = data || [];
  const statusVariant: Record<string, any> = { draft: "default", scheduled: "info", sending: "warning", sent: "success", failed: "danger" };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Broadcasts</h1>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
          <Plus className="w-4 h-4" />
          New broadcast
        </button>
      </div>

      {broadcasts.length === 0 ? (
        <EmptyState icon={Megaphone} title="No broadcasts yet" description="Create a broadcast to message multiple contacts at once" />
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b: any) => (
            <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{b.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{b.channel} · {formatDate(b.created_at)}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{b.message_template}</p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <Badge variant={statusVariant[b.status]}>{b.status}</Badge>
                  {b.status === "sent" && (
                    <p className="text-xs text-gray-500 mt-1">{b.delivered_count}/{b.total_recipients} delivered</p>
                  )}
                </div>
                {b.status === "draft" && (
                  <button onClick={() => sendMutation.mutate(b.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-4">New broadcast</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={form.message_template} onChange={(e) => setForm((f) => ({ ...f, message_template: e.target.value }))} rows={4} placeholder="Use {{name}} for personalization" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowNew(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="flex-1 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
                {createMutation.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
