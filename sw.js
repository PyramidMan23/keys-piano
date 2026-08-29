// App-shell cache. Bump VERSION on every deploy so clients update.
const VERSION = 'keys-v59';
const SHELL = [
  '.', 'index.html', 'style.css', 'icon.svg', 'manifest.webmanifest', 'fonts/Fraunces.ttf',
  'js/app.mjs', 'js/engine.mjs', 'js/midi.mjs', 'js/falls.mjs', 'js/score.mjs', 'js/songs.mjs', 'js/audio.mjs', 'js/echo.mjs',
  'js/kernels.mjs', 'js/sight.mjs', 'js/theory.mjs', 'js/rhythm.mjs', 'js/lessons.mjs',
  'js/touch.mjs', 'js/pedal.mjs', 'js/artic.mjs', 'js/voicing.mjs', 'js/takes.mjs', 'js/form.mjs', 'js/memory.mjs',
  'js/perform.mjs', 'js/improv.mjs', 'js/teacher.mjs', 'js/path.mjs', 'js/library.mjs', 'js/game.mjs', 'js/difficulty.mjs', 'js/covers.mjs',
  'js/art-manifest.mjs',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
