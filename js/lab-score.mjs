// LabScore: the learning lab's own engraver.
//
// ☠️ WHY THIS EXISTS. A lab exercise is AUTHORED as written notation
// (learning-lab.mjs `renderSpec`): a spelling, an accidental the engraver must
// print, a rest, a tie, a tuplet bracket, a dynamic. The generic `ScoreView`
// takes the exercise's `song` instead, and a song is MIDI numbers, so
// `spellPitch` re-derives the spelling from the pitch and the key. In C major
// that turns every authored Bb into an A#, which is the exact reading error the
// flats card is teaching. One renderer reads the authored page; this is it.
//
// It NEVER derives a spelling from a MIDI number and it NEVER falls back to the
// pitch-guide renderer: a fallback that quietly prints different notes than the
// ones being scored is worse than a visible refusal, so an unreadable spec
// prints the refusal and `build()` returns false.
//
// It does not touch score.mjs, engraving.mjs or notation.mjs: the whole
// catalogue renders through those and nothing here may regress them.
import '../vendor/vexflow-4.2.5.js';

const VF = globalThis.Vex.Flow;
const NS = 'http://www.w3.org/2000/svg';

// The cream page and its three inks, the same values engraving.mjs draws with
// and .lesson-stave sets, so a lab exercise and a repertoire score look like
// pages out of the same book.
const CREAM = '#f5f1e6';
const INK = '#23282f';
const LINE = '#837c69';
const MUTED = '#6b6558';

const STAVE_X = 34;          // room at the left for the hand label
// VexFlow's Stave y is the top of its BOX, and it reserves four line-spaces
// above the top line for text. 16 therefore puts the printed top line at 56 and
// the bass top line at 186, which is where engraving.mjs puts them, so a lab
// page and a repertoire page are the same size on the screen.
const STAVE_TOP = 16;
const STAVE_GAP = 130;       // treble top to bass top, as engraving.mjs spaces them
const TOP_LINE = 40;         // VexFlow's own space_above_staff_ln, in px
const EPS = 1e-6;

const near = (a, b) => Math.abs(a - b) < EPS;

// Staff position from the WRITTEN letter and octave. This is the only place
// the renderer does music theory, and it does it to size the page, never to
// decide a spelling: the spelling is the author's, always.
const LETTERS = 'cdefgab';
const diatonic = (key) => {
  const [name, oct] = String(key).split('/');
  return Number(oct) * 7 + LETTERS.indexOf(name[0].toLowerCase());
};
const CLEF_TOP = { treble: diatonic('f/5'), bass: diatonic('a/3') };

// ---------------------------------------------------------------------------
// The spec contract, verified before a note is drawn.
//
// renderSpec({...}) returns, and build() accepts, exactly this:
//   { id, kind: 'treble-staff'|'bass-staff'|'grand-staff',
//     keySignature: 'C'|'F'|'Bb'|'Am'|…, meter: [num, den], bars: n,
//     title, tempoText: '♩ = 72', beatUnitName, countInBeats,
//     staves: [ { hand: 'R'|'L', clef: 'treble'|'bass',
//                 bars: [ { index, cells: [ {
//                   duration: 'w'|'h'|'q'|'8'|'16',   // no dot in the string
//                   dots: 0|1, rest: bool, at: quarter-note position,
//                   keys: ['bb/4', …],                 // AUTHORED spelling
//                   accidentals: ['b'|'#'|'n'|'##'|'bb'|null, …],
//                   tie: null|'start'|'stop'|'both',
//                   tuplet: null|{ base, n, of, id },
//                 } ] } ] } ],
//     marks: [ {kind:'dynamic',value,at} | {kind:'text',value|text,at}
//            | {kind:'articulation',value:'staccato',from,to}
//            | {kind:'slur',from,to} | {kind:'pedal',from,to} ] }
// `at`, `from` and `to` are all QUARTER-NOTE positions from beat 0 of the
// exercise, the same unit the cells carry.
// ---------------------------------------------------------------------------
export function validateSpec(spec) {
  const bad = (msg) => { throw new Error(msg); };
  if (!spec || typeof spec !== 'object') bad('no render spec was given');
  if (!Array.isArray(spec.staves) || !spec.staves.length) bad('the render spec has no staves');
  if (!Array.isArray(spec.meter) || spec.meter.length !== 2) bad('the render spec has no meter');
  for (const st of spec.staves) {
    if (st.clef !== 'treble' && st.clef !== 'bass') bad(`stave ${st.hand}: unknown clef ${st.clef}`);
    if (!Array.isArray(st.bars) || !st.bars.length) bad(`stave ${st.hand}: no bars`);
    for (const bar of st.bars) for (const c of bar.cells ?? []) {
      if (!c.duration) bad(`stave ${st.hand} bar ${bar.index + 1}: a cell has no duration`);
      if (!Array.isArray(c.keys) || !c.keys.length) bad(`stave ${st.hand} bar ${bar.index + 1}: a cell has no keys`);
      // A rest carries a placeholder key for its staff position and, by the
      // spec's own construction, an EMPTY accidental list. Only a sounding cell
      // owes one entry per key.
      if (!Array.isArray(c.accidentals) || (!c.rest && c.accidentals.length !== c.keys.length))
        bad(`stave ${st.hand} bar ${bar.index + 1}: ${c.keys.length} keys but ${c.accidentals?.length} accidentals`);
    }
  }
  return spec;
}

// An exercise carries its page at `.render`; a spec is already the page.
export const specOf = (input) => (input && Array.isArray(input.staves) ? input
  : input && input.render && Array.isArray(input.render.staves) ? input.render : null);

// ---------------------------------------------------------------------------
// ☠️ TUPLET GROUPS ARE FOUND BY CONTIGUITY, NEVER BY `tuplet.id`.
// parseRhythm numbers a group `${bar}:${Math.floor(tupletSeq / 3)}` and resets
// tupletSeq on every non-tuplet cell, so `8 8 8 q 8 8 8` in one bar gives BOTH
// triplets the id `0:0` (rh-tri-i does exactly this). Grouping by id would draw
// one six-note bracket over a bar that has two separate triplets in it. A run
// of adjacent tuplet cells, split whenever the id or the ratio changes and then
// chunked into groups of `n`, is right under the current ids AND under unique
// ones, so this keeps working when the author fixes them.
// ---------------------------------------------------------------------------
export function tupletGroups(items) {
  const runs = [];
  let run = null;
  for (const item of items) {
    const t = item.cell.tuplet;
    if (!t) { run = null; continue; }
    const sig = `${t.id}|${t.n}/${t.of}|${t.base}`;
    if (!run || run.sig !== sig) { run = { sig, n: t.n || 3, of: t.of || 2, items: [] }; runs.push(run); }
    run.items.push(item);
  }
  const groups = [];
  for (const r of runs) {
    for (let i = 0; i < r.items.length; i += r.n) {
      groups.push({ n: r.n, of: r.of, items: r.items.slice(i, i + r.n) });
    }
  }
  return groups;
}

export class LabScore {
  // host: any element the renderer may empty and own. It gets the cream page,
  // horizontal scrolling and the overflow hint written INLINE, because the
  // canon's `.canon-root * { all: revert }` beats every stylesheet rule that
  // does not name an exempt id, and this renderer must not depend on being
  // mounted somewhere that happens to be exempt.
  constructor(host, opts = {}) {
    if (!host) throw new Error('LabScore needs a host element');
    this.host = host;
    this.opts = opts;
    this.spec = null;
    this.ok = false;
    this.error = null;
    this.warnings = [];
    this.notes = [];          // [{ hand, at, cell, note, el }]
    this.svg = null;
    this._rows = [];          // [bar][staveIndex] = { stave, notes }
    this._barLength = 4;
    this._observer = null;
  }

  // build(renderSpecOrExercise) -> true when the page was engraved.
  // On any failure it prints a visible refusal in the host and returns false;
  // it never substitutes a renderer that would show different notes.
  build(input) {
    this.destroy();
    const spec = specOf(input);
    try {
      if (!spec) throw new Error('this is not a lab render spec');
      validateSpec(spec);
      this._draw(spec);
      this.spec = spec;
      this.ok = true;
      this.error = null;
    } catch (err) {
      this.ok = false;
      this.error = err?.message ?? String(err);
      this._refuse(this.error);
    }
    return this.ok;
  }

  // A visible refusal, in the page's own voice. Never a pitch guide: the lab
  // scores what is written, so a page that is not the written one is a lie.
  _refuse(message) {
    this.host.replaceChildren();
    this._dressHost();
    const p = document.createElement('p');
    p.className = 'lab-score-error';
    p.dataset.labScore = 'error';
    p.setAttribute('role', 'alert');
    Object.assign(p.style, {
      margin: '0', padding: '12px 14px', maxWidth: '60ch',
      font: '13px/1.5 Helvetica, Arial, sans-serif', color: INK, background: CREAM,
    });
    p.textContent = 'This exercise could not be engraved: ' + message;
    this.host.append(p);
  }

  _dressHost() {
    Object.assign(this.host.style, {
      background: CREAM, borderRadius: '12px', padding: '6px 0',
      // ☠️ overflow-x: auto INLINE. `.lesson-stave` sets `overflow: hidden` and
      // `width: fit-content`, which on a 390px phone silently clips bar 3 off
      // the page with nothing to say it is there.
      overflowX: 'auto', overflowY: 'hidden', maxWidth: '100%', width: 'fit-content',
      position: 'relative', WebkitOverflowScrolling: 'touch',
    });
  }

  _draw(spec) {
    const host = this.host;
    host.replaceChildren();
    this._dressHost();

    const page = document.createElement('div');
    page.className = 'lab-score';
    page.dataset.labScore = spec.id ?? 'exercise';
    page.style.color = INK;
    host.append(page);

    // The page is exactly as tall as what is printed on it: the staves, the
    // notes that sit outside them, and the band under the bottom staff that the
    // dynamics and the pedal need. A fixed height either clips a low left hand
    // or leaves a hand of empty cream under a two-bar drill on a phone.
    const kinds = new Set((spec.marks ?? []).map((m) => m.kind));
    const below = kinds.has('pedal') ? 78 : kinds.has('dynamic') ? 44 : 18;
    let lowest = 0;
    for (const [si, st] of spec.staves.entries()) {
      const top = STAVE_TOP + si * STAVE_GAP + TOP_LINE;
      lowest = Math.max(lowest, top + 40);
      for (const bar of st.bars) for (const c of bar.cells) {
        if (c.rest) continue;
        for (const k of c.keys) lowest = Math.max(lowest, top + (CLEF_TOP[st.clef] - diatonic(k)) * 5);
      }
    }
    const height = Math.ceil(lowest + below);
    const renderer = new VF.Renderer(page, VF.Renderer.Backends.SVG);
    renderer.resize(400, height);                 // provisional: widened below
    const ctx = renderer.getContext();
    ctx.setFillStyle(INK);
    ctx.setStrokeStyle(INK);

    // --- pass 1: how much room do the clef, key signature and meter need? ----
    // Measured off a real stave rather than guessed from the number of sharps.
    const probe = new VF.Stave(STAVE_X, STAVE_TOP, 400);
    probe.addClef(spec.staves[0].clef);
    if (spec.keySignature) { try { probe.addKeySignature(spec.keySignature); } catch { /* checked below */ } }
    probe.addTimeSignature(spec.meter.join('/'));
    const leading = Math.max(60, probe.getNoteStartX() - STAVE_X);

    const barCount = spec.staves[0].bars.length;
    const widths = Array.from({ length: barCount }, (_, b) => {
      const cells = Math.max(...spec.staves.map((s) => s.bars[b]?.cells?.length ?? 0));
      return Math.max(130, 34 + cells * 26) + (b === 0 ? leading : 0);
    });
    const total = STAVE_X + widths.reduce((a, w) => a + w, 0) + 16;
    renderer.resize(total, height);
    ctx.setFillStyle(INK);
    ctx.setStrokeStyle(INK);

    // --- the notes, per stave, in written order across every bar ------------
    const staveNotes = spec.staves.map(() => []);
    const perBar = [];          // [bar][staveIndex] = { stave, notes }
    for (let b = 0; b < barCount; b++) {
      const x = STAVE_X + widths.slice(0, b).reduce((a, w) => a + w, 0);
      const row = [];
      for (const [si, st] of spec.staves.entries()) {
        const stave = new VF.Stave(x, STAVE_TOP + si * STAVE_GAP, widths[b]);
        stave.setStyle({ strokeStyle: LINE, fillStyle: INK });
        if (b === 0) {
          stave.addClef(st.clef);
          if (spec.keySignature) {
            try { stave.addKeySignature(spec.keySignature); }
            catch { this.warnings.push(`VexFlow does not know the key "${spec.keySignature}"`); }
          }
          stave.addTimeSignature(spec.meter.join('/'));
          if (si === 0 && spec.tempoText) this._addTempo(stave, spec);
        }
        if (si === 0) stave.setMeasure(b + 1);   // one bar number per system
        const notes = (st.bars[b]?.cells ?? []).map((cell) => {
          const item = { hand: st.hand, cell, at: cell.at, note: this._noteOf(cell, st.clef) };
          staveNotes[si].push(item);
          return item;
        });
        row.push({ stave, notes });
      }
      perBar.push(row);
    }

    // --- marks, resolved against the notes they belong to -------------------
    // Articulations become note modifiers, so they have to be attached BEFORE
    // the formatter runs; the rest are drawn over the finished page.
    const marks = (spec.marks ?? []).map((m) => this._resolveMark(m, staveNotes)).filter(Boolean);
    for (const m of marks) {
      if (m.kind !== 'articulation' || m.value !== 'staccato') continue;
      for (const item of m.span) {
        // A staccato dot goes on the NOTE HEAD side, opposite the stem. Forcing
        // it above put the dot over the top of the stem, a finger's width from
        // the note it belongs to.
        const up = item.note.getStemDirection() === VF.Stem.UP;
        item.note.addModifier(new VF.Articulation('a.')
          .setPosition(up ? VF.Modifier.Position.BELOW : VF.Modifier.Position.ABOVE), 0);
      }
      m.drawn = true;
    }

    // --- format and draw, one bar at a time, both hands together ------------
    const beamGroup = new VF.Fraction(
      spec.meter[0] > 3 && spec.meter[0] % 3 === 0 && spec.meter[1] === 8 ? 3 : 1,
      spec.meter[1] === 8 ? 8 : 4,
    );
    for (let b = 0; b < barCount; b++) {
      const row = perBar[b];
      const startX = Math.max(...row.map((r) => r.stave.getNoteStartX()));
      for (const r of row) r.stave.setNoteStartX(startX);
      for (const r of row) r.stave.setContext(ctx).draw();

      const voices = [];
      const tuplets = [];
      for (const r of row) {
        if (!r.notes.length) continue;
        for (const g of tupletGroups(r.notes)) {
          if (g.items.length !== g.n) this.warnings.push(`bar ${b + 1}: a ${g.n}-note tuplet group holds ${g.items.length}`);
          tuplets.push({
            group: g,
            tuplet: new VF.Tuplet(g.items.map((i) => i.note), {
              num_notes: g.n, notes_occupied: g.of, bracketed: true,
            }),
          });
        }
        // SOFT, not strict: a tuplet's ticks divide by three and the residue is
        // not the learner's problem. parseRhythm has already refused any bar
        // that does not add up, so strict mode can only throw on arithmetic the
        // author already proved, and a throw here would blank the whole page.
        const voice = new VF.Voice({ num_beats: spec.meter[0], beat_value: spec.meter[1] })
          .setMode(VF.Voice.Mode.SOFT)
          .addTickables(r.notes.map((i) => i.note));
        voice.setStave(r.stave);
        voices.push({ voice, stave: r.stave });
      }
      if (voices.length) {
        // ☠️ joinVoices ALWAYS, even for one voice. It is what builds the
        // modifier contexts, and without them an accidental is never given its
        // own width: the flat of a whole-note Bb was drawn straight through the
        // 4/4 (caught by looking at the picture, not by any measurement).
        const f = new VF.Formatter().joinVoices(voices.map((v) => v.voice));
        f.format(voices.map((v) => v.voice), widths[b] - (startX - row[0].stave.getX()) - 24);
        for (const { voice, stave } of voices) {
          const beams = VF.Beam.generateBeams(voice.getTickables(), { groups: [beamGroup] });
          voice.draw(ctx, stave);
          for (const beam of beams) beam.setContext(ctx).draw();
        }
      }
      // One group per bracket, tagged with the beats it spans, so two triplets
      // in one bar can be told apart on the page and counted by a probe.
      for (const { group, tuplet } of tuplets) {
        const g = ctx.openGroup('lab-tuplet');
        tuplet.setContext(ctx).draw();
        ctx.closeGroup();
        if (g) {
          g.dataset.bar = b;
          g.dataset.from = group.items[0].at;
          g.dataset.to = group.items[group.items.length - 1].at;
          g.dataset.n = group.n;
        }
      }
      if (row.length > 1) {
        new VF.StaveConnector(row[0].stave, row[row.length - 1].stave)
          .setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
      }
    }

    this.svg = page.querySelector('svg');
    this._rows = perBar;
    this._barLength = spec.meter[0] * 4 / spec.meter[1];

    // --- ties, then the marks that sit over the finished page ---------------
    for (const [si, items] of staveNotes.entries()) this._drawTies(ctx, items, si);
    for (const m of marks) this._drawMark(ctx, m);

    // --- label, tag, harden -------------------------------------------------
    for (const [si, st] of spec.staves.entries()) this._handLabel(perBar[0][si].stave, st.hand);
    for (const [si, items] of staveNotes.entries()) {
      for (const item of items) {
        const el = item.note.getSVGElement();
        if (!el) continue;
        item.el = el;
        el.dataset.hand = item.hand;
        el.dataset.beat = item.at;
        el.dataset.stave = si;
        if (item.cell.rest) el.dataset.rest = '1';
        const acc = item.cell.accidentals.filter(Boolean);
        if (acc.length) el.dataset.acc = acc.join(',');
        if (item.cell.tie) el.dataset.tie = item.cell.tie;
        this.notes.push(item);
      }
    }
    this.svg.setAttribute('role', 'img');
    this.svg.setAttribute('aria-label', this._label(spec));
    harden(this.svg);
    this._overflowHint();
  }

  // A note or a rest, spelt exactly as the page spells it. The accidental is
  // the one the AUTHOR said to print: VexFlow is never asked to work out
  // whether this note needs one, because working it out from a pitch is what
  // loses the carry, the courtesy and the flat.
  _noteOf(cell, clef) {
    const note = new VF.StaveNote({
      clef,
      keys: cell.keys,
      duration: cell.duration + (cell.rest ? 'r' : ''),
      auto_stem: true,
    });
    if (cell.dots) VF.Dot.buildAndAttach([note], { all: true });
    if (!cell.rest) {
      (cell.accidentals ?? []).forEach((acc, i) => {
        if (!acc) return;
        note.addModifier(new VF.Accidental(acc), i);
      });
    }
    return note;
  }

  _addTempo(stave, spec) {
    const bpm = Number(/([\d.]+)\s*$/.exec(spec.tempoText ?? '')?.[1]);
    if (!Number.isFinite(bpm)) return;
    // 6/8 counts the DOTTED quarter. renderSpec already said which, in
    // beatUnitName; printing ♩ over a compound bar teaches the wrong pulse.
    const dots = spec.beatUnitName === 'dotted quarter' ? 1 : 0;
    // high enough to clear a tuplet number over the first beat, which it sat on
    // top of at the default shift
    try { stave.setTempo({ duration: 'q', dots, bpm }, -16); }
    catch { this.warnings.push('the tempo mark could not be engraved'); }
  }

  // WHICH HAND, IN WORDS. The staves are told apart by a printed letter, not by
  // a colour: colour is the play-time state, and a still page has to be
  // readable without it.
  _handLabel(stave, hand) {
    if (!this.svg) return;
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', stave.getX() - 10);
    t.setAttribute('y', stave.getYForLine(2) + 5);
    t.setAttribute('text-anchor', 'end');
    t.dataset.labHand = hand;
    Object.assign(t.style, {
      fill: MUTED, font: '600 12px/1 Helvetica, Arial, sans-serif',
    });
    t.textContent = hand;
    this._group('lab-hand').append(t);
  }

  _label(spec) {
    const hands = spec.staves.map((s) => (s.hand === 'R' ? 'right hand' : 'left hand')).join(' and ');
    return [spec.title || 'Exercise', `${spec.bars ?? spec.staves[0].bars.length} bars`,
      `key of ${spec.keySignature ?? 'C'}`, spec.meter.join('/'), hands].join(', ');
  }

  // ☠️ A TIE IS DRAWN FROM THE AUTHORED `tie` FIELD, never inferred from two
  // neighbouring notes of the same pitch. `both` is the middle of a chain: it
  // receives the tie before it AND starts the next one, or a three-cell tie
  // reads as two separate attacks.
  _drawTies(ctx, items, staveIndex) {
    let pending = null;
    for (const item of items) {
      const t = item.cell.tie;
      if ((t === 'stop' || t === 'both') && pending) {
        const indices = item.cell.keys.map((_, i) => i);
        const g = ctx.openGroup('lab-tie');
        new VF.StaveTie({
          first_note: pending.note, last_note: item.note,
          first_indices: indices, last_indices: indices,
        }).setContext(ctx).draw();
        ctx.closeGroup();
        if (g) { g.dataset.stave = staveIndex; g.dataset.from = pending.at; g.dataset.to = item.at; }
      }
      pending = (t === 'start' || t === 'both') ? item : null;
    }
  }

  // A mark names a beat, not a stave. Pedal belongs under the system, so it
  // resolves against the BOTTOM stave; everything else against whichever stave
  // actually has notes in the span, top stave first.
  _resolveMark(mark, staveNotes) {
    const from = mark.from ?? mark.at ?? 0;
    const to = mark.to ?? mark.at ?? from;
    const sounding = staveNotes.map((items) => items.filter((i) => !i.cell.rest));
    const spans = sounding.map((items) => items.filter((i) => i.at >= from - EPS && i.at <= to + EPS));
    let staveIndex;
    if (mark.kind === 'pedal') staveIndex = spans.length - 1;
    else staveIndex = spans.findIndex((s) => s.length) === -1 ? 0 : spans.reduce((best, s, i) => (s.length > spans[best].length ? i : best), 0);
    if (mark.kind === 'pedal' && !spans[staveIndex].length) staveIndex = spans.findIndex((s) => s.length);
    if (staveIndex < 0) { this.warnings.push(`a ${mark.kind} mark at beat ${from} found no note`); return null; }
    let span = spans[staveIndex];
    if (!span.length) {
      // a point mark (a dynamic, a text) takes the nearest sounding note
      const items = sounding[staveIndex];
      const nearest = items.reduce((best, i) => (!best || Math.abs(i.at - from) < Math.abs(best.at - from) ? i : best), null);
      if (!nearest) { this.warnings.push(`a ${mark.kind} mark at beat ${from} found no note`); return null; }
      span = [nearest];
    }
    return { ...mark, from, to, staveIndex, span, drawn: false };
  }

  _drawMark(ctx, m) {
    const first = m.span[0].note;
    const last = m.span[m.span.length - 1].note;
    const stave = first.getStave();
    const headX = (n) => (n.getNoteHeadBeginX() + n.getNoteHeadEndX()) / 2;
    const topY = (n) => Math.min(stave.getYForLine(0), ...n.getYs());
    const botY = (n) => Math.max(stave.getBottomLineY(), ...n.getYs());
    try {
      if (m.kind === 'dynamic') {
        // Georgia bold italic, the app's existing dynamic, under the stave.
        this._text(m.value, headX(first), botY(first) + 32, {
          font: '700 italic 17px Georgia, serif', anchor: 'middle', cls: 'lab-dynamic',
        });
        m.drawn = true;
      } else if (m.kind === 'text') {
        this._text(m.text ?? m.value ?? '', headX(first), topY(first) - 18, {
          font: 'italic 13px Georgia, serif', anchor: 'start', cls: 'lab-text',
        });
        m.drawn = true;
      } else if (m.kind === 'slur') {
        if (m.span.length < 2) { this.warnings.push(`a slur at beat ${m.from} covers one note`); return; }
        // ☠️ A SLUR IS NOT A TIE, and it carries its own group class so the two
        // are told apart on the page and in a probe. A tie joins one pitch to
        // itself and sits at head height; a slur joins different notes, means
        // legato, and arcs clear of the heads on the side away from the stems.
        // VexFlow's own defaults do that; the hand-set control points that were
        // here first drew a hook, not a slur.
        const g = ctx.openGroup('lab-slur');
        new VF.Curve(first, last, { thickness: 2 }).setContext(ctx).draw();
        ctx.closeGroup();
        if (g) { g.dataset.from = m.from; g.dataset.to = m.to; }
        m.drawn = true;
      } else if (m.kind === 'pedal') {
        // ☠️ THE BRACKET IS DRAWN FROM THE AUTHORED SPAN, not from two notes.
        // VexFlow's PedalMarking wants a depress note and a release note, and a
        // pedal that lifts at the END of the last bar has no note to lift on:
        // "0 to 4, then 4 to 8" over two whole notes gave VexFlow the same note
        // twice and drew one bracket for two pedallings. The lift point is a
        // BEAT, so the bracket ends at that beat's note or at that bar's line.
        const g = this._group('lab-pedal');
        g.dataset.from = m.from;
        g.dataset.to = m.to;
        const y = this._bottomStave().getBottomLineY() + 40;
        const x1 = first.getNoteHeadBeginX();
        const x2 = this._xAtBeat(m.to, m.staveIndex, last);
        this._path(g, `M ${x1} ${y - 10} L ${x1} ${y} L ${x2} ${y} L ${x2} ${y - 10}`, 1.4);
        m.drawn = true;
      }
    } catch (err) {
      this.warnings.push(`a ${m.kind} mark at beat ${m.from} did not draw: ${err?.message ?? err}`);
    }
  }

  _bottomStave() {
    const row = this._rows[0];
    return row[row.length - 1].stave;
  }

  // Where a BEAT sits on the page: the note written there, or, when nothing is
  // written there, the bar line that beat falls on.
  _xAtBeat(beat, staveIndex, fallbackNote) {
    for (const row of this._rows) {
      for (const item of row[staveIndex]?.notes ?? []) {
        if (near(item.at, beat) && !item.cell.rest) return item.note.getNoteHeadBeginX();
      }
    }
    const bar = Math.max(0, Math.min(this._rows.length - 1, Math.floor((beat - EPS) / this._barLength)));
    // short of the bar line, so a pedal that lifts where the next one goes down
    // reads as two brackets rather than one long one
    const stave = this._rows[bar][staveIndex]?.stave ?? this._bottomStave();
    return Math.max(stave.getX() + stave.getWidth() - 14, fallbackNote.getNoteHeadEndX());
  }

  // Inline style, never a presentation attribute: the canon reset beats every
  // presentation attribute there is and has erased this app's notation five
  // times. See style.css, "THE SCORE SUBTREE IS EXEMPT".
  _group(cls) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'vf-' + cls);
    this.svg.append(g);
    return g;
  }

  _path(group, d, width) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    Object.assign(p.style, { fill: 'none', stroke: INK, strokeWidth: String(width) });
    group.append(p);
    return p;
  }

  _text(str, x, y, { font, anchor, cls }) {
    if (!this.svg || !str) return null;
    const g = this._group(cls);
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.setAttribute('text-anchor', anchor);
    Object.assign(t.style, { fill: INK, font });
    t.textContent = str;
    g.append(t);
    return t;
  }

  // The page is wider than the phone more often than not, and a clipped bar
  // with no affordance is a bar the learner never knows exists.
  _overflowHint() {
    let hint = this.host.querySelector('[data-lab-score="more"]');
    if (!hint) {
      hint = document.createElement('p');
      hint.dataset.labScore = 'more';
      hint.setAttribute('aria-hidden', 'true');
      Object.assign(hint.style, {
        margin: '2px 0 0', padding: '0 10px', textAlign: 'right', position: 'sticky', right: '0',
        font: '12px/1.4 Helvetica, Arial, sans-serif', color: MUTED, background: CREAM,
      });
      hint.textContent = 'Scroll for the rest of the line →';
      this.host.append(hint);
    }
    this.refreshOverflow();
    // A host that is hidden at build time measures zero; re-measure when it
    // gets a size rather than making the integrator remember to ask.
    if (typeof ResizeObserver === 'function' && !this._observer) {
      this._observer = new ResizeObserver(() => this.refreshOverflow());
      this._observer.observe(this.host);
    }
  }

  // Public: safe to call on show, on resize, whenever.
  refreshOverflow() {
    const hint = this.host?.querySelector('[data-lab-score="more"]');
    if (!hint) return false;
    const over = this.host.scrollWidth - this.host.clientWidth > 4;
    hint.style.display = over ? 'block' : 'none';
    return over;
  }

  // Optional play-time state, in the same vocabulary EngravedScore uses:
  // data-state on each note element, dimmed for the hand that is not playing.
  // beat is in QUARTER notes from beat 0, the unit the spec is written in.
  update({ beat = 0, hand = 'both' } = {}) {
    if (!this.ok) return;
    for (const item of this.notes) {
      if (!item.el) continue;
      const passive = hand !== 'both' && item.hand !== hand;
      const state = near(item.at, beat) && !passive ? 'current'
        : passive ? 'passive' : item.at < beat ? 'played' : 'ready';
      if (item.el.dataset.state === state) continue;
      item.el.dataset.state = state;
      item.el.style.opacity = passive ? '0.45' : '1';
    }
  }

  // Scroll the page so a beat is visible, the way EngravedScore follows a run.
  scrollToBeat(beat) {
    if (!this.ok) return;
    const item = this.notes.reduce((best, i) => (!best || Math.abs(i.at - beat) < Math.abs(best.at - beat) ? i : best), null);
    if (!item) return;
    const x = item.note.getAbsoluteX();
    this.host.scrollLeft = Math.max(0, x - this.host.clientWidth * 0.3);
  }

  destroy() {
    this._observer?.disconnect();
    this._observer = null;
    this.notes = [];
    this.warnings = [];
    this.svg = null;
    this._rows = [];
    this.ok = false;
    this.host.replaceChildren();
  }
}

// ---------------------------------------------------------------------------
// ☠️ VEXFLOW PAINTS WITH SVG PRESENTATION ATTRIBUTES, AND THE CANON KILLS THOSE.
// `.canon-root * { all: revert }` is an unlayered author rule, and a
// presentation attribute is the lowest-priority author declaration there is, so
// inside a canon board every note head, stem, beam and staff line loses its
// paint. The exemption list in style.css names #score-wrap and #lesson-stave BY
// ID; a renderer that can be mounted anywhere cannot rely on being one of them,
// and this file may not edit style.css. So every painted and every MEASURED
// attribute is mirrored into INLINE style, which the cascade compares before
// layers and which the reset cannot reach.
//
// ☠️ AND IT IS NOT ONLY THE PAINT. Measured in this app on 2026-09-13: inside a
// .canon-root board a VexFlow path computes `d: none`. `d` is a CSS property in
// SVG2, `all` covers it, and a path with no `d` has no geometry at all: not a
// note head with the wrong colour, a note head that does not exist. `x`, `y`,
// `width`, `height`, `cx`, `cy`, `r`, `rx` and `ry` are the same kind of
// property and go the same way, including the <svg>'s own width and height,
// which is why the canon copy measured 244px wide when its page was 700. This
// is the sixth time this class of bug has been paid for here (style.css keeps
// the tally); converting one property at a time is what lost the previous five,
// so the whole geometry family is copied, not the two that were noticed.
// ---------------------------------------------------------------------------
const PAINT = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
  'stroke-linejoin', 'fill-opacity', 'stroke-opacity', 'opacity',
  'font-family', 'font-weight', 'font-style', 'text-anchor'];
// these need a unit before CSS will take them
const SIZED = ['x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'font-size'];
export function harden(svg) {
  if (!svg) return 0;
  let touched = 0;
  for (const el of [svg, ...svg.querySelectorAll('*')]) {
    for (const name of PAINT) {
      const v = el.getAttribute(name);
      if (v == null || v === '') continue;
      el.style.setProperty(name, v);
      touched++;
    }
    for (const name of SIZED) {
      const v = el.getAttribute(name);
      if (v == null || v === '') continue;
      el.style.setProperty(name, /^-?[\d.]+$/.test(v) ? v + 'px' : v);
      touched++;
    }
    const d = el.getAttribute('d');
    if (d) { el.style.setProperty('d', `path("${d}")`); touched++; }
  }
  return touched;
}
