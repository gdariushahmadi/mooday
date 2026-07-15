import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Order } from "@/data/orders";
import { LeaveReviewView } from "@/components/LeaveReviewView";

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
        sellerNameEn: "Sarah", sellerNameAr: "سارة",
        sellerAvatar: "/a.jpg", sellerTypeEn: "V", sellerTypeAr: "م",
        saves: 1, image: "/p.jpg", images: ["/p.jpg"],
        descriptionEn: ".", descriptionAr: ".",
        category: "Bags",
      },
      quantity: 1, priceAtPurchase: 1200,
    },
  ],
  addressCityEn: "Dubai", addressCityAr: "دبي",
  addressStreetEn: "V", addressStreetAr: "ف",
  paymentBrandEn: "Visa", paymentBrandAr: "فيزا",
  paymentLast4: "4242",
  subtotal: 1200, shipping: 0, total: 1200,
  courier: { nameEn: "A", nameAr: "أ", trackingNumber: "1" },
  timeline: [],
};

const DEFAULT_USER = {
  fullNameEn: "Test", fullNameAr: "اختبار", handle: "@t",
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
    setDefaultPaymentMethod: vi.fn(), orders: [], recordOrder: vi.fn(),
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

beforeEach(() => {
  localStorage.clear();
  globalThis.alert = vi.fn();
});

describe("LeaveReviewView (H-39)", () => {
  it("renders the product being reviewed", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <LeaveReviewView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Bag")).toBeInTheDocument();
  });

  it("renders the verified-purchase badge", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <LeaveReviewView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Verified purchase")).toBeInTheDocument();
  });

  it("renders 5 star buttons in a radiogroup", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <LeaveReviewView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    // 5 stars.
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("5 is selected by default", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <LeaveReviewView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByRole("radio", { name: /^5/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("Submit without text blocks save", async () => {
    const user = userEvent.setup();
    const ctx = makeContext();
    render(
      <AppContext.Provider value={ctx}>
        <LeaveReviewView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    await user.click(screen.getByRole("button", { name: /Submit review/i }));
    expect(ctx.addMyReview).not.toHaveBeenCalled();
  });

  it("Submitting calls addMyReview", async () => {
    const user = userEvent.setup();
    const ctx = makeContext();
    render(
      <AppContext.Provider value={ctx}>
        <LeaveReviewView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    await user.type(
      screen.getByPlaceholderText(/Summarize your experience/i),
      "Excellent purchase",
    );
    await user.type(
      screen.getByPlaceholderText(/What did you love/i),
      "Very happy with the item.",
    );
    await user.click(screen.getByRole("button", { name: /Submit review/i }));
    expect(ctx.addMyReview).toHaveBeenCalled();
  });

  it("Back calls onBack", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <AppContext.Provider value={makeContext()}>
        <LeaveReviewView order={ORDER} onBack={onBack} />
      </AppContext.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("Arabic: title", () => {
    render(
      <AppContext.Provider value={makeContext({ language: "ar" })}>
        <LeaveReviewView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("اتركي تقييماً")).toBeInTheDocument();
  });
});
