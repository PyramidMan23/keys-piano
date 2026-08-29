// WHAT IN THE CANON IS ACTUALLY CLICKABLE?
//
// The port renders the DESIGN'S OWN MARKUP. That markup has no behaviour in it:
// every button in an artboard is a picture of a button. The binders attach the
// app's handlers to a SUBSET of them, and nothing anywhere measured how big
// that subset was, so "20/20 screens pixel-identical" could sit next to a
// screen where almost nothing responds to a click.
//
// Mark, 2026-08-29: "why cant i click on anything".
//
// This asks the only question that matters: for every control the canon puts on
// screen, is there a real click listener on it or on an ancestor? Listeners are
// read out of the browser with DOMDebugger.getEventListeners, not guessed from
// the source.
//
// Run: node tools/canon-clickable.mjs
import { launch } from './cdp.mjs';

const today = new Date();
const day = (o) => { const d = new Date(today); d.setDate(d.getDate() - o);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [day(0), day(1), day(2), day(4)],
  pmin: { [day(0)]: 24, [day(1)]: 12, [day(2)]: 31, [day(4)]: 18 },
  lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: {
    'fur-elise': { plays: 79, stars: 3, best: 96 },
    'still-dre-easy': { plays: 22, stars: 3, best: 91 },
    'mario-easy': { plays: 5, stars: 1, best: 71 },
  },
  lib: { learning: true },
};

const SCREENS = [
  ['library', null], ['trophies', 'btn-trophies'], ['takes', 'btn-takes'], ['lessons', 'btn-lessons'],
  ['keys12', 'btn-keys12'], ['freeplay', 'btn-freeplay'], ['metronome', 'btn-metronome'],
  ['rhythm', 'btn-rhythm'], ['echo', 'btn-echo'], ['improv', 'btn-improv'],
  ['calibrate', 'btn-calibrate'], ['touch', 'btn-touch'], ['path', 'btn-path'],
];

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9590 });
const rows = [];
try {
  await b.send('DOM.enable');
  await b.goto('http://localhost:4180/index.html');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1800));

  for (const [screen, control] of SCREENS) {
    if (control) await b.eval(`(() => { const el = document.getElementById('${control}'); if (el) el.click(); return true; })()`);
    else await b.eval(`window.__show && window.__show('library'); true`);
    await new Promise((r) => setTimeout(r, 400));

    // stamp every visible control so we can address them one at a time
    const count = await b.eval(`(() => {
      const host = document.getElementById('screen-${screen}');
      const card = host && host.firstElementChild;
      if (!card) return 0;
      let n = 0;
      for (const el of card.querySelectorAll('button, a, input, select, textarea, [role="button"]')) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;      // not on screen, not the question
        el.setAttribute('data-clickprobe', String(n++));
      }
      return n;
    })()`);

    const dead = [];
    for (let i = 0; i < count; i++) {
      const { result } = await b.send('Runtime.evaluate', {
        expression: `document.querySelector('#screen-${screen} [data-clickprobe="${i}"]')`,
      });
      if (!result.objectId) continue;
      // walk up: a listener on an ancestor still makes the control work
      let live = false, tag = '', label = '';
      const info = await b.send('Runtime.callFunctionOn', {
        objectId: result.objectId, returnByValue: true,
        functionDeclaration: `function () {
          return { tag: this.tagName.toLowerCase(), id: this.id || '',
                   label: (this.getAttribute('aria-label') || this.textContent || this.getAttribute('placeholder') || '').trim().slice(0, 34),
                   inline: !!(this.onclick || this.getAttribute('onclick')),
                   native: this.tagName === 'INPUT' || this.tagName === 'SELECT' || this.tagName === 'TEXTAREA' };
        }`,
      });
      tag = info.result.value.tag; label = info.result.value.label;
      if (info.result.value.inline || info.result.value.native) live = true;

      if (!live) {
        // listeners on the node itself, then on each ancestor
        let objId = result.objectId;
        for (let up = 0; up < 6 && objId && !live; up++) {
          const ls = await b.send('DOMDebugger.getEventListeners', { objectId: objId });
          if ((ls.listeners ?? []).some((l) => l.type === 'click' || l.type === 'pointerdown' || l.type === 'mousedown')) { live = true; break; }
          const parent = await b.send('Runtime.callFunctionOn', {
            objectId: objId, functionDeclaration: 'function () { return this.parentElement; }',
          });
          objId = parent.result.objectId;
        }
      }
      if (!live) dead.push(`<${tag}> ${JSON.stringify(label)}${info.result.value.id ? ' #' + info.result.value.id : ''}`);
    }
    rows.push({ screen, total: count, dead });
  }
} finally { await b.close(); }

console.log('screen        controls   dead   live');
console.log('-'.repeat(56));
let T = 0, D = 0;
for (const r of rows) {
  T += r.total; D += r.dead.length;
  const pct = r.total ? Math.round(((r.total - r.dead.length) / r.total) * 100) : 100;
  console.log(`${r.screen.padEnd(13)} ${String(r.total).padStart(8)} ${String(r.dead.length).padStart(6)}   ${pct}%`);
}
console.log('-'.repeat(56));
console.log(`${T - D}/${T} visible controls in the canon respond to a click (${Math.round(((T - D) / T) * 100)}%)`);
for (const r of rows) {
  if (!r.dead.length) continue;
  console.log(`\n${r.screen} - ${r.dead.length} dead:`);
  for (const d of r.dead.slice(0, 14)) console.log('   ' + d);
  if (r.dead.length > 14) console.log(`   ... and ${r.dead.length - 14} more`);
}
// a gate that cannot go red is not a gate (2026-08-29): dead controls fail the run
process.exit(D ? 1 : 0);
