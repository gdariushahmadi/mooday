"use client";

import React, { useState } from "react";
import { useApp, Product } from "@/context/AppContext";
import { CATEGORIES, CATEGORIES_AR } from "@/data/categories";
import { ClickableCard } from "./ClickableCard";

export type TabView = "home" | "search" | "sell" | "activity" | "profile";

interface DiscoverFeedViewProps {
  onSelectProduct: (product: Product) => void;
  onNavigate: (view: TabView) => void;
}

type ViewMode = "featured" | "compact";

const categories = CATEGORIES;
const categoriesAr = CATEGORIES_AR;

export const DiscoverFeedView: React.FC<DiscoverFeedViewProps> = ({
  onSelectProduct,
}) => {
  const { language, setLanguage, listings, likes, toggleLike } = useApp();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("featured");

  const isAr = language === "ar";

  const filteredListings = listings.filter(
    (item) => selectedCategory === "All" || item.category === selectedCategory,
  );

  const handleLangToggle = () => {
    setLanguage(isAr ? "en" : "ar");
  };

  return (
    <div className="w-full flex flex-col gap-lg pb-10">
      {/* Tab Navigation */}
      <nav className="flex items-center justify-between border-b border-surface-variant">
        <div className="flex space-x-gutter overflow-x-auto no-scrollbar pb-3">
          <button className="pb-1 border-b-2 border-primary text-primary font-bold uppercase tracking-widest text-label-md whitespace-nowrap px-1">
            {isAr ? "لكِ" : "For You"}
          </button>
        </div>
        {/* Language Quick Switcher */}
        <button
          onClick={handleLangToggle}
          aria-label={
            isAr ? "التبديل إلى اللغة الإنجليزية" : "Switch to Arabic"
          }
          className="text-primary font-bold border border-primary/20 px-3 py-1 rounded-full text-label-sm active:scale-95 transition-transform bg-surface-container-low hover:bg-surface-container-high"
        >
          {isAr ? "English" : "عربي"}
        </button>
      </nav>

      {/* Category & View Controls */}
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
              onClick={() => setViewMode("featured")}
              aria-pressed={viewMode === "featured"}
              aria-label={isAr ? "عرض مميز" : "Featured view"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                viewMode === "featured"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title={isAr ? "عرض مميز" : "Featured view"}
            >
              <span
                className="material-symbols-outlined text-[20px] no-mirror"
                aria-hidden="true"
              >
                view_agenda
              </span>
            </button>
            <button
              onClick={() => setViewMode("compact")}
              aria-pressed={viewMode === "compact"}
              aria-label={isAr ? "نوافذ صغيرة" : "Compact view"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                viewMode === "compact"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title={isAr ? "نوافذ صغيرة" : "Compact view"}
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

        <div className="flex gap-sm overflow-x-auto no-scrollbar -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 pb-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-label-sm uppercase tracking-wider transition-all border ${
                selectedCategory === cat
                  ? "bg-primary text-on-primary border-primary font-bold"
                  : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
              }`}
            >
              {isAr ? categoriesAr[cat] : cat}
            </button>
          ))}
        </div>
      </section>

      {/* Discovery Feed Grid */}
      {filteredListings.length === 0 ? (
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
          {filteredListings.map((product) => {
            const isLiked = likes.includes(product.id);
            const productTitle = isAr ? product.titleAr : product.titleEn;
            return (
              <ClickableCard
                key={product.id}
                as="article"
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
                  <span className="font-bold text-primary text-label-sm">
                    AED {product.price}
                  </span>
                </div>
              </ClickableCard>
            );
          })}
        </section>
      ) : (
        <section
          aria-label="Discover Feed"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg"
        >
          {filteredListings.map((product, idx) => {
            const isFeatured = idx === 0 && selectedCategory === "All";
            const isLiked = likes.includes(product.id);
            const productTitle = isAr ? product.titleAr : product.titleEn;

            return (
              <ClickableCard
                key={product.id}
                as="article"
                onClick={() => onSelectProduct(product)}
                ariaLabel={productTitle}
                className={`${
                  isFeatured ? "col-span-1 md:col-span-2" : "col-span-1"
                } bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group border border-surface-container-high transition-all duration-500 hover:shadow-md relative cursor-pointer`}
              >
                {/* Badge */}
                <div className="absolute top-md left-md z-10 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/50">
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
                  className={`absolute top-md right-md z-10 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center transition-colors ${
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
                    loading="lazy"
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
                    <div className="text-right flex-shrink-0">
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
          })}
        </section>
      )}
    </div>
  );
};
