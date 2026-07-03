/* AfriTrust service worker — network-first shell so deploys are never stale;
   cached fallback keeps the app openable offline. Never caches /api. */
const VERSION = 'afritrust-v1';
const SHELL = [
  '/', '/index.html', '/dashboard.html', '/login.html', '/register.html',
  '/withdraw.html', '/success.html',
  '/css/style.css', '/css/components.css',
  '/js/config.js', '/js/i18n.js', '/js/main.js', '/js/util.js',
  '/js/auth.js', '/js/dashboard.js', '/js/withdraw.js',
  '/icon.svg', '/manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  // Only handle same-origin GETs; let the API and everything else go straight to network.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(request, copy)); }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('/index.html')))
  );
});
