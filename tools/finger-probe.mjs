// DOES THE FINGER NUMBER ACTUALLY REACH THE SCREEN?
//
// Mark, 2026-08-30: "we used to have the finger, which finger we should be
// using on which note ... this has gone. Make sure this is in every single
// zone. Never disappears."
//
// The data being right proves nothing: 6,667 notes already carried a finger
// number while he was looking at a screen with none on it. The cause was that
// falls.mjs drew fingering INSIDE `if (this.cueLetters)`, so turning note names
// off took the finger numbers with them, silently.
//
// So this checks the OUTPUT. It wraps fillText on the real canvas, forces a
// frame with note names ON and again with them OFF, and reports what was
// actually painted. A fingering that only survives with note names switched on
// is the bug he reported, and this is the only thing that can see it.
//
//   node tools/finger-probe.mjs
import { launch } from './cdp.mjs';

// ☠️ THE SAME SEED tools/canon-journeys.mjs USES. An empty `songs` map leaves
// the Learning shelf empty, so there is no song row to click and the probe
// fails looking like a bug in the app rather than in its own fixture.
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [], pmin: {},
  lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: {
    'fur-elise': { plays: 79, stars: 3, best: 96 },
    'still-dre-easy': { plays: 22, stars: 3, best: 91 },
    'mario-easy': { plays: 5, stars: 1, best: 71 },
  },
  lessons: {}, lib: { learning: true },
};

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9673 });
const fails = [];
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1800));

  // open a song so there is an engine with real notes to draw.
  // ☠️ A REAL HIT-TESTED CLICK, never el.click(): a synthetic click does not
  // hit-test, so it "succeeds" on an element sitting under something else and
  // the app never opens the song. The first run of this probe reported
  // "clicked" and then found no window.__falls, because nothing had opened.
  // ☠️ EXACT TEXT, NOT A REGEX. "Still D.R.E." also appears inside "▶ Continue,
  // Still D.R.E. (Easy)", so a regex collects both and can spend its whole
  // hit-test budget on the wrong one. canon-journeys.mjs matches exactly, and
  // that is why it works.
  const pt = await b.eval(`(() => {
    for (const label of ['Still D.R.E.', 'Start', 'F\\u00fcr Elise']) {
      const matches = [...document.querySelectorAll('*')].filter((e) => !e.children.length
        && e.textContent.trim() === label && e.getBoundingClientRect().width > 0);
      for (const el of matches.reverse()) {
        const hit = el.closest('button, a, [role="button"]') || el;
        const r = hit.getBoundingClientRect();
        const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);
        const top = document.elementFromPoint(cx, cy);
        if (top && (top === hit || hit.contains(top) || top.contains(hit))) {
          return { x: Math.round(cx), y: Math.round(cy), label };
        }
      }
    }
    return null;
  })()`);
  if (!pt) fails.push('no song row to open on the library');
  else {
    console.log(`clicking ${JSON.stringify(pt.label)} at ${pt.x},${pt.y}`);
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  }
  await new Promise((r) => setTimeout(r, 1400));
  const screen = await b.eval(`(() => { const s = [...document.querySelectorAll('.screen')].find((x) => !x.hidden); return s ? s.id.replace('screen-','') : 'none'; })()`);
  console.log(`opened screen: ${screen}`);

  const probe = async (lettersOn) => b.eval(`(async () => {
    const f = window.__falls, e = window.__engine;
    if (!f) return { err: 'no window.__falls' };
    if (!e) return { err: 'no window.__engine' };
    f.cueLetters = ${lettersOn};
    // wind the song on so notes are inside the fall window
    if (e.groups && !e.groups.length) return { err: 'engine has no note groups' };
    const painted = [];
    const C = CanvasRenderingContext2D.prototype;
    const orig = C.fillText;
    C.fillText = function (t, ...a) { painted.push(String(t)); return orig.call(this, t, ...a); };
    try { for (let i = 0; i < 8; i++) { e.t = 2 + i * 0.35; f.draw(e); } } finally { C.fillText = orig; }
    const digits = painted.filter((s) => /^[1-5]$/.test(s));
    const dotted = painted.filter((s) => /^[A-G][#b]?\\u00b7[1-5]$/.test(s));
    const letters = painted.filter((s) => /^[A-G][#b]?$/.test(s));
    return {
      cueFingers: f.cueFingers,
      total: painted.length,
      fingerDigits: digits.length,
      letterDotFinger: dotted.length,
      bareLetters: letters.length,
      sample: [...new Set(painted)].slice(0, 14),
    };
  })()`);

  for (const on of [true, false]) {
    const r = await probe(on);
    const label = on ? 'note names ON ' : 'note names OFF';
    if (r.err) { fails.push(`${label}: ${r.err}`); console.log(`${label}  ERROR ${r.err}`); continue; }
    const withFinger = r.fingerDigits + r.letterDotFinger;
    console.log(`${label}  cueFingers=${r.cueFingers}  painted ${r.total} labels, ` +
      `${withFinger} carry a finger (${r.fingerDigits} bare, ${r.letterDotFinger} name-dot-finger), ` +
      `${r.bareLetters} bare names`);
    console.log(`               sample: ${JSON.stringify(r.sample)}`);
    if (!withFinger) fails.push(`${label}: NOTHING on screen carries a finger number`);
  }
} finally { await b.close(); }

if (fails.length) {
  console.log('\nFAIL');
  for (const f of fails) console.log('  ' + f);
  process.exit(1);
}
console.log('\nfinger numbers reach the screen with note names both on and off');
