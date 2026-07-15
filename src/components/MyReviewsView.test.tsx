import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { MyReview } from "@/data/my-reviews";
import type { Order } from "@/data/orders";
import { MyReviewsView } from "@/components/MyReviewsView";

const ORDER: Order = {
  id: "ord-9001",
  dateOrdered: "2024-12-01T10:00:00.000Z",
  status: "delivered",
  lineItems: [
    {
      product: {
        id: "p1", titleEn: "Bag", titleAr: "حقيبة",
        price: 1200, originalPrice: 2400,
        conditionEn: "Excellent", conditionAr: "ممتازة",
        sellerNameEn: "S", sellerNameAr: "س",
        sellerAvatar: "/a.jpg", sellerTypeEn: "V", sellerTypeAr: "م",
        saves: 1, image: "/p.jpg", images: ["/p.jpg"],
        descriptionEn: ".", descriptionAr: ".",
        category: "Bags",
      },
      quantity: 1, priceAtPurchase: 1200,
    },
  ],
  addressCityEn: "D", addressCityAr: "د",
  addressStreetEn: "V", addressStreetAr: "ف",
  paymentBrandEn: "Visa", paymentBrandAr: "فيزا",
  paymentLast4: "4242",
  subtotal: 1200, shipping: 0, total: 1200,
  courier: { nameEn: "A", nameAr: "أ", trackingNumber: "1" },
  timeline: [],
};

const REVIEWS: MyReview[] = [
  {
    id: "r1", orderId: "ord-9001", sellerKey: "s",
    rating: 5, title: "Great", body: "Loved it.",
    photos: [], date: new Date().toISOString(),
    isVerifiedPurchase: true,
  },
  {
    id: "r2", orderId: "ord-9001", sellerKey: "s",
    rating: 4, title: "Good", body: "Solid.",
    photos: [], date: new Date().toISOString(),
    isVerifiedPurchase: true,
  },
];

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
    myReviews: REVIEWS, addMyReview: vi.fn(),
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

describe("MyReviewsView (H-39 list)", () => {
  it("renders the page title", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <MyReviewsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("My reviews")).toBeInTheDocument();
  });

  it("renders both reviews", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <MyReviewsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Great")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("renders the verified-purchase badge per row", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <MyReviewsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getAllByText("Verified purchase").length).toBeGreaterThanOrEqual(1);
  });

  it("empty state when no reviews", () => {
    render(
      <AppContext.Provider value={makeContext({ myReviews: [] })}>
        <MyReviewsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText(/No reviews yet/i)).toBeInTheDocument();
  });

  it("Arabic: renders Arabic title", () => {
    render(
      <AppContext.Provider value={makeContext({ language: "ar" })}>
        <MyReviewsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("تقييماتي")).toBeInTheDocument();
  });
});
