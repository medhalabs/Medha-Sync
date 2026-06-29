/** Base URL for browser API calls. Uses same-origin proxy on HTTPS when the API is HTTP-only. */
export function getApiBase(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  if (!configured) return "";

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    configured.startsWith("http://")
  ) {
    return "";
  }

  return configured || "http://localhost:8000";
}
