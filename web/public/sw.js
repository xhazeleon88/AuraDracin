/* Aura Dracin — lightweight PWA service worker */
const CACHE = "aura-dracin-v1";
const PRECACHE = ["/", "/icons/icon-192.png", "/icons/icon-512.png", "/assets/aura-dracin-mark.jpg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Don't cache API / auth / stream proxy responses.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/")
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok && url.protocol.startsWith("http")) {
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const home = await cache.match("/");
          if (home) return home;
        }
        throw new Error("offline");
      }
    }),
  );
});
