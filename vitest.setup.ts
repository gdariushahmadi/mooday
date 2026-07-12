import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi, beforeAll } from "vitest";

// Runs cleanup after each test so React Testing Library doesn't leak
// DOM nodes between tests.
afterEach(() => {
  cleanup();
});

// jsdom 29 throws when accessing localStorage without a backing file.
// Provide a minimal in-memory polyfill so tests that rely on it work.
beforeAll(() => {
  if (typeof window === "undefined") return;

  let needsPolyfill = false;
  try {
    void window.localStorage;
  } catch {
    needsPolyfill = true;
  }

  if (needsPolyfill) {
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      writable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, String(value)),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        get length() {
          return store.size;
        },
      },
    });
  }
});

// jsdom doesn't implement matchMedia, which some components use
// (InstallPrompt checks `display-mode: standalone`). Provide a stub.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

// jsdom doesn't implement ResizeObserver, used by MobileFrame.
if (!window.ResizeObserver) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub as never;
}

// jsdom doesn't implement scrollIntoView (used by ChatOverlay).
// Provide a no-op stub so tests don't crash.
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = function () {} as never;
}
