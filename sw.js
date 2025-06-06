const CACHE_NAME = "breathing-sim-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/bootstrap.min.css",
  "/style.css",
  "/script.js",
  "/icons/web-app-manifest-192x192.png",
  "/icons/web-app-manifest-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
