import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { SignUpView } from "@/components/SignUpView";

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

function renderSignUp(
  overrides: Partial<AppContextType> & { language?: "en" | "ar" } = {},
) {
  const ctx = makeContext({ ...overrides });
  const onBack = vi.fn();
  const onOtp = vi.fn();
  const onSignIn = vi.fn();
  const onSuccess = vi.fn();
  const utils = render(
    <AppContext.Provider value={ctx}>
      <SignUpView
        onBack={onBack}
        onOtp={onOtp}
        onSignIn={onSignIn}
        onSuccess={onSuccess}
      />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, onOtp, onSignIn, onSuccess, ctx };
}

beforeEach(() => {
  localStorage.clear();
});

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/layla mansour/i), "Test User");
  await user.type(
    screen.getByPlaceholderText(/you@example.com/i),
    "test@mooday.app",
  );
  await user.type(screen.getByPlaceholderText(/\+971/i), "+971 50 000 0000");
  await user.type(
    screen.getByPlaceholderText(/at least 8 characters/i),
    "mooday-test",
  );
  await user.type(
    screen.getByPlaceholderText(/re-enter your password/i),
    "mooday-test",
  );
  await user.click(screen.getByRole("checkbox", { name: /accept terms/i }));
}

describe("SignUpView (A-02)", () => {
  it("renders the page title", () => {
    renderSignUp();
    expect(
      screen.getByRole("heading", { name: /create your mooday/i }),
    ).toBeInTheDocument();
  });

  it("renders Arabic copy when language=ar", () => {
    renderSignUp({ language: "ar" });
    expect(
      screen.getByRole("heading", { name: /أنشئي حسابك/i }),
    ).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup();
    const { onBack } = renderSignUp();
    await user.click(screen.getByRole("button", { name: /^back$/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onSignIn when the sign-in link is clicked", async () => {
    const user = userEvent.setup();
    const { onSignIn } = renderSignUp();
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("blocks submission when name is empty", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderSignUp();
    await user.type(
      screen.getByPlaceholderText(/you@example.com/i),
      "test@mooday.app",
    );
    await user.type(
      screen.getByPlaceholderText(/at least 8 characters/i),
      "mooday-test",
    );
    await user.type(
      screen.getByPlaceholderText(/re-enter your password/i),
      "mooday-test",
    );
    await user.click(screen.getByRole("checkbox", { name: /accept terms/i }));
    await user.click(screen.getByRole("button", { name: /^create account$/i }));
    expect(ctx.signUp).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();
  });

  it("blocks submission when passwords don't match", async () => {
    const user = userEvent.setup();
    const { ctx } = renderSignUp();
    await user.type(screen.getByPlaceholderText(/layla mansour/i), "Test");
    await user.type(
      screen.getByPlaceholderText(/you@example.com/i),
      "test@mooday.app",
    );
    await user.type(
      screen.getByPlaceholderText(/at least 8 characters/i),
      "mooday-test",
    );
    await user.type(
      screen.getByPlaceholderText(/re-enter your password/i),
      "mooday-OOPS",
    );
    await user.click(screen.getByRole("checkbox", { name: /accept terms/i }));
    await user.click(screen.getByRole("button", { name: /^create account$/i }));
    expect(ctx.signUp).not.toHaveBeenCalled();
    expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
  });

  it("blocks submission when terms are not accepted", async () => {
    const user = userEvent.setup();
    const { ctx } = renderSignUp();
    await user.type(screen.getByPlaceholderText(/layla mansour/i), "Test");
    await user.type(
      screen.getByPlaceholderText(/you@example.com/i),
      "test@mooday.app",
    );
    await user.type(
      screen.getByPlaceholderText(/at least 8 characters/i),
      "mooday-test",
    );
    await user.type(
      screen.getByPlaceholderText(/re-enter your password/i),
      "mooday-test",
    );
    await user.click(screen.getByRole("button", { name: /^create account$/i }));
    expect(ctx.signUp).not.toHaveBeenCalled();
    expect(screen.getByText(/please accept the terms/i)).toBeInTheDocument();
  });

  it("calls signUp and onSuccess when a valid form is submitted", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderSignUp();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /^create account$/i }));
    expect(ctx.signUp).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@mooday.app",
      phone: "+971 50 000 0000",
      password: "mooday-test",
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("displays the auth error returned by signUp", () => {
    renderSignUp({
      authError: "user_exists",
    });
    const alert = screen.getByTestId("auth-error");
    expect(alert.textContent).toMatch(
      /account with that email already exists/i,
    );
  });
});
