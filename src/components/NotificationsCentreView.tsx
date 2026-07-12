"use client";

import React, { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  type NotificationType,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABEL_EN,
  NOTIFICATION_TYPE_LABEL_AR,
  NOTIFICATION_ICON,
  formatRelativeTime,
} from "@/data/notifications";
import { ClickableCard } from "./ClickableCard";

interface NotificationsCentreViewProps {
  onBack: () => void;
  onOpenChat?: (threadId: string) => void;
}

interface CentreCopy {
  title: string;
  back: string;
  markAllRead: string;
  filterAll: string;
  unreadLabel: (n: number) => string;
  emptyTitle: string;
  emptyBody: string;
}

const COPY: Record<"en" | "ar", CentreCopy> = {
  en: {
    title: "Notifications",
    back: "Back",
    markAllRead: "Mark all read",
    filterAll: "All",
    unreadLabel: (n) => `${n} unread`,
    emptyTitle: "No notifications",
    emptyBody: "You're all caught up. New activity will appear here.",
  },
  ar: {
    title: "التنبيهات",
    back: "رجوع",
    markAllRead: "تعليم الكل كمقروء",
    filterAll: "الكل",
    unreadLabel: (n) => `${n} غير مقروء`,
    emptyTitle: "لا تنبيهات",
    emptyBody: "كل شيء محدّث. النشاط الجديد سيظهر هنا.",
  },
};

type FilterId = "all" | NotificationType;

/**
 * F-31 — Notifications Centre.
 *
 * A bell-icon-triggered deep view of all notifications, filterable by
 * type. Unlike F-27 Activity (which is the bottom-nav feed sorted by
 * recency), this view shows everything with type-based filter chips.
 */
export const NotificationsCentreView: React.FC<
  NotificationsCentreViewProps
> = ({ onBack, onOpenChat }) => {
  const { language, notifications, markAllNotificationsRead } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;
  const [filter, setFilter] = useState<FilterId>("all");

  const sorted = useMemo(
    () =>
      notifications
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [notifications],
  );

  const filtered =
    filter === "all" ? sorted : sorted.filter((n) => n.type === filter);

  const unread = sorted.filter((n) => n.isUnread).length;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-md pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between -mt-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.back}
          className="flex items-center gap-1 text-primary active:scale-95 transition-transform py-1 pe-2"
        >
          <span
            className="material-symbols-outlined text-[22px] no-mirror"
            aria-hidden="true"
          >
            arrow_back
          </span>
        </button>
        <h1 className="font-serif text-label-lg text-on-surface tracking-widest">
          {t.title}
        </h1>
        {unread > 0 ? (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="text-label-sm text-primary font-bold uppercase tracking-wider active:scale-95 transition-transform"
          >
            {t.markAllRead}
          </button>
        ) : (
          <div className="w-8 h-8" aria-hidden="true" />
        )}
      </div>

      {/* Unread count */}
      {unread > 0 && (
        <div className="text-center">
          <span className="inline-block bg-primary text-on-primary text-label-sm font-bold uppercase tracking-wider px-4 py-1 rounded-full">
            {t.unreadLabel(unread)}
          </span>
        </div>
      )}

      {/* Filter chips */}
      <div
        role="tablist"
        aria-label={isAr ? "تصفية التنبيهات" : "Filter notifications"}
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-margin-mobile px-margin-mobile"
      >
        <button
          role="tab"
          aria-selected={filter === "all"}
          onClick={() => setFilter("all")}
          className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-label-sm uppercase tracking-wider transition-all border ${
            filter === "all"
              ? "bg-primary text-on-primary border-primary font-bold"
              : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
          }`}
        >
          {t.filterAll}
        </button>
        {NOTIFICATION_TYPES.map((type) => {
          const label = isAr
            ? NOTIFICATION_TYPE_LABEL_AR[type]
            : NOTIFICATION_TYPE_LABEL_EN[type];
          return (
            <button
              key={type}
              role="tab"
              aria-selected={filter === type}
              onClick={() => setFilter(type)}
              className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-label-sm transition-all border ${
                filter === type
                  ? "bg-primary text-on-primary border-primary font-bold"
                  : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            notifications_none
          </span>
          <h2 className="font-serif text-headline-sm text-on-surface">
            {t.emptyTitle}
          </h2>
          <p className="text-label-sm text-on-surface-variant max-w-xs">
            {t.emptyBody}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {filtered.map((n) => {
            const title = isAr ? n.titleAr : n.titleEn;
            const body = isAr ? n.bodyAr : n.bodyEn;
            const time = formatRelativeTime(n.date, isAr);
            const clickable = Boolean(n.target);
            return (
              <ClickableCard
                key={n.id}
                onClick={
                  clickable && n.target?.kind === "chat" && onOpenChat
                    ? () => onOpenChat(n.target!.id)
                    : () => {}
                }
                ariaLabel={clickable ? `${title} — ${time}` : undefined}
                className={`border rounded-xl p-md flex items-start gap-md transition-colors ${
                  n.isUnread
                    ? "bg-primary/5 border-primary/20"
                    : "bg-surface-container-low border-surface-container-high"
                } ${clickable ? "hover:bg-surface-container-high cursor-pointer" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    n.isUnread
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-outline"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px] no-mirror"
                    aria-hidden="true"
                  >
                    {NOTIFICATION_ICON[n.type]}
                  </span>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline gap-sm mb-1">
                    <h4
                      className={`text-label-md truncate ${
                        n.isUnread
                          ? "font-bold text-on-surface"
                          : "text-on-surface"
                      }`}
                    >
                      {title}
                    </h4>
                    <span className="text-[11px] text-outline flex-shrink-0">
                      {time}
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface-variant line-clamp-2">
                    {body}
                  </p>
                </div>
                {n.isUnread && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full mt-2 self-start flex-shrink-0" />
                )}
              </ClickableCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
