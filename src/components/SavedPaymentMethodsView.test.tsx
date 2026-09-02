import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { SavedPaymentMethodsView } from "@/components/SavedPaymentMethodsView";

const DEFAULT_USER = {
  fullNameEn: "Test",
  fullNameAr: "اختبار",
  handle: "@t",
  avatar: "/sellers/placeholder.svg",
  bioEn: "",
  bioAr: "",
  locationEn: "Dubai",
  locationAr: "دبي",
  styleTagsEn: [],
  styleTagsAr: [],
  rating: 0,
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
    setActiveChats: vi.fn(),
    sendChatMessage: vi.fn(),
    createChatThread: vi.fn(() => "t1"),
    markChatRead: vi.fn(),
    setChatOfferStatus: vi.fn(),
    refreshChats: vi.fn(async () => {}),
    chatsLoading: false,
    refreshNotifications: vi.fn(async () => {}),
    refreshMyReviews: vi.fn(async () => {}),
    refreshReports: vi.fn(async () => {}),
    refreshDisputes: vi.fn(async () => {}),
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
    signIn: vi.fn(async () => true),
    signOut: vi.fn(),
    verifyOtp: vi.fn(() => true),
    sendOtp: vi.fn(() => "000000"),
    updateCurrentUserName: vi.fn(),
    resetPassword: vi.fn(async () => true),
    ...overrides,
  };
}

describe("SavedPaymentMethodsView", () => {
  it("shows that card storage is disabled in the public Demo", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <SavedPaymentMethodsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );

    expect(screen.getByText("Payment methods")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/not available in Demo mode/i);
    expect(screen.getByRole("status")).toHaveTextContent(/does not request or store card numbers or CVV/i);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("supports Arabic", () => {
    render(
      <AppContext.Provider value={makeContext({ language: "ar" })}>
        <SavedPaymentMethodsView onBack={vi.fn()} />
      </AppContext.Provider>,
    );

    expect(screen.getByText("طرق الدفع")).toBeInTheDocument();
  });

  it("calls onBack", () => {
    const onBack = vi.fn();
    render(
      <AppContext.Provider value={makeContext()}>
        <SavedPaymentMethodsView onBack={onBack} />
      </AppContext.Provider>,
    );
    screen.getByRole("button", { name: "Back" }).click();
    expect(onBack).toHaveBeenCalledOnce();
  });
});
