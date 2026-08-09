import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/context/AppContext";
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

describe("useAppNavigation chat entry", () => {
  it("closes product details before an async chat thread is ready", async () => {
    let resolveThread: (threadId: string) => void = () => {};
    const createChatThread = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveThread = resolve;
        }),
    );
    mocks.useApp.mockReturnValue({
      createChatThread,
      listings: [PRODUCT],
    });

    const { result } = renderHook(() => useAppNavigation());

    act(() => {
      result.current.selectProduct(PRODUCT);
    });
    expect(result.current.selectedProduct).toEqual(PRODUCT);

    act(() => {
      result.current.startChat(PRODUCT);
    });

    expect(result.current.selectedProduct).toBeNull();
    expect(result.current.activeChatThreadId).toBeNull();

    await act(async () => {
      resolveThread("chat-product-1");
    });

    expect(result.current.activeChatThreadId).toBe("chat-product-1");
  });
});
