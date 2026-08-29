// Mount the canon INTO the running app, behind a flag.
//
// apply-design strategy rung (d): a parallel canon renderer selected at the
// render boundary, with the old renderer left intact underneath, so a bad port
// is one flag away from being undone. Flag off and the app is byte-for-byte
// what it was.
//
// The one rule that makes this safe is Rule 3, paid for on Mailroom: NEVER
// merge two DOMs. Grafting design markup onto existing hooks there produced 21
// duplicate ids, and because getElementById returns the FIRST match, half the
// app's controls silently became unreachable. So here the old markup is not
// merged and not deleted: it is moved aside, hidden, and every id the canon
// also provides is STRIPPED from it first. After mounting, every shared id
// resolves to exactly one element, and it is the canon's.
//
// Turn on with ?canon=1.
import { CANON } from './canon-templates.mjs';
import { renderCanonScreen } from './canon-screen.mjs';

export const CANON_ON = (() => {
  try { return new URLSearchParams(location.search).get('canon') === '1' || window.__canon === true; }
  catch { return false; }
})();

const idsIn = (html) => new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

export function mountCanonScreens() {
  const mounted = [];
  for (const key of Object.keys(CANON)) {
    const host = document.getElementById(`screen-${key}`);
    if (!host) continue;               // overlays and states are artboards, not app screens

    // move the old markup aside before the canon overwrites the host
    const legacy = document.createElement('div');
    legacy.hidden = true;
    legacy.dataset.legacyScreen = key;
    while (host.firstChild) legacy.appendChild(host.firstChild);

    // and take the ids the canon is about to claim, so nothing resolves to a
    // hidden node. This is the whole defence against Rule 3.
    const claimed = idsIn(CANON[key]);
    let stripped = 0;
    const carried = new Map();
    for (const el of legacy.querySelectorAll('[id]')) {
      if (!claimed.has(el.id)) continue;
      // The artboards are inline-styled markup with no accessibility layer at
      // all: 12 aria attributes and 4 roles in the app, ZERO in the canon. The
      // port would have shipped a screen reader nothing to work with, and no
      // gate in this project could have seen it, because they all compare
      // pixels and ids. Carry the app's own semantics across before the id
      // goes, matched by that id.
      const keep = {};
      for (const a of el.attributes) {
        if (/^(aria-|role$|title$|lang$|type$|inputmode$|autocomplete$|placeholder$)/.test(a.name)) keep[a.name] = a.value;
      }
      if (Object.keys(keep).length) carried.set(el.id, keep);
      el.removeAttribute('id');
      stripped++;
    }

    renderCanonScreen(host, key);

    // apply the carried semantics onto the canon's own controls
    let a11y = 0;
    for (const [id, attrs] of carried) {
      const target = host.querySelector(`[id="${CSS.escape(id)}"]`);
      if (!target) continue;
      for (const [name, value] of Object.entries(attrs)) {
        // never override something the design deliberately set
        if (!target.hasAttribute(name)) { target.setAttribute(name, value); a11y++; }
      }
    }
    host.appendChild(legacy);          // after: renderCanonScreen replaces innerHTML
    const names = nameControls(host.firstElementChild);
    mounted.push({ key, claimed: claimed.size, stripped, a11y, named: names.named, unnamed: names.unnamed });
  }
  return mounted;
}

// A segmented control draws its SELECTED member inline, so the app cannot move
// the selection by setting data-on the way it does on its own markup. The
// design does show both appearances though - one member is on, its siblings are
// off - so harvest the two style attributes from the design's own sample and
// swap them. Same shape as the tier pips in canon-library.mjs: read the variant
// out of the canon, never re-implement it.
export function harvestVariants(members, isOn) {
  let on = null, off = null;
  for (const el of members) {
    const style = el.getAttribute('style');
    if (isOn(el)) { on ??= style; } else { off ??= style; }
  }
  return { on, off };
}

export function setVariant(el, on, variants) {
  const style = on ? variants.on : variants.off;
  if (style) el.setAttribute('style', style);
  el.dataset.on = String(!!on);
}

// ---- writing into a container the design nested a control inside -----------
//
// The canon puts #path-go inside #path-reason, #combo-flash inside #hud and
// #task-start inside #task-prompt. The app's renderers set textContent or
// innerHTML on the outer element, which deletes the inner one, and the very
// next line writes to a node that no longer exists. Under the old markup those
// containers held nothing but text, so this never happened, and no gate that
// checks ids AT STARTUP can see it: the id resolves fine right up until the
// screen is actually used.
//
// tools/canon-nesting.mjs now fails the build if a new collision appears.

// Set text without touching element children.
export function setTextKeeping(el, value) {
  if (!el) return;
  if (!el.children.length) { el.textContent = value; return; }
  const text = [...el.childNodes].find((n) => n.nodeType === 3 && n.data.trim());
  if (text) text.data = value;
  else el.insertBefore(document.createTextNode(value), el.firstChild);
}

// Replace a container's markup but keep the addressed controls the design put
// inside it. They go back at the end, which is not where the design drew them:
// this keeps the app WORKING under the flag, and the region is recorded as one
// the canon does not own yet.
export function setHTMLKeeping(el, html) {
  if (!el) return;
  const keep = [...el.querySelectorAll('[id]')];
  el.innerHTML = html;
  for (const node of keep) el.appendChild(node);
}

// ---- ids grafted at RUNTIME -------------------------------------------------
// mountCanonScreens strips the ids the canon carries in its markup. It cannot
// strip the ones the binders add afterwards: canon-library.mjs gives designed
// nodes #game-level, #rhythm-chip, #sec-learning, #next-action and friends once
// it has data. Those ids then existed twice - once on the canon, once on the
// hidden legacy node - and getElementById returns the FIRST, which is whichever
// the document order happens to favour.
//
// That is Rule 3 of the apply-design doctrine, and it is the exact bug that cost
// Mailroom a week: 21 duplicate ids, half the app's controls silently
// unreachable. A boot-time duplicate check said zero, because at boot the
// binders had not run yet.
//
// So: after every canon render, take the duplicates back off the legacy copy.
export function reclaimIds(host) {
  const legacy = host.querySelector(':scope > [data-legacy-screen]');
  if (!legacy) return 0;
  let taken = 0;
  for (const el of legacy.querySelectorAll('[id]')) {
    // does this id also exist OUTSIDE the legacy node?
    const other = [...host.querySelectorAll(`[id="${CSS.escape(el.id)}"]`)]
      .find((n) => n !== el && !legacy.contains(n));
    if (other) { el.removeAttribute('id'); taken++; }
  }
  return taken;
}

// ---- a control that survives a re-render ------------------------------------
// The search box is the one control a person is INSIDE while the screen
// re-renders: every keystroke calls renderLibrary, which remounts the canon and
// replaces the input. Measured: after typing "fur" the field read "" and had
// lost focus, three times over. Carry its state across the remount.
export function captureFocus(host) {
  const el = document.activeElement;
  if (!el || !host.contains(el) || !('value' in el)) return null;
  return { id: el.id, value: el.value, start: el.selectionStart, end: el.selectionEnd };
}

export function restoreFocus(host, snap) {
  if (!snap || !snap.id) return;
  const el = host.querySelector(`[id="${CSS.escape(snap.id)}"]`);
  if (!el || !('value' in el)) return;
  el.value = snap.value;
  el.focus();
  try { el.setSelectionRange(snap.start, snap.end); } catch { /* not all inputs support it */ }
}

// The app writes small rich strings ("Currently stored: <b>42ms</b>") into
// status slots. Under the canon the design owns emphasis, and an innerHTML
// assignment replaces the designed node with the app's markup. So inside the
// canon this sets TEXT, tags stripped; outside it behaves exactly as before.
export function setRichText(el, html) {
  if (!el) return;
  if (!CANON_ON || !el.closest('.canon-root') || el.closest('[data-legacy-screen]')) {
    el.innerHTML = html;
    return;
  }
  setTextKeeping(el, String(html).replace(/<[^>]*>/g, ''));
}

// ---- accessible names -------------------------------------------------------
// The artboards style a control and put its label BESIDE it, which reads fine
// and is invisible to a screen reader: "tempo", "wait for me", "note letters",
// the two metronome fields and a pair of icon-only buttons all reached the app
// with no accessible name at all.
//
// The name is not invented here. It is the design's own nearest label text,
// which is the same word a sighted person is reading off the screen. Anything
// that still cannot be named is reported by tools/canon-a11y.mjs rather than
// quietly left nameless.
const accessibleName = (el) =>
  (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || el.getAttribute('placeholder') || '').trim();

export function nameControls(root) {
  let named = 0;
  const unnamed = [];
  for (const el of root.querySelectorAll('button, a, input, select, textarea')) {
    if (accessibleName(el)) continue;
    // the label the design put next to it: nearest text within the control's
    // own row, preferring what comes before it
    let text = '';
    for (let box = el.parentElement, i = 0; box && i < 3 && !text; box = box.parentElement, i++) {
      const words = [...box.querySelectorAll('*')]
        .filter((n) => !n.children.length && n !== el && n.textContent.trim())
        .map((n) => n.textContent.trim());
      text = words.find((w) => w.length > 1 && w.length < 40) ?? '';
    }
    if (text) { el.setAttribute('aria-label', text); named++; } else unnamed.push(el.id || el.tagName.toLowerCase());
  }
  return { named, unnamed };
}
