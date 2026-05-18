const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `shell-${CACHE_VERSION}`;
const TILE_CACHE    = `tiles-${CACHE_VERSION}`;
const API_CACHE     = `api-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/home.html',
  '/list.html',
  '/map.html',
  '/search.html',
  '/center.html',
  '/about.html',
  '/css/main.css',
  '/js/copy.js',
  '/js/data.js',
  '/js/lang.js',
  '/js/advisory.js',
  '/js/directions.js',
  '/js/icons.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/icon-192-maskable.png',
  '/assets/icons/icon-512-maskable.png',
  '/data/amenities.json',
  '/data/centers-fallback.json',
  // Leaflet
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  // Public Sans font CSS (triggers font file fetch which is separately cached)
  'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&display=swap',
];

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge stale caches ──────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => ![SHELL_CACHE, TILE_CACHE, API_CACHE].includes(k))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: routing strategy per request type ──────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // OSM map tiles — cache-first, long TTL (tiles rarely change)
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(cacheThenNetwork(request, TILE_CACHE));
    return;
  }

  // PHP API endpoints — network-first, fall back to cached response
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // Google Fonts and Leaflet CDN — cache-first
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'    ||
    url.hostname === 'unpkg.com'
  ) {
    event.respondWith(cacheThenNetwork(request, SHELL_CACHE));
    return;
  }

  // App shell (HTML, CSS, JS, images) — cache-first
  event.respondWith(cacheThenNetwork(request, SHELL_CACHE));
});

// ── Strategies ────────────────────────────────────────────────────────────────

async function cacheThenNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('{"error":"offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
