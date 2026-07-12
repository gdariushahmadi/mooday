"use client";

import React, { useEffect } from "react";
import { useApp, type Product } from "@/context/AppContext";
import { CATEGORIES_AR } from "@/data/categories";
import { deriveSubCategory } from "@/data/sub-categories";
import { ClickableCard } from "./ClickableCard";
import { formatAEDLabel } from "@/lib/format";
import type { CategorySort } from "@/hooks/useAppNavigation";

interface CategoryLandingViewProps {
  /** Active category name (must be a member of CATEGORIES, excluding "All"). */
  category: string;
  /** Selected sub-category, or null = All. */
  subCategory: string | null;
  /** Active sort order. */
  sort: CategorySort;
  /** All listings to filter. Provided by the nav hook. */
  listings: Product[];
  /** Set the sub-category filter (null = All). */
  onSubCategoryChange: (sub: string | null) => void;
  /** Set the sort order. */
  onSortChange: (sort: CategorySort) => void;
  /** Back to Discover feed. */
  onBack: () => void;
  /** Tap on a product tile. */
  onSelectProduct: (product: Product) => void;
}

interface CategoryCopy {
  back: string;
  resultsCount: (n: number) => string;
  resultsCountZero: string;
  emptyTitle: string;
  emptyBody: string;
  emptyCta: string;
  sortLabel: string;
  sortNewest: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortSaves: string;
  subAll: string;
}

const COPY: Record<"en" | "ar", CategoryCopy> = {
  en: {
    back: "Back",
    resultsCount: (n) => `${n} item${n === 1 ? "" : "s"}`,
    resultsCountZero: "0 items",
    emptyTitle: "Nothing here yet",
    emptyBody:
      "We're curating more pieces in this category. Check back soon or explore the rest.",
    emptyCta: "Browse all",
    sortLabel: "Sort",
    sortNewest: "Newest",
    sortPriceAsc: "Price: Low to High",
    sortPriceDesc: "Price: High to Low",
    sortSaves: "Most Loved",
    subAll: "All",
  },
  ar: {
    back: "رجوع",
    resultsCount: (n) => `${n} منتج${n === 1 ? "" : "ات"}`,
    resultsCountZero: "لا توجد منتجات",
    emptyTitle: "لا يوجد شيء هنا بعد",
    emptyBody:
      "نعمل على إضافة المزيد من القطع في هذه الفئة. عد لاحقاً أو تصفح الباقي.",
    emptyCta: "تصفح الكل",
    sortLabel: "ترتيب",
    sortNewest: "الأحدث",
    sortPriceAsc: "السعر: الأقل إلى الأعلى",
    sortPriceDesc: "السعر: الأعلى إلى الأقل",
    sortSaves: "الأكثر إعجاباً",
    subAll: "الكل",
  },
};

const SORTS: CategorySort[] = ["newest", "price-asc", "price-desc", "saves"];

// Hero copy per category. Localised, no inline ternaries.
const HERO_COPY_EN: Record<string, { tag: string; body: string }> = {
  Dresses: {
    tag: "Curated for every occasion",
    body: "From kaftans and abayas to evening gowns — pre-loved designer dresses at half the retail.",
  },
  Shoes: {
    tag: "Step into a quieter wardrobe",
    body: "Sneakers, heels, and flats from the closets of collectors across the Gulf.",
  },
  Bags: {
    tag: "Heritage leather, second chapter",
    body: "Handbags, clutches, and crossbodies sourced from individual sellers and verified boutiques.",
  },
  Accessories: {
    tag: "Small touches, big stories",
    body: "Watches, jewellery, scarves, and the finishing pieces that tie a look together.",
  },
  Clothing: {
    tag: "The everyday, edited",
    body: "Blazers, knitwear, and trousers from brands you know — at prices you'll love.",
  },
};

const HERO_COPY_AR: Record<string, { tag: string; body: string }> = {
  Dresses: {
    tag: "مختارة لكل مناسبة",
    body: "من القفطان والعباية إلى فساتين السهرة — فساتين مصممين بحالة ممتازة بنصف السعر.",
  },
  Shoes: {
    tag: "خطوة نحو خزانة أكثر هدوءاً",
    body: "أحذية رياضية، كعب، وأحذية مسطحة من خزائن هواة الجمع في الخليج.",
  },
  Bags: {
    tag: "جلد تراثي، فصلٌ ثانٍ",
    body: "حقائب يد، كلاتش، وكروسبودي من بائعين أفراد وبوتيكات موثوقة.",
  },
  Accessories: {
    tag: "لمسات صغيرة، قصص كبيرة",
    body: "ساعات، مجوهرات، أوشحة، والقطع التي تكمل الإطلالة.",
  },
  Clothing: {
    tag: "الأساسيات، بعد تنسيق",
    body: "بليزر وتريكو وبنطلون من ماركات تعرفها — بأسعار تحبينها.",
  },
};

/**
 * B-10 — Category Landing Page.
 *
 * A dedicated landing view for a single top-level category (e.g. "Bags").
 * Shows a hero, sub-category chips, sort + count strip, and a product
 * grid. Fully local-first (reads from `listings`), no backend calls.
 *
 * Deep-linkable via `?view=category&category=Bags&sub=Handbags&sort=newest`.
 */
export const CategoryLandingView: React.FC<CategoryLandingViewProps> = ({
  category,
  subCategory,
  sort,
  listings,
  onSubCategoryChange,
  onSortChange,
  onBack,
  onSelectProduct,
}) => {
  const { language, likes, toggleLike } = useApp();
  const isAr = language === "ar";

  const t = isAr ? COPY.ar : COPY.en;

  const categoryListings = listings.filter(
    (p) => p.category === category && p.mode !== "rent", // rent reserved Phase 4
  );

  // Available sub-categories for this category, derived from the data
  // using `deriveSubCategory` (shared with ProductDetailsView breadcrumb).
  const subCategoriesEn = React.useMemo(() => {
    const seen = new Set<string>();
    for (const p of categoryListings) {
      seen.add(deriveSubCategory(p.category, p.titleEn, "en"));
    }
    return Array.from(seen);
  }, [categoryListings]);

  const subCategoriesAr = React.useMemo(() => {
    const seen = new Set<string>();
    for (const p of categoryListings) {
      seen.add(deriveSubCategory(p.category, p.titleEn, "ar"));
    }
    return Array.from(seen);
  }, [categoryListings]);

  // Filter to active sub-category if set (match by EN name — the URL
  // is always EN, even on the AR view).
  const filtered = subCategory
    ? categoryListings.filter(
        (p) => deriveSubCategory(p.category, p.titleEn, "en") === subCategory,
      )
    : categoryListings;

  // Sort the filtered set.
  const sorted = React.useMemo(() => {
    const copy = [...filtered];
    if (sort === "price-asc") {
      copy.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      copy.sort((a, b) => b.price - a.price);
    } else if (sort === "saves") {
      copy.sort((a, b) => b.saves - a.saves);
    } else {
      // "newest" — keep batch2- and custom- ids first.
      copy.sort((a, b) => {
        const aNew = isNewerBatch(a.id) ? 1 : 0;
        const bNew = isNewerBatch(b.id) ? 1 : 0;
        if (aNew !== bNew) return bNew - aNew;
        return b.saves - a.saves;
      });
    }
    return copy;
  }, [filtered, sort]);

  // Reflect sub + sort in the URL without reloading.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (subCategory) {
      url.searchParams.set("sub", subCategory);
    } else {
      url.searchParams.delete("sub");
    }
    if (sort !== "newest") {
      url.searchParams.set("sort", sort);
    } else {
      url.searchParams.delete("sort");
    }
    window.history.replaceState(null, "", url.toString());
  }, [subCategory, sort]);

  const heroCopy = isAr ? HERO_COPY_AR[category] : HERO_COPY_EN[category];

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="w-full flex flex-col gap-md">
      {/* Header bar */}
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
          {isAr ? (CATEGORIES_AR[category] ?? category) : category}
        </h1>
        <div className="w-8 h-8" aria-hidden="true" />
      </div>

      {/* Hero banner (CSS-only, no external image) */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-on-primary p-lg shadow-md overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, white 0%, transparent 40%)",
          }}
        />
        <div className="relative z-10 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">
            {isAr ? (CATEGORIES_AR[category] ?? category) : category}
          </span>
          <h2 className="font-serif text-headline-sm">
            {heroCopy?.tag ?? (isAr ? "تسوّقي" : "Shop the edit")}
          </h2>
          <p className="text-label-sm opacity-80 max-w-md">
            {heroCopy?.body ??
              (isAr
                ? "مختارات من البائعين الموثوقين في مودي."
                : "Curated pieces from Mooday's verified sellers.")}
          </p>
        </div>
      </div>

      {/* Sub-category chips */}
      <div className="-mx-margin-mobile">
        <div
          role="tablist"
          aria-label={isAr ? "الفئات الفرعية" : "Sub-categories"}
          className="flex gap-2 overflow-x-auto px-margin-mobile py-1 snap-x snap-mandatory no-scrollbar"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subCategory === null}
            onClick={() => onSubCategoryChange(null)}
            className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-label-sm uppercase tracking-wider transition-all border ${
              subCategory === null
                ? "bg-primary text-on-primary border-primary font-bold"
                : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
            }`}
          >
            {t.subAll}
          </button>
          {(isAr ? subCategoriesAr : subCategoriesEn).map((sub) => (
            <button
              key={sub}
              type="button"
              role="tab"
              aria-selected={subCategory === sub}
              onClick={() => onSubCategoryChange(sub)}
              className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-label-sm transition-all border ${
                subCategory === sub
                  ? "bg-primary text-on-primary border-primary font-bold"
                  : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Sort + count strip */}
      <div className="flex items-center justify-between px-1">
        <span className="text-label-sm text-on-surface-variant">
          {sorted.length === 0
            ? t.resultsCountZero
            : t.resultsCount(sorted.length)}
        </span>
        <label className="flex items-center gap-2 text-label-sm text-on-surface-variant">
          <span className="font-bold uppercase tracking-wider text-[10px]">
            {t.sortLabel}
          </span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as CategorySort)}
            aria-label={t.sortLabel}
            className="bg-transparent border-b border-outline-variant text-on-surface font-bold uppercase tracking-wider text-[10px] py-1 pe-1 focus:outline-none focus:border-primary"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {s === "newest"
                  ? t.sortNewest
                  : s === "price-asc"
                    ? t.sortPriceAsc
                    : s === "price-desc"
                      ? t.sortPriceDesc
                      : t.sortSaves}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Product grid OR empty state */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            inventory_2
          </span>
          <h3 className="font-serif text-headline-sm text-on-surface">
            {t.emptyTitle}
          </h3>
          <p className="text-label-sm text-on-surface-variant max-w-xs">
            {t.emptyBody}
          </p>
          <button
            type="button"
            onClick={() => onSubCategoryChange(null)}
            className="px-6 py-2 rounded-full bg-primary text-on-primary text-label-sm font-bold active:scale-95 transition-transform"
          >
            {t.emptyCta}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-sm">
          {sorted.map((product) => (
            <CategoryGridCard
              key={product.id}
              product={product}
              isLiked={likes.includes(product.id)}
              isAr={isAr}
              toggleLike={() => toggleLike(product.id)}
              onClick={() => onSelectProduct(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Sub-components ----------

const CategoryGridCard: React.FC<{
  product: Product;
  isLiked: boolean;
  isAr: boolean;
  toggleLike: () => void;
  onClick: () => void;
}> = ({ product, isLiked, isAr, toggleLike, onClick }) => {
  const productTitle = isAr ? product.titleAr : product.titleEn;
  return (
    <ClickableCard
      as="article"
      onClick={onClick}
      ariaLabel={productTitle}
      className="bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden group cursor-pointer hover:shadow-md transition-all relative"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleLike();
        }}
        aria-pressed={isLiked}
        aria-label={
          isLiked ? `Remove ${productTitle} from saved` : `Save ${productTitle}`
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
};

/** "Newer" markers used by the sort=newest order. */
function isNewerBatch(id: string): boolean {
  return id.startsWith("batch2-") || id.startsWith("custom-");
}
