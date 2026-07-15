import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Product } from "@/context/AppContext";
import { CategoryLandingView } from "@/components/CategoryLandingView";
import type { CategorySort } from "@/hooks/useAppNavigation";

const PRODUCTS: Product[] = [
  {
    id: "p-bag-hand-1",
    titleEn: "Vintage Leather Handbag",
    titleAr: "حقيبة يد جلدية عتيقة",
    price: 1200,
    originalPrice: 2400,
    conditionEn: "Excellent Condition",
    conditionAr: "حالة ممتازة",
    sellerNameEn: "Sarah",
    sellerNameAr: "سارة",
    sellerAvatar: "/sellers/sarah.jpg",
    sellerTypeEn: "Luxury",
    sellerTypeAr: "فاخر",
    saves: 500,
    image: "/products/p1.jpg",
    images: ["/products/p1.jpg"],
    descriptionEn: "A vintage bag.",
    descriptionAr: "حقيبة عتيقة.",
    category: "Bags",
    size: "OS",
    colorEn: "Tan",
    colorAr: "بني",
    mode: "resell",
  },
  {
    id: "p-bag-clutch-1",
    titleEn: "Evening Clutch",
    titleAr: "كلاتش سهرة",
    price: 400,
    originalPrice: 800,
    conditionEn: "Excellent Condition",
    conditionAr: "حالة ممتازة",
    sellerNameEn: "Hana",
    sellerNameAr: "هنا",
    sellerAvatar: "/sellers/hana.jpg",
    sellerTypeEn: "Luxury",
    sellerTypeAr: "فاخر",
    saves: 100,
    image: "/products/p2.jpg",
    images: ["/products/p2.jpg"],
    descriptionEn: "An evening clutch.",
    descriptionAr: "كلاتش سهرة.",
    category: "Bags",
    size: "OS",
    colorEn: "Black",
    colorAr: "أسود",
    mode: "resell",
  },
  {
    id: "p-bag-backpack-1",
    titleEn: "Saffiano Backpack",
    titleAr: "حقيبة ظهر سافيانو",
    price: 900,
    originalPrice: 1800,
    conditionEn: "New with Tags",
    conditionAr: "جديد بالملصقات",
    sellerNameEn: "Layla",
    sellerNameAr: "ليلى",
    sellerAvatar: "/sellers/layla.jpg",
    sellerTypeEn: "Verified",
    sellerTypeAr: "موثق",
    saves: 250,
    image: "/products/p3.jpg",
    images: ["/products/p3.jpg"],
    descriptionEn: "A backpack.",
    descriptionAr: "حقيبة ظهر.",
    category: "Bags",
    size: "OS",
    colorEn: "Red",
    colorAr: "أحمر",
    mode: "resell",
  },
  {
    id: "p-dress-1",
    titleEn: "Red Evening Dress",
    titleAr: "فستان سهرة أحمر",
    price: 800,
    originalPrice: 1600,
    conditionEn: "Excellent Condition",
    conditionAr: "حالة ممتازة",
    sellerNameEn: "Sarah",
    sellerNameAr: "سارة",
    sellerAvatar: "/sellers/sarah.jpg",
    sellerTypeEn: "Verified",
    sellerTypeAr: "موثق",
    saves: 300,
    image: "/products/p4.jpg",
    images: ["/products/p4.jpg"],
    descriptionEn: "A red dress.",
    descriptionAr: "فستان أحمر.",
    category: "Dresses",
    size: "S",
    colorEn: "Red",
    colorAr: "أحمر",
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

interface RenderOpts {
  category?: string;
  subCategory?: string | null;
  sort?: CategorySort;
  language?: "en" | "ar";
}

function renderView(opts: RenderOpts = {}) {
  const {
    category = "Bags",
    subCategory = null,
    sort = "newest",
    language = "en",
  } = opts;
  const context = makeContext({ language });
  const onBack = vi.fn();
  const onSelectProduct = vi.fn();
  const onSubCategoryChange = vi.fn();
  const onSortChange = vi.fn();

  const utils = render(
    <AppContext.Provider value={context}>
      <CategoryLandingView
        category={category}
        subCategory={subCategory}
        sort={sort}
        listings={PRODUCTS}
        onSubCategoryChange={onSubCategoryChange}
        onSortChange={onSortChange}
        onBack={onBack}
        onSelectProduct={onSelectProduct}
      />
    </AppContext.Provider>,
  );

  return {
    ...utils,
    onBack,
    onSelectProduct,
    onSubCategoryChange,
    onSortChange,
  };
}

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
});

describe("CategoryLandingView", () => {
  it("renders the English category title in the header", () => {
    renderView({ category: "Bags" });
    // The category name appears twice (header h1 + hero tag). Use getAllByText.
    const matches = screen.getAllByText("Bags");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the Arabic category title in the header", () => {
    renderView({ category: "Bags", language: "ar" });
    // Arabic title for "Bags" is "حقائب".
    const matches = screen.getAllByText("حقائب");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders a Back button with aria-label in EN", () => {
    renderView({ category: "Bags" });
    // Use a precise match — product titles containing "Backpack" would
    // otherwise collide via role/aria-label text content.
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("renders a Back button with aria-label in AR", () => {
    renderView({ category: "Bags", language: "ar" });
    expect(screen.getByRole("button", { name: "رجوع" })).toBeInTheDocument();
  });

  it("renders sub-category chips derived from the data", () => {
    renderView({ category: "Bags" });
    // The 3 bags above produce 3 sub-categories: Handbags, Clutches,
    // Backpacks (via title keyword detection).
    const tablist = screen.getByRole("tablist", {
      name: /sub-categories/i,
    });
    expect(tablist).toBeInTheDocument();
    // "All" chip is always present.
    expect(within(tablist).getByRole("tab", { name: /^All$/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("tapping a sub-category chip filters the grid and calls the callback", async () => {
    const user = userEvent.setup();
    const { onSubCategoryChange } = renderView({ category: "Bags" });

    // Find the Handbags chip via role=tab and matching name.
    const tablist = screen.getByRole("tablist", {
      name: /sub-categories/i,
    });
    const handbagChip = within(tablist).getByRole("tab", {
      name: /Handbags/i,
    });
    await user.click(handbagChip);

    expect(onSubCategoryChange).toHaveBeenCalledWith("Handbags");
  });

  it("filters the product list to the active sub-category", () => {
    // Render directly with subCategory="Clutches" to verify the filter.
    renderView({ category: "Bags", subCategory: "Clutches" });

    // Only the evening clutch card should be visible.
    expect(screen.getByText("Evening Clutch")).toBeInTheDocument();
    // Other bag types should NOT be visible.
    expect(
      screen.queryByText("Vintage Leather Handbag"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Saffiano Backpack")).not.toBeInTheDocument();
  });

  it("'All' chip (subCategory=null) shows the full category set", () => {
    renderView({ category: "Bags", subCategory: null });

    // All three bag products should be visible.
    expect(screen.getByText("Vintage Leather Handbag")).toBeInTheDocument();
    expect(screen.getByText("Evening Clutch")).toBeInTheDocument();
    expect(screen.getByText("Saffiano Backpack")).toBeInTheDocument();
  });

  it("renders with subCategory=Handbags as the initial filter", () => {
    renderView({ category: "Bags", subCategory: "Handbags" });

    // Handbag product shows.
    expect(screen.getByText("Vintage Leather Handbag")).toBeInTheDocument();
    // Clutch and backpack do NOT show.
    expect(screen.queryByText("Evening Clutch")).not.toBeInTheDocument();
    expect(screen.queryByText("Saffiano Backpack")).not.toBeInTheDocument();
  });

  it("changing the sort dropdown fires onSortChange", async () => {
    const user = userEvent.setup();
    const { onSortChange } = renderView({ category: "Bags" });

    const select = screen.getByRole("combobox", { name: /sort/i });
    await user.selectOptions(select, "price-asc");

    expect(onSortChange).toHaveBeenCalledWith("price-asc");
  });

  it("sort=newest orders batch2-/custom- ids first (when present)", () => {
    // Add a batch2 item to the listings.
    const batch2Product: Product = {
      ...PRODUCTS[0],
      id: "batch2-p1",
      titleEn: "Newer Handbag",
      titleAr: "حقيبة جديدة",
      price: 1100,
      originalPrice: 2400,
    };
    render(
      <AppContext.Provider
        value={makeContext({ listings: [batch2Product, ...PRODUCTS] })}
      >
        <CategoryLandingView
          category="Bags"
          subCategory={null}
          sort="newest"
          listings={[batch2Product, ...PRODUCTS]}
          onSubCategoryChange={() => {}}
          onSortChange={() => {}}
          onBack={() => {}}
          onSelectProduct={() => {}}
        />
      </AppContext.Provider>,
    );

    // The batch2 product should appear before the others in the grid.
    const headings = screen.getAllByRole("heading", { level: 4 });
    expect(headings[0]).toHaveTextContent("Newer Handbag");
  });

  it("shows the result count reflecting the filtered set", () => {
    renderView({ category: "Bags" });
    expect(screen.getByText(/3 items/)).toBeInTheDocument();
  });

  it("shows the empty state when the active sub-category has no matches", () => {
    renderView({ category: "Bags", subCategory: "DoesNotExist" });
    expect(screen.getByText(/Nothing here yet/i)).toBeInTheDocument();
    // The empty CTA should be present.
    expect(screen.getByText(/Browse all/i)).toBeInTheDocument();
  });

  it("clicking the empty CTA resets the sub-category", async () => {
    const user = userEvent.setup();
    const { onSubCategoryChange } = renderView({
      category: "Bags",
      subCategory: "DoesNotExist",
    });

    await user.click(screen.getByRole("button", { name: /Browse all/i }));

    expect(onSubCategoryChange).toHaveBeenCalledWith(null);
  });

  it("calls onBack when the back button is pressed", async () => {
    const user = userEvent.setup();
    const { onBack } = renderView({ category: "Bags" });

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("clicking a product card calls onSelectProduct", async () => {
    const user = userEvent.setup();
    const { onSelectProduct } = renderView({ category: "Bags" });

    // The handbag card title.
    await user.click(screen.getByText(/Vintage Leather Handbag/));

    expect(onSelectProduct).toHaveBeenCalledTimes(1);
    expect(onSelectProduct.mock.calls[0][0]).toMatchObject({
      id: "p-bag-hand-1",
    });
  });

  it("sets dir='rtl' on the root container when language is AR", () => {
    const { container } = renderView({ category: "Bags", language: "ar" });
    const root = container.querySelector("[dir='rtl']");
    expect(root).toBeInTheDocument();
  });

  it("does not include products from other categories", () => {
    renderView({ category: "Bags" });
    // The dress is not in the Bags category.
    expect(screen.queryByText(/Red Evening Dress/)).not.toBeInTheDocument();
  });
});

// Re-derive the common testing utility function for aria-role queries.
import { within } from "@testing-library/react";
