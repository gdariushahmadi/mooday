import React from "react";
import type { CartItem } from "@/context/AppContext";
import { formatAEDLabel } from "@/lib/format";
import type { CheckoutCopy } from "./types";

export const CheckoutOrderReview: React.FC<{
  t: CheckoutCopy;
  isAr: boolean;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}> = ({ t, isAr, items, subtotal, shipping, total }) => (
  <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex flex-col gap-md font-sans">
    <h3 className="font-serif text-headline-sm text-on-surface border-b border-surface-container-high pb-2">
      {t.orderReview}
    </h3>
    <div className="flex flex-col gap-sm max-h-[300px] overflow-y-auto no-scrollbar">
      {items.map((item) => (
        <div
          key={item.product.id}
          className="flex gap-sm border-b border-surface-container-high pb-sm last:border-b-0 last:pb-0"
        >
          <img
            alt={isAr ? item.product.titleAr : item.product.titleEn}
            src={item.product.image}
            className="w-12 h-12 rounded object-cover border border-outline-variant flex-shrink-0"
          />
          <div className="flex-grow">
            <h5 className="font-serif text-label-sm text-on-surface line-clamp-1">
              {isAr ? item.product.titleAr : item.product.titleEn}
            </h5>
            <span className="text-[11px] text-outline">
              {t.qty(item.quantity)}
            </span>
          </div>
          <span className="text-label-sm font-bold text-primary self-center">
            {formatAEDLabel(item.product.price * item.quantity)}
          </span>
        </div>
      ))}
    </div>
    <hr className="border-surface-container-high" />
    <div className="flex flex-col gap-xs text-[13px] text-on-surface-variant">
      <div className="flex justify-between">
        <span>{t.subtotal}:</span>
        <span>{formatAEDLabel(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>{t.shipping}:</span>
        <span>
          {shipping === 0 ? t.shippingFree : formatAEDLabel(shipping)}
        </span>
      </div>
    </div>
    <hr className="border-surface-container-high" />
    <div className="flex justify-between text-label-md font-bold text-primary">
      <span>{t.total}:</span>
      <span>{formatAEDLabel(total)}</span>
    </div>
  </div>
);
