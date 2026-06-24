"use client";

import React, { useState } from "react";
import { useApp, Product } from "@/context/AppContext";

interface CheckoutFlowViewProps {
  checkoutProduct?: Product | null; // Direct checkout from Product Details
  onBack: () => void;
  onSuccess: () => void;
}

export const CheckoutFlowView: React.FC<CheckoutFlowViewProps> = ({
  checkoutProduct,
  onBack,
  onSuccess,
}) => {
  const { language, cart, clearCart } = useApp();
  const isAr = language === "ar";
  
  const [step, setStep] = useState<1 | 2>(1); // 1: Shipping/Address, 2: Payment
  const [paymentMethod, setPaymentMethod] = useState<"card" | "apple">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Address fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Dubai");
  const [address, setAddress] = useState("");

  const items = checkoutProduct ? [{ product: checkoutProduct, quantity: 1 }] : cart;
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 25;
  const total = subtotal + shipping;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !address) {
      alert(isAr ? "يرجى ملء جميع الحقول المطلوبة!" : "Please fill in all required fields!");
      return;
    }
    setStep(2);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate escrow payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
      if (!checkoutProduct) {
        clearCart(); // clear main cart if normal checkout
      }
    }, 2000);
  };

  if (isDone) {
    return (
      <div className="w-full max-w-[600px] mx-auto bg-surface-container-lowest border border-surface-container-high rounded-xl p-xl flex flex-col items-center text-center gap-lg my-10 shadow-lg">
        <span className="material-symbols-outlined text-[72px] text-primary animate-bounce">
          check_circle
        </span>
        
        <div>
          <h2 className="font-serif text-headline-md text-primary mb-2">
            {isAr ? "تم تسجيل طلبك بنجاح!" : "Order Placed Successfully!"}
          </h2>
          <p className="text-body-lg text-on-surface-variant font-sans">
            {isAr 
              ? "لقد تم خصم المبلغ بنجاح وحفظه في حساب مودي الآمن (الضمان). لن يتم تسليم المبلغ للبائع إلا بعد تأكيد استلامك للمنتج ومطابقته للوصف."
              : "Your payment has been successfully secured in Mooday's Escrow vault. Funds will only be released to the seller after you receive the item and confirm it matches the description."}
          </p>
        </div>

        {/* Mock Tracking Timeline */}
        <div className="w-full bg-surface-container-low p-lg rounded-xl flex flex-col gap-md text-left font-sans">
          <h4 className="text-label-md uppercase tracking-wider text-primary font-bold">
            {isAr ? "تتبع الشحنة (مودي اكسبريس)" : "Order Tracking (Mooday Express)"}
          </h4>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-md items-start">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[12px]">✓</div>
                <div className="w-[2px] h-10 bg-primary/20"></div>
              </div>
              <div>
                <p className="text-label-md font-bold text-on-surface">{isAr ? "تم الدفع وتأكيد الطلب" : "Payment Secured & Escrow Activated"}</p>
                <p className="text-label-sm text-on-surface-variant">Just now</p>
              </div>
            </div>

            <div className="flex gap-md items-start">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-outline text-[12px]">2</div>
                <div className="w-[2px] h-10 bg-surface-container-high"></div>
              </div>
              <div>
                <p className="text-label-md font-bold text-on-surface-variant">{isAr ? "جاري استلام الطرد من البائع" : "Awaiting Seller Pickup"}</p>
                <p className="text-label-sm text-on-surface-variant">Estimated within 24 hours</p>
              </div>
            </div>

            <div className="flex gap-md items-start">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-outline text-[12px]">3</div>
              </div>
              <div>
                <p className="text-label-md font-bold text-on-surface-variant">{isAr ? "التوصيل عبر آرامكس" : "In-Transit via Aramex"}</p>
                <p className="text-label-sm text-on-surface-variant">Estimated 2-3 business days</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onSuccess}
          className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md active:scale-95 transition-transform"
        >
          {isAr ? "العودة للرئيسية" : "Back to Home Feed"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          onClick={() => (step === 2 ? setStep(1) : onBack())}
          aria-label="Back"
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="font-serif text-headline-sm text-primary tracking-widest uppercase text-center flex-grow">
          {isAr ? "إتمام عملية الشراء" : "Checkout Flow"}
        </div>
        <div className="w-10"></div>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-gutter my-2 font-sans">
        <div className="flex items-center gap-sm">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-bold ${
            step >= 1 ? "bg-primary text-on-primary" : "bg-surface-container-high text-outline"
          }`}>
            1
          </div>
          <span className={`text-label-sm uppercase tracking-wider ${step >= 1 ? "text-primary font-bold" : "text-outline"}`}>
            {isAr ? "العنوان" : "Shipping"}
          </span>
        </div>
        <div className="w-12 h-[2px] bg-outline-variant"></div>
        <div className="flex items-center gap-sm">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-bold ${
            step === 2 ? "bg-primary text-on-primary" : "bg-surface-container-high text-outline"
          }`}>
            2
          </div>
          <span className={`text-label-sm uppercase tracking-wider ${step === 2 ? "text-primary font-bold" : "text-outline"}`}>
            {isAr ? "الدفع والضمان" : "Escrow Payment"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg mt-md">
        {/* Forms side */}
        <div className="md:col-span-7 bg-surface-container-lowest border border-surface-container-high rounded-xl p-lg shadow-sm">
          {step === 1 ? (
            <form onSubmit={handleNextStep} className="flex flex-col gap-md font-sans">
              <h3 className="font-serif text-headline-sm text-on-surface mb-2 border-b border-surface-container-high pb-2">
                {isAr ? "عنوان التوصيل" : "Delivery Address"}
              </h3>
              
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  {isAr ? "الاسم الكامل *" : "Full Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? "ادخل اسمك الكامل" : "Enter your full name"}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  {isAr ? "رقم الهاتف *" : "Phone Number *"}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+971 5X XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  {isAr ? "الإمارة *" : "Emirate *"}
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="Dubai">{isAr ? "دبي" : "Dubai"}</option>
                  <option value="Abu Dhabi">{isAr ? "أبوظبي" : "Abu Dhabi"}</option>
                  <option value="Sharjah">{isAr ? "الشارقة" : "Sharjah"}</option>
                  <option value="Ajman">{isAr ? "عجمان" : "Ajman"}</option>
                  <option value="Ras Al Khaimah">{isAr ? "رأس الخيمة" : "Ras Al Khaimah"}</option>
                  <option value="Fujairah">{isAr ? "الفجيرة" : "Fujairah"}</option>
                  <option value="Umm Al Quwain">{isAr ? "أم القيوين" : "Umm Al Quwain"}</option>
                </select>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  {isAr ? "عنوان الشارع والشقة *" : "Street & Villa/Apartment *" }
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={isAr ? "ادخل تفاصيل العنوان مثل اسم الشارع ورقم المبنى" : "Enter street name, building number, apartment/villa number"}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <button
                type="submit"
                className="btn-primary py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md btn-tactile text-center active:scale-95 transition-transform mt-4"
              >
                {isAr ? "الذهاب للدفع" : "Proceed to Payment"}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-md font-sans">
              <h3 className="font-serif text-headline-sm text-on-surface mb-2 border-b border-surface-container-high pb-2">
                {isAr ? "الدفع الآمن والضمان" : "Secure Escrow Payment"}
              </h3>

              <div className="bg-primary/5 border border-primary/10 p-md rounded-lg text-body-md text-on-primary-fixed-variant mb-2">
                <strong>{isAr ? "ضمان مودي الآمن:" : "Mooday Safe Escrow Policy:"}</strong>
                <p className="text-[13px] mt-1 leading-normal opacity-90">
                  {isAr
                    ? "أموالك بأمان! لن نقوم بتحويل المبلغ للبائع إلا بعد استلامك للمنتج وتأكيد مطابقته للوصف خلال ٢٤ ساعة من التسليم."
                    : "Your funds are 100% secure. We hold the money in escrow and only release it to the seller after you confirm successful delivery and inspection."}
                </p>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-2 gap-md">
                <div
                  onClick={() => setPaymentMethod("card")}
                  className={`border-2 p-md rounded-xl flex flex-col items-center justify-center gap-sm cursor-pointer active:scale-95 transition-all ${
                    paymentMethod === "card" ? "border-primary bg-primary/5 text-primary" : "border-outline-variant text-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-[32px]">credit_card</span>
                  <span className="text-label-sm font-bold">{isAr ? "بطاقة ائتمان" : "Credit Card"}</span>
                </div>
                <div
                  onClick={() => setPaymentMethod("apple")}
                  className={`border-2 p-md rounded-xl flex flex-col items-center justify-center gap-sm cursor-pointer active:scale-95 transition-all ${
                    paymentMethod === "apple" ? "border-primary bg-primary/5 text-primary" : "border-outline-variant text-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-[32px]">touch_id</span>
                  <span className="text-label-sm font-bold">Apple Pay</span>
                </div>
              </div>

              {paymentMethod === "card" ? (
                <div className="flex flex-col gap-md mt-2">
                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                      {isAr ? "رقم البطاقة" : "Card Number"}
                    </label>
                    <input
                      type="text"
                      placeholder="4000 1234 5678 9010"
                      className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                        {isAr ? "تاريخ الانتهاء" : "Expiry Date"}
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                        CVV
                      </label>
                      <input
                        type="password"
                        placeholder="***"
                        className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-surface-container-low p-lg border border-outline-variant rounded-xl flex flex-col items-center justify-center gap-md my-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
                    
                  </div>
                  <span className="text-label-sm font-bold text-on-surface text-center">
                    {isAr ? "ادفع نقرة واحدة عبر Apple Pay" : "One-tap payment via Apple Pay"}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md btn-tactile text-center flex items-center justify-center gap-sm active:scale-95 transition-transform mt-4 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    {isAr ? "جاري معالجة الدفع والضمان..." : "Securing Escrow Payment..."}
                  </>
                ) : (
                  <>{isAr ? "تأكيد الدفع (AED " + total + ")" : "Secure Checkout (AED " + total + ")"}</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Order review side */}
        <div className="md:col-span-5 flex flex-col gap-md">
          <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex flex-col gap-md font-sans">
            <h3 className="font-serif text-headline-sm text-on-surface border-b border-surface-container-high pb-2">
              {isAr ? "مراجعة الطلب" : "Order Review"}
            </h3>

            {/* Items list */}
            <div className="flex flex-col gap-sm max-h-[300px] overflow-y-auto no-scrollbar">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-sm border-b border-surface-container-high pb-sm last:border-b-0 last:pb-0">
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
                      {isAr ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                    </span>
                  </div>
                  <span className="text-label-sm font-bold text-primary self-center">
                    AED {item.product.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-surface-container-high" />

            <div className="flex flex-col gap-xs text-[13px] text-on-surface-variant">
              <div className="flex justify-between">
                <span>{isAr ? "المجموع الفرعي:" : "Subtotal:"}</span>
                <span>AED {subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>{isAr ? "الشحن (مودي اكسبريس):" : "Shipping (Mooday Express):"}</span>
                <span>{shipping === 0 ? (isAr ? "مجاني" : "FREE") : `AED ${shipping}`}</span>
              </div>
            </div>

            <hr className="border-surface-container-high" />

            <div className="flex justify-between text-label-md font-bold text-primary">
              <span>{isAr ? "الإجمالي:" : "Total:"}</span>
              <span>AED {total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
