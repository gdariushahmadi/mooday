import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { readUrlFilters, syncUrl } from "./url";
import {
  CATEGORIES_AR,
  CONDITIONS_AR,
} from "@/data/categories";
import { SIZES_AR, COLOURS, type Size } from "@/data/attributes";
import { COPY } from "./constants";
import type { SortOption } from "./types";

export function useSearchFilters() {
  const { language, listings, likes, toggleLike, blockedUsers } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  // Initialise all filter state from the URL in lazy initialisers.
  const initial = useMemo(() => readUrlFilters(), []);
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
    const blockedNames = new Set(
      blockedUsers.flatMap((u) => [u.nameEn, u.nameAr].filter(Boolean)),
    );

    let result = listings.filter((item) => {
      if (
        blockedNames.has(item.sellerNameEn) ||
        blockedNames.has(item.sellerNameAr)
      ) {
        return false;
      }

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
    blockedUsers,
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

  return {
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
  };
}
