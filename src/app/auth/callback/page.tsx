"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPhase2Backend } from "@/services/backend";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const next = params.get("next") || "/app";
    const backend = getPhase2Backend();
    const safeNext = next.startsWith("/") && !next.startsWith("//");
    if (!backend) {
      queueMicrotask(() => setError("Backend is not configured."));
      return;
    }
    if (!safeNext) {
      queueMicrotask(() => setError("Invalid redirect target."));
      return;
    }
    // If the previous OAuth attempt already created a session (replay / browser
    // back), the code is no longer valid. Skip the failure UI.
    void (async () => {
      try {
        const existing = await backend.auth.getCurrentUser();
        if (existing) {
          window.location.replace(next);
          return;
        }
        if (!code) {
          queueMicrotask(() => setError("Missing authorization code."));
          return;
        }
        const result = await backend.auth.completeOAuth(code);
        if (!result.ok) {
          // Race: session might have been created between the check and the
          // exchange. Re-check before showing the error UI.
          const current = await backend.auth.getCurrentUser();
          if (current) {
            window.location.replace(next);
            return;
          }
          console.error("[auth/callback] completeOAuth failed:", result.error);
          setError(String(result.error || "Unknown error"));
          return;
        }
        window.location.replace(next);
      } catch (err) {
        console.error("[auth/callback] completeOAuth threw:", err);
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  return (
    <main className="min-h-screen grid place-items-center bg-surface px-6 text-center">
      <div className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-8 shadow-lg">
        <h1 className="font-serif text-headline-sm text-primary">Mooday</h1>
        {error ? (
          <>
            <p className="mt-3 text-body-md text-on-surface-variant" role="alert">
              We couldn&apos;t complete sign in. Please return and try again.
            </p>
            <p
              className="mt-2 text-label-sm text-error break-words"
              data-testid="auth-callback-error-detail"
            >
              {error}
            </p>
          </>
        ) : (
          <p className="mt-3 text-body-md text-on-surface-variant">
            Completing your secure sign in…
          </p>
        )}
        {error && (
          <Link className="mt-5 inline-block font-bold text-primary underline" href="/app?view=signin">
            Return to sign in
          </Link>
        )}
      </div>
    </main>
  );
}
