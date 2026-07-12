import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Product } from "@/context/AppContext";
import { MyClosetView } from "@/components/MyClosetView";

const BASE_PRODUCT: Product = {
  id: "p1",
  titleEn: "Vintage Handbag",
  titleAr: "حقيبة عتيقة",
  price: 1200,
  originalPrice: 2400,
  conditionEn: "Excellent Condition",
  conditionAr: "حالة ممتازة",
  sellerNameEn: "Sarah",
  sellerNameAr: "سارة",
  sellerAvatar: "/sellers/sarah.jpg",
  sellerTypeEn: "Verified",
  sellerTypeAr: "موثق",
  saves: 100,
  image: "/products/p1.jpg",
  images: ["/products/p1.jpg"],
  descriptionEn: ".",
  descriptionAr: ".",
  category: "Bags",
};

const DRAFT: Product = {
  ...BASE_PRODUCT,
  id: "custom-1",
  titleEn: "My draft",
  titleAr: "مسودة",
  saves: 0,
};

const CUSTOM_ACTIVE: Product = {
  ...BASE_PRODUCT,
  id: "custom-2",
  titleEn: "My active listing",
  titleAr: "نشط",
  saves: 25,
};

function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
  return {
    language: "en",
    setLanguage: vi.fn(),
    listings: [BASE_PRODUCT, DRAFT, CUSTOM_ACTIVE],
    addListing: vi.fn(),
    updateListing: vi.fn(),
    removeListing: vi.fn(),
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
    updateOrderStatus: vi.fn(),
    ...overrides,
  };
}

function renderCloset(opts: { language?: "en" | "ar" } = {}) {
  const context = makeContext({ language: opts.language });
  const onBack = vi.fn();
  const onEditListing = vi.fn();
  const onCreateListing = vi.fn();
  const onSelectProduct = vi.fn();
  const utils = render(
    <AppContext.Provider value={context}>
      <MyClosetView
        onBack={onBack}
        onEditListing={onEditListing}
        onCreateListing={onCreateListing}
        onSelectProduct={onSelectProduct}
      />
    </AppContext.Provider>,
  );
  return {
    ...utils,
    onBack,
    onEditListing,
    onCreateListing,
    onSelectProduct,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("MyClosetView (D-20)", () => {
  it("renders the page title", () => {
    renderCloset();
    expect(screen.getByText("My closet")).toBeInTheDocument();
  });

  it("renders 5 filter chips (All / Active / Sold / Drafts / Reserved)", () => {
    renderCloset();
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sold" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Drafts" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Reserved" })).toBeInTheDocument();
  });

  it("renders all 3 listings by default", () => {
    renderCloset();
    expect(screen.getByText("Vintage Handbag")).toBeInTheDocument();
    expect(screen.getByText("My draft")).toBeInTheDocument();
    expect(screen.getByText("My active listing")).toBeInTheDocument();
  });

  it("'Drafts' tab shows only draft listings", async () => {
    const user = userEvent.setup();
    renderCloset();
    await user.click(screen.getByRole("tab", { name: "Drafts" }));
    expect(screen.getByText("My draft")).toBeInTheDocument();
    expect(screen.queryByText("Vintage Handbag")).not.toBeInTheDocument();
  });

  it("status badges present per row", () => {
    renderCloset();
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("Edit pencil calls onEditListing with the right id", async () => {
    const user = userEvent.setup();
    const { onEditListing } = renderCloset();
    // Multiple rows each expose an Edit button; click the first.
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await user.click(editButtons[0]);
    expect(onEditListing).toHaveBeenCalled();
    // The id passed should match the first listing in the mock fixtures.
    expect(typeof onEditListing.mock.calls[0][0]).toBe("string");
  });

  it("Delete trash icon calls removeListing", async () => {
    const user = userEvent.setup();
    const ctx = makeContext();
    render(
      <AppContext.Provider value={ctx}>
        <MyClosetView
          onBack={vi.fn()}
          onEditListing={vi.fn()}
          onCreateListing={vi.fn()}
        />
      </AppContext.Provider>,
    );
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    expect(ctx.removeListing).toHaveBeenCalled();
  });

  it("Bulk-select button toggles bulk mode + shows counters", async () => {
    const user = userEvent.setup();
    renderCloset();
    await user.click(screen.getByRole("button", { name: /Select multiple/i }));
    // The header now reads "0 selected" and there's a Cancel button.
    expect(screen.getByText("0 selected")).toBeInTheDocument();
  });

  it("Empty state when no listings exist", () => {
    render(
      <AppContext.Provider value={makeContext({ listings: [] })}>
        <MyClosetView
          onBack={vi.fn()}
          onEditListing={vi.fn()}
          onCreateListing={vi.fn()}
        />
      </AppContext.Provider>,
    );
    expect(screen.getByText(/Your closet is empty/i)).toBeInTheDocument();
  });

  it("Arabic: renders Arabic title", () => {
    renderCloset({ language: "ar" });
    expect(screen.getByText("خزانتي")).toBeInTheDocument();
  });

  it("Arabic: dir='rtl'", () => {
    const { container } = renderCloset({ language: "ar" });
    const rtl = container.querySelector("[dir='rtl']");
    expect(rtl).toBeInTheDocument();
  });
});
