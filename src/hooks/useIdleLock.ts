import { useCallback, useEffect, useRef, useState } from "react";
import { useHydrated } from "@/lib/hooks";

/**
 * Event signals we treat as "user activity". Pointer + keyboard cover
 * desktop; touchstart + wheel cover mobile. We deliberately omit
 * scroll/mousemove on purpose so that just resting a thumb on the
 * screen does not indefinitely defer the lock — touchstart requires an
 * actual touch event.
 */
const ACTIVITY_EVENTS: readonly (keyof WindowEventMap)[] = [
  "pointerdown",
  "keydown",
  "touchstart",
  "wheel",
  "click",
];

export interface IdleLockOptions {
  /** Inactivity threshold in ms before the consumer should lock. */
  timeoutMs: number;
  /** Disable tracking entirely (e.g. while another modal holds focus). */
  enabled?: boolean;
}

export interface IdleLockState {
  /**
   * Milliseconds since the last user activity. Updated on a low-frequency
   * timer (1s) so consumers that just want to render a countdown can
   * read it without subscribing to high-frequency pointer events.
   */
  idleMs: number;
  /** True when `idleMs` has reached `timeoutMs`. */
  expired: boolean;
  /**
   * Force-reset the timer. Consumers call this after a successful unlock
   * so we don't immediately re-lock.
   */
  reset: () => void;
}

/**
 * Tracks how long the user has been idle. The hook returns both a live
 * `idleMs` counter and a boolean `expired` flag that flips when the
 * configured timeout elapses — letting the app shell render a lock
 * screen while inner pages can still read `idleMs` for "auto-logout in
 * Xs" countdowns.
 *
 * Implementation notes:
 *  - We anchor `lastActivityAt` to `performance.now()` so background-tab
 *    throttling does not skew the result. `setInterval` only updates
 *    `idleMs` once per second for cheap re-renders.
 *  - When the document is hidden the timer keeps running in real time;
 *    we intentionally do NOT pause it, because the whole point of the
 *    lock is to protect the app while the user walks away.
 */
export function useIdleLock({
  timeoutMs,
  enabled = true,
}: IdleLockOptions): IdleLockState {
  const hydrated = useHydrated();
  const lastActivityAtRef = useRef<number>(0);
  const [idleMs, setIdleMs] = useState(0);

  const reset = useCallback(() => {
    lastActivityAtRef.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    setIdleMs(0);
  }, []);

  // Subscribe to activity events once. We use refs to avoid re-binding
  // on every render; the listener only updates the timestamp.
  // We also seed the timestamp on mount so the very first interval tick
  // measures elapsed time from now, not from app start.
  useEffect(() => {
    if (!hydrated || !enabled) return;
    lastActivityAtRef.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const onActivity = () => {
      lastActivityAtRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();
    };
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, onActivity, { passive: true });
    }
    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, onActivity);
      }
    };
  }, [hydrated, enabled]);

  // Tick once per second so the UI can react.
  useEffect(() => {
    if (!hydrated || !enabled) return;
    const interval = window.setInterval(() => {
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      setIdleMs(now - lastActivityAtRef.current);
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [hydrated, enabled]);

  return {
    idleMs,
    expired: enabled && idleMs >= timeoutMs,
    reset,
  };
}
