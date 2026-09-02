import React, { useState } from "react";
import type { Product } from "@/context/AppContext";

type AuthenticityTier = NonNullable<Product["authenticityTier"]>;

interface AuthenticityBadgeProps {
  tier?: Product["authenticityTier"];
  isAuthentic?: boolean;
  isAr?: boolean;
  brand?: string;
  compact?: boolean;
}

const TIER_COPY: Record<
  AuthenticityTier,
  { en: string; ar: string; icon: string; className: string; detailEn: string; detailAr: string }
> = {
  verified: {
    en: "Verified by DANEG",
    ar: "موثق من دانق",
    icon: "verified",
    className: "bg-primary text-on-primary border-primary",
    detailEn: "This item passed DANEG authenticity review.",
    detailAr: "اجتازت هذه القطعة مراجعة دانق للأصالة.",
  },
  in_review: {
    en: "In review",
    ar: "قيد المراجعة",
    icon: "hourglass_top",
    className: "bg-surface border-primary text-primary",
    detailEn: "DANEG is reviewing the seller's authenticity documents.",
    detailAr: "يراجع فريق دانق مستندات أصالة القطعة.",
  },
  self_declared: {
    en: "Self-declared",
    ar: "إقرار ذاتي",
    icon: "person_check",
    className: "bg-surface-container-low text-on-surface-variant border-outline-variant",
    detailEn: "The seller supplied the authenticity statement. Review is not complete.",
    detailAr: "قدم البائع إقرار الأصالة. لم تكتمل المراجعة بعد.",
  },
};

function resolveTier(
  tier: Product["authenticityTier"],
  isAuthentic: boolean | undefined,
): AuthenticityTier {
  if (tier === "verified" || tier === "in_review" || tier === "self_declared") {
    return tier;
  }
  return isAuthentic ? "verified" : "self_declared";
}

/** Tier-aware authenticity signal. The detail text is available on demand. */
export function AuthenticityBadge({
  tier,
  isAuthentic,
  isAr = false,
  brand,
  compact = false,
}: AuthenticityBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const resolvedTier = resolveTier(tier, isAuthentic);
  const copy = TIER_COPY[resolvedTier];
  const label = isAr ? copy.ar : copy.en;

  return (
    <div className="relative inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={brand ? `${label}: ${brand}` : label}
        className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-colors ${copy.className}`}
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
          {copy.icon}
        </span>
        {!compact && <span>{label}</span>}
      </button>
      {expanded && (
        <div
          role="status"
          className="absolute top-full z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-outline-variant bg-surface p-3 text-label-sm text-on-surface shadow-lg"
          dir={isAr ? "rtl" : "ltr"}
        >
          <p className="font-bold text-primary">{label}</p>
          <p className="mt-1 leading-relaxed">
            {isAr ? copy.detailAr : copy.detailEn}
          </p>
        </div>
      )}
    </div>
  );
}
