const CACHE_NAME = "joinmypdf-shell-v6";
const CORE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/assets/css/styles.css",
  "/assets/js/seo-factory.js",
  "/assets/js/ui-core.js",
  "/assets/js/pdf-core.js",
  "/assets/js/share-float.js",
  "/assets/js/pwa-install.js",
  "/assets/js/email-popup.js",
  "/assets/icons/favicon.svg",
  "/assets/icons/icon-192.svg",
  "/assets/icons/icon-512.svg",
  "/assets/brand/logo-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("/"));
    })
  );
});
