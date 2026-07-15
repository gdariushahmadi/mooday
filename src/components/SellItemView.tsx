"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { ListingForm } from "./listing/ListingForm";

interface SellItemViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface SellHeaderCopy {
  title: string;
}

const COPY: Record<"en" | "ar", SellHeaderCopy> = {
  en: { title: "Sell an Item" },
  ar: { title: "عرض قطعة للبيع" },
};

const CURRENT_USER = {
  nameEn: "Fatima AlMansoori",
  nameAr: "فاطمة المنصوري",
  avatar: "/sellers/fatima-almansoori.jpg",
  typeEn: "Verified Closet",
  typeAr: "خزانة معتمدة",
};

/**
 * D-19 — Create Listing (Resell).
 *
 * The form is shared with D-21 Edit Listing via `ListingForm`. This
 * component is just the header + back navigation around it. Persists
 * via `AppContext.addListing`, then navigates back to the feed (which
 * surfaces the new item in the "New In" tab automatically — Phase 1's
 * `isNewerBatch` heuristic tags anything starting with `custom-`).
 */
export const SellItemView: React.FC<SellItemViewProps> = ({
  onBack,
  onSuccess,
}) => {
  const { language, addListing } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={isAr ? "رجوع" : "Back"}
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

      <main className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-lg mt-md shadow-sm font-sans">
        <ListingForm
          isAr={isAr}
          user={CURRENT_USER}
          draftKey="mooday_listing_form_draft"
          onSubmit={(data) => {
            addListing(data);
            onSuccess();
          }}
          onSaveDraft={(data) => {
            addListing(data);
            onSuccess();
          }}
          onCancel={onBack}
        />
      </main>
    </div>
  );
};
