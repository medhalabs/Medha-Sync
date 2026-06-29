"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { formatFileSize, type DocumentRecord } from "@/shared/lib/files";
import { FileText, ImageIcon, Loader2, X } from "lucide-react";

export default function DocumentPicker({
  kind,
  onSelect,
  onClose,
}: {
  kind: "pdf" | "image";
  onSelect: (storedPath: string) => void;
  onClose: () => void;
}) {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", kind],
    queryFn: () => api.get("/api/documents", { params: { kind } }).then((r) => r.data),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Choose from library
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto p-3 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : documents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">
              No {kind === "pdf" ? "PDFs" : "images"} in your library yet.<br />
              Upload files in the Documents section first.
            </p>
          ) : (
            <div className="space-y-1">
              {documents.map((doc: DocumentRecord) => (
                <button
                  key={doc.id}
                  onClick={() => { onSelect(doc.stored_path); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-50 text-left transition-colors"
                >
                  {doc.kind === "image" ? (
                    <img src={doc.url} alt="" className="w-10 h-10 rounded object-cover border border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-red-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</p>
                  </div>
                  {doc.kind === "image" ? (
                    <ImageIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
