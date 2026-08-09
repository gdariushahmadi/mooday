"use client";

import { useEffect } from "react";

export const DARK_MODE_STORAGE_KEY = "mooday-pref-dark";

export function readDarkModePreference(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(DARK_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function applyDarkMode(enabled: boolean): void {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", enabled);
}

export function persistDarkModePreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(DARK_MODE_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // The visual preference still applies when storage is unavailable.
  }

  applyDarkMode(enabled);
}

/** Applies the saved manual theme before any app view becomes interactive. */
export function ThemeSync() {
  useEffect(() => {
    applyDarkMode(readDarkModePreference());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === DARK_MODE_STORAGE_KEY) {
        applyDarkMode(event.newValue === "1");
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return null;
}
