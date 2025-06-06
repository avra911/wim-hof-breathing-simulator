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

// On install, cache all static assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

// On fetch, serve cached files or fall back to offline page
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return (
                cachedResponse ||
                fetch(event.request).catch(() => {
                    // Only show offline page for navigation requests (like pages)
                    if (event.request.mode === "navigate") {
                        return caches.match("/offline.html");
                    }
                })
            );
        })
    );
});