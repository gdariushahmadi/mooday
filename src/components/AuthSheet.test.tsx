import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { AuthSheet } from "@/components/AuthSheet";

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
    createChatThread: vi.fn(() => "test-thread"),
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
    userProfile: {
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
    },
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

function renderSheet(opts: { open?: boolean; language?: "en" | "ar" } = {}) {
  const ctx = makeContext({ language: opts.language ?? "en" });
  const onClose = vi.fn();
  const onSignIn = vi.fn();
  const onSignUp = vi.fn();
  const onSocial = vi.fn();
  const utils = render(
    <AppContext.Provider value={ctx}>
      <AuthSheet
        open={opts.open ?? true}
        onClose={onClose}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onSocial={onSocial}
      />
    </AppContext.Provider>,
  );
  return { ...utils, onClose, onSignIn, onSignUp, onSocial };
}

beforeEach(() => {
  localStorage.clear();
});

describe("AuthSheet", () => {
  it("does not render when closed", () => {
    renderSheet({ open: false });
    expect(
      screen.queryByRole("dialog"),
    ).not.toBeInTheDocument();
  });

  it("renders when open", () => {
    renderSheet({ open: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the title in English by default", () => {
    renderSheet();
    expect(
      screen.getByText(/save your closet across devices/i),
    ).toBeInTheDocument();
  });

  it("renders Arabic when language=ar", () => {
    renderSheet({ language: "ar" });
    expect(
      screen.getByText(/احفظي خزانتك/i),
    ).toBeInTheDocument();
  });

  it("calls onSignUp when Create account is clicked", async () => {
    const user = userEvent.setup();
    const { onSignUp } = renderSheet();
    await user.click(
      screen.getByRole("button", { name: /^create account$/i }),
    );
    expect(onSignUp).toHaveBeenCalledTimes(1);
  });

  it("calls onSignIn when Sign in is clicked", async () => {
    const user = userEvent.setup();
    const { onSignIn } = renderSheet();
    await user.click(
      screen.getByRole("button", { name: /^sign in$/i }),
    );
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("calls onSocial when the social link is clicked", async () => {
    const user = userEvent.setup();
    const { onSocial } = renderSheet();
    await user.click(
      screen.getByRole("button", { name: /continue with google or apple/i }),
    );
    expect(onSocial).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when dismiss is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderSheet();
    await user.click(
      screen.getByRole("button", { name: /not now/i }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
