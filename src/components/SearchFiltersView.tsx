"use client";

import React, { useState } from "react";
import { useApp, Product } from "@/context/AppContext";
import { CATEGORIES, CATEGORIES_AR, CONDITIONS, CONDITIONS_AR } from "@/data/categories";

interface SearchFiltersViewProps {
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
}

export const SearchFiltersView: React.FC<SearchFiltersViewProps> = ({
  onSelectProduct,
  onBack,
}) => {
  const { language, listings, likes, toggleLike } = useApp();
  const isAr = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCondition, setSelectedCondition] = useState<string>("All");

  const categories = CATEGORIES;
  const categoriesAr = CATEGORIES_AR;

  const conditions = CONDITIONS;
  const conditionsAr = CONDITIONS_AR;

  // Filter listings
  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.titleAr.includes(searchQuery) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    const matchesCondition =
      selectedCondition === "All" || item.conditionEn === selectedCondition;

    return matchesSearch && matchesCategory && matchesCondition;
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-lg pb-10">
      {/* Header Search Box */}
      <div className="flex items-center gap-md border-b border-outline-variant pb-4">
        <button
          onClick={onBack}
          aria-label="Back"
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        
        {/* Search Input Box */}
        <div className="flex-grow flex items-center gap-sm bg-surface-container-low border border-outline-variant rounded-full px-md py-sm font-sans">
          <span className="material-symbols-outlined text-outline">search</span>
          <input
            type="text"
            placeholder={isAr ? "ابحث عن حقيبة، فستان، ديكور..." : "Search for bags, dresses, decor..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none border-none text-body-md text-on-surface placeholder-outline-variant"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-outline">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg mt-md font-sans">
        {/* Left Column: Filters Sidebar */}
        <aside className="lg:col-span-3 flex flex-col gap-md">
          {/* Categories Filter */}
          <div className="bg-surface-container-low rounded-xl border border-surface-container-high p-md">
            <h3 className="font-serif text-label-md uppercase tracking-wider text-primary font-bold mb-md">
              {isAr ? "الفئات" : "Categories"}
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-label-sm text-left px-3 py-2 rounded-lg transition-all border ${
                    selectedCategory === cat
                      ? "bg-primary text-on-primary border-primary font-bold"
                      : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
                  }`}
                >
                  {isAr ? categoriesAr[cat] : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Filter */}
          <div className="bg-surface-container-low rounded-xl border border-surface-container-high p-md">
            <h3 className="font-serif text-label-md uppercase tracking-wider text-primary font-bold mb-md">
              {isAr ? "حالة المنتج" : "Item Condition"}
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-xs">
              {conditions.map((cond) => (
                <button
                  key={cond}
                  onClick={() => setSelectedCondition(cond)}
                  className={`text-label-sm text-left px-3 py-2 rounded-lg transition-all border ${
                    selectedCondition === cond
                      ? "bg-primary text-on-primary border-primary font-bold"
                      : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
                  }`}
                >
                  {isAr ? conditionsAr[cond] : cond}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Column: Search Results Grid */}
        <main className="lg:col-span-9 flex flex-col gap-md">
          <div className="flex justify-between items-center text-body-md text-on-surface-variant font-sans">
            <span>
              {isAr 
                ? `تم العثور على ${filteredListings.length} منتج`
                : `Found ${filteredListings.length} items`}
            </span>
          </div>

          {filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-md text-center">
              <span className="material-symbols-outlined text-[64px] text-outline opacity-40">
                search_off
              </span>
              <p className="text-body-lg text-on-surface-variant">
                {isAr ? "لم نجد أي منتجات تطابق بحثك." : "We couldn't find any items matching your search."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-md">
              {filteredListings.map((product) => {
                const isLiked = likes.includes(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    className="bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden group cursor-pointer hover:shadow-md transition-all relative"
                  >
                    {/* Heart/Like Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(product.id);
                      }}
                      className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center transition-colors ${
                        isLiked ? "text-primary" : "text-on-surface-variant hover:text-primary"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: `'FILL' ${isLiked ? 1 : 0}` }}
                      >
                        favorite
                      </span>
                    </button>

                    <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
                      <img
                        alt={isAr ? product.titleAr : product.titleEn}
                        src={product.image}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-md flex flex-col gap-1">
                      <span className="text-[10px] text-outline font-bold uppercase tracking-wider">
                        {isAr ? product.conditionAr : product.conditionEn}
                      </span>
                      <h4 className="font-serif text-label-md text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {isAr ? product.titleAr : product.titleEn}
                      </h4>
                      <span className="font-bold text-primary text-label-sm">
                        AED {product.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
