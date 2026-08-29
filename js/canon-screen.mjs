// Render ANY canon screen, generically.
//
// The canon is markup, not components: every screen is the design's own DOM,
// and the only thing this file does is mount it in the typography it was
// designed in and bind the artwork the builder stripped out. It writes no
// colour, size, radius or spacing, and it must stay that way - the moment a
// renderer starts deciding how something looks, the port has become a
// re-implementation and the drift is back.
//
// Per-screen DATA binding lives in its own module (canon-library.mjs and
// friends); this is the part every screen shares.
import { CANON, CANON_INHERITED } from './canon-templates.mjs';
import { sleeveUrlByGroup } from './covers.mjs';
import { nameControls, bindBack } from './canon-mount.mjs';

export const CANON_SCREENS = Object.keys(CANON);

// The canon's card declares no font of its own; it INHERITS from the page it
// was designed on. Mount it in a default 16px/normal document and every line
// box grows a fraction, which reads as a uniform half-pixel offset down the
// entire screen and 5% of the pixels differing for no visible reason.
export function applyInherited(host, screen) {
  // The isolation hook. style.css lives in the `app` cascade layer and one
  // unlayered rule rolls that layer back inside .canon-root, so the app's own
  // stylesheet cannot restyle the design it is hosting.
  host.classList.add('canon-root');
  const inh = CANON_INHERITED[screen];
  if (!inh) return;
  host.style.fontFamily = inh.fontFamily;
  host.style.fontSize = inh.fontSize;
  host.style.lineHeight = inh.lineHeight;
  host.style.fontWeight = inh.fontWeight;
  host.style.color = inh.color;
}

// The builder replaced each inlined sleeve with the group it resolved to by
// content hash. Bind the real file at the size the design actually draws it.
export function bindArt(root) {
  let bound = 0, missing = 0;
  for (const img of root.querySelectorAll('img[data-art]')) {
    const group = img.getAttribute('data-art');
    const w = img.getBoundingClientRect().width || parseFloat(img.style.width) || 128;
    const url = group ? sleeveUrlByGroup(group, w) : null;
    if (url) { img.src = url; img.alt = ''; bound++; } else { missing++; }
    img.removeAttribute('data-art');
  }
  return { bound, missing };
}

// Put the canon into the host WITHOUT destroying the hidden legacy markup
// canon-mount.mjs parked there. A plain innerHTML assignment on the second
// render would delete it, and with it the 67 ids the canon has no home for, so
// the app would boot fine and die on its first re-render. Renders happen far
// more often than mounts, which is exactly why that bug would have been found
// late.
export function mountMarkup(host, html) {
  const legacy = host.querySelector(':scope > [data-legacy-screen]');
  for (const child of [...host.children]) if (child !== legacy) child.remove();
  host.insertAdjacentHTML('afterbegin', html);
  return host.firstElementChild;
}

export function renderCanonScreen(host, screen) {
  if (!CANON[screen]) throw new Error(`no canon for screen ${screen}`);
  applyInherited(host, screen);
  const root = mountMarkup(host, CANON[screen]);
  bindArt(root);
  nameControls(root);
  bindBack(root);      // every artboard draws its own way back; nothing bound them
  return root;
}
