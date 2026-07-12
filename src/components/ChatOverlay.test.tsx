import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType, type ChatThread } from "@/context/AppContext";
import { ChatOverlay } from "@/components/ChatOverlay";

const THREAD: ChatThread = {
  id: "t1",
  sellerName: "Sarah",
  sellerAvatar: "/s.jpg",
  productTitle: "Vintage Bag",
  productImage: "/p.jpg",
  productPrice: 1200,
  lastMessage: "Hi!",
  lastMessageTime: "10m",
  messages: [
    { id: "m1", sender: "seller", text: "Welcome!", time: "10m" },
  ],
};

function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
  return {
    language: "en", setLanguage: vi.fn(), listings: [], addListing: vi.fn(),
    updateListing: vi.fn(), removeListing: vi.fn(), likes: [], toggleLike: vi.fn(),
    cart: [], addToCart: vi.fn(), removeFromCart: vi.fn(), updateQuantity: vi.fn(),
    clearCart: vi.fn(), chats: [THREAD], sendChatMessage: vi.fn(),
    createChatThread: vi.fn(() => "t1"), addresses: [], addAddress: vi.fn(),
    updateAddress: vi.fn(), removeAddress: vi.fn(), setDefaultAddress: vi.fn(),
    paymentMethods: [], addPaymentMethod: vi.fn(), removePaymentMethod: vi.fn(),
    setDefaultPaymentMethod: vi.fn(), orders: [], recordOrder: vi.fn(),
    updateOrderStatus: vi.fn(), notifications: [], markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(), ...overrides,
  };
}

function renderChat() {
  const ctx = makeContext();
  const onBack = vi.fn();
  const onCheckout = vi.fn();
  render(
    <AppContext.Provider value={ctx}>
      <ChatOverlay threadId="t1" onBack={onBack} onCheckout={onCheckout} />
    </AppContext.Provider>,
  );
  return { onBack, onCheckout, ctx };
}

beforeEach(() => { localStorage.clear(); });

describe("ChatOverlay (F-29/F-30)", () => {
  it("renders the seller name in the header", () => {
    renderChat();
    expect(screen.getByText("Sarah")).toBeInTheDocument();
  });

  it("renders the product preview bar with price", () => {
    renderChat();
    expect(screen.getByText("Vintage Bag")).toBeInTheDocument();
    expect(screen.getByText(/1,200/)).toBeInTheDocument();
  });

  it("renders the Buy Item button", () => {
    renderChat();
    expect(screen.getByRole("button", { name: /Buy Item/i })).toBeInTheDocument();
  });

  it("renders the image attach button", () => {
    renderChat();
    expect(screen.getByRole("button", { name: /Attach image/i })).toBeInTheDocument();
  });

  it("renders the voice note button", () => {
    renderChat();
    expect(screen.getByRole("button", { name: /Voice note/i })).toBeInTheDocument();
  });

  it("renders the Make Offer button", () => {
    renderChat();
    expect(screen.getByRole("button", { name: /Make Offer/i })).toBeInTheDocument();
  });

  it("renders quick reply chips when the thread is short", () => {
    renderChat();
    expect(screen.getByText("Is this still available?")).toBeInTheDocument();
  });

  it("typing a message and pressing send calls sendChatMessage", async () => {
    const user = userEvent.setup();
    const { ctx } = renderChat();
    const input = screen.getByPlaceholderText(/Type your message/i);
    await user.type(input, "Hello!");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(ctx.sendChatMessage).toHaveBeenCalledWith("t1", "Hello!");
  });

  it("Make Offer form opens on tap and has amount + send fields", async () => {
    const user = userEvent.setup();
    renderChat();
    await user.click(screen.getByRole("button", { name: /Make Offer/i }));
    expect(screen.getByPlaceholderText(/Enter amount/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send offer/i })).toBeInTheDocument();
  });

  it("submitting an offer calls sendChatMessage with the OFFER: format", async () => {
    const user = userEvent.setup();
    const { ctx } = renderChat();
    await user.click(screen.getByRole("button", { name: /Make Offer/i }));
    await user.type(screen.getByPlaceholderText(/Enter amount/i), "900");
    await user.click(screen.getByRole("button", { name: /Send offer/i }));
    expect(ctx.sendChatMessage).toHaveBeenCalledWith(
      "t1",
      expect.stringMatching(/^OFFER:900:/),
    );
  });

  it("attaching an image inserts a stub message", async () => {
    const user = userEvent.setup();
    const { ctx } = renderChat();
    await user.click(screen.getByRole("button", { name: /Attach image/i }));
    expect(ctx.sendChatMessage).toHaveBeenCalledWith("t1", expect.stringContaining("📷"));
  });

  it("voice note inserts a stub message", async () => {
    const user = userEvent.setup();
    const { ctx } = renderChat();
    await user.click(screen.getByRole("button", { name: /Voice note/i }));
    expect(ctx.sendChatMessage).toHaveBeenCalledWith("t1", expect.stringContaining("🎙"));
  });

  it("shows 'Chat not found' for an unknown thread id", () => {
    render(
      <AppContext.Provider value={makeContext({ chats: [] })}>
        <ChatOverlay threadId="unknown" onBack={vi.fn()} onCheckout={vi.fn()} />
      </AppContext.Provider>,
    );
    expect(screen.getByText("Chat not found.")).toBeInTheDocument();
  });
});
