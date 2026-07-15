import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

const mocks = vi.hoisted(() => ({
  useApp: vi.fn(),
  useAppNavigation: vi.fn(),
  useWelcomeGuard: vi.fn(),
}));

vi.mock("@/context/AppContext", () => ({ useApp: mocks.useApp }));
vi.mock("@/hooks/useAppNavigation", () => ({
  useAppNavigation: mocks.useAppNavigation,
}));
vi.mock("@/hooks/useWelcomeGuard", () => ({
  useWelcomeGuard: mocks.useWelcomeGuard,
}));
vi.mock("@/hooks/useForcedMobile", () => ({ useForcedMobile: vi.fn() }));
vi.mock("@/components/AppContent", () => ({
  AppContent: () => <div data-testid="app-content" />,
}));
vi.mock("@/components/InstallPrompt", () => ({ InstallPrompt: () => null }));
vi.mock("@/components/WelcomeView", () => ({
  WelcomeView: () => <div data-testid="welcome-view" />,
}));

const changeTab = vi.fn();
const setView = vi.fn();

function setShellState(
  overrides: Partial<{
    currentView: string;
    selectedProduct: object | null;
    activeChatThreadId: string | null;
    activeTab: string;
  }> = {},
) {
  mocks.useAppNavigation.mockReturnValue({
    activeTab: "home",
    currentView: "home",
    selectedProduct: null,
    activeChatThreadId: null,
    changeTab,
    setView,
    openSignIn: vi.fn(),
    openSignUp: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useApp.mockReturnValue({
    language: "en",
    cart: [{ quantity: 12 }],
  });
  mocks.useWelcomeGuard.mockReturnValue({
    shouldShow: false,
    markSeen: vi.fn(),
  });
  setShellState();
});

describe("app shell", () => {
  it("matches the Phase 1 header hierarchy", () => {
    render(<Home />);

    expect(screen.getByTestId("app-header")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Home" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Shopping Bag" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Account" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Notifications" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("wires header actions to the shared navigation state", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(setView).toHaveBeenCalledWith("settings");

    await user.click(screen.getByRole("button", { name: "Shopping Bag" }));
    expect(setView).toHaveBeenCalledWith("bag");

    await user.click(screen.getByRole("button", { name: "Go to Home" }));
    expect(changeTab).toHaveBeenCalledWith("home");
  });

  it("renders five non-overflowing primary navigation destinations", () => {
    render(<Home />);

    const nav = screen.getByTestId("bottom-navigation");
    expect(nav).toHaveAttribute("aria-label", "Primary navigation");
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sell" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vault" })).toBeInTheDocument();
  });

  it("exposes localized shell labels in Arabic", () => {
    mocks.useApp.mockReturnValue({ language: "ar", cart: [] });
    render(<Home />);

    expect(screen.getByRole("button", { name: "الإعدادات" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "حقيبة التسوق" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("bottom-navigation")).toHaveAttribute(
      "aria-label",
      "التنقل الرئيسي",
    );
  });

  it.each([
    ["bag", null, null],
    ["checkout", null, null],
    ["home", { id: "product" }, null],
    ["home", null, "chat-thread"],
  ])(
    "hides shared chrome for full-page state %s",
    (currentView, selectedProduct, activeChatThreadId) => {
      setShellState({ currentView, selectedProduct, activeChatThreadId });
      render(<Home />);

      expect(screen.queryByTestId("app-header")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("bottom-navigation"),
      ).not.toBeInTheDocument();
    },
  );
});
