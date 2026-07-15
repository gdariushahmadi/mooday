import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { AppNotification } from "@/data/notifications";
import { NotificationsCentreView } from "@/components/NotificationsCentreView";

const NOTIFS: AppNotification[] = [
  {
    id: "n1", type: "chat",
    titleEn: "Msg from Sarah", titleAr: "رسالة من سارة",
    bodyEn: "Hi!", bodyAr: "مرحباً!",
    date: new Date(Date.now() - 60_000).toISOString(),
    isUnread: true,
    target: { kind: "chat", id: "chat-1" },
  },
  {
    id: "n2", type: "offer",
    titleEn: "Offer received", titleAr: "عرض جديد",
    bodyEn: "AED 800", bodyAr: "800 درهم",
    date: new Date(Date.now() - 120_000).toISOString(),
    isUnread: true,
  },
  {
    id: "n3", type: "follow",
    titleEn: "New follower", titleAr: "متابع جديد",
    bodyEn: "Layla", bodyAr: "ليلى",
    date: new Date(Date.now() - 86_400_000).toISOString(),
    isUnread: false,
  },
];

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
    updateOrderStatus: vi.fn(), notifications: NOTIFS,
    markNotificationRead: vi.fn(), markAllNotificationsRead: vi.fn(),
    userProfile: { fullNameEn: "Test User", fullNameAr: "مستخدم اختبار", handle: "@test", avatar: "/sellers/test.jpg", bioEn: "Test bio", bioAr: "نبذة", locationEn: "Dubai", locationAr: "دبي", styleTagsEn: [], styleTagsAr: [], rating: 5, reviewsCount: 0, followers: 0, following: 0 },
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

function renderCentre() {
  const ctx = makeContext();
  const onBack = vi.fn();
  const onOpenChat = vi.fn();
  render(
    <AppContext.Provider value={ctx}>
      <NotificationsCentreView onBack={onBack} onOpenChat={onOpenChat} />
    </AppContext.Provider>,
  );
  return { onBack, onOpenChat, ctx };
}

beforeEach(() => { localStorage.clear(); });

describe("NotificationsCentreView (F-31)", () => {
  it("renders the page title", () => {
    renderCentre();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("shows unread count badge", () => {
    renderCentre();
    expect(screen.getByText(/2 unread/)).toBeInTheDocument();
  });

  it("renders all filter chips", () => {
    renderCentre();
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Chats" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Offers" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Follows" })).toBeInTheDocument();
  });

  it("renders all 3 notifications by default", () => {
    renderCentre();
    expect(screen.getByText("Msg from Sarah")).toBeInTheDocument();
    expect(screen.getByText("Offer received")).toBeInTheDocument();
    expect(screen.getByText("New follower")).toBeInTheDocument();
  });

  it("'Chats' filter shows only chat notifications", async () => {
    const user = userEvent.setup();
    renderCentre();
    await user.click(screen.getByRole("tab", { name: "Chats" }));
    expect(screen.getByText("Msg from Sarah")).toBeInTheDocument();
    expect(screen.queryByText("Offer received")).not.toBeInTheDocument();
  });

  it("'Offers' filter shows only offer notifications", async () => {
    const user = userEvent.setup();
    renderCentre();
    await user.click(screen.getByRole("tab", { name: "Offers" }));
    expect(screen.getByText("Offer received")).toBeInTheDocument();
    expect(screen.queryByText("Msg from Sarah")).not.toBeInTheDocument();
  });

  it("clicking a chat notif calls onOpenChat", async () => {
    const user = userEvent.setup();
    const { onOpenChat } = renderCentre();
    await user.click(screen.getByText("Msg from Sarah"));
    expect(onOpenChat).toHaveBeenCalledWith("chat-1");
  });

  it("Mark all read calls markAllNotificationsRead", async () => {
    const user = userEvent.setup();
    const { ctx } = renderCentre();
    await user.click(screen.getByText(/Mark all read/));
    expect(ctx.markAllNotificationsRead).toHaveBeenCalled();
  });

  it("empty state when no notifications", () => {
    render(
      <AppContext.Provider value={makeContext({ notifications: [] })}>
        <NotificationsCentreView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText(/No notifications/i)).toBeInTheDocument();
  });
});
