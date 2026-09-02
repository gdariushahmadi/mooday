"use client";

interface AdminTopbarProps {
  lang: "en" | "ar";
  onToggleLang: () => void;
  /** Server-verified admin email. The panel only renders once this exists. */
  adminEmail: string;
  mode: "demo" | "live";
  onSignOut: () => void | Promise<void>;
}

export function AdminTopbar({
  lang,
  onToggleLang,
  adminEmail,
  mode,
  onSignOut,
}: AdminTopbarProps) {
  const isAr = lang === "ar";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-container-high bg-surface/95 backdrop-blur-md shadow-sm">
      <div className="flex h-16 items-center justify-between px-6 lg:px-8">

        {/* Empty left space since sidebar holds the branding */}
        <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-on-surface hidden sm:block">
              {isAr ? "لوحة التحكم" : "Dashboard"}
            </h1>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium " +
              (mode === "demo"
                ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")
            }
          >
            <span
              className={
                "h-2 w-2 rounded-full " +
                (mode === "demo"
                  ? "bg-amber-500"
                  : "animate-pulse bg-emerald-500")
              }
            />
            {mode === "demo"
              ? isAr
                ? "وضع تجريبي"
                : "Demo data"
              : isAr
                ? "متصل بالخادم (Live)"
                : "Live Supabase"}
          </span>

          <span
            className="hidden md:inline text-xs font-medium text-on-surface-variant"
            title={adminEmail}
          >
            {adminEmail}
          </span>

          <span className="h-6 w-px bg-surface-container-high" aria-hidden="true" />

          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 rounded-xl border border-surface-container-high px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition"
          >
            <span className="material-symbols-outlined text-[18px]">translate</span>
            <span>{isAr ? "English" : "العربية"}</span>
          </button>
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="rounded-xl border border-surface-container-high px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition"
          >
            {isAr ? "تسجيل الخروج" : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
