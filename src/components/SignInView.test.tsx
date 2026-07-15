import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { SignInView } from "@/components/SignInView";

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

function renderSignIn(
  overrides: Partial<AppContextType> & { language?: "en" | "ar" } = {},
) {
  const ctx = makeContext(overrides);
  const onBack = vi.fn();
  const onSignUp = vi.fn();
  const onForgotPassword = vi.fn();
  const onSocialLogin = vi.fn();
  const onSuccess = vi.fn();
  const utils = render(
    <AppContext.Provider value={ctx}>
      <SignInView
        onBack={onBack}
        onSignUp={onSignUp}
        onForgotPassword={onForgotPassword}
        onSocialLogin={onSocialLogin}
        onSuccess={onSuccess}
      />
    </AppContext.Provider>,
  );
  return {
    ...utils,
    onBack,
    onSignUp,
    onForgotPassword,
    onSocialLogin,
    onSuccess,
    ctx,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("SignInView (A-04)", () => {
  it("renders the title", () => {
    renderSignIn();
    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
  });

  it("renders Arabic copy when language=ar", () => {
    renderSignIn({ language: "ar" });
    expect(
      screen.getByRole("heading", { name: /مرحباً بعودتك/i }),
    ).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup();
    const { onBack } = renderSignIn();
    await user.click(screen.getByRole("button", { name: /^back$/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onSignUp when the create-account link is clicked", async () => {
    const user = userEvent.setup();
    const { onSignUp } = renderSignIn();
    await user.click(
      screen.getByRole("button", { name: /create an account/i }),
    );
    expect(onSignUp).toHaveBeenCalledTimes(1);
  });

  it("calls onForgotPassword when the forgot link is clicked", async () => {
    const user = userEvent.setup();
    const { onForgotPassword } = renderSignIn();
    await user.click(
      screen.getByRole("button", { name: /forgot password/i }),
    );
    expect(onForgotPassword).toHaveBeenCalledTimes(1);
  });

  it("calls onSocialLogin when the Google button is clicked", async () => {
    const user = userEvent.setup();
    const { onSocialLogin } = renderSignIn();
    await user.click(screen.getByRole("button", { name: /google/i }));
    expect(onSocialLogin).toHaveBeenCalledTimes(1);
  });

  it("calls onSocialLogin when the Apple button is clicked", async () => {
    const user = userEvent.setup();
    const { onSocialLogin } = renderSignIn();
    await user.click(screen.getByRole("button", { name: /apple/i }));
    expect(onSocialLogin).toHaveBeenCalledTimes(1);
  });

  it("calls signIn and onSuccess when the form is submitted", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderSignIn();
    await user.type(
      screen.getByPlaceholderText(/you@example.com/i),
      "layla@mooday.app",
    );
    await user.type(screen.getByPlaceholderText(/your password/i), "mooday123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(ctx.signIn).toHaveBeenCalledWith({
      email: "layla@mooday.app",
      password: "mooday123",
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("doesn't navigate on a failed sign-in", async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderSignIn({ signIn: vi.fn(() => false) });
    await user.type(
      screen.getByPlaceholderText(/you@example.com/i),
      "layla@mooday.app",
    );
    await user.type(screen.getByPlaceholderText(/your password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("displays the auth error returned by signIn", () => {
    renderSignIn({ authError: "wrong_password" });
    expect(screen.getByText(/wrong password/i)).toBeInTheDocument();
  });
});
