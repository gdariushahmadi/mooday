import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { PaymentMethod } from "@/data/paymentMethods";
import { SavedPaymentMethodsView } from "@/components/SavedPaymentMethodsView";

const VISA: PaymentMethod = {
  id: "pm-1",
  labelEn: "Personal Visa",
  labelAr: "فيزا شخصية",
  brandEn: "Visa",
  brandAr: "فيزا",
  last4: "4242",
  holderEn: "Layla Mansour",
  holderAr: "ليلى منصور",
  expiry: "11/27",
  isDefault: true,
};

const MASTERCARD: PaymentMethod = {
  ...VISA,
  id: "pm-2",
  brandEn: "Mastercard",
  brandAr: "ماستركارد",
  last4: "1881",
  isDefault: false,
};

const PAYMENT_METHODS: PaymentMethod[] = [VISA, MASTERCARD];

const DEFAULT_USER = {
  fullNameEn: "Test",
  fullNameAr: "اختبار",
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
    paymentMethods: PAYMENT_METHODS,
    addPaymentMethod: vi.fn(),
    removePaymentMethod: vi.fn(),
    setDefaultPaymentMethod: vi.fn(),
    orders: [],
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
  const utils = render(
    <AppContext.Provider value={ctx}>
      <SavedPaymentMethodsView onBack={onBack} />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, ctx };
}

beforeEach(() => {
  localStorage.clear();
  globalThis.alert = vi.fn();
});

describe("SavedPaymentMethodsView (G-36)", () => {
  it("renders the page title", () => {
    renderView();
    expect(screen.getByText("Payment methods")).toBeInTheDocument();
  });

  it("renders both cards with last4 visible", () => {
    renderView();
    expect(screen.getAllByText(/4242/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/1881/).length).toBeGreaterThanOrEqual(1);
  });

  it("marks the default card with a Default badge", () => {
    renderView();
    expect(screen.getAllByText("Default").length).toBeGreaterThanOrEqual(1);
  });

  it("'Make default' calls setDefaultPaymentMethod", async () => {
    const user = userEvent.setup();
    const { ctx } = renderView();
    await user.click(screen.getByRole("button", { name: /Make default/i }));
    expect(ctx.setDefaultPaymentMethod).toHaveBeenCalledWith("pm-2");
  });

  it("Delete opens a confirmation modal", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    expect(screen.getByText(/Delete this card?/i)).toBeInTheDocument();
  });

  it("Confirming delete calls removePaymentMethod", async () => {
    const user = userEvent.setup();
    const { ctx } = renderView();
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    // Modal shows two buttons: Cancel + Delete — find the Delete inside the modal.
    const dialog = screen.getByRole("dialog");
    const deleteInModal = within(dialog).getByRole("button", {
      name: /^Delete$/,
    });
    await user.click(deleteInModal);
    expect(ctx.removePaymentMethod).toHaveBeenCalled();
  });

  it("Back calls onBack", async () => {
    const user = userEvent.setup();
    const { onBack } = renderView();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("Arabic title", () => {
    renderView({ language: "ar" });
    expect(screen.getByText("طرق الدفع")).toBeInTheDocument();
  });

  it("empty state when no methods", () => {
    render(
      <AppContext.Provider value={makeContext({ paymentMethods: [] })}>
        <SavedPaymentMethodsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    // The component opens the form by default when there are no cards.
    expect(screen.getByPlaceholderText(/Name on card/i)).toBeInTheDocument();
  });
});
