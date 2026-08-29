// Build the clickable artifact from the Claude Design export.
//
// The point of this script: Mark clicks a link in chat and sees THE DESIGN,
// not my redrawing of it. So the artboards are LIFTED from the export markup
// verbatim (it is almost entirely inline styles, so it travels), the sleeves
// are inlined as data URIs so the page is self-contained, and nothing is
// re-implemented. The only things added are a wrapper, a heading per section,
// and anchor links. If this script ever starts "improving" the markup it has
// stopped doing its job.
//
// Run: node design-2026-08/build-artifact.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, 'claude-design-v5', 'Keys Library Directions.dc.html');
const OUT = join(HERE, 'keys-design.html');
const src = readFileSync(SRC, 'utf8');

// Pull one <div class="dv-opt" id="X"> block, brace-matched on div tags.
function artboard(id) {
  const start = src.indexOf(`<div class="dv-opt" id="${id}">`);
  if (start < 0) throw new Error(`artboard ${id} not found`);
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(src))) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return src.slice(start, m.index + m[0].length);
  }
  throw new Error(`artboard ${id} never closed`);
}

// Drop the canvas's own annotation row; keep the design itself untouched.
function stripLabel(block) {
  const i = block.indexOf('<div class="dv-olabel">');
  if (i < 0) return block;
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = i;
  let depth = 0, m;
  while ((m = re.exec(block))) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return block.slice(0, i) + block.slice(m.index + m[0].length);
  }
  return block;
}

// Self-contained: every sleeve becomes a data URI.
const inlined = new Map();
function inlineImages(block) {
  return block.replace(/src="uploads\/([^"]+)"/g, (_, name) => {
    if (!inlined.has(name)) {
      const bytes = readFileSync(join(HERE, 'claude-design-v5', 'uploads', name));
      inlined.set(name, `data:image/jpeg;base64,${bytes.toString('base64')}`);
    }
    return `src="${inlined.get(name)}"`;
  });
}

const prep = (id) => inlineImages(stripLabel(artboard(id)));

// The one open question, rendered both ways so Mark judges it by eye. Identical
// screens; 5b adds a small L*8 band around the recommendation and nothing else.
const main = prep('5a');       // everything pure black, no container anywhere
const grounds = prep('5b');    // same, plus a content-hugging band on the recommendation
// The states artboard (2b) is deliberately NOT included. It was drawn before the
// palette moved to true black, so showing it here would put half a page of stale
// colour next to the current design and read as an inconsistency in the design
// rather than in the export. It is still in the design file.

const page = `<title>Keys Main Screen</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap">
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #000000; color: #e9ede7;
         font: 15px/1.55 ui-sans-serif, system-ui, "Segoe UI", sans-serif; }
  .wrap { max-width: 1180px; margin: 0 auto; padding: 28px 20px 80px; }
  h1 { font: 700 26px/1.15 inherit; margin: 0 0 6px; letter-spacing: -.015em; text-wrap: balance; }
  a:focus-visible, .jump a:focus-visible { outline: 2px solid #82bf9c; outline-offset: 3px; }
  /* deliberately single-theme: the app itself is dark only by decision
     (style.css declares color-scheme: dark), so a light rendering of this
     page would misrepresent the thing being reviewed. Ground and ink are
     painted explicitly so the page never borrows the host's theme. */
  .lede { color: #93a89c; margin: 0 0 4px; max-width: 62ch; }
  .jump { display: flex; gap: 8px; flex-wrap: wrap; margin: 18px 0 30px; }
  .jump a { color: #cfe6d8; text-decoration: none; border: 1px solid #253129; background: #1a221c;
            border-radius: 8px; min-height: 44px; padding: 0 16px; line-height: 42px; font-weight: 600; font-size: 14px; }
  h2 { font: 700 18px/1.2 inherit; margin: 44px 0 4px; padding-top: 8px; }
  h2 .n { color: #82bf9c; font-family: ui-monospace, Consolas, monospace; margin-right: 9px; }
  .note { color: #93a89c; font-size: 13.5px; margin: 0 0 16px; max-width: 70ch; }
  .board { overflow-x: auto; padding-bottom: 6px; }
  hr { border: 0; border-top: 1px solid #253129; margin: 42px 0 0; }
</style>

<div class="wrap">
  <h1>Keys, main screen</h1>
  <p class="lede">You were right: the last version was 67.5 percent grey-green, measured. This is the
    same screen twice, now genuinely black. The only difference between A and B is whether the
    suggestion at the top sits in a faint box. Everything else is identical.</p>

  <div class="jump">
    <a href="#screen">A. Everything black</a>
    <a href="#ground">B. One box around the suggestion</a>
  </div>

  <h2 id="screen"><span class="n">A</span>Everything black</h2>
  <p class="note">Pure black everywhere. No panels, no filled surfaces. The only things that are not
    black are the album art, one green button, and hairlines. The suggestion at the top has no box, so
    it has to hold together on its own.</p>
  <div class="board">${main}</div>

  <hr>

  <h2 id="ground"><span class="n">B</span>Everything black, except one box</h2>
  <p class="note">Exactly the same screen, except the suggestion sits in a faint box, barely lighter
    than black, hugging just its own content. Codex argued this is needed so the suggestion reads as ONE
    thing rather than three separate bright objects. I argued it is not. You decide.</p>
  <p class="note">The test, in Codex's words: can you tell the suggestion is a single block in under a
    second, before you read any of it? If A passes that, A wins, because it is what you asked for.</p>
  <div class="board">${grounds}</div>

</div>
`;

writeFileSync(OUT, page);
console.log(`wrote ${OUT}`);
console.log(`  ${(page.length / 1024).toFixed(0)} KB, ${inlined.size} sleeves inlined`);
console.log(`  remote refs left: ${(page.match(/src="(?!data:)[^"]*"/g) || []).length}`);
console.log(`  em dashes: ${(page.match(/—/g) || []).length}`);
