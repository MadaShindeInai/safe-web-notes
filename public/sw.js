const STATIC_CACHE = "ralph-static-v1";
const PAGES_CACHE = "ralph-pages-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/sign-in")) return;
  if (url.pathname.startsWith("/sign-up")) return;

  // Cache-first for Next.js static assets (content-hashed — safe to cache forever)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
        }),
      ),
    );
    return;
  }

  // Network-first for HTML pages with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches
            .open(PAGES_CACHE)
            .then((cache) => cache.put(request, clone))
            .catch(() => undefined);
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
