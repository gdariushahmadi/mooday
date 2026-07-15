import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Order } from "@/data/orders";
import { PayoutsView } from "@/components/PayoutsView";

const ORDER: Order = {
  id: "ord-9001",
  dateOrdered: "2024-12-01T10:00:00.000Z",
  status: "delivered",
  lineItems: [
    {
      product: {
        id: "p1", titleEn: "Bag", titleAr: "حقيبة",
        price: 1000, originalPrice: 2000,
        conditionEn: "E", conditionAr: "م",
        sellerNameEn: "S", sellerNameAr: "س",
        sellerAvatar: "/a.jpg", sellerTypeEn: "V", sellerTypeAr: "م",
        saves: 1, image: "/p.jpg", images: ["/p.jpg"],
        descriptionEn: ".", descriptionAr: ".",
        category: "Bags",
      },
      quantity: 1, priceAtPurchase: 1000,
    },
  ],
  addressCityEn: "D", addressCityAr: "د",
  addressStreetEn: "V", addressStreetAr: "ف",
  paymentBrandEn: "Visa", paymentBrandAr: "فيزا",
  paymentLast4: "4242",
  subtotal: 1000, shipping: 0, total: 1000,
  courier: { nameEn: "A", nameAr: "أ", trackingNumber: "1" },
  timeline: [],
};

const DEFAULT_USER = {
  fullNameEn: "T", fullNameAr: "ت", handle: "@t",
  avatar: "/a.jpg", bioEn: "b", bioAr: "b",
  locationEn: "Dubai", locationAr: "دبي",
  styleTagsEn: [], styleTagsAr: [],
  rating: 5, reviewsCount: 0, followers: 0, following: 0,
};

function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
  return {
    language: "en", setLanguage: vi.fn(), listings: [], addListing: vi.fn(),
    updateListing: vi.fn(), removeListing: vi.fn(), likes: [], toggleLike: vi.fn(),
    cart: [], addToCart: vi.fn(), removeFromCart: vi.fn(), updateQuantity: vi.fn(),
    clearCart: vi.fn(), chats: [], sendChatMessage: vi.fn(),
    createChatThread: vi.fn(() => "t1"), addresses: [], addAddress: vi.fn(),
    updateAddress: vi.fn(), removeAddress: vi.fn(), setDefaultAddress: vi.fn(),
    paymentMethods: [], addPaymentMethod: vi.fn(), removePaymentMethod: vi.fn(),
    setDefaultPaymentMethod: vi.fn(), orders: [ORDER], recordOrder: vi.fn(),
    updateOrderStatus: vi.fn(), notifications: [], markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    userProfile: DEFAULT_USER, updateUserProfile: vi.fn(),
    myReviews: [], addMyReview: vi.fn(),
    blockedUsers: [], blockUser: vi.fn(), unblockUser: vi.fn(),
    reports: [], submitReport: vi.fn(),
    disputes: [], openDispute: vi.fn(),
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

beforeEach(() => { localStorage.clear(); });

describe("PayoutsView (H-42)", () => {
  it("renders the page title", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <PayoutsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Payouts")).toBeInTheDocument();
  });

  it("renders the available balance card", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <PayoutsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText(/Available for payout/i)).toBeInTheDocument();
  });

  it("renders the default payout method", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <PayoutsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText(/Default payout method/i)).toBeInTheDocument();
    expect(screen.getByText(/ENBD/i)).toBeInTheDocument();
  });

  it("renders a history row with payout pill", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <PayoutsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("History")).toBeInTheDocument();
    // The order id is shown in the history row.
    expect(screen.getByText("ord-9001")).toBeInTheDocument();
  });

  it("empty state when no orders", () => {
    render(
      <AppContext.Provider value={makeContext({ orders: [] })}>
        <PayoutsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    // History section still shows the heading.
    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("Arabic: renders Arabic title", () => {
    render(
      <AppContext.Provider value={makeContext({ language: "ar" })}>
        <PayoutsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("المدفوعات")).toBeInTheDocument();
  });
});
