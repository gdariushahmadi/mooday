import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWelcomeGuard } from "@/hooks/useWelcomeGuard";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, "dispatchEvent");
});

describe("useWelcomeGuard", () => {
  it("returns shouldShow: true when localStorage is empty (cold launch)", () => {
    const { result } = renderHook(() => useWelcomeGuard());

    expect(result.current.shouldShow).toBe(true);
    expect(result.current.ready).toBe(true);
  });

  it("returns shouldShow: false when hasSeenWelcome is already set", () => {
    localStorage.setItem("mooday_has_seen_welcome", "true");

    const { result } = renderHook(() => useWelcomeGuard());

    expect(result.current.shouldShow).toBe(false);
    expect(result.current.ready).toBe(true);
  });

  it("markSeen() persists the flag and flips shouldShow to false", () => {
    const { result } = renderHook(() => useWelcomeGuard());

    expect(result.current.shouldShow).toBe(true);

    act(() => {
      result.current.markSeen();
    });

    expect(result.current.shouldShow).toBe(false);
    expect(localStorage.getItem("mooday_has_seen_welcome")).toBe("true");
  });

  it("markSeen() is idempotent", () => {
    const { result } = renderHook(() => useWelcomeGuard());

    act(() => {
      result.current.markSeen();
      result.current.markSeen();
      result.current.markSeen();
    });

    expect(result.current.shouldShow).toBe(false);
    expect(localStorage.getItem("mooday_has_seen_welcome")).toBe("true");
  });

  it("reset() clears the flag and flips shouldShow back to true", () => {
    localStorage.setItem("mooday_has_seen_welcome", "true");

    const { result } = renderHook(() => useWelcomeGuard());
    expect(result.current.shouldShow).toBe(false);

    act(() => {
      result.current.reset();
    });

    expect(result.current.shouldShow).toBe(true);
    expect(localStorage.getItem("mooday_has_seen_welcome")).toBeNull();
  });

  it("survives a localStorage quota error when writing", () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    const { result } = renderHook(() => useWelcomeGuard());

    // markSeen should not throw and should still flip the in-memory state.
    act(() => {
      result.current.markSeen();
    });

    expect(result.current.shouldShow).toBe(false);

    setItemSpy.mockRestore();
  });
});
