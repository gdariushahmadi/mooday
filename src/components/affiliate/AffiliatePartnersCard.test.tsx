import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

const mockListLinks = vi.fn();
const mockListPartners = vi.fn();

vi.mock("@/context/AppContext", () => ({
  useApp: () => ({
    phase2Backend: {
      affiliateLinks: {
        listLinksForListing: mockListLinks,
        listPartners: mockListPartners,
      },
      affiliateClicks: {
        recordClick: vi.fn(),
        aggregateForReports: vi.fn(),
      },
    },
  }),
}));

describe("AffiliatePartnersCard", () => {
  it("renders nothing while loading", async () => {
    mockListLinks.mockReturnValue(new Promise(() => {}));
    mockListPartners.mockReturnValue(new Promise(() => {}));
    const { AffiliatePartnersCard } = await import(
      "./AffiliatePartnersCard"
    );
    const { container } = render(<AffiliatePartnersCard listingId="L1" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when listing has no links", async () => {
    mockListLinks.mockResolvedValue([]);
    mockListPartners.mockResolvedValue([]);
    const { AffiliatePartnersCard } = await import(
      "./AffiliatePartnersCard"
    );
    const { container } = render(<AffiliatePartnersCard listingId="L1" />);
    await waitFor(() => {
      expect(container.querySelector("[data-testid='affiliate-partners-card']"))
        .toBeNull();
    });
  });

  it("renders one button per active link with /go/{shortId} href", async () => {
    mockListLinks.mockResolvedValue([
      {
        id: "link-1",
        shortId: "abc12345",
        listingId: "L1",
        partnerCode: "amazon-ae",
        affiliateUrl: "https://www.amazon.ae/dp/B0XYZ",
        displayOrder: 0,
        isActive: true,
        createdAt: "2026-08-18T00:00:00Z",
      },
    ]);
    mockListPartners.mockResolvedValue([
      {
        code: "amazon-ae",
        name: "Amazon UAE",
        logoUrl: null,
        baseUrlTemplate: null,
        isActive: true,
        displayOrder: 0,
        createdAt: "2026-08-18T00:00:00Z",
      },
    ]);
    const { AffiliatePartnersCard } = await import(
      "./AffiliatePartnersCard"
    );
    const { container } = render(<AffiliatePartnersCard listingId="L1" />);
    await waitFor(() => {
      const link = container.querySelector(
        "[data-testid='affiliate-partner-link-amazon-ae']"
      );
      expect(link).not.toBeNull();
      expect(link?.getAttribute("href")).toBe("/go/abc12345");
      expect(link?.getAttribute("target")).toBe("_blank");
      expect(link?.getAttribute("rel")).toBe("noopener noreferrer nofollow");
    });
  });
});
