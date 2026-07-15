import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Order } from "@/data/orders";
import type { Dispute } from "@/data/disputes";
import { DisputeView } from "@/components/DisputeView";

const ORDER: Order = {
  id: "ord-9001",
  dateOrdered: "2024-12-01T10:00:00.000Z",
  status: "returned",
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

const DISPUTE: Dispute = {
  id: "disp-9001",
  orderId: "ord-9001",
  reason: "damaged",
  body: "Arrived cracked.",
  photos: [],
  status: "investigating",
  date: new Date().toISOString(),
  timeline: [
    {
      status: "open",
      date: new Date().toISOString(),
      descriptionEn: "Dispute opened.",
      descriptionAr: "تم فتح النزاع.",
    },
    {
      status: "investigating",
      date: new Date().toISOString(),
      descriptionEn: "Seller contacted, awaiting courier report.",
      descriptionAr: "تم التواصل مع البائع.",
    },
  ],
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
    disputes: [DISPUTE], openDispute: vi.fn(),
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

describe("DisputeView (H-44)", () => {
  it("renders the page title", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <DisputeView order={ORDER} dispute={DISPUTE} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Dispute")).toBeInTheDocument();
  });

  it("renders the investigating status", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <DisputeView order={ORDER} dispute={DISPUTE} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getAllByText("Investigating").length).toBeGreaterThan(0);
  });

  it("renders the timeline", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <DisputeView order={ORDER} dispute={DISPUTE} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Dispute opened.")).toBeInTheDocument();
    expect(screen.getByText(/Seller contacted/)).toBeInTheDocument();
  });

  it("renders the dispute body", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <DisputeView order={ORDER} dispute={DISPUTE} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Arrived cracked.")).toBeInTheDocument();
  });

  it("renders the order context with product title", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <DisputeView order={ORDER} dispute={DISPUTE} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Bag")).toBeInTheDocument();
  });

  it("Chat with support button invokes onContactSupport", async () => {
    const user = userEvent.setup();
    const onContactSupport = vi.fn();
    render(
      <AppContext.Provider value={makeContext()}>
        <DisputeView
          order={ORDER}
          dispute={DISPUTE}
          onBack={vi.fn()}
          onContactSupport={onContactSupport}
        />
      </AppContext.Provider>,
    );
    await user.click(
      screen.getByRole("button", { name: /Chat with support/i }),
    );
    expect(onContactSupport).toHaveBeenCalled();
  });

  it("Back to order calls onBack", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <AppContext.Provider value={makeContext()}>
        <DisputeView order={ORDER} dispute={DISPUTE} onBack={onBack} />
      </AppContext.Provider>,
    );
    await user.click(screen.getByRole("button", { name: /Back to order/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it("Arabic: renders Arabic title", () => {
    render(
      <AppContext.Provider value={makeContext({ language: "ar" })}>
        <DisputeView order={ORDER} dispute={DISPUTE} onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("النزاع")).toBeInTheDocument();
  });
});
