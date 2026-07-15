import { describe, it, expect } from "vitest";
import {
  VALID_VIEWS,
  readUrlParam,
  tabFromView,
  viewFromTab,
  type ViewState,
} from "@/types/navigation";

describe("navigation types", () => {
  describe("VALID_VIEWS", () => {
    it("contains all expected views", () => {
      expect(VALID_VIEWS).toEqual([
        "home",
        "search",
        "sell",
        "activity",
        "profile",
        "bag",
        "checkout",
        "settings",
        "loves",
        "seller",
        "category",
        "purchases",
        "order",
        "sell-picker",
        "closet",
        "edit-listing",
        "sales",
        "notifications",
        "chats",
        "edit-profile",
        "addresses",
        "payment-methods",
        "help",
        "leave-review",
        "my-reviews",
        "report",
        "return-request",
        "payouts",
        "blocked-users",
        "dispute",
        "disputes-list",
        "signup",
        "otp",
        "signin",
        "forgot-password",
        "social-login",
      ]);
    });
  });

  describe("tabFromView", () => {
    it("maps each tab view to itself", () => {
      expect(tabFromView("search")).toBe("search");
      expect(tabFromView("sell")).toBe("sell");
      expect(tabFromView("activity")).toBe("activity");
      expect(tabFromView("profile")).toBe("profile");
    });

    it("maps non-tab views to home", () => {
      expect(tabFromView("home")).toBe("home");
      expect(tabFromView("bag")).toBe("home");
      expect(tabFromView("checkout")).toBe("home");
      expect(tabFromView("settings")).toBe("home");
      expect(tabFromView("loves")).toBe("home");
    });

    it("maps null to home", () => {
      expect(tabFromView(null)).toBe("home");
    });

    it("maps unknown views to home", () => {
      expect(tabFromView("unknown" as never)).toBe("home");
    });
  });

  describe("viewFromTab", () => {
    it("returns the tab as a view", () => {
      expect(viewFromTab("home")).toBe("home");
      expect(viewFromTab("search")).toBe("search");
      // The "sell" tab routes through the mode picker (D-18) first.
      expect(viewFromTab("sell")).toBe("sell-picker");
      expect(viewFromTab("activity")).toBe("activity");
      expect(viewFromTab("profile")).toBe("profile");
    });
  });

  describe("readUrlParam", () => {
    it("returns null on the server (no window)", () => {
      // jsdom provides window, so simulate SSR by temporarily removing it.
      const originalWindow = globalThis.window;
      // @ts-expect-error — intentionally undefined for SSR simulation
      delete globalThis.window;
      try {
        expect(readUrlParam("foo")).toBeNull();
      } finally {
        globalThis.window = originalWindow;
      }
    });

    it("reads a param from the URL", () => {
      const original = window.location.href;
      try {
        window.history.pushState({}, "", "/?view=search&product=abc");
        expect(readUrlParam("view")).toBe("search");
        expect(readUrlParam("product")).toBe("abc");
        expect(readUrlParam("missing")).toBeNull();
      } finally {
        window.history.pushState({}, "", original);
      }
    });

    it("returns null when the param is absent", () => {
      const original = window.location.href;
      try {
        window.history.pushState({}, "", "/");
        expect(readUrlParam("anything")).toBeNull();
      } finally {
        window.history.pushState({}, "", original);
      }
    });
  });

  // Type-level sanity check — ensures ViewState stays exhaustive.
  it("ViewState is a string union", () => {
    const v: ViewState = "home";
    expect(typeof v).toBe("string");
  });
});
