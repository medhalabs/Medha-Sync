/** Same-origin proxy prefix — keeps /api/auth/* free for NextAuth. */
export const API_PROXY_PREFIX = "/api/proxy";

/** Base URL for browser API calls. Uses same-origin proxy on HTTPS when the API is HTTP-only. */
export function getApiBase(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    (configured.startsWith("http://") || !configured)
  ) {
    return API_PROXY_PREFIX;
  }

  return configured || "http://localhost:8000";
}

/** Build a full API URL for fetch() calls. */
export function apiUrl(path: string): string {
  const base = getApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (base === API_PROXY_PREFIX) {
    return `${base}${normalized.replace(/^\/api/, "")}`;
  }
  return `${base}${normalized}`;
}

/** Strip /api prefix for axios when routing through the same-origin proxy. */
export function axiosPath(url: string | undefined): string | undefined {
  if (!url) return url;
  if (getApiBase() !== API_PROXY_PREFIX) return url;
  return url.replace(/^\/api/, "") || "/";
}
