// Service worker: офлайн через precache (cache-first). При изменении файлов увеличьте VERSION.
const VERSION = 'v1';
const CACHE = `gym-pwa-${VERSION}`;
const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/diagrams.js',
  './js/store.js',
  './js/data/exercises.js',
  './js/data/program.js',
  './js/engine/plan.js',
  './js/engine/progression.js',
  './js/engine/session.js',
  './js/engine/swap.js',
  './js/ui/data.js',
  './js/ui/exercise.js',
  './js/ui/gym.js',
  './js/ui/history.js',
  './js/ui/swap.js',
  './js/ui/timer.js',
  './js/ui/today.js',
  './js/ui/util.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit || fetch(e.request).catch(() =>
        e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
