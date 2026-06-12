const CACHE = 'superapp-famille-v5-78-0';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css?v=5.78.0',
  './css/supabase-auth.css?v=5.78.0',
  './js/app.js?v=5.78.0',
  './js/supabase-client.js?v=5.78.0',
  './js/supabase-app.js?v=5.78.0',
  './assets/icons/superapp-famille-icon-180.png',
  './assets/icons/superapp-famille-icon-192.png',
  './assets/icons/superapp-famille-icon-512.png'
];

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
  if(req.method !== 'GET') return;
  const url = new URL(req.url);

  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req, {cache:'no-store'})
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copy)).catch(()=>{});
          return res;
        })
        .catch(() => caches.match('./index.html').then(cached => cached || caches.match('./')))
    );
    return;
  }

  const isLocalAsset = url.origin === self.location.origin;
  if(isLocalAsset && /\/(index\.html|manifest\.json|service-worker\.js)$/.test(url.pathname)){
    event.respondWith(
      fetch(req, {cache:'no-store'})
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if(isLocalAsset && res && res.ok){
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
      }
      return res;
    }).catch(() => cached))
  );
});
