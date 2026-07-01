"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { apiUrl } from "@/shared/lib/api-base";

function GoogleAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(searchParams.get("error_description") || error);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("Missing authorization code from Google.");
      return;
    }

    const redirectUri = window.location.origin + window.location.pathname;

    fetch(apiUrl("/api/auth/google/callback"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Google sign-in failed");
        }
        return res.json();
      })
      .then(async (data) => {
        const signin = await signIn("credentials", {
          oauth_token: data.access_token,
          redirect: false,
        });
        if (!signin?.ok) {
          throw new Error("Signed in with Google but session setup failed");
        }
        setStatus("success");
        setMessage("Signed in! Syncing your Gmail…");
        router.push("/inbox");
      })
      .catch((e: Error) => {
        setStatus("error");
        setMessage(e.message || "Google sign-in failed. Please try again.");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-xl shadow-gray-100 mx-4">
      {status === "loading" && (
        <>
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Signing you in with Google…</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Welcome!</h2>
          <p className="text-sm text-gray-500">{message}</p>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Sign-in failed</h2>
          <p className="text-sm text-gray-500 mb-4">{message}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Back to login
          </button>
        </>
      )}
    </div>
  );
}

export default function GoogleAuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Suspense
        fallback={
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-xl shadow-gray-100 mx-4">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Signing you in with Google…</p>
          </div>
        }
      >
        <GoogleAuthCallbackContent />
      </Suspense>
    </div>
  );
}
