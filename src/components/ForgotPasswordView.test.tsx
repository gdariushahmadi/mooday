import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { ForgotPasswordView } from "@/components/ForgotPasswordView";
import { MOCK_OTP_CODE } from "@/data/users";

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

function renderForgot(
  overrides: Partial<AppContextType> & { language?: "en" | "ar" } = {},
) {
  const ctx = makeContext(overrides);
  const onBack = vi.fn();
  const onSuccess = vi.fn();
  const utils = render(
    <AppContext.Provider value={ctx}>
      <ForgotPasswordView onBack={onBack} onSuccess={onSuccess} />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, onSuccess, ctx };
}

beforeEach(() => {
  localStorage.clear();
});

async function step1Email(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
) {
  await user.type(screen.getByRole("textbox", { name: /email/i }), email);
  await user.click(screen.getByRole("button", { name: /send code/i }));
}

async function step2Code(
  user: ReturnType<typeof userEvent.setup>,
  code: string,
) {
  for (let i = 0; i < code.length; i++) {
    const cell = screen.getByLabelText(`6-digit code ${i + 1}`);
    await user.type(cell, code[i]);
  }
  await user.click(screen.getByRole("button", { name: /verify/i }));
}

describe("ForgotPasswordView (A-05)", () => {
  it("renders the email step first", () => {
    renderForgot();
    expect(
      screen.getByRole("heading", { name: /reset your password/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send code/i }),
    ).toBeInTheDocument();
  });

  it("moves to the OTP step after entering an email", async () => {
    const user = userEvent.setup();
    renderForgot();
    await step1Email(user, "layla@mooday.app");
    expect(
      screen.getByRole("heading", { name: /enter the code/i }),
    ).toBeInTheDocument();
  });

  it("calls sendOtp after the email is submitted", async () => {
    const user = userEvent.setup();
    const { ctx } = renderForgot();
    await step1Email(user, "layla@mooday.app");
    expect(ctx.sendOtp).toHaveBeenCalledWith("layla@mooday.app");
  });

  it("moves to the password step after a successful OTP", async () => {
    const user = userEvent.setup();
    const { ctx } = renderForgot({ sendOtp: vi.fn(() => MOCK_OTP_CODE) });
    await step1Email(user, "layla@mooday.app");
    await step2Code(user, MOCK_OTP_CODE);
    expect(
      screen.getByRole("heading", { name: /choose a new password/i }),
    ).toBeInTheDocument();
    expect(ctx.verifyOtp).toHaveBeenCalledWith("layla@mooday.app", "000000");
  });

  it("blocks submission when the password is too short", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderForgot();
    await step1Email(user, "layla@mooday.app");
    await step2Code(user, MOCK_OTP_CODE);
    await user.type(screen.getByLabelText(/new password/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /reset password/i }));
    expect(ctx.resetPassword).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /at least 8 characters/i,
    );
  });

  it("blocks submission when the passwords don't match", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderForgot();
    await step1Email(user, "layla@mooday.app");
    await step2Code(user, MOCK_OTP_CODE);
    await user.type(screen.getByLabelText(/new password/i), "longenough1");
    await user.type(screen.getByLabelText(/confirm password/i), "longenouff2");
    await user.click(screen.getByRole("button", { name: /reset password/i }));
    expect(ctx.resetPassword).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /passwords don't match/i,
    );
  });

  it("calls resetPassword and onSuccess on a complete flow", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderForgot();
    await step1Email(user, "layla@mooday.app");
    await step2Code(user, MOCK_OTP_CODE);
    await user.type(screen.getByLabelText(/new password/i), "mooday-new");
    await user.type(screen.getByLabelText(/confirm password/i), "mooday-new");
    await user.click(screen.getByRole("button", { name: /reset password/i }));
    expect(ctx.resetPassword).toHaveBeenCalledWith(
      "layla@mooday.app",
      "mooday-new",
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows an error when the OTP code is wrong", async () => {
    const user = userEvent.setup();
    const { ctx } = renderForgot({ verifyOtp: vi.fn(() => false) });
    await step1Email(user, "layla@mooday.app");
    await step2Code(user, "111111");
    expect(
      screen.queryByRole("heading", { name: /choose a new password/i }),
    ).not.toBeInTheDocument();
    expect(ctx.verifyOtp).toHaveBeenCalledWith("layla@mooday.app", "111111");
  });

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup();
    const { onBack } = renderForgot();
    await user.click(screen.getByRole("button", { name: /^back$/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
