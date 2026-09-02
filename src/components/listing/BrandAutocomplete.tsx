"use client";

import React from "react";
import { PREMIUM_BRANDS, brandArFor } from "@/data/premium-brands";

interface BrandAutocompleteProps {
  value: string;
  brandAr: string;
  isAr: boolean;
  onChange: (value: { brandEn: string; brandAr: string }) => void;
}

/** Native combobox with a controlled premium-brand suggestion list. */
export function BrandAutocomplete({
  value,
  brandAr,
  isAr,
  onChange,
}: BrandAutocompleteProps) {
  const listId = "daneg-premium-brand-options";
  return (
    <div className="flex flex-col gap-xs">
      <label
        htmlFor="listing-brand"
        className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant"
      >
        {isAr ? "الماركة" : "Brand"}
      </label>
      <input
        id="listing-brand"
        type="text"
        list={listId}
        autoComplete="off"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          const match = PREMIUM_BRANDS.find(
            (brand) => brand.toLowerCase() === next.trim().toLowerCase(),
          );
          onChange({
            brandEn: next,
            brandAr: match ? brandArFor(match) ?? brandAr : brandAr,
          });
        }}
        placeholder={isAr ? "مثال: Chanel" : "e.g. Chanel"}
        className="rounded-lg border border-outline-variant bg-surface p-md text-body-md text-on-surface outline-none focus:border-primary"
      />
      <datalist id={listId}>
        {PREMIUM_BRANDS.map((brand) => (
          <option key={brand} value={brand} label={isAr ? brandArFor(brand) : brand} />
        ))}
      </datalist>
      <p className="text-[11px] leading-normal text-on-surface-variant">
        {isAr
          ? "اختر ماركة فاخرة من القائمة لتفعيل مراجعة الأصالة."
          : "Choose a premium brand to enable authenticity review."}
      </p>
      {brandAr && brandAr !== value && (
        <p dir="rtl" className="text-[11px] text-primary">
          {brandAr}
        </p>
      )}
    </div>
  );
}
