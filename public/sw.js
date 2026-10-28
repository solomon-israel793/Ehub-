// eHub Academic CBT Service Worker
const CACHE_NAME = 'ehub-cbt-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/style.css',
  '/theme.css',
  '/config.js',
  '/mock-backend.js',
  '/mock-school.js',
  '/ai.js',
  '/pdf-export.js',
  '/app.js',
  '/school-ui.js',
  '/v7.js',
  '/v8.js',
  '/v9.js',
  '/v10.js',
  '/v11.js',
  '/math.js',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/katex/katex.min.css',
  '/katex/katex.min.js',
  '/katex/auto-render.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some assets could not be pre-cached:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET and chrome-extension / external cross-origin analytics
  if (req.method !== 'GET') return;

  // For API endpoints, prefer network first, fallback to cached if offline
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match(req).then((cached) => {
          return cached || new Response(JSON.stringify({ error: 'You are currently offline. Local records remain preserved.' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
    return;
  }

  // For navigation requests (HTML pages), network-first with cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return response;
      }).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Cache first, then network for static resources
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });
        return response;
      }).catch(() => {
        // Offline placeholder if needed
        return new Response('Offline resource unavailable', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
