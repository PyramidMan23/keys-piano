// App-shell cache. Bump VERSION on every deploy so clients update.
// v132 shipped 22 new songs and the Explore collections from the serving copy;
// v133 is that shell plus the learning wave's modules. Bumped rather than
// reused, or a client already holding v132 keeps its cached shell and never
// fetches the new ones.
const VERSION = 'keys-v135';  // v133's learning wave plus real cover art for every song that has a record.
const SHELL = [
  '.', 'index.html', 'style.css', 'icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest', 'fonts/Fraunces.ttf',
  // ☠️ songs.mjs IMPORTS songs-hands.mjs AND songs-fingers.mjs. Neither was
  // listed here: a shell that caches a module but not what it imports installs
  // a build that cannot boot offline, and the failure appears only on the
  // second visit, when the network is gone and the import 404s from cache.
  // Anything songs.mjs imports belongs on this list.
  'js/app.mjs', 'js/engine.mjs', 'js/midi.mjs', 'js/falls.mjs', 'js/score.mjs', 'js/songs.mjs', 'js/songs-imported.mjs',
  'js/songs-hands.mjs', 'js/songs-fingers.mjs', 'js/songs-fixed.mjs', 'js/songs-quarantine.mjs', 'js/songs-meter.mjs', 'js/songs-bars.mjs', 'js/songs-library.mjs', 'js/hands.mjs', 'js/audio.mjs', 'js/echo.mjs',
  'js/kernels.mjs', 'js/sight.mjs', 'js/theory.mjs', 'js/rhythm.mjs', 'js/lessons.mjs',
  // the learning wave. learning-ui.css is a STYLESHEET the page links directly,
  // not a module import, so shell-check cannot find it by walking imports: it
  // is listed here by hand, exactly like style.css above.
  'js/reading-session.mjs', 'js/learning-lab.mjs', 'js/lab-score.mjs',
  'js/learning-ui.mjs', 'js/learning-ui.css',
  'js/touch.mjs', 'js/pedal.mjs', 'js/artic.mjs', 'js/voicing.mjs', 'js/takes.mjs', 'js/form.mjs', 'js/memory.mjs',
  'js/perform.mjs', 'js/improv.mjs', 'js/teacher.mjs', 'js/path.mjs', 'js/library.mjs', 'js/game.mjs', 'js/difficulty.mjs', 'js/covers.mjs',
  'js/art-manifest.mjs',
  'js/notation.mjs', 'js/engraving.mjs', 'vendor/vexflow-4.2.5.js',
  'js/practice-insight.mjs', 'js/music-source.mjs', 'js/source-checks.mjs',
  'js/practice-template.mjs',
  'js/source-signature.mjs',
  'js/meter.mjs',
  // the canon: the design as markup, and everything that mounts and binds it
  'js/canon-templates.mjs', 'js/canon-mount.mjs', 'js/canon-screen.mjs', 'js/canon-play.mjs',
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
