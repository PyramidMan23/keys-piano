// Why doesn't the press style land? Ask the page, don't reason about it.
import { launch } from './cdp.mjs';
const SEED = { firstRunDone: true, diagnosticDone: true, days: [], pmin: {}, songs: {}, lessons: {}, lib: { learning: true } };
const b = await launch({ width: 1600, height: 950, scale: 1, port: 9687 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1900));
  console.log(await b.eval(`(() => {
    const el = [...document.querySelectorAll('*')].find((e) => !e.children.length
      && e.textContent.trim() === 'Free play' && e.getBoundingClientRect().width > 0);
    if (!el) return 'control not found';
    const out = [];
    out.push('tag: ' + el.tagName + '  disabled: ' + !!el.disabled);
    out.push('inside .canon-root: ' + !!el.closest('.canon-root'));
    out.push('matches ".canon-root button:active": ' + el.matches('.canon-root button'));
    out.push('matches "button:not(:disabled)": ' + el.matches('button:not(:disabled)'));
    out.push('inline style has transform: ' + /transform/.test(el.getAttribute('style') || ''));
    // is our stylesheet even loaded, and is the rule in it?
    let found = 0, resetSeen = 0;
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch { continue; }
      for (const r of rules) {
        const t = r.cssText || '';
        if (/:active/.test(t) && /scale\\(0\\.97\\)/.test(t)) found++;
        if (/all: ?revert/.test(t)) resetSeen++;
      }
    }
    out.push('press rules present in CSSOM: ' + found + '   all:revert rules: ' + resetSeen);
    return out.join('\\n');
  })()`));
} finally { await b.close(); }
