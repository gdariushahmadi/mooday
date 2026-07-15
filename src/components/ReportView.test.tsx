import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { ReportView } from "@/components/ReportView";

const DEFAULT_USER = {
  fullNameEn: "T",
  fullNameAr: "ت",
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
  const submitReport = vi.fn(
    (input: Parameters<AppContextType["submitReport"]>[0]) => ({
      id: "rep-test",
      caseNumber: "MOODAY-99999",
      status: "open" as const,
      date: new Date().toISOString(),
      ...input,
    }),
  );
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
    submitReport,
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

beforeEach(() => {
  localStorage.clear();
  globalThis.alert = vi.fn();
});

describe("ReportView (H-40)", () => {
  it("renders the page title", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <ReportView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Report")).toBeInTheDocument();
  });

  it("renders both kind toggles (Listing / User)", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <ReportView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(
      screen.getByRole("radio", { name: /This listing/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /This seller/i }),
    ).toBeInTheDocument();
  });

  it("submitting with body calls submitReport", async () => {
    const user = userEvent.setup();
    const ctx = makeContext();
    render(
      <AppContext.Provider value={ctx}>
        <ReportView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    await user.type(
      screen.getByPlaceholderText(/Describe the issue/i),
      "This is fake.",
    );
    await user.click(screen.getByRole("button", { name: /Submit report/i }));
    expect(ctx.submitReport).toHaveBeenCalled();
  });

  it("shows the success screen with case number after submit", async () => {
    const user = userEvent.setup();
    render(
      <AppContext.Provider value={makeContext()}>
        <ReportView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    await user.type(
      screen.getByPlaceholderText(/Describe the issue/i),
      "Real concern.",
    );
    await user.click(screen.getByRole("button", { name: /Submit report/i }));
    expect(await screen.findByText(/Report submitted/i)).toBeInTheDocument();
    expect(screen.getByText("MOODAY-99999")).toBeInTheDocument();
  });

  it("Arabic: renders Arabic title", () => {
    render(
      <AppContext.Provider value={makeContext({ language: "ar" })}>
        <ReportView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("الإبلاغ")).toBeInTheDocument();
  });
});
