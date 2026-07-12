"use client";

import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { ClickableCard } from "./ClickableCard";
import { formatAEDLabel } from "@/lib/format";

interface ChatsListViewProps {
  onBack: () => void;
  onOpenThread: (threadId: string) => void;
}

interface ChatsCopy {
  title: string;
  back: string;
  searchPlaceholder: string;
  pinLabel: string;
  emptyTitle: string;
  emptyBody: string;
  emptyCta: string;
  online: string;
  offline: string;
}

const COPY: Record<"en" | "ar", ChatsCopy> = {
  en: {
    title: "Messages",
    back: "Back",
    searchPlaceholder: "Search messages",
    pinLabel: "Pinned",
    emptyTitle: "No messages yet",
    emptyBody:
      "When you message a seller about an item, your conversation will appear here.",
    emptyCta: "Browse items",
    online: "Online",
    offline: "Offline",
  },
  ar: {
    title: "الرسائل",
    back: "رجوع",
    searchPlaceholder: "ابحثي في الرسائل",
    pinLabel: "مثبتة",
    emptyTitle: "لا رسائل بعد",
    emptyBody: "عند مراسلة بائع حول منتج، ستظهر المحادثة هنا.",
    emptyCta: "تصفحي المنتجات",
    online: "متصل",
    offline: "غير متصل",
  },
};

/**
 * F-28 — Chats list.
 *
 * Standalone view of all chat threads. Pinned threads appear first
 * (Phase 1: the first thread is auto-pinned). Each row shows the
 * seller avatar, product thumbnail, last message preview, and an
 * unread badge. Tapping a row opens F-29 (ChatOverlay).
 */
export const ChatsListView: React.FC<ChatsListViewProps> = ({
  onBack,
  onOpenThread,
}) => {
  const { language, chats } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;
  const [query, setQuery] = React.useState("");

  // Phase 1: pin the first thread (deterministic).
  const sorted = useMemo(() => {
    const filtered = query.trim()
      ? chats.filter(
          (c) =>
            c.sellerName.toLowerCase().includes(query.toLowerCase()) ||
            c.productTitle.toLowerCase().includes(query.toLowerCase()),
        )
      : chats;
    return filtered.slice().sort((a, b) => {
      // First thread is "pinned" (Phase 1 heuristic).
      const aPin = a.id === chats[0]?.id ? 0 : 1;
      const bPin = b.id === chats[0]?.id ? 0 : 1;
      if (aPin !== bPin) return aPin - bPin;
      return 0;
    });
  }, [chats, query]);

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

      {/* Search */}
      <input
        type="text"
        placeholder={t.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="p-md bg-surface-container-low border border-surface-container-high rounded-full text-body-md focus:border-primary outline-none"
      />

      {/* List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            chat_bubble_outline
          </span>
          <h2 className="font-serif text-headline-sm text-on-surface">
            {t.emptyTitle}
          </h2>
          <p className="text-label-sm text-on-surface-variant max-w-xs">
            {t.emptyBody}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 rounded-full bg-primary text-on-primary text-label-sm font-bold active:scale-95 transition-transform"
          >
            {t.emptyCta}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {/* Pinned section label */}
          {sorted[0] && chats[0] && (
            <div className="text-[10px] uppercase tracking-wider text-outline font-bold px-1">
              {t.pinLabel}
            </div>
          )}
          {sorted.map((thread, idx) => {
            const isFirst = thread.id === chats[0]?.id;
            // Show "Messages" separator after pinned.
            const showSeparator = !isFirst && idx === 1;
            return (
              <React.Fragment key={thread.id}>
                {showSeparator && (
                  <div className="text-[10px] uppercase tracking-wider text-outline font-bold px-1 mt-sm">
                    {isAr ? "الكل" : "All messages"}
                  </div>
                )}
                <ClickableCard
                  onClick={() => onOpenThread(thread.id)}
                  ariaLabel={`${thread.sellerName} — ${thread.productTitle}`}
                  className="flex items-center gap-md p-md bg-surface-container-lowest border border-surface-container-high rounded-xl hover:shadow-sm transition-shadow"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      alt={thread.sellerName}
                      src={thread.sellerAvatar}
                      className="w-12 h-12 rounded-full object-cover border border-outline-variant"
                    />
                    <img
                      alt={thread.productTitle}
                      src={thread.productImage}
                      className="absolute -bottom-1 -end-1 w-6 h-6 rounded object-cover border-2 border-surface"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-sm">
                      <h3 className="font-serif text-label-md text-on-surface truncate">
                        {thread.sellerName}
                      </h3>
                      <span className="text-[10px] text-outline flex-shrink-0">
                        {thread.lastMessageTime}
                      </span>
                    </div>
                    <p className="text-label-sm text-on-surface-variant line-clamp-1">
                      {thread.lastMessage}
                    </p>
                    <span className="text-[10px] text-primary font-bold">
                      {formatAEDLabel(thread.productPrice)}
                    </span>
                  </div>
                  {isFirst && (
                    <span
                      className="material-symbols-outlined text-[16px] text-primary no-mirror"
                      aria-hidden="true"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      push_pin
                    </span>
                  )}
                </ClickableCard>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
