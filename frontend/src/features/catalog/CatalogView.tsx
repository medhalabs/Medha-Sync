"use client";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { storedFileUrl } from "@/shared/lib/files";
import DocumentPicker from "@/features/documents/DocumentPicker";
import EmptyState from "@/shared/components/EmptyState";
import { BookOpen, Plus, Pencil, Trash2, FileText, ChevronRight, ChevronDown, FolderOpen, Link, Upload, X, Copy, ImageIcon, Loader2, Library } from "lucide-react";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  title: "",
  description: "",
  menu_label: "",
  position: 0,
  parent_id: null as string | null,
  brochure_url: "",
  link_url: "",
  image_url: "",
};
type FormState = typeof EMPTY_FORM;

function FileUploadField({
  label,
  hint,
  accept,
  value,
  onChange,
  onClear,
  isImage,
  libraryKind,
}: {
  label: string;
  hint: string;
  accept: string;
  value: string;
  onChange: (path: string) => void;
  onClear: () => void;
  isImage?: boolean;
  libraryKind: "pdf" | "image";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const publicUrl = storedFileUrl(value);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", file.name.replace(/\.[^.]+$/, ""));
      const res = await api.post("/api/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(res.data.stored_path);
      toast.success("Uploaded to library");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const copyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copied");
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <p className="text-xs text-gray-400 mb-2">{hint}</p>

      {value && (
        <div className="mb-2 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
          {isImage && publicUrl && (
            <img src={publicUrl} alt="Preview" className="max-h-32 rounded-lg border border-gray-200 object-contain" />
          )}
          <div className="flex items-center gap-2">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline truncate flex-1">
              {publicUrl}
            </a>
            <button type="button" onClick={copyLink} title="Copy link"
              className="p-1 hover:bg-gray-200 rounded text-gray-500">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={onClear} title="Remove"
              className="p-1 hover:bg-red-50 rounded text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading…" : "Upload new"}
        </button>
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="flex items-center gap-2 px-3 py-2 border border-indigo-200 text-indigo-600 bg-indigo-50 rounded-lg text-sm hover:bg-indigo-100"
        >
          <Library className="w-4 h-4" /> From library
        </button>
      </div>

      {showLibrary && (
        <DocumentPicker
          kind={libraryKind}
          onSelect={onChange}
          onClose={() => setShowLibrary(false)}
        />
      )}

      <div className="mt-2">
        <label className="block text-xs text-gray-500 mb-1">Or paste an external URL</label>
        <input
          value={value.startsWith("http") ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}

/* ─── Item form (shared by add + edit modal) ─── */
function ItemForm({
  form, setForm, onSave, onCancel, saving, parentLabel,
}: {
  form: FormState; setForm: (f: FormState) => void;
  onSave: () => void; onCancel: () => void; saving: boolean;
  parentLabel?: string;
}) {
  return (
    <div className="space-y-3">
      {parentLabel && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          Adding under: <span className="font-medium text-gray-700">{parentLabel}</span>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Growth Plan"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Menu label</label>
        <input value={form.menu_label} onChange={e => setForm({ ...form, menu_label: e.target.value })}
          placeholder="Button label shown in WhatsApp (defaults to title)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          rows={3} placeholder="Shown when user selects this item (if it has no children)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>
      <div>
        <FileUploadField
          label="Brochure / PDF (optional)"
          hint="Pick from your document library or upload a new PDF — sent on WhatsApp when customers select this item."
          accept="application/pdf,.pdf"
          value={form.brochure_url}
          onChange={(path) => setForm({ ...form, brochure_url: path })}
          onClear={() => setForm({ ...form, brochure_url: "" })}
          libraryKind="pdf"
        />
      </div>
      <div>
        <FileUploadField
          label="Image (optional)"
          hint="Pick from your document library or upload a new image — sent on WhatsApp when customers select this item."
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          value={form.image_url}
          onChange={(path) => setForm({ ...form, image_url: path })}
          onClear={() => setForm({ ...form, image_url: "" })}
          isImage
          libraryKind="image"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
        <input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })}
          placeholder="https://… (website, YouTube, etc.)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <p className="text-xs text-gray-400 mt-1">Shown as a clickable link in the WhatsApp message</p>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={onSave} disabled={!form.title || saving}
          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

/* ─── Recursive tree item ─── */
function TreeItem({
  item,
  allItems,
  depth,
  expanded,
  setExpanded,
  onEdit,
  onAddChild,
  onDelete,
}: {
  item: any;
  allItems: any[];
  depth: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onEdit: (item: any) => void;
  onAddChild: (parent: any) => void;
  onDelete: (id: string) => void;
}) {
  const children = allItems.filter((i: any) => i.parent_id === item.id);
  const isOpen = expanded[item.id] ?? false;
  const hasChildren = children.length > 0;

  // 16px per level, supports up to 10 levels deep (max 160px)
  const indent = Math.min(depth, 10) * 16;

  return (
    <>
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 hover:bg-gray-50 group transition-colors"
        style={{ paddingLeft: `${16 + indent}px` }}
      >
        {/* Expand toggle or spacer */}
        <div className="w-5 flex-shrink-0 flex items-center justify-center">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(e => ({ ...e, [item.id]: !e[item.id] }))}
              className="text-gray-400 hover:text-gray-700"
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            depth > 0 ? <span className="w-3.5 h-3.5" /> : null
          )}
        </div>

        {/* Icon */}
        <div className={`flex-shrink-0 flex items-center justify-center rounded-lg ${
          depth === 0
            ? "w-8 h-8 bg-brand-50"
            : "w-6 h-6 bg-gray-100"
        }`}>
          {hasChildren
            ? <FolderOpen className={`${depth === 0 ? "w-4 h-4 text-brand-500" : "w-3.5 h-3.5 text-gray-400"}`} />
            : <FileText className={`${depth === 0 ? "w-4 h-4 text-brand-500" : "w-3.5 h-3.5 text-gray-400"}`} />
          }
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-medium text-gray-900 ${depth === 0 ? "text-sm" : "text-xs"}`}>
              {item.title}
            </span>
            {hasChildren && (
              <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                {children.length} sub-item{children.length !== 1 ? "s" : ""}
              </span>
            )}
            {item.brochure_url && (
              <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">PDF</span>
            )}
            {item.image_url && (
              <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><ImageIcon className="w-2.5 h-2.5" />Image</span>
            )}
            {item.link_url && (
              <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Link className="w-2.5 h-2.5" />Link</span>
            )}
            {depth > 0 && (
              <span className="text-xs text-gray-300 tabular-nums">L{depth + 1}</span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddChild(item)}
            title="Add child item"
            className="p-1.5 hover:bg-brand-50 rounded-lg text-brand-400 hover:text-brand-600"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Children (recursive) */}
      {isOpen && children.map((child: any) => (
        <TreeItem
          key={child.id}
          item={child}
          allItems={allItems}
          depth={depth + 1}
          expanded={expanded}
          setExpanded={setExpanded}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

/* ─── Main view ─── */
export default function CatalogView() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api.get("/api/catalog").then((r) => r.data),
  });

  const allItems: any[] = data || [];
  const rootItems = allItems.filter((i: any) => !i.parent_id).sort((a, b) => a.position - b.position);

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post("/api/catalog", d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["catalog"] });
      const created = res.data;
      if (created?.parent_id) setExpanded((e: any) => ({ ...e, [created.parent_id]: true }));
      closeModal();
      toast.success("Item added");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/api/catalog/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog"] });
      closeModal();
      toast.success("Item updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/catalog/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["catalog"] }); toast.success("Deleted"); },
  });

  const openAdd = (parentItem?: any) => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, parent_id: parentItem?.id ?? null, position: allItems.length });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      title: item.title || "",
      description: item.description || "",
      menu_label: item.menu_label || "",
      position: item.position ?? 0,
      parent_id: item.parent_id || null,
      brochure_url: item.brochure_url || "",
      link_url: item.link_url || "",
      image_url: item.image_url || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = () => {
    const payload = {
      title: form.title,
      description: form.description || null,
      menu_label: form.menu_label || form.title,
      position: form.position,
      parent_id: form.parent_id || null,
      brochure_url: form.brochure_url || null,
      link_url: form.link_url || null,
      image_url: form.image_url || null,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Find parent label for display in modal
  const parentItem = form.parent_id ? allItems.find((i: any) => i.id === form.parent_id) : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Products and brochures shown in the WhatsApp bot menu — supports up to 10 levels of nesting
          </p>
        </div>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add item
        </button>
      </div>

      {rootItems.length === 0 ? (
        <EmptyState icon={BookOpen} title="Catalog is empty"
          description="Add products or services — they appear as menu options in your WhatsApp bot"
          action={<button onClick={() => openAdd()} className="text-sm text-brand-500 hover:underline">Add first item</button>} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {rootItems.map((item: any) => (
            <TreeItem
              key={item.id}
              item={item}
              allItems={allItems}
              depth={0}
              expanded={expanded}
              setExpanded={setExpanded}
              onEdit={openEdit}
              onAddChild={(parent) => openAdd(parent)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={closeModal}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-4">
              {editItem ? `Edit "${editItem.title}"` : "Add catalog item"}
            </h2>
            <ItemForm
              form={form}
              setForm={setForm}
              onSave={handleSave}
              onCancel={closeModal}
              saving={isSaving}
              parentLabel={parentItem?.title}
            />
          </div>
        </div>
      )}
    </div>
  );
}
