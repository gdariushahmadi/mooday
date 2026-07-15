"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";

interface HelpSupportViewProps {
  onBack: () => void;
  onOpenOrder?: (orderId: string) => void;
}

interface FaqItem {
  qEn: string;
  qAr: string;
  aEn: string;
  aAr: string;
}

interface HelpCopy {
  title: string;
  back: string;
  faqHeading: string;
  contactHeading: string;
  contactBody: string;
  contactCta: string;
  orderLookup: string;
  orderLookupPh: string;
  submit: string;
  submitted: string;
  notFound: string;
  channelsHeading: string;
  channels: { icon: string; titleEn: string; titleAr: string; bodyEn: string; bodyAr: string }[];
}

const COPY: Record<"en" | "ar", HelpCopy> = {
  en: {
    title: "Help & Support",
    back: "Back",
    faqHeading: "Frequently asked",
    contactHeading: "Contact us",
    contactBody:
      "Our Dubai-based concierge team replies within 4 hours, Saturday through Thursday.",
    contactCta: "Open a support ticket",
    orderLookup: "Look up an order",
    orderLookupPh: "e.g. ord-0013",
    submit: "Find my order",
    submitted: "Order found — tap to open.",
    notFound: "No order matches that id.",
    channelsHeading: "Other ways to reach us",
    channels: [
      {
        icon: "mail",
        titleEn: "Email",
        titleAr: "البريد",
        bodyEn: "support@mooday.app · Replies in 4h",
        bodyAr: "support@mooday.app · رد خلال ٤ ساعات",
      },
      {
        icon: "smartphone",
        titleEn: "WhatsApp",
        titleAr: "واتساب",
        bodyEn: "+971 50 555 9988 · Sun–Thu 9am–6pm",
        bodyAr: "+971 50 555 9988 · أحد–خميس ٩ص–٦م",
      },
      {
        icon: "forum",
        titleEn: "Community",
        titleAr: "المجتمع",
        bodyEn: "Join other Mooday sellers & buyers in our Discord.",
        bodyAr: "انضمي لبائعات ومشتريات مودي في Discord.",
      },
    ],
  },
  ar: {
    title: "المساعدة والدعم",
    back: "رجوع",
    faqHeading: "الأسئلة الشائعة",
    contactHeading: "تواصلي معنا",
    contactBody:
      "فريق الكونسيرج لدينا يرد خلال ٤ ساعات، السبت إلى الخميس.",
    contactCta: "افتحي تذكرة دعم",
    orderLookup: "البحث عن طلب",
    orderLookupPh: "مثال: ord-0013",
    submit: "البحث عن طلبي",
    submitted: "تم العثور على الطلب — اضغطي للفتح.",
    notFound: "لا يوجد طلب بهذا الرقم.",
    channelsHeading: "طرق أخرى للتواصل",
    channels: [],
  },
};

const FAQS_EN: { items: FaqItem[] } = {
  items: [
    {
      qEn: "How do I sell on Mooday?",
      qAr: "كيف أبيع على مودي؟",
      aEn: "Tap the Sell button in the bottom nav, pick Resell, then fill out the listing form with photos, title, price, and condition. You can save as draft and come back later.",
      aAr:
        "اضغطي على زر بيع في شريط التنقل السفلي، اختاري إعادة البيع، ثم املئي نموذج العرض بالصور والعنوان والسعر والحالة. يمكنكِ الحفظ كمسودة والعودة لاحقاً.",
    },
    {
      qEn: "When will I get paid?",
      qAr: "متى سأستلم المبلغ؟",
      aEn: "Funds move into escrow when the buyer pays. We hold them for 3 days after delivery confirmation, then release to your bank account.",
      aAr:
        "تنتقل الأموال إلى الضمان عند دفع المشتري. نحتفظ بها لمدة ٣ أيام بعد تأكيد التسليم، ثم نحررها لحسابك البنكي.",
    },
    {
      qEn: "What if the buyer doesn't receive the item?",
      qAr: "ماذا لو لم يستلم المشتري المنتج؟",
      aEn: "Open a dispute from the order details screen within 7 days. Our support team reviews tracking and contacts the courier, then refunds or re-ships.",
      aAr:
        "افتحي نزاعاً من شاشة تفاصيل الطلب خلال ٧ أيام. يراجع فريق الدعم التتبع ويتواصل مع شركة الشحن، ثم يرد المبلغ أو يعيد الشحن.",
    },
    {
      qEn: "Is every seller identity verified?",
      qAr: "هل كل بائع موثق؟",
      aEn: "Yes. Every seller on Mooday passes a manual onboarding review before they can list. We spot-check authenticity within 30 days.",
      aAr:
        "نعم. كل بائع على مودي يمر بمراجعة يدوية قبل إتاحة العرض. نتحقق عشوائياً خلال ٣٠ يوماً.",
    },
  ],
};

/**
 * G-38 — Help & Support.
 *
 * Three-section help centre:
 *  1. **FAQ accordion** — 4 top questions with expandable answers.
 *  2. **Order lookup** — paste an `ord-XXXX` and find the matching order.
 *  3. **Other channels** — email, WhatsApp, community links.
 */
export const HelpSupportView: React.FC<HelpSupportViewProps> = ({
  onBack,
  onOpenOrder,
}) => {
  const { language, orders } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [orderId, setOrderId] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "found" | "missing">(
    "idle",
  );
  const [contactOpen, setContactOpen] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const found = orders.find((o) => o.id === orderId.trim());
    if (found) {
      setLookupStatus("found");
      onOpenOrder?.(found.id);
    } else {
      setLookupStatus("missing");
    }
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-md pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between -mt-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.back}
          className="flex items-center gap-1 text-primary active:scale-95 transition-transform py-1 pe-2"
        >
          <span
            className="material-symbols-outlined text-[22px] no-mirror"
            aria-hidden="true"
          >
            arrow_back
          </span>
        </button>
        <h1 className="font-serif text-label-lg text-on-surface tracking-widest">
          {t.title}
        </h1>
        <div className="w-8 h-8" aria-hidden="true" />
      </div>

      {/* FAQ Accordion */}
      <section>
        <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-sm">
          {t.faqHeading}
        </h2>
        <div className="flex flex-col gap-sm">
          {FAQS_EN.items.map((faq, idx) => {
            const open = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-surface-container-lowest border border-surface-container-high rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : idx)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between p-md text-start"
                >
                  <span className="font-serif text-label-md text-on-surface">
                    {isAr ? faq.qAr : faq.qEn}
                  </span>
                  <span
                    className={`material-symbols-outlined text-on-surface-variant transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    expand_more
                  </span>
                </button>
                {open && (
                  <p className="px-md pb-md text-label-sm text-on-surface-variant leading-normal">
                    {isAr ? faq.aAr : faq.aEn}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Order lookup */}
      <section>
        <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-sm">
          {t.orderLookup}
        </h2>
        <form
          onSubmit={handleLookup}
          className="flex gap-sm bg-surface-container-lowest border border-surface-container-high rounded-xl p-md"
        >
          <input
            type="text"
            placeholder={t.orderLookupPh}
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              setLookupStatus("idle");
            }}
            className="flex-grow p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
          />
          <button
            type="submit"
            className="btn-primary px-4 py-md rounded-xl text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform"
          >
            {t.submit}
          </button>
        </form>
        {lookupStatus === "found" && (
          <p className="text-label-sm text-emerald-700 mt-1">
            {t.submitted}
          </p>
        )}
        {lookupStatus === "missing" && (
          <p className="text-label-sm text-error mt-1">{t.notFound}</p>
        )}
      </section>

      {/* Contact us */}
      <section>
        <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-sm">
          {t.contactHeading}
        </h2>
        <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex flex-col gap-sm">
          <p className="text-label-sm text-on-surface-variant">{t.contactBody}</p>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="btn-primary py-3 rounded-xl text-label-sm font-bold uppercase tracking-widest active:scale-95 transition-transform"
          >
            {t.contactCta}
          </button>
          {contactOpen && (
            <p role="status" className="rounded-lg bg-primary/5 p-sm text-label-sm text-primary">
              {isAr
                ? "اختر إحدى قنوات التواصل أدناه. أضف رقم الطلب في رسالتك لتسريع المساعدة."
                : "Choose a contact channel below. Include your order number so support can help faster."}
            </p>
          )}
        </div>
      </section>

      {/* Other channels */}
      <section>
        <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-sm">
          {t.channelsHeading}
        </h2>
        <div className="flex flex-col gap-sm">
          {t.channels.map((ch, i) => (
            <article
              key={i}
              className="flex items-center gap-md p-md bg-surface-container-lowest border border-surface-container-high rounded-xl"
            >
              <span
                className="material-symbols-outlined text-[28px] text-primary no-mirror"
                aria-hidden="true"
              >
                {ch.icon}
              </span>
              <div>
                <div className="font-serif text-label-md text-on-surface">
                  {isAr ? ch.titleAr : ch.titleEn}
                </div>
                <div className="text-label-sm text-on-surface-variant">
                  {isAr ? ch.bodyAr : ch.bodyEn}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
