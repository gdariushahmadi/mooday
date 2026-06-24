"use client";

import React, { useState } from "react";
import { useApp, Product } from "@/context/AppContext";

interface ProductDetailsViewProps {
  product: Product;
  onBack: () => void;
  onNavigateToCart: () => void;
  onStartChat: (product: Product) => void;
  onCheckoutProduct: (product: Product) => void;
}

export const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  product,
  onBack,
  onNavigateToCart,
  onStartChat,
  onCheckoutProduct,
}) => {
  const { language, toggleLike, likes, addToCart } = useApp();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [addedAlert, setAddedAlert] = useState(false);

  const isAr = language === "ar";
  const isLiked = likes.includes(product.id);

  const handleAddToCart = () => {
    addToCart(product);
    setAddedAlert(true);
    setTimeout(() => {
      setAddedAlert(false);
    }, 2500);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-lg pb-10">
      {/* Back & Title Header inside view */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          onClick={onBack}
          aria-label="Back"
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="font-serif text-headline-sm text-primary tracking-widest uppercase text-center flex-grow">
          {isAr ? "تفاصيل المنتج" : "Product Details"}
        </div>
        <div className="w-10"></div>
      </div>

      {addedAlert && (
        <div className="bg-primary-fixed text-on-primary-fixed px-4 py-3 rounded-lg flex items-center justify-between shadow-md transition-all duration-300 animate-pulse">
          <span>
            {isAr
              ? "تمت إضافة المنتج إلى حقيبة التسوق بنجاح!"
              : "Product successfully added to your shopping bag!"}
          </span>
          <button
            onClick={onNavigateToCart}
            className="underline font-bold text-label-sm uppercase tracking-wider"
          >
            {isAr ? "عرض الحقيبة" : "View Bag"}
          </button>
        </div>
      )}

      <main className="flex-grow flex flex-col md:grid md:grid-cols-12 gap-lg mt-md">
        {/* Left Column: Image Gallery */}
        <section className="md:col-span-7 flex flex-col gap-sm">
          <div className="relative w-full aspect-[4/5] bg-surface-container-low rounded-xl overflow-hidden shadow-lg">
            <img
              alt={isAr ? product.titleAr : product.titleEn}
              className="w-full h-full object-cover transition-all duration-500"
              src={product.images[activeImageIdx] || product.image}
            />
            {product.isAuthentic && (
              <div className="absolute top-4 left-4 bg-primary text-on-primary font-bold text-label-md px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 backdrop-blur-sm bg-opacity-90">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span className="uppercase tracking-wider">{isAr ? "أصلي" : "Authentic"}</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-sm overflow-x-auto no-scrollbar py-2">
              {product.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    idx === activeImageIdx
                      ? "border-primary ring-offset-2 ring-1 ring-primary/20"
                      : "border-outline-variant grayscale-[0.5] hover:grayscale-0"
                  }`}
                >
                  <img
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    src={img}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Product Details & Actions */}
        <section className="md:col-span-5 flex flex-col gap-lg">
          {/* Core Info */}
          <div className="flex flex-col gap-md">
            <div className="flex justify-between items-start gap-md">
              <h1 className="text-headline-md md:text-display-lg-mobile text-on-surface leading-tight font-serif">
                {isAr ? product.titleAr : product.titleEn}
              </h1>
              <button
                onClick={() => toggleLike(product.id)}
                aria-label="Save"
                className={`text-outline hover:text-primary transition-colors p-2 rounded-full ${
                  isLiked ? "text-primary" : ""
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: `'FILL' ${isLiked ? 1 : 0}` }}
                >
                  favorite
                </span>
              </button>
            </div>

            <div className="flex flex-col gap-xs mt-2">
              <div className="flex items-baseline gap-sm text-outline">
                <span className="text-label-md uppercase tracking-widest">
                  {isAr ? "سعر التجزئة الأصلي:" : "Retail Price:"}
                </span>
                <span className="text-body-lg price-strikethrough">
                  AED {product.originalPrice}
                </span>
              </div>
              <div className="flex items-baseline gap-sm text-primary">
                <span className="text-label-md uppercase tracking-widest font-bold">
                  {isAr ? "سعر مودي:" : "Mooday Price:"}
                </span>
                <span className="text-headline-md font-bold">AED {product.price}</span>
              </div>
            </div>
          </div>

          <hr className="border-surface-container-high" />

          {/* Description */}
          <div className="flex flex-col gap-sm">
            <h3 className="text-label-md uppercase tracking-widest text-on-surface-variant font-bold">
              {isAr ? "الوصف" : "Description"}
            </h3>
            <p className="text-body-lg text-on-surface/90 leading-relaxed font-sans">
              {isAr ? product.descriptionAr : product.descriptionEn}
            </p>
          </div>

          {/* Seller Profile Card */}
          <div className="bg-surface-container-low p-md rounded-xl border border-surface-container-high flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                alt={isAr ? product.sellerNameAr : product.sellerNameEn}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary-fixed-dim"
                src={product.sellerAvatar}
              />
              <div>
                <h4 className="text-label-md text-on-surface font-bold">
                  {isAr ? product.sellerNameAr : product.sellerNameEn}
                </h4>
                <p className="text-label-sm text-on-surface-variant">
                  {isAr ? product.sellerTypeAr : product.sellerTypeEn}
                </p>
              </div>
            </div>
            <button
              onClick={() => onStartChat(product)}
              className="text-primary hover:bg-primary-fixed/20 active:scale-95 transition-all text-label-sm border border-primary px-4 py-2 rounded-full font-bold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              {isAr ? "تحدث مع البائع" : "Chat with Seller"}
            </button>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col gap-sm mt-4">
            <button
              onClick={() => onCheckoutProduct(product)}
              className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile text-center active:scale-[0.98] transition-transform"
            >
              {isAr ? "اشترِ الآن (دفع آمن)" : "Buy Now (Escrow Pay)"}
            </button>
            <button
              onClick={handleAddToCart}
              className="w-full py-4 border-2 border-primary text-primary hover:bg-primary/5 active:scale-[0.98] transition-all rounded-xl text-label-md uppercase tracking-widest font-bold text-center"
            >
              {isAr ? "إضافة إلى حقيبة التسوق" : "Add to Shopping Bag"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
