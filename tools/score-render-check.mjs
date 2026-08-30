// DOES THE NOTATION ACTUALLY PAINT? Renders ScoreView into a container that is
// inside a `.canon-root` subtree, exactly as the app does, and measures the ink
// against the page it sits on. This exists because seven gates passed while the
// score rendered as an empty box for Mark: nothing checked that the surface an
// app component draws has any visible ink on it.
//
// Usage: node tools/score-render-check.mjs
import { launch } from './cdp.mjs';

const PAGE = `(async () => {
  const { SONGS } = await import('/js/songs.mjs');
  const { ScoreView } = await import('/js/score.mjs');
  const song = SONGS.find((s) => s.id === 'fur-elise') || SONGS[0];

  // the canon's own hosting: a canon-root subtree, and the board's inline
  // styles on the element the port hands to ScoreView
  const main = document.createElement('main');
  main.className = 'screen canon-root';
  const card = document.createElement('div');
  card.className = 'dv-card';
  const wrap = document.createElement('div');
  wrap.id = 'score-wrap';
  wrap.setAttribute('style', 'padding:11px;border:1px solid #253129;border-radius:3px;display:flex;flex-direction:column;gap:9px');
  card.appendChild(wrap); main.appendChild(card); document.body.appendChild(main);

  // what canon-play.mjs does when it adopts the surface
  wrap.classList.add('score-wrap');
  wrap.style.display = 'block';
  wrap.style.flexDirection = '';
  wrap.style.gap = '';
  wrap.style.padding = '';
  wrap.style.flex = '1 1 auto';
  wrap.style.minHeight = '0';
  wrap.style.width = '100%';

  const endBeat = Math.max(...song.notes.map((n) => n.b + n.d)) + 1;
  new ScoreView(wrap).build(song, { endBeat });

  const svg = wrap.querySelector('svg');
  if (!svg) return JSON.stringify({ error: 'no svg built' });

  const lum = (c) => {
    const v = (String(c).match(/[0-9.]+/g) || []).slice(0, 3).map(Number);
    if (v.length < 3) return null;
    const f = v.map((n) => { n /= 255; return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4); });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  };
  const ratio = (a, b) => {
    const la = lum(a), lb = lum(b);
    if (la === null || lb === null) return null;
    return +(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05))).toFixed(2);
  };
  const ground = getComputedStyle(wrap).backgroundColor;
  const heads = [...svg.querySelectorAll('ellipse')];
  const lines = [...svg.querySelectorAll('line')];
  const glyphs = [...svg.querySelectorAll('text')];
  const paint = (els, prop) => {
    const seen = new Map();
    for (const e of els.slice(0, 400)) {
      const c = getComputedStyle(e)[prop];
      if (!c || c === 'none') continue;
      seen.set(c, (seen.get(c) || 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([c, n]) => ({ colour: c, n, contrast: ratio(c, ground) }));
  };
  const r = svg.getBoundingClientRect();
  return JSON.stringify({
    page: ground,
    svg: Math.round(r.width) + 'x' + Math.round(r.height),
    wrap: Math.round(wrap.getBoundingClientRect().width) + 'x' + Math.round(wrap.getBoundingClientRect().height),
    overflowX: getComputedStyle(wrap).overflowX,
    counts: { heads: heads.length, lines: lines.length, glyphs: glyphs.length },
    headFill: paint(heads, 'fill'),
    lineStroke: paint(lines, 'stroke'),
    glyphFill: paint(glyphs, 'fill'),
  }, null, 1);
})()`;

const b = await launch({ width: 1400, height: 700, scale: 1, port: 9575 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  const out = JSON.parse(await b.eval(PAGE));
  console.log(JSON.stringify(out, null, 1));

  const fails = [];
  if (out.error) fails.push(out.error);
  if (!out.counts || out.counts.heads < 10) fails.push(`only ${out.counts?.heads} note heads drawn`);
  const worst = (arr) => arr.filter((x) => x.contrast !== null).sort((a, z) => a.contrast - z.contrast)[0];
  for (const [what, arr] of [['note heads', out.headFill], ['stave lines', out.lineStroke], ['glyphs', out.glyphFill]]) {
    if (!arr?.length) { fails.push(`${what}: nothing painted at all`); continue; }
    const w = worst(arr);
    if (!w) { fails.push(`${what}: no resolvable colour`); continue; }
    if (w.contrast < 3) fails.push(`${what}: ${w.colour} is ${w.contrast}:1 on the page, invisible`);
  }
  const h = Number(String(out.svg).split('x')[1]);
  if (!(h > 100)) fails.push(`the score is ${out.svg}: collapsed, not a page`);
  if (out.overflowX !== 'auto') fails.push(`the page does not scroll (overflow-x: ${out.overflowX})`);

  console.log('-'.repeat(70));
  if (fails.length) { for (const f of fails) console.log('FAIL  ' + f); process.exit(1); }
  console.log('PASS  the score paints: notes, staves and glyphs all legible on the page');
} finally { await b.close(); }
