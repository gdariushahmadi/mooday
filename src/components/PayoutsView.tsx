"use client";

import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  type Sale,
  deriveSalesFromOrders,
  shipmentLabel,
  payoutLabel,
} from "@/data/sales";
import { formatAEDLabel } from "@/lib/format";

interface PayoutsViewProps {
  onBack: () => void;
}

interface PayoutsCopy {
  title: string;
  back: string;
  availableLabel: string;
  pendingLabel: string;
  paidOutLabel: string;
  methodHeading: string;
  methodValue: string;
  history: string;
  historyEmpty: string;
  paidOn: string;
  shipmentAwaiting: string;
  shipmentInTransit: string;
  shipmentDelivered: string;
  cashout: string;
  cashoutHint: string;
  payoutMethods: string;
}

const COPY: Record<"en" | "ar", PayoutsCopy> = {
  en: {
    title: "Payouts",
    back: "Back",
    availableLabel: "Available for payout",
    pendingLabel: "Pending in escrow",
    paidOutLabel: "Paid out (lifetime)",
    methodHeading: "Default payout method",
    methodValue: "ENBD **** 8842",
    history: "History",
    historyEmpty: "No payout history yet.",
    paidOn: "Paid on",
    shipmentAwaiting: "Awaiting pickup",
    shipmentInTransit: "In transit",
    shipmentDelivered: "Delivered",
    cashout: "Cash out now",
    cashoutHint:
      "Transfers to your bank within 1-2 business days (Phase 3 wires this).",
    payoutMethods: "Manage payout methods",
  },
  ar: {
    title: "المدفوعات",
    back: "رجوع",
    availableLabel: "متاح للسحب",
    pendingLabel: "قيد الانتظار في الضمان",
    paidOutLabel: "تم التحويل (الإجمالي)",
    methodHeading: "طريقة الدفع الافتراضية",
    methodValue: "ENBD **** 8842",
    history: "السجل",
    historyEmpty: "لا يوجد سجل مدفوعات بعد.",
    paidOn: "تم التحويل في",
    shipmentAwaiting: "بانتظار الاستلام",
    shipmentInTransit: "في الطريق",
    shipmentDelivered: "تم التسليم",
    cashout: "اسحب الآن",
    cashoutHint:
      "التحويل إلى حسابك البنكي خلال ١-٢ أيام عمل (Phase 3).",
    payoutMethods: "إدارة طرق السحب",
  },
};

/**
 * H-42 — Payouts (seller-side financial hub).
 *
 * Sister to D-22 My Sales: where `MySalesView` emphasises individual
 * sales + shipment status, `PayoutsView` emphasises balances + payment
 * method + lifetime totals. The breakdown:
 *
 *  - **Balance card**: pending / available / lifetime totals (sums over
 *    all sales).
 *  - **Method card**: ENBD **** 8842 — Phase 1 mock. "Cash out now" +
 *    "Manage payout methods" lead to Phase 3 placeholders.
 *  - **History**: every sale row with payout pill + paid-out timestamp.
 */
export const PayoutsView: React.FC<PayoutsViewProps> = ({ onBack }) => {
  const { language, orders } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

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

  const historyRows = sales
    .slice()
    .sort((a, b) => {
      // Paid out first (by date), then available, then pending.
      if (a.payout === "paid_out" && b.payout !== "paid_out") return -1;
      if (b.payout === "paid_out" && a.payout !== "paid_out") return 1;
      if (a.paidOutAt && b.paidOutAt) {
        return (
          new Date(b.paidOutAt).getTime() - new Date(a.paidOutAt).getTime()
        );
      }
      return 0;
    });

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

      {/* Available card */}
      <section className="bg-gradient-to-br from-primary to-primary/70 text-on-primary rounded-2xl p-lg shadow-md">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">
          {t.availableLabel}
        </div>
        <div className="font-serif text-headline-md">
          {formatAEDLabel(totals.available)}
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

      {/* Method card */}
      <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-primary font-bold">
            {t.methodHeading}
          </div>
          <div className="font-serif text-label-md text-on-surface">
            {t.methodValue}
          </div>
        </div>
        <div className="flex flex-col gap-sm">
          <button
            type="button"
            disabled
            title={t.cashoutHint}
            className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-label-sm font-bold uppercase tracking-wider opacity-50 cursor-not-allowed"
          >
            {t.cashout}
          </button>
          <button
            type="button"
            disabled
            title={t.cashoutHint}
            className="text-[10px] text-primary font-bold uppercase tracking-wider self-end opacity-50 cursor-not-allowed"
          >
            {t.payoutMethods}
          </button>
        </div>
      </section>
      <p className="text-[11px] text-on-surface-variant px-1 -mt-2">
        {t.cashoutHint}
      </p>

      {/* History */}
      <section>
        <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-sm">
          {t.history}
        </h2>
        {historyRows.length === 0 ? (
          <p className="text-label-sm text-on-surface-variant">{t.historyEmpty}</p>
        ) : (
          <div className="flex flex-col gap-sm">
            {historyRows.map((s) => {
              const product = s.lineItems[0]?.product;
              return (
                <div
                  key={s.id}
                  className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex items-center gap-md"
                >
                  {product && (
                    <img
                      alt=""
                      src={product.image}
                      className="w-12 h-12 rounded object-cover border border-outline-variant flex-shrink-0"
                    />
                  )}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-sm mb-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                        {payoutLabel(s.payout, isAr)}
                      </span>
                      <span className="text-[10px] text-outline">
                        {shipmentLabel(s.shipment, isAr)}
                      </span>
                    </div>
                    <p className="text-label-sm text-on-surface truncate">
                      {s.orderId}
                    </p>
                    {s.paidOutAt && (
                      <p className="text-[10px] text-outline">
                        {t.paidOn} {new Date(s.paidOutAt).toLocaleDateString(
                          isAr ? "ar" : "en-US",
                        )}
                      </p>
                    )}
                  </div>
                  <span className="text-label-sm font-bold text-primary">
                    {formatAEDLabel(s.payoutAmount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
