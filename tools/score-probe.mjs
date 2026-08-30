// Reproduce Mark's screenshot: open a song, switch to Score, and report what
// the score area actually contains. Drives with REAL hit-tested clicks.
import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const b = await launch({ width: 2000, height: 1150, scale: 1, port: 9570 });
// Try EVERY candidate and every clickable ancestor of it, and say how many
// there were: "NO HITTABLE" with no count told me nothing when this went flaky.
const click = (label) => b.eval(`(() => {
  const want = ${JSON.stringify(label)};
  const hits = [...document.querySelectorAll('*')].filter((e) => !e.children.length
    && e.textContent.trim() === want && e.getBoundingClientRect().width > 0);
  const tryEl = (t) => {
    const r = t.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    if (!top || !(top === t || t.contains(top) || top.contains(t))) return false;
    t.click(); return true;
  };
  for (const el of [...hits].reverse()) {
    // the leaf and its nearest real control FIRST: walking up eagerly clicked a
    // tile's outer wrapper, which is not what opens the song
    const ctrl = el.closest('button, a, [role="button"], select');
    if (ctrl && tryEl(ctrl)) return 'clicked ' + ctrl.tagName;
    if (tryEl(el)) return 'clicked leaf ' + el.tagName;
  }
  for (const el of [...hits].reverse()) {
    let n = el.parentElement;
    for (let up = 0; n && up < 3; up++, n = n.parentElement) if (tryEl(n)) return 'clicked ancestor ' + n.tagName;
  }
  return 'NO HITTABLE "' + want + '" (candidates: ' + hits.length + ')';
})()`);

try {
  const errs = [];
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify({
    firstRunDone: true, diagnosticDone: true, days: [], pmin: {},
    songs: { 'fur-elise': { plays: 79, stars: 1, best: 92 } }, lessons: {}, lib: { learning: true },
    // RESUME straight into the play screen in SCORE view. Clicking a tile and
    // then a tier depends on hit-testing a moving grid and went flaky; the
    // return loop is the app's own deterministic door into exactly the state
    // Mark photographed.
    lastSession: { songId: 'fur-elise', sec: 0, tempo: '100', hand: 'both', wait: true, view: 'score', at: Date.now() },
  }))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  const w = b.watchErrors();
  await new Promise((r) => setTimeout(r, 2200));

  // open Fur Elise straight through the app's own router
  console.log('open song:', await b.eval(`(() => {
    const s = window.__songs?.find?.((x) => x.id === 'fur-elise');
    return 'no __songs hook';
  })()`));
  const visibleScreen = () => b.eval(`[...document.querySelectorAll('[id^="screen-"]')].filter((s) => s.offsetParent !== null || getComputedStyle(s).display !== 'none').map((s) => s.id).join(',')`);
  console.log('start screen:', await visibleScreen());
  console.log('resume:', await click('Resume the session'));
  await new Promise((r) => setTimeout(r, 2000));
  console.log('screen now:', await visibleScreen());

  const report = () => b.eval(`(() => {
    const wrap = document.getElementById('score-wrap');
    if (!wrap) return 'NO #score-wrap';
    const r = wrap.getBoundingClientRect();
    const svg = wrap.querySelector('svg');
    const sr = svg?.getBoundingClientRect();
    return JSON.stringify({
      viewMode: window.__viewMode,
      wrapHidden: wrap.hidden,
      wrap: Math.round(r.width) + 'x' + Math.round(r.height),
      children: wrap.children.length,
      svg: svg ? Math.round(sr.width) + 'x' + Math.round(sr.height) : 'NO SVG',
      svgViewBox: svg?.getAttribute('viewBox') ?? '-',
      svgKids: svg ? svg.querySelectorAll('*').length : 0,
      inkedPaths: svg ? [...svg.querySelectorAll('path,line,rect,circle,ellipse,text')].filter((n) => n.getBoundingClientRect().width > 0 || n.getBoundingClientRect().height > 0).length : 0,
    });
  })()`);

  const anatomy = () => b.eval(`(() => {
    const wrap = document.getElementById('score-wrap');
    const cs = getComputedStyle(wrap);
    const chain = [];
    for (let n = wrap; n && n !== document.body; n = n.parentElement) {
      const r = n.getBoundingClientRect(), s = getComputedStyle(n);
      chain.push(n.tagName + (n.id ? '#' + n.id : '') + (n.className ? '.' + String(n.className).split(' ').join('.') : '')
        + '  ' + Math.round(r.width) + 'x' + Math.round(r.height) + '  flex=' + s.flex + ' disp=' + s.display + ' bg=' + s.backgroundColor);
    }
    return JSON.stringify({
      classes: String(wrap.className) || '(none)',
      bg: cs.backgroundColor, flex: cs.flex, overflowX: cs.overflowX, minHeight: cs.minHeight,
      chain,
    }, null, 1);
  })()`);
  console.log('ANATOMY:', await anatomy());
  console.log('BEFORE switching to Score:', await report());
  console.log('click Score:', await click('Score'));
  await new Promise((r) => setTimeout(r, 1200));
  console.log('AFTER  switching to Score:', await report());
  console.log('CSS MATCH:', await b.eval(`(() => {
    const w = document.getElementById('score-wrap');
    const cs = getComputedStyle(w);
    return JSON.stringify({
      matchesCanonRule: w.matches('.canon-root .score-wrap'),
      matchesPlainRule: w.matches('.score-wrap'),
      bg: cs.backgroundColor,
      scoreLine: cs.getPropertyValue('--score-line').trim() || '(unset)',
      overflowX: cs.overflowX,
      inlineStyle: w.getAttribute('style') || '(none)',
      sheets: [...document.styleSheets].map((s2) => { try { return (s2.href || 'inline') + ':' + s2.cssRules.length; } catch { return 'BLOCKED'; } }).join(' | '),
    }, null, 1);
  })()`));
  console.log('HEADS IN THE APP:', await b.eval(`(() => {
    const svg = document.querySelector('#score-wrap svg');
    if (!svg) return 'no svg';
    const heads = [...svg.querySelectorAll('ellipse')];
    const sample = heads.slice(0, 4).map((h) => {
      const cs = getComputedStyle(h), r = h.getBoundingClientRect();
      return { fill: cs.fill, stroke: cs.stroke, opacity: cs.opacity, display: cs.display,
        box: Math.round(r.width) + 'x' + Math.round(r.height),
        noteInk: getComputedStyle(h.parentElement).getPropertyValue('--note-ink').trim() || '(unset)' };
    });
    return JSON.stringify({ count: heads.length, sample }, null, 1);
  })()`));
  writeFileSync('design-2026-08/verify-20260829/score-blank.png', await b.shot());

  console.log('console errors:', w.errors.length ? w.errors.join(' | ') : 'none');
} finally { await b.close(); }
