const CACHE_NAME = 'modok-pwa-v2';
const PRE_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png'
];

const STATIC_EXTENSIONS = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.woff2', '.woff', '.ttf'];
const API_PREFIX = '/api/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRE_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : undefined)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isApi = isSameOrigin && url.pathname.startsWith(API_PREFIX);
  const isNavigation = request.mode === 'navigate';
  const isStaticAsset =
    isSameOrigin && STATIC_EXTENSIONS.some((ext) => url.pathname.toLowerCase().endsWith(ext));

  // Nunca cacheamos API ni intentamos servirlas offline
  if (isApi) {
    return;
  }

  // Navegación: red de preferencia; si falla, caemos al shell precacheado
  if (isNavigation) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Solo cacheamos assets estáticos; para el resto delegamos a la red
  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
    )
  );
});
