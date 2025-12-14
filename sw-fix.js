// FEATURE: Safe service worker to avoid caching POST requests
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests; let others pass through to network to avoid cache.put errors
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
