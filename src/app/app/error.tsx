"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-dvh grid place-items-center bg-background px-6 text-center">
      <div className="max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-lg">
        <h1 className="font-serif text-headline-sm text-primary">DANEG</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">The app could not load this screen.</p>
        <button type="button" onClick={reset} className="btn-primary mt-6 rounded-xl px-6 py-3 font-bold">
          Try again
        </button>
      </div>
    </main>
  );
}
