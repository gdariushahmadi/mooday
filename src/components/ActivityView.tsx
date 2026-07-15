"use client";

import React, { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  type AppNotification,
  NOTIFICATION_ICON,
  formatRelativeTime,
} from "@/data/notifications";
import { ClickableCard } from "./ClickableCard";

interface ActivityViewProps {
  onBack: () => void;
  /** Open the chat thread this event references. */
  onOpenChat?: (threadId: string) => void;
  onOpenProduct?: (productId: string) => void;
  onOpenSeller?: (sellerId: string) => void;
  /** Open the notifications centre. */
  onOpenNotifications?: () => void;
}

interface ActivityCopy {
  title: string;
  back: string;
  markAllRead: string;
  emptyTitle: string;
  emptyBody: string;
  viewAll: string;
  recentHeading: string;
  earlierHeading: string;
}

const COPY: Record<"en" | "ar", ActivityCopy> = {
  en: {
    title: "Activity",
    back: "Back",
    markAllRead: "Mark all read",
    emptyTitle: "Nothing yet",
    emptyBody:
      "Follows, likes, offers, and price drops on your saved items will show up here.",
    viewAll: "View all notifications",
    recentHeading: "Today",
    earlierHeading: "Earlier",
  },
  ar: {
    title: "النشاط",
    back: "رجوع",
    markAllRead: "تعليم الكل كمقروء",
    emptyTitle: "لا شيء بعد",
    emptyBody:
      "المتابعات والإعجابات والعروض وانخفاض الأسعار على منتجاتك المحفوظة ستظهر هنا.",
    viewAll: "عرض كل التنبيهات",
    recentHeading: "اليوم",
    earlierHeading: "أقدم",
  },
};

/**
 * F-27 — Activity feed (bottom-nav Activity tab).
 *
 * Renders the full notification stream from `useApp().notifications`,
 * split into "Today" and "Earlier" sections (24-hour boundary). Each
 * event is a `ClickableCard` that deep-links to the source (chat thread,
 * product, listing). The "Mark all read" action persists via
 * `markAllNotificationsRead()`.
 */
export const ActivityView: React.FC<ActivityViewProps> = ({
  onBack,
  onOpenChat,
  onOpenProduct,
  onOpenSeller,
  onOpenNotifications,
}) => {
  const {
    language,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const sorted = useMemo(
    () =>
      notifications
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [notifications],
  );

  // Computed once on mount; re-derived when the component re-mounts.
  // Using useState with a lazy initializer keeps Date.now() out of render.
  const [cutoff] = useState(() => Date.now() - 86_400_000);
  const recent = sorted.filter((n) => new Date(n.date).getTime() >= cutoff);
  const earlier = sorted.filter((n) => new Date(n.date).getTime() < cutoff);

  const unread = sorted.filter((n) => n.isUnread).length;

  const handleOpen = (notif: AppNotification) => {
    if (!notif.target) return;
    markNotificationRead(notif.id);
    if (notif.target.kind === "chat" && onOpenChat) {
      onOpenChat(notif.target.id);
    } else if (
      (notif.target.kind === "product" || notif.target.kind === "listing") &&
      onOpenProduct
    ) {
      onOpenProduct(notif.target.id);
    } else if (notif.target.kind === "seller" && onOpenSeller) {
      onOpenSeller(notif.target.id);
    }
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-md pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.back}
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span
            className="material-symbols-outlined no-mirror"
            aria-hidden="true"
          >
            arrow_back
          </span>
        </button>
        <h1 className="font-serif text-headline-sm text-primary tracking-widest uppercase flex-grow text-center">
          {t.title}
        </h1>
        <div className="w-10" aria-hidden="true" />
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between px-1">
        <span className="text-label-sm text-on-surface-variant">
          {unread > 0
            ? isAr
              ? `${unread} غير مقروء`
              : `${unread} unread`
            : isAr
              ? "كل المقروءة"
              : "All caught up"}
        </span>
        <div className="flex gap-sm">
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="text-label-sm text-primary font-bold uppercase tracking-wider active:scale-95 transition-transform"
            >
              {t.markAllRead}
            </button>
          )}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider active:scale-95 transition-transform"
            >
              {t.viewAll}
            </button>
          )}
        </div>
      </div>

      {/* Lists */}
      {sorted.length === 0 ? (
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
        <>
          {recent.length > 0 && (
            <section className="flex flex-col gap-sm">
              <h2 className="text-[10px] uppercase tracking-wider text-outline font-bold px-1">
                {t.recentHeading}
              </h2>
              {recent.map((n) => (
                <NotificationRow
                  key={n.id}
                  notif={n}
                  isAr={isAr}
                  onOpen={() => handleOpen(n)}
                />
              ))}
            </section>
          )}
          {earlier.length > 0 && (
            <section className="flex flex-col gap-sm mt-md">
              <h2 className="text-[10px] uppercase tracking-wider text-outline font-bold px-1">
                {t.earlierHeading}
              </h2>
              {earlier.map((n) => (
                <NotificationRow
                  key={n.id}
                  notif={n}
                  isAr={isAr}
                  onOpen={() => handleOpen(n)}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
};

// ---------- Sub-components ----------

const NotificationRow: React.FC<{
  notif: AppNotification;
  isAr: boolean;
  onOpen: () => void;
}> = ({ notif, isAr, onOpen }) => {
  const clickable = Boolean(notif.target);
  const title = isAr ? notif.titleAr : notif.titleEn;
  const body = isAr ? notif.bodyAr : notif.bodyEn;
  const time = formatRelativeTime(notif.date, isAr);
  const icon = NOTIFICATION_ICON[notif.type];

  const inner = (
    <>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          notif.isUnread
            ? "bg-primary text-on-primary"
            : "bg-surface-container-high text-outline"
        }`}
      >
        <span
          className="material-symbols-outlined text-[20px] no-mirror"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-baseline gap-sm mb-1">
          <h4
            className={`text-label-md truncate ${
              notif.isUnread ? "font-bold text-on-surface" : "text-on-surface"
            }`}
          >
            {title}
          </h4>
          <span className="text-[11px] text-outline flex-shrink-0">{time}</span>
        </div>
        <p className="text-body-md text-on-surface-variant line-clamp-2">
          {body}
        </p>
      </div>
      {notif.isUnread && (
        <div className="w-2.5 h-2.5 bg-primary rounded-full mt-2 self-start flex-shrink-0" />
      )}
    </>
  );

  if (!clickable) {
    return (
      <div
        className={`border border-surface-container-high rounded-xl p-md flex items-start gap-md ${
          notif.isUnread ? "bg-primary/5" : "bg-surface-container-low"
        }`}
      >
        {inner}
      </div>
    );
  }

  return (
    <ClickableCard
      onClick={onOpen}
      ariaLabel={`${title} — ${time}`}
      className={`border border-surface-container-high rounded-xl p-md flex items-start gap-md transition-colors ${
        notif.isUnread
          ? "bg-primary/5 hover:bg-primary/10"
          : "bg-surface-container-low hover:bg-surface-container-high"
      }`}
    >
      {inner}
    </ClickableCard>
  );
};
