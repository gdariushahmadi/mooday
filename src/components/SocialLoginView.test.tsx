import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { SocialLoginView } from "@/components/SocialLoginView";

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

function renderSocial(
  overrides: Partial<AppContextType> & { language?: "en" | "ar" } = {},
) {
  const ctx = makeContext(overrides);
  const onBack = vi.fn();
  const onSignIn = vi.fn();
  const onSuccess = vi.fn();
  const utils = render(
    <AppContext.Provider value={ctx}>
      <SocialLoginView
        onBack={onBack}
        onSignIn={onSignIn}
        onSuccess={onSuccess}
      />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, onSignIn, onSuccess, ctx };
}

beforeEach(() => {
  localStorage.clear();
});

describe("SocialLoginView (A-06)", () => {
  it("renders the title", () => {
    renderSocial();
    expect(
      screen.getByRole("heading", { name: /one-tap sign in/i }),
    ).toBeInTheDocument();
  });

  it("renders Arabic copy when language=ar", () => {
    renderSocial({ language: "ar" });
    expect(
      screen.getByRole("heading", { name: /تسجيل دخول بنقرة/i }),
    ).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup();
    const { onBack } = renderSocial();
    await user.click(screen.getByRole("button", { name: /^back$/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onSignIn when the email link is clicked", async () => {
    const user = userEvent.setup();
    const { onSignIn } = renderSocial();
    await user.click(
      screen.getByRole("button", { name: /use email/i }),
    );
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("creates a Google-flavored mock user and signs in on tap", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderSocial();
    await user.click(screen.getByRole("button", { name: /google/i }));
    expect(ctx.signUp).toHaveBeenCalledWith({
      name: "Google User",
      email: "user.google@mooday.app",
      phone: "",
      password: "social-1234",
    });
    expect(ctx.signIn).toHaveBeenCalledWith({
      email: "user.google@mooday.app",
      password: "social-1234",
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("creates an Apple-flavored mock user and signs in on tap", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderSocial();
    await user.click(screen.getByRole("button", { name: /apple/i }));
    expect(ctx.signUp).toHaveBeenCalledWith({
      name: "Apple User",
      email: "user.apple@mooday.app",
      phone: "",
      password: "social-1234",
    });
    expect(ctx.signIn).toHaveBeenCalledWith({
      email: "user.apple@mooday.app",
      password: "social-1234",
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("doesn't navigate when signIn fails", async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderSocial({ signIn: vi.fn(() => false) });
    await user.click(screen.getByRole("button", { name: /google/i }));
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
