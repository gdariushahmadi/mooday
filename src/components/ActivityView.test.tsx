import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { AppNotification } from "@/data/notifications";
import { ActivityView } from "@/components/ActivityView";

const NOTIFS: AppNotification[] = [
  {
    id: "n1",
    type: "chat",
    titleEn: "New message",
    titleAr: "رسالة جديدة",
    bodyEn: "Hello!",
    bodyAr: "مرحباً!",
    date: new Date(Date.now() - 60_000).toISOString(),
    isUnread: true,
    target: { kind: "chat", id: "chat-1" },
  },
  {
    id: "n2",
    type: "like",
    titleEn: "3 people saved your item",
    titleAr: "3 أشخاص حفظوا منتجك",
    bodyEn: "Getting attention",
    bodyAr: "تحظى باهتمام",
    date: new Date(Date.now() - 86_400_000 * 2).toISOString(),
    isUnread: false,
  },
];

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
    notifications: NOTIFS,
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    ...overrides,
  };
}

function renderActivity() {
  const ctx = makeContext();
  const onBack = vi.fn();
  const onOpenChat = vi.fn();
  const onOpenNotifications = vi.fn();
  const utils = render(
    <AppContext.Provider value={ctx}>
      <ActivityView
        onBack={onBack}
        onOpenChat={onOpenChat}
        onOpenNotifications={onOpenNotifications}
      />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, onOpenChat, onOpenNotifications, ctx };
}

beforeEach(() => {
  localStorage.clear();
});

describe("ActivityView (F-27)", () => {
  it("renders the page title", () => {
    renderActivity();
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });

  it("renders unread count in the actions row", () => {
    renderActivity();
    expect(screen.getByText(/1 unread/)).toBeInTheDocument();
  });

  it("splits into Today and Earlier sections", () => {
    renderActivity();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Earlier")).toBeInTheDocument();
  });

  it("clicking a chat-type notification calls onOpenChat", async () => {
    const user = userEvent.setup();
    const { onOpenChat } = renderActivity();
    await user.click(screen.getByText("New message"));
    expect(onOpenChat).toHaveBeenCalledWith("chat-1");
  });

  it("Mark all read calls markAllNotificationsRead", async () => {
    const user = userEvent.setup();
    const { ctx } = renderActivity();
    await user.click(screen.getByText(/Mark all read/));
    expect(ctx.markAllNotificationsRead).toHaveBeenCalled();
  });

  it("renders unread dot on unread items", () => {
    const { container } = renderActivity();
    // The unread dot is a small bg-primary rounded div.
    const dots = container.querySelectorAll(".bg-primary.rounded-full.w-2\\.5");
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it("Arabic: renders Arabic title", () => {
    render(
      <AppContext.Provider value={makeContext({ language: "ar" })}>
        <ActivityView onBack={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("النشاط")).toBeInTheDocument();
  });
});
