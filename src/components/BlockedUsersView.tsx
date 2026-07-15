"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { BlockedUser } from "@/data/blocked-users";

interface BlockedUsersViewProps {
  onBack: () => void;
}

interface BlockedCopy {
  title: string;
  back: string;
  intro: string;
  emptyTitle: string;
  emptyBody: string;
  blockedOn: string;
  reasonLabel: string;
  unblock: string;
  unblockConfirmTitle: string;
  unblockConfirmBody: (name: string) => string;
  cancel: string;
  unblock_yes: string;
}

const COPY: Record<"en" | "ar", BlockedCopy> = {
  en: {
    title: "Blocked users",
    back: "Back",
    intro:
      "Blocked users can't message you, see your listings, or interact with your closet.",
    emptyTitle: "No blocked users",
    emptyBody: "When you block someone, they'll appear here so you can unblock them later.",
    blockedOn: "Blocked on",
    reasonLabel: "Reason",
    unblock: "Unblock",
    unblockConfirmTitle: "Unblock this user?",
    unblockConfirmBody: (name) =>
      `${name} will be able to message and interact with you again.`,
    cancel: "Cancel",
    unblock_yes: "Unblock",
  },
  ar: {
    title: "المحظورون",
    back: "رجوع",
    intro:
      "المحظورون لا يمكنهم مراسلتك أو رؤية منتجاتك أو التفاعل مع خزانتك.",
    emptyTitle: "لا يوجد محظورون",
    emptyBody: "عند حظر شخص، سيظهر هنا لتتمكني من رفع الحظر لاحقاً.",
    blockedOn: "تم الحظر في",
    reasonLabel: "السبب",
    unblock: "رفع الحظر",
    unblockConfirmTitle: "رفع الحظر عن هذا المستخدم؟",
    unblockConfirmBody: (name) =>
      `سيتمكن ${name} من مراسلتك والتفاعل معك مرة أخرى.`,
    cancel: "إلغاء",
    unblock_yes: "رفع الحظر",
  },
};

/**
 * H-43 — Blocked users list.
 *
 * Management view: list the user's blocked users with a confirmable
 * unblock action. Reachable from Settings > Privacy & Safety > Blocked
 * users.
 */
export const BlockedUsersView: React.FC<BlockedUsersViewProps> = ({
  onBack,
}) => {
  const { language, blockedUsers, unblockUser } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const target = blockedUsers.find((u) => u.id === confirmId);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-md pb-10"
    >
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

      <p className="text-label-sm text-on-surface-variant">{t.intro}</p>

      {blockedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            block
          </span>
          <h2 className="font-serif text-headline-sm text-on-surface">
            {t.emptyTitle}
          </h2>
          <p className="text-label-sm text-on-surface-variant max-w-xs">
            {t.emptyBody}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {blockedUsers.map((u: BlockedUser) => (
            <BlockedUserRow
              key={u.id}
              user={u}
              isAr={isAr}
              t={t}
              onUnblock={() => setConfirmId(u.id)}
            />
          ))}
        </div>
      )}

      {target && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-md"
        >
          <div className="bg-surface rounded-2xl p-lg max-w-sm w-full shadow-2xl flex flex-col gap-md">
            <h3 className="font-serif text-headline-sm text-on-surface">
              {t.unblockConfirmTitle}
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              {t.unblockConfirmBody(isAr ? target.nameAr : target.nameEn)}
            </p>
            <div className="flex gap-sm">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="flex-1 py-3 rounded-xl border-2 border-outline-variant text-on-surface text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  unblockUser(target.id);
                  setConfirmId(null);
                }}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
              >
                {t.unblock_yes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BlockedUserRow: React.FC<{
  user: BlockedUser;
  isAr: boolean;
  t: BlockedCopy;
  onUnblock: () => void;
}> = ({ user, isAr, t, onUnblock }) => (
  <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex items-center gap-md">
    <img
      alt=""
      src={user.avatar}
      className="w-12 h-12 rounded-full object-cover border border-outline-variant flex-shrink-0"
    />
    <div className="flex-grow min-w-0">
      <p className="font-serif text-label-md text-on-surface truncate">
        {isAr ? user.nameAr : user.nameEn}
      </p>
      {user.reasonEn && (
        <p className="text-label-sm text-on-surface-variant line-clamp-1">
          <span className="text-[10px] uppercase tracking-wider text-outline font-bold">
            {t.reasonLabel}:{" "}
          </span>
          {isAr ? user.reasonAr : user.reasonEn}
        </p>
      )}
      <p className="text-[10px] text-outline">
        {t.blockedOn} {new Date(user.date).toLocaleDateString(isAr ? "ar" : "en-US")}
      </p>
    </div>
    <button
      type="button"
      onClick={onUnblock}
      className="px-3 py-1.5 rounded-full border border-primary text-primary text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform"
    >
      {t.unblock}
    </button>
  </div>
);
