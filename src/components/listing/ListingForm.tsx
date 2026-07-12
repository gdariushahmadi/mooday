"use client";

import React, { useState, useMemo } from "react";
import type { Product } from "@/context/AppContext";
import {
  SELL_CATEGORIES,
  CATEGORIES_AR,
  CONDITIONS,
  CONDITIONS_AR,
} from "@/data/categories";
import { SIZES } from "@/data/attributes";
import { COLOURS, findColour } from "@/data/attributes";
import { mockImageOptions } from "@/data/mock-images";
import { formatAEDLabel } from "@/lib/format";

/** Bilingual form copy. */
export interface ListingFormCopy {
  titleEn: string;
  titleAr: string;
  category: string;
  condition: string;
  description: string;
  descriptionEn: string;
  descriptionAr: string;
  photos: string;
  price: string;
  originalPrice: string;
  discount: string;
  size: string;
  color: string;
  authentic: string;
  authenticHelp: string;
  publish: string;
  saveDraft: string;
  requiredField: string;
  sizePlaceholder: string;
}

export const LISTING_FORM_COPY_EN: ListingFormCopy = {
  titleEn: "Title (English)",
  titleAr: "Title (Arabic)",
  category: "Category",
  condition: "Condition",
  description: "Description",
  descriptionEn: "Description (English)",
  descriptionAr: "Description (Arabic)",
  photos: "Photos",
  price: "Your price (AED)",
  originalPrice: "Retail price (AED, for discount %)",
  discount: "Discount %",
  size: "Size",
  color: "Colour",
  authentic: "Authentic — verified by Mooday",
  authenticHelp:
    "Buyers trust authentic items 3× more; we'll spot-check the listing within 30 days.",
  publish: "Publish listing",
  saveDraft: "Save as draft",
  requiredField: "Please complete the required fields.",
  sizePlaceholder: "Select a size",
};

export const LISTING_FORM_COPY_AR: ListingFormCopy = {
  titleEn: "العنوان (إنجليزي)",
  titleAr: "العنوان (عربي)",
  category: "الفئة",
  condition: "الحالة",
  description: "الوصف",
  descriptionEn: "الوصف (إنجليزي)",
  descriptionAr: "الوصف (عربي)",
  photos: "الصور",
  price: "السعر (AED)",
  originalPrice: "سعر التجزئة (لحساب الخصم)",
  discount: "الخصم %",
  size: "المقاس",
  color: "اللون",
  authentic: "أصلي — معتمد من مودي",
  authenticHelp:
    "المشترون يثقون بالمنتجات الأصلية 3 أضعاف؛ سنتحقق خلال 30 يوماً.",
  publish: "نشر المنتج",
  saveDraft: "حفظ كمسودة",
  requiredField: "يرجى إكمال الحقول المطلوبة.",
  sizePlaceholder: "اختر مقاس",
};

interface ListingFormProps {
  isAr: boolean;
  /** Existing values for edit mode. If undefined, form starts empty. */
  initial?: Partial<Product>;
  /** Called with the new product values on submit. */
  onSubmit: (data: Omit<Product, "id" | "saves">) => void;
  /** Called with the new product values on "save as draft". */
  onSaveDraft?: (data: Omit<Product, "id" | "saves">) => void;
  /** Back/cancel. */
  onCancel: () => void;
  /** Inject the current user's profile snapshot to skip the fields that
   * come from the logged-in user in real Phase 3. */
  user: {
    nameEn: string;
    nameAr: string;
    avatar: string;
    typeEn: string;
    typeAr: string;
  };
}

/**
 * A reusable listing form used by both D-19 (Create Listing) and
 * D-21 (Edit Listing). Reads/writes nothing global — owns local form
 * state only. The parent decides what to do with the validated output
 * (call `addListing` for create, `updateListing` for edit, etc.).
 *
 * Validation is intentionally permissive in Phase 1: the user can publish
 * with only the minimal EN/AR title + price + image filled, mirroring the
 * showcase spec.
 */
export const ListingForm: React.FC<ListingFormProps> = ({
  isAr,
  initial,
  onSubmit,
  onSaveDraft,
  onCancel,
  user,
}) => {
  const t = isAr ? LISTING_FORM_COPY_AR : LISTING_FORM_COPY_EN;

  // ---------- form state (initialised from `initial` if editing) ----------
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [descriptionEn, setDescriptionEn] = useState(
    initial?.descriptionEn ?? "",
  );
  const [descriptionAr, setDescriptionAr] = useState(
    initial?.descriptionAr ?? "",
  );
  const [category, setCategory] = useState(initial?.category ?? "Dresses");
  const [condition, setCondition] = useState(
    initial?.conditionEn ?? "New with Tags",
  );
  const [price, setPrice] = useState(
    initial?.price ? String(initial.price) : "",
  );
  const [originalPrice, setOriginalPrice] = useState(
    initial?.originalPrice ? String(initial.originalPrice) : "",
  );
  const [size, setSize] = useState(initial?.size ?? "OS");
  const [colorEn, setColorEn] = useState(initial?.colorEn ?? "");
  const [colorAr, setColorAr] = useState(initial?.colorAr ?? "");
  const [authentic, setAuthentic] = useState(initial?.isAuthentic ?? true);
  const [photos, setPhotos] = useState<string[]>(
    initial?.images ?? [mockImageOptions[0].url],
  );

  // ---------- derived: discount % ----------
  const discountPct = useMemo(() => {
    const p = parseFloat(price);
    const o = parseFloat(originalPrice);
    if (!p || !o || o <= 0 || p >= o) return null;
    return Math.round(((o - p) / o) * 100);
  }, [price, originalPrice]);

  const handleSubmit = (e: React.FormEvent, saveAsDraft: boolean) => {
    e.preventDefault();
    if (!saveAsDraft && (!titleEn || !price)) {
      alert(t.requiredField);
      return;
    }
    const condIdx = CONDITIONS.indexOf(
      condition as (typeof CONDITIONS)[number],
    );
    const data: Omit<Product, "id" | "saves"> = {
      titleEn: titleEn || (isAr ? "منتج جديد" : "New item"),
      titleAr: titleAr || titleEn || "منتج جديد",
      price: parseFloat(price) || 0,
      originalPrice: parseFloat(originalPrice) || parseFloat(price) || 0,
      conditionEn:
        condIdx >= 0
          ? (CONDITIONS[condIdx] as string)
          : (initial?.conditionEn ?? "New with Tags"),
      conditionAr:
        condIdx >= 0
          ? (CONDITIONS_AR[CONDITIONS[condIdx] as string] ?? condition)
          : (initial?.conditionAr ?? condition),
      sellerNameEn: user.nameEn,
      sellerNameAr: user.nameAr,
      sellerAvatar: user.avatar,
      sellerTypeEn: user.typeEn,
      sellerTypeAr: user.typeAr,
      image: photos[0] ?? mockImageOptions[0].url,
      images: photos.length > 0 ? photos : [mockImageOptions[0].url],
      descriptionEn: descriptionEn || titleEn || "",
      descriptionAr: descriptionAr || titleAr || descriptionEn || titleEn || "",
      category,
      isAuthentic: authentic,
      size,
      colorEn: colorEn || undefined,
      colorAr: colorAr || undefined,
      mode: "resell",
    };
    if (saveAsDraft && onSaveDraft) {
      onSaveDraft(data);
    } else {
      onSubmit(data);
    }
  };

  // ---------- handlers ----------
  const addPhoto = () => {
    if (photos.length >= 5) return;
    // Round-robin pick from mock options so the demo has variety.
    const next =
      mockImageOptions[(photos.length * 3 + 1) % mockImageOptions.length].url;
    setPhotos([...photos, next]);
  };
  const removePhoto = (idx: number) => {
    if (photos.length <= 1) return;
    setPhotos(photos.filter((_, i) => i !== idx));
  };
  const pickPhoto = (url: string, idx: number) => {
    const next = [...photos];
    next[idx] = url;
    setPhotos(next);
  };

  return (
    <form
      onSubmit={(e) => handleSubmit(e, false)}
      className="flex flex-col gap-md font-sans"
    >
      {/* Photos */}
      <fieldset className="flex flex-col gap-sm">
        <legend className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
          {t.photos}{" "}
          <span className="text-outline font-sans">({photos.length}/5)</span>
        </legend>
        <div className="flex gap-sm flex-wrap">
          {photos.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-surface-container-high"
            >
              <img
                alt={`Photo ${idx + 1}`}
                src={url}
                className="w-full h-full object-cover"
              />
              {idx === 0 && (
                <span className="absolute top-1 start-1 text-[8px] uppercase tracking-wider bg-primary text-on-primary px-1.5 py-0.5 rounded font-bold">
                  {isAr ? "رئيسية" : "Cover"}
                </span>
              )}
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  aria-label={
                    isAr ? `حذف الصورة ${idx + 1}` : `Remove photo ${idx + 1}`
                  }
                  className="absolute top-1 end-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {photos.length < 5 && (
            <button
              type="button"
              onClick={addPhoto}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-1 text-outline hover:border-primary hover:text-primary transition-colors"
            >
              <span
                className="material-symbols-outlined text-[24px] no-mirror"
                aria-hidden="true"
              >
                add_a_photo
              </span>
              <span className="text-[10px] uppercase tracking-wider">
                {isAr ? "إضافة" : "Add"}
              </span>
            </button>
          )}
        </div>
        {/* Mock picker for non-active slots */}
        {photos.length < 5 && (
          <select
            onChange={(e) => {
              if (photos.length === 0) return;
              pickPhoto(e.target.value, photos.length - 1);
            }}
            className="text-label-sm p-2 bg-surface border border-outline-variant rounded-lg"
            value=""
            aria-label={isAr ? "تغيير آخر صورة" : "Swap last photo"}
          >
            <option value="">
              {isAr ? "أو اختر من المكتبة..." : "Or pick from library..."}
            </option>
            {mockImageOptions.map((opt, i) => (
              <option key={`${opt.url}-${i}`} value={opt.url}>
                {opt.name}
              </option>
            ))}
          </select>
        )}
      </fieldset>

      {/* Title */}
      <div className="flex flex-col gap-xs">
        <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
          {t.titleEn}
        </label>
        <input
          type="text"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
        />
      </div>
      <div className="flex flex-col gap-xs">
        <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
          {t.titleAr}
        </label>
        <input
          dir="rtl"
          type="text"
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
          className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
        />
      </div>

      {/* Category + Condition */}
      <div className="grid grid-cols-2 gap-md">
        <div className="flex flex-col gap-xs">
          <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
            {t.category}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
          >
            {SELL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {isAr ? CATEGORIES_AR[c] : c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
            {t.condition}
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
          >
            {CONDITIONS.filter((c) => c !== "All").map((c) => (
              <option key={c} value={c}>
                {isAr ? CONDITIONS_AR[c] : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-xs">
        <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
          {t.descriptionEn}
        </label>
        <textarea
          rows={3}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
        />
      </div>
      <div className="flex flex-col gap-xs">
        <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
          {t.descriptionAr}
        </label>
        <textarea
          dir="rtl"
          rows={2}
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
        />
      </div>

      {/* Size + Colour */}
      <div className="grid grid-cols-2 gap-md">
        <div className="flex flex-col gap-xs">
          <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
            {t.size}
          </label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
            {t.color}
          </label>
          <select
            value={colorEn}
            onChange={(e) => {
              setColorEn(e.target.value);
              // Auto-fill AR via lookup.
              const foundEntry = findColour(e.target.value);
              if (foundEntry) setColorAr(foundEntry.ar);
            }}
            className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
          >
            <option value="">{isAr ? "—" : "—"}</option>
            {COLOURS.map((c) => (
              <option key={c.key} value={c.key}>
                {isAr ? c.ar : c.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price + Retail */}
      <div className="grid grid-cols-2 gap-md">
        <div className="flex flex-col gap-xs">
          <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
            {t.price}
          </label>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
            {t.originalPrice}
          </label>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
          />
        </div>
      </div>
      {discountPct !== null && (
        <p className="text-label-sm text-primary font-bold">
          {t.discount}: {discountPct}%{" "}
          <span className="text-outline font-sans">
            ({isAr ? "وفّر" : "Save"}{" "}
            {formatAEDLabel(parseFloat(originalPrice) - parseFloat(price))})
          </span>
        </p>
      )}

      {/* Authentic */}
      <label className="flex items-start gap-sm cursor-pointer p-sm rounded-lg bg-surface-container-low border border-surface-container-high">
        <input
          type="checkbox"
          checked={authentic}
          onChange={(e) => setAuthentic(e.target.checked)}
          className="accent-primary w-4 h-4 mt-1"
        />
        <span className="flex-grow">
          <span className="block text-label-md font-bold text-on-surface">
            {t.authentic}
          </span>
          <span className="block text-[11px] text-on-surface-variant leading-normal mt-1">
            {t.authenticHelp}
          </span>
        </span>
      </label>

      {/* CTAs */}
      <div className="flex gap-sm mt-2">
        {onSaveDraft && (
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="flex-1 py-3 rounded-xl border-2 border-primary text-primary text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
          >
            {t.saveDraft}
          </button>
        )}
        <button
          type="submit"
          className="flex-1 btn-primary py-3 rounded-xl text-label-sm uppercase tracking-widest font-bold shadow-md active:scale-95 transition-transform"
        >
          {t.publish}
        </button>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider self-center active:scale-95 transition-transform"
      >
        {isAr ? "إلغاء" : "Cancel"}
      </button>
    </form>
  );
};

/** Helper: stable lookup for COLOURS — ensures the swatch UI can map. */
export function hexForColor(nameEn: string | undefined): string | undefined {
  if (!nameEn) return undefined;
  return findColour(nameEn)?.hex;
}
