import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center bg-background px-6 text-center">
      <div className="max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-lg">
        <h1 className="font-serif text-headline-sm text-primary">DANEG</h1>
        <h2 className="mt-3 font-serif text-headline-md text-on-surface">Page not found</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">The page does not exist.</p>
        <Link href="/" className="btn-primary mt-6 inline-block rounded-xl px-6 py-3 font-bold">
          Back to home
        </Link>
      </div>
    </main>
  );
}
