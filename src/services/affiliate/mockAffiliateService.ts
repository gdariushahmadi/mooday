import {
  DEFAULT_AFFILIATE_CLICKS,
  DEFAULT_AFFILIATE_LINKS,
  DEFAULT_AFFILIATE_PARTNERS,
} from "@/data/affiliate";
import type {
  AffiliateClickService,
  AffiliateLinkRecord,
  AffiliateLinkService,
  AffiliateReportRange,
  AffiliateReportSummary,
  PartnerRecord,
} from "@/services/backend/contracts";

const clone = <T>(value: T): T => structuredClone(value);

let partners = clone(DEFAULT_AFFILIATE_PARTNERS);
let links = clone(DEFAULT_AFFILIATE_LINKS);
let clicks = clone(DEFAULT_AFFILIATE_CLICKS);

function requireHttpsUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Affiliate URLs must be valid HTTPS links.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Affiliate URLs must use HTTPS.");
  }
  return parsed.toString();
}

function nextShortId(): string {
  return "demo" + Date.now().toString(36).slice(-8);
}

function addDemoClickAudit(link: AffiliateLinkRecord): void {
  clicks = [
    ...clicks,
    {
      id: "aff-click-" + Date.now(),
      shortId: link.shortId,
      listingId: link.listingId,
      partnerCode: link.partnerCode,
      userId: null,
      anonId: "demo-session",
      clickedAt: new Date().toISOString(),
    },
  ];
}

export const mockAffiliateLinkService: AffiliateLinkService = {
  async listPartners(includeInactive = false): Promise<PartnerRecord[]> {
    return clone(
      partners
        .filter((partner) => includeInactive || partner.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    );
  },

  async listLinksForListing(
    listingId: string,
    includeInactive = false,
  ): Promise<AffiliateLinkRecord[]> {
    return clone(
      links
        .filter(
          (link) =>
            link.listingId === listingId &&
            (includeInactive || link.isActive),
        )
        .sort((a, b) => a.displayOrder - b.displayOrder),
    );
  },

  async createPartner(input): Promise<PartnerRecord> {
    const code = input.code.trim().toLowerCase();
    const name = input.name.trim();
    if (!/^[a-z0-9-]{2,40}$/.test(code)) {
      throw new Error(
        "Partner code must use 2-40 lowercase letters, numbers, or hyphens.",
      );
    }
    if (!name) throw new Error("Partner name is required.");
    if (partners.some((partner) => partner.code === code)) {
      throw new Error("This partner code already exists.");
    }
    const partner: PartnerRecord = {
      code,
      name,
      logoUrl: input.logoUrl?.trim() || null,
      baseUrlTemplate: input.baseUrlTemplate?.trim() || null,
      displayOrder: input.displayOrder ?? partners.length + 1,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    partners = [...partners, partner];
    return clone(partner);
  },

  async updatePartner(code, patch): Promise<void> {
    partners = partners.map((partner) =>
      partner.code === code
        ? {
            ...partner,
            ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
            ...(patch.logoUrl !== undefined ? { logoUrl: patch.logoUrl } : {}),
            ...(patch.baseUrlTemplate !== undefined
              ? { baseUrlTemplate: patch.baseUrlTemplate }
              : {}),
            ...(patch.displayOrder !== undefined
              ? { displayOrder: patch.displayOrder }
              : {}),
            ...(patch.isActive !== undefined
              ? { isActive: patch.isActive }
              : {}),
          }
        : partner,
    );
  },

  async deletePartner(code): Promise<void> {
    if (links.some((link) => link.partnerCode === code)) {
      throw new Error("Remove this partner's links before deleting the partner.");
    }
    partners = partners.filter((partner) => partner.code !== code);
  },

  async createLink(input): Promise<AffiliateLinkRecord> {
    const partner = partners.find(
      (candidate) => candidate.code === input.partnerCode && candidate.isActive,
    );
    if (!partner) throw new Error("Select an active partner.");
    const affiliateUrl = requireHttpsUrl(input.affiliateUrl.trim());
    if (!input.listingId.trim()) throw new Error("Select a listing.");
    const link: AffiliateLinkRecord = {
      id: "aff-link-" + Date.now(),
      shortId: nextShortId(),
      listingId: input.listingId,
      partnerCode: input.partnerCode,
      affiliateUrl,
      displayOrder: input.displayOrder ?? 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    links = [...links, link];
    return clone(link);
  },

  async updateLink(id, patch): Promise<void> {
    links = links.map((link) =>
      link.id === id
        ? {
            ...link,
            ...(patch.affiliateUrl !== undefined
              ? { affiliateUrl: requireHttpsUrl(patch.affiliateUrl.trim()) }
              : {}),
            ...(patch.displayOrder !== undefined
              ? { displayOrder: patch.displayOrder }
              : {}),
            ...(patch.isActive !== undefined
              ? { isActive: patch.isActive }
              : {}),
          }
        : link,
    );
  },

  async removeLink(id): Promise<void> {
    links = links.filter((link) => link.id !== id);
  },
};

export const mockAffiliateClickService: AffiliateClickService = {
  async recordClick(input): Promise<void> {
    clicks = [
      ...clicks,
      {
        id: "aff-click-" + Date.now(),
        shortId: input.shortId,
        listingId: input.listingId,
        partnerCode: input.partnerCode,
        userId: input.userId,
        anonId: input.anonId,
        clickedAt: new Date().toISOString(),
      },
    ];
  },

  async aggregateForReports(
    range: AffiliateReportRange,
  ): Promise<AffiliateReportSummary> {
    const from = new Date(range.fromIso).getTime();
    const to = new Date(range.toIso).getTime();
    const inRange = clicks.filter((click) => {
      const time = new Date(click.clickedAt).getTime();
      return time >= from && time <= to;
    });
    const byPartner = new Map<string, number>();
    const byListing = new Map<string, number>();
    for (const click of inRange) {
      byPartner.set(
        click.partnerCode,
        (byPartner.get(click.partnerCode) ?? 0) + 1,
      );
      byListing.set(
        click.listingId,
        (byListing.get(click.listingId) ?? 0) + 1,
      );
    }
    return {
      byPartner: Array.from(byPartner.entries())
        .map(([partnerCode, count]) => ({ partnerCode, clicks: count }))
        .sort((a, b) => b.clicks - a.clicks),
      byListing: Array.from(byListing.entries())
        .map(([listingId, count]) => ({ listingId, clicks: count }))
        .sort((a, b) => b.clicks - a.clicks),
      totalClicks: inRange.length,
    };
  },
};

export const mockAffiliateService = {
  ...mockAffiliateLinkService,
  ...mockAffiliateClickService,
};

export function resetMockAffiliateService(): void {
  partners = clone(DEFAULT_AFFILIATE_PARTNERS);
  links = clone(DEFAULT_AFFILIATE_LINKS);
  clicks = clone(DEFAULT_AFFILIATE_CLICKS);
}

/**
 * The redirect route runs outside the browser bundle. It uses the seeded
 * rows for a reliable demo link and this helper records a click in the
 * server process when the route is used in local development.
 */
export function recordMockAffiliateClick(shortId: string): void {
  const link = links.find((candidate) => candidate.shortId === shortId);
  if (link) addDemoClickAudit(link);
}

export function getMockAffiliateLink(
  shortId: string,
): AffiliateLinkRecord | null {
  const link = links.find(
    (candidate) => candidate.shortId === shortId && candidate.isActive,
  );
  return link ? clone(link) : null;
}
