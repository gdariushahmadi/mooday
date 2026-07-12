import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { DiscoverFeedView } from "@/components/DiscoverFeedView";
import type { Product } from "@/context/AppContext";

const HAND: Product = {
  id: "handbag-tan",
  titleEn: "Vintage Handbag",
  titleAr: "حقيبة عتيقة",
  price: 1250,
  originalPrice: 2500,
  conditionEn: "Excellent Condition",
  conditionAr: "حالة ممتازة",
  sellerNameEn: "Sarah's Vintage",
  sellerNameAr: "عتيق سارة",
  sellerAvatar: "/sellers/sarah.jpg",
  sellerTypeEn: "Verified Collector",
  sellerTypeAr: "جامع معتمد",
  saves: 432,
  image: "/products/handbag-tan.jpg",
  images: ["/products/handbag-tan.jpg"],
  descriptionEn: "A vintage handbag.",
  descriptionAr: "حقيبة عتيقة.",
  category: "Bags",
};

const SHOES: Product = {
  ...HAND,
  id: "batch2-red-sole-heels",
  titleEn: "Red Sole Heels",
  titleAr: "كعب أحمر",
  price: 1800,
  originalPrice: 3500,
  sellerNameEn: "Hana Luxe",
  sellerNameAr: "هنا لوكس",
  sellerAvatar: "/sellers/hana.jpg",
  sellerTypeEn: "Luxury Reseller",
  sellerTypeAr: "بائع فاخر",
  saves: 50,
  category: "Shoes",
};

const DRESS: Product = {
  ...HAND,
  id: "batch2-floral-maxi-dress",
  titleEn: "Floral Maxi Dress",
  titleAr: "فستان ماكسي مزهر",
  price: 600,
  originalPrice: 1200,
  sellerNameEn: "Maha Wardrobe",
  sellerNameAr: "خزانة مها",
  sellerAvatar: "/sellers/maha.jpg",
  sellerTypeEn: "Verified Closet",
  sellerTypeAr: "خزانة معتمدة",
  saves: 100,
  category: "Dresses",
};

const ALL: Product[] = [HAND, SHOES, DRESS];

function makeContext(language: "en" | "ar" = "en"): AppContextType {
  return {
    language,
    setLanguage: vi.fn(),
    listings: ALL,
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
    createChatThread: vi.fn(() => "t1"),
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

function renderDiscover(
  overrides: { language?: "en" | "ar"; initialUrl?: string } = {},
) {
  if (overrides.initialUrl) {
    window.history.pushState({}, "", overrides.initialUrl);
  }
  const context = makeContext(overrides.language);
  const onSelectProduct = vi.fn();
  const utils = render(
    <AppContext.Provider value={context}>
      <DiscoverFeedView
        onSelectProduct={onSelectProduct}
        onNavigate={() => {}}
      />
    </AppContext.Provider>,
  );
  return { ...utils, onSelectProduct, context };
}

function visibleProductTitles(): string[] {
  // Returns the order of product titles currently visible in the
  // feed panel (the tabpanel). The Categories h2 lives in a separate
  // section above and is excluded.
  const panel = document.getElementById("discover-feed-panel");
  if (!panel) return [];
  return Array.from(panel.querySelectorAll("article h2, article h4")).map(
    (el) => el.textContent ?? "",
  );
}

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
});

describe("DiscoverFeedView — tabs", () => {
  it("renders all four tab labels in EN", () => {
    renderDiscover();
    const tablist = screen.getByRole("tablist", { name: /discover tabs/i });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveTextContent("For You");
    expect(tabs[1]).toHaveTextContent("Trending");
    expect(tabs[2]).toHaveTextContent("Designers");
    expect(tabs[3]).toHaveTextContent("New In");
  });

  it("renders all four tab labels in AR", () => {
    renderDiscover({ language: "ar" });
    const tablist = screen.getByRole("tablist", { name: /تبويبات الاكتشاف/ });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs[0]).toHaveTextContent("لكِ");
    expect(tabs[1]).toHaveTextContent("الرائج");
    expect(tabs[2]).toHaveTextContent("المصممون");
    expect(tabs[3]).toHaveTextContent("وصل حديثاً");
  });

  it("defaults to For You with aria-selected=true", () => {
    renderDiscover();
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
  });

  it("Clicking Trending sorts the list by saves desc", async () => {
    const user = userEvent.setup();
    renderDiscover();

    await user.click(screen.getByRole("tab", { name: /trending/i }));

    // Featured view is the default; the first product should be the
    // highest-saves listing (HAND, 432 saves).
    const titles = visibleProductTitles();
    expect(titles[0]).toContain("Vintage Handbag");
  });

  it("Clicking New In puts batch2- ids first", async () => {
    const user = userEvent.setup();
    renderDiscover();

    await user.click(screen.getByRole("tab", { name: /new in/i }));

    // Both SHOES and DRESS are batch2-, so they should come before HAND.
    // Within batch2, sorts by saves desc: DRESS (100) before SHOES (50).
    const titles = visibleProductTitles();
    const floralIdx = titles.findIndex((t) => t.includes("Floral Maxi"));
    const heelsIdx = titles.findIndex((t) => t.includes("Red Sole"));
    const handbagIdx = titles.findIndex((t) => t.includes("Vintage Handbag"));
    expect(floralIdx).toBeGreaterThanOrEqual(0);
    expect(floralIdx).toBeLessThan(handbagIdx);
    expect(heelsIdx).toBeLessThan(handbagIdx);
  });

  it("Clicking Designers groups listings under seller headings", async () => {
    const user = userEvent.setup();
    renderDiscover();

    await user.click(screen.getByRole("tab", { name: /designers/i }));

    // Each unique seller name appears as a section heading.
    expect(
      screen.getByRole("heading", { name: /Sarah's Vintage/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Hana Luxe/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Maha Wardrobe/ }),
    ).toBeInTheDocument();
  });

  it("hides the category bar on the Designers tab", async () => {
    const user = userEvent.setup();
    renderDiscover();

    // Before switching, the Categories section exists.
    expect(
      screen.getByText(/Categories/i, { selector: "h2" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /designers/i }));

    // The "Categories" h2 is gone (the section was hidden).
    expect(
      screen.queryByText(/Categories/i, { selector: "h2" }),
    ).not.toBeInTheDocument();
  });

  it("Reflects the active tab in the URL", async () => {
    const user = userEvent.setup();
    renderDiscover();

    await user.click(screen.getByRole("tab", { name: /trending/i }));
    expect(window.location.search).toContain("tab=trending");

    await user.click(screen.getByRole("tab", { name: /designers/i }));
    expect(window.location.search).toContain("tab=designers");
  });

  it("Removing tab param when switching back to For You", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/?tab=trending");

    renderDiscover();

    await user.click(screen.getByRole("tab", { name: /for you/i }));
    expect(window.location.search).not.toContain("tab=");
  });

  it("Honours ?tab= on initial render", () => {
    renderDiscover({ initialUrl: "/?tab=newin" });
    const tabs = screen.getAllByRole("tab");
    expect(tabs[3]).toHaveAttribute("aria-selected", "true");
  });

  it("Falls back to For You for an unknown ?tab= value", () => {
    renderDiscover({ initialUrl: "/?tab=invalid" });
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });
});
