import { describe, expect, it } from "vitest";
import {
  toPartnerRecord,
  toAffiliateLinkRecord,
  toAffiliateClickRecord,
} from "./mappers-affiliate";

describe("affiliate mappers", () => {
  it("toPartnerRecord maps snake_case DB rows to camelCase records", () => {
    const record = toPartnerRecord({
      code: "amazon-ae",
      name: "Amazon UAE",
      logo_url: "https://example.com/a.png",
      base_url_template: "https://example.com/{id}",
      is_active: true,
      display_order: 10,
      created_at: "2026-08-18T00:00:00Z",
    });
    expect(record).toEqual({
      code: "amazon-ae",
      name: "Amazon UAE",
      logoUrl: "https://example.com/a.png",
      baseUrlTemplate: "https://example.com/{id}",
      isActive: true,
      displayOrder: 10,
      createdAt: "2026-08-18T00:00:00Z",
    });
  });

  it("toPartnerRecord handles null logo and base url", () => {
    const record = toPartnerRecord({
      code: "noon-ae",
      name: "Noon UAE",
      logo_url: null,
      base_url_template: null,
      is_active: true,
      display_order: 0,
      created_at: "2026-08-18T00:00:00Z",
    });
    expect(record.logoUrl).toBeNull();
    expect(record.baseUrlTemplate).toBeNull();
  });

  it("toAffiliateLinkRecord maps snake_case DB rows to camelCase records", () => {
    const record = toAffiliateLinkRecord({
      id: "11111111-1111-4111-9111-111111111111",
      short_id: "abc12345",
      listing_id: "L1",
      partner_code: "amazon-ae",
      affiliate_url: "https://www.amazon.ae/dp/B0XYZ",
      display_order: 5,
      is_active: true,
      created_at: "2026-08-18T00:00:00Z",
    });
    expect(record).toEqual({
      id: "11111111-1111-4111-9111-111111111111",
      shortId: "abc12345",
      listingId: "L1",
      partnerCode: "amazon-ae",
      affiliateUrl: "https://www.amazon.ae/dp/B0XYZ",
      displayOrder: 5,
      isActive: true,
      createdAt: "2026-08-18T00:00:00Z",
    });
  });

  it("toAffiliateClickRecord maps snake_case DB rows to camelCase records", () => {
    const record = toAffiliateClickRecord({
      id: "22222222-2222-4222-9222-222222222222",
      short_id: "abc12345",
      listing_id: "L1",
      partner_code: "amazon-ae",
      user_id: "user-1",
      anon_id: "anon-uuid",
      clicked_at: "2026-08-18T00:00:00Z",
    });
    expect(record).toEqual({
      id: "22222222-2222-4222-9222-222222222222",
      shortId: "abc12345",
      listingId: "L1",
      partnerCode: "amazon-ae",
      userId: "user-1",
      anonId: "anon-uuid",
      clickedAt: "2026-08-18T00:00:00Z",
    });
  });

  it("toAffiliateClickRecord handles nullable user_id and anon_id", () => {
    const record = toAffiliateClickRecord({
      id: "33333333-3333-4333-9333-333333333333",
      short_id: "abc12345",
      listing_id: "L1",
      partner_code: "amazon-ae",
      user_id: null,
      anon_id: null,
      clicked_at: "2026-08-18T00:00:00Z",
    });
    expect(record.userId).toBeNull();
    expect(record.anonId).toBeNull();
  });
});
