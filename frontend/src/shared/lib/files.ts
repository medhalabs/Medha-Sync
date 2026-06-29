import { getApiBase } from "@/shared/lib/api-base";

export type DocumentRecord = {
  id: string;
  name: string;
  filename: string;
  stored_path: string;
  content_type: string;
  file_size: number;
  url: string;
  kind: "pdf" | "image";
  created_at: string;
};

export function storedFileUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = getApiBase();
  return `${base}/api/files/${path.replace(/^\//, "")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
