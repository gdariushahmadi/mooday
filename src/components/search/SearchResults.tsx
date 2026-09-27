import React from "react";
import type { Product } from "@/context/AppContext";
import { ClickableCard } from "@/components/ClickableCard";
import { formatAEDLabel } from "@/lib/format";

interface SearchResultsProps {
  filteredListings: Product[];
  t: typeof import("./constants").COPY.en | typeof import("./constants").COPY.ar;
  clearAll: () => void;
  onSelectProduct: (product: Product) => void;
  likes: string[];
  toggleLike: (id: string) => void;
  isAr: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  filteredListings,
  t,
  clearAll,
  onSelectProduct,
  likes,
  toggleLike,
  isAr,
}) => {
  return (
    <main className="lg:col-span-9 flex flex-col gap-md">
      {filteredListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline opacity-40"
            aria-hidden="true"
          >
            search_off
          </span>
          <p className="text-body-lg text-on-surface-variant">{t.noResults}</p>
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
  );
};
