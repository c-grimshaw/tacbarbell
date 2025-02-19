const CACHE_NAME = 'tacbarbell-v1';
const ASSETS_TO_CACHE = [
  '/tacbarbell/',
  '/tacbarbell/index.html',
  '/tacbarbell/manifest.json',
  '/tacbarbell/_app/immutable/assets/_page.css',
  '/tacbarbell/_app/immutable/entry/app.js',
  '/tacbarbell/_app/immutable/entry/start.js',
  '/tacbarbell/icons/icon-192.png',
  '/tacbarbell/icons/icon-512.png'
];

// Install service worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-GET requests
            if (!event.request.url.startsWith('http') || event.request.method !== 'GET') {
              return response;
            }
            
            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // Return a fallback response for offline navigation
            if (event.request.mode === 'navigate') {
              return caches.match('/tacbarbell/');
            }
            return new Response('Offline content not available');
          });
      })
  );
}); 