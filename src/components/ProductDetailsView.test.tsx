import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { ProductDetailsView } from "@/components/ProductDetailsView";
import type { Product } from "@/context/AppContext";

const HAND: Product = {
  id: "handbag-tan",
  titleEn: "Vintage Classic Handbag in Tan Leather",
  titleAr: "حقيبة كلاسيكية عتيقة من الجلد البني",
  price: 1250,
  originalPrice: 2500,
  conditionEn: "Excellent Condition",
  conditionAr: "حالة ممتازة",
  sellerNameEn: "Sarah's Vintage",
  sellerNameAr: "عتيق سارة",
  sellerAvatar: "/sellers/sarah.jpg",
  sellerTypeEn: "Verified Collector",
  sellerTypeAr: "جامع معتمد",
  saves: 432,
  image: "/products/handbag-tan-1.jpg",
  images: ["/products/handbag-tan-1.jpg", "/products/handbag-tan-2.jpg"],
  descriptionEn: "A vintage tan leather handbag.",
  descriptionAr: "حقيبة كلاسيكية عتيقة.",
  category: "Bags",
  isAuthentic: true,
  size: "OS",
  colorEn: "Tan",
  colorAr: "بني فاتح",
  mode: "resell",
};

const DRESS: Product = {
  ...HAND,
  id: "midi-dress",
  titleEn: "Floral Midi Dress",
  titleAr: "فستان ميدي مزهر",
  category: "Dresses",
  size: "M",
  images: ["/products/midi-dress-1.jpg"],
  isAuthentic: false,
};

const ALL: Product[] = [HAND, DRESS];

function makeContext(language: "en" | "ar" = "en"): AppContextType {
  return {
    language,
    setLanguage: vi.fn(),
    listings: ALL,
    addListing: vi.fn(),
    likes: [],
    toggleLike: vi.fn(),
    cart: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    chats: [],
    sendChatMessage: vi.fn(),
    createChatThread: vi.fn(() => "thread-1"),
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
    updateListing: vi.fn(),
    removeListing: vi.fn(),
    updateOrderStatus: vi.fn(),
  };
}

function renderView(
  product: Product = HAND,
  overrides: Partial<React.ComponentProps<typeof ProductDetailsView>> = {},
) {
  const context = makeContext();
  const onBack = vi.fn();
  const onNavigateToCart = vi.fn();
  const onStartChat = vi.fn();
  const onCheckoutProduct = vi.fn();
  const utils = render(
    <AppContext.Provider value={context}>
      <ProductDetailsView
        product={product}
        onBack={onBack}
        onNavigateToCart={onNavigateToCart}
        onStartChat={onStartChat}
        onCheckoutProduct={onCheckoutProduct}
        {...overrides}
      />
    </AppContext.Provider>,
  );
  return {
    ...utils,
    onBack,
    onNavigateToCart,
    onStartChat,
    onCheckoutProduct,
    context,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("ProductDetailsView — depth", () => {
  it("renders a breadcrumb with category and derived sub-category", () => {
    renderView(HAND);

    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(breadcrumb).toBeInTheDocument();
    // "Bags" top category and "Handbags" sub-category (from title keywords).
    expect(breadcrumb.textContent).toContain("Home");
    expect(breadcrumb.textContent).toContain("Bags");
    expect(breadcrumb.textContent).toContain("Handbags");
  });

  it("falls back to the top category when no sub-category keyword matches", () => {
    const weird = { ...HAND, titleEn: "Mystery Item" };
    renderView(weird);

    // The breadcrumb's last segment is the sub-category. With an
    // unknown keyword, it should fall back to the top category name.
    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    // The last item carries aria-current="page".
    const currentPage = breadcrumb.querySelector("[aria-current=page]");
    expect(currentPage).not.toBeNull();
    expect(currentPage?.textContent).toBe("Bags");
  });

  it("shows the discount % pill based on retail vs. mooday price", () => {
    renderView(HAND); // 1250 from 2500 = 50% off

    expect(screen.getByText(/50% off/i)).toBeInTheDocument();
  });

  it("hides the size row when size is OS", () => {
    renderView(HAND);

    // No "Size:" label since HAND has size="OS".
    expect(screen.queryByText(/^Size:/i)).not.toBeInTheDocument();
  });

  it("shows the size row when size is not OS", () => {
    renderView(DRESS); // size: "M"

    expect(screen.getByText(/^Size:/i)).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("shipping section is collapsed by default", () => {
    renderView(HAND);

    const trigger = screen.getByRole("button", { name: /shipping & returns/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("shipping section expands on click and shows three lines", async () => {
    const user = userEvent.setup();
    renderView(HAND);

    await user.click(
      screen.getByRole("button", { name: /shipping & returns/i }),
    );

    expect(
      screen.getByText(/Ships within 24h from Dubai/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Free shipping on orders over AED 1,000/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Returns accepted within 7 days/i),
    ).toBeInTheDocument();
  });

  it("thumbnails switch the main image", async () => {
    const user = userEvent.setup();
    renderView(HAND);

    // Two thumbnails (HAND has 2 images).
    const img1Btn = screen.getByRole("button", { name: /image 1/i });
    const img2Btn = screen.getByRole("button", { name: /image 2/i });

    expect(img1Btn).toHaveAttribute("aria-pressed", "true");
    expect(img2Btn).toHaveAttribute("aria-pressed", "false");

    await user.click(img2Btn);
    expect(img2Btn).toHaveAttribute("aria-pressed", "true");
  });

  it("tapping the main image opens the zoom modal", async () => {
    const user = userEvent.setup();
    renderView(HAND);

    await user.click(
      screen.getByRole("button", { name: /zoom vintage classic handbag/i }),
    );

    // The zoom dialog is rendered.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Esc closes the zoom modal", async () => {
    const user = userEvent.setup();
    renderView(HAND);

    await user.click(
      screen.getByRole("button", { name: /zoom vintage classic handbag/i }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("overflow menu opens and exposes the report action", async () => {
    const user = userEvent.setup();
    const onReportListing = vi.fn();
    renderView(HAND, { onReportListing });

    await user.click(screen.getByRole("button", { name: /more actions/i }));

    const reportBtn = screen.getByRole("menuitem", {
      name: /report this listing/i,
    });
    expect(reportBtn).toBeInTheDocument();

    await user.click(reportBtn);
    expect(onReportListing).toHaveBeenCalledWith("handbag-tan");
  });

  it("buy now calls onCheckoutProduct", async () => {
    const user = userEvent.setup();
    const { onCheckoutProduct } = renderView(HAND);

    await user.click(screen.getByRole("button", { name: /buy now/i }));
    expect(onCheckoutProduct).toHaveBeenCalledWith(HAND);
  });

  it("add to bag shows the success alert and calls addToCart", async () => {
    const user = userEvent.setup();
    const { context } = renderView(HAND);

    await user.click(
      screen.getByRole("button", { name: /add to shopping bag/i }),
    );
    expect(context.addToCart).toHaveBeenCalledWith(HAND);

    // The success alert is announced.
    expect(
      screen.getByText(/successfully added to your shopping bag/i),
    ).toBeInTheDocument();
  });

  it("renders Arabic breadcrumb labels when language is ar", () => {
    const context = makeContext("ar");
    render(
      <AppContext.Provider value={context}>
        <ProductDetailsView
          product={HAND}
          onBack={() => {}}
          onNavigateToCart={() => {}}
          onStartChat={() => {}}
          onCheckoutProduct={() => {}}
        />
      </AppContext.Provider>,
    );

    expect(screen.getByText("الرئيسية")).toBeInTheDocument();
    // "حقائب" is the Arabic for "Bags".
    expect(screen.getByText("حقائب")).toBeInTheDocument();
  });
});
