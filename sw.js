
const CACHE_NAME = 'tabyar-v1';

// لیستی از فایل‌هایی که باید فوراً کش شوند (هسته اصلی)
// با توجه به اینکه نام فایل‌های بیلد شده ممکن است تغییر کند، 
// استراتژی اصلی ما کش کردن دینامیک تمام درخواست‌ها است.
const PRE_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// نصب سرویس ورکر
self.addEventListener('install', (event) => {
  self.skipWaiting(); // فوراً فعال شو
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_URLS);
    })
  );
});

// پاکسازی کش‌های قدیمی هنگام فعال‌سازی نسخه جدید
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// مدیریت درخواست‌های شبکه (استراتژی: اول کش، اگر نبود شبکه و سپس ذخیره در کش)
self.addEventListener('fetch', (event) => {
  // از کش کردن درخواست‌های غیر GET خودداری کن
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // اگر پاسخ معتبر نبود، برگردان
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        // کپی کردن پاسخ شبکه در کش برای استفاده‌های بعدی
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // اینجا می‌توان یک صفحه آفلاین پیش‌فرض برگرداند اگر نیاز بود
        // اما چون SPA است، معمولا index.html کش شده کافیست
      });
    })
  );
});
