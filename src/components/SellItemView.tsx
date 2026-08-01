"use client";

import React, { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { ListingForm } from "./listing/ListingForm";

interface SellItemViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface SellHeaderCopy {
  title: string;
  saveError: string;
}

const COPY: Record<"en" | "ar", SellHeaderCopy> = {
  en: {
    title: "Sell an Item",
    saveError: "Couldn't publish this listing. Please try again.",
  },
  ar: {
    title: "عرض قطعة للبيع",
    saveError: "تعذر نشر هذا الإعلان. يرجى المحاولة مجدداً.",
  },
};

/**
 * D-19 — Create Listing (Resell).
 *
 * The form is shared with D-21 Edit Listing via `ListingForm`. This
 * component is just the header + back navigation around it. Persists
 * via `AppContext.addListing`, then navigates back to the feed (which
 * surfaces the new item in the "New In" tab automatically — Phase 1's
 * `isNewerBatch` heuristic tags anything starting with `custom-`).
 */
export const SellItemView: React.FC<SellItemViewProps> = ({
  onBack,
  onSuccess,
}) => {
  const { language, addListing, userProfile } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;
  const stagedFilesRef = useRef<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const user = {
    nameEn: userProfile.fullNameEn,
    nameAr: userProfile.fullNameAr,
    avatar: userProfile.avatar,
    typeEn: "Verified Closet",
    typeAr: "خزانة معتمدة",
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={isAr ? "رجوع" : "Back"}
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span
            className="material-symbols-outlined no-mirror"
            aria-hidden="true"
          >
            arrow_back
          </span>
        </button>
        <h1 className="font-serif text-headline-sm text-primary tracking-widest uppercase flex-grow text-center">
          {t.title}
        </h1>
        <div className="w-10" aria-hidden="true" />
      </div>

      <main className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-lg mt-md shadow-sm font-sans">
        {error && (
          <p role="alert" className="mb-md rounded-lg bg-error-container p-sm text-error font-bold">
            {error}
          </p>
        )}
        <ListingForm
          isAr={isAr}
          user={user}
          draftKey="mooday_listing_form_draft"
          onStagedFiles={(files) => {
            stagedFilesRef.current = files;
          }}
          onSubmit={(data) => {
            void (async () => {
              setSaving(true);
              setError("");
              try {
                await addListing(data, stagedFilesRef.current, {
                  status: "active",
                });
                stagedFilesRef.current = [];
                onSuccess();
              } catch {
                setError(t.saveError);
              } finally {
                setSaving(false);
              }
            })();
          }}
          onSaveDraft={(data) => {
            void (async () => {
              setSaving(true);
              setError("");
              try {
                await addListing(data, undefined, { status: "draft" });
                onSuccess();
              } catch {
                setError(t.saveError);
              } finally {
                setSaving(false);
              }
            })();
          }}
          onCancel={onBack}
        />
        {saving && (
          <p className="mt-sm text-label-sm text-on-surface-variant" role="status">
            {isAr ? "جارٍ الحفظ…" : "Saving…"}
          </p>
        )}
      </main>
    </div>
  );
};
