const CACHE_NAME = "breathing-sim-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/bootstrap.min.css",
  "/style.css",
  "/script.js",
  "/offline.html",
  "/icons/web-app-manifest-192x192.png",
  "/icons/web-app-manifest-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./offline.html");
        }
      });
    })
  );
});
