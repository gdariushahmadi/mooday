import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { SellItemView } from "@/components/SellItemView";

function makeContext(
  overrides: Partial<AppContextType> = {},
): AppContextType {
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

function renderSell(opts: { language?: "en" | "ar" } = {}) {
  const ctx = makeContext({ language: opts.language });
  const onBack = vi.fn();
  const onSuccess = vi.fn();
  render(
    <AppContext.Provider value={ctx}>
      <SellItemView onBack={onBack} onSuccess={onSuccess} />
    </AppContext.Provider>,
  );
  return { onBack, onSuccess, ctx };
}

beforeEach(() => {
  localStorage.clear();
  // Stub alert so the validation case doesn't pop a real dialog.
  globalThis.alert = vi.fn();
});

describe("SellItemView (D-19)", () => {
  it("renders the page title in EN", () => {
    renderSell();
    expect(screen.getByText("Sell an Item")).toBeInTheDocument();
  });

  it("renders Arabic title in AR", () => {
    renderSell({ language: "ar" });
    expect(screen.getByText("عرض قطعة للبيع")).toBeInTheDocument();
  });

  it("Back button with aria-label", () => {
    renderSell();
    expect(
      screen.getByRole("button", { name: "Back" }),
    ).toBeInTheDocument();
  });

  it("renders the ListingForm fields (title, price, etc.)", () => {
    renderSell();
    expect(screen.getByText(/Title \(English\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Title \(Arabic\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Your price/i)).toBeInTheDocument();
    expect(screen.getByText(/Retail price/i)).toBeInTheDocument();
  });

  it("Publishing with a title + price calls addListing + onSuccess", async () => {
    const user = userEvent.setup();
    const { ctx, onSuccess } = renderSell();

    // Fill the EN title and price.
    const titleInput = screen.getAllByDisplayValue("")[0];
    // Use a more robust locator by label text.
    const enTitle =
      screen.getByText(/Title \(English\)/i).parentElement?.querySelector(
        "input",
      );
    expect(enTitle).toBeInTheDocument();
    await user.type(enTitle!, "Vintage Crossbody");
    const priceInput =
      screen.getByText(/Your price/i).parentElement?.querySelector(
        "input",
      );
    await user.type(priceInput!, "499");
    await user.click(
      screen.getByRole("button", { name: /Publish listing/i }),
    );

    expect(ctx.addListing).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("'Save as draft' is also available", () => {
    renderSell();
    expect(
      screen.getByRole("button", { name: /Save as draft/i }),
    ).toBeInTheDocument();
  });

  it("Back button calls onBack", async () => {
    const user = userEvent.setup();
    const { onBack } = renderSell();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("Discount % shows when price < original price", async () => {
    const user = userEvent.setup();
    renderSell();
    const priceInput =
      screen.getByText(/Your price/i).parentElement?.querySelector("input");
    const originalInput =
      screen.getByText(/Retail price/i).parentElement?.querySelector("input");
    await user.type(originalInput!, "1000");
    await user.type(priceInput!, "500");
    expect(screen.getByText(/Discount %:/)).toBeInTheDocument();
  });
});
