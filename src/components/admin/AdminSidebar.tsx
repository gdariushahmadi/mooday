"use client";

import Link from "next/link";
import { AdminTab } from "./AdminTypes";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  lang: "en" | "ar";
  pendingListingsCount: number;
  openDisputesCount: number;
  openReportsCount: number;
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  lang,
  pendingListingsCount,
  openDisputesCount,
  openReportsCount,
}: AdminSidebarProps) {
  const isAr = lang === "ar";

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
    <aside className="w-64 shrink-0 border-r rtl:border-l rtl:border-r-0 border-surface-container-high bg-surface h-screen sticky top-0 overflow-y-auto flex flex-col">
      <div className="p-6">
        <Link
          href="/app"
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition"
          title={isAr ? "العودة إلى التطبيق الرئيسي" : "Return to main app"}
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          <span className="text-xl font-bold tracking-tight">Mooday</span>
        </Link>
      </div>

      <nav
        aria-label={isAr ? "تنقل لوحة الإدارة" : "Admin navigation"}
        className="flex-1 px-4 space-y-1"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-medium transition-all rounded-xl ${
                isActive
                  ? "bg-primary text-on-primary font-semibold shadow-md"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </div>
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  isActive ? "bg-on-primary text-primary" : "bg-error text-on-error"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-container-high mt-auto">
        <div className="text-xs text-center text-on-surface-variant">
           {isAr ? "لوحة التحكم والإدارة" : "Admin Panel"} v1.0
        </div>
      </div>
    </aside>
  );
}
