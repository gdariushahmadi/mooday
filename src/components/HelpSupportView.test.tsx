import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Order } from "@/data/orders";
import { HelpSupportView } from "@/components/HelpSupportView";

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
  addressCityEn: "Dubai", addressCityAr: "دبي",
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
    setDefaultPaymentMethod: vi.fn(), orders: [ORDER], recordOrder: vi.fn(),
    updateOrderStatus: vi.fn(), notifications: [], markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    userProfile: DEFAULT_USER, updateUserProfile: vi.fn(),
    myReviews: [],
    addMyReview: vi.fn(),
    blockedUsers: [],
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
    reports: [],
    submitReport: vi.fn(),
    disputes: [],
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

function renderView(opts: { language?: "en" | "ar" } = {}) {
  const ctx = makeContext({ language: opts.language });
  const onBack = vi.fn();
  const onOpenOrder = vi.fn();
  const utils = render(
    <AppContext.Provider value={ctx}>
      <HelpSupportView onBack={onBack} onOpenOrder={onOpenOrder} />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, onOpenOrder, ctx };
}

beforeEach(() => {
  localStorage.clear();
  globalThis.alert = vi.fn();
});

describe("HelpSupportView (G-38)", () => {
  it("renders the page title", () => {
    renderView();
    expect(screen.getByText("Help & Support")).toBeInTheDocument();
  });

  it("renders the FAQ section", () => {
    renderView();
    expect(screen.getByText("Frequently asked")).toBeInTheDocument();
    expect(screen.getByText(/How do I sell on Mooday/)).toBeInTheDocument();
  });

  it("clicking a FAQ opens its answer", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByText(/How do I sell on Mooday/));
    expect(screen.getByText(/Tap the Sell button/)).toBeInTheDocument();
  });

  it("order lookup: pasting a known id shows found", async () => {
    const user = userEvent.setup();
    const { onOpenOrder } = renderView();
    await user.type(screen.getByPlaceholderText(/e\.g\. ord/i), "ord-9001");
    await user.click(screen.getByRole("button", { name: /Find my order/i }));
    expect(onOpenOrder).toHaveBeenCalledWith("ord-9001");
  });

  it("order lookup: pasting unknown id shows not found", async () => {
    const user = userEvent.setup();
    renderView();
    await user.type(
      screen.getByPlaceholderText(/e\.g\. ord/i),
      "ord-INVALID",
    );
    await user.click(screen.getByRole("button", { name: /Find my order/i }));
    expect(screen.getByText(/No order matches that id/i)).toBeInTheDocument();
  });

  it("renders the contact section with 3 channels", () => {
    renderView();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
  });

  it("Back calls onBack", async () => {
    const user = userEvent.setup();
    const { onBack } = renderView();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("Arabic title", () => {
    renderView({ language: "ar" });
    expect(screen.getByText("المساعدة والدعم")).toBeInTheDocument();
  });
});
