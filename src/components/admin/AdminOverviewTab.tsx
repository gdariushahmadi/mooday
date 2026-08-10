"use client";

import React from "react";
import type { AdminDashboardStats, AdminAuditLogEntry } from "@/services/admin/actions";
import type { AdminTab } from "./AdminTypes";

interface AdminOverviewTabProps {
  stats: AdminDashboardStats | null;
  recentAuditLogs: AdminAuditLogEntry[];
  onNavigateTab: (tab: AdminTab) => void;
  lang: "en" | "ar";
}

export function AdminOverviewTab({
  stats,
  recentAuditLogs,
  onNavigateTab,
  lang,
}: AdminOverviewTabProps) {
  const isAr = lang === "ar";

  const statCards = [
    {
      titleEn: "Total Users",
      titleAr: "إجمالي المستخدمين",
      value: stats?.totalUsers ?? 0,
      icon: "group",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      tab: "users" as AdminTab,
    },
    {
      titleEn: "Total Listings",
      titleAr: "إجمالي الإعلانات",
      value: stats?.totalListings ?? 0,
      icon: "inventory_2",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      tab: "listings" as AdminTab,
    },
    {
      titleEn: "Pending Approval",
      titleAr: "في انتظار الموافقة",
      value: stats?.pendingListings ?? 0,
      icon: "pending_actions",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      tab: "listings" as AdminTab,
      highlight: (stats?.pendingListings ?? 0) > 0,
    },
    {
      titleEn: "Open Disputes",
      titleAr: "النزاعات المفتوحة",
      value: stats?.openDisputes ?? 0,
      icon: "gavel",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      tab: "disputes" as AdminTab,
      highlight: (stats?.openDisputes ?? 0) > 0,
    },
    {
      titleEn: "Open Reports",
      titleAr: "البلاغات النشطة",
      value: stats?.openReports ?? 0,
      icon: "flag",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      tab: "reports" as AdminTab,
      highlight: (stats?.openReports ?? 0) > 0,
    },
    {
      titleEn: "Suspended Users",
      titleAr: "الحسابات الموقوفة",
      value: stats?.suspendedUsers ?? 0,
      icon: "block",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      tab: "users" as AdminTab,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-on-surface">
          {isAr ? "نظرة عامة على المنصة" : "Platform Overview"}
        </h2>
        <p className="text-sm text-on-surface-variant">
          {isAr
            ? "ملخص الإحصائيات والإجراءات المطلوبة للمشرفين"
            : "Key metrics and moderation items requiring action"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <button
            key={card.titleEn}
            type="button"
            onClick={() => card.tab && onNavigateTab(card.tab)}
            className={`group relative flex min-h-32 w-full flex-col justify-between rounded-2xl border p-5 text-left transition-all focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rtl:text-right ${
              card.tab ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50" : ""
            } ${
              card.highlight
                ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
                : "border-surface-container-high bg-surface"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-on-surface-variant">
                {isAr ? card.titleAr : card.titleEn}
              </span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                <span className="material-symbols-outlined text-[22px]">{card.icon}</span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tabular-nums text-on-surface">
                {card.value.toLocaleString("en-US")}
              </span>

              {card.tab && (
                <span className="flex items-center text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {isAr ? "عرض التفاصيل" : "View details"}
                  <span className="material-symbols-outlined text-[16px] rtl:rotate-180">
                    chevron_right
                  </span>
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-surface-container-high bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <span className="material-symbols-outlined text-[24px]">inventory_2</span>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface">
                {isAr ? "مراجعة المنتجات الجديدة" : "Pending Listings Moderation"}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {isAr
                  ? "تأكيد جودة وأصالة المنتجات قبل نشرها"
                  : "Review newly listed luxury items for authenticity"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("listings")}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary/90 transition"
          >
            {isAr ? "الانتقال لقائمة المراجعة" : "Go to Review Queue"}
          </button>
        </div>

        <div className="rounded-2xl border border-surface-container-high bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
              <span className="material-symbols-outlined text-[24px]">gavel</span>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface">
                {isAr ? "إدارة النزاعات والمستحقات" : "Dispute & Claim Resolution"}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {isAr
                  ? "مراجعة شكاوى المشترين والبائعين وإصدار القرارات"
                  : "Resolve order disputes between buyers and sellers"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("disputes")}
            className="mt-4 w-full rounded-xl border border-surface-container-high bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container transition"
          >
            {isAr ? "عرض النزاعات النشطة" : "View Active Disputes"}
          </button>
        </div>
      </div>

      {/* Recent Audit Log Preview */}
      <div className="rounded-2xl border border-surface-container-high bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">
            {isAr ? "أحدث سجلات المشرفين" : "Recent Moderation Logs"}
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab("audit")}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            {isAr ? "عرض الكل" : "View all log entries"}
            <span className="material-symbols-outlined text-[14px] rtl:rotate-180">
              chevron_right
            </span>
          </button>
        </div>

        {recentAuditLogs.length === 0 ? (
          <p className="py-4 text-center text-xs text-on-surface-variant">
            {isAr ? "لا توجد سجلات تفتيش حديثة" : "No recent audit entries"}
          </p>
        ) : (
          <div className="divide-y divide-surface-container-low">
            {recentAuditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex flex-col gap-1.5 py-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                  <span className="rounded-md bg-surface-container-high px-2 py-0.5 font-mono text-[11px] text-on-surface font-medium">
                    {log.action}
                  </span>
                  <span className="text-on-surface font-medium">{log.actorEmail}</span>
                  {log.note && (
                    <span className="text-on-surface-variant truncate max-w-xs">
                      — {log.note}
                    </span>
                  )}
                </div>
                <time className="shrink-0 text-[11px] text-on-surface-variant">
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
