"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

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
 * Stable localStorage subscription. Must keep the same function identity
 * across renders — `useSyncExternalStore` re-subscribes whenever it
 * changes, and an unstable subscribe causes render loops.
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
 *
 * The snapshot is cached per key so `getSnapshot` returns a stable
 * reference until the underlying string actually changes. Without this
 * cache, deserialized objects would be new references every call and
 * `useSyncExternalStore` would re-render forever.
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

  // Snapshot cache: keyed by the raw localStorage string. Ensures
  // `getSnapshot` returns the same reference until the data changes.
  const cacheRef = useRef<{ raw: string | null; value: T } | null>(null);

  const getSnapshot = useCallback((): T => {
    try {
      const raw = window.localStorage.getItem(key);
      const cached = cacheRef.current;
      if (cached && cached.raw === raw) {
        return cached.value;
      }
      let value: T;
      try {
        value = raw !== null ? deserialize(raw) : defaultValue;
      } catch {
        value = defaultValue;
      }
      cacheRef.current = { raw, value };
      return value;
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
        const raw = window.localStorage.getItem(key);
        let current: T;
        try {
          current = raw !== null ? deserialize(raw) : defaultValue;
        } catch {
          current = defaultValue;
        }
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(current) : next;
        window.localStorage.setItem(key, serialize(resolved));
        // Invalidate cache so the next getSnapshot re-deserializes.
        cacheRef.current = null;
        // useSyncExternalStore only re-renders on cross-tab `storage`
        // events, so we dispatch a synthetic one for same-tab updates.
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
