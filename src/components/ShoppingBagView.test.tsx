import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { ShoppingBagView } from "@/components/ShoppingBagView";

// We need a dummy product
const dummyProduct = {
  id: "test-product-1",
  titleEn: "Test Product",
  titleAr: "منتج تجريبي",
  price: 100,
  originalPrice: 150,
  conditionEn: "New",
  conditionAr: "جديد",
  sellerNameEn: "Seller",
  sellerNameAr: "بائع",
  sellerAvatar: "/avatar.png",
  sellerTypeEn: "Individual",
  sellerTypeAr: "فرد",
  saves: 0,
  image: "/product.png",
  images: ["/product.png"],
  descriptionEn: "A test product",
  descriptionAr: "منتج تجريبي",
  category: "bags",
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
    createChatThread: vi.fn(() => "test-thread"),
    markChatRead: vi.fn(),
    setChatOfferStatus: vi.fn(),
    refreshChats: vi.fn(async () => {}),
    chatsLoading: false,
    refreshNotifications: vi.fn(async () => {}),
    refreshMyReviews: vi.fn(async () => {}),
    refreshReports: vi.fn(async () => {}),
    refreshDisputes: vi.fn(async () => {}),
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
    userProfile: {
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
    },
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
    signIn: vi.fn(async () => true),
    signOut: vi.fn(),
    verifyOtp: vi.fn(() => true),
    sendOtp: vi.fn(() => "000000"),
    updateCurrentUserName: vi.fn(),
    resetPassword: vi.fn(async () => true),
    ...overrides,
  };
}

function renderShoppingBag(overrides: Partial<AppContextType> = {}) {
  const ctx = makeContext(overrides);
  const onBack = vi.fn();
  const onCheckout = vi.fn();

  const utils = render(
    <AppContext.Provider value={ctx}>
      <ShoppingBagView onBack={onBack} onCheckout={onCheckout} />
    </AppContext.Provider>
  );

  return { ...utils, onBack, onCheckout, ctx };
}

describe("ShoppingBagView", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders empty state when cart is empty", () => {
    renderShoppingBag({ cart: [] });
    expect(screen.getByText("Your shopping bag is currently empty.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse Items" })).toBeInTheDocument();
  });

  it("calls onBack when Browse Items is clicked", async () => {
    const user = userEvent.setup();
    const { onBack } = renderShoppingBag({ cart: [] });
    await user.click(screen.getByRole("button", { name: "Browse Items" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("calls onBack when header back button is clicked", async () => {
    const user = userEvent.setup();
    const { onBack } = renderShoppingBag({ cart: [] });
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("renders Arabic empty state when language is ar", () => {
    renderShoppingBag({ cart: [], language: "ar" });
    expect(screen.getByText("حقيبتك فارغة حالياً.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تصفح المنتجات" })).toBeInTheDocument();
  });

  it("renders cart items", () => {
    renderShoppingBag({
      cart: [{ product: dummyProduct, quantity: 2 }],
    });

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    // It should render quantity
    expect(screen.getByText("2")).toBeInTheDocument();
    // It should render prices
    expect(screen.getByText("AED 150")).toBeInTheDocument();
    expect(screen.getByText("AED 100")).toBeInTheDocument();
  });

  it("handles quantity updates", async () => {
    const user = userEvent.setup();
    const { ctx } = renderShoppingBag({
      cart: [{ product: dummyProduct, quantity: 2 }],
    });

    const increaseBtn = screen.getByRole("button", { name: "Increase" });
    const decreaseBtn = screen.getByRole("button", { name: "Decrease" });

    await user.click(increaseBtn);
    expect(ctx.updateQuantity).toHaveBeenCalledWith("test-product-1", 3);

    await user.click(decreaseBtn);
    expect(ctx.updateQuantity).toHaveBeenCalledWith("test-product-1", 1);
  });

  it("handles removing items", async () => {
    const user = userEvent.setup();
    const { ctx } = renderShoppingBag({
      cart: [{ product: dummyProduct, quantity: 1 }],
    });

    const removeBtn = screen.getByRole("button", { name: "Remove" });
    await user.click(removeBtn);

    expect(ctx.removeFromCart).toHaveBeenCalledWith("test-product-1");
  });

  it("calculates order summary correctly (with shipping)", () => {
    renderShoppingBag({
      cart: [{ product: dummyProduct, quantity: 1 }],
    });

    // Subtotal: 150
    // Discount: 50
    // Shipping: 25 (since totalDiscounted is 100 which is < 1000)
    // Total: 125

    expect(screen.getAllByText("AED 150")[1]).toBeInTheDocument(); // Subtotal (there's also the original price strike-through)
    expect(screen.getByText("-AED 50")).toBeInTheDocument(); // Savings
    expect(screen.getByText("AED 25")).toBeInTheDocument(); // Shipping
    expect(screen.getByText("AED 125")).toBeInTheDocument(); // Total
  });

  it("calculates order summary correctly (free shipping)", () => {
    renderShoppingBag({
      // We need totalDiscounted > 1000 to get free shipping
      cart: [{ product: dummyProduct, quantity: 11 }], // 100 * 11 = 1100
    });

    expect(screen.getByText("FREE")).toBeInTheDocument(); // Shipping
    expect(screen.getByText("AED 1100")).toBeInTheDocument(); // Total
  });

  it("handles checkout", async () => {
    const user = userEvent.setup();
    const { onCheckout } = renderShoppingBag({
      cart: [{ product: dummyProduct, quantity: 1 }],
    });

    await user.click(screen.getByRole("button", { name: "Checkout Now" }));
    expect(onCheckout).toHaveBeenCalled();
  });

  it("saves an item for later and moves it back to bag", async () => {
    const user = userEvent.setup();
    const { ctx } = renderShoppingBag({
      cart: [{ product: dummyProduct, quantity: 1 }],
    });

    // Click "Save for later"
    await user.click(screen.getByRole("button", { name: "Save for later" }));

    // Expect item to be removed from cart
    expect(ctx.removeFromCart).toHaveBeenCalledWith("test-product-1");

    // The component persists this to localStorage. To see "Saved for later" section,
    // it updates state immediately.
    expect(screen.getByText("Saved for later")).toBeInTheDocument();

    // Now let's move it back
    await user.click(screen.getByRole("button", { name: "Move to bag" }));

    expect(ctx.addToCart).toHaveBeenCalledWith(dummyProduct);
  });
});
