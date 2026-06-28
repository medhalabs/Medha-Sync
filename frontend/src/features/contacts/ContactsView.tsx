"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/utils";
import Badge from "@/shared/components/Badge";
import EmptyState from "@/shared/components/EmptyState";
import { Users, Plus, Search, Phone, Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactsView() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["contacts", search],
    queryFn: () => api.get("/api/contacts", { params: { search: search || undefined, size: 50 } }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/contacts", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contacts"] }); setShowAdd(false); setForm({ name: "", phone: "", email: "" }); toast.success("Contact added"); },
    onError: () => toast.error("Failed to add contact"),
  });

  const contacts = data?.items || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total || 0} total</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
          <Plus className="w-4 h-4" />
          Add contact
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {contacts.length === 0 ? (
        <EmptyState icon={Users} title="No contacts yet" description="Add your first contact to get started" action={<button onClick={() => setShowAdd(true)} className="text-sm text-brand-500 hover:underline">Add contact</button>} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Added</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-medium">
                        {(c.name || c.phone || "?")[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{c.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.phone ? <div className="flex items-center gap-1.5 text-sm text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" />{c.phone}</div> : <span className="text-gray-400 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.email ? <div className="flex items-center gap-1.5 text-sm text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" />{c.email}</div> : <span className="text-gray-400 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3"><Badge>{c.source}</Badge></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Add contact</h2>
            <div className="space-y-3">
              {["name", "phone", "email"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                  <input
                    value={(form as any)[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="flex-1 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
                {createMutation.isPending ? "Adding..." : "Add contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
