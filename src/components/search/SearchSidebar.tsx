import React from "react";
import {
  CATEGORIES,
  CATEGORIES_AR,
  CONDITIONS,
  CONDITIONS_AR,
} from "@/data/categories";
import { SIZES, SIZES_AR, COLOURS, type Size } from "@/data/attributes";
import { FilterSection, FilterPill } from "./FilterComponents";

interface SearchSidebarProps {
  filtersOpen: boolean;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAr: boolean;
  t: typeof import("./constants").COPY.en | typeof import("./constants").COPY.ar;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedCondition: string;
  setSelectedCondition: (val: string) => void;
  selectedSizes: Size[];
  toggleSize: (val: Size) => void;
  selectedColor: string;
  setSelectedColor: (val: string) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  selectedMode: "all" | "resell" | "rent";
  setSelectedMode: (val: "all" | "resell" | "rent") => void;
}

export const SearchSidebar: React.FC<SearchSidebarProps> = ({
  filtersOpen,
  setFiltersOpen,
  isAr,
  t,
  selectedCategory,
  setSelectedCategory,
  selectedCondition,
  setSelectedCondition,
  selectedSizes,
  toggleSize,
  selectedColor,
  setSelectedColor,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  selectedMode,
  setSelectedMode,
}) => {
  return (
    <aside
      id="search-filters-panel"
      className={`${filtersOpen ? "flex" : "hidden"} lg:col-span-3 lg:flex flex-col gap-md`}
    >
      {/* Category Filter */}
      <FilterSection title={t.categories}>
        <div className="flex flex-wrap lg:flex-col gap-xs">
          {CATEGORIES.map((cat) => (
            <FilterPill
              key={cat}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            >
              {isAr ? CATEGORIES_AR[cat] : cat}
            </FilterPill>
          ))}
        </div>
      </FilterSection>

      {/* Condition Filter */}
      <FilterSection title={t.condition}>
        <div className="flex flex-wrap lg:flex-col gap-xs">
          {CONDITIONS.map((cond) => (
            <FilterPill
              key={cond}
              active={selectedCondition === cond}
              onClick={() => setSelectedCondition(cond)}
            >
              {isAr ? CONDITIONS_AR[cond] : cond}
            </FilterPill>
          ))}
        </div>
      </FilterSection>

      {/* Size Filter — multi-select */}
      <FilterSection title={t.size}>
        <div className="flex flex-wrap gap-xs">
          {SIZES.map((size) => (
            <FilterPill
              key={size}
              active={selectedSizes.includes(size)}
              onClick={() => toggleSize(size)}
            >
              {isAr ? SIZES_AR[size] : size}
            </FilterPill>
          ))}
        </div>
      </FilterSection>

      {/* Colour Filter */}
      <FilterSection title={t.colour}>
        <div className="flex flex-wrap gap-xs">
          <FilterPill
            active={!selectedColor}
            onClick={() => setSelectedColor("")}
          >
            {t.all}
          </FilterPill>
          {COLOURS.map((colour) => (
            <button
              key={colour.key}
              onClick={() => setSelectedColor(colour.key)}
              aria-pressed={
                selectedColor.toLowerCase() === colour.key.toLowerCase()
              }
              aria-label={isAr ? colour.ar : colour.en}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-label-sm border transition-all ${
                selectedColor.toLowerCase() === colour.key.toLowerCase()
                  ? "bg-primary text-on-primary border-primary font-bold"
                  : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-outline-variant inline-block"
                style={{ backgroundColor: colour.hex }}
                aria-hidden="true"
              />
              {isAr ? colour.ar : colour.en}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection title={t.priceRange}>
        <div className="flex items-center gap-sm">
          <div className="flex flex-col gap-xs flex-1">
            <label
              htmlFor="min-price"
              className="text-[11px] text-on-surface-variant"
            >
              {t.minPrice}
            </label>
            <input
              id="min-price"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="p-sm bg-surface border border-outline-variant rounded-lg text-label-sm text-on-surface focus:border-primary outline-none w-full"
            />
          </div>
          <span className="text-outline mt-md">—</span>
          <div className="flex flex-col gap-xs flex-1">
            <label
              htmlFor="max-price"
              className="text-[11px] text-on-surface-variant"
            >
              {t.maxPrice}
            </label>
            <input
              id="max-price"
              type="number"
              inputMode="numeric"
              placeholder="∞"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="p-sm bg-surface border border-outline-variant rounded-lg text-label-sm text-on-surface focus:border-primary outline-none w-full"
            />
          </div>
        </div>
        {/* Quick presets */}
        <div className="flex flex-wrap gap-xs mt-sm">
          <FilterPill
            active={minPrice === "" && maxPrice === "500"}
            onClick={() => {
              setMinPrice("");
              setMaxPrice("500");
            }}
          >
            &lt; 500
          </FilterPill>
          <FilterPill
            active={minPrice === "500" && maxPrice === "1000"}
            onClick={() => {
              setMinPrice("500");
              setMaxPrice("1000");
            }}
          >
            500–1K
          </FilterPill>
          <FilterPill
            active={minPrice === "1000" && maxPrice === ""}
            onClick={() => {
              setMinPrice("1000");
              setMaxPrice("");
            }}
          >
            1K+
          </FilterPill>
        </div>
      </FilterSection>

      {/* Listing Mode Filter */}
      <FilterSection title={t.listingMode}>
        <div
          className="flex bg-surface-container-low border border-surface-container-high rounded-full p-1"
          role="radiogroup"
          aria-label={t.listingMode}
        >
          {(["all", "resell", "rent"] as const).map((m) => (
            <button
              key={m}
              onClick={() => m !== "rent" && setSelectedMode(m)}
              role="radio"
              aria-checked={selectedMode === m}
              disabled={m === "rent"}
              title={m === "rent" ? t.rentComingSoon : undefined}
              className={`flex-1 px-3 py-1.5 rounded-full text-label-sm font-bold transition-all ${
                selectedMode === m
                  ? "bg-primary text-on-primary"
                  : m === "rent"
                    ? "text-outline opacity-50 cursor-not-allowed"
                    : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {m === "all" ? t.all : m === "resell" ? t.resell : t.rent}
            </button>
          ))}
        </div>
      </FilterSection>

      <button
        type="button"
        onClick={() => setFiltersOpen(false)}
        className="lg:hidden btn-primary min-h-11 px-6 rounded-full text-label-sm font-bold uppercase tracking-wider"
      >
        {t.apply}
      </button>
    </aside>
  );
};
