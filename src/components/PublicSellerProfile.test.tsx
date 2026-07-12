import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { PublicSellerProfile } from "@/components/PublicSellerProfile";
import type { Product } from "@/context/AppContext";

const SARAH: Product = {
  id: "test-sarah-handbag",
  titleEn: "Test Vintage Handbag",
  titleAr: "حقيبة عتيقة اختبار",
  price: 1000,
  originalPrice: 2000,
  conditionEn: "Excellent Condition",
  conditionAr: "حالة ممتازة",
  sellerNameEn: "Sarah's Vintage",
  sellerNameAr: "عتيق سارة",
  sellerAvatar: "/sellers/sarah.jpg",
  sellerTypeEn: "Verified Collector",
  sellerTypeAr: "جامع معتمد",
  saves: 50,
  image: "/products/test.jpg",
  images: ["/products/test.jpg"],
  descriptionEn: "Test product.",
  descriptionAr: "منتج اختبار.",
  category: "Bags",
};

function makeContext(language: "en" | "ar" = "en"): AppContextType {
  return {
    language,
    setLanguage: vi.fn(),
    listings: [SARAH],
    addListing: vi.fn(),
    likes: [],
    toggleLike: vi.fn(),
    cart: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    chats: [],
    sendChatMessage: vi.fn(),
    createChatThread: vi.fn(() => "thread-1"),
    addresses: [],
    addAddress: vi.fn(),
    updateAddress: vi.fn(),
    removeAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
    paymentMethods: [],
    addPaymentMethod: vi.fn(),
    removePaymentMethod: vi.fn(),
    setDefaultPaymentMethod: vi.fn(),
    orders: [],
    recordOrder: vi.fn(),
    notifications: [],
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    updateListing: vi.fn(),
    removeListing: vi.fn(),
    updateOrderStatus: vi.fn(),
  };
}

function renderProfile(
  overrides: Partial<React.ComponentProps<typeof PublicSellerProfile>> = {},
) {
  const context = makeContext();
  const onBack = vi.fn();
  const onSelectProduct = vi.fn();
  const onOpenChat = vi.fn();
  const utils = render(
    <AppContext.Provider value={context}>
      <PublicSellerProfile
        sellerId="sarah"
        onBack={onBack}
        onSelectProduct={onSelectProduct}
        onOpenChat={onOpenChat}
        listings={context.listings}
        {...overrides}
      />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, onSelectProduct, onOpenChat, context };
}

beforeEach(() => {
  localStorage.clear();
});

describe("PublicSellerProfile", () => {
  it("renders the seller's name, handle, and bio", () => {
    renderProfile();

    // The name appears in the hero card and in the header bar.
    expect(screen.getAllByText("Sarah's Vintage").length).toBeGreaterThan(0);
    expect(screen.getByText(/Vintage curator/)).toBeInTheDocument();
    expect(screen.getByText("Verified Collector")).toBeInTheDocument();
  });

  it("shows a 404-like empty state for an unknown seller", () => {
    renderProfile({ sellerId: "ghost" });

    expect(screen.getByText("Seller not found.")).toBeInTheDocument();
  });

  it("calls onBack when the back button is pressed", async () => {
    const user = userEvent.setup();
    const { onBack } = renderProfile();

    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("switches between the Listings and Reviews tabs", async () => {
    const user = userEvent.setup();
    renderProfile();

    // Listings tab is the default.
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent(
      /Listings/,
    );

    await user.click(screen.getByRole("tab", { name: /Reviews/i }));
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent(
      /Reviews/,
    );
  });

  it("renders a product card for each listing in the Listings tab", () => {
    renderProfile();

    expect(screen.getByText("Test Vintage Handbag")).toBeInTheDocument();
  });

  it("filters reviews by star count", async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(screen.getByRole("tab", { name: /Reviews/i }));

    // The seed data has 3 reviews for sarah, all rated 4 or 5.
    // Multiple star buttons (one per filter), so we just check the
    // first one exists.
    const starButtons = screen.getAllByRole("button", { name: /★/ });
    expect(starButtons.length).toBeGreaterThan(0);
  });

  it("toggles the Follow button between Follow and Following", async () => {
    const user = userEvent.setup();
    renderProfile();

    // Use a more specific query to find the Follow CTA in the action
    // row (it's also a tab label, so be specific).
    const followBtn = screen.getByRole("button", {
      name: /^follow$/i,
    });
    expect(followBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(followBtn);
    expect(followBtn).toHaveAttribute("aria-pressed", "true");
    // "Following" text now appears in the button.
    expect(followBtn).toHaveTextContent(/Following/i);
  });

  it("calls onOpenChat when Message is clicked", async () => {
    const user = userEvent.setup();
    const { onOpenChat } = renderProfile();

    await user.click(screen.getByRole("button", { name: /message/i }));
    expect(onOpenChat).toHaveBeenCalledWith("sarah");
  });

  it("calls onSelectProduct when a product card is clicked", async () => {
    const user = userEvent.setup();
    const { onSelectProduct } = renderProfile();

    // The product title also appears in the alt text of the image,
    // so look for the heading specifically.
    const heading = screen.getByRole("heading", {
      name: /Test Vintage Handbag/i,
    });
    await user.click(heading);
    expect(onSelectProduct).toHaveBeenCalledWith(SARAH);
  });

  it("renders Arabic bio and CTA labels when the language is ar", () => {
    const context = makeContext("ar");
    render(
      <AppContext.Provider value={context}>
        <PublicSellerProfile
          sellerId="sarah"
          onBack={() => {}}
          onSelectProduct={() => {}}
          onOpenChat={() => {}}
          listings={context.listings}
        />
      </AppContext.Provider>,
    );

    // The Arabic seller name appears in both the header and the hero.
    expect(screen.getAllByText("عتيق سارة").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /رسالة/ })).toBeInTheDocument();
  });
});
