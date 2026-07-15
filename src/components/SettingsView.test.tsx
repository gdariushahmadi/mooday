import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { SettingsView } from "@/components/SettingsView";

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

function renderSettings(
  overrides: Partial<AppContextType> & { language?: "en" | "ar" } = {},
) {
  const ctx = makeContext(overrides);
  const onBack = vi.fn();
  const onOpenEditProfile = vi.fn();
  const onOpenAddresses = vi.fn();
  const onOpenPaymentMethods = vi.fn();
  const onOpenHelp = vi.fn();
  const onOpenPayouts = vi.fn();
  const onOpenBlockedUsers = vi.fn();
  const onSignOut = vi.fn();
  const onSignIn = vi.fn();
  const utils = render(
    <AppContext.Provider value={ctx}>
      <SettingsView
        onBack={onBack}
        onOpenEditProfile={onOpenEditProfile}
        onOpenAddresses={onOpenAddresses}
        onOpenPaymentMethods={onOpenPaymentMethods}
        onOpenHelp={onOpenHelp}
        onOpenPayouts={onOpenPayouts}
        onOpenBlockedUsers={onOpenBlockedUsers}
        onSignOut={onSignOut}
        onSignIn={onSignIn}
      />
    </AppContext.Provider>,
  );
  return {
    ...utils,
    onBack,
    onSignOut,
    onSignIn,
    ctx,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("SettingsView (G-37) — auth affordances", () => {
  it("shows a Sign in button when there is no current user", () => {
    renderSettings({ currentUser: null });
    expect(
      screen.getByRole("button", { name: /^sign in$/i }),
    ).toBeInTheDocument();
  });

  it("shows a Log out button when there is a current user", () => {
    renderSettings({
      currentUser: { email: "layla@mooday.app", name: "Layla" },
    });
    expect(
      screen.getByRole("button", { name: /^log out$/i }),
    ).toBeInTheDocument();
  });

  it("calls onSignIn when the Sign in button is clicked (signed-out state)", async () => {
    const user = userEvent.setup();
    const { onSignIn } = renderSettings({ currentUser: null });
    await user.click(
      screen.getByRole("button", { name: /^sign in$/i }),
    );
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("calls onSignOut when the Log out button is clicked (signed-in state)", async () => {
    const user = userEvent.setup();
    const { onSignOut } = renderSettings({
      currentUser: { email: "layla@mooday.app", name: "Layla" },
    });
    await user.click(
      screen.getByRole("button", { name: /^log out$/i }),
    );
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("renders Arabic copy when language=ar", () => {
    renderSettings({ language: "ar" });
    expect(
      screen.getByRole("heading", { name: /الإعدادات والحساب/i }),
    ).toBeInTheDocument();
  });
});
