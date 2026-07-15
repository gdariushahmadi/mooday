import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { SearchFiltersView } from "@/components/SearchFiltersView";
import type { Product } from "@/context/AppContext";

const PRODUCTS: Product[] = [
  {
    id: "p1",
    titleEn: "Red Evening Dress",
    titleAr: "فستان سهرة أحمر",
    price: 800,
    originalPrice: 1600,
    conditionEn: "New with Tags",
    conditionAr: "جديد بالملصقات",
    sellerNameEn: "Sarah",
    sellerNameAr: "سارة",
    sellerAvatar: "/sellers/sarah.jpg",
    sellerTypeEn: "Verified",
    sellerTypeAr: "موثق",
    saves: 100,
    image: "/products/p1.jpg",
    images: ["/products/p1.jpg"],
    descriptionEn: "A red dress.",
    descriptionAr: "فستان أحمر.",
    category: "Dresses",
    size: "S",
    colorEn: "Red",
    colorAr: "أحمر",
    mode: "resell",
  },
  {
    id: "p2",
    titleEn: "Black Leather Handbag",
    titleAr: "حقيبة جلد أسود",
    price: 1200,
    originalPrice: 2400,
    conditionEn: "Excellent Condition",
    conditionAr: "حالة ممتازة",
    sellerNameEn: "Hana",
    sellerNameAr: "هنا",
    sellerAvatar: "/sellers/hana.jpg",
    sellerTypeEn: "Luxury",
    sellerTypeAr: "فاخر",
    saves: 200,
    image: "/products/p2.jpg",
    images: ["/products/p2.jpg"],
    descriptionEn: "A black bag.",
    descriptionAr: "حقيبة سوداء.",
    category: "Bags",
    size: "OS",
    colorEn: "Black",
    colorAr: "أسود",
    mode: "resell",
  },
  {
    id: "p3",
    titleEn: "Navy Silk Scarf",
    titleAr: "وشاح حرير كحلي",
    price: 300,
    originalPrice: 600,
    conditionEn: "Gently Used",
    conditionAr: "مستعمل خفيف",
    sellerNameEn: "Layla",
    sellerNameAr: "ليلى",
    sellerAvatar: "/sellers/layla.jpg",
    sellerTypeEn: "Verified",
    sellerTypeAr: "موثق",
    saves: 50,
    image: "/products/p3.jpg",
    images: ["/products/p3.jpg"],
    descriptionEn: "A navy scarf.",
    descriptionAr: "وشاح كحلي.",
    category: "Accessories",
    size: "OS",
    colorEn: "Navy",
    colorAr: "كحلي",
    mode: "resell",
  },
];

function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
  return {
    language: "en",
    setLanguage: vi.fn(),
    listings: PRODUCTS,
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
    userProfile: { fullNameEn: "Test User", fullNameAr: "مستخدم اختبار", handle: "@test", avatar: "/sellers/test.jpg", bioEn: "Test bio", bioAr: "نبذة", locationEn: "Dubai", locationAr: "دبي", styleTagsEn: [], styleTagsAr: [], rating: 5, reviewsCount: 0, followers: 0, following: 0 },
    updateUserProfile: vi.fn(),
    myReviews: [],
    addMyReview: vi.fn(),
    blockedUsers: [],
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
    reports: [],
    submitReport: vi.fn(),
    disputes: [],
    openDispute: vi.fn(),
    updateListing: vi.fn(),
    removeListing: vi.fn(),
    updateOrderStatus: vi.fn(),
    currentUser: null,
    authError: null,
    signUp: vi.fn(() => "user-test"),
    signIn: vi.fn(() => true),
    signOut: vi.fn(),
    verifyOtp: vi.fn(() => true),
    sendOtp: vi.fn(() => "000000"),
    updateCurrentUserName: vi.fn(),
    resetPassword: vi.fn(() => true),
    ...overrides,
  };
}

function renderSearch() {
  const context = makeContext();
  const onSelectProduct = vi.fn();
  const utils = render(
    <AppContext.Provider value={context}>
      <SearchFiltersView onSelectProduct={onSelectProduct} onBack={() => {}} />
    </AppContext.Provider>,
  );
  return { ...utils, onSelectProduct, context };
}

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
});

describe("SearchFiltersView", () => {
  it("keeps results visible by default and opens the complete mobile filter surface on demand", async () => {
    const user = userEvent.setup();
    renderSearch();

    const panel = document.getElementById("search-filters-panel");
    expect(panel).toHaveClass("hidden");
    expect(screen.getByText("Red Evening Dress")).toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /show filters/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);

    expect(panel).toHaveClass("flex");
    expect(
      screen.getByRole("button", { name: /hide filters/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("renders all six filter section headings", () => {
    renderSearch();

    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("Item Condition")).toBeInTheDocument();
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText("Colour")).toBeInTheDocument();
    expect(screen.getByText("Price Range")).toBeInTheDocument();
    expect(screen.getByText("Listing Mode")).toBeInTheDocument();
  });

  it("shows all products by default", () => {
    renderSearch();

    expect(screen.getByText(/Found 3 items/)).toBeInTheDocument();
  });

  it("filters by category", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole("button", { name: /^Bags$/ }));

    expect(screen.getByText(/Found 1 item/)).toBeInTheDocument();
    expect(screen.getByText("Black Leather Handbag")).toBeInTheDocument();
  });

  it("shows active filters and removes one without resetting the rest", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole("button", { name: /^Bags$/ }));
    await user.click(screen.getByRole("button", { name: /^OS$/ }));

    const toggle = screen.getByRole("button", { name: /show filters/i });
    expect(toggle).toHaveTextContent("2");

    const activeFilters = screen.getByLabelText("Filters");
    await user.click(within(activeFilters).getByRole("button", { name: "Bags" }));

    expect(screen.getByText(/Found 2 items/)).toBeInTheDocument();
    expect(toggle).toHaveTextContent("1");
    expect(within(activeFilters).getByRole("button", { name: "OS" })).toBeInTheDocument();
  });

  it("restores valid shared filters and discards invalid or deferred URL state", async () => {
    window.history.pushState(
      {},
      "",
      "/?view=search&cat=Bags&size=OS&mode=rent&sort=unknown",
    );

    renderSearch();

    expect(screen.getByText(/Found 1 item/)).toBeInTheDocument();
    expect(screen.getByText("Black Leather Handbag")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /All/i })).toBeChecked();
    expect(screen.getByRole("combobox", { name: /sort by/i })).toHaveValue(
      "relevance",
    );

    await waitFor(() => {
      expect(window.location.search).toContain("cat=Bags");
      expect(window.location.search).toContain("size=OS");
      expect(window.location.search).not.toContain("mode=rent");
      expect(window.location.search).not.toContain("sort=unknown");
    });
  });

  it("filters by condition", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole("button", { name: /Gently Used/i }));

    expect(screen.getByText(/Found 1 item/)).toBeInTheDocument();
    expect(screen.getByText("Navy Silk Scarf")).toBeInTheDocument();
  });

  it("filters by size (multi-select)", async () => {
    const user = userEvent.setup();
    renderSearch();

    // Click "S" — should narrow to the red dress (size S).
    await user.click(screen.getByRole("button", { name: /^S$/ }));

    expect(screen.getByText(/Found 1 item/)).toBeInTheDocument();
    expect(screen.getByText("Red Evening Dress")).toBeInTheDocument();
  });

  it("size multi-select: selecting two sizes shows both", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole("button", { name: /^S$/ }));
    await user.click(screen.getByRole("button", { name: /^OS$/ }));

    expect(screen.getByText(/Found 3 items/)).toBeInTheDocument();
  });

  it("filters by colour", async () => {
    const user = userEvent.setup();
    renderSearch();

    // The colour button has an aria-label of "Black" (the colour name).
    // Use a more specific selector to avoid matching the product title.
    const colourButtons = screen.getAllByRole("button", { name: /^Black$/i });
    // The colour button is the one inside the Colour filter section.
    const colourBtn = colourButtons.find((btn) =>
      btn.closest("div")?.querySelector("[style*=background-color]"),
    );
    expect(colourBtn).toBeTruthy();
    await user.click(colourBtn!);

    expect(screen.getByText(/Found 1 item/)).toBeInTheDocument();
    expect(screen.getByText("Black Leather Handbag")).toBeInTheDocument();
  });

  it("filters by price range (max only)", async () => {
    const user = userEvent.setup();
    renderSearch();

    const maxInput = screen.getByPlaceholderText("∞");
    await user.type(maxInput, "500");

    expect(screen.getByText(/Found 1 item/)).toBeInTheDocument();
    expect(screen.getByText("Navy Silk Scarf")).toBeInTheDocument();
  });

  it("filters by price preset (Under 500)", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole("button", { name: /< 500/i }));

    expect(screen.getByText(/Found 1 item/)).toBeInTheDocument();
  });

  it("sorts by price ascending", async () => {
    const user = userEvent.setup();
    renderSearch();

    const sortSelect = screen.getByRole("combobox", { name: /sort by/i });
    await user.selectOptions(sortSelect, "priceAsc");

    // The cheapest (Navy Silk Scarf, 300) should be the first product card.
    const productNames = screen.getAllByText(
      /Red Evening|Black Leather|Navy Silk/,
    );
    expect(productNames[0]).toHaveTextContent("Navy Silk Scarf");
  });

  it("sorts by price descending", async () => {
    const user = userEvent.setup();
    renderSearch();

    const sortSelect = screen.getByRole("combobox", { name: /sort by/i });
    await user.selectOptions(sortSelect, "priceDesc");

    const productNames = screen.getAllByText(
      /Red Evening|Black Leather|Navy Silk/,
    );
    expect(productNames[0]).toHaveTextContent("Black Leather Handbag");
  });

  it("Clear all resets every filter", async () => {
    const user = userEvent.setup();
    renderSearch();

    // Apply a filter.
    await user.click(screen.getByRole("button", { name: /^Bags$/ }));
    expect(screen.getByText(/Found 1 item/)).toBeInTheDocument();

    // Clear all.
    await user.click(
      screen.getByRole("button", { name: /clear all filters/i }),
    );

    expect(screen.getByText(/Found 3 items/)).toBeInTheDocument();
  });

  it("debounces the search query", async () => {
    const user = userEvent.setup();
    renderSearch();

    const input = screen.getByPlaceholderText(/Search for bags/i);
    await user.type(input, "red");

    // Before debounce fires, the result count should still be 3.
    expect(screen.getByText(/Found 3 items/)).toBeInTheDocument();

    // After 300ms debounce, it narrows.
    await waitFor(() => {
      expect(screen.getByText(/Found 1 item/)).toBeInTheDocument();
    });
  });

  it("Rent mode is disabled", () => {
    renderSearch();

    const rentRadio = screen.getByRole("radio", { name: /Rent/i });
    expect(rentRadio).toBeDisabled();
  });

  it("shows empty state when no results", async () => {
    const user = userEvent.setup();
    renderSearch();

    const input = screen.getByPlaceholderText(/Search for bags/i);
    await user.type(input, "nonexistent");

    await waitFor(() => {
      expect(screen.getByText(/couldn't find any items/i)).toBeInTheDocument();
    });
  });

  it("renders Arabic filter labels", () => {
    const context = makeContext();
    context.language = "ar";

    render(
      <AppContext.Provider value={context}>
        <SearchFiltersView onSelectProduct={() => {}} onBack={() => {}} />
      </AppContext.Provider>,
    );

    expect(screen.getByText("الفئات")).toBeInTheDocument();
    expect(screen.getByText("اللون")).toBeInTheDocument();
  });
});
