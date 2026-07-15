import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { EditProfileView } from "@/components/EditProfileView";

const USER = {
  fullNameEn: "Fatima AlMansoori",
  fullNameAr: "فاطمة المنصوري",
  handle: "@fatima_dxb",
  avatar: "/sellers/fatima-almansoori.jpg",
  bioEn: "Curating Gulf-inspired pre-loved fashion.",
  bioAr: "أختار أزياء الخليج المستعملة.",
  locationEn: "Dubai, UAE",
  locationAr: "دبي، الإمارات",
  styleTagsEn: ["Kaftan", "Vintage"],
  styleTagsAr: ["قفطان", "كلاسيكي"],
  rating: 4.9, reviewsCount: 28, followers: 1420, following: 382,
};

function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
  return {
    language: "en", setLanguage: vi.fn(), listings: [], addListing: vi.fn(),
    updateListing: vi.fn(), removeListing: vi.fn(), likes: [], toggleLike: vi.fn(),
    cart: [], addToCart: vi.fn(), removeFromCart: vi.fn(), updateQuantity: vi.fn(),
    clearCart: vi.fn(), chats: [], sendChatMessage: vi.fn(),
    createChatThread: vi.fn(() => "t1"), addresses: [], addAddress: vi.fn(),
    updateAddress: vi.fn(), removeAddress: vi.fn(), setDefaultAddress: vi.fn(),
    paymentMethods: [], addPaymentMethod: vi.fn(), removePaymentMethod: vi.fn(),
    setDefaultPaymentMethod: vi.fn(), orders: [], recordOrder: vi.fn(),
    updateOrderStatus: vi.fn(), notifications: [], markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    userProfile: USER, updateUserProfile: vi.fn(),
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

function renderView(opts: { language?: "en" | "ar" } = {}) {
  const ctx = makeContext({ language: opts.language });
  const onBack = vi.fn();
  const utils = render(
    <AppContext.Provider value={ctx}>
      <EditProfileView onBack={onBack} />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, ctx };
}

beforeEach(() => {
  localStorage.clear();
  globalThis.alert = vi.fn();
});

describe("EditProfileView (G-33)", () => {
  it("renders the page title", () => {
    renderView();
    expect(screen.getByText("Edit profile")).toBeInTheDocument();
  });

  it("prefills the name from the user profile", () => {
    renderView();
    expect(screen.getByDisplayValue("Fatima AlMansoori")).toBeInTheDocument();
  });

  it("prefills the handle", () => {
    renderView();
    expect(screen.getByDisplayValue("fatima_dxb")).toBeInTheDocument();
  });

  it("renders the avatar section", () => {
    renderView();
    expect(screen.getByText("Profile photo")).toBeInTheDocument();
  });

  it("submitting with empty name blocks save", async () => {
    const user = userEvent.setup();
    const { ctx } = renderView();
    const nameInput = screen.getByDisplayValue("Fatima AlMansoori");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: /Save profile/i }));
    expect(ctx.updateUserProfile).not.toHaveBeenCalled();
  });

  it("saving calls updateUserProfile", async () => {
    const user = userEvent.setup();
    const { ctx } = renderView();
    await user.click(screen.getByRole("button", { name: /Save profile/i }));
    expect(ctx.updateUserProfile).toHaveBeenCalled();
  });

  it("Back calls onBack", async () => {
    const user = userEvent.setup();
    const { onBack } = renderView();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("Arabic title", () => {
    renderView({ language: "ar" });
    expect(screen.getByText("تعديل الملف الشخصي")).toBeInTheDocument();
  });

  it("adding a style tag appends to the chips", async () => {
    const user = userEvent.setup();
    renderView();
    const input = screen.getByPlaceholderText(/Add a tag/i);
    await user.type(input, "Boho{Enter}");
    expect(screen.getByText("Boho")).toBeInTheDocument();
  });
});
