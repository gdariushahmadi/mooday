"use client";

import React from "react";
import type { Product } from "@/context/AppContext";
import type { SortOption } from "./search/types";
import { useSearchFilters } from "./search/useSearchFilters";
import { SearchSidebar } from "./search/SearchSidebar";
import { SearchResults } from "./search/SearchResults";

interface SearchFiltersViewProps {
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
}

export const SearchFiltersView: React.FC<SearchFiltersViewProps> = ({
  onSelectProduct,
  onBack,
}) => {
  const {
    t,
    isAr,
    likes,
    toggleLike,
    searchQuery,
    setSearchQuery,
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
    sortBy,
    setSortBy,
    filtersOpen,
    setFiltersOpen,
    clearAll,
    activeFilterCount,
    activeFilters,
    filteredListings,
  } = useSearchFilters();

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-lg pb-10">
      {/* Header Search Box */}
      <div className="app-page-header flex items-center gap-md border-b border-outline-variant pb-4">
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
            onClick={() => setFiltersOpen((open: boolean) => !open)}
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
        <SearchSidebar
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          isAr={isAr}
          t={t}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedCondition={selectedCondition}
          setSelectedCondition={setSelectedCondition}
          selectedSizes={selectedSizes}
          toggleSize={toggleSize}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
        />

        <SearchResults
          filteredListings={filteredListings}
          t={t}
          clearAll={clearAll}
          onSelectProduct={onSelectProduct}
          likes={likes}
          toggleLike={toggleLike}
          isAr={isAr}
        />
      </div>
    </div>
  );
};
