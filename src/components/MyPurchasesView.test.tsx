import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Order } from "@/data/orders";
import { MyPurchasesView } from "@/components/MyPurchasesView";

const ORDER_DELIVERED: Order = {
  id: "ord-1000",
  dateOrdered: "2024-12-01T10:00:00.000Z",
  status: "delivered",
  lineItems: [
    {
      product: {
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
      },
      quantity: 1,
      priceAtPurchase: 1200,
    },
  ],
  addressCityEn: "Dubai",
  addressCityAr: "دبي",
  addressStreetEn: "Villa 24",
  addressStreetAr: "فيلا 24",
  paymentBrandEn: "Visa",
  paymentBrandAr: "فيزا",
  paymentLast4: "4242",
  subtotal: 1200,
  shipping: 0,
  total: 1200,
  courier: {
    nameEn: "Aramex",
    nameAr: "أرامكس",
    trackingNumber: "ARMX-1",
  },
  timeline: [
    {
      status: "processing",
      date: "2024-12-01T10:00:00.000Z",
      descriptionEn: "Order placed.",
      descriptionAr: "تم تسجيل الطلب.",
    },
  ],
};

const ORDER_SHIPPED: Order = {
  ...ORDER_DELIVERED,
  id: "ord-1001",
  status: "shipped",
};

const ORDER_PROCESSING: Order = {
  ...ORDER_DELIVERED,
  id: "ord-1002",
  status: "processing",
};

const ORDER_CANCELLED: Order = {
  ...ORDER_DELIVERED,
  id: "ord-1003",
  status: "cancelled",
};

const ORDERS: Order[] = [
  ORDER_DELIVERED,
  ORDER_SHIPPED,
  ORDER_PROCESSING,
  ORDER_CANCELLED,
];

function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
  return {
    language: "en",
    setLanguage: vi.fn(),
    listings: [],
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
    orders: ORDERS,
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

function renderPurchases(opts: { language?: "en" | "ar" } = {}) {
  const context = makeContext({ language: opts.language });
  const onBack = vi.fn();
  const onOpenOrder = vi.fn();
  const utils = render(
    <AppContext.Provider value={context}>
      <MyPurchasesView onBack={onBack} onOpenOrder={onOpenOrder} />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, onOpenOrder };
}

beforeEach(() => {
  localStorage.clear();
});

describe("MyPurchasesView (C-16)", () => {
  it("renders the page title in EN", () => {
    renderPurchases();
    expect(screen.getByText("My purchases")).toBeInTheDocument();
  });

  it("renders the page title in AR", () => {
    renderPurchases({ language: "ar" });
    expect(screen.getByText("مشترياتي")).toBeInTheDocument();
  });

  it("renders a back button with aria-label", () => {
    renderPurchases();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("renders 4 filter chips (All / Active / Completed / Cancelled)", () => {
    renderPurchases();
    const tablist = screen.getByRole("tablist", {
      name: /Order filters/i,
    });
    expect(
      within(tablist).getByRole("tab", { name: "All" }),
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: "Active" }),
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: "Completed" }),
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: "Cancelled" }),
    ).toBeInTheDocument();
  });

  it("renders all 4 orders by default (filter=all)", () => {
    renderPurchases();
    // The Vintage Handbag appears for each of the 4 orders.
    expect(screen.getAllByText("Vintage Handbag")).toHaveLength(4);
  });

  it("'Active' filter shows only processing + shipped", async () => {
    const user = userEvent.setup();
    renderPurchases();
    await user.click(screen.getByRole("tab", { name: "Active" }));
    // Still 2 visible (shipped + processing).
    expect(screen.getAllByText("Vintage Handbag")).toHaveLength(2);
  });

  it("'Completed' filter shows only delivered", async () => {
    const user = userEvent.setup();
    renderPurchases();
    await user.click(screen.getByRole("tab", { name: "Completed" }));
    expect(screen.getAllByText("Vintage Handbag")).toHaveLength(1);
  });

  it("'Cancelled' filter shows only cancelled orders", async () => {
    const user = userEvent.setup();
    renderPurchases();
    await user.click(screen.getByRole("tab", { name: "Cancelled" }));
    expect(screen.getAllByText("Vintage Handbag")).toHaveLength(1);
  });

  it("renders the status badge for each order", () => {
    renderPurchases();
    // Each status label appears once as a tab + at least once as a
    // card badge; assert presence via getAllByText.
    expect(screen.getAllByText("Delivered").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Shipped").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Processing").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Cancelled").length).toBeGreaterThanOrEqual(1);
  });

  it("clicking an order card calls onOpenOrder with the order id", async () => {
    const user = userEvent.setup();
    const { onOpenOrder } = renderPurchases();
    // Find any of the order cards.
    await user.click(
      screen.getByRole("button", {
        name: /Delivered — Vintage Handbag/i,
      }),
    );
    expect(onOpenOrder).toHaveBeenCalledWith("ord-1000");
  });

  it("renders the empty state when no orders exist", () => {
    render(
      <AppContext.Provider value={makeContext({ orders: [] })}>
        <MyPurchasesView onBack={vi.fn()} onOpenOrder={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText(/Nothing here yet/i)).toBeInTheDocument();
  });

  it("Arabic: renders Arabic status labels", () => {
    renderPurchases({ language: "ar" });
    expect(screen.getByText("تم التسليم")).toBeInTheDocument();
    expect(screen.getByText("تم الشحن")).toBeInTheDocument();
  });

  it("sets dir='rtl' on the root container when language is AR", () => {
    const { container } = renderPurchases({ language: "ar" });
    expect(container.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

import { within } from "@testing-library/react";
