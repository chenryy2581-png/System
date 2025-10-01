self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("app-cache-v1").then((cache) => {
      return cache.addAll([
        "./",
        "./index.html",
        "./main.js?v=1",
        "./manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
