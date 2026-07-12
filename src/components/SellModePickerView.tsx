"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

interface SellModePickerViewProps {
  onBack: () => void;
  /** User picked the Resell flow (currently: opens D-19 Create Listing). */
  onPickResell: () => void;
}

interface PickerCopy {
  title: string;
  intro: string;
  resellLabel: string;
  resellBody: string;
  rentLabel: string;
  rentBody: string;
  rentPill: string;
  resellCta: string;
  rentCta: string;
  back: string;
}

const COPY: Record<"en" | "ar", PickerCopy> = {
  en: {
    title: "What do you want to sell?",
    intro: "Pick a flow — you can change later from your closet.",
    resellLabel: "Resell",
    resellBody:
      "Sell a piece you own outright. Once it sells, the buyer takes ownership and you receive the payout via Mooday escrow.",
    rentLabel: "Rent out",
    rentBody:
      "List a piece to be rented out by weekly slots. Mooday handles the deposit, insurance, and returns.",
    rentPill: "Coming in Phase 4",
    resellCta: "Start reselling",
    rentCta: "Coming soon",
    back: "Back",
  },
  ar: {
    title: "ماذا تريدين أن تبيعي؟",
    intro: "اختاري المسار — يمكنكِ تغييره لاحقاً من خزانتك.",
    resellLabel: "إعادة بيع",
    resellBody:
      "بيعي قطعة تملكينها بالكامل. عند البيع، يستلمها المشتري وتحصلين على المبلغ عبر ضمان مودي.",
    rentLabel: "تأجير",
    rentBody:
      "اعرضي قطعة للإيجار الأسبوعي. مودي تتولى التأمين والودائع والإرجاع.",
    rentPill: "قريباً في Phase 4",
    resellCta: "ابدئي إعادة البيع",
    rentCta: "قريباً",
    back: "رجوع",
  },
};

/**
 * D-18 — Sell Mode Picker.
 *
 * First screen a user lands on after tapping the "Sell" tab on the
 * bottom nav. Resell is fully enabled and routes to D-19 Create
 * Listing. Rent is deliberately disabled with a Phase-4 tooltip — the
 * product's `mode` field already supports `"rent"` so we don't have to
 * rewrite anything when the data model flips on.
 */
export const SellModePickerView: React.FC<SellModePickerViewProps> = ({
  onBack,
  onPickResell,
}) => {
  const { language } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

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
      <p className="text-label-sm text-on-surface-variant px-1">{t.intro}</p>

      {/* Two big cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <ModeCard
          isAr={isAr}
          label={t.resellLabel}
          body={t.resellBody}
          icon="storefront"
          cta={t.resellCta}
          disabled={false}
          onClick={onPickResell}
        />
        <ModeCard
          isAr={isAr}
          label={t.rentLabel}
          body={t.rentBody}
          icon="event_available"
          cta={t.rentCta}
          disabled
          pill={t.rentPill}
        />
      </div>
    </div>
  );
};

const ModeCard: React.FC<{
  isAr: boolean;
  label: string;
  body: string;
  icon: string;
  cta: string;
  disabled: boolean;
  pill?: string;
  onClick?: () => void;
}> = ({ isAr, label, body, icon, cta, disabled, pill, onClick }) => (
  <button
    type="button"
    onClick={disabled ? undefined : onClick}
    aria-disabled={disabled}
    className={`text-start p-lg rounded-2xl border-2 transition-all flex flex-col gap-md ${
      disabled
        ? "border-outline-variant bg-surface-container-low opacity-60 cursor-not-allowed"
        : "border-primary bg-primary/5 hover:shadow-lg active:scale-[0.99]"
    }`}
  >
    <div className="flex items-center justify-between">
      <span
        className={`material-symbols-outlined text-[36px] no-mirror ${
          disabled ? "text-outline" : "text-primary"
        }`}
        aria-hidden="true"
      >
        {icon}
      </span>
      {pill && (
        <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-full">
          {pill}
        </span>
      )}
    </div>
    <div>
      <h2 className="font-serif text-headline-sm text-on-surface">{label}</h2>
      <p className="text-label-sm text-on-surface-variant mt-1">{body}</p>
    </div>
    <span
      className={`self-start px-4 py-2 rounded-full text-label-sm font-bold uppercase tracking-wider ${
        disabled
          ? "bg-surface-container-high text-on-surface-variant"
          : "bg-primary text-on-primary"
      }`}
    >
      {cta}
    </span>
    {isAr && <span className="sr-only">{label}</span>}
  </button>
);
