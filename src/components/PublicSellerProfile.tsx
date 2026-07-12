"use client";

import React, { useState } from "react";
import { ClickableCard } from "./ClickableCard";
import { useApp } from "@/context/AppContext";
import { getSellerProfile } from "@/data/seller-profile";
import {
  REVIEWS,
  QUICK_TAGS_EN,
  QUICK_TAGS_AR,
  type Review,
  type QuickTag,
} from "@/data/reviews";
import type { Product } from "@/context/AppContext";
import { formatAEDLabel } from "@/lib/format";

interface PublicSellerProfileProps {
  sellerId: string;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenChat: (sellerId: string) => void;
  listings: Product[];
}

type ProfileTab = "listings" | "reviews";
type ReviewFilter = 0 | 1 | 2 | 3 | 4 | 5; // 0 = All

const COPY = {
  en: {
    back: "Back",
    verified: "Verified",
    memberSince: (y: string) => `Member since ${y}`,
    responseTime: (h: number) => `Replies within ${h}h`,
    responseRate: (r: number) => `${Math.round(r * 100)}% reply rate`,
    listings: "Listings",
    reviews: "Reviews",
    followers: "Followers",
    following: "Following",
    rating: "Rating",
    follow: "Follow",
    followingBtn: "Following",
    message: "Message",
    share: "Share",
    report: "Report",
    block: "Block",
    noListings: "No active listings yet.",
    noReviews: (filter: ReviewFilter) =>
      filter === 0 ? "No reviews yet." : `No ${filter}-star reviews yet.`,
    reviewCount: (n: number) => `${n} review${n === 1 ? "" : "s"}`,
    verifiedPurchase: "Verified purchase",
    filterAll: "All",
    notFound: "Seller not found.",
    styleTags: "Style",
    notFoundCta: "Browse the Discover feed",
  },
  ar: {
    back: "رجوع",
    verified: "موثق",
    memberSince: (y: string) => `عضو منذ ${y}`,
    responseTime: (h: number) => `يرد خلال ${h} ساعة`,
    responseRate: (r: number) => `نسبة الرد ${Math.round(r * 100)}%`,
    listings: "المعروضات",
    reviews: "التقييمات",
    followers: "متابعون",
    following: "يتابع",
    rating: "التقييم",
    follow: "متابعة",
    followingBtn: "تتابعه",
    message: "رسالة",
    share: "مشاركة",
    report: "إبلاغ",
    block: "حظر",
    noListings: "لا توجد معروضات حالياً.",
    noReviews: (filter: ReviewFilter) =>
      filter === 0
        ? "لا توجد تقييمات بعد."
        : `لا توجد تقييمات ${filter} نجوم بعد.`,
    reviewCount: (n: number) => `${n} تقييم`,
    verifiedPurchase: "شراء موثق",
    filterAll: "الكل",
    notFound: "البائع غير موجود.",
    styleTags: "الأسلوب",
    notFoundCta: "تصفحي صفحة الاكتشاف",
  },
} as const;

export const PublicSellerProfile: React.FC<PublicSellerProfileProps> = ({
  sellerId,
  onBack,
  onSelectProduct,
  onOpenChat,
  listings,
}) => {
  const { language, toggleLike, likes } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const seller = getSellerProfile(sellerId);

  const [tab, setTab] = useState<ProfileTab>("listings");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>(0);
  const [following, setFollowing] = useState(false);

  if (!seller) {
    return (
      <div className="w-full max-w-[800px] mx-auto flex flex-col items-center justify-center py-20 gap-md text-center font-sans">
        <span
          className="material-symbols-outlined text-[64px] text-outline opacity-40"
          aria-hidden="true"
        >
          person_off
        </span>
        <p className="text-body-lg text-on-surface-variant">{t.notFound}</p>
        <button
          onClick={onBack}
          className="btn-primary px-6 py-3 rounded-full text-label-sm font-bold uppercase tracking-wider"
        >
          {t.notFoundCta}
        </button>
      </div>
    );
  }

  const sellerListings = listings.filter(
    (l) => l.sellerNameEn === seller.nameEn || l.sellerNameAr === seller.nameAr,
  );

  const sellerReviews: Review[] = REVIEWS.filter(
    (r) => r.sellerId === sellerId,
  );
  const filteredReviews = sellerReviews.filter(
    (r) => reviewFilter === 0 || r.rating === reviewFilter,
  );

  const joinedYear = new Date(seller.joinedAt).getFullYear();
  const styleTags = isAr ? seller.styleTagsAr : seller.styleTagsEn;
  const bio = isAr ? seller.bioAr : seller.bioEn;
  const city = isAr ? seller.cityAr : seller.cityEn;
  const sellerDisplayName = isAr ? seller.nameAr : seller.nameEn;
  const sellerType = isAr ? seller.typeAr : seller.typeEn;

  const filterStars = [0, 5, 4, 3, 2, 1] as const;

  return (
    <div className="w-full max-w-[900px] mx-auto flex flex-col gap-lg pb-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          onClick={onBack}
          aria-label={t.back}
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
        </button>
        <div className="font-serif text-label-md uppercase tracking-widest text-on-surface-variant font-bold">
          {sellerDisplayName}
        </div>
        <div className="w-10" />
      </div>

      {/* Hero card */}
      <section className="bg-surface-container-low border border-surface-container-high rounded-2xl p-lg flex flex-col sm:flex-row items-center gap-lg shadow-sm">
        <img
          alt={sellerDisplayName}
          src={seller.avatar}
          loading="lazy"
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-primary-fixed-dim"
        />

        <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-start gap-xs">
          <div className="flex items-center gap-sm">
            <h2 className="font-serif text-headline-md text-on-surface">
              {sellerDisplayName}
            </h2>
            {seller.isVerified && (
              <span
                className="material-symbols-outlined text-primary text-[20px]"
                aria-label={t.verified}
                title={t.verified}
              >
                verified
              </span>
            )}
          </div>
          <p className="text-label-sm text-on-surface-variant">{sellerType}</p>
          <p className="text-body-md text-on-surface/90 leading-relaxed max-w-[440px] mt-1">
            {bio}
          </p>
          <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
            <span
              className="material-symbols-outlined text-[16px] text-primary"
              aria-hidden="true"
            >
              location_on
            </span>
            {city} · {t.memberSince(String(joinedYear))}
          </p>
          <p className="text-label-sm text-on-surface-variant">
            {t.responseTime(seller.responseTimeHours)} ·{" "}
            {t.responseRate(seller.responseRate)}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-4 gap-sm">
        <StatCell
          value={String(sellerListings.length)}
          label={t.listings}
          isAr={isAr}
        />
        <StatCell
          value={String(sellerReviews.length)}
          label={t.reviews}
          isAr={isAr}
        />
        <StatCell value="1,420" label={t.followers} isAr={isAr} />
        <StatCell value="382" label={t.following} isAr={isAr} />
      </section>

      {/* Style tags */}
      <section className="flex flex-col gap-sm" aria-label={t.styleTags}>
        <h3 className="text-label-md uppercase tracking-widest text-on-surface-variant font-bold">
          {t.styleTags}
        </h3>
        <div className="flex flex-wrap gap-sm">
          {styleTags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-label-sm bg-surface-container-low border border-surface-container-high text-on-surface"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="flex flex-wrap gap-sm">
        <button
          onClick={() => setFollowing((v) => !v)}
          aria-pressed={following}
          className={`flex-1 min-w-[140px] py-3 rounded-xl text-label-md uppercase tracking-widest font-bold active:scale-95 transition-all ${
            following
              ? "bg-surface-container-low border-2 border-primary text-primary"
              : "bg-primary text-on-primary btn-tactile shadow-md"
          }`}
        >
          {following ? t.followingBtn : t.follow}
        </button>
        <button
          onClick={() => onOpenChat(sellerId)}
          className="flex-1 min-w-[140px] py-3 rounded-xl text-label-md uppercase tracking-widest font-bold border-2 border-primary text-primary hover:bg-primary/5 active:scale-95 transition-all"
        >
          {t.message}
        </button>
      </section>

      {/* Secondary actions */}
      <section className="flex gap-sm justify-end">
        <IconAction label={t.share} icon="share" />
        <IconAction label={t.report} icon="flag" />
        <IconAction label={t.block} icon="block" />
      </section>

      {/* Tabs */}
      <nav className="flex border-b border-surface-variant" role="tablist">
        <button
          onClick={() => setTab("listings")}
          role="tab"
          aria-selected={tab === "listings"}
          className={`flex-1 pb-3 font-bold uppercase tracking-widest text-label-md border-b-2 transition-all ${
            tab === "listings"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t.listings} ({sellerListings.length})
        </button>
        <button
          onClick={() => setTab("reviews")}
          role="tab"
          aria-selected={tab === "reviews"}
          className={`flex-1 pb-3 font-bold uppercase tracking-widest text-label-md border-b-2 transition-all ${
            tab === "reviews"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t.reviews} ({sellerReviews.length})
        </button>
      </nav>

      {/* Tab content */}
      {tab === "listings" ? (
        <section role="tabpanel" aria-label={t.listings}>
          {sellerListings.length === 0 ? (
            <EmptyState icon="apparel" message={t.noListings} isAr={isAr} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
              {sellerListings.map((product) => {
                const productTitle = isAr ? product.titleAr : product.titleEn;
                const isLiked = likes.includes(product.id);
                return (
                  <div key={product.id} className="relative">
                    <ClickableCard
                      onClick={() => onSelectProduct(product)}
                      ariaLabel={productTitle}
                      className="bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden group cursor-pointer hover:shadow-md transition-all"
                    >
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
                        <h4 className="font-serif text-label-md text-on-surface line-clamp-1">
                          {productTitle}
                        </h4>
                        <span className="font-bold text-primary text-label-sm">
                          {formatAEDLabel(product.price)}
                        </span>
                      </div>
                    </ClickableCard>
                    <button
                      onClick={() => toggleLike(product.id)}
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
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section role="tabpanel" aria-label={t.reviews}>
          {/* Filter chips */}
          <div
            className="flex gap-sm overflow-x-auto no-scrollbar -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 pb-xs"
            role="group"
            aria-label={isAr ? "تصفية التقييمات" : "Filter reviews"}
          >
            {filterStars.map((stars) => (
              <button
                key={stars}
                onClick={() => setReviewFilter(stars)}
                aria-pressed={reviewFilter === stars}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-label-sm border transition-all ${
                  reviewFilter === stars
                    ? "bg-primary text-on-primary border-primary font-bold"
                    : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
                }`}
              >
                {stars === 0 ? t.filterAll : `${"★".repeat(stars)} ${stars}`}
              </button>
            ))}
          </div>

          {filteredReviews.length === 0 ? (
            <EmptyState
              icon="rate_review"
              message={t.noReviews(reviewFilter)}
              isAr={isAr}
            />
          ) : (
            <div className="flex flex-col gap-sm">
              {filteredReviews.map((review) => (
                <ReviewCard key={review.id} review={review} isAr={isAr} t={t} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

// ---------- Sub-components ----------

const StatCell: React.FC<{ value: string; label: string; isAr: boolean }> = ({
  value,
  label,
  isAr,
}) => (
  <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md text-center">
    <span className="block font-serif text-headline-sm text-primary font-bold">
      {value}
    </span>
    <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">
      {label}
    </span>
  </div>
);

const IconAction: React.FC<{ label: string; icon: string }> = ({
  label,
  icon,
}) => (
  <button
    aria-label={label}
    className="w-10 h-10 rounded-full border border-surface-container-high text-on-surface-variant hover:text-primary hover:border-primary transition-colors flex items-center justify-center active:scale-95"
  >
    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
      {icon}
    </span>
  </button>
);

const EmptyState: React.FC<{
  icon: string;
  message: string;
  isAr: boolean;
}> = ({ icon, message, isAr }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
    <span
      className="material-symbols-outlined text-[48px] text-outline opacity-40"
      aria-hidden="true"
    >
      {icon}
    </span>
    <p className="text-body-md text-on-surface-variant font-sans">{message}</p>
  </div>
);

const ReviewCard: React.FC<{
  review: Review;
  isAr: boolean;
  t: typeof COPY.en | typeof COPY.ar;
}> = ({ review, isAr, t }) => {
  const reviewText = isAr ? review.textAr : review.textEn;
  const dateStr = new Date(review.date).toLocaleDateString(
    isAr ? "ar-AE" : "en-AE",
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <article className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex flex-col gap-sm font-sans">
      <header className="flex items-center gap-md">
        <div
          className="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center font-bold text-on-primary"
          aria-hidden="true"
        >
          {review.reviewerName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label-md text-on-surface font-bold truncate">
            {review.reviewerName}
          </p>
          <p className="text-[11px] text-on-surface-variant">{dateStr}</p>
        </div>
        <div
          className="flex text-tertiary"
          aria-label={`${review.rating} ${isAr ? "نجوم" : "stars"}`}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
              style={{
                fontVariationSettings: `'FILL' ${i < review.rating ? 1 : 0}`,
              }}
            >
              star
            </span>
          ))}
        </div>
      </header>

      {review.verifiedPurchase && (
        <span className="self-start text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
          <span
            className="material-symbols-outlined text-[14px]"
            aria-hidden="true"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
          {t.verifiedPurchase}
        </span>
      )}

      <p className="text-body-md text-on-surface leading-relaxed">
        {reviewText}
      </p>

      {review.quickTags.length > 0 && (
        <div className="flex flex-wrap gap-xs">
          {review.quickTags.map((tag: QuickTag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary font-bold"
            >
              {(isAr ? QUICK_TAGS_AR : QUICK_TAGS_EN)[tag]}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};
