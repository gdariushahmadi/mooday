import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import type { Product } from "@/context/AppContext";
import { EditListingView } from "@/components/EditListingView";

const PRODUCT: Product = {
  id: "edit-me",
  titleEn: "Editable Bag",
  titleAr: "حقيبة قابلة للتعديل",
  price: 800,
  originalPrice: 1600,
  conditionEn: "Excellent Condition",
  conditionAr: "حالة ممتازة",
  sellerNameEn: "Sarah",
  sellerNameAr: "سارة",
  sellerAvatar: "/sellers/sarah.jpg",
  sellerTypeEn: "Verified",
  sellerTypeAr: "موثق",
  saves: 50,
  image: "/products/p.jpg",
  images: ["/products/p.jpg"],
  descriptionEn: "Pre-loved, lightly used.",
  descriptionAr: "مستعمل، بحالة ممتازة.",
  category: "Bags",
  size: "M",
  colorEn: "Black",
  colorAr: "أسود",
  mode: "resell",
};

function makeContext(
  overrides: Partial<AppContextType> = {},
): AppContextType {
  return {
    language: "en",
    setLanguage: vi.fn(),
    listings: [PRODUCT],
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
    notifications: [],
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    updateOrderStatus: vi.fn(),
    ...overrides,
  };
}

function renderEdit(opts: { language?: "en" | "ar" } = {}) {
  const ctx = makeContext({ language: opts.language });
  const onBack = vi.fn();
  const onSuccess = vi.fn();
  render(
    <AppContext.Provider value={ctx}>
      <EditListingView
        product={PRODUCT}
        onBack={onBack}
        onSuccess={onSuccess}
      />
    </AppContext.Provider>,
  );
  return { onBack, onSuccess, ctx };
}

beforeEach(() => {
  localStorage.clear();
  globalThis.alert = vi.fn();
});

describe("EditListingView (D-21)", () => {
  it("renders the page title in EN", () => {
    renderEdit();
    expect(screen.getByText(/Edit listing/i)).toBeInTheDocument();
  });

  it("renders Arabic title in AR", () => {
    renderEdit({ language: "ar" });
    expect(screen.getByText(/تعديل المنتج/i)).toBeInTheDocument();
  });

  it("Prefills the form with the existing product values", () => {
    renderEdit();
    const enTitle =
      screen.getByText(/Title \(English\)/i).parentElement?.querySelector(
        "input",
      );
    expect(enTitle).toHaveValue("Editable Bag");
  });

  it("Submitting calls updateListing with the product id", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderEdit();
    await user.click(
      screen.getByRole("button", { name: /Publish listing/i }),
    );
    expect(ctx.updateListing).toHaveBeenCalledWith(
      "edit-me",
      expect.objectContaining({ titleEn: "Editable Bag" }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("Back calls onBack", async () => {
    const user = userEvent.setup();
    const { onBack } = renderEdit();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });
});
