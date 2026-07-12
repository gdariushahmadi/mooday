import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { AppProvider, useApp, type Product } from "@/context/AppContext";

// A minimal product for testing.
const TEST_PRODUCT: Product = {
  id: "test-1",
  titleEn: "Test Handbag",
  titleAr: "حقيبة اختبار",
  price: 100,
  originalPrice: 200,
  conditionEn: "Excellent Condition",
  conditionAr: "حالة ممتازة",
  sellerNameEn: "Test Seller",
  sellerNameAr: "بائع اختبار",
  sellerAvatar: "/sellers/test.jpg",
  sellerTypeEn: "Verified Closet",
  sellerTypeAr: "خزانة معتمدة",
  saves: 0,
  image: "/products/test.jpg",
  images: ["/products/test.jpg"],
  descriptionEn: "A test product.",
  descriptionAr: "منتج اختبار.",
  category: "Bags",
};

const TEST_PRODUCT_2: Product = {
  ...TEST_PRODUCT,
  id: "test-2",
  titleEn: "Test Shoes",
  price: 50,
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

describe("AppContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("cart operations", () => {
    it("starts with an empty cart", () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.cart).toEqual([]);
    });

    it("adds a product to the cart", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addToCart(TEST_PRODUCT);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].product.id).toBe("test-1");
      expect(result.current.cart[0].quantity).toBe(1);
    });

    it("increments quantity when adding the same product twice", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addToCart(TEST_PRODUCT);
        result.current.addToCart(TEST_PRODUCT);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].quantity).toBe(2);
    });

    it("removes a product from the cart", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addToCart(TEST_PRODUCT);
        result.current.addToCart(TEST_PRODUCT_2);
      });

      expect(result.current.cart).toHaveLength(2);

      act(() => {
        result.current.removeFromCart("test-1");
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].product.id).toBe("test-2");
    });

    it("updates quantity positively", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addToCart(TEST_PRODUCT);
      });

      act(() => {
        result.current.updateQuantity("test-1", 5);
      });

      expect(result.current.cart[0].quantity).toBe(5);
    });

    it("removes the item when quantity drops to zero", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addToCart(TEST_PRODUCT);
      });

      act(() => {
        result.current.updateQuantity("test-1", 0);
      });

      expect(result.current.cart).toEqual([]);
    });

    it("removes the item when quantity goes negative", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addToCart(TEST_PRODUCT);
      });

      act(() => {
        result.current.updateQuantity("test-1", -1);
      });

      expect(result.current.cart).toEqual([]);
    });

    it("clears the entire cart", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addToCart(TEST_PRODUCT);
        result.current.addToCart(TEST_PRODUCT_2);
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cart).toEqual([]);
    });

    it("persists cart to localStorage", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.addToCart(TEST_PRODUCT);
      });

      const stored = localStorage.getItem("mooday_cart");
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].product.id).toBe("test-1");
    });
  });

  describe("likes", () => {
    it("starts with no likes", () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.likes).toEqual([]);
    });

    it("toggles a like on", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.toggleLike("test-1");
      });

      expect(result.current.likes).toContain("test-1");
    });

    it("toggles a like off", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.toggleLike("test-1");
        result.current.toggleLike("test-1");
      });

      expect(result.current.likes).not.toContain("test-1");
    });

    it("does not affect other likes when toggling", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.toggleLike("test-1");
        result.current.toggleLike("test-2");
        result.current.toggleLike("test-1");
      });

      expect(result.current.likes).toEqual(["test-2"]);
    });
  });

  describe("chat threads", () => {
    it("creates a new chat thread for a product", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let threadId: string;
      act(() => {
        threadId = result.current.createChatThread(TEST_PRODUCT);
      });

      expect(threadId!).toBe("chat-test-1");
      expect(result.current.chats).toHaveLength(2); // 1 default + 1 new
      const newThread = result.current.chats.find(
        (c) => c.id === "chat-test-1",
      );
      expect(newThread).toBeDefined();
      expect(newThread!.productTitle).toBe("Test Handbag");
      expect(newThread!.productPrice).toBe(100);
      expect(newThread!.messages).toHaveLength(1);
      expect(newThread!.messages[0].sender).toBe("seller");
    });

    it("returns existing thread id without creating a duplicate", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.createChatThread(TEST_PRODUCT);
      });

      const initialCount = result.current.chats.length;

      let secondId: string;
      act(() => {
        secondId = result.current.createChatThread(TEST_PRODUCT);
      });

      expect(secondId!).toBe("chat-test-1");
      expect(result.current.chats.length).toBe(initialCount);
    });

    it("sends a user message and gets an auto-reply", async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.createChatThread(TEST_PRODUCT);
      });

      act(() => {
        result.current.sendChatMessage("chat-test-1", "Is this authentic?");
      });

      // User message should be added immediately.
      const thread = result.current.chats.find((c) => c.id === "chat-test-1");
      expect(thread!.messages).toHaveLength(2); // 1 greeting + 1 user
      expect(thread!.messages[1].sender).toBe("user");
      expect(thread!.messages[1].text).toBe("Is this authentic?");
      expect(thread!.lastMessage).toBe("Is this authentic?");

      // Wait for the simulated auto-reply (setTimeout 1500ms).
      await waitFor(
        () => {
          const updated = result.current.chats.find(
            (c) => c.id === "chat-test-1",
          );
          expect(updated!.messages).toHaveLength(3);
          expect(updated!.messages[2].sender).toBe("seller");
        },
        { timeout: 3000 },
      );
    });

    it("auto-reply mentions authenticity when asked", async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.createChatThread(TEST_PRODUCT);
      });

      act(() => {
        result.current.sendChatMessage("chat-test-1", "Is this authentic?");
      });

      await waitFor(
        () => {
          const thread = result.current.chats.find(
            (c) => c.id === "chat-test-1",
          );
          const sellerMsg = thread!.messages[2];
          expect(sellerMsg.text.toLowerCase()).toContain("authentic");
        },
        { timeout: 3000 },
      );
    });

    it("does nothing when sending a message to a non-existent thread", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const before = result.current.chats.length;

      act(() => {
        result.current.sendChatMessage("does-not-exist", "hello");
      });

      expect(result.current.chats.length).toBe(before);
    });
  });

  describe("language", () => {
    it("defaults to English", () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.language).toBe("en");
    });

    it("switches to Arabic", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.setLanguage("ar");
      });

      expect(result.current.language).toBe("ar");
      expect(localStorage.getItem("mooday_lang")).toBe("ar");
    });

    it("reads the saved language from localStorage", () => {
      localStorage.setItem("mooday_lang", "ar");

      const { result } = renderHook(() => useApp(), { wrapper });

      expect(result.current.language).toBe("ar");
    });
  });

  describe("listings", () => {
    it("adds a new custom listing", () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      const initialCount = result.current.listings.length;

      act(() => {
        result.current.addListing({
          titleEn: "New Item",
          titleAr: "قطعة جديدة",
          price: 75,
          originalPrice: 150,
          conditionEn: "New with Tags",
          conditionAr: "جديد بالملصقات",
          sellerNameEn: "Test Seller",
          sellerNameAr: "بائع اختبار",
          sellerAvatar: "/sellers/test.jpg",
          sellerTypeEn: "Verified Closet",
          sellerTypeAr: "خزانة معتمدة",
          image: "/products/new.jpg",
          images: ["/products/new.jpg"],
          descriptionEn: "A new item.",
          descriptionAr: "قطعة جديدة.",
          category: "Bags",
          isAuthentic: true,
        });
      });

      expect(result.current.listings.length).toBe(initialCount + 1);
      const newListing = result.current.listings[0];
      expect(newListing.id).toMatch(/^custom-\d+$/);
      expect(newListing.titleEn).toBe("New Item");
      expect(newListing.saves).toBe(0);
    });
  });
});
