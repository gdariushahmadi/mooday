"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

interface PayoutsViewProps {
  onBack: () => void;
}

export const PayoutsView: React.FC<PayoutsViewProps> = ({ onBack }) => {
  const { language } = useApp();
  const isAr = language === "ar";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="mx-auto flex w-full max-w-[800px] flex-col gap-md pb-10"
    >
      <div className="app-page-header flex items-center justify-between -mt-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={isAr ? "رجوع" : "Back"}
          className="flex items-center gap-1 py-1 pe-2 text-primary transition-transform active:scale-95"
        >
          <span
            className="material-symbols-outlined no-mirror text-[22px]"
            aria-hidden="true"
          >
            arrow_back
          </span>
        </button>
        <h1 className="font-serif text-label-lg tracking-widest text-on-surface">
          {isAr ? "المدفوعات" : "Payouts"}
        </h1>
        <div className="h-8 w-8" aria-hidden="true" />
      </div>

      <section
        className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl text-center"
        role="status"
      >
        <span
          className="material-symbols-outlined text-[56px] text-outline"
          aria-hidden="true"
        >
          account_balance
        </span>
        <h2 className="mt-md font-serif text-headline-sm text-on-surface">
          {isAr
            ? "السحب غير متاح في النسخة التجريبية"
            : "Payouts are not available in Demo mode"}
        </h2>
        <p className="mt-sm text-body-md text-on-surface-variant">
          {isAr
            ? "المدفوعات وتحويل أرباح البائعين غير مفعّلة في هذه النسخة العامة. لن يتم إنشاء رصيد أو تحويل حقيقي."
            : "Real payments and seller payouts are disabled for this public beta. No seller balance or payout will be created."}
        </p>
      </section>
    </div>
  );
};
