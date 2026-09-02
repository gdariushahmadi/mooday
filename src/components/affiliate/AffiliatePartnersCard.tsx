"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { AppImage } from "@/components/AppImage";
import type {
  AffiliateLinkRecord,
  AffiliateLinkService,
  PartnerRecord,
} from "@/services/backend/contracts";
import {
  mockAffiliateLinkService,
  recordMockAffiliateClick,
} from "@/services/affiliate/mockAffiliateService";

interface AffiliatePartnersCardProps {
  listingId: string;
  className?: string;
}

const COPY = {
  en: {
    title: "Also available new from",
    disclosure: "External partner link. DANEG may earn a commission.",
    open: "Open partner store",
    loading: "Checking partner stores...",
  },
  ar: {
    title: "متوفر جديد أيضاً من",
    disclosure: "رابط متجر خارجي. قد تحصل DANEG على عمولة.",
    open: "فتح متجر الشريك",
    loading: "جاري التحقق من المتاجر...",
  },
} as const;

export function AffiliatePartnersCard({
  listingId,
  className,
}: AffiliatePartnersCardProps) {
  const { language, phase2Backend } = useApp();
  const [links, setLinks] = useState<AffiliateLinkRecord[] | null>(null);
  const [partners, setPartners] = useState<PartnerRecord[] | null>(null);
  const service: AffiliateLinkService =
    phase2Backend?.affiliateLinks ?? mockAffiliateLinkService;
  const t = language === "ar" ? COPY.ar : COPY.en;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLinks(null);
      setPartners(null);
      void Promise.all([
        service.listLinksForListing(listingId),
        service.listPartners(),
      ])
        .then(([nextLinks, nextPartners]) => {
          if (cancelled) return;
          setLinks(nextLinks);
          setPartners(nextPartners);
        })
        .catch(() => {
          if (cancelled) return;
          setLinks([]);
          setPartners([]);
        });
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, service]);

  const partnerByCode = useMemo(
    () => new Map((partners ?? []).map((partner) => [partner.code, partner])),
    [partners],
  );

  if (links === null || partners === null) {
    return (
      <div
        className={
          "rounded-xl border border-surface-container-high bg-surface-container-low/40 p-3 text-xs text-on-surface-variant " +
          (className ?? "")
        }
        aria-live="polite"
      >
        {t.loading}
      </div>
    );
  }

  const visibleLinks = links.filter((link) => partnerByCode.has(link.partnerCode));
  if (visibleLinks.length === 0) return null;

  return (
    <section
      className={
        "rounded-xl border border-surface-container-high bg-surface-container-low/40 p-4 " +
        (className ?? "")
      }
      data-testid="affiliate-partners-card"
      aria-label={t.title}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-label-sm font-bold uppercase tracking-[0.12em] text-on-surface">
            {t.title}
          </h2>
          <p className="mt-1 text-[11px] text-on-surface-variant">{t.disclosure}</p>
        </div>
        <span
          className="material-symbols-outlined shrink-0 text-[20px] text-primary"
          aria-hidden="true"
        >
          open_in_new
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {visibleLinks.map((link) => {
          const partner = partnerByCode.get(link.partnerCode) as PartnerRecord;
          return (
            <a
              key={link.id}
              href={"/go/" + link.shortId}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => {
                if (!phase2Backend) recordMockAffiliateClick(link.shortId);
              }}
              aria-label={t.open + ": " + partner.name}
              className="group flex items-center justify-between gap-3 rounded-lg border border-primary/25 bg-surface px-3 py-2.5 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              data-testid={"affiliate-partner-link-" + link.partnerCode}
            >
              <span className="flex min-w-0 items-center gap-2">
                {partner.logoUrl ? (
                  <AppImage
                    src={partner.logoUrl}
                    alt=""
                    width={80}
                    height={20}
                    unoptimized
                    className="h-5 w-auto max-w-20 object-contain"
                  />
                ) : (
                  <span
                    className="material-symbols-outlined text-[20px] text-primary"
                    aria-hidden="true"
                  >
                    storefront
                  </span>
                )}
                <span className="truncate text-body-md font-bold text-primary">
                  {partner.name}
                </span>
              </span>
              <span
                className="material-symbols-outlined shrink-0 text-[18px] text-primary transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                aria-hidden="true"
              >
                arrow_outward
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
