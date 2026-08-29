// App-shell cache. Bump VERSION on every deploy so clients update.
const VERSION = 'keys-v67';   // sleeve wall: 12a full-screen gallery + chunk/met-sig/improv NaN class fix + live proxy labels
const SHELL = [
  '.', 'index.html', 'style.css', 'icon.svg', 'manifest.webmanifest', 'fonts/Fraunces.ttf',
  'js/app.mjs', 'js/engine.mjs', 'js/midi.mjs', 'js/falls.mjs', 'js/score.mjs', 'js/songs.mjs', 'js/audio.mjs', 'js/echo.mjs',
  'js/kernels.mjs', 'js/sight.mjs', 'js/theory.mjs', 'js/rhythm.mjs', 'js/lessons.mjs',
  'js/touch.mjs', 'js/pedal.mjs', 'js/artic.mjs', 'js/voicing.mjs', 'js/takes.mjs', 'js/form.mjs', 'js/memory.mjs',
  'js/perform.mjs', 'js/improv.mjs', 'js/teacher.mjs', 'js/path.mjs', 'js/library.mjs', 'js/game.mjs', 'js/difficulty.mjs', 'js/covers.mjs',
  'js/art-manifest.mjs',
  // the canon: the design as markup, and everything that mounts and binds it
  'js/canon-templates.mjs', 'js/canon-mount.mjs', 'js/canon-screen.mjs',
  'js/canon-library.mjs', 'js/canon-bind.mjs', 'js/canon-list.mjs',
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
        // Cache only SUCCESS. A transient 404 written into the cache would be
        // replayed forever once offline, which turns one bad response into a
        // permanently broken module. (Codex review, 2026-08-29.)
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
