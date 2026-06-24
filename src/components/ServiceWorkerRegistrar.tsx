"use client";

import { useEffect } from "react";

/**
 * Registers the service worker shipped at /sw.js on first load and forwards
 * the "SKIP_WAITING" message to the SW when a new version is found so users
 * get the latest shell without a hard refresh.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Avoid registering on the showcase HTML demo under /showcase.
    if (window.location.pathname.startsWith("/showcase")) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => {
          // Check for an updated SW on each page load.
          registration.update().catch(() => {});

          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (
                installing.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New content is available; ask the new SW to take over.
                installing.postMessage("SKIP_WAITING");
              }
            });
          });
        })
        .catch((err) => {
          // Service worker registration failure shouldn't break the app.
          console.warn("[Mooday] SW registration failed:", err);
        });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
