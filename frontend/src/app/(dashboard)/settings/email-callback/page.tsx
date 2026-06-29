"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/shared/lib/api";

export default function EmailCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // "gmail" | "outlook"
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(searchParams.get("error_description") || error);
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setMessage("Missing code or state parameter from OAuth provider.");
      return;
    }

    const provider = state as "gmail" | "outlook";
    const redirectUri = window.location.origin + window.location.pathname;

    api.post(`/api/email/${provider}/callback`, { code, redirect_uri: redirectUri })
      .then((res) => {
        setStatus("success");
        setMessage(`${res.data.label} connected successfully!`);
        setTimeout(() => router.push("/settings"), 2000);
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e.response?.data?.detail || "Failed to connect account. Please try again.");
      });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        {status === "loading" && (
          <>
            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Connecting your email account...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Connected!</h2>
            <p className="text-sm text-gray-500">{message}</p>
            <p className="text-xs text-gray-400 mt-3">Redirecting to settings...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Connection failed</h2>
            <p className="text-sm text-gray-500 mb-4">{message}</p>
            <button
              onClick={() => router.push("/settings")}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Back to settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
