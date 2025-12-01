
const CACHE_NAME = 'tabyar-v3';
const OFFLINE_URL = '/index.html';

// فایل‌هایی که برای اجرای اولیه و آفلاین ضروری هستند
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // کش کردن منابع خارجی (CDN) برای اطمینان از لود شدن استایل‌ها در حالت آفلاین
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
  'https://cdn.tailwindcss.com'
];

// نصب سرویس ورکر و کش کردن فایل‌های اولیه
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  self.skipWaiting(); // فعال‌سازی فوری
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// فعال‌سازی و پاک کردن کش‌های قدیمی
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
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

// مدیریت درخواست‌ها
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // نادیده گرفتن درخواست‌های غیر GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // استراتژی ۱: درخواست‌های ناوبری (HTML Pages) -> اول شبکه، بعد کش (پشتیبانی از SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            // ذخیره نسخه تازه در کش
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // اگر آفلاین بودیم، index.html را از کش برگردان
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // استراتژی ۲: فایل‌های ثابت (JS, CSS, Images, Fonts) -> اول کش، بعد شبکه
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.origin !== self.location.origin // شامل CDN ها
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          // کش کردن فایل‌های جدیدی که در حین کار لود می‌شوند
          if (
            !networkResponse || 
            networkResponse.status !== 200 || 
            networkResponse.type !== 'basic' && networkResponse.type !== 'cors'
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // استراتژی پیش‌فرض
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});
