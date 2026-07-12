"use client";

import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { type Sale, shipmentLabel, payoutLabel } from "@/data/sales";
import { deriveSalesFromOrders } from "@/data/sales";
import { formatAEDLabel } from "@/lib/format";

interface SalesCopy {
  title: string;
  back: string;
  availableLabel: string;
  pendingLabel: string;
  paidOutLabel: string;
  shipmentHeading: string;
  payoutHeading: string;
  markShipped: string;
  shipBulk: string;
  cancel: string;
  filterAll: string;
  filterAwaiting: string;
  filterInTransit: string;
  filterDelivered: string;
  payoutPending: string;
  payoutAvailable: string;
  payoutPaidOut: string;
  emptyTitle: string;
  emptyBody: string;
}

const COPY: Record<"en" | "ar", SalesCopy> = {
  en: {
    title: "My sales",
    back: "Back",
    availableLabel: "Available balance",
    pendingLabel: "Pending",
    paidOutLabel: "Paid out (last 30d)",
    shipmentHeading: "Shipment",
    payoutHeading: "Payout",
    markShipped: "Mark as shipped",
    shipBulk: "Ship all",
    cancel: "Cancel",
    filterAll: "All",
    filterAwaiting: "Awaiting",
    filterInTransit: "In transit",
    filterDelivered: "Delivered",
    payoutPending: "Pending",
    payoutAvailable: "Available",
    payoutPaidOut: "Paid out",
    emptyTitle: "No sales yet",
    emptyBody:
      "Once a buyer purchases one of your listings, you'll see it here with shipment tracking and your payout breakdown.",
  },
  ar: {
    title: "مبيعاتي",
    back: "رجوع",
    availableLabel: "رصيد متاح",
    pendingLabel: "قيد الانتظار",
    paidOutLabel: "تم تحويله (آخر 30 يوم)",
    shipmentHeading: "الشحن",
    payoutHeading: "الدفع",
    markShipped: "تم الشحن",
    shipBulk: "شحن الكل",
    cancel: "إلغاء",
    filterAll: "الكل",
    filterAwaiting: "بانتظار",
    filterInTransit: "في الطريق",
    filterDelivered: "تم التسليم",
    payoutPending: "قيد الانتظار",
    payoutAvailable: "متاح",
    payoutPaidOut: "تم التحويل",
    emptyTitle: "لا مبيعات بعد",
    emptyBody:
      "بمجرد أن يشتري أحد منتجاتك، ستجدها هنا مع تفاصيل الشحن وتوزيع المبلغ.",
  },
};

const PayoutBadge: React.FC<{
  tone: "info" | "success" | "warning" | "neutral";
  label: string;
}> = ({ tone, label }) => {
  const cls =
    tone === "success"
      ? "bg-emerald-100 text-emerald-900"
      : tone === "warning"
        ? "bg-amber-100 text-amber-900"
        : tone === "info"
          ? "bg-blue-100 text-blue-900"
          : "bg-surface-container-high text-on-surface-variant";
  return (
    <span
      className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${cls}`}
    >
      {label}
    </span>
  );
};

const ShipmentBadge: React.FC<{ tone: "info" | "success"; label: string }> = ({
  tone,
  label,
}) => (
  <PayoutBadge tone={tone === "success" ? "success" : "info"} label={label} />
);

interface MySalesViewProps {
  onBack: () => void;
  onOpenOrder?: (orderId: string) => void;
}

type FilterId = "all" | "awaiting_pickup" | "in_transit" | "delivered";

/**
 * D-22 — My Sales.
 *
 * Seller-side view of all incoming orders with shipment + payout status.
 * At the top sits a balance card aggregating pending / available /
 * paid-out funds. Each row shows the line items, courier, and CTAs to
 * flip `awaiting_pickup` → `in_transit`.
 */
export const MySalesView: React.FC<MySalesViewProps> = ({
  onBack,
  onOpenOrder,
}) => {
  const { language, orders, updateOrderStatus } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;
  const [filter, setFilter] = React.useState<FilterId>("all");

  const sales: Sale[] = useMemo(() => deriveSalesFromOrders(orders), [orders]);

  const totals = useMemo(() => {
    let pending = 0;
    let available = 0;
    let paidOut = 0;
    for (const s of sales) {
      if (s.payout === "pending") pending += s.payoutAmount;
      else if (s.payout === "available") available += s.payoutAmount;
      else paidOut += s.payoutAmount;
    }
    return { pending, available, paidOut };
  }, [sales]);

  const filtered = useMemo(() => {
    if (filter === "all") return sales;
    return sales.filter((s) => s.shipment === filter);
  }, [sales, filter]);

  const handleMarkShipped = (sale: Sale) => {
    if (sale.shipment !== "awaiting_pickup") return;
    updateOrderStatus(sale.id, "shipped");
  };

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
          {t.title}
        </h1>
        <div className="w-8 h-8" aria-hidden="true" />
      </div>

      {/* Balance card */}
      <section className="bg-gradient-to-br from-primary to-primary/70 text-on-primary rounded-2xl p-lg shadow-md">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">
          {t.availableLabel}
        </div>
        <div className="font-serif text-headline-md">
          {formatAEDLabel(totals.available + totals.pending)}
        </div>
        <div className="grid grid-cols-2 gap-md mt-3 text-[11px] uppercase tracking-wider font-bold opacity-90">
          <div>
            <div className="opacity-70">{t.pendingLabel}</div>
            <div className="text-body-md font-bold mt-0.5">
              {formatAEDLabel(totals.pending)}
            </div>
          </div>
          <div>
            <div className="opacity-70">{t.paidOutLabel}</div>
            <div className="text-body-md font-bold mt-0.5">
              {formatAEDLabel(totals.paidOut)}
            </div>
          </div>
        </div>
      </section>

      {/* Filter chips */}
      <div
        role="tablist"
        aria-label={isAr ? "تصفية المبيعات" : "Sales filters"}
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-margin-mobile px-margin-mobile"
      >
        {(
          [
            ["all", t.filterAll],
            ["awaiting_pickup", t.filterAwaiting],
            ["in_transit", t.filterInTransit],
            ["delivered", t.filterDelivered],
          ] as [FilterId, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-label-sm uppercase tracking-wider transition-all border ${
              filter === id
                ? "bg-primary text-on-primary border-primary font-bold"
                : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sale cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            storefront
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
          {filtered.map((sale) => (
            <SaleCard
              key={sale.id}
              sale={sale}
              isAr={isAr}
              t={t}
              onMarkShipped={() => handleMarkShipped(sale)}
              onOpenOrder={() => onOpenOrder?.(sale.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SaleCard: React.FC<{
  sale: Sale;
  isAr: boolean;
  t: SalesCopy;
  onMarkShipped: () => void;
  onOpenOrder: () => void;
}> = ({ sale, isAr, t, onMarkShipped, onOpenOrder }) => {
  const first = sale.lineItems[0]?.product;
  const productTitle = first
    ? isAr
      ? first.titleAr
      : first.titleEn
    : isAr
      ? "منتج"
      : "Item";
  const item = (
    <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md hover:shadow-sm transition-shadow">
      <div className="flex gap-sm items-start">
        {first && (
          <img
            alt={productTitle}
            src={first.image}
            className="w-16 h-16 rounded object-cover border border-outline-variant flex-shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex-grow min-w-0">
          <p className="font-serif text-label-sm text-on-surface line-clamp-1">
            {productTitle}
          </p>
          <p className="text-[10px] text-outline uppercase tracking-wider">
            {isAr ? "المشتري" : "Buyer"}:{" "}
            {isAr ? sale.buyerNameAr : sale.buyerNameEn}
          </p>
          <p className="text-[10px] text-outline uppercase tracking-wider">
            {isAr ? "إلى" : "To"}:{" "}
            {isAr ? sale.shipToCityAr : sale.shipToCityEn}
          </p>
          <div className="flex flex-wrap items-center gap-sm mt-1">
            <ShipmentBadge
              tone={sale.shipment === "delivered" ? "success" : "info"}
              label={shipmentLabel(sale.shipment, isAr)}
            />
            <PayoutBadge
              tone={
                sale.payout === "paid_out"
                  ? "success"
                  : sale.payout === "available"
                    ? "warning"
                    : "info"
              }
              label={payoutLabel(sale.payout, isAr)}
            />
          </div>
        </div>
        <div className="text-end">
          <div className="text-label-md font-bold text-primary">
            {formatAEDLabel(sale.payoutAmount)}
          </div>
          <div className="text-[10px] text-outline">
            −{formatAEDLabel(sale.commission)} {isAr ? "عمولة" : "fee"}
          </div>
        </div>
      </div>
      <div className="flex gap-sm justify-end mt-3">
        {sale.shipment === "awaiting_pickup" && (
          <button
            type="button"
            onClick={onMarkShipped}
            className="px-3 py-2 rounded-full bg-primary text-on-primary text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform"
          >
            {t.markShipped}
          </button>
        )}
        <button
          type="button"
          onClick={onOpenOrder}
          className="px-3 py-2 rounded-full border border-primary text-primary text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform"
        >
          {isAr ? "التفاصيل" : "Details"}
        </button>
      </div>
    </div>
  );
  return item;
};
