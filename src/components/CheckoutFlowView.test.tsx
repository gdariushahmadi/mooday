import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AppContext,
  type AppContextType,
  type Product,
} from "@/context/AppContext";
import type { Address } from "@/data/addresses";
import { CheckoutFlowView } from "@/components/CheckoutFlowView";
import { PHONE_PLACEHOLDER } from "@/lib/constants";

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
  phone: "+971 4 555 1234",
  streetEn: "Gate Avenue, Level 9",
  streetAr: "جيت أفينيو، الطابق 9",
  isDefault: false,
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
    clearCart: vi.fn(async () => {}),
    chats: [],
    setActiveChats: vi.fn(),
    sendChatMessage: vi.fn(),
    createChatThread: vi.fn(() => "t1"),
    markChatRead: vi.fn(),
    setChatOfferStatus: vi.fn(),
    refreshChats: vi.fn(async () => {}),
    chatsLoading: false,
    refreshNotifications: vi.fn(async () => {}),
    refreshMyReviews: vi.fn(async () => {}),
    refreshReports: vi.fn(async () => {}),
    refreshDisputes: vi.fn(async () => {}),
    addresses: [ADDR_HOME, ADDR_WORK],
    addAddress: vi.fn(async (address) => ({ ...address, id: "addr-new" })),
    updateAddress: vi.fn(),
    removeAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
    paymentMethods: [],
    addPaymentMethod: vi.fn(),
    removePaymentMethod: vi.fn(),
    setDefaultPaymentMethod: vi.fn(),
    orders: [],
    recordOrder: vi.fn(),
    recordDemoOrder: vi.fn(() => "demo-1"),
    notifications: [],
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    userProfile: {
      fullNameEn: "Test User",
      fullNameAr: "مستخدم اختبار",
      handle: "@test",
      avatar: "/sellers/test.jpg",
      bioEn: "Test bio",
      bioAr: "نبذة",
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
    updateListing: vi.fn(),
    removeListing: vi.fn(),
    updateOrderStatus: vi.fn(),
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

function renderCheckout(
  opts: {
    language?: "en" | "ar";
    context?: Partial<AppContextType>;
    checkoutProduct?: Product | null;
  } = {},
) {
  const context = makeContext({ language: opts.language ?? "en", ...opts.context });
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
  return { ...utils, context, onBack, onSuccess };
}

async function advanceToDemo() {
  const user = userEvent.setup();
  renderCheckout();
  await user.click(screen.getByRole("button", { name: /Continue to demo order/i }));
  return user;
}

beforeEach(() => {
  localStorage.clear();
});

describe("CheckoutFlowView — address step", () => {
  it("renders and selects saved addresses", async () => {
    const user = userEvent.setup();
    renderCheckout();

    expect(screen.getByText("Saved addresses")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();

    const homeRadio = screen.getByRole("radio", { name: /Home — Villa 24/ });
    const workRadio = screen.getByRole("radio", { name: /Work — Gate Avenue/ });
    expect(homeRadio).toBeChecked();
    await user.click(workRadio);
    expect(workRadio).toBeChecked();
    expect(homeRadio).not.toBeChecked();
  });

  it("opens the new address form and persists the new default address", async () => {
    const user = userEvent.setup();
    const addAddress = vi.fn(async (address: Omit<Address, "id">) => ({ ...address, id: "addr-new" }));
    const setDefaultAddress = vi.fn(async () => {});
    renderCheckout({ context: { addresses: [], addAddress, setDefaultAddress } });

    expect(screen.getByText("New delivery address")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/Enter your full name/i), "New Buyer");
    await user.type(screen.getByPlaceholderText(PHONE_PLACEHOLDER), "0500000000");
    await user.type(screen.getByPlaceholderText(/Villa 24/i), "Building 1");
    await user.click(screen.getByRole("button", { name: /Continue to demo order/i }));

    expect(addAddress).toHaveBeenCalledTimes(1);
    expect(setDefaultAddress).toHaveBeenCalledWith("addr-new");
    expect(screen.getByText("Public demo order")).toBeInTheDocument();
  });

  it("supports Arabic labels", async () => {
    const user = userEvent.setup();
    renderCheckout({ language: "ar" });
    await user.click(screen.getByRole("button", { name: /إضافة عنوان/i }));
    expect(screen.getByText(/عنوان توصيل جديد/)).toBeInTheDocument();
    expect(screen.getByText(/الاسم الكامل/)).toBeInTheDocument();
  });
});

describe("CheckoutFlowView — public demo mode", () => {
  it("does not render payment fields or real payment options", async () => {
    await advanceToDemo();

    expect(screen.getByText("Public demo order")).toBeInTheDocument();
    expect(screen.getByText(/No card number or CVV is requested/i)).toBeInTheDocument();
    expect(screen.queryByText(/Apple Pay|Cash on Delivery|escrow|Payment secured/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/card number|CVV|security code/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /card/i })).not.toBeInTheDocument();
  });

  it("records a local demo order and clears the bag only after success", async () => {
    const user = userEvent.setup();
    const recordDemoOrder = vi.fn(() => "demo-abc");
    const recordOrder = vi.fn();
    const clearCart = vi.fn(async () => {});
    const { onSuccess } = renderCheckout({ context: { recordDemoOrder, recordOrder, clearCart } });

    await user.click(screen.getByRole("button", { name: /Continue to demo order/i }));
    await user.click(screen.getByRole("button", { name: /Save demo order/i }));

    expect(recordDemoOrder).toHaveBeenCalledWith(expect.objectContaining({
      product: PRODUCT,
      address: ADDR_HOME,
      subtotal: 1200,
      shipping: 0,
      total: 1200,
    }));
    expect(recordOrder).not.toHaveBeenCalled();
    expect(clearCart).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Demo order saved")).toBeInTheDocument();
    expect(screen.getByText("demo-abc")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("does not show success or clear the bag when saving fails", async () => {
    const user = userEvent.setup();
    const recordDemoOrder = vi.fn(() => {
      throw new Error("storage failed");
    });
    const clearCart = vi.fn(async () => {});
    renderCheckout({ context: { recordDemoOrder, clearCart } });

    await user.click(screen.getByRole("button", { name: /Continue to demo order/i }));
    await user.click(screen.getByRole("button", { name: /Save demo order/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not save this demo order/i);
    expect(screen.queryByText("Demo order saved")).not.toBeInTheDocument();
    expect(clearCart).not.toHaveBeenCalled();
  });

  it("uses one item with quantity one for direct checkout", async () => {
    const user = userEvent.setup();
    const recordDemoOrder = vi.fn(() => "demo-direct");
    renderCheckout({ checkoutProduct: PRODUCT, context: { recordDemoOrder } });
    await user.click(screen.getByRole("button", { name: /Continue to demo order/i }));
    expect(screen.getByText(/Quantity: 1/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Save demo order/i }));

    expect(recordDemoOrder).toHaveBeenCalledWith(expect.objectContaining({ product: PRODUCT }));
  });

  it("returns from the demo step to the address step", async () => {
    const user = await advanceToDemo();
    await user.click(screen.getByRole("button", { name: /Back to address/i }));
    expect(screen.getByText("Saved addresses")).toBeInTheDocument();
  });
});
