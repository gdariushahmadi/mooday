"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { SELL_CATEGORIES, CATEGORIES_AR } from "@/data/categories";
import { mockImageOptions } from "@/data/mock-images";

interface SellItemViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const SellItemView: React.FC<SellItemViewProps> = ({
  onBack,
  onSuccess,
}) => {
  const { language, addListing } = useApp();
  const isAr = language === "ar";

  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("Dresses");
  const [conditionEn, setConditionEn] = useState("New with Tags");
  const [conditionAr, setConditionAr] = useState("جديد بالملصقات");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setConditionEn(val);
    if (val === "New with Tags") setConditionAr("جديد بالملصقات");
    else if (val === "Excellent Condition") setConditionAr("حالة ممتازة");
    else if (val === "Gently Used") setConditionAr("مستعمل خفيف");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn || !price || !originalPrice || !descriptionEn) {
      alert(isAr ? "يرجى ملء جميع الحقول!" : "Please fill in all fields!");
      return;
    }

    addListing({
      titleEn,
      titleAr: titleAr || titleEn,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice),
      conditionEn,
      conditionAr,
      sellerNameEn: "Fatima AlMansoori",
      sellerNameAr: "فاطمة المنصوري",
      sellerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvXVMd9yf_cKLCM9iTBl0hkMxU8qwGlmR5zem59BMB4KmmPqnBFhlgGAdKm4hXbMRi5WoJABe4HbXGvd5qUOM6ZDdF_v3QXh_J7RBOYPZl9bLKp3s7gEOzyEsENfrnZzBStCslQ15yhaIRsRcqDRAkriyyBE2jAXKQX-5NSo1i0jTR9DtITlHUH9Ygpo__Ov153J2Qo5j1U9G-7y_7dmLZQHKqe7ikbz2dHf0i3lX-pmK23BFOKsRXCXiniZprDQ11X91fLpDsmUBq",
      sellerTypeEn: "Verified Closet",
      sellerTypeAr: "خزانة معتمدة",
      image: mockImageOptions[selectedImageIdx].url,
      images: [mockImageOptions[selectedImageIdx].url],
      descriptionEn,
      descriptionAr: descriptionAr || descriptionEn,
      category,
      isAuthentic: true,
    });

    onSuccess();
  };

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          onClick={onBack}
          aria-label="Back"
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="font-serif text-headline-sm text-primary tracking-widest uppercase text-center flex-grow">
          {isAr ? "عرض قطعة للبيع" : "Sell an Item"}
        </div>
        <div className="w-10"></div>
      </div>

      <main className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-lg mt-md shadow-sm font-sans">
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          
          {/* Mock Image Picker */}
          <div className="flex flex-col gap-xs">
            <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {isAr ? "اختر صورة المنتج *" : "Choose Product Photo *"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm mt-1">
              {mockImageOptions.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 active:scale-95 transition-all ${
                    idx === selectedImageIdx ? "border-primary ring-2 ring-primary/20 scale-100" : "border-outline-variant opacity-70"
                  }`}
                >
                  <img
                    alt={isAr ? opt.nameAr : opt.name}
                    src={opt.url}
                    className="w-full h-full object-cover"
                  />
                  {idx === selectedImageIdx && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[32px]">check_circle</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <hr className="border-surface-container-high my-2" />

          {/* Title Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {isAr ? "اسم القطعة (بالانجليزية) *" : "Item Title (English) *"}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Classic Tan Belt"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {isAr ? "اسم القطعة (بالعربية)" : "Item Title (Arabic)"}
              </label>
              <input
                type="text"
                placeholder="مثال: حزام كلاسيكي بني"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Pricing & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {isAr ? "السعر المقترح (AED) *" : "Mooday Price (AED) *"}
              </label>
              <input
                type="number"
                required
                placeholder="100"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {isAr ? "السعر الأصلي بالتجزئة (AED) *" : "Original Retail Price (AED) *"}
              </label>
              <input
                type="number"
                required
                placeholder="200"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {isAr ? "الفئة *" : "Category *"}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              >
                {SELL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {isAr ? CATEGORIES_AR[cat] : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition selector */}
          <div className="flex flex-col gap-xs">
            <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {isAr ? "حالة القطعة *" : "Condition *"}
            </label>
            <select
              value={conditionEn}
              onChange={handleConditionChange}
              className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
            >
              <option value="New with Tags">{isAr ? "جديد بالملصقات" : "New with Tags"}</option>
              <option value="Excellent Condition">{isAr ? "حالة ممتازة" : "Excellent Condition"}</option>
              <option value="Gently Used">{isAr ? "مستعمل خفيف" : "Gently Used"}</option>
            </select>
          </div>

          {/* Description Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {isAr ? "الوصف بالانجليزية *" : "Description (English) *"}
              </label>
              <textarea
                required
                rows={3}
                placeholder="Enter description in English"
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {isAr ? "الوصف بالعربية" : "Description (Arabic)"}
              </label>
              <textarea
                rows={3}
                placeholder="أدخل وصف القطعة باللغة العربية"
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile text-center active:scale-95 transition-transform mt-4"
          >
            {isAr ? "اضف إلى المعرض" : "Publish Listing"}
          </button>
        </form>
      </main>
    </div>
  );
};
