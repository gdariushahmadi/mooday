import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Order } from "@/data/orders";
import { ReturnRequestView } from "@/components/ReturnRequestView";

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

beforeEach(() => { localStorage.clear(); globalThis.alert = vi.fn(); });

describe("ReturnRequestView (H-41)", () => {
  it("renders the page title", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <ReturnRequestView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText(/Return \/ Refund/i)).toBeInTheDocument();
  });

  it("renders the product line being returned", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <ReturnRequestView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Bag")).toBeInTheDocument();
  });

  it("submitting with body calls openDispute AND updateOrderStatus", async () => {
    const user = userEvent.setup();
    const ctx = makeContext();
    render(
      <AppContext.Provider value={ctx}>
        <ReturnRequestView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    await user.type(
      screen.getByPlaceholderText(/What was wrong/i),
      "Item arrived damaged",
    );
    await user.click(screen.getByRole("button", { name: /Submit return request/i }));
    expect(ctx.openDispute).toHaveBeenCalled();
    expect(ctx.updateOrderStatus).toHaveBeenCalledWith("ord-9001", "returned");
  });

  it("after submit, shows the success state with Back to order", async () => {
    const user = userEvent.setup();
    render(
      <AppContext.Provider value={makeContext()}>
        <ReturnRequestView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    await user.type(
      screen.getByPlaceholderText(/What was wrong/i),
      "Item description did not match.",
    );
    await user.click(screen.getByRole("button", { name: /Submit return request/i }));
    expect(
      await screen.findByText(/Return request submitted/i),
    ).toBeInTheDocument();
  });

  it("Arabic: renders Arabic title", () => {
    render(
      <AppContext.Provider value={makeContext({ language: "ar" })}>
        <ReturnRequestView order={ORDER} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText(/إرجاع \/ استرداد/i)).toBeInTheDocument();
  });
});
