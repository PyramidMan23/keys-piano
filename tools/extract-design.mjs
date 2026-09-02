// apply-design Phase 1: extract the canon to COMMITTED SOURCE.
//
// "Commit this. It is source, authored by nobody. From here every value you
// write is read out of it, never inferred." The whole point is that no number
// in the port is ever typed from memory or eyeballed off a screenshot.
//
// For each artboard this writes design/extracted/<screen>.html containing the
// live DOM with every element's exact inline style plus a data-box="WxH" of its
// measured rect, and design/extracted/<screen>.json with a flat list of every
// text-bearing node, its box, and the styles the contract will compare.
//
// Run: node tools/extract-design.mjs
import { launch } from './cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

// ☠️ CLAUDE DESIGN'S OWN BINDING TOKENS ARE NOT MARKUP. The prototype carries
// onChange="{{ noop }}" and checked="{{ boxOn }}" / "{{ boxOff }}" - template
// placeholders the design tool would have filled. Left as-is they ship, and a
// browser reads onchange="{{ noop }}" as an inline handler whose body is the
// identifier noop: every toggle of "Wait for me" threw ReferenceError, 165 times
// in the journal. And any non-empty checked= attribute means CHECKED, so a box
// the design shows "off" rendered ticked. Resolve them here, at the source,
// and refuse anything that still looks like a token.
export function resolveDesignBindings(html) {
  const out = html
    .replace(/\s*on[a-z]+="\{\{\s*noop\s*\}\}"/gi, '')
    .replace(/\s*checked="\{\{\s*boxOn\s*\}\}"/gi, ' checked')
    .replace(/\s*checked="\{\{\s*boxOff\s*\}\}"/gi, '');
  const left = out.match(/\{\{[^}]*\}\}/g);
  if (left) throw new Error('unresolved design bindings: ' + [...new Set(left)].join(', '));
  return out;
}
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'design', 'extracted');
mkdirSync(OUT, { recursive: true });

// 1700 wide, not 900: the desktop frames 7a and 7b are 1418px, and a 900px
// viewport would let the prototype fit-zoom them or clip them, so every
// geometry extracted from them would be wrong.
const b = await launch({ width: 1700, height: 1600, scale: 1, port: 9451 });
try {
  // ?raw=1 stands the prototype's scaffolding down. Without it the extraction
  // captures the deck animation's own DOM edits as canon, and play.html came
  // out with the resting deck baked to display:none.
  await b.goto('http://localhost:4180/design-2026-08/keys-prototype.html?raw=1');
  await b.freezeMotion();
  const screens = await b.eval(`[...document.querySelectorAll('.pane')].map(p => p.dataset.screen)`);

  for (const key of screens) {
    await b.eval(`document.querySelector('.chip[data-go="${key}"]').click(); true`);
    await new Promise((r) => setTimeout(r, 260));

    const data = await b.eval(`(() => {
      const p = document.querySelector('.pane.on');
      // Claude Design exports each artboard inside a .dv-opt wrapper carrying
      // the ARTBOARD ID ("5b") as an element id. Neither is styled by anything -
      // they are export scaffolding - and shipping them puts a design-tool id
      // into the product and leaves the real card with no width, so it stretched
      // to the viewport the moment the app mounted it. Root at the card.
      const card = p.querySelector('.dv-card') ?? p.firstElementChild;

      // stamp each element with its measured box so the html dump carries
      // geometry, not just style
      let n = 0;
      for (const e of card.querySelectorAll('*')) {
        const r = e.getBoundingClientRect();
        e.setAttribute('data-box', Math.round(r.width) + 'x' + Math.round(r.height));
        e.setAttribute('data-dx', String(n++));
      }

      // the flat node list the contract compares
      const nodes = [];
      for (const e of card.querySelectorAll('*')) {
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        const cardR = card.getBoundingClientRect();
        const t = (e.textContent || '').trim();
        const own = e.children.length === 0 ? t : '';
        // "the component for a text is the SMALLEST element that PAINTS a
        // surface" - recorded here so the contract can resolve the same way
        const paints = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0;
        nodes.push({
          dx: +e.getAttribute('data-dx'),
          tag: e.tagName.toLowerCase(),
          id: e.id || null,
          text: own.slice(0, 60),
          paints,
          x: Math.round(r.x - cardR.x), y: Math.round(r.y - cardR.y),
          w: Math.round(r.width), h: Math.round(r.height),
          font: cs.font,
          fontSize: Math.round(parseFloat(cs.fontSize) * 10) / 10,
          fontWeight: cs.fontWeight,
          fontFamily: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
          color: cs.color,
          background: cs.backgroundColor,
          backgroundImage: cs.backgroundImage === 'none' ? null : cs.backgroundImage,
          border: cs.borderTopWidth === '0px' ? null : cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor,
          radius: cs.borderRadius,
          letterSpacing: cs.letterSpacing,
          padding: cs.paddingTop + ' ' + cs.paddingRight + ' ' + cs.paddingBottom + ' ' + cs.paddingLeft,
          children: e.children.length,
        });
      }
      // The canon's card declares NO font of its own: it inherits 14px/21px
      // from the prototype page. Render it inside a default 16px/normal
      // document and every box grows, which is what put a uniform half-pixel
      // through the whole first overlay. The inherited context is part of the
      // canon, so it gets extracted as source rather than assumed by whoever
      // mounts it.
      const pcs = getComputedStyle(card.parentElement);
      // box-sizing is NOT inherited, but the canon was authored under a global
      // border-box reset and every width in it assumes one. Record what the
      // design actually computes so the port restores the same baseline instead
      // of a value someone remembered.
      const inherited = { fontFamily: pcs.fontFamily, fontSize: pcs.fontSize,
                          lineHeight: pcs.lineHeight, fontWeight: pcs.fontWeight, color: pcs.color,
                          boxSizing: getComputedStyle(card).boxSizing };

      return { html: card.outerHTML, nodes, inherited,
               box: { w: Math.round(card.getBoundingClientRect().width), h: Math.round(card.getBoundingClientRect().height) } };
    })()`);

    writeFileSync(join(OUT, `${key}.html`), resolveDesignBindings(data.html));
    writeFileSync(join(OUT, `${key}.json`), JSON.stringify({ screen: key, box: data.box, inherited: data.inherited, nodes: data.nodes }, null, 1));
    const painted = data.nodes.filter((n) => n.paints).length;
    const texts = data.nodes.filter((n) => n.text).length;
    console.log(`${key.padEnd(12)} ${String(data.nodes.length).padStart(4)} nodes  ${String(texts).padStart(3)} text  ${String(painted).padStart(3)} painted  ${data.box.w}x${data.box.h}`);
  }
  console.log(`\nwrote design/extracted/ for ${screens.length} screens. This is now SOURCE: read values out of it, never infer them.`);
} finally { await b.close(); }
