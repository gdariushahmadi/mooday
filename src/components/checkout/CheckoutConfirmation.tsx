import React from "react";
import type { CheckoutCopy } from "./types";

export const CheckoutConfirmation: React.FC<{
  total: number;
  isAr: boolean;
  onHome: () => void;
  t: CheckoutCopy;
}> = ({ total, isAr, onHome, t }) => (
  <div className="w-full max-w-[600px] mx-auto bg-surface-container-lowest border border-surface-container-high rounded-xl p-xl flex flex-col items-center text-center gap-lg my-10 shadow-lg">
    <span
      className="material-symbols-outlined text-[72px] text-primary animate-bounce"
      aria-hidden="true"
    >
      check_circle
    </span>
    <div>
      <h2 className="font-serif text-headline-md text-primary mb-2">
        {t.orderPlaced}
      </h2>
      <p className="text-body-lg text-on-surface-variant font-sans">
        {t.escrowBody}
      </p>
    </div>
    <div className="w-full bg-surface-container-low p-lg rounded-xl flex flex-col gap-md text-left font-sans">
      <h4 className="text-label-md uppercase tracking-wider text-primary font-bold">
        {isAr ? "تتبع الشحنة (مودي إكسبرس)" : "Order Tracking (Mooday Express)"}
      </h4>
      <div className="flex flex-col gap-4 mt-2">
        <TimelineRow
          isAr={isAr}
          done
          titleEn="Payment secured & escrow activated"
          titleAr="تم الدفع وتفعيل الضمان"
          subtitleEn="Just now"
          subtitleAr="الآن"
        />
        <TimelineRow
          isAr={isAr}
          done={false}
          num={2}
          titleEn="Awaiting seller pickup"
          titleAr="بانتظار استلام البائع"
          subtitleEn="Estimated within 24 hours"
          subtitleAr="خلال 24 ساعة"
        />
        <TimelineRow
          isAr={isAr}
          done={false}
          num={3}
          titleEn="In-Transit via Aramex"
          titleAr="في الطريق عبر أرامكس"
          subtitleEn="Estimated 2-3 business days"
          subtitleAr="2-3 أيام عمل"
        />
      </div>
    </div>
    <button
      onClick={onHome}
      className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md active:scale-95 transition-transform"
    >
      {t.backToHome}
    </button>
  </div>
);

export const TimelineRow: React.FC<{
  isAr: boolean;
  done?: boolean;
  num?: number;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
}> = ({ isAr, done, num, titleEn, titleAr, subtitleEn, subtitleAr }) => {
  return (
    <div className="flex gap-md items-start">
      <div className="flex flex-col items-center">
        {done ? (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[12px]">
            ✓
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-outline text-[12px]">
            {num}
          </div>
        )}
        <div
          className={`w-[2px] h-10 ${
            done ? "bg-primary/20" : "bg-surface-container-high"
          }`}
        />
      </div>
      <div>
        <p
          className={`text-label-md font-bold ${
            done ? "text-on-surface" : "text-on-surface-variant"
          }`}
        >
          {isAr ? titleAr : titleEn}
        </p>
        <p className="text-label-sm text-on-surface-variant">
          {isAr ? subtitleAr : subtitleEn}
        </p>
      </div>
    </div>
  );
};
