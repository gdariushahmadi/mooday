"use client";

import { useCallback, useState } from "react";
import { useHydrated } from "@/lib/hooks";

const WELCOME_SEEN_KEY = "mooday_has_seen_welcome";

/**
 * Subscribes the welcome-screen state to localStorage.
 *
 * - `ready: false` during SSR and the first client render so the
 *   server output never accidentally renders the welcome screen
 *   (which would cause a hydration mismatch).
 * - After hydration, `shouldShow` becomes true only when the user
 *   has never completed the welcome flow before.
 * - `markSeen()` is idempotent; calling it more than once is harmless.
 */
function subscribeWelcome(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readHasSeenWelcome(): boolean {
  try {
    return window.localStorage.getItem(WELCOME_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export interface WelcomeGuard {
  /** False during SSR and the first client render. */
  ready: boolean;
  /** True when the user has not yet completed the welcome flow. */
  shouldShow: boolean;
  /** Persist that the user has seen the welcome screen. */
  markSeen: () => void;
  /** Clear the seen flag so the welcome screen shows again. */
  reset: () => void;
}

export function useWelcomeGuard(): WelcomeGuard {
  const hydrated = useHydrated();
  // We keep a render-version counter so calling markSeen/reset
  // triggers a re-render of consumers that read `shouldShow`.
  // The state value itself isn't read directly; it's just a
  // re-render trigger.
  const [, forceRender] = useState(0);
  const bump = useCallback(() => forceRender((v) => v + 1), []);

  const hasSeen = hydrated && readHasSeenWelcome();

  // Subscribe to cross-tab storage events so reset() in one tab is
  // visible in another. Same-tab updates are handled by bump().
  useSubscribe(subscribeWelcome, bump);

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(WELCOME_SEEN_KEY, "true");
    } catch {
      // Ignore quota / private-mode errors.
    }
    bump();
  }, [bump]);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(WELCOME_SEEN_KEY);
    } catch {
      // Ignore.
    }
    bump();
  }, [bump]);

  return {
    ready: hydrated,
    shouldShow: !hasSeen,
    markSeen,
    reset,
  };
}

// Internal helper so the subscribe logic above can use the same
// useEffect shape as the rest of the app without re-importing React.
import { useEffect } from "react";
function useSubscribe(
  subscribe: (cb: () => void) => () => void,
  onChange: () => void,
) {
  useEffect(() => {
    return subscribe(onChange);
  }, [subscribe, onChange]);
}
