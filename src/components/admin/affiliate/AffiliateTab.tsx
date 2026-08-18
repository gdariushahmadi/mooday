"use client";
import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import type {
  PartnerRecord,
  AffiliateLinkRecord,
} from "@/services/backend/contracts";
import type { AffiliateSubTab } from "../AdminTypes";

interface Reports {
  byPartner: { partnerCode: string; clicks: number }[];
  byListing: { listingId: string; clicks: number }[];
  totalClicks: number;
}

export function AffiliateTab() {
  const phase2Backend = useApp().phase2Backend;
  const [sub, setSub] = useState<AffiliateSubTab>("partners");

  return (
    <div className="flex flex-col gap-md">
      <div className="flex gap-sm border-b border-surface-container-high pb-2">
        {(["partners", "links", "reports"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setSub(k)}
            className={
              "px-3 py-1 rounded-full text-label-sm font-bold uppercase tracking-widest " +
              (sub === k
                ? "bg-primary text-on-primary"
                : "text-primary hover:bg-primary/10")
            }
            data-testid={`affiliate-subtab-${k}`}
          >
            {k}
          </button>
        ))}
      </div>
      {sub === "partners" ? <PartnersView backend={phase2Backend} /> : null}
      {sub === "links" ? <LinksView backend={phase2Backend} /> : null}
      {sub === "reports" ? <ReportsView backend={phase2Backend} /> : null}
    </div>
  );
}

function PartnersView({ backend }: { backend: ReturnType<typeof useApp>["phase2Backend"] }) {
  const [partners, setPartners] = useState<PartnerRecord[] | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (!backend) return;
    backend.affiliateLinks.listPartners().then(setPartners).catch(() => setPartners([]));
  }, [backend]);

  if (!backend) return <div>Admin services unavailable.</div>;
  if (partners === null) return <div>Loading partners...</div>;

  async function submit() {
    if (!backend || !code || !name) return;
    await backend.affiliateLinks.createPartner({ code, name, logoUrl: logoUrl || undefined });
    setCode("");
    setName("");
    setLogoUrl("");
    setPartners(await backend.affiliateLinks.listPartners());
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex gap-sm items-end">
        <label className="flex flex-col text-label-xs">
          Code
          <input
            className="border rounded px-2 py-1"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="amazon-ae"
          />
        </label>
        <label className="flex flex-col text-label-xs">
          Name
          <input
            className="border rounded px-2 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Amazon UAE"
          />
        </label>
        <label className="flex flex-col text-label-xs flex-1">
          Logo URL
          <input
            className="border rounded px-2 py-1"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>
        <button
          onClick={submit}
          className="px-3 py-2 rounded bg-primary text-on-primary text-label-sm font-bold"
          data-testid="affiliate-partner-create"
        >
          Add
        </button>
      </div>
      <table className="w-full text-body-sm">
        <thead>
          <tr className="text-left text-label-xs uppercase tracking-widest text-on-surface-variant">
            <th className="py-2">Code</th>
            <th className="py-2">Name</th>
            <th className="py-2">Logo</th>
          </tr>
        </thead>
        <tbody>
          {partners.map((p) => (
            <tr key={p.code} className="border-t border-surface-container-high">
              <td className="py-2 font-mono">{p.code}</td>
              <td className="py-2">{p.name}</td>
              <td className="py-2 truncate max-w-xs">{p.logoUrl ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {partners.length === 0 ? (
        <div className="text-body-sm text-on-surface-variant">
          No partners yet. Add one above.
        </div>
      ) : null}
    </div>
  );
}

function LinksView({ backend }: { backend: ReturnType<typeof useApp>["phase2Backend"] }) {
  const [listingId, setListingId] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [links, setLinks] = useState<AffiliateLinkRecord[] | null>(null);
  const [partners, setPartners] = useState<PartnerRecord[]>([]);

  useEffect(() => {
    if (!backend) return;
    backend.affiliateLinks.listPartners().then(setPartners).catch(() => setPartners([]));
  }, [backend]);

  async function load() {
    if (!backend || !listingId) return;
    setLinks(await backend.affiliateLinks.listLinksForListing(listingId));
  }

  async function submit() {
    if (!backend || !listingId || !partnerCode || !affiliateUrl) return;
    await backend.affiliateLinks.createLink({ listingId, partnerCode, affiliateUrl });
    setAffiliateUrl("");
    await load();
  }

  if (!backend) return <div>Admin services unavailable.</div>;

  return (
    <div className="flex flex-col gap-md">
      <div className="flex gap-sm items-end flex-wrap">
        <label className="flex flex-col text-label-xs">
          Listing ID
          <input
            className="border rounded px-2 py-1"
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            placeholder="uuid"
          />
        </label>
        <button
          onClick={load}
          className="px-3 py-2 rounded border text-label-sm font-bold"
        >
          Load
        </button>
      </div>
      <div className="flex gap-sm items-end flex-wrap">
        <label className="flex flex-col text-label-xs">
          Partner
          <select
            className="border rounded px-2 py-1"
            value={partnerCode}
            onChange={(e) => setPartnerCode(e.target.value)}
          >
            <option value="">-</option>
            {partners.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-label-xs flex-1">
          Affiliate URL
          <input
            className="border rounded px-2 py-1"
            value={affiliateUrl}
            onChange={(e) => setAffiliateUrl(e.target.value)}
            placeholder="https://www.amazon.ae/dp/B0XYZ?tag=mooday-21"
          />
        </label>
        <button
          onClick={submit}
          className="px-3 py-2 rounded bg-primary text-on-primary text-label-sm font-bold"
          data-testid="affiliate-link-create"
        >
          Add link
        </button>
      </div>
      {links === null ? null : links.length === 0 ? (
        <div className="text-body-sm text-on-surface-variant">
          No links for this listing.
        </div>
      ) : (
        <table className="w-full text-body-sm">
          <thead>
            <tr className="text-left text-label-xs uppercase tracking-widest text-on-surface-variant">
              <th className="py-2">Partner</th>
              <th className="py-2">Short ID</th>
              <th className="py-2">URL</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.id} className="border-t border-surface-container-high">
                <td className="py-2">{l.partnerCode}</td>
                <td className="py-2 font-mono">
                  <a href={`/go/${l.shortId}`} target="_blank" rel="noopener noreferrer">
                    {l.shortId}
                  </a>
                </td>
                <td className="py-2 truncate max-w-xs">{l.affiliateUrl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ReportsView({ backend }: { backend: ReturnType<typeof useApp>["phase2Backend"] }) {
  const [reports, setReports] = useState<Reports | null>(null);

  useEffect(() => {
    if (!backend) return;
    const to = new Date();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    backend.affiliateClicks
      .aggregateForReports({ fromIso: from.toISOString(), toIso: to.toISOString() })
      .then(setReports)
      .catch(() => setReports({ byPartner: [], byListing: [], totalClicks: 0 }));
  }, [backend]);

  if (!backend) return <div>Admin services unavailable.</div>;
  if (reports === null) return <div>Loading reports...</div>;

  return (
    <div className="flex flex-col gap-md">
      <div className="text-title-sm font-bold">Last 30 days</div>
      <div>
        <div className="text-label-xs uppercase tracking-widest text-on-surface-variant mb-1">
          Total clicks
        </div>
        <div className="text-headline-sm font-bold">{reports.totalClicks}</div>
      </div>
      <div>
        <div className="text-label-xs uppercase tracking-widest text-on-surface-variant mb-1">
          By partner
        </div>
        <ul className="text-body-sm">
          {reports.byPartner.length === 0 ? (
            <li className="text-on-surface-variant">No clicks yet.</li>
          ) : (
            reports.byPartner.map((p) => (
              <li key={p.partnerCode} className="flex justify-between border-t border-surface-container-high py-1">
                <span className="font-mono">{p.partnerCode}</span>
                <span>{p.clicks}</span>
              </li>
            ))
          )}
        </ul>
      </div>
      <div>
        <div className="text-label-xs uppercase tracking-widest text-on-surface-variant mb-1">
          Top listings
        </div>
        <ul className="text-body-sm">
          {reports.byListing.length === 0 ? (
            <li className="text-on-surface-variant">No clicks yet.</li>
          ) : (
            reports.byListing.map((l) => (
              <li key={l.listingId} className="flex justify-between border-t border-surface-container-high py-1">
                <span className="font-mono truncate max-w-xs">{l.listingId}</span>
                <span>{l.clicks}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
