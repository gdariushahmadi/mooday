/* DANEG Service Worker
 *
 * Strategy:
 *  - App shell (HTML navigations): network-first, falls back to cached /offline.
 *  - Static assets under /_next/static and /icons: cache-first, revalidated.
 *  - Product images under /products: stale-while-revalidate.
 *  - Everything else: network-first with cache fallback.
 *
 * Bump CACHE_VERSION whenever you ship a breaking change to the app shell
 * (component tree, route layout, etc.) to force clients to refetch.
 */

const CACHE_VERSION = "daneg-v4";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const OFFLINE_URL = "/offline.html";

const APP_SHELL = [
  "/app",
  "/",
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/icons/badge-72x72.png",
];

// ---------- install ----------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll(
          APP_SHELL.map(
            (url) =>
              new Request(url, { cache: "reload" }) // bypass HTTP cache for shell
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// ---------- activate ----------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// ---------- helpers ----------
function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/favicon.png" ||
    url.pathname === "/manifest.json"
  );
}

function isImage(url) {
  return (
    url.pathname.startsWith("/products/") ||
    /\.(png|jpg|jpeg|webp|svg|gif|avif)$/i.test(url.pathname)
  );
}

function isSensitiveRequest(request, url) {
  return (
    request.headers.has("authorization") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    (url.origin !== self.location.origin &&
      (url.hostname.endsWith(".supabase.co") ||
        url.pathname.startsWith("/auth/v1/") ||
        url.pathname.startsWith("/rest/v1/")))
  );
}

function canCacheResponse(response) {
  const cacheControl = response.headers.get("cache-control") || "";
  return (
    response.ok &&
    // 206 Partial Content (e.g. video/audio byte-range requests) cannot be
    // stored via Cache.put() — the Cache API throws on partial responses.
    response.status !== 206 &&
    !response.headers.has("set-cookie") &&
    !/private|no-store/i.test(cacheControl)
  );
}

// ---------- fetch ----------
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET; ignore non-http(s) (e.g. chrome-extension://).
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!url.protocol.startsWith("http")) return;

  // Authenticated/API traffic must never enter Cache Storage. Supabase keeps
  // its own session lifecycle and these responses can contain private data.
  if (isSensitiveRequest(request, url)) {
    event.respondWith(fetch(request));
    return;
  }

  // 1) Navigations -> network-first, offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          if (canCacheResponse(fresh)) {
            const cache = await caches.open(RUNTIME_CACHE);
            await cache.put(request, fresh.clone());
          }
          return fresh;
        } catch (_err) {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })()
    );
    return;
  }

  // 2) Static assets -> cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (canCacheResponse(response)) {
              const copy = response.clone();
              caches
                .open(STATIC_CACHE)
                .then((cache) => cache.put(request, copy))
                .catch(() => {});
            }
            return response;
          })
      )
    );
    return;
  }

  // 3) Images -> stale-while-revalidate.
  if (url.origin === self.location.origin && isImage(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (canCacheResponse(response)) {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // 4) Everything else -> network-first with cache fallback (same-origin
  // only). Cross-origin resources (e.g. the Google Fonts CSS for Material
  // Symbols) must be left to the browser's own fetch: once this handler
  // calls fetch() from inside the service worker, the request is always
  // checked against the page's connect-src, even though the browser would
  // normally check it against style-src/font-src. Not intercepting lets
  // the browser load it under its original, permitted directive.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (canCacheResponse(response)) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch (_err) {
        const cached = await caches.match(request);
        return cached || new Response("Offline", { status: 503 });
      }
    })()
  );
});

// ---------- push ----------
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const title = data.title || "DANEG";
  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/badge-72x72.png",
    image: data.image,
    data: {
      url: data.url || "/app",
      dateOfArrival: Date.now(),
    },
    vibrate: [100, 50, 100],
    dir: "auto",
    tag: data.tag,
    renotify: !!data.renotify,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ---------- notificationclick ----------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/app";
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      // Focus an existing tab if it matches the same origin.
      for (const client of allClients) {
        if ("focus" in client && new URL(client.url).origin === self.location.origin) {
          await client.focus();
          if ("navigate" in client) client.navigate(targetUrl);
          return;
        }
      }
      if (clients.openWindow) await clients.openWindow(targetUrl);
    })()
  );
});

// ---------- messages (for SKIP_WAITING) ----------
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
