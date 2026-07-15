"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPhase2Backend } from "@/services/backend";

export default function AuthCallbackPage() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    const backend = getPhase2Backend();
    const safeNext = next.startsWith("/") && !next.startsWith("//");
    if (!backend || !code || !safeNext) {
      queueMicrotask(() => setError(true));
      return;
    }
    void backend.auth.completeOAuth(code).then((result) => {
      if (!result.ok) {
        setError(true);
        return;
      }
      window.location.replace(next);
    });
  }, []);

  return (
    <main className="min-h-screen grid place-items-center bg-surface px-6 text-center">
      <div className="max-w-sm rounded-2xl bg-surface-container-lowest p-8 shadow-lg">
        <h1 className="font-serif text-headline-sm text-primary">Mooday</h1>
        <p className="mt-3 text-body-md text-on-surface-variant" role={error ? "alert" : undefined}>
          {error
            ? "We couldn't complete sign in. Please return and try again."
            : "Completing your secure sign in…"}
        </p>
        {error && (
          <Link className="mt-5 inline-block font-bold text-primary underline" href="/?view=signin">
            Return to sign in
          </Link>
        )}
      </div>
    </main>
  );
}
