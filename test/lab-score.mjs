// The smallest offline thing that fails if LabScore's page logic breaks.
//
// The drawing itself is proved in a browser by tools/lab-score-probe.mjs, which
// measures the rendered SVG. What can be checked without a DOM is the part that
// decides WHAT gets drawn, and one piece of that is a trap with a real exercise
// behind it: parseRhythm gives both triplets in `8 8 8 q 8 8 8` the id "0:0",
// so grouping tuplets by id would print one six-note bracket over a bar that
// has two triplets in it. Node only, no DOM, no fixtures.
import assert from 'node:assert/strict';
import { LAB_CARDS, exercise } from '../js/learning-lab.mjs';

// vexflow's UMD wrapper hands itself to module.exports under Node and to
// globalThis in a browser; lab-score.mjs reads the browser one, so bridge it
// before importing. This is the only reason these are dynamic imports.
globalThis.Vex ??= (await import('../vendor/vexflow-4.2.5.js')).default;
const { tupletGroups, validateSpec, specOf } = await import('../js/lab-score.mjs');

let n = 0;
const ok = (msg) => console.log(`  ok ${++n}. ${msg}`);

// every authored exercise, the same walk the probe does
const all = [];
const seen = new Set();
(function walk(o, d = 0) {
  if (!o || typeof o !== 'object' || d > 10 || seen.has(o)) return;
  seen.add(o);
  if (o.targets && o.render && o.voices) { all.push(o); return; }
  for (const v of Object.values(o)) walk(v, d + 1);
})(LAB_CARDS);
assert.ok(all.length > 100, `found only ${all.length} exercises`);

// --- the tuplet id collision ------------------------------------------------
{
  const items = (cells) => cells.map((cell) => ({ cell, note: cell }));
  const t = (id) => ({ base: '8', n: 3, of: 2, id });
  // the shape rh-tri-i actually authors, ids and all
  const bar = items([
    { tuplet: t('0:0') }, { tuplet: t('0:0') }, { tuplet: t('0:0') },
    { tuplet: null },
    { tuplet: t('0:0') }, { tuplet: t('0:0') }, { tuplet: t('0:0') },
    { tuplet: null },
  ]);
  const groups = tupletGroups(bar);
  assert.equal(groups.length, 2, 'two triplets separated by a quarter are two brackets');
  assert.deepEqual(groups.map((g) => g.items.length), [3, 3]);
  assert.notEqual(groups[0].items[0], groups[1].items[0]);

  // six in a row, one id: still two brackets, because a triplet is three notes
  const six = tupletGroups(items(Array.from({ length: 6 }, () => ({ tuplet: t('0:0') }))));
  assert.deepEqual(six.map((g) => g.items.length), [3, 3], 'a run of six splits into two triplets');

  // and when the author gives them unique ids, the answer does not change
  const fixed = tupletGroups(items([
    { tuplet: t('0:0') }, { tuplet: t('0:0') }, { tuplet: t('0:0') },
    { tuplet: t('0:1') }, { tuplet: t('0:1') }, { tuplet: t('0:1') },
  ]));
  assert.deepEqual(fixed.map((g) => g.items.length), [3, 3], 'unique ids group the same way');
  assert.equal(tupletGroups(items([{ tuplet: null }, { tuplet: null }])).length, 0);
  ok('tuplet groups come from contiguity, so colliding ids cannot merge two triplets');
}

// --- the real exercises, against the real contract --------------------------
{
  for (const ex of all) validateSpec(ex.render);
  const tuplets = all.filter((ex) => ex.render.staves.some((s) => s.bars.some((b) => b.cells.some((c) => c.tuplet))));
  assert.ok(tuplets.length, 'no authored exercise carries a tuplet any more: this test is stale');
  for (const ex of tuplets) {
    for (const st of ex.render.staves) for (const bar of st.bars) {
      const groups = tupletGroups(bar.cells.map((cell) => ({ cell, note: cell })));
      for (const g of groups) assert.equal(g.items.length, 3, `${ex.id} bar ${bar.index + 1}: a triplet of ${g.items.length}`);
    }
  }
  ok(`all ${all.length} authored render specs are valid, and every tuplet group is a real triplet`);
}

// --- what build() accepts, and what it must refuse --------------------------
{
  const ex = all[0];
  assert.equal(specOf(ex), ex.render, 'an exercise offers its own page');
  assert.equal(specOf(ex.render), ex.render, 'a page is already a page');
  assert.equal(specOf({ nope: true }), null);
  assert.equal(specOf(null), null);

  // a rest carries a placeholder key and NO accidentals, by renderSpec's own
  // construction: refusing that would refuse every exercise with a rest in it
  const rest = exercise({ id: 'test-rest', pattern: 'q qr h', notes: ['C4', 'E4'] });
  validateSpec(rest.render);
  assert.ok(rest.render.staves[0].bars[0].cells.some((c) => c.rest && c.accidentals.length === 0));

  const broken = structuredClone(ex.render);
  broken.staves[0].bars[0].cells[0].accidentals = [];
  broken.staves[0].bars[0].cells[0].rest = false;
  assert.throws(() => validateSpec(broken), /keys but 0 accidentals/);
  assert.throws(() => validateSpec({ staves: [], meter: [4, 4] }), /no staves/);
  assert.throws(() => validateSpec(null), /no render spec/);
  ok('a sounding cell without its accidentals is refused; a rest without them is not');
}

console.log(`\n${n} lab-score checks passed`);
