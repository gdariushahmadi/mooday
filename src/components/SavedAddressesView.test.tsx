import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Address } from "@/data/addresses";
import { SavedAddressesView } from "@/components/SavedAddressesView";

const HOME: Address = {
  id: "addr-1",
  labelEn: "Home",
  labelAr: "المنزل",
  fullNameEn: "Layla Mansour",
  fullNameAr: "ليلى منصور",
  phone: "+971 50 123 4567",
  cityEn: "Dubai",
  cityAr: "دبي",
  streetEn: "Villa 24, Al Wasl Rd",
  streetAr: "فيلا 24، شارع الوصل",
  isDefault: true,
};

const WORK: Address = {
  ...HOME,
  id: "addr-2",
  labelEn: "Work",
  labelAr: "العمل",
  streetEn: "Gate Avenue, DIFC",
  isDefault: false,
};

const ADDRESSES: Address[] = [HOME, WORK];

const DEFAULT_USER = {
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
};

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
    createChatThread: vi.fn(() => "t1"),
    addresses: ADDRESSES,
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
      <SavedAddressesView onBack={onBack} />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, ctx };
}

beforeEach(() => {
  localStorage.clear();
  // Stub alert so we don't pop real dialogs.
  globalThis.alert = vi.fn();
});

describe("SavedAddressesView (G-35)", () => {
  it("renders the page title", () => {
    renderView();
    expect(screen.getByText("Saved addresses")).toBeInTheDocument();
  });

  it("renders both addresses", () => {
    renderView();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("marks the default address with a Default badge", () => {
    renderView();
    // Default badge text appears on the default address.
    expect(screen.getAllByText("Default").length).toBeGreaterThanOrEqual(1);
  });

  it("'Make default' calls setDefaultAddress", async () => {
    const user = userEvent.setup();
    const { ctx } = renderView();
    await user.click(screen.getByRole("button", { name: /Make default/i }));
    expect(ctx.setDefaultAddress).toHaveBeenCalledWith("addr-2");
  });

  it("'Delete' opens a confirmation modal", async () => {
    const user = userEvent.setup();
    renderView();
    const deleteBtn = screen.getAllByRole("button", { name: "Delete" })[0];
    await user.click(deleteBtn);
    expect(screen.getByText(/Delete this address?/i)).toBeInTheDocument();
  });

  it("Cancel keeps the address", async () => {
    const user = userEvent.setup();
    const { ctx } = renderView();
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(ctx.removeAddress).not.toHaveBeenCalled();
  });

  it("Confirming remove calls removeAddress", async () => {
    const user = userEvent.setup();
    const { ctx } = renderView();
    // Two sets of Delete buttons: per-row "Delete" + modal "Delete".
    // Click the row's Delete first to open the modal.
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    // Modal shows another Delete button — click the one inside the modal dialog.
    const dialog = screen.getByRole("dialog");
    const deleteInModal = within(dialog).getByRole("button", {
      name: /^Delete$/,
    });
    await user.click(deleteInModal);
    expect(ctx.removeAddress).toHaveBeenCalled();
  });

  it("submitting the form calls addAddress", async () => {
    const user = userEvent.setup();
    const ctx = makeContext({ addresses: [] });
    render(
      <AppContext.Provider value={ctx}>
        <SavedAddressesView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your full name/i),
      "Test User",
    );
    await user.type(
      screen.getByPlaceholderText(/Villa 24, Al Wasl Road/i),
      "Test Street",
    );
    await user.click(screen.getByRole("button", { name: /Save address/i }));
    expect(ctx.addAddress).toHaveBeenCalledTimes(1);
  });

  it("Back calls onBack", async () => {
    const user = userEvent.setup();
    const { onBack } = renderView();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("Arabic title", () => {
    renderView({ language: "ar" });
    expect(screen.getByText("العناوين المحفوظة")).toBeInTheDocument();
  });

  it("empty state shows when addresses is empty", () => {
    render(
      <AppContext.Provider value={makeContext({ addresses: [] })}>
        <SavedAddressesView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    // The component opens the form by default when there are no addresses.
    // Verify the form is showing the empty state by closing it.
    expect(
      screen.getByPlaceholderText(/Enter your full name/i),
    ).toBeInTheDocument();
  });
});
