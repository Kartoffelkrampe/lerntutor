// LernTutor – Offline-Speicher für die App selbst (KI-, Google- und API-Aufrufe laufen immer direkt übers Netz)
const CACHE = 'lerntutor-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  const cdn = url.hostname === 'cdnjs.cloudflare.com';
  if (!own && !cdn) return;
  if (cdn) {
    // Formel-Darstellung (KaTeX): einmal laden, dann aus dem Speicher
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })));
    return;
  }
  // Eigene Dateien: erst Netz (damit Updates ankommen), offline aus dem Speicher
  e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; })
    .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
});
