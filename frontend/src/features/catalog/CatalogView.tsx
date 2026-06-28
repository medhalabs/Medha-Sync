"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import EmptyState from "@/shared/components/EmptyState";
import Badge from "@/shared/components/Badge";
import { BookOpen, Plus, Pencil, Trash2, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function CatalogView() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", menu_label: "", position: 0 });
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api.get("/api/catalog").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post("/api/catalog", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["catalog"] }); setShowNew(false); toast.success("Item added to catalog"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/catalog/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["catalog"] }); toast.success("Deleted"); },
  });

  const items: any[] = data || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">Products and brochures shown in the WhatsApp bot menu</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
          <Plus className="w-4 h-4" />
          Add item
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={BookOpen} title="Catalog is empty" description="Add products or services — they appear as menu options in your WhatsApp bot" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-brand-500" />
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Pencil className="w-3.5 h-3.5 text-gray-400" /></button>
                  <button onClick={() => deleteMutation.mutate(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description || "No description"}</p>
              <div className="flex items-center justify-between">
                <Badge>{item.menu_label}</Badge>
                {item.brochure_url && <span className="text-xs text-green-600 font-medium">PDF attached</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-4">Add catalog item</h2>
            <div className="space-y-3">
              {[["title", "Title"], ["menu_label", "Menu label (shown in WA bot)"], ["description", "Description"]].map(([field, label]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  {field === "description" ? (
                    <textarea value={(form as any)[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
                  ) : (
                    <input value={(form as any)[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowNew(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="flex-1 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">Add item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
