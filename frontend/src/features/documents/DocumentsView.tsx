"use client";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import EmptyState from "@/shared/components/EmptyState";
import { formatFileSize, storedFileUrl, type DocumentRecord } from "@/shared/lib/files";
import {
  Files, Upload, Copy, Trash2, ExternalLink, FileText, ImageIcon,
  Loader2, Pencil, Check, X,
} from "lucide-react";
import toast from "react-hot-toast";

type Filter = "all" | "pdf" | "image";

function DocumentCard({
  doc,
  onDelete,
  onRename,
}: {
  doc: DocumentRecord;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(doc.name);

  const fileUrl = storedFileUrl(doc.stored_path);

  const copyLink = () => {
    navigator.clipboard.writeText(fileUrl);
    toast.success("Link copied");
  };

  const saveRename = () => {
    if (name.trim() && name.trim() !== doc.name) {
      onRename(doc.id, name.trim());
    }
    setEditing(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-36 bg-gray-50 flex items-center justify-center border-b border-gray-100">
        {doc.kind === "image" ? (
          <img src={fileUrl} alt={doc.name} className="max-h-full max-w-full object-contain p-2" />
        ) : (
          <div className="flex flex-col items-center text-red-500">
            <FileText className="w-12 h-12 mb-1 opacity-80" />
            <span className="text-xs font-medium text-gray-500">PDF</span>
          </div>
        )}
      </div>
      <div className="p-4">
        {editing ? (
          <div className="flex items-center gap-1 mb-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <button onClick={saveRename} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setEditing(false); setName(doc.name); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate flex-1" title={doc.name}>{doc.name}</h3>
            <button onClick={() => setEditing(true)} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 rounded">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <p className="text-xs text-gray-400 truncate mb-3">{doc.filename} · {formatFileSize(doc.file_size)}</p>
        <div className="flex items-center gap-1">
          <button onClick={copyLink} title="Copy link"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg">
            <Copy className="w-3 h-3" /> Copy link
          </button>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" title="Open"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => { if (confirm(`Delete "${doc.name}"?`)) onDelete(doc.id); }}
            title="Delete"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const queryKind = filter === "all" ? undefined : filter;
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", filter],
    queryFn: () =>
      api.get("/api/documents", { params: queryKind ? { kind: queryKind } : {} }).then((r) => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", file.name.replace(/\.[^.]+$/, ""));
      return api.post("/api/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/documents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/api/documents/${id}`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Renamed");
    },
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMutation.mutateAsync(file);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const tabs: { id: Filter; label: string; icon: typeof Files }[] = [
    { id: "all", label: "All", icon: Files },
    { id: "pdf", label: "PDFs", icon: FileText },
    { id: "image", label: "Images", icon: ImageIcon },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload PDFs and images — use them in your catalog, WhatsApp bot, or copy shareable links
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        className="mb-6 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer"
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,.pdf,image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
        ) : (
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        )}
        <p className="text-sm font-medium text-gray-700">
          {uploading ? "Uploading…" : "Drop files here or click to upload"}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPEG, PNG, WebP, GIF — max 10 MB each</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === id
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{documents.length} file{documents.length !== 1 ? "s" : ""}</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={Files}
          title="No documents yet"
          description="Upload PDFs and images to build your media library for catalog items and WhatsApp"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc: DocumentRecord) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={(id) => deleteMutation.mutate(id)}
              onRename={(id, name) => renameMutation.mutate({ id, name })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
