import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorageState, useHydrated } from "@/lib/hooks";

describe("useLocalStorageState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the default value when nothing is stored", () => {
    const { result } = renderHook(() =>
      useLocalStorageState("test_key", "default"),
    );
    expect(result.current[0]).toBe("default");
  });

  it("persists a new value to localStorage", () => {
    const { result } = renderHook(() =>
      useLocalStorageState("test_key", "default"),
    );

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(localStorage.getItem("test_key")).toBe(JSON.stringify("updated"));
  });

  it("reads an existing value from localStorage", () => {
    localStorage.setItem("test_key", JSON.stringify("existing"));

    const { result } = renderHook(() =>
      useLocalStorageState("test_key", "default"),
    );

    expect(result.current[0]).toBe("existing");
  });

  it("supports functional updates", () => {
    localStorage.setItem("test_count", JSON.stringify(5));

    const { result } = renderHook(() => useLocalStorageState("test_count", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(6);
    expect(localStorage.getItem("test_count")).toBe(JSON.stringify(6));
  });

  it("works with object values", () => {
    type Item = { id: string; qty: number };
    const { result } = renderHook(() =>
      useLocalStorageState<Item[]>("test_items", []),
    );

    act(() => {
      result.current[1]([{ id: "a", qty: 2 }]);
    });

    expect(result.current[0]).toEqual([{ id: "a", qty: 2 }]);
    expect(localStorage.getItem("test_items")).toBe(
      JSON.stringify([{ id: "a", qty: 2 }]),
    );
  });

  it("falls back to default when stored JSON is corrupt", () => {
    localStorage.setItem("test_key", "{not valid json}");

    const { result } = renderHook(() =>
      useLocalStorageState("test_key", "default"),
    );

    expect(result.current[0]).toBe("default");
  });

  it("respects custom serialize/deserialize", () => {
    const { result } = renderHook(() =>
      useLocalStorageState<"en" | "ar">("test_lang", "en", {
        serialize: (v) => v,
        deserialize: (v) => (v === "ar" ? "ar" : "en"),
      }),
    );

    act(() => {
      result.current[1]("ar");
    });

    expect(result.current[0]).toBe("ar");
    expect(localStorage.getItem("test_lang")).toBe("ar");
  });

  it("does not crash when localStorage throws (private mode)", () => {
    const original = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error("QuotaExceededError");
    });

    const { result } = renderHook(() =>
      useLocalStorageState("test_key", "default"),
    );

    // Should not throw — silently fails.
    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("default");

    localStorage.setItem = original;
  });
});

describe("useHydrated", () => {
  it("returns true on the client (jsdom)", () => {
    const { result } = renderHook(() => useHydrated());
    expect(result.current).toBe(true);
  });
});
