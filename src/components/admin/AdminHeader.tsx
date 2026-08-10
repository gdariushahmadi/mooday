"use client";

import Link from "next/link";

export type AdminTab =
  | "overview"
  | "listings"
  | "orders"
  | "users"
  | "disputes"
  | "reports"
  | "broadcast"
  | "audit";

interface AdminHeaderProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  lang: "en" | "ar";
  onToggleLang: () => void;
  isLiveMode: boolean;
  /** True only when the user explicitly loaded mock/demo data. */
  isDemoMode?: boolean;
  pendingListingsCount: number;
  openDisputesCount: number;
  openReportsCount: number;
}

export function AdminHeader({
  activeTab,
  onSelectTab,
  lang,
  onToggleLang,
  isLiveMode,
  isDemoMode = false,
  pendingListingsCount,
  openDisputesCount,
  openReportsCount,
}: AdminHeaderProps) {
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

  const tabs: { key: AdminTab; labelEn: string; labelAr: string; icon: string; badge?: number }[] = [
    { key: "overview", labelEn: "Overview", labelAr: "نظرة عامة", icon: "dashboard" },
    {
      key: "listings",
      labelEn: "Pending Listings",
      labelAr: "الإعلانات المعلقة",
      icon: "inventory_2",
      badge: pendingListingsCount,
    },
    { key: "orders", labelEn: "Orders", labelAr: "الطلبات", icon: "receipt_long" },
    { key: "users", labelEn: "Users", labelAr: "المستخدمين", icon: "group" },
    {
      key: "disputes",
      labelEn: "Disputes",
      labelAr: "النزاعات",
      icon: "gavel",
      badge: openDisputesCount,
    },
    {
      key: "reports",
      labelEn: "Reports",
      labelAr: "البلاغات",
      icon: "flag",
      badge: openReportsCount,
    },
    { key: "broadcast", labelEn: "Broadcast", labelAr: "إرسال إشعار", icon: "campaign" },
    { key: "audit", labelEn: "Audit Log", labelAr: "سجل العمليات", icon: "history" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-container-high bg-surface/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex items-center gap-2 rounded-xl bg-primary-fixed/10 px-3 py-1.5 text-primary transition hover:bg-primary-fixed/20"
            title={isAr ? "العودة إلى التطبيق الرئيسي" : "Return to main app"}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="text-sm font-semibold tracking-tight">Mooday</span>
          </Link>

          <span className="h-4 w-px bg-surface-container-high" aria-hidden="true" />

          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface text-base">
              {isAr ? "لوحة التحكم والإدارة" : "Admin Panel"}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusDot}`} />
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Language & Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 rounded-lg border border-surface-container-high px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-low transition"
          >
            <span className="material-symbols-outlined text-[16px]">translate</span>
            <span>{isAr ? "English" : "العربية"}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <nav
        aria-label={isAr ? "تنقل لوحة الإدارة" : "Admin navigation"}
        className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 no-scrollbar"
      >
        <div className="flex gap-1 py-1 border-t border-surface-container-low w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSelectTab(tab.key)}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium border-b-2 transition-all rounded-t-lg ${
                  isActive
                    ? "border-primary text-primary bg-primary/5 font-semibold"
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-bold text-on-error">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
