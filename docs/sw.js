// Copia l'app sul telefono cosi' funziona anche senza rete.
// Quando cambia un file, alzare il numero di versione.
const CACHE = 'duel-lp-v5';
const FILES = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'logic.js',
  'manifest.webmanifest',
  'fonts/bebas-neue.woff2',
  'img/bg.jpg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then((hit) => hit ?? fetch(event.request)),
  );
});
