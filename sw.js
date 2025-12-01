
const CACHE_NAME = 'doctoryar-v1'; // Changed name to DoctorYar
const OFFLINE_URL = '/index.html';

// 1. Critical Core Assets (Local files)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/index.tsx',
  '/App.tsx',
  '/db.ts',
  '/types.ts',
  '/drugReference.ts'
];

// 2. External CDN Assets (Libraries defined in importmap)
// We hardcode these to ensure they are cached immediately upon install
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/react@^19.2.0/',
  'https://aistudiocdn.com/lucide-react@^0.555.0'
];

// Combine all assets
const ALL_ASSETS = [...CORE_ASSETS, ...CDN_ASSETS];

// --- INSTALL EVENT: Cache Everything Immediately ---
self.addEventListener('install', (event) => {
  console.log('[DoctorYar SW] Installing & Caching all assets...');
  self.skipWaiting(); // Force activation immediately

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // We use map to request files one by one to avoid one failure breaking everything
      // But we wrap in Promise.all to wait for all
      return Promise.all(
        ALL_ASSETS.map(url => {
          return fetch(url).then(res => {
            if (!res.ok) throw Error(`Failed to fetch ${url}`);
            return cache.put(url, res);
          }).catch(err => {
            console.warn(`[DoctorYar SW] Warning: Could not cache ${url} during install`, err);
            // We don't throw here to allow partial installation, 
            // the fetch handler will try to cache it later dynamically.
          });
        })
      );
    })
  );
});

// --- ACTIVATE EVENT: Clean up old caches ---
self.addEventListener('activate', (event) => {
  console.log('[DoctorYar SW] Activated. Cleaning old caches...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[DoctorYar SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

// --- FETCH EVENT: The "Smart" Logic ---
// Strategy: Cache First, falling back to Network, then Cache that network response.
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Try to find in Cache first
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        // Return cached response immediately (Fast & Offline friendly)
        return cachedResponse;
      }

      // 2. If not in cache, go to Network
      try {
        const networkResponse = await fetch(event.request);

        // Check if response is valid
        if (networkResponse && networkResponse.status === 200) {
          // 3. Cache the new file for next time (Dynamic Caching)
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        // 4. Network failed (Offline). 
        // If it was a navigation request (HTML), return index.html
        if (event.request.mode === 'navigate') {
          return cache.match(OFFLINE_URL);
        }
        
        // Otherwise, nothing we can do
        console.error('[DoctorYar SW] Fetch failed (Offline):', event.request.url);
        throw error;
      }
    })
  );
});
