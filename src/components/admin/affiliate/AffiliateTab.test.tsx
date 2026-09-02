import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AffiliateTab } from "@/components/admin/affiliate/AffiliateTab";
import { resetMockAffiliateService } from "@/services/affiliate/mockAffiliateService";

describe("AffiliateTab", () => {
  beforeEach(() => {
    resetMockAffiliateService();
  });

  it("exposes partners, links, and click reports in demo mode", async () => {
    render(<AffiliateTab mode="demo" />);

    await waitFor(() => {
      expect(screen.getByText("Amazon UAE")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("affiliate-subtab-links"));
    await waitFor(() => {
      const previews = screen.getAllByRole("link", { name: "Open preview" });
      expect(previews[0]).toHaveAttribute("href", "/go/bagNew01");
    });
    expect(screen.getAllByText("Open preview")).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("link", { name: "Open preview" })[0]);

    fireEvent.click(screen.getByTestId("affiliate-subtab-reports"));
    await waitFor(() => {
      expect(screen.getByText("Total clicks")).toBeInTheDocument();
    });
    expect(screen.getByText("6")).toBeInTheDocument();
  });
});
