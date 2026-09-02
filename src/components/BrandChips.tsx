import React from "react";
import { PREMIUM_BRANDS, brandArFor } from "@/data/premium-brands";

interface BrandChipsProps {
  selected?: string;
  isAr?: boolean;
  onSelect: (brand: string) => void;
  onClear?: () => void;
}

/** Horizontally scrollable premium-brand discovery control. */
export function BrandChips({
  selected = "",
  isAr = false,
  onSelect,
  onClear,
}: BrandChipsProps) {
  const clear = onClear ?? (() => onSelect(""));

  return (
    <div className="flex items-center gap-sm overflow-x-auto no-scrollbar pb-1" role="group" aria-label={isAr ? "اختيار الماركة" : "Choose a brand"}>
      <button
        type="button"
        onClick={clear}
        aria-pressed={!selected}
        className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-label-sm font-bold transition-colors ${
          !selected
            ? "border-primary bg-primary text-on-primary"
            : "border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary"
        }`}
      >
        {isAr ? "كل الماركات" : "All brands"}
      </button>
      {PREMIUM_BRANDS.map((brand) => {
        const active = selected.toLowerCase() === brand.toLowerCase();
        return (
          <button
            key={brand}
            type="button"
            onClick={() => onSelect(brand)}
            aria-pressed={active}
            className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-label-sm font-bold transition-colors ${
              active
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary"
            }`}
          >
            {isAr ? brandArFor(brand) : brand}
          </button>
        );
      })}
    </div>
  );
}

