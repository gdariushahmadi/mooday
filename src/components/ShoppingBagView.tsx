"use client";

import React, { useEffect, useState } from "react";
import { useApp, type Product } from "@/context/AppContext";

const SAVED_FOR_LATER_KEY = "mooday_saved_for_later";

interface ShoppingBagViewProps {
  onBack: () => void;
  onCheckout: () => void;
}

export const ShoppingBagView: React.FC<ShoppingBagViewProps> = ({
  onBack,
  onCheckout,
}) => {
  const { language, cart, addToCart, removeFromCart, updateQuantity } = useApp();
  const isAr = language === "ar";
  const [savedForLater, setSavedForLater] = useState<Product[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_FOR_LATER_KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(SAVED_FOR_LATER_KEY, JSON.stringify(savedForLater));
  }, [savedForLater]);

  const saveForLater = (product: Product) => {
    setSavedForLater((current) =>
      current.some((item) => item.id === product.id)
        ? current
        : [...current, product],
    );
    removeFromCart(product.id);
  };

  const moveToBag = (product: Product) => {
    addToCart(product);
    setSavedForLater((current) =>
      current.filter((item) => item.id !== product.id),
    );
  };

  const totalOriginal = cart.reduce(
    (sum, item) => sum + item.product.originalPrice * item.quantity,
    0,
  );
  const totalDiscounted = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const discount = totalOriginal - totalDiscounted;
  const shipping = totalDiscounted > 1000 || totalDiscounted === 0 ? 0 : 25; // Free shipping over 1000 AED
  const finalTotal = totalDiscounted + shipping;

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-lg pb-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          onClick={onBack}
          aria-label={isAr ? "رجوع" : "Back"}
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
        </button>
        <div className="font-serif text-headline-sm text-primary tracking-widest uppercase text-center flex-grow">
          {isAr ? "حقيبة التسوق" : "Shopping Bag"}
        </div>
        <div className="w-10"></div>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline opacity-40"
            aria-hidden="true"
          >
            shopping_bag
          </span>
          <p className="text-body-lg text-on-surface-variant">
            {isAr
              ? "حقيبتك فارغة حالياً."
              : "Your shopping bag is currently empty."}
          </p>
          <button
            onClick={onBack}
            className="btn-primary px-8 py-3 rounded-full text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform"
          >
            {isAr ? "تصفح المنتجات" : "Browse Items"}
          </button>
        </div>
      ) : (
        <main className="flex-grow flex flex-col lg:grid lg:grid-cols-12 gap-lg mt-md">
          {/* Cart Items List */}
          <section className="lg:col-span-8 flex flex-col gap-md">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-surface-container-low rounded-xl border border-surface-container-high p-md flex gap-md relative"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high">
                  <img
                    alt={isAr ? item.product.titleAr : item.product.titleEn}
                    className="w-full h-full object-cover"
                    src={item.product.image}
                  />
                </div>
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-md">
                      <h3 className="font-serif text-label-md sm:text-headline-sm text-on-surface line-clamp-2">
                        {isAr ? item.product.titleAr : item.product.titleEn}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-on-surface-variant hover:text-error transition-colors p-1"
                        aria-label={isAr ? "إزالة" : "Remove"}
                      >
                        <span
                          className="material-symbols-outlined text-[20px]"
                          aria-hidden="true"
                        >
                          delete
                        </span>
                      </button>
                    </div>
                    <span className="inline-block bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-sm text-label-sm text-[10px] uppercase tracking-wider mt-1">
                      {isAr
                        ? item.product.conditionAr
                        : item.product.conditionEn}
                    </span>
                    <button
                      type="button"
                      onClick={() => saveForLater(item.product)}
                      className="block mt-2 text-label-sm font-bold text-primary underline-offset-2 hover:underline"
                    >
                      {isAr ? "حفظ لوقت لاحق" : "Save for later"}
                    </button>
                  </div>

                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center gap-sm">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center"
                        aria-label={isAr ? "تقليل" : "Decrease"}
                      >
                        <span
                          className="material-symbols-outlined text-[16px]"
                          aria-hidden="true"
                        >
                          remove
                        </span>
                      </button>
                      <span className="text-label-sm text-on-surface-variant font-bold min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center"
                        aria-label={isAr ? "زيادة" : "Increase"}
                      >
                        <span
                          className="material-symbols-outlined text-[16px]"
                          aria-hidden="true"
                        >
                          add
                        </span>
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="block text-on-surface-variant line-through text-[12px] opacity-60">
                        AED {item.product.originalPrice}
                      </span>
                      <span className="block font-bold text-primary text-label-md sm:text-headline-sm">
                        AED {item.product.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Checkout Summary Column */}
          <section className="lg:col-span-4 flex flex-col gap-md">
            <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-lg flex flex-col gap-md">
              <h3 className="font-serif text-headline-sm text-on-surface border-b border-surface-container-high pb-3">
                {isAr ? "ملخص الطلب" : "Order Summary"}
              </h3>

              <div className="flex flex-col gap-sm">
                <div className="flex justify-between text-body-md text-on-surface-variant">
                  <span>{isAr ? "المجموع الفرعي:" : "Subtotal:"}</span>
                  <span>AED {totalOriginal}</span>
                </div>
                <div className="flex justify-between text-body-md text-error">
                  <span>{isAr ? "الخصم:" : "Savings:"}</span>
                  <span>-AED {discount}</span>
                </div>
                <div className="flex justify-between text-body-md text-on-surface-variant">
                  <span>{isAr ? "الشحن:" : "Shipping:"}</span>
                  <span>
                    {shipping === 0
                      ? isAr
                        ? "مجاني"
                        : "FREE"
                      : `AED ${shipping}`}
                  </span>
                </div>
              </div>

              <hr className="border-surface-container-high" />

              <div className="flex justify-between text-headline-sm font-bold text-primary">
                <span>{isAr ? "الإجمالي:" : "Total:"}</span>
                <span>AED {finalTotal}</span>
              </div>

              {shipping > 0 && (
                <div className="bg-tertiary-container/10 border border-tertiary-container/20 p-2 rounded-lg text-[11px] text-on-tertiary-container text-center mt-2">
                  {isAr
                    ? "أضف بقيمة AED 1,000 للحصول على شحن مجاني!"
                    : "Add AED 1,000 more to unlock FREE shipping!"}
                </div>
              )}

              <button
                onClick={onCheckout}
                className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile text-center active:scale-[0.98] transition-all mt-4"
              >
                {isAr ? "إتمام الشراء الدفع الآمن" : "Checkout Now"}
              </button>
            </div>
          </section>
        </main>
      )}

      {savedForLater.length > 0 && (
        <section className="flex flex-col gap-sm border-t border-surface-container-high pt-lg">
          <h2 className="font-serif text-headline-sm text-on-surface">
            {isAr ? "محفوظة لوقت لاحق" : "Saved for later"}
          </h2>
          {savedForLater.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-md rounded-xl border border-surface-container-high bg-surface-container-low p-md"
            >
              <img
                src={product.image}
                alt={isAr ? product.titleAr : product.titleEn}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-label-md text-on-surface">
                  {isAr ? product.titleAr : product.titleEn}
                </p>
                <p className="text-label-sm font-bold text-primary">AED {product.price}</p>
              </div>
              <button
                type="button"
                onClick={() => moveToBag(product)}
                className="rounded-full border border-primary px-3 py-2 text-label-sm font-bold text-primary"
              >
                {isAr ? "إلى الحقيبة" : "Move to bag"}
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
