"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import type {
  AffiliateLinkRecord,
  PartnerRecord,
} from "@/services/backend/contracts";

interface Props {
  listingId: string;
  className?: string;
}

export function AffiliatePartnersCard({ listingId, className }: Props) {
  const phase2Backend = useApp().phase2Backend;
  const [links, setLinks] = useState<AffiliateLinkRecord[] | null>(null);
  const [partners, setPartners] = useState<PartnerRecord[] | null>(null);

  useEffect(() => {
    if (!phase2Backend) return;
    let cancelled = false;
    (async () => {
      try {
        const [l, p] = await Promise.all([
          phase2Backend.affiliateLinks.listLinksForListing(listingId),
          phase2Backend.affiliateLinks.listPartners(),
        ]);
        if (cancelled) return;
        setLinks(l);
        setPartners(p);
      } catch {
        if (cancelled) return;
        setLinks([]);
        setPartners([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase2Backend, listingId]);

  const partnerByCode = useMemo(() => {
    const m = new Map<string, PartnerRecord>();
    (partners ?? []).forEach((p) => m.set(p.code, p));
    return m;
  }, [partners]);

  if (links === null || partners === null) return null;
  if (links.length === 0) return null;

  return (
    <div
      className={
        "rounded-xl border border-surface-container-high bg-surface-container-low/40 p-3 " +
        (className ?? "")
      }
      data-testid="affiliate-partners-card"
    >
      <div className="text-label-sm uppercase tracking-widest text-on-surface-variant font-bold mb-2">
        Also buy new at
      </div>
      <div className="flex flex-col gap-xs">
        {links.map((link) => {
          const partner = partnerByCode.get(link.partnerCode);
          if (!partner) return null;
          return (
            <a
              key={link.id}
              href={`/go/${link.shortId}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center justify-between gap-sm rounded-lg border border-primary/30 bg-surface px-3 py-2 hover:bg-primary/5 transition-colors"
              data-testid={`affiliate-partner-link-${link.partnerCode}`}
            >
              <span className="flex items-center gap-sm">
                {partner.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="h-5 w-auto"
                  />
                ) : null}
                <span className="text-body-md font-bold text-primary">
                  {partner.name}
                </span>
              </span>
              <span className="material-symbols-outlined text-primary" aria-hidden="true">
                open_in_new
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
