"use client";

import { useCallback, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Returns `false` during SSR and the first client render, then `true`
 * after hydration. Use this to guard client-only reads (localStorage,
 * URL params, matchMedia) without causing hydration mismatches or
 * triggering the "setState in effect" lint rule.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Subscribe to a `storage` event for a specific key. When another tab
 * (or this tab via dispatchStorageEvent) writes to the key, all
 * subscribers re-render.
 */
function subscribeStorage(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * Read/write a value in localStorage with React 19–compatible
 * semantics. Uses `useSyncExternalStore` so the server renders with
 * `defaultValue` and the client picks up the stored value after
 * hydration — no `setState` inside `useEffect`.
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: {
    serialize?: (v: T) => string;
    deserialize?: (v: string) => T;
  },
): [T, (value: T | ((prev: T) => T)) => void] {
  const serialize = options?.serialize ?? (JSON.stringify as (v: T) => string);
  const deserialize = options?.deserialize ?? (JSON.parse as (v: string) => T);

  const getSnapshot = useCallback((): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? deserialize(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const getServerSnapshot = useCallback((): T => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(
    subscribeStorage,
    getSnapshot,
    getServerSnapshot,
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      try {
        const current = (() => {
          try {
            const stored = localStorage.getItem(key);
            return stored !== null ? deserialize(stored) : defaultValue;
          } catch {
            return defaultValue;
          }
        })();
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(current) : next;
        localStorage.setItem(key, serialize(resolved));
        // useSyncExternalStore only fires on cross-tab `storage` events,
        // so we dispatch a synthetic one so this tab re-renders too.
        window.dispatchEvent(new StorageEvent("storage", { key }));
      } catch {
        // Ignore quota errors, private mode, etc.
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, setValue];
}
