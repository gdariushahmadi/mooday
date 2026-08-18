import type {
  PartnerRecord,
  AffiliateLinkRecord,
  AffiliateClickRecord,
} from "./contracts";

export interface PartnerRow {
  code: string;
  name: string;
  logo_url: string | null;
  base_url_template: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface AffiliateLinkRow {
  id: string;
  short_id: string;
  listing_id: string;
  partner_code: string;
  affiliate_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface AffiliateClickRow {
  id: string;
  short_id: string;
  listing_id: string;
  partner_code: string;
  user_id: string | null;
  anon_id: string | null;
  clicked_at: string;
}

export function toPartnerRecord(row: PartnerRow): PartnerRecord {
  return {
    code: row.code,
    name: row.name,
    logoUrl: row.logo_url,
    baseUrlTemplate: row.base_url_template,
    isActive: row.is_active,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

export function toAffiliateLinkRecord(row: AffiliateLinkRow): AffiliateLinkRecord {
  return {
    id: row.id,
    shortId: row.short_id,
    listingId: row.listing_id,
    partnerCode: row.partner_code,
    affiliateUrl: row.affiliate_url,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function toAffiliateClickRecord(row: AffiliateClickRow): AffiliateClickRecord {
  return {
    id: row.id,
    shortId: row.short_id,
    listingId: row.listing_id,
    partnerCode: row.partner_code,
    userId: row.user_id,
    anonId: row.anon_id,
    clickedAt: row.clicked_at,
  };
}
