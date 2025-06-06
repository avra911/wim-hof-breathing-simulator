const CACHE_NAME = "breathing-sim-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/offline.html",
  "/bootstrap.min.css",
  "/style.css",
  "/script.js",
  "/offline.html",
  "/icons/web-app-manifest-192x192.png",
  "/icons/web-app-manifest-512x512.png"
];

// Install
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install event");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Caching files");
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error("[ServiceWorker] Cache failed:", err);
      })
  );
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((response) => {
        // If not found in cache, fallback to offline.html for HTML pages
        if (!response && event.request.destination === "document") {
          return caches.match("./offline.html");
        }
        return response;
      })
    )
  );
});