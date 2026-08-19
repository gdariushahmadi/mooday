import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatThread, Product } from "@/context/AppContext";
import { useAppNavigation } from "@/hooks/useAppNavigation";

const mocks = vi.hoisted(() => ({
  useApp: vi.fn(),
}));

vi.mock("@/context/AppContext", () => ({
  useApp: mocks.useApp,
}));

const PRODUCT: Product = {
  id: "product-1",
  titleEn: "Test product",
  titleAr: "منتج تجريبي",
  price: 100,
  originalPrice: 150,
  conditionEn: "Good",
  conditionAr: "جيد",
  sellerNameEn: "Test seller",
  sellerNameAr: "بائع تجريبي",
  sellerAvatar: "/sellers/test.jpg",
  sellerTypeEn: "Seller",
  sellerTypeAr: "بائع",
  saves: 0,
  image: "/products/test.jpg",
  images: ["/products/test.jpg"],
  descriptionEn: "",
  descriptionAr: "",
  category: "Bags",
};

beforeEach(() => {
  window.history.replaceState({}, "", "/");
});

function makeContext(overrides: {
  chats?: ChatThread[];
  setActiveChats?: ReturnType<typeof vi.fn>;
  language?: "en" | "ar";
  createChatThread?: ReturnType<typeof vi.fn>;
  currentUserId?: string | null;
}) {
  return {
    createChatThread: vi.fn(async () => "chat-product-1"),
    listings: [PRODUCT],
    chats: [],
    setActiveChats: vi.fn(),
    language: "en",
    currentUserId: null,
    ...overrides,
  };
}

describe("useAppNavigation chat entry", () => {
  it("navigates to the chat overlay immediately with a placeholder", async () => {
    let resolveThread: (threadId: string) => void = () => {};
    const createChatThread = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveThread = resolve;
        }),
    );
    mocks.useApp.mockReturnValue(makeContext({ createChatThread }));

    const { result } = renderHook(() => useAppNavigation());

    act(() => {
      result.current.selectProduct(PRODUCT);
    });
    expect(result.current.selectedProduct).toEqual(PRODUCT);

    act(() => {
      result.current.startChat(PRODUCT);
    });

    // New behavior: the user is taken straight into chat with a
    // placeholder id; the real id swaps in once Supabase responds.
    expect(result.current.selectedProduct).toBeNull();
    expect(result.current.activeChatThreadId).toBe("pending-product-1");

    await act(async () => {
      resolveThread("chat-product-1");
    });

    expect(result.current.activeChatThreadId).toBe("chat-product-1");
  });

  it("does not create a duplicate placeholder when one is already in flight", () => {
    const existingPlaceholder: ChatThread = {
      id: "pending-product-1",
      sellerName: "Test seller",
      sellerAvatar: "/sellers/test.jpg",
      productTitle: "Test product",
      productImage: "/products/test.jpg",
      productPrice: 100,
      lastMessage: "",
      lastMessageTime: "",
      messages: [],
    };
    mocks.useApp.mockReturnValue(
      makeContext({
        chats: [existingPlaceholder],
        setActiveChats: vi.fn(),
        createChatThread: vi.fn(),
      }),
    );

    const { result } = renderHook(() => useAppNavigation());

    act(() => {
      result.current.startChat(PRODUCT);
    });

    // Already pointing at the placeholder thread, so we reused it
    // instead of pushing a duplicate thread or calling createChatThread.
    expect(result.current.activeChatThreadId).toBe("pending-product-1");
  });

  it("restores the originating product when the chat closes (back button)", () => {
    mocks.useApp.mockReturnValue(makeContext({}));

    const { result } = renderHook(() => useAppNavigation());

    act(() => {
      result.current.selectProduct(PRODUCT);
      result.current.startChat(PRODUCT);
    });
    expect(result.current.selectedProduct).toBeNull();
    expect(result.current.activeChatThreadId).toBe("pending-product-1");

    act(() => {
      result.current.closeChat();
    });
    // Back from the chat takes the user back to the product they
    // opened chat from — not the home feed.
    expect(result.current.activeChatThreadId).toBeNull();
    expect(result.current.selectedProduct).toEqual(PRODUCT);
  });
});
