const CACHE_NAME = '365-manhas-com-deus-v6';
// Arquivos pequenos que mudam com frequência: sempre busca a versão mais nova primeiro.
const CORE_ASSETS = ['./', './index.html', './app.js', './manifest.json', './icon.svg'];
// Arquivos grandes/estáticos que raramente mudam: prioriza o cache para ficar rápido offline.
const STATIC_ASSETS = ['./tailwind.css', './bible-alm1911.json'];
const ASSETS = [...CORE_ASSETS, ...STATIC_ASSETS];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isCore(request){
  if(request.mode === 'navigate') return true;
  const path = new URL(request.url).pathname;
  return CORE_ASSETS.some((a) => path.endsWith(a.replace('./', '')) || (a === './' && path.endsWith('/')));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if(isCore(req)){
    // network-first: garante que atualizações do app apareçam assim que publicadas
    event.respondWith(
      fetch(req).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return response;
      }).catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return response;
      }).catch(() => cached);
    })
  );
});
