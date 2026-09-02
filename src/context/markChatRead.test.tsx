import { vi } from "vitest";

vi.mock("@/services/backend", async () => {
  const actual =
    await vi.importActual<typeof import("@/services/backend")>(
      "@/services/backend",
    );
  const unsubscribe = () => () => undefined;
  const ok = <T,>(value: T) => ({ ok: true as const, value });
  return {
    ...actual,
    getPhase2Backend: () => ({
      auth: {
        getCurrentUser: async () => null,
        subscribe: () => unsubscribe,
        signUp: async () => ok({ id: "stub", email: "", name: "" }),
        signIn: async () => ok({ id: "stub", email: "", name: "" }),
        signOut: async () => ok(null),
        sendOtp: async () => ok(null),
        verifyOtp: async () => ok({ id: "stub", email: "", name: "" }),
        resetPassword: async () => ok(null),
        signInWithOAuth: async () => ok(null),
        completeOAuth: async () => ok({ id: "stub", email: "", name: "" }),
        updateName: async () => ok(null),
      },
      profiles: { getMine: async () => undefined, updateMine: async () => undefined },
      addresses: { listMine: async () => [], add: async () => undefined, update: async () => undefined, remove: async () => undefined, setDefault: async () => undefined },
      listings: {},
      media: {},
      sellerCards: {},
      likes: {},
      cart: {},
      follows: {},
      orders: {},
      chats: { upsertForListing: async () => ok(null), sendMessage: async () => ok(null), listMine: async () => ok([]), listMessages: async () => ok([]), subscribeMessages: () => unsubscribe },
      reviews: {},
      reports: {},
      disputes: {},
      notifications: {},
      paymentMethods: {},
      blocks: {},
    }),
  };
});

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { AppProvider, useApp } from "@/context/AppContext";

describe("markChatRead identity stability (regression for chat page hang)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps the same markChatRead reference across re-renders", () => {
    const refs: unknown[] = [];
    const Probe: React.FC = () => {
      const { markChatRead } = useApp();
      refs.push(markChatRead);
      return null;
    };
    const { rerender } = renderHook(() => null, {
      wrapper: ({ children }) => (
        <AppProvider>
          <Probe />
          {children}
        </AppProvider>
      ),
    });
    rerender();
    rerender();
    expect(refs.length).toBeGreaterThanOrEqual(3);
    expect(refs[0]).toBe(refs[1]);
    expect(refs[1]).toBe(refs[2]);
  });

  it("does not retrigger a markChatRead dependency after a parent re-render", () => {
    let effectRuns = 0;
    const EffectProbe: React.FC = () => {
      const { markChatRead } = useApp();
      React.useEffect(() => {
        effectRuns += 1;
        void markChatRead("thread-x");
      }, [markChatRead]);
      return null;
    };
    const { rerender } = renderHook(() => null, {
      wrapper: ({ children }) => (
        <AppProvider>
          <EffectProbe />
          {children}
        </AppProvider>
      ),
    });
    rerender();
    rerender();
    rerender();
    // Effect should fire on mount only once; further re-renders must not
    // recreate markChatRead (which would re-fire the effect indefinitely).
    expect(effectRuns).toBe(1);
  });
});
