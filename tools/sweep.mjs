// Capture every screen AND run a whole-page contrast sweep on each.
// Mark's standing rule: any design work gets a contrast finishing pass, in the
// real rendered output, not in the spec. apply-design Rule 5: LOOK at it.
import { launch } from './cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'design-2026-08', 'proto-shots');
mkdirSync(SHOTS, { recursive: true });

const b = await launch({ width: 820, height: 1500, scale: 1, port: 9381 });
const report = [];
try {
  await b.goto('http://localhost:4180/design-2026-08/keys-prototype.html');
  const keys = await b.eval(`[...document.querySelectorAll('.pane')].map(p => p.dataset.screen)`);
  for (const key of keys) {
    await b.eval(`document.querySelector('.chip[data-go="${key}"]').click(); true`);
    await new Promise((r) => setTimeout(r, 320));

    // contrast of every text node against the surface actually behind it,
    // resolving through transparent ancestors the way a person's eye does
    const bad = await b.eval(`(() => {
      const lin = v => { v /= 255; return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
      const lum = c => { const m = c.match(/[\\d.]+/g); if (!m) return null;
        if (m.length > 3 && parseFloat(m[3]) === 0) return null;
        return 0.2126*lin(+m[0]) + 0.7152*lin(+m[1]) + 0.0722*lin(+m[2]); };
      const ratio = (f, b) => { const x = lum(f), y = lum(b); if (x === null || y === null) return null;
        const hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); };
      const p = document.querySelector('.pane.on');
      const out = [];
      for (const e of p.querySelectorAll('*')) {
        if (e.children.length) continue;
        const t = (e.textContent || '').trim();
        if (!t) continue;
        const cs = getComputedStyle(e);
        if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
        const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400;
        let s = e, bg = 'rgba(0, 0, 0, 0)';
        while (s && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) { bg = getComputedStyle(s).backgroundColor; s = s.parentElement; }
        const r = ratio(cs.color, bg);
        if (r === null) continue;
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        const need = large ? 3 : 4.5;
        if (r < need) out.push({ t: t.slice(0, 28), r: +r.toFixed(2), need, size, weight, fg: cs.color, bg });
      }
      return out;
    })()`);

    const png = await b.shot();
    writeFileSync(join(SHOTS, `${key}.png`), png);
    report.push({ key, fails: bad.length, worst: bad.slice(0, 3) });
    console.log(`${key.padEnd(12)} ${bad.length === 0 ? 'contrast clean' : bad.length + ' BELOW AA'}${bad.length ? '  e.g. ' + bad.slice(0, 2).map(x => `"${x.t}" ${x.r}:1`).join(', ') : ''}`);
  }
} finally { await b.close(); }

const total = report.reduce((a, r) => a + r.fails, 0);
// report.length, never a hardcoded number: the literal "17" survived the
// eighteenth screen being added and would have reported a stale pass forever.
console.log('\n' + (total === 0
  ? 'ALL ' + report.length + ' SCREENS PASS AA'
  : total + ' text nodes below AA across the app'));
writeFileSync(join(ROOT, 'design-2026-08', 'contrast-report.json'), JSON.stringify(report, null, 2));
