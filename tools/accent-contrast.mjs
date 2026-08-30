// Measure the REAL contrast of every progress-accent surface as rendered,
// against the ground actually painted behind it. Written to a file on purpose:
// this regex has been eaten twice by shell/template escaping.
import { launch } from './cdp.mjs';
const day = (o) => { const x = new Date(); x.setDate(x.getDate() - o);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

const PAGE = `(() => {
  const AMBER = '224, 163, 63';
  const nums = (c) => (String(c).match(/[0-9.]+/g) || []).slice(0, 3).map(Number);
  const lum = (c) => {
    const v = nums(c);
    if (v.length < 3) return null;
    const f = v.map((n) => { n /= 255; return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4); });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  };
  const ratio = (a, b) => {
    const la = lum(a), lb = lum(b);
    if (la === null || lb === null) return '?';
    return (((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05))).toFixed(2);
  };
  const groundOf = (el) => {
    let n = el;
    while (n) {
      const bg = getComputedStyle(n).backgroundColor;
      if (bg && !/rgba\\(0, 0, 0, 0\\)/.test(bg) && !/transparent/.test(bg)) return bg;
      n = n.parentElement;
    }
    return 'rgb(0, 0, 0)';
  };
  const out = [];
  for (const e of document.querySelectorAll('#screen-library *')) {
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const ink = cs.color.includes(AMBER);
    const fill = cs.backgroundColor.includes(AMBER);
    const stroke = cs.borderTopColor.includes(AMBER) && parseFloat(cs.borderTopWidth) > 0;
    if (!ink && !fill && !stroke) continue;
    const ground = groundOf(e.parentElement || e);
    const label = (e.textContent.trim().slice(0, 28) || '<' + e.tagName.toLowerCase() + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + '>');
    if (ink)    out.push('INK    ' + ratio(cs.color, ground) + ':1  on ' + ground + '  "' + label + '"');
    if (fill)   out.push('FILL   ' + ratio(cs.backgroundColor, ground) + ':1  on ' + ground + '  "' + label + '"');
    if (stroke) out.push('STROKE ' + ratio(cs.borderTopColor, ground) + ':1  on ' + ground + '  "' + label + '"');
  }
  return out.length ? [...new Set(out)].join('\\n') : 'NO AMBER FOUND';
})()`;

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9561 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  const ids = JSON.parse(await b.eval('(async () => JSON.stringify((await import("/js/songs.mjs")).SONGS.map(s=>s.id)))()'));
  const songs = {}; ids.forEach((id, i) => { songs[id] = { plays: 3 + (i % 9), stars: i % 3, best: 55 + (i % 40) }; });
  const seed = { firstRunDone: true, diagnosticDone: true, days: [day(0), day(1), day(3)],
    pmin: { [day(0)]: 20, [day(1)]: 32, [day(3)]: 18 },
    lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 }, songs, lessons: {}, lib: { learning: true } };
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(seed))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 2400));
  console.log(await b.eval(PAGE));
} finally { await b.close(); }
