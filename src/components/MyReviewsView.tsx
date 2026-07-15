"use client";

import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { findOrder } from "@/data/orders";
import { formatOrderDate } from "@/data/orders";

interface MyReviewsViewProps {
  onBack: () => void;
}

interface MyReviewsCopy {
  title: string;
  back: string;
  emptyTitle: string;
  emptyBody: string;
  verifiedPurchase: string;
  outOf: (n: number) => string;
}

const COPY: Record<"en" | "ar", MyReviewsCopy> = {
  en: {
    title: "My reviews",
    back: "Back",
    emptyTitle: "No reviews yet",
    emptyBody:
      "Once you leave a review on a delivered order, it will appear here.",
    verifiedPurchase: "Verified purchase",
    outOf: (n) => `out of 5`,
  },
  ar: {
    title: "تقييماتي",
    back: "رجوع",
    emptyTitle: "لا توجد تقييمات بعد",
    emptyBody: "بمجرد ترك تقييم على طلب تم تسليمه، سيظهر هنا.",
    verifiedPurchase: "شراء موثق",
    outOf: (n) => `من ٥`,
  },
};

/**
 * H-39 — My Reviews list.
 *
 * Lists every review the user has written, with star display, the
 * original order's product info (resolved from `useApp().orders`),
 * and the verified-purchase badge. Empty state when no reviews exist.
 */
export const MyReviewsView: React.FC<MyReviewsViewProps> = ({ onBack }) => {
  const { language, myReviews, orders } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const sorted = useMemo(
    () =>
      myReviews
        .slice()
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [myReviews],
  );

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-md pb-10"
    >
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
          {t.title}
        </h1>
        <div className="w-8 h-8" aria-hidden="true" />
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            reviews
          </span>
          <h2 className="font-serif text-headline-sm text-on-surface">
            {t.emptyTitle}
          </h2>
          <p className="text-label-sm text-on-surface-variant max-w-xs">
            {t.emptyBody}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {sorted.map((review) => {
            const order = findOrder(orders, review.orderId);
            const line = order?.lineItems[0];
            const productTitle = line
              ? isAr
                ? line.product.titleAr
                : line.product.titleEn
              : "";
            const productImage = line?.product.image;
            return (
              <article
                key={review.id}
                className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md"
              >
                <header className="flex gap-sm">
                  {productImage && (
                    <img
                      alt={productTitle}
                      src={productImage}
                      className="w-14 h-14 rounded object-cover border border-outline-variant flex-shrink-0"
                    />
                  )}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-sm">
                      <h3 className="font-serif text-label-md text-on-surface line-clamp-1">
                        {review.title}
                      </h3>
                      <div
                        className="flex text-amber-500"
                        aria-label={`${review.rating} ${t.outOf(review.rating)}`}
                      >
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span
                            key={i}
                            className="text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            aria-hidden="true"
                          >
                            {i <= review.rating ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-label-sm text-on-surface-variant line-clamp-1">
                      {productTitle}
                    </p>
                    <div className="flex items-center gap-sm mt-1">
                      {review.isVerifiedPurchase && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {t.verifiedPurchase}
                        </span>
                      )}
                      <span className="text-[10px] text-outline">
                        {formatOrderDate(review.date, isAr)}
                      </span>
                    </div>
                  </div>
                </header>
                <p className="text-label-sm text-on-surface mt-2 whitespace-pre-line">
                  {review.body}
                </p>
                {review.photos.length > 0 && (
                  <div className="flex gap-sm mt-2">
                    {review.photos.map((p, i) => (
                      <img
                        key={i}
                        alt=""
                        src={p}
                        className="w-16 h-16 rounded object-cover border border-outline-variant"
                      />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
