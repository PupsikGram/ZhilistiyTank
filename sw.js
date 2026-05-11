const CACHE = 'tank-v2-cache';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

// Install — кешируем всё
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — удаляем старые кеши
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — сначала кеш, потом сеть (офлайн работает)
self.addEventListener('fetch', e => {
  // Внешние API запросы (Gemini, Groq) — только сеть
  if (e.request.url.includes('googleapis.com') || e.request.url.includes('groq.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
