import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext } from "@/context/AppContext";
import { WelcomeView } from "@/components/WelcomeView";

beforeEach(() => {
  localStorage.clear();
});

// Minimal AppContext for WelcomeView: the component only reads
// `language` and calls `setLanguage`, so we don't need the full
// listings/cart/chats state.
function renderWithLanguage(initialLanguage: "en" | "ar") {
  const setLanguage = vi.fn();
  const value = {
    language: initialLanguage,
    setLanguage,
    listings: [],
    addListing: vi.fn(),
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
    notifications: [],
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    userProfile: {
      fullNameEn: "Test User",
      fullNameAr: "مستخدم اختبار",
      handle: "@test",
      avatar: "/sellers/test.jpg",
      bioEn: "Test bio",
      bioAr: "نبذة",
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
    updateListing: vi.fn(),
    removeListing: vi.fn(),
    updateOrderStatus: vi.fn(),
    currentUser: null,
    authError: null,
    signUp: vi.fn(() => "user-test"),
    signIn: vi.fn(() => true),
    signOut: vi.fn(),
    verifyOtp: vi.fn(() => true),
    sendOtp: vi.fn(() => "000000"),
    updateCurrentUserName: vi.fn(),
    resetPassword: vi.fn(() => true),
  };
  render(
    <AppContext.Provider value={value}>
      <WelcomeView onEnter={vi.fn()} />
    </AppContext.Provider>,
  );
  return { setLanguage };
}

describe("WelcomeView", () => {
  it("renders the brand mark, wordmark, tagline, and CTA", () => {
    renderWithLanguage("en");

    expect(screen.getByText("Mooday")).toBeInTheDocument();
    expect(
      screen.getByText("Resell & rent pre-loved fashion"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enter mooday/i }),
    ).toBeInTheDocument();
  });

  it("renders the EN pill as pressed by default", () => {
    renderWithLanguage("en");

    const enPill = screen.getByRole("button", { name: /english/i });
    const arPill = screen.getByRole("button", { name: /العربية/ });

    expect(enPill).toHaveAttribute("aria-pressed", "true");
    expect(arPill).toHaveAttribute("aria-pressed", "false");
  });

  it("renders the AR pill as pressed when initial language is ar", () => {
    renderWithLanguage("ar");

    const enPill = screen.getByRole("button", { name: /english/i });
    const arPill = screen.getByRole("button", { name: /العربية/ });

    expect(enPill).toHaveAttribute("aria-pressed", "false");
    expect(arPill).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking a language pill calls setLanguage and flips aria-pressed", async () => {
    const user = userEvent.setup();
    const { setLanguage } = renderWithLanguage("en");

    const arPill = screen.getByRole("button", { name: /العربية/ });
    await user.click(arPill);

    expect(setLanguage).toHaveBeenCalledWith("ar");
    expect(arPill).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking the Enter CTA calls onEnter", async () => {
    const user = userEvent.setup();
    const onEnter = vi.fn();

    const value = {
      language: "en" as const,
      setLanguage: vi.fn(),
      listings: [],
      addListing: vi.fn(),
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
      notifications: [],
      markNotificationRead: vi.fn(),
      markAllNotificationsRead: vi.fn(),
      userProfile: {
        fullNameEn: "Test User",
        fullNameAr: "مستخدم اختبار",
        handle: "@test",
        avatar: "/sellers/test.jpg",
        bioEn: "Test bio",
        bioAr: "نبذة",
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
      updateListing: vi.fn(),
      removeListing: vi.fn(),
      updateOrderStatus: vi.fn(),
      currentUser: null,
      authError: null,
      signUp: vi.fn(() => "user-test"),
      signIn: vi.fn(() => true),
      signOut: vi.fn(),
      verifyOtp: vi.fn(() => true),
      sendOtp: vi.fn(() => "000000"),
      updateCurrentUserName: vi.fn(),
      resetPassword: vi.fn(() => true),
    };

    render(
      <AppContext.Provider value={value}>
        <WelcomeView onEnter={onEnter} />
      </AppContext.Provider>,
    );

    await user.click(screen.getByRole("button", { name: /enter mooday/i }));

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("clicking the Skip link also calls onEnter", async () => {
    const user = userEvent.setup();
    const onEnter = vi.fn();

    const value = {
      language: "en" as const,
      setLanguage: vi.fn(),
      listings: [],
      addListing: vi.fn(),
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
      notifications: [],
      markNotificationRead: vi.fn(),
      markAllNotificationsRead: vi.fn(),
      userProfile: {
        fullNameEn: "Test User",
        fullNameAr: "مستخدم اختبار",
        handle: "@test",
        avatar: "/sellers/test.jpg",
        bioEn: "Test bio",
        bioAr: "نبذة",
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
      updateListing: vi.fn(),
      removeListing: vi.fn(),
      updateOrderStatus: vi.fn(),
      currentUser: null,
      authError: null,
      signUp: vi.fn(() => "user-test"),
      signIn: vi.fn(() => true),
      signOut: vi.fn(),
      verifyOtp: vi.fn(() => true),
      sendOtp: vi.fn(() => "000000"),
      updateCurrentUserName: vi.fn(),
      resetPassword: vi.fn(() => true),
    };

    render(
      <AppContext.Provider value={value}>
        <WelcomeView onEnter={onEnter} />
      </AppContext.Provider>,
    );

    await user.click(screen.getByRole("button", { name: /^skip$/i }));

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("renders Arabic tagline copy when language is ar", () => {
    renderWithLanguage("ar");

    expect(
      screen.getByText("بيعي و أجيلي ملابسك المستعملة"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ادخلي مودي/ }),
    ).toBeInTheDocument();
  });

  it("exposes the language picker as a radio group", () => {
    renderWithLanguage("en");

    const group = screen.getByRole("radiogroup", {
      name: /choose your language/i,
    });
    expect(group).toBeInTheDocument();
  });

  it("pills are keyboard reachable in tab order", async () => {
    const user = userEvent.setup();
    renderWithLanguage("en");

    // Tab to first pill.
    await user.tab();
    const enPill = screen.getByRole("button", { name: /english/i });
    expect(enPill).toHaveFocus();

    // Tab to second pill.
    await user.tab();
    const arPill = screen.getByRole("button", { name: /العربية/ });
    expect(arPill).toHaveFocus();
  });
});
