"use client";

import React from "react";
import { useApp, type Product } from "@/context/AppContext";
import { ListingForm } from "./listing/ListingForm";

interface EditListingViewProps {
  product: Product;
  onBack: () => void;
  onSuccess: () => void;
}

interface EditCopy {
  title: string;
  successToast: string;
}

const COPY: Record<"en" | "ar", EditCopy> = {
  en: { title: "Edit listing", successToast: "Listing updated." },
  ar: { title: "تعديل المنتج", successToast: "تم تحديث المنتج." },
};

const CURRENT_USER = {
  nameEn: "Fatima AlMansoori",
  nameAr: "فاطمة المنصوري",
  avatar: "/sellers/fatima-almansoori.jpg",
  typeEn: "Verified Closet",
  typeAr: "خزانة معتمدة",
};

/**
 * D-21 — Edit Listing.
 *
 * A thin wrapper that prefills `ListingForm` with the listing being
 * edited. On submit, calls `updateListing(product.id, ...)` and pops
 * back to the closet. Re-uses the same form as D-19 so the two flows
 * never drift.
 */
export const EditListingView: React.FC<EditListingViewProps> = ({
  product,
  onBack,
  onSuccess,
}) => {
  const { language, updateListing } = useApp();
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
          initial={product}
          user={CURRENT_USER}
          onSubmit={(data) => {
            updateListing(product.id, data);
            onSuccess();
          }}
          onSaveDraft={(data) => {
            updateListing(product.id, data);
            onSuccess();
          }}
          onCancel={onBack}
        />
      </main>
    </div>
  );
};
