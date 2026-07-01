"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/utils";
import EmptyState from "@/shared/components/EmptyState";
import { Users, Plus, Search, Phone, Mail, X, Tag, StickyNote, Edit2, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactsView() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["contacts", search],
    queryFn: () => api.get("/api/contacts", { params: { search: search || undefined, size: 50 } }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/contacts", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      setShowAdd(false);
      setForm({ name: "", phone: "", email: "" });
      toast.success("Contact added");
    },
    onError: () => toast.error("Failed to add contact"),
  });

  const contacts = data?.items || [];

  return (
    <div className="flex h-full min-h-0 relative">
      {/* Main table */}
      <div className="flex-1 p-4 md:p-6 min-w-0 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500 mt-0.5">{data?.total || 0} total</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Add contact
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
          />
        </div>

        {contacts.length === 0 ? (
          <EmptyState icon={Users} title="No contacts yet" description="Add your first contact to get started"
            action={<button onClick={() => setShowAdd(true)} className="text-sm text-brand-500 hover:underline">Add contact</button>} />
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden space-y-2">
              {contacts.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className={`w-full text-left bg-white rounded-xl border border-gray-100 p-4 shadow-sm transition-colors ${
                    selectedContact?.id === c.id ? "border-indigo-300 bg-indigo-50/50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(c.name || c.phone || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name || "—"}</p>
                      {c.phone && (
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />{c.phone}
                        </p>
                      )}
                      {c.email && (
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />{c.email}
                        </p>
                      )}
                    </div>
                  </div>
                  {(c.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(c.tags || []).slice(0, 3).map((t: string) => (
                        <span key={t} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{t}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tags</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c: any) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedContact(c)}
                    className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors cursor-pointer ${selectedContact?.id === c.id ? "bg-indigo-50" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(c.name || c.phone || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{c.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {c.phone ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />{c.phone}
                        </div>
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.email ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />{c.email}
                        </div>
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags || []).slice(0, 3).map((t: string) => (
                          <span key={t} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{t}</span>
                        ))}
                        {(c.tags || []).length > 3 && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">+{c.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{c.source || "manual"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
          </div>
          </>
        )}
      </div>

      {/* Contact detail drawer */}
      {selectedContact && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setSelectedContact(null)}
          />
          <ContactDrawer
            contactId={selectedContact.id}
            onClose={() => setSelectedContact(null)}
          />
        </>
      )}

      {/* Add contact modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-900 mb-5">Add contact</h2>
            <div className="space-y-4">
              {[
                { key: "name", label: "Name", placeholder: "e.g. John Smith" },
                { key: "phone", label: "Phone", placeholder: "e.g. 919876543210" },
                { key: "email", label: "Email", placeholder: "john@example.com" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => createMutation.mutate({ name: form.name || undefined, phone: form.phone || undefined, email: form.email || undefined })}
                disabled={(!form.name && !form.phone) || createMutation.isPending}
                className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
              >
                {createMutation.isPending ? "Adding…" : "Add contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactDrawer({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [newTag, setNewTag] = useState("");

  const { data: contact, isLoading } = useQuery({
    queryKey: ["contact", contactId],
    queryFn: () => api.get(`/api/contacts/${contactId}`).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/api/contacts/${contactId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact", contactId] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
      setEditing(false);
      toast.success("Contact updated");
    },
  });

  if (isLoading) return (
    <div className="fixed inset-y-0 right-0 w-full max-w-sm md:relative md:inset-auto md:w-72 border-l border-gray-200 bg-white flex items-center justify-center z-50 md:z-auto">
      <span className="text-sm text-gray-400">Loading…</span>
    </div>
  );

  const c = contact;
  const tags: string[] = c?.tags || [];

  const startEdit = () => {
    setEditForm({ name: c?.name || "", phone: c?.phone || "", email: c?.email || "", notes: c?.notes || "" });
    setEditing(true);
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag || tags.includes(tag)) return;
    updateMutation.mutate({ tags: [...tags, tag] });
    setNewTag("");
  };

  const removeTag = (t: string) => {
    updateMutation.mutate({ tags: tags.filter((x: string) => x !== t) });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-sm md:relative md:inset-auto md:w-72 border-l border-gray-200 bg-white flex-shrink-0 flex flex-col z-50 md:z-auto h-full md:h-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-900">Contact details</span>
        <div className="flex gap-1">
          {!editing && (
            <button onClick={startEdit} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar + name */}
        <div className="p-4 flex flex-col items-center border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-semibold mb-2">
            {(c?.name || c?.phone || "?")[0].toUpperCase()}
          </div>
          <p className="text-base font-semibold text-gray-900">{c?.name || "Unknown"}</p>
          {c?.phone && <p className="text-sm text-gray-400">{c.phone}</p>}
        </div>

        {/* Fields — edit or view */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          {editing ? (
            <>
              {[
                { key: "name", label: "Name" },
                { key: "phone", label: "Phone" },
                { key: "email", label: "Email" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input
                    value={editForm[key]}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f: any) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 text-xs border border-gray-300 rounded-lg py-1.5 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => updateMutation.mutate(editForm)}
                  disabled={updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-brand-500 text-white rounded-lg py-1.5 hover:bg-brand-600 disabled:opacity-50"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
              </div>
            </>
          ) : (
            <>
              {c?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> {c.email}
                </div>
              )}
              {c?.notes && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5">
                  <StickyNote className="w-3 h-3 inline mr-1" /> {c.notes}
                </div>
              )}
              {!c?.email && !c?.notes && (
                <p className="text-xs text-gray-400">No additional info. Click edit to add.</p>
              )}
            </>
          )}
        </div>

        {/* Tags */}
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Tags
          </p>
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-0.5 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                {t}
                <button onClick={() => removeTag(t)} className="ml-0.5 hover:text-red-500">×</button>
              </span>
            ))}
            {tags.length === 0 && <span className="text-xs text-gray-400">No tags yet</span>}
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

        {/* Meta */}
        <div className="p-4 text-xs text-gray-400 space-y-1">
          <p>Source: <span className="capitalize text-gray-600">{c?.source || "manual"}</span></p>
          {c?.created_at && <p>Added: {formatDate(c.created_at)}</p>}
        </div>
      </div>
    </div>
  );
}
