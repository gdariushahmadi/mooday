"use client";

import React, { useState } from "react";
import { useApp, Product } from "@/context/AppContext";
import { CATEGORIES, CATEGORIES_AR } from "@/data/categories";
import { ClickableCard } from "./ClickableCard";
import { formatAEDLabel } from "@/lib/format";

export type TabView = "home" | "search" | "sell" | "activity" | "profile";

interface DiscoverFeedViewProps {
  onSelectProduct: (product: Product) => void;
  onNavigate: (view: TabView) => void;
  /** Open B-10 Category Landing for the tapped category. */
  onSelectCategory?: (category: string) => void;
}

type ViewMode = "featured" | "compact";
type FeedTab = "foryou" | "trending" | "designers" | "newin";

const CATEGORY_PRIORITY = [
  "All",
  "Bags",
  "Clothing",
  "Dresses",
  "Shoes",
  "Accessories",
] as const;

// Keep the product taxonomy intact while presenting the showcase's most
// important lanes first. Any future categories are appended automatically.
const categories = [
  ...CATEGORY_PRIORITY.filter((category) => CATEGORIES.includes(category)),
  ...CATEGORIES.filter(
    (category) =>
      !(CATEGORY_PRIORITY as readonly string[]).includes(category),
  ),
];
const categoriesAr = CATEGORIES_AR;

const FEED_TABS_EN: Record<FeedTab, string> = {
  foryou: "For You",
  trending: "Trending",
  designers: "Designers",
  newin: "New In",
};

const FEED_TABS_AR: Record<FeedTab, string> = {
  foryou: "لكِ",
  trending: "الرائج",
  designers: "المصممون",
  newin: "وصل حديثاً",
};

const FEED_TAB_ORDER: FeedTab[] = ["foryou", "trending", "designers", "newin"];

function readTabFromUrl(): FeedTab {
  if (typeof window === "undefined") return "foryou";
  const raw = new URLSearchParams(window.location.search).get("tab");
  if (raw && (FEED_TAB_ORDER as string[]).includes(raw)) {
    return raw as FeedTab;
  }
  return "foryou";
}

function isNewerBatch(id: string): boolean {
  // Phase-1 mock: ids prefixed `batch2-` are considered newer than
  // base-product ids. Phase 3 will use a real `createdAt` timestamp.
  return id.startsWith("batch2-") || id.startsWith("custom-");
}

export const DiscoverFeedView: React.FC<DiscoverFeedViewProps> = ({
  onSelectProduct,
  onSelectCategory,
}) => {
  const { language, setLanguage, listings, likes, toggleLike } = useApp();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("featured");
  const [tab, setTab] = useState<FeedTab>(readTabFromUrl);

  const isAr = language === "ar";

  const handleTabChange = (next: FeedTab) => {
    setTab(next);
    // Reflect in the URL so the tab is shareable, without reloading
    // the page or triggering the setState-in-effect lint rule.
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (next === "foryou") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", next);
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  const handleLangToggle = () => {
    setLanguage(isAr ? "en" : "ar");
  };

  const filteredListings = listings.filter(
    (item) => selectedCategory === "All" || item.category === selectedCategory,
  );

  // Per-tab ordering/grouping.
  const tabbedListings = (() => {
    if (tab === "trending") {
      return [...filteredListings].sort((a, b) => b.saves - a.saves);
    }
    if (tab === "newin") {
      return [...filteredListings].sort((a, b) => {
        const aNew = isNewerBatch(a.id) ? 1 : 0;
        const bNew = isNewerBatch(b.id) ? 1 : 0;
        if (aNew !== bNew) return bNew - aNew;
        return b.saves - a.saves;
      });
    }
    return filteredListings;
  })();

  const designerSections = (() => {
    if (tab !== "designers") return [];
    const map = new Map<string, Product[]>();
    for (const p of filteredListings) {
      const key = isAr ? p.sellerNameAr : p.sellerNameEn;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  })();

  const t = isAr ? FEED_TABS_AR : FEED_TABS_EN;
  const saveLabel = (title: string, saved: boolean) =>
    isAr
      ? saved
        ? `إزالة ${title} من المحفوظات`
        : `حفظ ${title}`
      : saved
        ? `Remove ${title} from saved`
        : `Save ${title}`;

  return (
    <div className="w-full flex flex-col gap-lg pb-10">
      {/* Tab Navigation */}
      <nav className="flex min-w-0 items-center gap-sm border-b border-surface-variant">
        <div
          className="inline-scroll-cue no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto pb-3"
          role="tablist"
          aria-label={isAr ? "تبويبات الاكتشاف" : "Discover tabs"}
          aria-describedby="discover-tabs-hint"
        >
          {FEED_TAB_ORDER.map((tKey) => {
            const isActive = tab === tKey;
            return (
              <button
                type="button"
                key={tKey}
                onClick={() => handleTabChange(tKey)}
                role="tab"
                aria-selected={isActive}
                aria-controls="discover-feed-panel"
                className={`flex min-h-11 snap-start items-center whitespace-nowrap border-b-2 px-1 text-[12px] uppercase tracking-[0.12em] transition-colors ${
                  isActive
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t[tKey]}
              </button>
            );
          })}
        </div>
        <span id="discover-tabs-hint" className="sr-only">
          {isAr
            ? "مرري أفقياً لرؤية جميع تبويبات الاكتشاف"
            : "Scroll horizontally to see every Discover tab"}
        </span>
        {/* Language Quick Switcher */}
        <button
          type="button"
          onClick={handleLangToggle}
          aria-label={
            isAr ? "التبديل إلى اللغة الإنجليزية" : "Switch to Arabic"
          }
          className="flex-shrink-0 rounded-full border border-primary/20 bg-surface-container-low px-3 py-1 text-label-sm font-bold text-primary transition-colors hover:bg-surface-container-high active:scale-95"
        >
          {isAr ? "English" : "عربي"}
        </button>
      </nav>

      {/* Category & View Controls (hidden for Designers — seller
          grouping is the primary axis there). */}
      {tab !== "designers" && (
        <section
          aria-label={isAr ? "الفئات وطريقة العرض" : "Categories and view"}
          className="flex flex-col gap-md"
        >
          <div className="flex items-center justify-between gap-md">
            <h2 className="font-serif text-label-md uppercase tracking-wider text-primary font-bold shrink-0">
              {isAr ? "الفئات" : "Categories"}
            </h2>
            <div
              className="flex items-center gap-1 bg-surface-container-low border border-surface-container-high rounded-full p-1"
              role="group"
              aria-label={isAr ? "طريقة العرض" : "View mode"}
            >
              <button
                type="button"
                onClick={() => setViewMode("featured")}
                aria-pressed={viewMode === "featured"}
                aria-label={isAr ? "عرض مميز" : "Featured view"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  viewMode === "featured"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px] no-mirror"
                  aria-hidden="true"
                >
                  view_agenda
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("compact")}
                aria-pressed={viewMode === "compact"}
                aria-label={isAr ? "نوافذ صغيرة" : "Compact view"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  viewMode === "compact"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px] no-mirror"
                  aria-hidden="true"
                >
                  grid_view
                </span>
              </button>
            </div>
          </div>

          <div
            className="no-scrollbar -mx-margin-mobile flex snap-x snap-mandatory gap-sm overflow-x-auto px-margin-mobile pb-xs md:mx-0 md:px-0"
            role="group"
            aria-label={isAr ? "فئات المنتجات" : "Product categories"}
          >
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={selectedCategory === cat}
                className={`flex-shrink-0 snap-start rounded-full border px-4 py-2 text-label-sm uppercase tracking-wider transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-on-primary border-primary font-bold"
                    : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
                }`}
              >
                {isAr ? categoriesAr[cat] : cat}
              </button>
            ))}
          </div>

          {/* "View all [Category] →" link to open B-10 deep-landing. Shown
              when a non-"All" category is selected. */}
          {selectedCategory !== "All" && onSelectCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory(selectedCategory)}
              className="mt-xs flex items-center gap-1 text-label-sm text-primary font-bold active:scale-95 transition-transform pe-1"
              aria-label={
                isAr
                  ? `عرض جميع ${categoriesAr[selectedCategory] ?? selectedCategory}`
                  : `View all ${selectedCategory}`
              }
            >
              <span>
                {isAr
                  ? `عرض جميع ${categoriesAr[selectedCategory] ?? selectedCategory}`
                  : `View all ${selectedCategory}`}
              </span>
              <span
                className="material-symbols-outlined text-[18px] no-mirror"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </button>
          )}
        </section>
      )}

      {/* Discovery Feed Panel */}
      <div
        id="discover-feed-panel"
        role="tabpanel"
        aria-label={isAr ? "نتائج الاكتشاف" : "Discover feed"}
      >
        {tab === "designers" ? (
          <DesignersTab
            sections={designerSections}
            likes={likes}
            toggleLike={toggleLike}
            onSelectProduct={onSelectProduct}
            isAr={isAr}
          />
        ) : tabbedListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
            <span
              className="material-symbols-outlined text-[56px] text-outline opacity-40"
              aria-hidden="true"
            >
              category
            </span>
            <p className="text-body-lg text-on-surface-variant">
              {isAr
                ? "لا توجد منتجات في هذه الفئة."
                : "No items in this category yet."}
            </p>
          </div>
        ) : viewMode === "compact" ? (
          <section
            aria-label="Discover Feed"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-md"
          >
            {tabbedListings.map((product) => (
              <CompactProductCard
                key={product.id}
                product={product}
                isLiked={likes.includes(product.id)}
                isAr={isAr}
                saveLabel={saveLabel}
                toggleLike={() => toggleLike(product.id)}
                onClick={() => onSelectProduct(product)}
              />
            ))}
          </section>
        ) : (
          <section
            aria-label="Discover Feed"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg"
          >
            {tabbedListings.map((product, idx) => (
              <FeaturedProductCard
                key={product.id}
                product={product}
                isLiked={likes.includes(product.id)}
                isAr={isAr}
                saveLabel={saveLabel}
                toggleLike={() => toggleLike(product.id)}
                onClick={() => onSelectProduct(product)}
                isFeatured={idx === 0 && selectedCategory === "All"}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

// ---------- Sub-components ----------

const CompactProductCard: React.FC<{
  product: Product;
  isLiked: boolean;
  isAr: boolean;
  saveLabel: (title: string, saved: boolean) => string;
  toggleLike: () => void;
  onClick: () => void;
}> = ({ product, isLiked, isAr, saveLabel, toggleLike, onClick }) => {
  const productTitle = isAr ? product.titleAr : product.titleEn;
  return (
    <ClickableCard
      as="article"
      onClick={onClick}
      ariaLabel={productTitle}
      className="bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden group cursor-pointer hover:shadow-md transition-all relative"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleLike();
        }}
        aria-pressed={isLiked}
        aria-label={saveLabel(productTitle, isLiked)}
        className={`absolute end-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 backdrop-blur-md transition-colors ${
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
        <span className="font-bold text-primary text-label-sm">
          {formatAEDLabel(product.price)}
        </span>
      </div>
    </ClickableCard>
  );
};

const FeaturedProductCard: React.FC<{
  product: Product;
  isLiked: boolean;
  isAr: boolean;
  saveLabel: (title: string, saved: boolean) => string;
  toggleLike: () => void;
  onClick: () => void;
  isFeatured: boolean;
}> = ({
  product,
  isLiked,
  isAr,
  saveLabel,
  toggleLike,
  onClick,
  isFeatured,
}) => {
  const productTitle = isAr ? product.titleAr : product.titleEn;
  return (
    <ClickableCard
      as="article"
      onClick={onClick}
      ariaLabel={productTitle}
      className={`${
        isFeatured ? "col-span-1 md:col-span-2" : "col-span-1"
      } bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group border border-surface-container-high transition-all duration-500 hover:shadow-md relative cursor-pointer`}
    >
      {/* Badge */}
      <div className="absolute start-md top-md z-10 rounded-full border border-white/50 bg-white/70 px-3 py-1 backdrop-blur-md">
        <span className="font-bold uppercase tracking-widest text-label-sm text-primary flex items-center gap-1">
          <span
            className="material-symbols-outlined text-[12px]"
            aria-hidden="true"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isFeatured ? "auto_awesome" : "verified"}
          </span>
          {isFeatured
            ? isAr
              ? "الرائج"
              : "Trending"
            : product.isAuthentic
              ? isAr
                ? "موثوق"
                : "Authentic"
              : isAr
                ? "ممتاز"
                : "Excellent"}
        </span>
      </div>

      {/* Heart/Like Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleLike();
        }}
        aria-pressed={isLiked}
        aria-label={saveLabel(productTitle, isLiked)}
        className={`absolute end-md top-md z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 backdrop-blur-md transition-colors ${
          isLiked
            ? "text-primary"
            : "text-on-surface-variant hover:text-primary"
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          aria-hidden="true"
          style={{
            fontVariationSettings: `'FILL' ${isLiked ? 1 : 0}`,
          }}
        >
          favorite
        </span>
      </button>

      {/* Product Image */}
      <div
        className={`${isFeatured ? "aspect-[16/9]" : "aspect-[4/5]"} w-full bg-surface-container-low overflow-hidden`}
      >
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
          src={product.image}
          alt={productTitle}
          loading={isFeatured ? "eager" : "lazy"}
          fetchPriority={isFeatured ? "high" : "auto"}
        />
      </div>

      {/* Card Body */}
      <div className="p-lg flex flex-col gap-md">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-sm text-label-sm text-[10px] uppercase tracking-wider">
                {isAr ? product.conditionAr : product.conditionEn}
              </span>
            </div>
            <h2
              className={`${isFeatured ? "text-headline-sm" : "text-[18px]"} font-serif text-on-surface group-hover:text-primary transition-colors`}
            >
              {productTitle}
            </h2>
            {isFeatured && (
              <p
                dir={isAr ? "rtl" : "ltr"}
                className="text-body-md text-on-surface-variant mt-2 w-full line-clamp-3"
              >
                {isAr ? product.descriptionAr : product.descriptionEn}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 text-end">
            <span className="block text-on-surface-variant line-through text-body-md opacity-60">
              {`AED ${product.originalPrice}`}
            </span>
            <span
              className={`block font-bold text-primary ${isFeatured ? "text-headline-sm" : "text-label-md"}`}
            >
              {`AED ${product.price}`}
            </span>
          </div>
        </div>

        {/* Seller Info Footer */}
        <div className="flex items-center justify-between pt-md border-t border-surface-container-high mt-2">
          <div className="flex items-center gap-3">
            <img
              className="w-8 h-8 rounded-full object-cover border border-surface-container-high"
              src={product.sellerAvatar}
              alt={isAr ? product.sellerNameAr : product.sellerNameEn}
              loading="lazy"
            />
            <div>
              <p className="text-label-md text-on-surface leading-tight font-bold">
                {isAr ? product.sellerNameAr : product.sellerNameEn}
              </p>
              <p className="text-label-sm text-on-surface-variant text-[11px]">
                {isAr ? product.sellerTypeAr : product.sellerTypeEn}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-1 text-on-surface-variant opacity-70"
            aria-label={`${product.saves + (isLiked ? 1 : 0)} saves`}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              favorite
            </span>
            <span className="text-label-sm">
              {product.saves + (isLiked ? 1 : 0)}
            </span>
          </div>
        </div>
      </div>
    </ClickableCard>
  );
};

const DesignersTab: React.FC<{
  sections: [string, Product[]][];
  likes: string[];
  toggleLike: (id: string) => void;
  onSelectProduct: (p: Product) => void;
  isAr: boolean;
}> = ({ sections, likes, toggleLike, onSelectProduct, isAr }) => {
  const saveLabel = (title: string, saved: boolean) =>
    isAr
      ? saved
        ? `إزالة ${title} من المحفوظات`
        : `حفظ ${title}`
      : saved
        ? `Remove ${title} from saved`
        : `Save ${title}`;
  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
        <span
          className="material-symbols-outlined text-[56px] text-outline opacity-40"
          aria-hidden="true"
        >
          person
        </span>
        <p className="text-body-lg text-on-surface-variant">
          {isAr
            ? "لا توجد تصاميم من البائعين بعد."
            : "No designer listings yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-xl">
      {sections.map(([sellerName, items]) => (
        <section
          key={sellerName}
          aria-label={sellerName}
          className="flex flex-col gap-md"
        >
          <header className="flex items-baseline justify-between">
            <h3 className="font-serif text-label-md uppercase tracking-wider text-on-surface font-bold">
              {sellerName}
            </h3>
            <span className="text-[11px] text-on-surface-variant">
              {items.length} {isAr ? "قطعة" : "items"}
            </span>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-md">
            {items.map((product) => (
              <CompactProductCard
                key={product.id}
                product={product}
                isLiked={likes.includes(product.id)}
                isAr={isAr}
                saveLabel={saveLabel}
                toggleLike={() => toggleLike(product.id)}
                onClick={() => onSelectProduct(product)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
