const CACHE = 'superapp-famille-v5-36-15';
const CORE_ASSETS = ['./', './index.html', './css/app.css?v=5.36.15', './js/app.js?v=5.36.15', './js/supabase-client.js?v=5.36.15', './js/supabase-app.js?v=5.36.15', './css/supabase-auth.css?v=5.36.15', './manifest.json?v=5.36.15'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE_ASSETS)).catch(()=>{}));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  const isAppShell = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/app.js') || url.pathname.endsWith('/app.css') || url.pathname.endsWith('/manifest.json');
  if (isAppShell) {
    event.respondWith(
      fetch(req, {cache:'no-store'})
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
          return response;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});
