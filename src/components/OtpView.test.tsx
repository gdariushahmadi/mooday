import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { OtpView } from "@/components/OtpView";
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

function renderOtp(
  overrides: Partial<AppContextType> & {
    email?: string;
    language?: "en" | "ar";
  } = {},
) {
  const { email, ...ctxOverrides } = overrides;
  const ctx = makeContext(ctxOverrides);
  const onBack = vi.fn();
  const onSuccess = vi.fn();
  const utils = render(
    <AppContext.Provider value={ctx}>
      <OtpView email={email} onBack={onBack} onSuccess={onSuccess} />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, onSuccess, ctx };
}

beforeEach(() => {
  localStorage.clear();
});

async function typeCode(
  user: ReturnType<typeof userEvent.setup>,
  code: string,
) {
  // Use the per-cell aria-label which has the index at the end
  // ("6-digit code 1", "6-digit code 2", ...).
  for (let i = 0; i < code.length; i++) {
    const cell = screen.getByLabelText(`6-digit code ${i + 1}`);
    await user.type(cell, code[i]);
  }
}

describe("OtpView (A-03)", () => {
  it("renders the title and helper text", () => {
    renderOtp();
    expect(
      screen.getByRole("heading", { name: /enter the code/i }),
    ).toBeInTheDocument();
    // Universal mock code is shown in the helper hint.
    expect(screen.getByText(MOCK_OTP_CODE)).toBeInTheDocument();
  });

  it("renders Arabic copy when language=ar", () => {
    renderOtp({ language: "ar" });
    expect(
      screen.getByRole("heading", { name: /أدخلي الرمز/i }),
    ).toBeInTheDocument();
  });

  it("renders the email it was called with", () => {
    renderOtp({ email: "layla@mooday.app" });
    expect(screen.getByText("layla@mooday.app")).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup();
    const { onBack } = renderOtp();
    await user.click(screen.getByRole("button", { name: /^back$/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls verifyOtp and onSuccess when the universal code is entered", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderOtp();
    await typeCode(user, MOCK_OTP_CODE);
    await user.click(screen.getByRole("button", { name: /^verify$/i }));
    expect(ctx.verifyOtp).toHaveBeenCalledWith("", "000000");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("does not call onSuccess for an incorrect code", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderOtp({ verifyOtp: vi.fn(() => false) });
    await typeCode(user, "111111");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));
    expect(ctx.verifyOtp).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls sendOtp when resend is clicked", async () => {
    const user = userEvent.setup();
    const { ctx } = renderOtp();
    await user.click(screen.getByRole("button", { name: /didn't get it/i }));
    expect(ctx.sendOtp).toHaveBeenCalledWith("");
  });
});
