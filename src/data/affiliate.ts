import type {
  AffiliateClickRecord,
  AffiliateLinkRecord,
  PartnerRecord,
} from "@/services/backend/contracts";

/**
 * Demo rows for the affiliate flow. These rows are deliberately easy to
 * recognise in a client review. The same partner and link shape is used by
 * the Supabase adapter.
 */
export const DEFAULT_AFFILIATE_PARTNERS: PartnerRecord[] = [
  {
    code: "amazon-ae",
    name: "Amazon UAE",
    logoUrl: null,
    baseUrlTemplate: "https://www.amazon.ae/",
    isActive: true,
    displayOrder: 1,
    createdAt: "2026-08-01T09:00:00.000Z",
  },
  {
    code: "noon-ae",
    name: "noon UAE",
    logoUrl: null,
    baseUrlTemplate: "https://www.noon.com/uae-en/",
    isActive: true,
    displayOrder: 2,
    createdAt: "2026-08-02T09:00:00.000Z",
  },
  {
    code: "farfetch-demo",
    name: "FARFETCH",
    logoUrl: null,
    baseUrlTemplate: "https://www.farfetch.com/ae/",
    isActive: false,
    displayOrder: 3,
    createdAt: "2026-08-03T09:00:00.000Z",
  },
];

export const DEFAULT_AFFILIATE_LINKS: AffiliateLinkRecord[] = [
  {
    id: "aff-link-handbag-amazon",
    shortId: "bagNew01",
    listingId: "handbag-tan",
    partnerCode: "amazon-ae",
    affiliateUrl:
      "https://www.amazon.ae/s?k=tan+leather+handbag&tag=daneg-demo-21",
    displayOrder: 1,
    isActive: true,
    createdAt: "2026-08-05T10:00:00.000Z",
  },
  {
    id: "aff-link-handbag-noon",
    shortId: "bagNew02",
    listingId: "handbag-tan",
    partnerCode: "noon-ae",
    affiliateUrl:
      "https://www.noon.com/uae-en/search?q=leather%20handbag&utm_source=daneg-demo",
    displayOrder: 2,
    isActive: true,
    createdAt: "2026-08-05T10:30:00.000Z",
  },
  {
    id: "aff-link-abaya-amazon",
    shortId: "abaya001",
    listingId: "emerald-evening-abaya",
    partnerCode: "amazon-ae",
    affiliateUrl:
      "https://www.amazon.ae/s?k=emerald+abaya&tag=daneg-demo-21",
    displayOrder: 1,
    isActive: true,
    createdAt: "2026-08-06T10:00:00.000Z",
  },
  {
    id: "aff-link-heels-noon",
    shortId: "heels001",
    listingId: "red-sole-heels",
    partnerCode: "noon-ae",
    affiliateUrl:
      "https://www.noon.com/uae-en/search?q=black%20stiletto%20heels&utm_source=daneg-demo",
    displayOrder: 1,
    isActive: true,
    createdAt: "2026-08-06T10:30:00.000Z",
  },
];

export const DEFAULT_AFFILIATE_CLICKS: AffiliateClickRecord[] = [
  {
    id: "aff-click-1",
    shortId: "bagNew01",
    listingId: "handbag-tan",
    partnerCode: "amazon-ae",
    userId: null,
    anonId: "demo-anon-1",
    clickedAt: "2026-08-28T10:20:00.000Z",
  },
  {
    id: "aff-click-2",
    shortId: "bagNew01",
    listingId: "handbag-tan",
    partnerCode: "amazon-ae",
    userId: null,
    anonId: "demo-anon-2",
    clickedAt: "2026-08-27T13:40:00.000Z",
  },
  {
    id: "aff-click-3",
    shortId: "bagNew02",
    listingId: "handbag-tan",
    partnerCode: "noon-ae",
    userId: null,
    anonId: "demo-anon-3",
    clickedAt: "2026-08-26T09:10:00.000Z",
  },
  {
    id: "aff-click-4",
    shortId: "abaya001",
    listingId: "emerald-evening-abaya",
    partnerCode: "amazon-ae",
    userId: null,
    anonId: "demo-anon-4",
    clickedAt: "2026-08-24T16:05:00.000Z",
  },
  {
    id: "aff-click-5",
    shortId: "heels001",
    listingId: "red-sole-heels",
    partnerCode: "noon-ae",
    userId: null,
    anonId: "demo-anon-5",
    clickedAt: "2026-08-20T11:15:00.000Z",
  },
];
