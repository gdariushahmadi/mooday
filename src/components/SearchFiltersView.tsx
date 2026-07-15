"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useApp, Product } from "@/context/AppContext";
import {
  CATEGORIES,
  CATEGORIES_AR,
  CONDITIONS,
  CONDITIONS_AR,
} from "@/data/categories";
import { SIZES, SIZES_AR, COLOURS, type Size } from "@/data/attributes";
import { ClickableCard } from "./ClickableCard";
import { formatAEDLabel } from "@/lib/format";

interface SearchFiltersViewProps {
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
}

type SortOption = "relevance" | "newest" | "priceAsc" | "priceDesc";

const COPY = {
  en: {
    back: "Back",
    searchPlaceholder: "Search for bags, dresses, decor...",
    search: "Search",
    clearSearch: "Clear search",
    filters: "Filters",
    showFilters: "Show filters",
    hideFilters: "Hide filters",
    categories: "Categories",
    condition: "Item Condition",
    size: "Size",
    colour: "Colour",
    priceRange: "Price Range",
    minPrice: "Min",
    maxPrice: "Max",
    listingMode: "Listing Mode",
    all: "All",
    resell: "Resell",
    rent: "Rent",
    rentComingSoon: "Coming soon",
    sortBy: "Sort by",
    relevance: "Relevance",
    newest: "Newest",
    priceLow: "Price: Low to High",
    priceHigh: "Price: High to Low",
    found: (n: number) => `Found ${n} item${n === 1 ? "" : "s"}`,
    noResults: "We couldn't find any items matching your search.",
    clearAll: "Clear all filters",
    apply: "Apply",
    price: "Price",
  },
  ar: {
    back: "رجوع",
    searchPlaceholder: "ابحث عن حقيبة، فستان، ديكور...",
    search: "بحث",
    clearSearch: "مسح البحث",
    filters: "الفلاتر",
    showFilters: "عرض الفلاتر",
    hideFilters: "إخفاء الفلاتر",
    categories: "الفئات",
    condition: "حالة المنتج",
    size: "المقاس",
    colour: "اللون",
    priceRange: "نطاق السعر",
    minPrice: "أقل",
    maxPrice: "أعلى",
    listingMode: "نوع العرض",
    all: "الكل",
    resell: "بيع",
    rent: "إيجار",
    rentComingSoon: "قريباً",
    sortBy: "ترتيب حسب",
    relevance: "الصلة",
    newest: "الأحدث",
    priceLow: "السعر: من الأقل إلى الأعلى",
    priceHigh: "السعر: من الأعلى إلى الأقل",
    found: (n: number) => `تم العثور على ${n} منتج`,
    noResults: "لم نجد أي منتجات تطابق بحثك.",
    clearAll: "مسح كل الفلاتر",
    apply: "تطبيق",
    price: "السعر",
  },
} as const;

// ---------- URL helpers ----------

function readUrlFilters() {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const category = p.get("cat") ?? "All";
  const condition = p.get("cond") ?? "All";
  const color = p.get("color") ?? "";
  const mode = p.get("mode");
  const sort = p.get("sort");
  const validPrice = (value: string | null) =>
    value != null && /^\d+$/.test(value) ? value : "";
  return {
    q: p.get("q") ?? "",
    cat: CATEGORIES.includes(category as (typeof CATEGORIES)[number])
      ? category
      : "All",
    cond: CONDITIONS.includes(condition as (typeof CONDITIONS)[number])
      ? condition
      : "All",
    sizes: (p.get("size") ?? "")
      .split(",")
      .filter((size): size is Size => SIZES.includes(size as Size)),
    color: COLOURS.some((item) => item.key === color) ? color : "",
    min: validPrice(p.get("min")),
    max: validPrice(p.get("max")),
    mode: mode === "resell" ? ("resell" as const) : ("all" as const),
    sort: (["newest", "priceAsc", "priceDesc"] as const).includes(
      sort as "newest" | "priceAsc" | "priceDesc",
    )
      ? (sort as SortOption)
      : "relevance",
  };
}

function syncUrl(filters: {
  q: string;
  cat: string;
  cond: string;
  sizes: Size[];
  color: string;
  min: string;
  max: string;
  mode: string;
  sort: string;
}) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const set = (key: string, val: string) => {
    if (val && val !== "All" && val !== "all" && val !== "relevance") {
      url.searchParams.set(key, val);
    } else {
      url.searchParams.delete(key);
    }
  };
  set("q", filters.q);
  set("cat", filters.cat);
  set("cond", filters.cond);
  set("size", filters.sizes.join(","));
  set("color", filters.color);
  set("min", filters.min);
  set("max", filters.max);
  set("mode", filters.mode);
  set("sort", filters.sort);
  window.history.replaceState(null, "", url.toString());
}

// ---------- Component ----------

export const SearchFiltersView: React.FC<SearchFiltersViewProps> = ({
  onSelectProduct,
  onBack,
}) => {
  const { language, listings, likes, toggleLike } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  // Initialise all filter state from the URL in lazy initialisers.
  const initial = readUrlFilters();
  const [searchQuery, setSearchQuery] = useState(initial?.q ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(initial?.q ?? "");
  const [selectedCategory, setSelectedCategory] = useState(
    initial?.cat ?? "All",
  );
  const [selectedCondition, setSelectedCondition] = useState(
    initial?.cond ?? "All",
  );
  const [selectedSizes, setSelectedSizes] = useState<Size[]>(
    initial?.sizes ?? [],
  );
  const [selectedColor, setSelectedColor] = useState(initial?.color ?? "");
  const [minPrice, setMinPrice] = useState(initial?.min ?? "");
  const [maxPrice, setMaxPrice] = useState(initial?.max ?? "");
  const [selectedMode, setSelectedMode] = useState<"all" | "resell" | "rent">(
    initial?.mode ?? "all",
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    initial?.sort ?? "relevance",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Debounce the search query 300ms.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync all filters to the URL whenever they change.
  useEffect(() => {
    syncUrl({
      q: searchQuery,
      cat: selectedCategory,
      cond: selectedCondition,
      sizes: selectedSizes,
      color: selectedColor,
      min: minPrice,
      max: maxPrice,
      mode: selectedMode,
      sort: sortBy,
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedCondition,
    selectedSizes,
    selectedColor,
    minPrice,
    maxPrice,
    selectedMode,
    sortBy,
  ]);

  const toggleSize = (size: Size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const clearAll = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSelectedCategory("All");
    setSelectedCondition("All");
    setSelectedSizes([]);
    setSelectedColor("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedMode("all");
    setSortBy("relevance");
  };

  const activeFilterCount =
    (selectedCategory !== "All" ? 1 : 0) +
    (selectedCondition !== "All" ? 1 : 0) +
    selectedSizes.length +
    (selectedColor ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (selectedMode !== "all" ? 1 : 0);

  const activeFilters = [
    ...(selectedCategory !== "All"
      ? [
          {
            key: "category",
            label: isAr
              ? CATEGORIES_AR[
                  selectedCategory as keyof typeof CATEGORIES_AR
                ]
              : selectedCategory,
            clear: () => setSelectedCategory("All"),
          },
        ]
      : []),
    ...(selectedCondition !== "All"
      ? [
          {
            key: "condition",
            label: isAr
              ? CONDITIONS_AR[
                  selectedCondition as keyof typeof CONDITIONS_AR
                ]
              : selectedCondition,
            clear: () => setSelectedCondition("All"),
          },
        ]
      : []),
    ...selectedSizes.map((size) => ({
      key: `size-${size}`,
      label: isAr ? SIZES_AR[size] : size,
      clear: () => toggleSize(size),
    })),
    ...(selectedColor
      ? [
          {
            key: "color",
            label:
              (isAr
                ? COLOURS.find((item) => item.key === selectedColor)?.ar
                : COLOURS.find((item) => item.key === selectedColor)?.en) ??
              selectedColor,
            clear: () => setSelectedColor(""),
          },
        ]
      : []),
    ...(minPrice || maxPrice
      ? [
          {
            key: "price",
            label: `${t.price}: ${minPrice || "0"}–${maxPrice || "∞"}`,
            clear: () => {
              setMinPrice("");
              setMaxPrice("");
            },
          },
        ]
      : []),
    ...(selectedMode === "resell"
      ? [
          {
            key: "mode",
            label: t.resell,
            clear: () => setSelectedMode("all"),
          },
        ]
      : []),
  ];

  // Filter + sort pipeline.
  const filteredListings = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    const min = minPrice ? parseInt(minPrice, 10) : 0;
    const max = maxPrice ? parseInt(maxPrice, 10) : Infinity;

    let result = listings.filter((item) => {
      // Text search across EN title, AR title, and category.
      const matchesSearch =
        !q ||
        item.titleEn.toLowerCase().includes(q) ||
        item.titleAr.includes(debouncedQuery) ||
        item.category.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      const matchesCondition =
        selectedCondition === "All" || item.conditionEn === selectedCondition;

      const matchesSize =
        selectedSizes.length === 0 ||
        (item.size != null && selectedSizes.includes(item.size as Size));

      const matchesColor =
        !selectedColor ||
        item.colorEn?.toLowerCase() === selectedColor.toLowerCase();

      const matchesPrice = item.price >= min && item.price <= max;

      const matchesMode =
        selectedMode === "all" || (item.mode ?? "resell") === selectedMode;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCondition &&
        matchesSize &&
        matchesColor &&
        matchesPrice &&
        matchesMode
      );
    });

    // Sort.
    if (sortBy === "newest") {
      result = [...result].sort((a, b) => {
        const aNew =
          a.id.startsWith("batch2-") || a.id.startsWith("custom-") ? 1 : 0;
        const bNew =
          b.id.startsWith("batch2-") || b.id.startsWith("custom-") ? 1 : 0;
        if (aNew !== bNew) return bNew - aNew;
        return b.saves - a.saves;
      });
    } else if (sortBy === "priceAsc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "priceDesc") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [
    listings,
    debouncedQuery,
    selectedCategory,
    selectedCondition,
    selectedSizes,
    selectedColor,
    minPrice,
    maxPrice,
    selectedMode,
    sortBy,
  ]);

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-lg pb-10">
      {/* Header Search Box */}
      <div className="flex items-center gap-md border-b border-outline-variant pb-4">
        <button
          onClick={onBack}
          aria-label={t.back}
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
        </button>

        {/* Search Input */}
        <div className="flex-grow flex items-center gap-sm bg-surface-container-low border border-outline-variant rounded-full px-md py-sm font-sans">
          <span
            className="material-symbols-outlined text-outline"
            aria-hidden="true"
          >
            search
          </span>
          <label htmlFor="search-input" className="sr-only">
            {t.search}
          </label>
          <input
            id="search-input"
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none border-none text-body-md text-on-surface placeholder-outline-variant"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label={t.clearSearch}
              className="text-outline"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                aria-hidden="true"
              >
                close
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-sm font-sans">
        <span className="text-body-md text-on-surface-variant whitespace-nowrap">
          {t.found(filteredListings.length)}
        </span>
        <div className="flex items-center gap-xs min-w-0">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="search-filters-panel"
            aria-label={filtersOpen ? t.hideFilters : t.showFilters}
            className="lg:hidden min-h-10 flex items-center gap-1 rounded-full border border-outline-variant bg-surface px-3 text-label-sm font-bold text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              tune
            </span>
            {t.filters}
            {activeFilterCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-primary text-on-primary flex items-center justify-center text-[11px]">
                {activeFilterCount}
              </span>
            )}
          </button>
          <label htmlFor="sort-select" className="sr-only">
            {t.sortBy}
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label={t.sortBy}
            className="min-h-10 min-w-0 max-w-[9rem] sm:max-w-none bg-surface border border-outline-variant rounded-full px-sm text-label-sm text-on-surface focus:border-primary outline-none cursor-pointer"
          >
            <option value="relevance">{t.relevance}</option>
            <option value="newest">{t.newest}</option>
            <option value="priceAsc">{t.priceLow}</option>
            <option value="priceDesc">{t.priceHigh}</option>
          </select>
        </div>
      </div>

      {(activeFilters.length > 0 || searchQuery || sortBy !== "relevance") && (
        <div className="flex gap-xs overflow-x-auto pb-1 font-sans" aria-label={t.filters}>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={filter.clear}
              className="shrink-0 min-h-9 flex items-center gap-1 rounded-full bg-primary-container px-3 text-label-sm font-bold text-on-primary-container"
            >
              {filter.label}
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                close
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 min-h-9 px-2 text-label-sm font-bold text-primary underline-offset-2 hover:underline"
          >
            {t.clearAll}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg font-sans">
        {/* Left Column: Filters Sidebar */}
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

        {/* Right Column: Search Results */}
        <main className="lg:col-span-9 flex flex-col gap-md">
          {filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-md text-center">
              <span
                className="material-symbols-outlined text-[64px] text-outline opacity-40"
                aria-hidden="true"
              >
                search_off
              </span>
              <p className="text-body-lg text-on-surface-variant">
                {t.noResults}
              </p>
              <button
                onClick={clearAll}
                className="btn-primary px-6 py-2 rounded-full text-label-sm font-bold uppercase tracking-wider"
              >
                {t.clearAll}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-md">
              {filteredListings.map((product) => {
                const isLiked = likes.includes(product.id);
                const productTitle = isAr ? product.titleAr : product.titleEn;
                return (
                  <ClickableCard
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    ariaLabel={productTitle}
                    className="bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden group cursor-pointer hover:shadow-md transition-all relative"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(product.id);
                      }}
                      aria-pressed={isLiked}
                      aria-label={
                        isLiked
                          ? `Remove ${productTitle} from saved`
                          : `Save ${productTitle}`
                      }
                      className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center transition-colors ${
                        isLiked
                          ? "text-primary"
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        aria-hidden="true"
                        style={{
                          fontVariationSettings: `'FILL' ${isLiked ? 1 : 0}`,
                        }}
                      >
                        favorite
                      </span>
                    </button>

                    <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
                      <img
                        alt={productTitle}
                        src={product.image}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-md flex flex-col gap-1">
                      <span className="text-[10px] text-outline font-bold uppercase tracking-wider">
                        {isAr ? product.conditionAr : product.conditionEn}
                      </span>
                      <h4 className="font-serif text-label-md text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {productTitle}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary text-label-sm">
                          {formatAEDLabel(product.price)}
                        </span>
                        {product.size && product.size !== "OS" && (
                          <span className="text-[10px] text-on-surface-variant border border-outline-variant rounded px-1">
                            {product.size}
                          </span>
                        )}
                      </div>
                    </div>
                  </ClickableCard>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// ---------- Sub-components ----------

const FilterSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="bg-surface-container-low rounded-xl border border-surface-container-high p-md">
    <h3 className="font-serif text-label-md uppercase tracking-wider text-primary font-bold mb-md">
      {title}
    </h3>
    {children}
  </div>
);

const FilterPill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`text-label-sm text-left px-3 py-2 rounded-lg transition-all border ${
      active
        ? "bg-primary text-on-primary border-primary font-bold"
        : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
    }`}
  >
    {children}
  </button>
);
