"use client";

import React from "react";

interface AdminTopbarProps {
  lang: "en" | "ar";
  onToggleLang: () => void;
  isLiveMode: boolean;
  isDemoMode?: boolean;
}

export function AdminTopbar({
  lang,
  onToggleLang,
  isLiveMode,
  isDemoMode = false,
}: AdminTopbarProps) {
  const isAr = lang === "ar";

  const statusLabel = isLiveMode
    ? isAr
      ? "متصل بالخادم (Live)"
      : "Live Supabase"
    : isDemoMode
      ? isAr
        ? "وضع العرض (Demo Mode)"
        : "Demo / Mock Mode"
      : isAr
        ? "غير متصل"
        : "Not connected";

  const statusClass = isLiveMode
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
    : isDemoMode
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
      : "bg-surface-container-high text-on-surface-variant border border-surface-container-high";

  const statusDot = isLiveMode
    ? "bg-emerald-500 animate-pulse"
    : isDemoMode
      ? "bg-amber-500"
      : "bg-outline";

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
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusDot}`} />
              {statusLabel}
            </span>
          </div>

          <span className="h-6 w-px bg-surface-container-high" aria-hidden="true" />

          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 rounded-xl border border-surface-container-high px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition"
          >
            <span className="material-symbols-outlined text-[18px]">translate</span>
            <span>{isAr ? "English" : "العربية"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
