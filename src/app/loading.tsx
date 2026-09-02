export default function Loading() {
  return (
    <main className="min-h-dvh grid place-items-center bg-background px-6 text-center">
      <div role="status" className="flex flex-col items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary" aria-hidden="true">
          progress_activity
        </span>
        <span>Loading DANEG…</span>
      </div>
    </main>
  );
}
