import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthenticityBadge } from "@/components/AuthenticityBadge";
import { TrustBadges } from "@/components/TrustBadges";

describe("DANEG trust surfaces", () => {
  it("renders the three trust signals", () => {
    render(<TrustBadges />);

    expect(screen.getByText("Verified Seller")).toBeInTheDocument();
    expect(screen.getByText("Authenticity")).toBeInTheDocument();
    expect(screen.getByText("Secure Payment")).toBeInTheDocument();
  });

  it("shows tier-specific authenticity detail on demand", async () => {
    const user = userEvent.setup();
    render(<AuthenticityBadge tier="in_review" brand="Chanel" />);

    const badge = screen.getByRole("button", { name: /In review: Chanel/i });
    expect(badge).toHaveAttribute("aria-expanded", "false");
    await user.click(badge);

    expect(badge).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/reviewing the seller's authenticity documents/i),
    ).toBeInTheDocument();
  });
});

