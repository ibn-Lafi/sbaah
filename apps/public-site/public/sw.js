// PRODUCT_SPEC section 2 — minimal PWA service worker for سبعة/public-site.
// Scope, deliberately: cache-first for static assets (faster repeat loads),
// network-first with an offline fallback for page navigations. No API/page
// response caching — this same origin serves a different tenant's listings
// per Host header (see get-tenant-site.ts); caching rendered HTML/API
// responses across navigations risks showing one tenant's cached page for
// another's domain, which is a real cross-tenant correctness risk here.
const CACHE_NAME = 'sbaah-public-site-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png'])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error())),
    );
    return;
  }

  if (request.url.includes('/_next/static/') || request.url.includes('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          }),
      ),
    );
  }
});
