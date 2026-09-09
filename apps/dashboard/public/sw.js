// PRODUCT_SPEC section 2 — minimal PWA service worker for سبعة/dashboard.
// Scope, deliberately: cache-first for static assets (faster repeat loads),
// network-first with an offline fallback for page navigations. No API
// response caching or background sync — the dashboard is a live, per-user
// app (leads/properties change constantly); caching API data would show
// stale/wrong tenant data, which is a real correctness risk, not a feature.
const CACHE_NAME = 'sbaah-dashboard-v1';
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
