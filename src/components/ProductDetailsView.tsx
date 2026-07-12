"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useApp, Product } from "@/context/AppContext";
import { SELLERS } from "@/data/sellers";
import { CATEGORIES_AR } from "@/data/categories";
import { deriveSubCategory } from "@/data/sub-categories";
import { formatAED } from "@/lib/format";

interface ProductDetailsViewProps {
  product: Product;
  onBack: () => void;
  onNavigateToCart: () => void;
  onStartChat: (product: Product) => void;
  onCheckoutProduct: (product: Product) => void;
  /**
   * Optional handler invoked when the user taps the seller card.
   * Receives the seller key (e.g. "sarah"). When omitted, the seller
   * info is not clickable.
   */
  onOpenSeller?: (sellerKey: string) => void;
  /**
   * Optional handler invoked when the user taps "Report this listing"
   * in the overflow menu. The actual report modal ships in H-41.
   */
  onReportListing?: (productId: string) => void;
}

interface ProductDetailsCopy {
  back: string;
  overflow: string;
  report: string;
  home: string;
  retail: string;
  mooday: string;
  saveOff: (orig: number, price: number) => string;
  description: string;
  size: string;
  shippingTitle: string;
  shipsWithin: string;
  freeShip: string;
  returnsAccepted: string;
  buyNow: string;
  addToBag: string;
  addedAlert: string;
  viewBag: string;
  zoomClose: string;
  prev: string;
  next: string;
  oneSize: string;
}

const COPY: Record<"en" | "ar", ProductDetailsCopy> = {
  en: {
    back: "Back",
    overflow: "More actions",
    report: "Report this listing",
    home: "Home",
    retail: "Retail Price:",
    mooday: "Mooday Price:",
    saveOff: (orig: number, price: number) => {
      const pct = Math.round(((orig - price) / orig) * 100);
      return `${pct}% off`;
    },
    description: "Description",
    size: "Size",
    shippingTitle: "Shipping & Returns",
    shipsWithin: "Ships within 24h from Dubai, UAE",
    freeShip: "Free shipping on orders over AED 1,000",
    returnsAccepted: "Returns accepted within 7 days of delivery",
    buyNow: "Buy Now (Escrow Pay)",
    addToBag: "Add to Shopping Bag",
    addedAlert: "Product successfully added to your shopping bag!",
    viewBag: "View Bag",
    zoomClose: "Close zoom",
    prev: "Previous image",
    next: "Next image",
    oneSize: "One size",
  },
  ar: {
    back: "رجوع",
    overflow: "إجراءات إضافية",
    report: "إبلاغ عن هذه القطعة",
    home: "الرئيسية",
    retail: "سعر التجزئة الأصلي:",
    mooday: "سعر مودي:",
    saveOff: (orig: number, price: number) => {
      const pct = Math.round(((orig - price) / orig) * 100);
      return `${pct}٪ خصم`;
    },
    description: "الوصف",
    size: "المقاس",
    shippingTitle: "الشحن والإرجاع",
    shipsWithin: "يُشحن خلال ٢٤ ساعة من دبي، الإمارات",
    freeShip: "شحن مجاني للطلبات فوق ١٠٠٠ درهم",
    returnsAccepted: "يمكن الإرجاع خلال ٧ أيام من الاستلام",
    buyNow: "اشترِ الآن (دفع آمن)",
    addToBag: "إضافة إلى حقيبة التسوق",
    addedAlert: "تمت إضافة المنتج إلى حقيبة التسوق بنجاح!",
    viewBag: "عرض الحقيبة",
    zoomClose: "إغلاق التكبير",
    prev: "الصورة السابقة",
    next: "الصورة التالية",
    oneSize: "مقاس واحد",
  },
} as const;

export const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  product,
  onBack,
  onNavigateToCart,
  onStartChat,
  onCheckoutProduct,
  onOpenSeller,
  onReportListing,
}) => {
  const { language, toggleLike, likes, addToCart } = useApp();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [addedAlert, setAddedAlert] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);

  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;
  const isLiked = likes.includes(product.id);
  const productTitle = isAr ? product.titleAr : product.titleEn;

  // Sub-category for the breadcrumb.
  const subCategory = deriveSubCategory(
    product.category,
    product.titleEn,
    language,
  );
  const topCategory = isAr
    ? (CATEGORIES_AR[product.category] ?? product.category)
    : product.category;

  // Show size row only when the product carries a non-"OS" size.
  const showSizeRow = !!product.size && product.size !== "OS";

  const handleAddToCart = () => {
    addToCart(product);
    setAddedAlert(true);
    setTimeout(() => setAddedAlert(false), 2500);
  };

  // Close the overflow menu on outside click / Esc.
  useEffect(() => {
    if (!showOverflow) return;
    const onClick = () => setShowOverflow(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowOverflow(false);
    };
    // Defer one tick so the click that opened the menu doesn't close it.
    const id = window.setTimeout(() => {
      document.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showOverflow]);

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-lg pb-10">
      {/* Header: back · title · overflow menu */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4 gap-md">
        <button
          onClick={onBack}
          aria-label={t.back}
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
        </button>
        <div className="font-serif text-headline-sm text-primary tracking-widest uppercase text-center flex-grow">
          {isAr ? "تفاصيل المنتج" : "Product Details"}
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOverflow((v) => !v);
            }}
            aria-label={t.overflow}
            aria-haspopup="menu"
            aria-expanded={showOverflow}
            className="text-on-surface hover:bg-surface-container-low rounded-full p-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              more_horiz
            </span>
          </button>
          {showOverflow && (
            <div
              role="menu"
              className="absolute end-0 mt-1 w-max bg-surface border border-surface-container-high rounded-lg shadow-lg overflow-hidden z-20"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setShowOverflow(false);
                  onReportListing?.(product.id);
                }}
                disabled={!onReportListing}
                className="block w-full text-start px-md py-sm text-label-sm text-error hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-sm">
                  <span
                    className="material-symbols-outlined text-[18px]"
                    aria-hidden="true"
                  >
                    flag
                  </span>
                  {t.report}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <nav
        aria-label="breadcrumb"
        className="text-label-sm text-on-surface-variant"
      >
        <ol className="flex items-center gap-xs flex-wrap">
          <li>
            <span className="text-on-surface-variant">{t.home}</span>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <span className="text-on-surface">{topCategory}</span>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page">
            <span className="text-primary font-bold">{subCategory}</span>
          </li>
        </ol>
      </nav>

      {addedAlert && (
        <div
          className="bg-primary-fixed text-on-primary-fixed px-4 py-3 rounded-lg flex items-center justify-between shadow-md transition-all duration-300 animate-pulse"
          role="status"
        >
          <span>{t.addedAlert}</span>
          <button
            onClick={onNavigateToCart}
            className="underline font-bold text-label-sm uppercase tracking-wider"
          >
            {t.viewBag}
          </button>
        </div>
      )}

      <main className="flex-grow flex flex-col md:grid md:grid-cols-12 gap-lg mt-md">
        {/* Left Column: Image Gallery */}
        <section className="md:col-span-7 flex flex-col gap-sm">
          <button
            type="button"
            onClick={() => setShowZoom(true)}
            aria-label={isAr ? `تكبير ${productTitle}` : `Zoom ${productTitle}`}
            className="relative w-full aspect-[4/5] bg-surface-container-low rounded-xl overflow-hidden shadow-lg cursor-zoom-in block"
          >
            <img
              alt={productTitle}
              className="w-full h-full object-cover transition-all duration-500"
              src={product.images[activeImageIdx] || product.image}
              loading="eager"
            />
            {product.isAuthentic && (
              <div className="absolute top-4 left-4 bg-primary text-on-primary font-bold text-label-md px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 backdrop-blur-sm bg-opacity-90">
                <span
                  className="material-symbols-outlined text-[18px]"
                  aria-hidden="true"
                >
                  verified
                </span>
                <span className="uppercase tracking-wider">
                  {isAr ? "أصلي" : "Authentic"}
                </span>
              </div>
            )}
            {/* Zoom affordance */}
            <div className="absolute bottom-3 end-3 bg-white/70 backdrop-blur-md text-on-surface px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
              <span
                className="material-symbols-outlined text-[14px]"
                aria-hidden="true"
              >
                zoom_in
              </span>
              {isAr ? "تكبير" : "Zoom"}
            </div>
          </button>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-sm overflow-x-auto no-scrollbar py-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={isAr ? `صورة ${idx + 1}` : `Image ${idx + 1}`}
                  aria-pressed={idx === activeImageIdx}
                  className={`w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    idx === activeImageIdx
                      ? "border-primary ring-offset-2 ring-1 ring-primary/20"
                      : "border-outline-variant grayscale-[0.5] hover:grayscale-0"
                  }`}
                >
                  <img
                    alt=""
                    className="w-full h-full object-cover"
                    src={img}
                    loading="lazy"
                  />
                </button>
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
                {productTitle}
              </h1>
              <button
                onClick={() => toggleLike(product.id)}
                aria-label={
                  isLiked
                    ? isAr
                      ? "إزالة من المفضلة"
                      : "Remove from saved"
                    : isAr
                      ? "حفظ"
                      : "Save"
                }
                aria-pressed={isLiked}
                className={`text-outline hover:text-primary transition-colors p-2 rounded-full ${
                  isLiked ? "text-primary" : ""
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  style={{ fontVariationSettings: `'FILL' ${isLiked ? 1 : 0}` }}
                >
                  favorite
                </span>
              </button>
            </div>

            <div className="flex flex-col gap-xs mt-2">
              <div className="flex items-baseline gap-sm text-outline">
                <span className="text-label-md uppercase tracking-widest">
                  {t.retail}
                </span>
                <span className="text-body-lg price-strikethrough">
                  AED {formatAED(product.originalPrice)}
                </span>
                <span className="text-[11px] text-error font-bold uppercase tracking-wider ml-auto">
                  {t.saveOff(product.originalPrice, product.price)}
                </span>
              </div>
              <div className="flex items-baseline gap-sm text-primary">
                <span className="text-label-md uppercase tracking-widest font-bold">
                  {t.mooday}
                </span>
                <span className="text-headline-md font-bold">
                  AED {formatAED(product.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Size row (read-only — the listing is one size) */}
          {showSizeRow && (
            <div className="flex items-center gap-sm">
              <span className="text-label-sm uppercase tracking-widest text-on-surface-variant font-bold">
                {t.size}:
              </span>
              <span className="px-3 py-1 rounded-full border-2 border-primary text-primary font-bold text-label-sm">
                {product.size}
              </span>
            </div>
          )}

          <hr className="border-surface-container-high" />

          {/* Description */}
          <div className="flex flex-col gap-sm">
            <h3 className="text-label-md uppercase tracking-widest text-on-surface-variant font-bold">
              {t.description}
            </h3>
            <p className="text-body-lg text-on-surface/90 leading-relaxed font-sans">
              {isAr ? product.descriptionAr : product.descriptionEn}
            </p>
          </div>

          {/* Shipping & Returns — collapsible */}
          <div className="bg-surface-container-low rounded-xl border border-surface-container-high">
            <button
              onClick={() => setShowShipping((v) => !v)}
              aria-expanded={showShipping}
              className="w-full flex items-center justify-between p-md text-label-md uppercase tracking-widest text-on-surface-variant font-bold hover:bg-surface-container-high/40 rounded-xl transition-colors"
            >
              <span className="flex items-center gap-sm">
                <span
                  className="material-symbols-outlined text-[20px] text-primary"
                  aria-hidden="true"
                >
                  local_shipping
                </span>
                {t.shippingTitle}
              </span>
              <span
                className="material-symbols-outlined text-[20px] transition-transform"
                style={{ transform: showShipping ? "rotate(180deg)" : "none" }}
                aria-hidden="true"
              >
                expand_more
              </span>
            </button>
            {showShipping && (
              <div className="px-md pb-md flex flex-col gap-sm font-sans">
                <p className="text-body-md text-on-surface flex items-start gap-sm">
                  <span
                    className="material-symbols-outlined text-[18px] text-primary mt-0.5"
                    aria-hidden="true"
                  >
                    bolt
                  </span>
                  {t.shipsWithin}
                </p>
                <p className="text-body-md text-on-surface flex items-start gap-sm">
                  <span
                    className="material-symbols-outlined text-[18px] text-primary mt-0.5"
                    aria-hidden="true"
                  >
                    redeem
                  </span>
                  {t.freeShip}
                </p>
                <p className="text-body-md text-on-surface flex items-start gap-sm">
                  <span
                    className="material-symbols-outlined text-[18px] text-primary mt-0.5"
                    aria-hidden="true"
                  >
                    undo
                  </span>
                  {t.returnsAccepted}
                </p>
              </div>
            )}
          </div>

          {/* Seller Profile Card */}
          <SellerCard
            product={product}
            isAr={isAr}
            onStartChat={() => onStartChat(product)}
            onOpenSeller={onOpenSeller}
          />

          {/* CTA */}
          <div className="flex flex-col gap-sm mt-4">
            <button
              onClick={() => onCheckoutProduct(product)}
              className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile text-center active:scale-[0.98] transition-transform"
            >
              {t.buyNow}
            </button>
            <button
              onClick={handleAddToCart}
              className="w-full py-4 border-2 border-primary text-primary hover:bg-primary/5 active:scale-[0.98] transition-all rounded-xl text-label-md uppercase tracking-widest font-bold text-center"
            >
              {t.addToBag}
            </button>
          </div>
        </section>
      </main>

      {/* Zoom modal */}
      {showZoom && (
        <ImageZoomModal
          images={product.images.length ? product.images : [product.image]}
          alt={productTitle}
          startIndex={activeImageIdx}
          onClose={() => setShowZoom(false)}
          onIndexChange={setActiveImageIdx}
          t={t}
        />
      )}
    </div>
  );
};

// ---------- Sub-components ----------

const ImageZoomModal: React.FC<{
  images: string[];
  alt: string;
  startIndex: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  t: { zoomClose: string; prev: string; next: string };
}> = ({ images, alt, startIndex, onClose, onIndexChange, t }) => {
  const [idx, setIdx] = useState(startIndex);

  const goPrev = useCallback(() => {
    setIdx((i) => {
      const next = (i - 1 + images.length) % images.length;
      onIndexChange(next);
      return next;
    });
  }, [images.length, onIndexChange]);

  const goNext = useCallback(() => {
    setIdx((i) => {
      const next = (i + 1) % images.length;
      onIndexChange(next);
      return next;
    });
  }, [images.length, onIndexChange]);

  // Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label={t.zoomClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          close
        </span>
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label={t.prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            chevron_left
          </span>
        </button>
      )}

      <img
        src={images[idx]}
        alt={alt}
        className="max-w-[92vw] max-h-[88vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label={t.next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            chevron_right
          </span>
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-label-sm font-bold">
          {idx + 1} / {images.length}
        </span>
      )}
    </div>
  );
};

/**
 * Inline seller card. Clicking the seller info opens the public
 * profile (when `onOpenSeller` is provided). The Chat button is
 * always wired to `onStartChat`.
 */
function SellerCard({
  product,
  isAr,
  onStartChat,
  onOpenSeller,
}: {
  product: Product;
  isAr: boolean;
  onStartChat: () => void;
  onOpenSeller?: (sellerKey: string) => void;
}) {
  const sellerKey = Object.keys(SELLERS).find(
    (k) => SELLERS[k].nameEn === product.sellerNameEn,
  );

  const sellerInfo = (
    <div className="flex items-center gap-3 min-w-0">
      <img
        alt={isAr ? product.sellerNameAr : product.sellerNameEn}
        className="w-12 h-12 rounded-full object-cover border-2 border-primary-fixed-dim"
        src={product.sellerAvatar}
        loading="lazy"
      />
      <div className="min-w-0">
        <h4 className="text-label-md text-on-surface font-bold truncate">
          {isAr ? product.sellerNameAr : product.sellerNameEn}
        </h4>
        <p className="text-label-sm text-on-surface-variant truncate">
          {isAr ? product.sellerTypeAr : product.sellerTypeEn}
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-surface-container-low p-md rounded-xl border border-surface-container-high flex items-center justify-between gap-md">
      {onOpenSeller && sellerKey ? (
        <button
          onClick={() => onOpenSeller(sellerKey)}
          aria-label={
            isAr
              ? `عرض ملف ${product.sellerNameAr}`
              : `View ${product.sellerNameEn}'s profile`
          }
          className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-lg p-1 -m-1 hover:bg-surface-container-high transition-colors active:scale-[0.98]"
        >
          {sellerInfo}
        </button>
      ) : (
        <div className="flex-1 min-w-0">{sellerInfo}</div>
      )}

      <button
        onClick={onStartChat}
        className="text-primary hover:bg-primary-fixed/20 active:scale-95 transition-all text-label-sm border border-primary px-4 py-2 rounded-full font-bold flex items-center gap-1.5 flex-shrink-0"
      >
        <span
          className="material-symbols-outlined text-[18px]"
          aria-hidden="true"
        >
          chat
        </span>
        {isAr ? "تحدث مع البائع" : "Chat with Seller"}
      </button>
    </div>
  );
}
