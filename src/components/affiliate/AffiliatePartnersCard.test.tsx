import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { AffiliatePartnersCard } from "@/components/affiliate/AffiliatePartnersCard";

describe("AffiliatePartnersCard", () => {
  it("shows active partner links for a mock listing", async () => {
    const context = {
      language: "en",
      phase2Backend: null,
    } as unknown as AppContextType;

    render(
      <AppContext.Provider value={context}>
        <AffiliatePartnersCard listingId="handbag-tan" />
      </AppContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("affiliate-partners-card")).toBeInTheDocument();
    });
    expect(screen.getByText("Amazon UAE")).toBeInTheDocument();
    expect(screen.getByText("noon UAE")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open partner store: Amazon UAE/i }),
    ).toHaveAttribute("href", "/go/bagNew01");
  });

  it("does not render an empty card for a listing without links", async () => {
    const context = {
      language: "en",
      phase2Backend: null,
    } as unknown as AppContextType;

    render(
      <AppContext.Provider value={context}>
        <AffiliatePartnersCard listingId="listing-without-affiliate" />
      </AppContext.Provider>,
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Checking partner stores..."),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId("affiliate-partners-card")).not.toBeInTheDocument();
  });
});
