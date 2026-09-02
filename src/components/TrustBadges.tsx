import React from "react";

interface TrustBadgesProps {
  isAr?: boolean;
  variant?: "inline" | "block";
}

const BADGES = [
  { icon: "verified_user", en: "Verified Seller", ar: "بائع موثق" },
  { icon: "workspace_premium", en: "Authenticity", ar: "الأصالة" },
  { icon: "lock", en: "Secure Payment", ar: "دفع آمن" },
] as const;

/** Compact trust signals used at the point of decision. */
export function TrustBadges({
  isAr = false,
  variant = "inline",
}: TrustBadgesProps) {
  return (
    <div
      aria-label={isAr ? "إشارات الثقة" : "Trust signals"}
      className={
        variant === "block"
          ? "grid grid-cols-1 sm:grid-cols-3 gap-sm"
          : "flex flex-wrap items-center gap-x-md gap-y-sm"
      }
      dir={isAr ? "rtl" : "ltr"}
      role="list"
    >
      {BADGES.map((badge) => (
        <div
          key={badge.en}
          className="flex items-center gap-2 text-label-sm text-on-surface-variant"
          role="listitem"
        >
          <span
            className="material-symbols-outlined text-[18px] text-primary"
            aria-hidden="true"
          >
            {badge.icon}
          </span>
          <span>{isAr ? badge.ar : badge.en}</span>
        </div>
      ))}
    </div>
  );
}

