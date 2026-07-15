import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AppContext,
  type AppContextType,
  type Product,
} from "@/context/AppContext";
import type { Address } from "@/data/addresses";
import type { PaymentMethod } from "@/data/paymentMethods";
import { CheckoutFlowView } from "@/components/CheckoutFlowView";

const PRODUCT: Product = {
  id: "p1",
  titleEn: "Vintage Handbag",
  titleAr: "حقيبة عتيقة",
  price: 1200,
  originalPrice: 2400,
  conditionEn: "Excellent Condition",
  conditionAr: "حالة ممتازة",
  sellerNameEn: "Sarah",
  sellerNameAr: "سارة",
  sellerAvatar: "/sellers/sarah.jpg",
  sellerTypeEn: "Verified",
  sellerTypeAr: "موثق",
  saves: 100,
  image: "/products/p1.jpg",
  images: ["/products/p1.jpg"],
  descriptionEn: "A vintage handbag.",
  descriptionAr: "حقيبة عتيقة.",
  category: "Bags",
  size: "OS",
  colorEn: "Tan",
  colorAr: "بني",
  mode: "resell",
};

const ADDR_HOME: Address = {
  id: "addr-home",
  labelEn: "Home",
  labelAr: "المنزل",
  fullNameEn: "Layla Mansour",
  fullNameAr: "ليلى منصور",
  phone: "+971 50 123 4567",
  cityEn: "Dubai",
  cityAr: "دبي",
  streetEn: "Villa 24, Al Wasl Road",
  streetAr: "فيلا 24، شارع الوصل",
  isDefault: true,
};

const ADDR_WORK: Address = {
  ...ADDR_HOME,
  id: "addr-work",
  labelEn: "Work",
  labelAr: "العمل",
  fullNameEn: "Layla Mansour",
  fullNameAr: "ليلى منصور",
  phone: "+971 4 555 1234",
  streetEn: "Gate Avenue, Level 9",
  streetAr: "جيت أفينيو، الطابق 9",
  isDefault: false,
};

const CARD_VISA: PaymentMethod = {
  id: "pm-visa",
  labelEn: "Personal Visa",
  labelAr: "فيزا شخصية",
  brandEn: "Visa",
  brandAr: "فيزا",
  last4: "4242",
  holderEn: "Layla Mansour",
  holderAr: "ليلى منصور",
  expiry: "11/27",
  isDefault: true,
};

function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
  return {
    language: "en",
    setLanguage: vi.fn(),
    listings: [],
    addListing: vi.fn(),
    likes: [],
    toggleLike: vi.fn(),
    cart: [{ product: PRODUCT, quantity: 1 }],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    chats: [],
    sendChatMessage: vi.fn(),
    createChatThread: vi.fn(() => "t1"),
    addresses: [ADDR_HOME, ADDR_WORK],
    addAddress: vi.fn(),
    updateAddress: vi.fn(),
    removeAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
    paymentMethods: [CARD_VISA],
    addPaymentMethod: vi.fn(),
    removePaymentMethod: vi.fn(),
    setDefaultPaymentMethod: vi.fn(),
    orders: [],
    recordOrder: vi.fn(),
    notifications: [],
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
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
    updateListing: vi.fn(),
    removeListing: vi.fn(),
    updateOrderStatus: vi.fn(),
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

function renderCheckout(
  opts: {
    language?: "en" | "ar";
    context?: Partial<AppContextType>;
    checkoutProduct?: Product | null;
  } = {},
) {
  const context = makeContext({ language: opts.language, ...opts.context });
  const onBack = vi.fn();
  const onSuccess = vi.fn();
  const utils = render(
    <AppContext.Provider value={context}>
      <CheckoutFlowView
        checkoutProduct={opts.checkoutProduct ?? null}
        onBack={onBack}
        onSuccess={onSuccess}
      />
    </AppContext.Provider>,
  );
  return { ...utils, onBack, onSuccess };
}

beforeEach(() => {
  localStorage.clear();
});

describe("CheckoutFlowView — address step (C-13)", () => {
  it("renders the address step heading", () => {
    renderCheckout();
    expect(screen.getByText("Saved addresses")).toBeInTheDocument();
  });

  it("renders both saved addresses from context", () => {
    renderCheckout();
    // Both addresses' labels appear (their streets too).
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText(/Villa 24/)).toBeInTheDocument();
    expect(screen.getByText(/Gate Avenue/)).toBeInTheDocument();
  });

  it("marks the default address with a Default badge", () => {
    renderCheckout();
    // The Home card carries the Default badge.
    const homeBlock = screen.getByText("Home").closest("label");
    expect(homeBlock?.textContent).toMatch(/Default/);
  });

  it("pre-selects the default address", () => {
    renderCheckout();
    const homeRadio = screen.getByRole("radio", {
      name: /Home — Villa 24, Al Wasl Road/,
    });
    expect(homeRadio).toBeChecked();
  });

  it("selecting a different address switches the radio", async () => {
    const user = userEvent.setup();
    renderCheckout();
    const workRadio = screen.getByRole("radio", {
      name: /Work — Gate Avenue/,
    });
    await user.click(workRadio);
    expect(workRadio).toBeChecked();
    // Home is no longer checked.
    expect(
      screen.getByRole("radio", { name: /Home — Villa 24/ }),
    ).not.toBeChecked();
  });

  it("clicking 'Add a new address' reveals the new-address form", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(
      screen.getByRole("button", { name: /Add a new address/i }),
    );
    // The label text changes from "Saved addresses" to "New delivery address"
    // when the new-address form opens.
    expect(screen.getByText(/New delivery address/i)).toBeInTheDocument();
    // Inputs are present (use placeholder since labels are siblings,
    // not wrapped around inputs in the JSX).
    expect(
      screen.getByPlaceholderText(/Enter your full name/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/\+971 5X XXX XXXX/i),
    ).toBeInTheDocument();
  });

  it("Arabic: opens the new-address form with Arabic labels", async () => {
    const user = userEvent.setup();
    renderCheckout({ language: "ar" });
    await user.click(screen.getByRole("button", { name: /\+ إضافة عنوان/i }));
    expect(screen.getByText(/عنوان جديد/)).toBeInTheDocument();
    expect(screen.getByText(/الاسم الكامل/)).toBeInTheDocument();
  });

  it("Continue to payment advances to step 2", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(
      screen.getByRole("button", { name: /Continue to payment/i }),
    );
    // Step 2 heading visible.
    expect(screen.getByText("Payment method")).toBeInTheDocument();
  });
});

describe("CheckoutFlowView — payment step (C-14)", () => {
  async function advanceToPayment() {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(
      screen.getByRole("button", { name: /Continue to payment/i }),
    );
    return user;
  }

  it("shows the saved cards list", async () => {
    await advanceToPayment();
    // Visa card text.
    expect(screen.getByText(/Visa •••• 4242/)).toBeInTheDocument();
  });

  it("places the saved-card as default-selected", async () => {
    await advanceToPayment();
    const cardRadio = screen.getByRole("radio", {
      name: /Visa ending in 4242/i,
    });
    expect(cardRadio).toBeChecked();
  });

  it("displays the four payment options (Card, Apple Pay, COD)", async () => {
    await advanceToPayment();
    expect(screen.getByRole("radio", { name: /Card/i })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Apple Pay/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Cash/i })).toBeInTheDocument();
  });

  it("selecting Cash on Delivery shows the COD panel", async () => {
    const user = await advanceToPayment();
    await user.click(screen.getByRole("radio", { name: /Cash/i }));
    expect(
      screen.getByText(/Pay in cash when your order arrives/i),
    ).toBeInTheDocument();
  });

  it("disables Cash on Delivery above AED 5,000 with a visible reason", async () => {
    const expensive = { ...PRODUCT, id: "expensive", price: 6000 };
    const user = userEvent.setup();
    renderCheckout({ checkoutProduct: expensive });
    await user.click(
      screen.getByRole("button", { name: /Continue to payment/i }),
    );

    expect(screen.getByRole("radio", { name: /Cash/i })).toBeDisabled();
    expect(
      screen.getByText(/unavailable for orders over AED 5,000/i),
    ).toBeInTheDocument();
  });

  it("reports missing payment details inline", async () => {
    const user = userEvent.setup();
    renderCheckout({ context: { paymentMethods: [] } });
    await user.click(
      screen.getByRole("button", { name: /Continue to payment/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Secure checkout/i }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete the required fields/i,
    );
  });

  it("selecting Apple Pay shows the Apple Pay panel", async () => {
    const user = await advanceToPayment();
    await user.click(screen.getByRole("radio", { name: /Apple Pay/i }));
    expect(
      screen.getByText(/One-tap payment via Apple Pay/i),
    ).toBeInTheDocument();
  });

  it("clicking 'Add a new card' reveals the new-card form", async () => {
    const user = await advanceToPayment();
    await user.click(
      screen.getByRole("button", { name: /\+ Add a new card/i }),
    );
    // "New card" heading appears.
    expect(screen.getByText(/^New card$/i)).toBeInTheDocument();
    // Card inputs are present via placeholders (labels are siblings,
    // not wrapped around inputs in the JSX).
    expect(
      screen.getByPlaceholderText(/4000 1234 5678 9010/),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/MM\/YY/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\*\*\*/)).toBeInTheDocument();
  });

  it("Back to address returns to step 1", async () => {
    const user = await advanceToPayment();
    await user.click(screen.getByRole("button", { name: /Back to address/i }));
    expect(screen.getByText("Saved addresses")).toBeInTheDocument();
  });
});

describe("CheckoutFlowView — confirmation (C-15)", () => {
  it("after payment, shows the Order placed screen", async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderCheckout();
    // Advance through steps.
    await user.click(
      screen.getByRole("button", { name: /Continue to payment/i }),
    );
    await user.click(screen.getByRole("button", { name: /Secure checkout/i }));

    // Confirmation appears after the 2s processing timer.
    expect(
      await screen.findByText("Order placed", {}, { timeout: 3000 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Back to home/i }));
    expect(onSuccess).toHaveBeenCalled();
  }, 5000);

  it("renders the order timeline on the confirmation screen", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(
      screen.getByRole("button", { name: /Continue to payment/i }),
    );
    await user.click(screen.getByRole("button", { name: /Secure checkout/i }));
    expect(
      await screen.findByText(/Order Tracking/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Payment secured/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  }, 5000);
});
