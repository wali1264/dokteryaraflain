
const CACHE_NAME = 'tabyar-v5';
const OFFLINE_URL = '/index.html';

// Critical assets - if these fail, SW installation fails
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Optional assets - try to cache, but don't fail install if they fail
const EXTERNAL_ASSETS = [
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install v5');
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Cache Core Assets (Critical)
      try {
        await cache.addAll(CORE_ASSETS);
        console.log('[ServiceWorker] Core assets cached');
      } catch (error) {
        console.error('[ServiceWorker] Failed to cache core assets:', error);
        throw error; // Fail installation if core assets missing
      }

      // 2. Cache External Assets (Best Effort)
      // We don't await this or throw, so installation succeeds even if CDNs are flaky
      cache.addAll(EXTERNAL_ASSETS).catch(err => {
        console.warn('[ServiceWorker] Failed to cache some external assets:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate v5');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // 1. Navigation Requests (HTML) -> Network First, Fallback to Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          console.log('[ServiceWorker] Network failed, falling back to cache for:', request.url);
          return caches.open(CACHE_NAME).then((cache) => {
            // Try to find exact match
            return cache.match(OFFLINE_URL).then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              // Fallback to /index.html if OFFLINE_URL lookup fails
              return cache.match('/index.html');
            });
          });
        })
    );
    return;
  }

  // 2. Static Assets -> Cache First, Fallback to Network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        // Check for valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        // Cache new asset
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      }).catch(err => {
        // If both cache and network fail for an asset (e.g. image), just fail silently or return placeholder
        // console.log('Asset fetch failed:', request.url);
      });
    })
  );
});
