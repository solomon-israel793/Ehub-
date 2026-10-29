// eHub Academic CBT & Learning System Service Worker
// Fully compliant with W3C Service Worker standards, Lighthouse PWA Audits, and PWABuilder
const CACHE_NAME = 'ehub-pwa-v4';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/assetlinks.json',
  '/.well-known/assetlinks.json',
  '/offline.html',
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
  '/pwa-96x96.png',
  '/pwa-128x128.png',
  '/pwa-192x192.png',
  '/pwa-256x256.png',
  '/pwa-384x384.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/screenshot-desktop.png',
  '/screenshot-mobile.png',
  '/katex/katex.min.css',
  '/katex/katex.min.js',
  '/katex/auto-render.min.js'
];

// Offline HTML fallback if navigation cache misses
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta name="theme-color" content="#1C2541">
  <title>eHub Offline — Academic CBT</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #F3F6FB; color: #1E293B; margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
    .card { background: #fff; padding: 32px; border-radius: 16px; max-width: 480px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.06); text-align: center; }
    .brand { font-size: 28px; font-weight: 800; color: #1C2541; margin-bottom: 12px; }
    .brand span { color: #2196F3; font-style: italic; }
    .brand b { background: #FF9800; color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 18px; margin-left: 2px; }
    .badge { display: inline-block; background: #FEF3C7; color: #B45309; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
    h2 { margin: 8px 0; font-size: 20px; }
    p { color: #64748B; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: inline-block; background: #2563EB; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: background 0.2s; }
    .btn:hover { background: #1D4ED8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand"><span>e</span><b>hub</b></div>
    <div class="badge">Offline Storage Ready</div>
    <h2>Academic Session Preserved</h2>
    <p>You are currently operating in offline mode. Your answered CBT tests, lecture materials, and exam drafts remain securely stored locally.</p>
    <button class="btn" onclick="window.location.reload()">Reload Application</button>
  </div>
</body>
</html>`;

// 1. Install Event: Cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Put offline fallback HTML
      await cache.put(
        new Request('/offline.html'),
        new Response(OFFLINE_FALLBACK_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      );
      // Cache assets individually so one failure does not abort the install
      await Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[eHub SW] Non-fatal precache skip for:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[eHub SW] Clearing stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Message Event: Allow skip waiting on prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. Fetch Event: Intercept network requests
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests and chrome-extension / non-http schemas
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // A. Navigation Requests (HTML documents / page loads)
  // Must return 200 OK even when fully offline to satisfy PWABuilder & Lighthouse
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback: check request match first, then /index.html, then /
          const cached = (await caches.match(req, { ignoreSearch: true })) ||
                         (await caches.match('/index.html')) ||
                         (await caches.match('/')) ||
                         (await caches.match('/offline.html'));
          if (cached) return cached;

          // Inline response guarantee if cache is somehow cleared
          return new Response(OFFLINE_FALLBACK_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // B. API Requests (/api/* or /mail or /ai)
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/mail') || url.pathname.startsWith('/ai')) {
    event.respondWith(
      fetch(req).catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response(
          JSON.stringify({
            offline: true,
            message: 'You are currently offline. Your exam responses and local data are preserved in eHub storage.'
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          }
        );
      })
    );
    return;
  }

  // C. Static Assets (CSS, JS, Fonts, Images) - Stale While Revalidate
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback if offline and asset not cached
          return cachedResponse || new Response('', { status: 408, statusText: 'Offline asset unavailable' });
        });

      return cachedResponse || fetchPromise;
    })
  );
});
