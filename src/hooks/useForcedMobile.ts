"use client";

import { useEffect, useState } from "react";

/**
 * useForcedMobile
 * ----------------
 * Forces the application to render at a fixed mobile width (default 390px)
 * regardless of the actual viewport or iframe size. Designed for:
 *
 *   - Embedded previews in marketing / stakeholder documents
 *   - Iframe demos where the host page is much wider than a phone
 *   - Stakeholder reviews where the product must always look like the mobile app
 *
 * Activate by appending `?mobile=1` (or `?mobile=true`) to the URL. The page
 * will then be rendered inside a centered 390 × 844 (iPhone 14) frame with
 * a desktop backdrop.
 *
 * The forced mode can be customised:
 *   - `?mobile=1`                  → 390 × 844 (iPhone 14)
 *   - `?mobile=1&w=375&h=812`      → iPhone 13 size
 *   - `?mobile=1&w=430&h=932`      → iPhone 14 Pro Max size
 *
 * The Tailwind responsive breakpoints (`md:`, `lg:`) are NOT changed — the app
 * naturally falls into its mobile layout because the viewport is now 390px wide.
 */
export const useForcedMobile = () => {
  const [forced, setForced] = useState(false);
  const [width, setWidth] = useState(390);
  const [height, setHeight] = useState(844);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const mobile = params.get("mobile");
    if (mobile === "1" || mobile === "true") {
      const w = parseInt(params.get("w") || "390", 10);
      const h = parseInt(params.get("h") || "844", 10);
      setWidth(Number.isFinite(w) && w > 0 ? w : 390);
      setHeight(Number.isFinite(h) && h > 0 ? h : 844);
      setForced(true);

      // Override the viewport meta tag so the page believes the device is the
      // forced width. This is what makes Tailwind's `md:` / `lg:` breakpoints
      // behave like a real phone.
      let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
      if (!viewport) {
        viewport = document.createElement("meta");
        viewport.name = "viewport";
        document.head.appendChild(viewport);
      }
      viewport.content = `width=${w}, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`;

      // Set a fixed inner width on the html so media queries resolve correctly.
      // Browsers will treat window.innerWidth as the actual viewport though, so
      // we use a CSS variable + container strategy for the visual frame.
      document.documentElement.style.setProperty("--forced-width", `${w}px`);
      document.documentElement.style.setProperty("--forced-height", `${h}px`);
    }
  }, []);

  return { forced, width, height };
};
