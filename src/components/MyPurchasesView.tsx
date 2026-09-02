"use client";

import React, { useMemo } from "react";
import { useApp, type DemoOrder } from "@/context/AppContext";
import {
  type Order,
  type OrderStatus,
  ORDER_STATUS_LABEL_EN,
  ORDER_STATUS_LABEL_AR,
  ORDER_STATUS_TONE,
  formatOrderDate,
} from "@/data/orders";
import { ClickableCard } from "./ClickableCard";
import { formatAEDLabel } from "@/lib/format";
import { AppImage } from "@/components/AppImage";
import { isPaymentsEnabled } from "@/lib/feature-flags";

interface MyPurchasesViewProps {
  onBack: () => void;
  onOpenOrder: (orderId: string) => void;
  onContactSeller?: (order: Order) => void;
  /** Open leave-review for a delivered order. */
  onLeaveReview?: (orderId: string) => void;
}

interface PurchasesCopy {
  title: string;
  active: string;
  past: string;
  emptyTitle: string;
  emptyBody: string;
  emptyCta: string;
  back: string;
  review: string;
  reorder: string;
  reorderUnavailable: string;
  contact: string;
  totalLabel: string;
  itemLabel: (n: number) => string;
  filterAll: string;
  filterActive: string;
  filterCompleted: string;
  filterCancelled: string;
  demoNotice: string;
  demoLabel: string;
  demoReceipt: string;
}

const COPY: Record<"en" | "ar", PurchasesCopy> = {
  en: {
    title: "My purchases",
    active: "Active",
    past: "Past",
    emptyTitle: "Nothing here yet",
    emptyBody: "Once you place your first order, it'll appear here so you can track it from processing through delivery.",
    emptyCta: "Browse the feed",
    back: "Back",
    review: "Leave a review",
    reorder: "Reorder",
    reorderUnavailable: "Unavailable in Demo",
    contact: "Contact seller",
    totalLabel: "Total",
    itemLabel: (n) => `${n} item${n === 1 ? "" : "s"}`,
    filterAll: "All",
    filterActive: "Active",
    filterCompleted: "Completed",
    filterCancelled: "Cancelled",
    demoNotice:
      "Demo checkout saves a browser-only receipt. No payment, shipment, or seller payout is created.",
    demoLabel: "Demo",
    demoReceipt: "Browser-only receipt. No payment was taken.",
  },
  ar: {
    title: "مشترياتي",
    active: "نشطة",
    past: "سابقة",
    emptyTitle: "لا شيء هنا بعد",
    emptyBody: "بمجرد تسجيل طلبك الأول، سيظهر هنا لتتمكن من متابعته من المعالجة حتى التسليم.",
    emptyCta: "تصفح الرئيسية",
    back: "رجوع",
    review: "اترك تقييم",
    reorder: "إعادة الطلب",
    reorderUnavailable: "غير متاح في النسخة التجريبية",
    contact: "تواصل مع البائع",
    totalLabel: "الإجمالي",
    itemLabel: (n) => `${n} منتج${n === 1 ? "" : "ات"}`,
    filterAll: "الكل",
    filterActive: "نشطة",
    filterCompleted: "مكتملة",
    filterCancelled: "ملغية",
    demoNotice:
      "يحفظ الدفع التجريبي إيصالاً في المتصفح فقط. لا يتم إنشاء دفع أو شحن أو تحويل للبائع.",
    demoLabel: "تجريبي",
    demoReceipt: "إيصال في المتصفح فقط. لم يتم خصم أي مبلغ.",
  },
};

type FilterId = "all" | "active" | "completed" | "cancelled";

/**
 * C-16 — My Purchases.
 *
 * Shows the buyer's full purchase history as a scrollable list of order
 * cards, filterable by status bucket. Tapping a card opens C-17 Order
 * Tracking. Empty state when the user has no orders. Bilingual EN/AR.
 *
 * Re-uses `ClickableCard` for keyboard-accessible cards. Demo receipts are
 * read-only and stay separate from the real order collection.
 */
export const MyPurchasesView: React.FC<MyPurchasesViewProps> = ({
  onBack,
  onOpenOrder,
  onContactSeller,
  onLeaveReview,
}) => {
  const { language, orders, demoOrders = [] } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;
  const paymentsEnabled = isPaymentsEnabled();
  const [filter, setFilter] = React.useState<FilterId>("all");

  const filtered = useMemo(() => {
    return orders
      .slice()
      .sort(
        (a, b) =>
          new Date(b.dateOrdered).getTime() -
          new Date(a.dateOrdered).getTime(),
      )
      .filter((o) => {
        if (filter === "all") return true;
        if (filter === "active") {
          return o.status === "processing" || o.status === "shipped";
        }
        if (filter === "completed") {
          return o.status === "delivered" || o.status === "returned";
        }
        return o.status === "cancelled";
      });
  }, [orders, filter]);

  const visibleDemoOrders = filter === "all"
    ? demoOrders.slice().sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    : [];
  const hasVisibleOrders = filtered.length > 0 || visibleDemoOrders.length > 0;

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="w-full flex flex-col gap-md">
      {/* Header */}
      <div className="app-page-header flex items-center justify-between -mt-2">
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

      {!paymentsEnabled && (
        <p role="status" className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-label-sm text-on-surface-variant">
          {t.demoNotice}
        </p>
      )}

      {/* Filter strip */}
      <div
        role="tablist"
        aria-label={isAr ? "تصفية الطلبات" : "Order filters"}
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-margin-mobile px-margin-mobile"
      >
        {(
          [
            { id: "all", label: t.filterAll },
            { id: "active", label: t.filterActive },
            { id: "completed", label: t.filterCompleted },
            { id: "cancelled", label: t.filterCancelled },
          ] as { id: FilterId; label: string }[]
        ).map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-label-sm uppercase tracking-wider transition-all border ${
              filter === f.id
                ? "bg-primary text-on-primary border-primary font-bold"
                : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!hasVisibleOrders ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            package_2
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
          {visibleDemoOrders.map((order) => (
            <DemoReceiptCard key={order.id} order={order} isAr={isAr} t={t} />
          ))}
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isAr={isAr}
              t={t}
              onOpen={() => onOpenOrder(order.id)}
              onReview={() =>
                onLeaveReview
                  ? onLeaveReview(order.id)
                  : onOpenOrder(order.id)
              }
              onContact={() => onContactSeller?.(order)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Sub-components ----------

const OrderCard: React.FC<{
  order: Order;
  isAr: boolean;
  t: PurchasesCopy;
  onOpen: () => void;
  onReview: () => void;
  onContact: () => void;
}> = ({ order, isAr, t, onOpen, onReview, onContact }) => {
  const statusLabel = isAr
    ? ORDER_STATUS_LABEL_AR[order.status]
    : ORDER_STATUS_LABEL_EN[order.status];
  const tone = ORDER_STATUS_TONE[order.status];
  const first = order.lineItems[0]?.product;
  const remaining = order.lineItems.length - 1;
  const productTitle = first
    ? isAr
      ? first.titleAr
      : first.titleEn
    : "";
  return (
    <ClickableCard
      as="article"
      onClick={onOpen}
      ariaLabel={`${statusLabel} — ${productTitle}, ${formatOrderDate(order.dateOrdered, isAr)}`}
      className="bg-surface-container-lowest border border-surface-container-high rounded-xl overflow-hidden hover:shadow-md transition-shadow relative"
    >
      <div className="flex gap-sm p-md">
        {first && (
          <AppImage
            alt={productTitle}
            src={first.image || "/products/placeholder.svg"}
            width={80}
            height={80}
            sizes="80px"
            className="h-20 w-20 flex-shrink-0 rounded border border-outline-variant object-cover"
          />
        )}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <StatusBadge status={order.status} tone={tone} label={statusLabel} />
            <span className="text-[10px] text-outline">
              {formatOrderDate(order.dateOrdered, isAr)}
            </span>
          </div>
          <h3 className="font-serif text-label-md text-on-surface line-clamp-1">
            {productTitle}
          </h3>
          {remaining > 0 && (
            <p className="text-label-sm text-on-surface-variant">
              +{remaining} {isAr ? "منتجات أخرى" : "more items"}
            </p>
          )}
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-outline uppercase tracking-wider">
              {t.itemLabel(order.lineItems.length)}
            </span>
            <span className="text-label-sm font-bold text-primary">
              {t.totalLabel}: {formatAEDLabel(order.total)}
            </span>
          </div>
        </div>
      </div>
      {order.status === "delivered" && (
        <div className="border-t border-surface-container-high px-md py-sm flex gap-sm justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReview();
            }}
            aria-label={t.review}
            className="text-label-sm text-primary font-bold active:scale-95 transition-transform"
          >
            {t.review}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onContact();
            }}
            aria-label={t.contact}
            className="text-label-sm text-on-surface-variant font-bold active:scale-95 transition-transform"
          >
            {t.contact}
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label={`${t.reorder}: ${t.reorderUnavailable}`}
            title={t.reorderUnavailable}
            className="text-label-sm text-outline font-bold cursor-not-allowed"
          >
            {t.reorder} · {t.reorderUnavailable}
          </button>
        </div>
      )}
    </ClickableCard>
  );
};

const DemoReceiptCard: React.FC<{
  order: DemoOrder;
  isAr: boolean;
  t: PurchasesCopy;
}> = ({ order, isAr, t }) => {
  const productTitle = isAr ? order.product.titleAr : order.product.titleEn;
  return (
    <article
      aria-label={`${t.demoLabel} — ${productTitle}`}
      className="bg-surface-container-lowest border border-dashed border-primary/50 rounded-xl overflow-hidden"
    >
      <div className="flex gap-sm p-md">
        <AppImage
          alt={productTitle}
          src={order.product.image || "/products/placeholder.svg"}
          width={80}
          height={80}
          sizes="80px"
          className="h-20 w-20 flex-shrink-0 rounded border border-outline-variant object-cover"
        />
        <div className="min-w-0 flex-grow">
          <div className="flex items-center justify-between mb-1 gap-sm">
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
              {t.demoLabel}
            </span>
            <span className="text-[10px] text-outline">
              {formatOrderDate(order.createdAt, isAr)}
            </span>
          </div>
          <h3 className="font-serif text-label-md text-on-surface line-clamp-1">
            {productTitle}
          </h3>
          <p className="text-[10px] text-on-surface-variant mt-1">
            {t.demoReceipt}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-outline uppercase tracking-wider">
              {order.id}
            </span>
            <span className="text-label-sm font-bold text-primary">
              {t.totalLabel}: {formatAEDLabel(order.total)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

const STATUS_TONE_CLASSES: Record<
  "default" | "success" | "warning" | "error" | "info",
  string
> = {
  default: "bg-surface-container-high text-on-surface",
  success: "bg-primary text-on-primary",
  warning: "bg-amber-100 text-amber-900",
  error: "bg-red-100 text-red-900",
  info: "bg-blue-100 text-blue-900",
};

const StatusBadge: React.FC<{
  status: OrderStatus;
  tone: "default" | "success" | "warning" | "error" | "info";
  label: string;
}> = ({ tone, label }) => (
  <span
    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${STATUS_TONE_CLASSES[tone]}`}
  >
    {label}
  </span>
);
