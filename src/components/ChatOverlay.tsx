"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { formatAEDLabel } from "@/lib/format";

interface ChatOverlayProps {
  threadId: string;
  onBack: () => void;
  onCheckout: () => void;
}

interface ChatCopy {
  back: string;
  online: string;
  buyItem: string;
  typeMessage: string;
  send: string;
  notFound: string;
  notFoundBack: string;
  attachImage: string;
  voiceNote: string;
  attachmentUnavailable: string;
  makeOffer: string;
  offerAmount: string;
  offerPlaceholder: string;
  offerSend: string;
  offerCancel: string;
  offerCard: (amount: number) => string;
  offerAccepted: string;
  offerDeclined: string;
  offerPending: string;
  offerAcceptedAr: string;
  offerDeclinedAr: string;
  offerPendingAr: string;
  imageAttached: string;
  quickReply1: string;
  quickReply2: string;
  quickReply3: string;
}

const COPY: Record<"en" | "ar", ChatCopy> = {
  en: {
    back: "Back",
    online: "Online",
    buyItem: "Buy Item",
    typeMessage: "Type your message...",
    send: "Send",
    notFound: "Chat not found.",
    notFoundBack: "Back",
    attachImage: "Attach image",
    voiceNote: "Voice note",
    attachmentUnavailable: "Available after media upload is connected",
    makeOffer: "Make Offer",
    offerAmount: "Your offer (AED)",
    offerPlaceholder: "Enter amount",
    offerSend: "Send offer",
    offerCancel: "Cancel",
    offerCard: (amount) => `Offer: ${formatAEDLabel(amount)}`,
    offerAccepted: "Accepted",
    offerDeclined: "Declined",
    offerPending: "Pending",
    offerAcceptedAr: "مقبول",
    offerDeclinedAr: "مرفوض",
    offerPendingAr: "قيد الانتظار",
    imageAttached: "📷 Photo",
    quickReply1: "Is this still available?",
    quickReply2: "Can you share more photos?",
    quickReply3: "What's your best price?",
  },
  ar: {
    back: "رجوع",
    online: "متصل",
    buyItem: "شراء المنتج",
    typeMessage: "اكتب رسالة...",
    send: "إرسال",
    notFound: "المحادثة غير موجودة.",
    notFoundBack: "رجوع",
    attachImage: "إرفاق صورة",
    voiceNote: "رسالة صوتية",
    attachmentUnavailable: "يتوفر بعد ربط رفع الوسائط",
    makeOffer: "إرسال عرض",
    offerAmount: "عرضك (AED)",
    offerPlaceholder: "أدخلي المبلغ",
    offerSend: "إرسال العرض",
    offerCancel: "إلغاء",
    offerCard: (amount) => `عرض: ${formatAEDLabel(amount)}`,
    offerAccepted: "مقبول",
    offerDeclined: "مرفوض",
    offerPending: "قيد الانتظار",
    offerAcceptedAr: "مقبول",
    offerDeclinedAr: "مرفوض",
    offerPendingAr: "قيد الانتظار",
    imageAttached: "📷 صورة",
    quickReply1: "هل لا يزال متوفراً؟",
    quickReply2: "هل يمكنك مشاركة المزيد من الصور؟",
    quickReply3: "ما هو أفضل سعر؟",
  },
};

type OfferStatus = "pending" | "accepted" | "declined";

interface OfferMessage {
  amount: number;
  status: OfferStatus;
}

/**
 * F-29 — Chat Thread (enhanced).
 *
 * Adds over the previous version:
 *  - **Image attachment** button (Phase 1: inserts a "📷 Photo" stub message).
 *  - **Voice note** button (Phase 1: inserts a "🎙 Voice note" stub).
 *  - **Make an Offer** (F-30): a special card message with the offer
 *    amount + status pill (Pending → Accepted/Declined). Phase 1
 *    auto-accepts offers after 2 seconds to simulate seller response.
 *  - **Quick replies**: three chips above the input for common questions.
 *
 * Read receipts and real-time updates arrive with Phase 3.
 */
export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  threadId,
  onBack,
  onCheckout,
}) => {
  const { language, chats, sendChatMessage } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [inputText, setInputText] = useState("");
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offers, setOffers] = useState<Record<string, OfferMessage>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`mooday_chat_offers_${threadId}`) ?? "{}",
      );
    } catch {
      return {};
    }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const thread = chats.find((c) => c.id === threadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages, offers]);

  useEffect(() => {
    localStorage.setItem(
      `mooday_chat_offers_${threadId}`,
      JSON.stringify(offers),
    );
  }, [offers, threadId]);

  if (!thread) {
    return (
      <div className="p-xl text-center font-sans">
        <p className="text-on-surface-variant">{t.notFound}</p>
        <button
          onClick={onBack}
          className="btn-primary mt-md px-md py-sm rounded-full"
        >
          {t.notFoundBack}
        </button>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(threadId, inputText.trim());
    setInputText("");
  };

  const handleQuickReply = (text: string) => {
    sendChatMessage(threadId, text);
  };

  const handleSendOffer = () => {
    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) return;
    const msgId = `offer-${Date.now()}`;
    setOffers((prev) => ({ ...prev, [msgId]: { amount, status: "pending" } }));
    sendChatMessage(threadId, `${isAr ? "عرض" : "OFFER"}:${amount}:${msgId}`);
    setOfferAmount("");
    setShowOfferForm(false);

    // Simulate seller response after 2s (Phase 1 mock).
    setTimeout(() => {
      setOffers((prev) => {
        const offer = prev[msgId];
        if (!offer) return prev;
        // Auto-accept if the offer is >= 80% of list price.
        const shouldAccept = amount >= thread.productPrice * 0.8;
        return {
          ...prev,
          [msgId]: {
            ...offer,
            status: shouldAccept ? "accepted" : "declined",
          },
        };
      });
    }, 2000);
  };

  // Parse messages to detect offer messages (format: "OFFER:amount:msgId").
  const renderMessage = (msg: (typeof thread.messages)[number]) => {
    const isUser = msg.sender === "user";
    const offerMatch = msg.text.match(/^(?:عرض|OFFER):(\d+(?:\.\d+)?):(.+)$/);
    if (offerMatch) {
      const [, amountStr, msgId] = offerMatch;
      const amount = parseFloat(amountStr);
      const offer = offers[msgId] ?? {
        amount,
        status: "pending" as OfferStatus,
      };
      return (
        <OfferCard
          key={msg.id}
          amount={offer.amount}
          status={offer.status}
          isUser={isUser}
          isAr={isAr}
          t={t}
        />
      );
    }
    return (
      <div
        key={msg.id}
        className={`flex flex-col max-w-[75%] ${
          isUser ? "self-end items-end" : "self-start items-start"
        }`}
      >
        <div
          className={`p-md rounded-2xl text-body-md leading-normal ${
            isUser
              ? "bg-primary text-on-primary rounded-br-none"
              : "bg-surface-container-high text-on-surface rounded-bl-none"
          }`}
        >
          {msg.text}
        </div>
        <span className="text-[10px] text-outline mt-1 px-1">{msg.time}</span>
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        isAr
          ? `محادثة مع ${thread.sellerName}`
          : `Chat with ${thread.sellerName}`
      }
      dir={isAr ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 bg-background flex flex-col md:max-w-[600px] md:mx-auto md:shadow-2xl md:border-x border-surface-container-high font-sans"
    >
      {/* Header */}
      <header className="bg-surface sticky top-0 z-10 border-b border-surface-container-high px-margin-mobile py-md flex items-center justify-between">
        <div className="flex items-center gap-md">
          <button
            onClick={onBack}
            className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
            aria-label={t.back}
          >
            <span
              className="material-symbols-outlined no-mirror"
              aria-hidden="true"
            >
              arrow_back
            </span>
          </button>
          <img
            alt={thread.sellerName}
            src={thread.sellerAvatar}
            className="w-10 h-10 rounded-full object-cover border border-outline-variant"
          />
          <div>
            <h3 className="text-label-md font-bold text-on-surface leading-tight">
              {thread.sellerName}
            </h3>
            <span className="text-[11px] text-primary font-bold">
              {t.online}
            </span>
          </div>
        </div>
        <button
          onClick={onCheckout}
          className="btn-primary text-label-sm font-bold px-4 py-2 rounded-full active:scale-95 transition-transform"
        >
          {t.buyItem}
        </button>
      </header>

      {/* Product preview bar */}
      <div className="bg-surface-container-low border-b border-surface-container-high px-margin-mobile py-sm flex items-center gap-sm">
        <img
          alt={thread.productTitle}
          src={thread.productImage}
          className="w-10 h-10 rounded object-cover border border-outline-variant flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-label-sm font-bold text-on-surface truncate">
            {thread.productTitle}
          </p>
          <span className="text-[11px] text-outline font-bold">
            {formatAEDLabel(thread.productPrice)}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <main className="flex-grow overflow-y-auto no-scrollbar p-lg flex flex-col gap-md bg-surface-container-lowest">
        {thread.messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </main>

      {/* Quick replies */}
      {thread.messages.length <= 2 && (
        <div className="px-md pt-sm flex gap-sm overflow-x-auto no-scrollbar">
          {[t.quickReply1, t.quickReply2, t.quickReply3].map((qr) => (
            <button
              key={qr}
              type="button"
              onClick={() => handleQuickReply(qr)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-surface-container-low border border-surface-container-high text-label-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Offer form */}
      {showOfferForm && (
        <div className="bg-surface-container-low border-t border-surface-container-high p-md flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-bold text-primary uppercase tracking-wider">
              {t.makeOffer}
            </span>
            <span className="text-[11px] text-outline">
              {formatAEDLabel(thread.productPrice)}
            </span>
          </div>
          <div className="flex gap-sm">
            <input
              type="number"
              inputMode="numeric"
              placeholder={t.offerPlaceholder}
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="flex-grow p-md bg-surface border border-outline-variant rounded-full text-body-md focus:border-primary outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSendOffer}
              disabled={!offerAmount || parseFloat(offerAmount) <= 0}
              className="btn-primary px-4 py-md rounded-full text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform disabled:opacity-50"
            >
              {t.offerSend}
            </button>
            <button
              type="button"
              onClick={() => setShowOfferForm(false)}
              className="px-3 py-md rounded-full border border-outline-variant text-on-surface-variant text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform"
            >
              {t.offerCancel}
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <footer className="bg-surface border-t border-surface-container-high p-md">
        <form onSubmit={handleSend} className="flex gap-sm items-center">
          {/* Image attach */}
          <button
            type="button"
            aria-label={t.attachImage}
            title={t.attachmentUnavailable}
            disabled
            className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-outline opacity-50 cursor-not-allowed flex-shrink-0"
          >
            <span
              className="material-symbols-outlined text-[20px] no-mirror"
              aria-hidden="true"
            >
              photo_camera
            </span>
          </button>
          {/* Make offer */}
          <button
            type="button"
            onClick={() => setShowOfferForm((v) => !v)}
            aria-label={t.makeOffer}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
              showOfferForm
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px] no-mirror"
              aria-hidden="true"
            >
              local_offer
            </span>
          </button>
          {/* Voice note */}
          <button
            type="button"
            aria-label={t.voiceNote}
            title={t.attachmentUnavailable}
            disabled
            className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-outline opacity-50 cursor-not-allowed flex-shrink-0"
          >
            <span
              className="material-symbols-outlined text-[20px] no-mirror"
              aria-hidden="true"
            >
              mic
            </span>
          </button>
          {/* Text input */}
          <label htmlFor="chat-input" className="sr-only">
            {t.typeMessage}
          </label>
          <input
            id="chat-input"
            type="text"
            placeholder={t.typeMessage}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            autoComplete="off"
            className="flex-grow p-md bg-surface-container-low border border-surface-variant rounded-full text-body-md outline-none focus:border-primary placeholder-outline-variant"
          />
          {/* Send */}
          <button
            type="submit"
            className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-95 transition-transform shadow-md flex-shrink-0"
            aria-label={t.send}
          >
            <span
              className="material-symbols-outlined text-[20px] no-mirror"
              aria-hidden="true"
            >
              send
            </span>
          </button>
        </form>
      </footer>
    </div>
  );
};

// ---------- Offer card (F-30) ----------

const OfferCard: React.FC<{
  amount: number;
  status: OfferStatus;
  isUser: boolean;
  isAr: boolean;
  t: ChatCopy;
}> = ({ amount, status, isUser, isAr, t }) => {
  const statusText =
    status === "accepted"
      ? isAr
        ? t.offerAcceptedAr
        : t.offerAccepted
      : status === "declined"
        ? isAr
          ? t.offerDeclinedAr
          : t.offerDeclined
        : isAr
          ? t.offerPendingAr
          : t.offerPending;

  const statusColor =
    status === "accepted"
      ? "bg-emerald-100 text-emerald-900"
      : status === "declined"
        ? "bg-red-100 text-red-900"
        : "bg-amber-100 text-amber-900";

  return (
    <div
      className={`flex flex-col max-w-[75%] ${
        isUser ? "self-end items-end" : "self-start items-start"
      }`}
    >
      <div
        className={`p-md rounded-2xl border-2 ${
          isUser
            ? "bg-primary/5 border-primary rounded-br-none"
            : "bg-surface-container-high border-surface-container-high rounded-bl-none"
        }`}
      >
        <div className="flex items-center gap-sm">
          <span
            className="material-symbols-outlined text-[20px] text-primary no-mirror"
            aria-hidden="true"
          >
            local_offer
          </span>
          <span className="font-serif text-headline-sm text-primary font-bold">
            {formatAEDLabel(amount)}
          </span>
        </div>
        <span
          className={`inline-block mt-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${statusColor}`}
        >
          {statusText}
        </span>
      </div>
    </div>
  );
};
