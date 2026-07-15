import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { BlockedUser } from "@/data/blocked-users";
import { BlockedUsersView } from "@/components/BlockedUsersView";

const USERS: BlockedUser[] = [
  {
    id: "blk-1",
    nameEn: "Tariq R.",
    nameAr: "طارق ر.",
    avatar: "/a.jpg",
    reasonEn: "Spam",
    reasonAr: "سبام",
    date: new Date().toISOString(),
  },
  {
    id: "blk-2",
    nameEn: "Maryam K.",
    nameAr: "مريم ك.",
    avatar: "/b.jpg",
    reasonEn: "Other",
    reasonAr: "أخرى",
    date: new Date().toISOString(),
  },
];

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
    blockedUsers: USERS,
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

beforeEach(() => {
  localStorage.clear();
});

describe("BlockedUsersView (H-43)", () => {
  it("renders the page title", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <BlockedUsersView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Blocked users")).toBeInTheDocument();
  });

  it("renders both blocked users", () => {
    render(
      <AppContext.Provider value={makeContext()}>
        <BlockedUsersView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Tariq R.")).toBeInTheDocument();
    expect(screen.getByText("Maryam K.")).toBeInTheDocument();
  });

  it("unblock opens a confirmation modal", async () => {
    const user = userEvent.setup();
    render(
      <AppContext.Provider value={makeContext()}>
        <BlockedUsersView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    await user.click(screen.getAllByRole("button", { name: /Unblock/i })[0]);
    expect(screen.getByText(/Unblock this user?/i)).toBeInTheDocument();
  });

  it("confirming unblock calls unblockUser", async () => {
    const user = userEvent.setup();
    const ctx = makeContext();
    render(
      <AppContext.Provider value={ctx}>
        <BlockedUsersView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    // Click the first row's Unblock to open the modal.
    await user.click(screen.getAllByRole("button", { name: /^Unblock$/i })[0]);
    // Now find the Unblock button INSIDE the modal dialog.
    const dialog = screen.getByRole("dialog");
    const unblockInModal = within(dialog).getByRole("button", {
      name: /^Unblock$/i,
    });
    await user.click(unblockInModal);
    expect(ctx.unblockUser).toHaveBeenCalled();
  });

  it("cancel keeps the user blocked", async () => {
    const user = userEvent.setup();
    const ctx = makeContext();
    render(
      <AppContext.Provider value={ctx}>
        <BlockedUsersView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    await user.click(screen.getAllByRole("button", { name: /^Unblock$/i })[0]);
    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(ctx.unblockUser).not.toHaveBeenCalled();
  });

  it("empty state when no blocked users", () => {
    render(
      <AppContext.Provider value={makeContext({ blockedUsers: [] })}>
        <BlockedUsersView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText(/No blocked users/i)).toBeInTheDocument();
  });

  it("Arabic: renders Arabic title", () => {
    render(
      <AppContext.Provider value={makeContext({ language: "ar" })}>
        <BlockedUsersView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("المحظورون")).toBeInTheDocument();
  });
});
