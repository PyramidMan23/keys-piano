// EVERY AUTHORED LAB EXERCISE, ENGRAVED AND MEASURED (2026-09-13).
//
// The learning lab authors its exercises as WRITTEN notation. The generic
// ScoreView takes the exercise's MIDI `song` instead and re-derives the
// spelling, which turns an authored Bb into an A#. js/lab-score.mjs renders the
// authored page. This proves it, at the OUTPUT: it opens the real app on the
// real origin, builds every exercise into a real host, and MEASURES the SVG.
//
// What it asserts, per exercise:
//   · build() succeeds, with no console error and no thrown exception
//   · the page has non-zero geometry and the note heads are dark ink on cream
//   · EVERY note head sits on the staff position its AUTHORED spelling demands,
//     computed here from first principles (letter + octave -> staff line), so a
//     renderer that re-spelt from MIDI would be caught by the y alone
//   · the authored accidental glyphs are three disjoint shapes (flat, sharp,
//     natural) and no note wearing one is wearing another's
//   · separate triplet groups get separate brackets (the ids collide)
//   · ties and slurs are drawn, and are distinguishable from each other
//   · authored rests, dynamics, staccato, pedal and text marks are on the page
// Plus: 6/8 rests, the canon reset, an invalid spec, and phone overflow.
//
// Run:  node tools/lab-score-probe.mjs            (serves itself on :4193)
//       KEYS_TEST_ORIGIN=http://localhost:4193 node tools/lab-score-probe.mjs
import { launch } from './cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = process.env.KEYS_TEST_ORIGIN ?? 'http://localhost:4193';
const SHOTS = join(process.cwd(), 'reports', 'lab-score');
mkdirSync(SHOTS, { recursive: true });

const results = [];
const ok = (name, pass, note = '') => {
  results.push({ name, pass });
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (note ? '  ' + note : ''));
};

// The pieces the page needs, sent in once and reused for every exercise.
const SETUP = `(async () => {
  const lab = await import('/js/learning-lab.mjs');
  const mod = await import('/js/lab-score.mjs');

  // ---- every authored exercise, found by walking the cards -----------------
  const list = [], seen = new Set();
  const walk = (o, d = 0) => {
    if (!o || typeof o !== 'object' || d > 10 || seen.has(o)) return;
    seen.add(o);
    if (o.targets && o.render && o.voices) { list.push(o); return; }
    for (const v of Object.values(o)) walk(v, d + 1);
  };
  walk(lab.LAB_CARDS);
  // the position drills are generated per day, not authored in the tree
  const taken = [];
  for (const kind of ['position-right', 'position-left']) {
    for (let i = 0; i < 60; i++) {
      const ex = lab.positionVariant(kind, kind + ':' + i, taken);
      if (!ex) break;
      taken.push(ex.contentId);
      list.push(ex);
    }
  }
  // 6/8 with rests is a shape the curriculum does not author yet, so the
  // renderer is proved against one built here from the same authoring front
  // door. Labelled synthetic in the report; never shipped to a learner.
  const synthetic = [
    lab.exercise({ id: 'syn-68-rests', meter: [6, 8], bpm: 60, name: '6/8 with rests',
      pattern: '8 8r 8 8 8r 8 | 8 8 8 8d 16 8r',
      notes: ['C4', 'E4', 'G4', 'E4', 'G4', 'A4', 'B4', 'C5', 'B4'] }),
    lab.exercise({ id: 'syn-34-rests', meter: [3, 4], bpm: 60, name: '3/4 rests and dots',
      pattern: 'qr q q | qd 8 qr', notes: ['D4', 'F4', 'A4', 'G4'] }),
  ];
  for (const ex of synthetic) { ex.__synthetic = true; list.push(ex); }

  // ---- hosts: the real class, plus one inside a canon board ---------------
  const wrap = document.createElement('div');
  wrap.id = 'labscore-probe';
  Object.assign(wrap.style, { position: 'fixed', left: '0', top: '0', right: '0',
    zIndex: '99999', background: '#0b0f0d', padding: '10px 10px 4px' });
  const host = document.createElement('div');
  host.id = 'labscore-host';
  host.className = 'lesson-stave';      // the real class, overflow:hidden and all
  wrap.append(host);
  const canonBoard = document.createElement('div');
  canonBoard.className = 'canon-root';
  const canonHost = document.createElement('div');
  canonHost.className = 'lesson-stave';
  canonBoard.append(canonHost);
  wrap.append(canonBoard);
  document.body.append(wrap);

  const score = new mod.LabScore(host);

  // ---- staff position from first principles, not from VexFlow -------------
  const LETTERS = 'cdefgab';
  const dia = (key) => {
    const [name, oct] = String(key).split('/');
    return Number(oct) * 7 + LETTERS.indexOf(name[0].toLowerCase());
  };
  const TOP = { treble: dia('f/5'), bass: dia('a/3') };   // top line of each clef
  const HALF_SPACE = 5;
  // ☠️ THE TOP LINE IS MEASURED OFF THE DRAWN STAFF, never assumed from the y
  // the renderer was given: VexFlow reserves four line-spaces above the top
  // line, and assuming otherwise made every note read 40px wrong.
  const topLines = (svg, nStaves) => {
    const staves = [...svg.querySelectorAll('.vf-stave')].slice(0, nStaves);
    return staves.map((g) => {
      const ys = [...g.querySelectorAll('path')]
        .map((p) => p.getBBox())
        .filter((b) => b.height <= 2.5 && b.width > 40)
        .map((b) => b.y + b.height / 2)
        .sort((a, b) => a - b);
      return ys.length >= 5 ? ys[0] : null;
    });
  };

  // ☠️ MEASURED, NOT ASSUMED: in VexFlow 4.2 the head glyph is the FIRST path
  // in a .vf-notehead group and every modifier glyph (accidental, staccato dot,
  // augmentation dot) is drawn into that same group after it. The stem and the
  // ledger lines are siblings of the group, not children. Taking the group's
  // box read a head plus a 33px stem and put every note 22px off its line.
  const glyphPath = (head) => head.querySelector(':scope > path');
  const modPaths = (el) => [...el.querySelectorAll('.vf-notehead')]
    .flatMap((h) => [...h.querySelectorAll(':scope > path')].slice(1))
    .map((p) => p.getAttribute('d')).filter(Boolean);
  const glyphs = { plain: new Set(), acc: { b: new Set(), '#': new Set(), n: new Set() }, stac: new Set() };

  // Which notes should carry a staccato dot, worked out here from the marks
  // rather than asked of the renderer.
  const staccatoBeats = (spec) => {
    const out = [];
    for (const m of spec.marks ?? []) {
      if (m.kind !== 'articulation' || m.value !== 'staccato') continue;
      out.push([m.from ?? m.at ?? 0, m.to ?? m.at ?? 0]);
    }
    return out;
  };
  // Separate triplet brackets, counted independently: a run of adjacent tuplet
  // cells, cut in threes.
  const expectedTuplets = (spec) => {
    let n = 0;
    for (const st of spec.staves) for (const bar of st.bars) {
      let run = 0;
      for (const c of bar.cells) {
        if (c.tuplet) run++;
        else { n += Math.ceil(run / 3); run = 0; }
      }
      n += Math.ceil(run / 3);
    }
    return n;
  };
  const expectedTies = (spec) => {
    let n = 0;
    for (const st of spec.staves) {
      let pending = false;
      for (const bar of st.bars) for (const c of bar.cells) {
        if ((c.tie === 'stop' || c.tie === 'both') && pending) n++;
        pending = c.tie === 'start' || c.tie === 'both';
      }
    }
    return n;
  };

  function measure(ex, target = score) {
    const spec = ex.render ?? ex;
    const built = target.build(ex);
    const out = { id: ex.id ?? spec.id, ok: built, error: target.error,
      warnings: target.warnings.slice(), synthetic: !!ex.__synthetic };
    if (!built) return out;
    const svg = target.svg;
    out.w = svg.getBoundingClientRect().width;
    out.h = svg.getBoundingClientRect().height;
    out.hostBg = getComputedStyle(target.host).backgroundColor;
    out.overflowX = getComputedStyle(target.host).overflowX;

    const noteEls = [...svg.querySelectorAll('.vf-stavenote')];
    const tops = topLines(svg, spec.staves.length);
    out.topLines = tops;
    out.noteEls = noteEls.length;
    out.cells = spec.staves.reduce((a, s) => a + s.bars.reduce((b, r) => b + r.cells.length, 0), 0);

    // every note head: real size, right staff position, ink not blank
    let heads = 0, minW = 1e9, minH = 1e9, worstY = 0, worstWhere = '', compared = 0, sounding = 0;
    const fills = new Set();
    const stacSpans = staccatoBeats(spec);
    for (const el of noteEls) {
      const si = Number(el.dataset.stave);
      const clef = spec.staves[si].clef;
      const at = Number(el.dataset.beat);
      const cellKeys = [];
      for (const bar of spec.staves[si].bars) for (const c of bar.cells) {
        if (Math.abs(c.at - at) < 1e-6 && !c.rest) cellKeys.push(...c.keys);
      }
      const hs = [...el.querySelectorAll('.vf-notehead')];
      const isRest = el.dataset.rest === '1';
      if (!isRest) {
        if (hs.length !== cellKeys.length) { out.headMismatch = (out.headMismatch ?? 0) + 1; }
        const want = cellKeys.map((k) => tops[si] + (TOP[clef] - dia(k)) * HALF_SPACE).sort((a, b) => a - b);
        const got = hs.map((h) => { const p = glyphPath(h); if (!p) return NaN; const b = p.getBBox(); return b.y + b.height / 2; })
          .filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
        if (got.length !== hs.length) out.noGlyph = (out.noGlyph ?? 0) + 1;
        sounding += hs.length;
        for (let i = 0; i < Math.min(want.length, got.length); i++) {
          compared++;
          const d = Math.abs(want[i] - got[i]);
          if (d > worstY) { worstY = d; worstWhere = (ex.id ?? spec.id) + ' ' + cellKeys[i] + ' beat ' + at; }
        }
      }
      for (const h of hs) {
        const p = glyphPath(h);
        if (!p) continue;
        const b = p.getBBox();
        heads++; minW = Math.min(minW, b.width); minH = Math.min(minH, b.height);
        fills.add(getComputedStyle(p).fill);
      }
      // glyph shapes: what does this note carry that a plain note does not?
      // Only unambiguous notes are classified: exactly one extra glyph, and
      // exactly one reason to have one, or a dotted flat would teach the
      // comparison that a flat and a dot are the same shape.
      const mine = modPaths(el);
      const acc = el.dataset.acc ? el.dataset.acc.split(',') : [];
      const stac = !isRest && stacSpans.some(([f, t]) => at >= f - 1e-6 && at <= t + 1e-6);
      if (!acc.length && !stac) for (const d of mine) glyphs.plain.add(d);
      else if (mine.length === 1) {
        if (acc.length === 1 && !stac && glyphs.acc[acc[0]]) glyphs.acc[acc[0]].add(mine[0]);
        if (stac && !acc.length) glyphs.stac.add(mine[0]);
      }
    }
    out.heads = heads;
    out.minHeadW = heads ? minW : 0;
    out.minHeadH = heads ? minH : 0;
    out.worstY = worstY; out.worstWhere = worstWhere; out.compared = compared; out.sounding = sounding;
    out.fills = [...fills];

    out.rests = { want: spec.staves.reduce((a, s) => a + s.bars.reduce((b, r) => b + r.cells.filter((c) => c.rest).length, 0), 0),
      got: svg.querySelectorAll('[data-rest="1"]').length };
    out.tuplets = { want: expectedTuplets(spec), got: svg.querySelectorAll('.vf-lab-tuplet').length };
    out.ties = { want: expectedTies(spec), got: svg.querySelectorAll('.vf-lab-tie').length };
    const marks = spec.marks ?? [];
    out.slurs = { want: marks.filter((m) => m.kind === 'slur').length, got: svg.querySelectorAll('.vf-lab-slur').length };
    out.dynamics = { want: marks.filter((m) => m.kind === 'dynamic').length, got: svg.querySelectorAll('.vf-lab-dynamic').length };
    out.texts = { want: marks.filter((m) => m.kind === 'text').length, got: svg.querySelectorAll('.vf-lab-text').length };
    out.pedals = { want: marks.filter((m) => m.kind === 'pedal').length, got: svg.querySelectorAll('.vf-lab-pedal').length };
    out.staccatoNotes = stacSpans.length;
    out.handLabels = svg.querySelectorAll('.vf-lab-hand').length;
    out.keySig = svg.querySelectorAll('.vf-keysignature').length;
    out.aria = svg.getAttribute('aria-label');

    // ☠️ NOTHING MAY BE DRAWN OVER THE CLEF, THE KEY OR THE METER. An
    // accidental hangs to the LEFT of its head, so a page that never reserves
    // its width prints the flat through the 4/4 and still measures perfect.
    const furniture = [...svg.querySelectorAll('.vf-clef, .vf-keysignature, .vf-timesignature')].map((g) => g.getBBox());
    out.collisions = 0;
    for (const el of noteEls) {
      const b2 = el.getBBox();
      for (const f of furniture) {
        if (b2.x < f.x + f.width - 1 && f.x < b2.x + b2.width - 1
          && b2.y < f.y + f.height - 1 && f.y < b2.y + b2.height - 1) out.collisions++;
      }
    }

    // two pedallings must be two brackets in two places
    const peds = [...svg.querySelectorAll('.vf-lab-pedal')].map((g) => { const b = g.getBBox(); return [+(b.x).toFixed(1), +(b.x + b.width).toFixed(1)]; });
    out.pedalSpans = peds;
    out.pedalOverlap = peds.some((a, i) => peds.some((b2, j) => j > i && a[1] > b2[0] + 1 && b2[1] > a[0] + 1));
    out.pedalEmpty = peds.some(([x1, x2]) => x2 - x1 < 8);

    // a tie and a slur must not be the same drawing
    const tie = svg.querySelector('.vf-lab-tie path'), slur = svg.querySelector('.vf-lab-slur path');
    if (tie && slur) {
      const a = tie.getBBox(), b = slur.getBBox();
      out.tieVsSlur = { tieY: a.y + a.height, slurY: b.y + b.height, same: tie.getAttribute('d') === slur.getAttribute('d') };
    }
    // the spec form of the same page must engrave identically
    const again = target.build(spec);
    out.specForm = again && target.svg.querySelectorAll('.vf-stavenote').length === out.noteEls;
    target.build(ex);
    return out;
  }

  window.__lab = {
    ids: list.map((e) => e.id),
    count: list.length,
    byId: Object.fromEntries(list.map((e) => [e.id, e])),
    list, score, host, canonHost, wrap, glyphs, measure, mod, lab,
    sweep() {
      const rows = [];
      for (const ex of list) { try { rows.push(measure(ex)); } catch (err) { rows.push({ id: ex.id, ok: false, error: 'THREW ' + (err && err.message) }); } }
      return rows;
    },
    show(id) {
      const ex = list.find((e) => e.id === id);
      if (!ex) return { error: 'no such exercise: ' + id };
      canonHost.replaceChildren();          // no scaffolding in the picture
      const built = score.build(ex);
      score.refreshOverflow();
      const r = host.getBoundingClientRect();
      const hint = host.querySelector('[data-lab-score="more"]');
      return { built, error: score.error, x: Math.max(0, Math.round(r.x) - 6), y: Math.max(0, Math.round(r.y) - 6),
        width: Math.round(r.width) + 12, height: Math.round(r.height) + 12,
        overflowing: host.scrollWidth - host.clientWidth > 4,
        hintShown: !!hint && getComputedStyle(hint).display !== 'none' };
    },
  };
  return list.length;
})()`;

const b = await launch({ width: 1418, height: 900, scale: 1 });
const watch = b.watchErrors();
await b.goto(ORIGIN + '/index.html');
await b.ready();
await b.freezeMotion();
// The real library intentionally reloads when crossing the desktop breakpoint.
// This isolated engraving board must stay on a stable non-library surface.
await b.eval("window.__show('quest'); true");

const count = await b.eval(SETUP);
ok(`every authored exercise is reachable (${count} found)`, count >= 138, `${count} exercises`);

// ---------------------------------------------------------------------------
// the sweep
// ---------------------------------------------------------------------------
const rows = await b.eval('JSON.stringify(window.__lab.sweep())').then(JSON.parse);
const failed = rows.filter((r) => !r.ok);
ok(`all ${rows.length} exercises engrave with no exception`, failed.length === 0,
  failed.map((r) => `${r.id}: ${r.error}`).join(' | ').slice(0, 400));

const geom = rows.filter((r) => r.ok && !(r.w > 0 && r.h > 0 && r.heads > 0 && r.minHeadW > 3 && r.minHeadH > 3));
ok('every page has real geometry and real note heads', geom.length === 0,
  geom.map((r) => `${r.id}: ${r.w}x${r.h} heads ${r.heads} min ${r.minHeadW}x${r.minHeadH}`).join(' | ').slice(0, 300));

const inkBad = rows.filter((r) => r.ok && r.fills.some((f) => f !== 'rgb(35, 40, 47)'));
ok('every note head is score ink (#23282f), never blank or inherited', inkBad.length === 0,
  inkBad.map((r) => r.id + ': ' + r.fills.join(',')).join(' | ').slice(0, 300));

const creamBad = rows.filter((r) => r.hostBg !== 'rgb(245, 241, 230)');
ok('the page is the cream of the rest of the app (#f5f1e6)', creamBad.length === 0, creamBad.slice(0, 3).map((r) => r.id + ' ' + r.hostBg).join(' | '));

const scrollBad = rows.filter((r) => r.overflowX !== 'auto');
ok('the host scrolls horizontally despite .lesson-stave overflow:hidden', scrollBad.length === 0, scrollBad.slice(0, 3).map((r) => r.id + ' ' + r.overflowX).join(' | '));

const worst = rows.filter((r) => r.ok).reduce((a, r) => (r.worstY > (a?.worstY ?? -1) ? r : a), null);
const compared = rows.reduce((a, r) => a + (r.compared ?? 0), 0);
const sounding = rows.reduce((a, r) => a + (r.sounding ?? 0), 0);
ok(`every one of the ${compared} note heads sits on the staff line its AUTHORED spelling demands`,
  compared > 0 && compared === sounding && (worst?.worstY ?? 99) < 2.5,
  `worst ${worst?.worstY?.toFixed(2)}px${worst?.worstWhere ? ' at ' + worst.worstWhere : ''}, ${compared} compared of ${sounding} drawn`);

const headMismatch = rows.filter((r) => r.headMismatch || r.noGlyph);
ok('every authored key gets its own drawn note head (chords included)', headMismatch.length === 0,
  headMismatch.map((r) => `${r.id} mismatch ${r.headMismatch ?? 0} noglyph ${r.noGlyph ?? 0}`).join(', ').slice(0, 200));

const cellMismatch = rows.filter((r) => r.ok && r.noteEls !== r.cells);
ok('every authored cell is engraved, rests included', cellMismatch.length === 0,
  cellMismatch.map((r) => `${r.id} ${r.noteEls}/${r.cells}`).join(' | ').slice(0, 300));

for (const field of ['rests', 'tuplets', 'ties', 'slurs', 'dynamics', 'texts', 'pedals']) {
  const bad = rows.filter((r) => r.ok && r[field] && r[field].want !== r[field].got);
  const want = rows.reduce((a, r) => a + (r[field]?.want ?? 0), 0);
  ok(`${field}: all ${want} authored are on the page`, bad.length === 0,
    bad.map((r) => `${r.id} ${r[field].got}/${r[field].want}`).join(' | ').slice(0, 300));
}

const collide = rows.filter((r) => r.ok && r.collisions);
ok('no note or accidental is drawn over the clef, key signature or meter', collide.length === 0,
  collide.map((r) => `${r.id} x${r.collisions}`).join(', ').slice(0, 240));

const pedalBad = rows.filter((r) => r.ok && (r.pedalOverlap || r.pedalEmpty));
ok('each pedalling is its own bracket, in its own place, with real width', pedalBad.length === 0,
  pedalBad.map((r) => `${r.id} ${JSON.stringify(r.pedalSpans)}`).join(' | ').slice(0, 240));

const tripleBar = rows.find((r) => r.id === 'rh-tri-i');
ok('two triplets in one bar get TWO brackets, not one (the ids collide)',
  !!tripleBar && tripleBar.tuplets.got === 2, tripleBar ? `${tripleBar.tuplets.got} brackets` : 'rh-tri-i missing');

const tieSlur = rows.find((r) => r.tieVsSlur);
ok('a tie and a slur are different drawings on the same page',
  !!tieSlur && !tieSlur.tieVsSlur.same, tieSlur ? `tie base y ${tieSlur.tieVsSlur.tieY.toFixed(1)}, slur base y ${tieSlur.tieVsSlur.slurY.toFixed(1)}` : 'no page carries both');

const handBad = rows.filter((r) => r.ok && r.handLabels !== r.topLines.length);
ok('every stave is named by a letter, not by a colour', handBad.length === 0,
  handBad.map((r) => `${r.id} ${r.handLabels}`).join(', ').slice(0, 200));

const topBad = rows.filter((r) => r.ok && r.topLines.some((t) => t == null));
ok('every staff draws its five lines', topBad.length === 0, topBad.map((r) => r.id).join(', ').slice(0, 200));

const specForm = rows.filter((r) => r.ok && !r.specForm);
ok('build(exercise) and build(exercise.render) engrave the same page', specForm.length === 0,
  specForm.map((r) => r.id).join(', ').slice(0, 200));

const warned = rows.filter((r) => r.warnings?.length);
ok('no exercise engraves with a warning', warned.length === 0,
  warned.map((r) => `${r.id}: ${r.warnings.join('; ')}`).join(' | ').slice(0, 400));

// ---------------------------------------------------------------------------
// the accidentals, as SHAPES. A flat, a sharp and a natural must be three
// different glyphs, and none of them may be the shape of another.
// ---------------------------------------------------------------------------
const glyph = await b.eval(`(() => {
  const g = window.__lab.glyphs;
  const only = (set) => [...set].filter((d) => !g.plain.has(d));
  const b_ = only(g.acc.b), s_ = only(g.acc['#']), n_ = only(g.acc.n), st = only(g.stac);
  const inter = (a, c) => a.filter((d) => c.includes(d));
  return JSON.stringify({ flat: b_.length, sharp: s_.length, natural: n_.length, staccato: st.length,
    flatSharp: inter(b_, s_).length, flatNat: inter(b_, n_).length, sharpNat: inter(s_, n_).length,
    flatD: b_[0] ? b_[0].slice(0, 40) : null, sharpD: s_[0] ? s_[0].slice(0, 40) : null, natD: n_[0] ? n_[0].slice(0, 40) : null });
})()`).then(JSON.parse);
ok('an authored flat draws a flat glyph', glyph.flat > 0, glyph.flatD ?? 'none');
ok('an authored sharp draws a sharp glyph', glyph.sharp > 0, glyph.sharpD ?? 'none');
ok('an authored natural draws a natural glyph', glyph.natural > 0, glyph.natD ?? 'none');
ok('flat, sharp and natural are three DIFFERENT shapes',
  glyph.flatSharp === 0 && glyph.flatNat === 0 && glyph.sharpNat === 0,
  `overlaps flat/sharp ${glyph.flatSharp}, flat/nat ${glyph.flatNat}, sharp/nat ${glyph.sharpNat}`);
ok('a staccato mark draws its own glyph on the note', glyph.staccato > 0, `${glyph.staccato} shapes`);

// the named case from the brief: nt-flats in C must read Bb, not A#
const flatsCase = await b.eval(`(() => {
  const L = window.__lab;
  const ex = L.list.find((e) => /nt-flat/.test(e.id) && e.key === 'C')
          ?? L.list.find((e) => (e.render.staves ?? []).some((s) => s.bars.some((b) => b.cells.some((c) => c.accidentals.includes('b')))));
  if (!ex) return null;
  L.score.build(ex);
  const keys = [];
  for (const s of ex.render.staves) for (const b of s.bars) for (const c of b.cells) if (!c.rest) keys.push(...c.keys.map((k, i) => k + (c.accidentals[i] ?? '')));
  const flat = [...L.score.svg.querySelectorAll('[data-acc]')].map((e) => e.dataset.acc);
  return JSON.stringify({ id: ex.id, key: ex.key, keys, acc: flat });
})()`).then((s) => (s ? JSON.parse(s) : null));
ok('the flats drill in C prints flats, not the sharps a MIDI re-spelling would give',
  !!flatsCase && flatsCase.acc.includes('b') && !flatsCase.acc.includes('#'),
  flatsCase ? `${flatsCase.id} key ${flatsCase.key}: ${[...new Set(flatsCase.keys)].join(' ')} · accidentals ${[...new Set(flatsCase.acc)].join(',')}` : 'no flats exercise found');

// ---------------------------------------------------------------------------
// the canon reset, and the refusal
// ---------------------------------------------------------------------------
const canon = await b.eval(`(() => {
  const L = window.__lab;
  // a control that proves the reset is live in this board at all: .lesson-stave
  // paints cream in style.css, and inside a canon board it must not.
  const ctrl = document.createElement('div');
  ctrl.className = 'lesson-stave';
  L.canonHost.parentElement.append(ctrl);
  const resetLive = getComputedStyle(ctrl).backgroundColor !== 'rgb(245, 241, 230)';
  ctrl.remove();

  const s2 = new L.mod.LabScore(L.canonHost);
  const built = s2.build(L.list.find((e) => e.render.staves.length > 1) ?? L.list[0]);
  const head = s2.svg.querySelector('.vf-notehead path');
  const box = head.getBBox();
  const cs = getComputedStyle(head);

  // THE CONTROL, and it has to be a fresh element: stripping the inline style
  // off a hardened path still inherits its parent's hardened fill, which is how
  // a broken control read "fine" the first time this was measured.
  const twin = head.cloneNode(false);
  twin.removeAttribute('style');
  head.parentElement.append(twin);
  void document.body.offsetHeight;          // force the style and layout pass
  const tcs = getComputedStyle(twin);
  const tfill = tcs.fill, td = tcs.d;
  const tbox = twin.getBBox();
  twin.remove();

  const staveCount = s2.svg.querySelectorAll('.vf-stave').length;
  const transforms = s2.svg.querySelectorAll('[transform]').length;
  return JSON.stringify({ built, resetLive, inCanon: !!L.canonHost.closest('.canon-root'),
    fill: cs.fill, d: cs.d === 'none' ? 'none' : 'path', w: box.width, h: box.height,
    twinFill: tfill, twinD: td === 'none' ? 'none' : (td || 'empty'), twinW: tbox.width,
    staveCount, transforms,
    svgW: s2.svg.getBoundingClientRect().width, pageW: Number(s2.svg.getAttribute('width')) });
})()`).then(JSON.parse);
ok('the canon reset is actually live in the test board', canon.resetLive,
  `an unhardened twin path computes fill ${canon.twinFill}, d ${canon.twinD}, width ${canon.twinW}`);
ok('no VexFlow element relies on a transform attribute', canon.transforms === 0, `${canon.transforms} found`);
ok('the <svg> keeps its own width inside the reset', Math.abs(canon.svgW - canon.pageW) < 2,
  `${canon.svgW} on screen vs ${canon.pageW} drawn`);
ok('inside a .canon-root board the note heads still paint and still have shape',
  canon.built && canon.fill === 'rgb(35, 40, 47)' && canon.d === 'path' && canon.w > 3 && canon.h > 3,
  `fill ${canon.fill}, d ${canon.d}, head ${canon.w.toFixed(1)}x${canon.h.toFixed(1)}`);
ok('and the control proves why it needs hardening: the same path without inline style has NO geometry',
  canon.twinW === 0,
  `an identical path carrying only its attributes: box width ${canon.twinW}, computed d ${canon.twinD}, fill ${canon.twinFill}`);

// the optional play-time API, exercised once so it cannot ship broken
const api = await b.eval(`(() => {
  const L = window.__lab;
  const ex = L.list.find((e) => e.render.staves.length > 1 && e.render.bars > 1) ?? L.list[0];
  L.score.build(ex);
  L.score.update({ beat: 1, hand: 'R' });
  const states = {};
  for (const el of L.score.svg.querySelectorAll('[data-state]')) states[el.dataset.state] = (states[el.dataset.state] ?? 0) + 1;
  const passive = [...L.score.svg.querySelectorAll('[data-hand="L"]')].every((el) => el.style.opacity === '0.45');
  L.score.scrollToBeat(ex.render.bars * (ex.render.meter[0] * 4 / ex.render.meter[1]) - 1);
  const scrolled = L.host.scrollLeft;
  L.score.destroy();
  return JSON.stringify({ id: ex.id, states, passive, scrolled,
    emptied: L.host.childElementCount === 0, ok: L.score.ok });
})()`).then(JSON.parse);
ok('update() marks played, current and passive notes without repainting the page',
  Object.keys(api.states).length >= 2 && api.passive, `${api.id}: ${JSON.stringify(api.states)}`);
ok('destroy() empties the host and forgets the page', api.emptied && api.ok === false);

const refusal = await b.eval(`(() => {
  const L = window.__lab;
  const s3 = new L.mod.LabScore(L.canonHost);
  const a = s3.build({ nonsense: true });
  const visibleA = !!L.canonHost.querySelector('[data-lab-score="error"]')
    && L.canonHost.querySelector('[data-lab-score="error"]').getBoundingClientRect().height > 8;
  const textA = L.canonHost.textContent.trim();
  const b2 = s3.build({ staves: [{ hand: 'R', clef: 'treble', bars: [{ index: 0, cells: [{ duration: 'q', dots: 0, rest: false, at: 0, keys: ['c/4'], accidentals: [] }] }] }], meter: [4, 4] });
  const textB = L.canonHost.textContent.trim();
  const svg = L.canonHost.querySelector('svg');
  return JSON.stringify({ a, visibleA, textA, b: b2, textB, hasSvg: !!svg });
})()`).then(JSON.parse);
ok('an unreadable spec refuses VISIBLY and returns false', refusal.a === false && refusal.visibleA, refusal.textA.slice(0, 90));
ok('a malformed cell refuses too, and never prints a pitch guide', refusal.b === false && !refusal.hasSvg, refusal.textB.slice(0, 90));

// ---------------------------------------------------------------------------
// screenshots: desktop, then a 390 phone
// ---------------------------------------------------------------------------
const PICKS = await b.eval(`JSON.stringify((() => {
  const L = window.__lab, pick = (re) => (L.ids.find((id) => re.test(id)) ?? null);
  const withAcc = (acc) => (L.list.find((e) => e.render.staves.some((s) => s.bars.some((b) => b.cells.some((c) => (c.accidentals ?? []).includes(acc))))) ?? {}).id ?? null;
  return [
    ['flats', pick(/^nt-flat/) ?? withAcc('b')], ['naturals', withAcc('n')], ['sharps', withAcc('#')],
    ['ties', pick(/^rh-tie/)], ['tie-and-slur', 'rh-ts-w'], ['triplets', 'rh-tri-i'],
    ['symbols', 'nt-sym-w'], ['pedal', 'ex-ped-w'], ['six-eight', 'rh-68-w'],
    ['grand-staff', 'ap-cadence'], ['six-eight-rests', 'syn-68-rests'],
  ].filter(([, id]) => id && L.ids.includes(id));
})())`).then(JSON.parse);

const shots = [];
for (const [what, mode] of [[1418, 'desktop'], [390, 'phone']]) {
  await b.send('Emulation.setDeviceMetricsOverride', { width: what, height: mode === 'phone' ? 844 : 900, deviceScaleFactor: 2, mobile: mode === 'phone' });
  for (const [label, id] of PICKS) {
    const box = await b.eval(`JSON.stringify(window.__lab.show(${JSON.stringify(id)}))`).then(JSON.parse);
    const png = await b.shot({ x: box.x, y: box.y, width: box.width, height: Math.max(40, box.height) });
    const file = join(SHOTS, `${label}-${mode}.png`);
    writeFileSync(file, png);
    shots.push({ label, id, mode, file, ...box });
  }
}
const phone = shots.filter((s) => s.mode === 'phone');
const hintBad = phone.filter((s) => s.overflowing !== s.hintShown);
ok(`at 390px, every page that overflows says so (${phone.filter((s) => s.overflowing).length} of ${phone.length} overflow)`,
  hintBad.length === 0, hintBad.map((s) => s.label).join(', '));
console.log('shots: ' + shots.length + ' in ' + SHOTS);

const errs = watch.errors.filter((e) => !/favicon|journal|Failed to load resource/i.test(e));
ok('no console error or uncaught exception during the whole sweep', errs.length === 0, errs.slice(0, 3).join(' | ').slice(0, 400));

writeFileSync(join(SHOTS, 'sweep.json'), JSON.stringify({ when: new Date().toISOString(), origin: ORIGIN, rows, glyph, canon, shots }, null, 1));
await b.close();

const passed = results.filter((r) => r.pass).length;
console.log(`\n${passed}/${results.length} checks passed`);
process.exit(passed === results.length ? 0 : 1);
