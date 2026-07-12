import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { SellModePickerView } from "@/components/SellModePickerView";

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

function renderPicker(opts: { language?: "en" | "ar" } = {}) {
  const context = makeContext({ language: opts.language });
  const onBack = vi.fn();
  const onPickResell = vi.fn();
  render(
    <AppContext.Provider value={context}>
      <SellModePickerView onBack={onBack} onPickResell={onPickResell} />
    </AppContext.Provider>,
  );
  return { onBack, onPickResell };
}

beforeEach(() => {
  localStorage.clear();
});

describe("SellModePickerView (D-18)", () => {
  it("renders the page title", () => {
    renderPicker();
    expect(
      screen.getByText("What do you want to sell?"),
    ).toBeInTheDocument();
  });

  it("renders AR title when language is ar", () => {
    renderPicker({ language: "ar" });
    expect(screen.getByText("ماذا تريدين أن تبيعي؟")).toBeInTheDocument();
  });

  it("renders both mode cards (Resell + Rent)", () => {
    renderPicker();
    expect(screen.getByText("Resell")).toBeInTheDocument();
    expect(screen.getByText("Rent out")).toBeInTheDocument();
  });

  it("Resell is the clickable CTA", async () => {
    const user = userEvent.setup();
    const { onPickResell } = renderPicker();
    await user.click(screen.getByRole("button", { name: /Start reselling/i }));
    expect(onPickResell).toHaveBeenCalledTimes(1);
  });

  it("Rent card is disabled (aria-disabled=true)", () => {
    renderPicker();
    const rentCta = screen.getByRole("button", { name: /Coming soon/i });
    expect(rentCta).toHaveAttribute("aria-disabled", "true");
  });

  it("Rent card carries a Phase 4 pill", () => {
    renderPicker();
    expect(screen.getByText(/Coming in Phase 4/i)).toBeInTheDocument();
  });

  it("Back button calls onBack", async () => {
    const user = userEvent.setup();
    const { onBack } = renderPicker();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
