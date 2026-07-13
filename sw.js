const CACHE_NAME = "joinmypdf-shell-v10";

const CORE_ASSETS = [
  "/manifest.webmanifest",
  "/sw.js",
  "/icons/favicon.svg",
  "/icons/favicon-32x32.png",
  "/icons/android-chrome-192x192.png",
  "/icons/android-chrome-512x512.png",
  "/assets/css/styles.css",
  "/assets/js/seo-factory.js",
  "/assets/js/ui-core.js",
  "/assets/js/pdf-core.js",
  "/assets/js/share-float.js",
  "/assets/js/pwa-install.js",
  "/assets/js/email-popup.js",
  "/assets/brand/logo-icon.svg",
];

function isDocumentRequest(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

/** Large OCR/WASM assets must hit the network — SW caching can break Workers under COEP. */
function isTesseractOrWasmRequest(url) {
  const path = url.pathname;
  return (
    path.startsWith("/tesseract/") ||
    path.startsWith("/assets/tesseract/") ||
    path.startsWith("/assets/tessdata/") ||
    path.endsWith(".wasm") ||
    path.endsWith(".wasm.js") ||
    path.endsWith(".traineddata") ||
    path.endsWith(".traineddata.gz")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  if (isTesseractOrWasmRequest(url)) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response("OCR asset unavailable offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          }),
      ),
    );
    return;
  }

  if (isDocumentRequest(event.request)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);

      return cached ?? network;
    }),
  );
});
