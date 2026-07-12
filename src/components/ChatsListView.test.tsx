import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType, type ChatThread } from "@/context/AppContext";
import { ChatsListView } from "@/components/ChatsListView";

const THREADS: ChatThread[] = [
  {
    id: "t1", sellerName: "Sarah", sellerAvatar: "/s.jpg",
    productTitle: "Vintage Bag", productImage: "/p.jpg", productPrice: 1200,
    lastMessage: "Hi there!", lastMessageTime: "10m",
    messages: [{ id: "m1", sender: "seller", text: "Hi!", time: "10m" }],
  },
  {
    id: "t2", sellerName: "Hana", sellerAvatar: "/h.jpg",
    productTitle: "Silk Dress", productImage: "/d.jpg", productPrice: 800,
    lastMessage: "Can you ship today?", lastMessageTime: "1h",
    messages: [{ id: "m2", sender: "user", text: "Hi", time: "1h" }],
  },
];

function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
  return {
    language: "en", setLanguage: vi.fn(), listings: [], addListing: vi.fn(),
    updateListing: vi.fn(), removeListing: vi.fn(), likes: [], toggleLike: vi.fn(),
    cart: [], addToCart: vi.fn(), removeFromCart: vi.fn(), updateQuantity: vi.fn(),
    clearCart: vi.fn(), chats: THREADS, sendChatMessage: vi.fn(),
    createChatThread: vi.fn(() => "t1"), addresses: [], addAddress: vi.fn(),
    updateAddress: vi.fn(), removeAddress: vi.fn(), setDefaultAddress: vi.fn(),
    paymentMethods: [], addPaymentMethod: vi.fn(), removePaymentMethod: vi.fn(),
    setDefaultPaymentMethod: vi.fn(), orders: [], recordOrder: vi.fn(),
    updateOrderStatus: vi.fn(), notifications: [], markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(), ...overrides,
  };
}

function renderChats() {
  const ctx = makeContext();
  const onBack = vi.fn();
  const onOpenThread = vi.fn();
  render(
    <AppContext.Provider value={ctx}>
      <ChatsListView onBack={onBack} onOpenThread={onOpenThread} />
    </AppContext.Provider>,
  );
  return { onBack, onOpenThread };
}

beforeEach(() => { localStorage.clear(); });

describe("ChatsListView (F-28)", () => {
  it("renders the page title", () => {
    renderChats();
    expect(screen.getByText("Messages")).toBeInTheDocument();
  });

  it("renders both chat threads", () => {
    renderChats();
    expect(screen.getByText("Sarah")).toBeInTheDocument();
    expect(screen.getByText("Hana")).toBeInTheDocument();
  });

  it("shows the pinned label", () => {
    renderChats();
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });

  it("search filters threads by seller name", async () => {
    const user = userEvent.setup();
    renderChats();
    await user.type(screen.getByPlaceholderText(/Search/i), "Hana");
    expect(screen.getByText("Hana")).toBeInTheDocument();
    expect(screen.queryByText("Sarah")).not.toBeInTheDocument();
  });

  it("clicking a thread calls onOpenThread", async () => {
    const user = userEvent.setup();
    const { onOpenThread } = renderChats();
    await user.click(screen.getByText("Sarah"));
    expect(onOpenThread).toHaveBeenCalledWith("t1");
  });

  it("empty state when no chats", () => {
    render(
      <AppContext.Provider value={makeContext({ chats: [] })}>
        <ChatsListView onBack={vi.fn()} onOpenThread={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
  });

  it("Arabic title", () => {
    render(
      <AppContext.Provider value={makeContext({ language: "ar" })}>
        <ChatsListView onBack={vi.fn()} onOpenThread={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("الرسائل")).toBeInTheDocument();
  });
});
