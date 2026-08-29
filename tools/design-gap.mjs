// apply-design Rule 1: count CONTROLS before commissioning a design, not screens.
// Mailroom's design covered 13 beautiful screens and ~40% of the app's controls,
// and the gap did not surface until the port had already failed twice.
//
// This takes the GENERATED control inventory and marks each control against what
// Claude Design has actually drawn so far, so the commission is a fact rather
// than a guess. HOMED is asserted per control id by hand ONCE here, but the LIST
// it is checked against is generated, so a new control can never slip in unnoticed.
//
// Run: node tools/design-gap.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const inv = JSON.parse(readFileSync(join(ROOT, 'design-2026-08', 'control-inventory.json'), 'utf8'));

// Surfaces Claude Design has actually produced, with the artboard that holds them.
const DRAWN = {
  '5b': 'library: rail, tabs, recommendation strip, ledger rows, quests, practice chart, path, form check',
  '2b': 'library states: empty library, search results with section tags, no MIDI',
};

// Every library + chrome control, marked against those artboards. Anything not
// listed here is reported as UNDRAWN by the checker below.
const HOMED = new Set([
  // rail and status
  'lib-search', 'game-level', 'rhythm-chip', 'midi-status', 'now-playing', 'btn-home',
  // the recommendation strip
  'next-action', 'next-action-cover', 'next-action-label', 'next-action-reason', 'freeze-offer',
  // shelves, now tabs
  'learn-count', 'list-fame', 'list-results', 'sec-results', 'explore-sort',
  // the dock: every tool button has a home, either surfaced or in the All tools drawer
  'btn-path', 'btn-lessons', 'btn-sight', 'btn-rhythm', 'btn-echo', 'btn-improv',
  'btn-keys12', 'btn-freeplay', 'btn-metronome', 'btn-trophies', 'btn-takes',
  'btn-voice', 'btn-calibrate', 'btn-touch',
  'sess-quick', 'sess-improve', 'sess-skill',
  // the blocks below the fold
  'quest-row', 'weekly-row', 'practice-chart', 'path-teaser',
  'form-card', 'form-checks', 'form-done', 'form-snooze',
  // The ten Codex found that the first scanner missed, because the JS reaches
  // them through array loops and string concatenation rather than by name.
  // The four shelves became the four TABS, their lists became the tab content,
  // and the three rail groups became the dock's sections.
  'sec-learning', 'sec-repertoire', 'sec-fame', 'sec-explore',
  'list-learning', 'list-repertoire', 'list-explore',
  'rail-learn', 'rail-practise', 'rail-tools',
]);

const LIBRARY_AND_CHROME = ['library', '(outside a screen)'];
const undrawnControls = [];
const undrawnScreens = [];

for (const [screen, list] of Object.entries(inv.screens)) {
  if (screen === '(NOT IN MARKUP - built by JS)') continue;
  if (LIBRARY_AND_CHROME.includes(screen)) {
    for (const r of list) if (!HOMED.has(r.id)) undrawnControls.push({ ...r, screen });
  } else {
    undrawnScreens.push({ screen, controls: list.length, ids: list.map((r) => r.id) });
  }
}

undrawnScreens.sort((a, b) => b.controls - a.controls);
const total = Object.values(inv.screens).flat().length;
const undrawnCount = undrawnControls.length + undrawnScreens.reduce((a, s) => a + s.controls, 0);

console.log(`Claude Design has drawn: ${Object.entries(DRAWN).map(([k, v]) => k).join(', ')}`);
console.log(`Controls the JS addresses, total: ${total}`);
console.log(`Controls WITH a designed home: ${total - undrawnCount}  (${Math.round(100 * (total - undrawnCount) / total)}%)`);
console.log(`Controls with NO design at all: ${undrawnCount}  (${Math.round(100 * undrawnCount / total)}%)\n`);

console.log(`UNDRAWN, on surfaces the design does cover (${undrawnControls.length}):`);
const byGroup = {};
for (const c of undrawnControls) {
  const g = c.id.startsWith('results') ? 'the end-of-song RESULTS panel'
    : c.id.startsWith('theory') ? 'the THEORY card'
    : c.id.startsWith('firstrun') ? 'the FIRST RUN prompt'
    : c.id.startsWith('screen-') ? '(a screen container, not a control)'
    : 'other';
  (byGroup[g] ??= []).push(c);
}
for (const [g, list] of Object.entries(byGroup)) {
  console.log(`  ${g}  (${list.length})`);
  for (const c of list) console.log(`     ${c.id.padEnd(22)} <${c.tag}>`);
}

console.log(`\nUNDRAWN SCREENS (${undrawnScreens.length}):`);
for (const s of undrawnScreens) console.log(`  ${s.screen.padEnd(14)} ${String(s.controls).padStart(3)} controls   ${s.ids.slice(0, 6).join(' ')}${s.ids.length > 6 ? ' ...' : ''}`);

writeFileSync(join(ROOT, 'design-2026-08', 'design-gap.json'),
  JSON.stringify({ drawn: DRAWN, undrawnControls, undrawnScreens, total, undrawnCount }, null, 2));
console.log('\nwrote design-2026-08/design-gap.json');
