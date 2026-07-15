import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Dispute } from "@/data/disputes";
import type { Order } from "@/data/orders";
import { DisputesListView } from "@/components/DisputesListView";

const ORDER: Order = {
  id: "ord-9001",
  dateOrdered: "2024-12-01T10:00:00.000Z",
  status: "returned",
  lineItems: [
    {
      product: {
        id: "p1",
        titleEn: "Bag",
        titleAr: "حقيبة",
        price: 1200,
        originalPrice: 2400,
        conditionEn: "Excellent",
        conditionAr: "ممتازة",
        sellerNameEn: "S",
        sellerNameAr: "س",
        sellerAvatar: "/a.jpg",
        sellerTypeEn: "V",
        sellerTypeAr: "م",
        saves: 1,
        image: "/p.jpg",
        images: ["/p.jpg"],
        descriptionEn: ".",
        descriptionAr: ".",
        category: "Bags",
      },
      quantity: 1,
      priceAtPurchase: 1200,
    },
  ],
  addressCityEn: "D",
  addressCityAr: "د",
  addressStreetEn: "V",
  addressStreetAr: "ف",
  paymentBrandEn: "Visa",
  paymentBrandAr: "فيزا",
  paymentLast4: "4242",
  subtotal: 1200,
  shipping: 0,
  total: 1200,
  courier: { nameEn: "A", nameAr: "أ", trackingNumber: "1" },
  timeline: [],
};

const DISPUTES: Dispute[] = [
  {
    id: "d1",
    orderId: "ord-9001",
    reason: "damaged",
    body: "X",
    photos: [],
    status: "open",
    date: new Date().toISOString(),
    timeline: [],
  },
  {
    id: "d2",
    orderId: "ord-9001",
    reason: "not_as_described",
    body: "Y",
    photos: [],
    status: "investigating",
    date: new Date().toISOString(),
    timeline: [],
  },
];

const DEFAULT_USER = {
  fullNameEn: "T",
  fullNameAr: "ت",
  handle: "@t",
  avatar: "/a.jpg",
  bioEn: "b",
  bioAr: "b",
  locationEn: "Dubai",
  locationAr: "دبي",
  styleTagsEn: [],
  styleTagsAr: [],
  rating: 5,
  reviewsCount: 0,
  followers: 0,
  following: 0,
};

function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
  return {
    language: "en",
    setLanguage: vi.fn(),
    listings: [],
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
    orders: [ORDER],
    recordOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
    notifications: [],
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    userProfile: DEFAULT_USER,
    updateUserProfile: vi.fn(),
    myReviews: [],
    addMyReview: vi.fn(),
    blockedUsers: [],
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
    reports: [],
    submitReport: vi.fn(),
    disputes: DISPUTES,
    openDispute: vi.fn(),
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

beforeEach(() => {
  localStorage.clear();
});

describe("DisputesListView (H-44 list)", () => {
  it("renders the page title", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <DisputesListView onBack={vi.fn()} onOpenDispute={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Disputes")).toBeInTheDocument();
  });

  it("renders both disputes as order rows", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <DisputesListView onBack={vi.fn()} onOpenDispute={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(
      screen.getAllByText(/Order #ord-9001/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows Open and Investigating badges", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <DisputesListView onBack={vi.fn()} onOpenDispute={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Investigating")).toBeInTheDocument();
  });

  it("clicking a row calls onOpenDispute with the dispute id", async () => {
    const user = userEvent.setup();
    const onOpenDispute = vi.fn();
    render(
      <AppContext.Provider value={makeContext()}>
        <DisputesListView onBack={vi.fn()} onOpenDispute={onOpenDispute} />
      </AppContext.Provider>,
    );
    // Both dispute rows have the same order id text. Click the first
    // matching row container.
    const rows = screen.getAllByText(/Order #ord-9001/);
    await user.click(rows[0]);
    expect(onOpenDispute).toHaveBeenCalled();
  });

  it("empty state when no disputes", () => {
    render(
      <AppContext.Provider value={makeContext({ disputes: [] })}>
        <DisputesListView onBack={vi.fn()} onOpenDispute={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText(/No disputes/i)).toBeInTheDocument();
  });

  it("Arabic: renders Arabic title", () => {
    render(
      <AppContext.Provider value={makeContext({ language: "ar" })}>
        <DisputesListView onBack={vi.fn()} onOpenDispute={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("النزاعات")).toBeInTheDocument();
  });
});
