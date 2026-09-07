const CACHE = 'olive-season-v1';
const ASSETS = ['/olive-season/', '/olive-season/index.html', '/olive-season/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'موسم العصر', {
      body: data.body || 'طلب عصر جديد',
      icon: '/olive-season/manifest.json',
      badge: '/olive-season/manifest.json',
      dir: 'rtl',
      lang: 'ar',
    })
  );
});
