"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { findOrder } from "@/data/orders";

interface DisputesListViewProps {
  onBack: () => void;
  onOpenDispute: (disputeId: string) => void;
}

interface DisputesListCopy {
  title: string;
  back: string;
  intro: string;
  emptyTitle: string;
  emptyBody: string;
  emptyCta: string;
  orderLabel: string;
  openedOn: string;
  // status badges
  open: string;
  investigating: string;
  resolved: string;
}

const COPY: Record<"en" | "ar", DisputesListCopy> = {
  en: {
    title: "Disputes",
    back: "Back",
    intro:
      "Open disputes are listed below. Tap a row to see the timeline and chat with support.",
    emptyTitle: "No disputes",
    emptyBody: "You haven't opened any disputes yet. Returns on delivered orders create a dispute automatically.",
    emptyCta: "Back",
    orderLabel: "Order",
    openedOn: "Opened on",
    open: "Open",
    investigating: "Investigating",
    resolved: "Resolved",
  },
  ar: {
    title: "النزاعات",
    back: "رجوع",
    intro:
      "النزاعات المفتوحة مدرجة أدناه. اضغطي على صف لرؤية الجدول الزمني والتواصل مع الدعم.",
    emptyTitle: "لا توجد نزاعات",
    emptyBody:
      "لم تفتحي أي نزاعات. الإرجاع على الطلبات المُسلّمة يفتح نزاعاً تلقائياً.",
    emptyCta: "رجوع",
    orderLabel: "الطلب",
    openedOn: "تم الفتح في",
    open: "مفتوح",
    investigating: "قيد التحقيق",
    resolved: "تم الحل",
  },
};

const STATUS_BG: Record<string, string> = {
  open: "bg-amber-100 text-amber-900",
  investigating: "bg-blue-100 text-blue-900",
  resolved: "bg-emerald-100 text-emerald-900",
};

/**
 * H-44 — Disputes list (top-level).
 *
 * Lists all disputes the user has opened (Phase 1: shows the empty
 * state — disputes are only created by the Return/Refund flow in H-41
 * which is per-order). Tapping a row opens the detail view.
 */
export const DisputesListView: React.FC<DisputesListViewProps> = ({
  onBack,
  onOpenDispute,
}) => {
  const { language, disputes, orders } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const sorted = [...disputes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-md pb-10"
    >
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
        <div className="w-8 h-8" aria-hidden="true" />
      </div>

      <p className="text-label-sm text-on-surface-variant">{t.intro}</p>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            gavel
          </span>
          <h2 className="font-serif text-headline-sm text-on-surface">
            {t.emptyTitle}
          </h2>
          <p className="text-label-sm text-on-surface-variant max-w-xs">
            {t.emptyBody}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 rounded-full bg-primary text-on-primary text-label-sm font-bold active:scale-95 transition-transform"
          >
            {t.emptyCta}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {sorted.map((d) => {
            const order = findOrder(orders, d.orderId);
            const productLabel = order
              ? isAr
                ? order.lineItems[0]?.product.titleAr
                : order.lineItems[0]?.product.titleEn
              : "";
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onOpenDispute(d.id)}
                className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md text-start hover:shadow-sm transition-shadow active:scale-[0.99]"
              >
                <div className="flex items-center gap-sm mb-1">
                  <span
                    className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${STATUS_BG[d.status]}`}
                  >
                    {d.status === "open"
                      ? t.open
                      : d.status === "investigating"
                        ? t.investigating
                        : t.resolved}
                  </span>
                  <span className="text-[10px] text-outline">
                    {t.openedOn}{" "}
                    {new Date(d.date).toLocaleDateString(
                      isAr ? "ar" : "en-US",
                    )}
                  </span>
                </div>
                <p className="font-serif text-label-md text-on-surface line-clamp-1">
                  {t.orderLabel} #{d.orderId}
                </p>
                {productLabel && (
                  <p className="text-label-sm text-on-surface-variant line-clamp-1">
                    {productLabel}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
