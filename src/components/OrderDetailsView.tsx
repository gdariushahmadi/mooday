"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import {
  type Order,
  type OrderTimelineEvent,
  formatOrderDate,
  statusLabel,
} from "@/data/orders";
import { formatAEDLabel } from "@/lib/format";
import { ClickableCard } from "./ClickableCard";
import type { Product } from "@/context/AppContext";

interface OrderDetailsViewProps {
  order: Order;
  onBack: () => void;
  /** Tap on a line item product to open ProductDetailsView. */
  onSelectProduct: (product: Product) => void;
  /** "Mark as received" — moves the order from shipped → delivered. */
  onMarkReceived?: (orderId: string) => void;
  /** "Contact seller" for this order's primary product. */
  onContactSeller?: (product: Product) => void;
  /** H-39 Leave a review (delivered orders only). */
  onLeaveReview?: () => void;
  /** H-40 Report this order. */
  onReportOrder?: () => void;
  /** H-41 Return / Refund. */
  onReturnRequest?: () => void;
  /** H-44 View dispute. */
  onOpenDispute?: () => void;
  /** H-44b Open disputes list. */
  onOpenDisputesList?: () => void;
}

interface OrderCopy {
  title: (id: string) => string;
  back: string;
  placed: string;
  courier: (courier: string, tracking: string) => string;
  timeline: string;
  statusLabel: string;
  itemsHeading: string;
  shippingHeading: string;
  paymentHeading: string;
  summaryHeading: string;
  total: string;
  subtotal: string;
  shippingLabel: string;
  markReceived: string;
  contactSeller: string;
  notFound: string;
  backToPurchases: string;
  trackingLabel: string;
  // Group H CTAs
  leaveReview: string;
  reportOrder: string;
  startReturn: string;
  openDispute: string;
  viewAllDisputes: string;
}

const COPY: Record<"en" | "ar", OrderCopy> = {
  en: {
    title: (id) => `Order ${id}`,
    back: "Back to purchases",
    placed: "Placed",
    courier: (courier, tracking) => `${courier} · ${tracking}`,
    timeline: "Tracking timeline",
    statusLabel: "Status",
    itemsHeading: "Items",
    shippingHeading: "Shipping to",
    paymentHeading: "Paid with",
    summaryHeading: "Order summary",
    total: "Total",
    subtotal: "Subtotal",
    shippingLabel: "Shipping",
    markReceived: "I received it",
    contactSeller: "Contact seller",
    notFound: "Order not found",
    backToPurchases: "Back to my purchases",
    trackingLabel: "Tracking number",
    leaveReview: "Leave a review",
    reportOrder: "Report",
    startReturn: "Return / Refund",
    openDispute: "View dispute",
    viewAllDisputes: "All disputes",
  },
  ar: {
    title: (id) => `الطلب ${id}`,
    back: "العودة إلى المشتريات",
    placed: "تم التسجيل",
    courier: (courier, tracking) => `${courier} · ${tracking}`,
    timeline: "الجدول الزمني للشحن",
    statusLabel: "الحالة",
    itemsHeading: "المنتجات",
    shippingHeading: "التوصيل إلى",
    paymentHeading: "الدفع بواسطة",
    summaryHeading: "ملخص الطلب",
    total: "الإجمالي",
    subtotal: "المجموع الفرعي",
    shippingLabel: "الشحن",
    markReceived: "استلمت الطلب",
    contactSeller: "تواصل مع البائع",
    notFound: "الطلب غير موجود",
    backToPurchases: "العودة إلى مشترياتي",
    trackingLabel: "رقم التتبع",
    leaveReview: "اترك تقييماً",
    reportOrder: "الإبلاغ",
    startReturn: "إرجاع / استرداد",
    openDispute: "عرض النزاع",
    viewAllDisputes: "كل النزاعات",
  },
};

/**
 * C-17 — Order Details & Tracking.
 *
 * A single-order deep view. Shows:
 *  - order id + status badge + date placed
 *  - courier + tracking number (mock — no real link)
 *  - 3-step tracking timeline rendered from the order's pre-baked
 *    `timeline` array
 *  - line items with thumbnails (taps to open ProductDetailsView)
 *  - shipping + payment summary
 *
 * If the order is `shipped`, the user can tap "I received it" to flip it
 * to `delivered` (calls `onMarkReceived`).
 */
export const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({
  order,
  onBack,
  onSelectProduct,
  onMarkReceived,
  onContactSeller,
  onLeaveReview,
  onReportOrder,
  onReturnRequest,
  onOpenDispute,
  onOpenDisputesList,
}) => {
  const { language } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const statusText = statusLabel(order.status, isAr);
  const firstItemProduct = order.lineItems[0]?.product;

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="w-full flex flex-col gap-md">
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
          {t.title(order.id)}
        </h1>
        <div className="w-8 h-8" aria-hidden="true" />
      </div>

      {/* Status hero */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-lg shadow-sm flex items-start gap-md">
        <span
          className="material-symbols-outlined text-[36px] text-primary no-mirror"
          aria-hidden="true"
        >
          {order.status === "delivered"
            ? "check_circle"
            : order.status === "shipped"
              ? "local_shipping"
              : order.status === "cancelled"
                ? "cancel"
                : order.status === "returned"
                  ? "undo"
                  : "hourglass_top"}
        </span>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-outline font-bold">
            {t.statusLabel}
          </div>
          <div className="font-bold text-on-surface text-headline-sm">
            {statusText}
          </div>
          <div className="text-label-sm text-on-surface-variant">
            {t.placed} {formatOrderDate(order.dateOrdered, isAr)}
          </div>
        </div>
      </div>

      {/* Courier + tracking */}
      <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md">
        <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold">
          {isAr ? "الشحن" : "Courier"}
        </h2>
        <p className="text-label-md text-on-surface font-bold mt-1">
          {isAr ? order.courier.nameAr : order.courier.nameEn}
        </p>
        <div className="mt-sm">
          <div className="text-[10px] uppercase tracking-wider text-outline font-bold">
            {t.trackingLabel}
          </div>
          <p className="text-label-md text-on-surface font-mono mt-0.5 break-all">
            {order.courier.trackingNumber}
          </p>
        </div>
      </section>

      {/* Tracking timeline */}
      <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md">
        <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-sm">
          {t.timeline}
        </h2>
        <ol className="flex flex-col gap-md">
          {order.timeline.map((event, idx) => (
            <TimelineRow
              key={`${event.date}-${idx}`}
              event={event}
              isAr={isAr}
              isLast={idx === order.timeline.length - 1}
            />
          ))}
        </ol>
      </section>

      {/* Items */}
      <section>
        <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-sm">
          {t.itemsHeading}
        </h2>
        <div className="flex flex-col gap-sm">
          {order.lineItems.map((item, idx) => (
            <LineItemRow
              key={`${item.product.id}-${idx}`}
              line={item}
              isAr={isAr}
              onSelect={() => onSelectProduct(item.product)}
            />
          ))}
        </div>
      </section>

      {/* Shipping + Payment summary */}
      <div className="grid grid-cols-2 gap-sm">
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md">
          <h3 className="text-[10px] uppercase tracking-wider text-primary font-bold">
            {t.shippingHeading}
          </h3>
          <p className="text-label-md text-on-surface mt-1">
            {isAr ? order.addressCityAr : order.addressCityEn}
          </p>
          <p className="text-label-sm text-on-surface-variant">
            {isAr ? order.addressStreetAr : order.addressStreetEn}
          </p>
        </section>
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md">
          <h3 className="text-[10px] uppercase tracking-wider text-primary font-bold">
            {t.paymentHeading}
          </h3>
          <p className="text-label-md text-on-surface mt-1">
            {isAr ? order.paymentBrandAr : order.paymentBrandEn}
            {" •••• "}
            {order.paymentLast4}
          </p>
        </section>
      </div>

      {/* Order summary */}
      <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md">
        <h3 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-sm">
          {t.summaryHeading}
        </h3>
        <div className="flex flex-col gap-xs text-label-sm text-on-surface-variant">
          <div className="flex justify-between">
            <span>{t.subtotal}:</span>
            <span>{formatAEDLabel(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t.shippingLabel}:</span>
            <span>
              {order.shipping === 0
                ? isAr
                  ? "مجاني"
                  : "FREE"
                : formatAEDLabel(order.shipping)}
            </span>
          </div>
        </div>
        <hr className="my-sm border-surface-container-high" />
        <div className="flex justify-between text-label-md font-bold text-primary">
          <span>{t.total}:</span>
          <span>{formatAEDLabel(order.total)}</span>
        </div>
      </section>

      {/* CTAs */}
      <div className="flex flex-col gap-sm mt-sm pb-8">
        <div className="flex gap-sm justify-end">
          {order.status === "shipped" && onMarkReceived && (
            <button
              type="button"
              onClick={() => onMarkReceived(order.id)}
              className="flex-1 btn-primary py-3 rounded-xl text-label-sm uppercase tracking-widest font-bold shadow-md active:scale-95 transition-transform"
            >
              {t.markReceived}
            </button>
          )}
          {firstItemProduct && onContactSeller && (
            <button
              type="button"
              onClick={() => onContactSeller(firstItemProduct)}
              className="flex-1 py-3 rounded-xl border-2 border-primary text-primary text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
            >
              {t.contactSeller}
            </button>
          )}
        </div>
        {/* Group H actions */}
        <div className="flex gap-sm justify-end flex-wrap">
          {order.status === "delivered" && onLeaveReview && (
            <button
              type="button"
              onClick={onLeaveReview}
              className="flex-1 min-w-[140px] py-3 rounded-xl bg-amber-100 text-amber-900 text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
            >
              {t.leaveReview}
            </button>
          )}
          {(order.status === "delivered" || order.status === "returned") &&
            onReturnRequest && (
              <button
                type="button"
                onClick={onReturnRequest}
                className="flex-1 min-w-[140px] py-3 rounded-xl border-2 border-orange-500 text-orange-700 text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
              >
                {t.startReturn}
              </button>
            )}
          {order.status === "returned" && onOpenDispute && (
            <button
              type="button"
              onClick={onOpenDispute}
              className="flex-1 min-w-[140px] py-3 rounded-xl border-2 border-error text-error text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
            >
              {t.openDispute}
            </button>
          )}
          {onReportOrder && (
            <button
              type="button"
              onClick={onReportOrder}
              className="flex-1 min-w-[140px] py-3 rounded-xl border border-outline-variant text-on-surface-variant text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
            >
              {t.reportOrder}
            </button>
          )}
          {onOpenDisputesList && (
            <button
              type="button"
              onClick={onOpenDisputesList}
              className="text-[10px] text-primary font-bold uppercase tracking-wider underline self-end"
            >
              {t.viewAllDisputes}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Sub-components ----------

const TimelineRow: React.FC<{
  event: OrderTimelineEvent;
  isAr: boolean;
  isLast: boolean;
}> = ({ event, isAr, isLast }) => {
  const isCurrent = isLast;
  return (
    <li className="flex gap-sm items-start">
      <div className="flex flex-col items-center">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            isCurrent
              ? "bg-primary text-on-primary"
              : "bg-surface-container-high text-outline border border-outline-variant"
          }`}
        >
          {isCurrent ? "✓" : ""}
        </div>
        {!isLast && (
          <div className="w-[2px] flex-grow bg-surface-container-high my-1 min-h-6" />
        )}
      </div>
      <div className="flex-grow">
        <p
          className={`text-label-md font-bold ${
            isCurrent ? "text-on-surface" : "text-on-surface-variant"
          }`}
        >
          {statusLabel(event.status, isAr)}
        </p>
        <p className="text-label-sm text-on-surface">
          {isAr ? event.descriptionAr : event.descriptionEn}
        </p>
        <p className="text-[10px] text-outline">
          {formatOrderDate(event.date, isAr)}
        </p>
      </div>
    </li>
  );
};

const LineItemRow: React.FC<{
  line: Order["lineItems"][number];
  isAr: boolean;
  onSelect: () => void;
}> = ({ line, isAr, onSelect }) => {
  const title = isAr ? line.product.titleAr : line.product.titleEn;
  return (
    <ClickableCard
      as="article"
      onClick={onSelect}
      ariaLabel={title}
      className="flex gap-sm p-sm border border-surface-container-high rounded-xl bg-surface-container-lowest hover:shadow-sm transition-shadow"
    >
      <img
        alt={title}
        src={line.product.image}
        className="w-16 h-16 rounded object-cover border border-outline-variant flex-shrink-0"
        loading="lazy"
      />
      <div className="flex-grow min-w-0">
        <p className="font-serif text-label-sm text-on-surface line-clamp-1">
          {title}
        </p>
        <p className="text-[10px] text-outline uppercase tracking-wider">
          {isAr ? line.product.conditionAr : line.product.conditionEn}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-on-surface-variant">
            {isAr ? "الكمية" : "Qty"} {line.quantity}
          </span>
          <span className="text-label-sm font-bold text-primary">
            {formatAEDLabel(line.priceAtPurchase * line.quantity)}
          </span>
        </div>
      </div>
    </ClickableCard>
  );
};
