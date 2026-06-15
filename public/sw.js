const CACHE_NAME = "colo-pwa-cache-v3";
const ASSETS_TO_CACHE = [
  "/",
  "/workspace/image",
  "/workspace/pdf",
  "/workspace/batch",
  "/workspace/scan",
  "/support",
  "/api-hub",
  "/billing",
  "/ops",
  "/settings",
  "/favicon.ico",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-192-maskable.png",
  "/icon-512-maskable.png",
  "/pdf.worker.min.mjs",
  "/warp.worker.js"
];

// Install service worker and cache core assets
self.addEventListener("install", (event) => {
  if (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1") {
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use cache.addAll, but allow it to continue even if some assets fail (for dev flexibility)
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to pre-cache asset ${url}:`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate service worker and prune old cache versions
self.addEventListener("activate", (event) => {
  if (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1") {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      }).then(() => {
        return self.registration.unregister();
      })
    );
    return;
  }

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old service worker cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch requests with Stale-While-Revalidate and Dynamic Caching strategy
self.addEventListener("fetch", (event) => {
  // Bypass completely in development mode (localhost / 127.0.0.1) to avoid dev chunk/HMR interception
  if (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1") return;

  // Only intercept GET requests
  if (event.request.method !== "GET") return;

  // Only intercept HTTP/HTTPS requests to our own origin
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Bypass API routes and hot-module reloading/dev server paths
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("_next/webpack-hmr") ||
    event.request.url.includes("browser-sync") ||
    event.request.url.includes("hot-update")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version asynchronously to keep the cache updated in the background
        fetch(event.request.clone())
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          })
          .catch(() => {}); // ignore network errors during offline use
        return cachedResponse;
      }

      // If request is not cached, fetch from network and cache it dynamically
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === "basic" || networkResponse.type === "cors")
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn("Resource fetch failed offline:", event.request.url, err);
      });
    })
  );
});
