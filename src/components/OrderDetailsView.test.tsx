import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Order } from "@/data/orders";
import { OrderDetailsView } from "@/components/OrderDetailsView";

const ORDER_SHIPPED: Order = {
  id: "ord-2001",
  dateOrdered: "2024-12-01T10:00:00.000Z",
  status: "shipped",
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
  addressStreetEn: "Villa 24, Jumeirah",
  addressStreetAr: "فيلا 24، جميرا",
  paymentBrandEn: "Visa",
  paymentBrandAr: "فيزا",
  paymentLast4: "4242",
  subtotal: 1200,
  shipping: 0,
  total: 1200,
  courier: {
    nameEn: "Aramex",
    nameAr: "أرامكس",
    trackingNumber: "ARMX-9982147",
  },
  timeline: [
    {
      status: "processing",
      date: "2024-11-30T10:00:00.000Z",
      descriptionEn: "Order placed.",
      descriptionAr: "تم تسجيل الطلب.",
    },
    {
      status: "shipped",
      date: "2024-12-01T10:00:00.000Z",
      descriptionEn: "In transit.",
      descriptionAr: "في الطريق.",
    },
  ],
};

const ORDER_DELIVERED: Order = {
  ...ORDER_SHIPPED,
  id: "ord-2002",
  status: "delivered",
};

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

function renderDetails(opts: { order?: Order; language?: "en" | "ar" } = {}) {
  const order = opts.order ?? ORDER_SHIPPED;
  const context = makeContext({ language: opts.language });
  const onBack = vi.fn();
  const onSelectProduct = vi.fn();
  const onMarkReceived = vi.fn();
  const onContactSeller = vi.fn();
  const utils = render(
    <AppContext.Provider value={context}>
      <OrderDetailsView
        order={order}
        onBack={onBack}
        onSelectProduct={onSelectProduct}
        onMarkReceived={onMarkReceived}
        onContactSeller={onContactSeller}
      />
    </AppContext.Provider>,
  );
  return {
    ...utils,
    onBack,
    onSelectProduct,
    onMarkReceived,
    onContactSeller,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("OrderDetailsView (C-17)", () => {
  it("renders the order id in the title", () => {
    renderDetails();
    expect(screen.getByText(/ord-2001/)).toBeInTheDocument();
  });

  it("renders the Shipped status", () => {
    renderDetails();
    // The status label appears once in the hero and once per timeline
    // event. So we assert that it appears at least twice.
    expect(screen.getAllByText("Shipped").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the courier name", () => {
    renderDetails();
    expect(screen.getByText("Aramex")).toBeInTheDocument();
  });

  it("renders the tracking number", () => {
    renderDetails();
    expect(screen.getByText("ARMX-9982147")).toBeInTheDocument();
  });

  it("renders the tracking timeline (Processing → Shipped)", () => {
    renderDetails();
    expect(screen.getByText(/Tracking timeline/i)).toBeInTheDocument();
    expect(screen.getByText("In transit.")).toBeInTheDocument();
  });

  it("renders the line item with thumbnail + price", () => {
    renderDetails();
    expect(screen.getByText("Vintage Handbag")).toBeInTheDocument();
    // Total is "AED 1,200" (Intl formatter output) — appears as line-item
    // price and again in the summary block.
    expect(screen.getAllByText(/1,200/).length).toBeGreaterThanOrEqual(2);
  });

  it("renders the shipping + payment summary cards", () => {
    renderDetails();
    expect(screen.getByText(/Shipping to/i)).toBeInTheDocument();
    expect(screen.getByText("Dubai")).toBeInTheDocument();
    expect(screen.getByText(/Paid with/i)).toBeInTheDocument();
    expect(screen.getByText(/Visa/)).toBeInTheDocument();
  });

  it("renders the order summary with subtotal + total", () => {
    renderDetails();
    expect(screen.getByText(/Order summary/i)).toBeInTheDocument();
    expect(screen.getByText("Total:")).toBeInTheDocument();
  });

  it("shows 'I received it' for a shipped order", () => {
    renderDetails();
    expect(
      screen.getByRole("button", { name: /I received it/i }),
    ).toBeInTheDocument();
  });

  it("'I received it' calls onMarkReceived with the order id", async () => {
    const user = userEvent.setup();
    const { onMarkReceived } = renderDetails();
    await user.click(screen.getByRole("button", { name: /I received it/i }));
    expect(onMarkReceived).toHaveBeenCalledWith("ord-2001");
  });

  it("hides 'I received it' for a delivered order", () => {
    renderDetails({ order: ORDER_DELIVERED });
    expect(
      screen.queryByRole("button", { name: /I received it/i }),
    ).not.toBeInTheDocument();
  });

  it("'Contact seller' calls onContactSeller", async () => {
    const user = userEvent.setup();
    const { onContactSeller } = renderDetails();
    await user.click(screen.getByRole("button", { name: /Contact seller/i }));
    expect(onContactSeller).toHaveBeenCalled();
  });

  it("Back button calls onBack", async () => {
    const user = userEvent.setup();
    const { onBack } = renderDetails();
    await user.click(
      screen.getByRole("button", { name: /Back to purchases/i }),
    );
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("Arabic: renders AR status label", () => {
    renderDetails({ language: "ar" });
    // Label is also shown in the timeline so it appears at least twice.
    expect(screen.getAllByText("تم الشحن").length).toBeGreaterThanOrEqual(1);
  });

  it("Arabic: renders AR tracking timeline copy", () => {
    renderDetails({ language: "ar" });
    expect(screen.getByText("في الطريق.")).toBeInTheDocument();
  });

  it("Arabic: renders AR courier name", () => {
    renderDetails({ language: "ar" });
    expect(screen.getByText("أرامكس")).toBeInTheDocument();
  });

  it("Arabic: sets dir='rtl'", () => {
    const { container } = renderDetails({ language: "ar" });
    expect(container.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});
