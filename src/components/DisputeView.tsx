"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import type { Order } from "@/data/orders";
import type { Dispute } from "@/data/disputes";
import { formatAEDLabel } from "@/lib/format";

interface DisputeViewProps {
  order: Order;
  /** Optional existing dispute (if the user is re-viewing). */
  dispute?: Dispute;
  onBack: () => void;
  /** "Chat with support" placeholder action (Phase 3 wires real chat). */
  onContactSupport?: () => void;
}

interface DisputeCopy {
  title: string;
  back: string;
  statusHeading: string;
  timelineHeading: string;
  shipmentOrder: string;
  productLine: string;
  reason: string;
  body: string;
  bodyPh: string;
  chatWithSupport: string;
  backToOrder: string;
  resolveHint: string;
  resolveHintAr: string;
  // Status labels — keys mirror DisputeStatus.
  open: string;
  investigating: string;
  resolved: string;
  pendingFunds: string;
}

const COPY: Record<"en" | "ar", DisputeCopy> = {
  en: {
    title: "Dispute",
    back: "Back",
    statusHeading: "Current status",
    timelineHeading: "Timeline",
    shipmentOrder: "Order",
    productLine: "About:",
    reason: "Reason",
    body: "Your description",
    bodyPh: "Add any new context for the support team.",
    chatWithSupport: "Chat with support",
    backToOrder: "Back to order",
    resolveHint:
      "Once a dispute is resolved, funds are returned to your wallet within 2 business days.",
    resolveHintAr: "",
    open: "Open",
    investigating: "Investigating",
    resolved: "Resolved",
    pendingFunds: "Pending refund",
  },
  ar: {
    title: "النزاع",
    back: "رجوع",
    statusHeading: "الحالة الحالية",
    timelineHeading: "الجدول الزمني",
    shipmentOrder: "الطلب",
    productLine: "حول:",
    reason: "السبب",
    body: "وصفك",
    bodyPh: "أضف سياقاً جديداً لفريق الدعم.",
    chatWithSupport: "تواصل مع الدعم",
    backToOrder: "العودة للطلب",
    resolveHint: "",
    resolveHintAr: "بعد حل النزاع، يتم إرجاع المبلغ إلى محفظتك خلال يومين عمل.",
    open: "مفتوح",
    investigating: "قيد التحقيق",
    resolved: "تم الحل",
    pendingFunds: "في انتظار الاسترداد",
  },
};

const STATUS_BG: Record<Dispute["status"], string> = {
  open: "bg-amber-100 text-amber-900",
  investigating: "bg-blue-100 text-blue-900",
  resolved: "bg-emerald-100 text-emerald-900",
};

/**
 * H-44 — Dispute detail view.
 *
 * Shows the dispute's status + timeline + order context. Reachable from
 * either an order detail (when status is "returned") or from the
 * Disputes list. Phase 1 doesn't have a real support inbox; tapping
 * "Chat with support" surfaces a Phase 3 placeholder alert.
 */
export const DisputeView: React.FC<DisputeViewProps> = ({
  order,
  dispute,
  onBack,
  onContactSupport,
}) => {
  const { language } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const first = order.lineItems[0];
  const productLabel = first
    ? isAr
      ? first.product.titleAr
      : first.product.titleEn
    : "";

  const status = dispute?.status ?? "open";
  const reason = dispute?.reason ?? "not_as_described";
  const timeline = dispute?.timeline ?? [];

  const reasonLabel = (() => {
    if (!dispute) return "";
    const map: Record<string, { en: string; ar: string }> = {
      not_received: { en: "Item not received", ar: "لم أستلم المنتج" },
      wrong_item: { en: "Wrong item shipped", ar: "تم شحن منتج خاطئ" },
      damaged: { en: "Damaged in transit", ar: "تالف عند الاستلام" },
      not_as_described: { en: "Not as described", ar: "لا يطابق الوصف" },
      counterfeit: { en: "Suspected counterfeit", ar: "يشتبه بأنه مقلد" },
      other: { en: "Other", ar: "أخرى" },
    };
    return (isAr ? map[reason]?.ar : map[reason]?.en) ?? "";
  })();

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

      {/* Status hero */}
      <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-lg flex items-start gap-md shadow-sm">
        <span
          className="material-symbols-outlined text-[36px] text-amber-600 no-mirror"
          aria-hidden="true"
        >
          gavel
        </span>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-outline font-bold">
            {t.statusHeading}
          </div>
          <div className="flex items-center gap-sm mt-1">
            <span
              className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${STATUS_BG[status]}`}
            >
              {status === "open"
                ? t.open
                : status === "investigating"
                  ? t.investigating
                  : t.resolved}
            </span>
          </div>
          <p className="text-label-sm text-on-surface-variant mt-2">
            {t.pendingFunds} {formatAEDLabel(order.total)}
          </p>
        </div>
      </section>

      {/* Order context */}
      <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex items-center gap-md">
        {first && (
          <img
            alt={productLabel}
            src={first.product.image}
            className="w-14 h-14 rounded object-cover border border-outline-variant flex-shrink-0"
          />
        )}
        <div className="flex-grow min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-outline font-bold">
            {t.shipmentOrder} #{order.id}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-outline font-bold">
            {t.productLine}
          </div>
          <p className="font-serif text-label-md text-on-surface line-clamp-1">
            {productLabel}
          </p>
          {reasonLabel && (
            <p className="text-label-sm text-on-surface-variant mt-1">
              <span className="text-[10px] uppercase tracking-wider text-outline font-bold">
                {t.reason}:{" "}
              </span>
              {reasonLabel}
            </p>
          )}
        </div>
      </section>

      {/* Timeline */}
      {timeline.length > 0 && (
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md">
          <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-sm">
            {t.timelineHeading}
          </h2>
          <ol className="flex flex-col gap-md">
            {timeline.map((event, idx) => (
              <li key={idx} className="flex gap-sm items-start">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === timeline.length - 1
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-outline border border-outline-variant"
                    }`}
                  >
                    {idx === timeline.length - 1 ? "✓" : ""}
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className="w-[2px] flex-grow bg-surface-container-high my-1 min-h-6" />
                  )}
                </div>
                <div className="flex-grow">
                  <p
                    className={`text-label-md font-bold ${
                      idx === timeline.length - 1
                        ? "text-on-surface"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {event.status === "open"
                      ? t.open
                      : event.status === "investigating"
                        ? t.investigating
                        : t.resolved}
                  </p>
                  <p className="text-label-sm text-on-surface">
                    {isAr ? event.descriptionAr : event.descriptionEn}
                  </p>
                  <p className="text-[10px] text-outline">
                    {new Date(event.date).toLocaleDateString(
                      isAr ? "ar" : "en-US",
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Description */}
      {dispute?.body && (
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md">
          <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">
            {t.body}
          </h2>
          <p className="text-label-sm text-on-surface whitespace-pre-line">
            {dispute.body}
          </p>
        </section>
      )}

      {/* CTAs */}
      <div className="flex gap-sm justify-end">
        {onContactSupport && (
          <button
            type="button"
            onClick={onContactSupport}
            className="flex-1 py-3 rounded-xl border-2 border-primary text-primary text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
          >
            {t.chatWithSupport}
          </button>
        )}
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
        >
          {t.backToOrder}
        </button>
      </div>

      <p className="text-[11px] text-on-surface-variant text-center px-1">
        {isAr ? t.resolveHintAr : t.resolveHint}
      </p>
    </div>
  );
};
