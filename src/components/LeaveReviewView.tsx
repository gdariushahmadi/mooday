"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Order } from "@/data/orders";
import type { ReviewRating } from "@/data/my-reviews";

interface LeaveReviewViewProps {
  order: Order;
  onBack: () => void;
  /** Called after a successful submit. */
  onSubmitted?: () => void;
}

interface LeaveReviewCopy {
  title: string;
  back: string;
  ratingHeading: string;
  ratingHint: (n: number) => string;
  titleLabel: string;
  titlePh: string;
  bodyLabel: string;
  bodyPh: string;
  attachPhotos: string;
  attachHelp: string;
  verifiedPurchase: string;
  submit: string;
  cancel: string;
  required: string;
  submitted: string;
  productLine: string;
}

const COPY: Record<"en" | "ar", LeaveReviewCopy> = {
  en: {
    title: "Leave a review",
    back: "Back",
    ratingHeading: "Your rating",
    ratingHint: (n) =>
      n === 5
        ? "Excellent"
        : n === 4
          ? "Good"
          : n === 3
            ? "Average"
            : n === 2
              ? "Below expectations"
              : "Poor",
    titleLabel: "Headline",
    titlePh: "Summarize your experience",
    bodyLabel: "Your review",
    bodyPh: "What did you love (or not)?",
    attachPhotos: "Attach photos (optional)",
    attachHelp:
      "Tap to add up to 3 photos. Phase 1 inserts a stub photo URL.",
    verifiedPurchase: "Verified purchase",
    submit: "Submit review",
    cancel: "Cancel",
    required: "Please choose a rating and add a short headline.",
    submitted: "Review submitted. Thanks for sharing!",
    productLine: "Reviewing:",
  },
  ar: {
    title: "اتركي تقييماً",
    back: "رجوع",
    ratingHeading: "تقييمك",
    ratingHint: (n) =>
      n === 5
        ? "ممتاز"
        : n === 4
          ? "جيد"
          : n === 3
            ? "متوسط"
            : n === 2
              ? "أقل من المتوقع"
              : "ضعيف",
    titleLabel: "العنوان",
    titlePh: "لخّصي تجربتك",
    bodyLabel: "تفاصيل التقييم",
    bodyPh: "ما الذي أحببتِ (أو لم تحبي)؟",
    attachPhotos: "إرفاق صور (اختياري)",
    attachHelp: "اضغطي لإضافة حتى ٣ صور.",
    verifiedPurchase: "شراء موثق",
    submit: "إرسال التقييم",
    cancel: "إلغاء",
    required: "يرجى اختيار تقييم وإضافة عنوان قصير.",
    submitted: "تم إرسال التقييم. شكراً لمشاركتك!",
    productLine: "تقييم:",
  },
};

const STAR_LABELS_EN = ["", "Poor", "Below expectations", "Average", "Good", "Excellent"];
const STAR_LABELS_AR = ["", "ضعيف", "أقل من المتوقع", "متوسط", "جيد", "ممتاز"];

/**
 * H-39 — Leave a Review.
 *
 * The order context drives the seller + product + verified-purchase flag.
 * The user picks a 1–5 star rating, writes a headline and body, optionally
 * adds up to 3 stub photos, and submits via `addMyReview()`.
 */
export const LeaveReviewView: React.FC<LeaveReviewViewProps> = ({
  order,
  onBack,
  onSubmitted,
}) => {
  const { language, addMyReview } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const first = order.lineItems[0];
  const productLabel = first
    ? isAr
      ? first.product.titleAr
      : first.product.titleEn
    : "";

  const [rating, setRating] = useState<ReviewRating>(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  const handleAddPhoto = () => {
    if (photos.length >= 3) return;
    // Phase 1: insert a stub photo (Phase 3 will be a real file picker).
    setPhotos([
      ...photos,
      first ? first.product.image : "/products/placeholder.jpg",
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setFormError(t.required);
      return;
    }
    setFormError("");
    const productSeller =
      first ? first.product.sellerNameEn : "Unknown";
    addMyReview({
      orderId: order.id,
      sellerKey: productSeller,
      rating,
      title: title.trim(),
      body: body.trim(),
      photos,
      date: new Date().toISOString(),
      isVerifiedPurchase: true,
    });
    onSubmitted?.();
    onBack();
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-md pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.back}
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined no-mirror" aria-hidden="true">
            arrow_back
          </span>
        </button>
        <h1 className="font-serif text-headline-sm text-primary tracking-widest uppercase flex-grow text-center">
          {t.title}
        </h1>
        <div className="w-10" aria-hidden="true" />
      </div>

      {/* Order / product summary */}
      <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex items-center gap-md">
        {first && (
          <img
            alt={productLabel}
            src={first.product.image}
            className="w-16 h-16 rounded object-cover border border-outline-variant flex-shrink-0"
          />
        )}
        <div className="flex-grow min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-outline font-bold">
            {t.productLine}
          </div>
          <p className="font-serif text-label-md text-on-surface line-clamp-1">
            {productLabel}
          </p>
          <div className="flex items-center gap-sm mt-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {t.verifiedPurchase}
            </span>
            <span className="text-[10px] text-outline">#{order.id}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md font-sans">
        {formError && <p role="alert" className="rounded-lg bg-error-container p-sm text-error font-bold">{formError}</p>}
        {/* Rating stars */}
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md">
          <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold">
            {t.ratingHeading}
          </h2>
          <div
            role="radiogroup"
            aria-label={t.ratingHeading}
            className="flex items-center gap-1 mt-2"
          >
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= rating;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} - ${isAr ? STAR_LABELS_AR[n] : STAR_LABELS_EN[n]}`}
                  onClick={() => setRating(n as ReviewRating)}
                  className={`text-[36px] transition-all active:scale-90 ${
                    active ? "text-amber-500" : "text-outline"
                  }`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  ★
                </button>
              );
            })}
            <span className="ms-2 text-label-sm font-bold text-amber-700">
              {isAr ? STAR_LABELS_AR[rating] : STAR_LABELS_EN[rating]}
            </span>
          </div>
        </section>

        {/* Title + body */}
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex flex-col gap-sm">
          <div className="flex flex-col gap-xs">
            <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {t.titleLabel}
            </label>
            <input
              type="text"
              placeholder={t.titlePh}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {t.bodyLabel}
            </label>
            <textarea
              rows={5}
              placeholder={t.bodyPh}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
            />
          </div>
        </section>

        {/* Photo upload (Phase 1: stub) */}
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md">
          <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold">
            {t.attachPhotos}{" "}
            <span className="text-outline font-sans">({photos.length}/3)</span>
          </h2>
          <p className="text-[11px] text-on-surface-variant mt-1">{t.attachHelp}</p>
          <div className="flex gap-sm mt-2 flex-wrap">
            {photos.map((url, i) => (
              <div
                key={i}
                className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-container-high"
              >
                <img alt="" src={url} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                  aria-label="Remove"
                  className="absolute top-1 end-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <button
                type="button"
                onClick={handleAddPhoto}
                aria-label={isAr ? "إضافة صورة" : "Add photo"}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-outline hover:border-primary hover:text-primary transition-colors"
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  aria-hidden="true"
                >
                  add_a_photo
                </span>
              </button>
            )}
          </div>
        </section>

        <button
          type="submit"
          className="btn-primary py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md active:scale-95 transition-transform"
        >
          {t.submit}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider self-center active:scale-95 transition-transform"
        >
          {t.cancel}
        </button>
      </form>
    </div>
  );
};
