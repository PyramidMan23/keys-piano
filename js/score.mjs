// Score mode: grand staff rendered as SVG, horizontally scrolling strip of
// measures with the current group highlighted and the next measure visible.
// Hands-separate GREYS the other staff, never hides it (council ruling).
// ponytail: hand-rolled renderer tuned to our curated songs; ceiling = no
// beaming, no rests, sharps spelt from the black key (fine for curated set).
// Upgrade path if curation outgrows it: VexFlow.

const NS = 'http://www.w3.org/2000/svg';
const STEP = 5;           // half a staff space in px
const MEASURE_W = 190;
const TREBLE_TOP = 44;    // y of treble top line (F5)
const BASS_TOP = 128;     // y of bass top line (A3)
const H = 210;

// letter index C=0..B=6; black keys spelt as sharps of the lower white key
const PC_SPELL = [
  [0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0],
  [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0],
];

function diatonic(midi) {
  const oct = Math.floor(midi / 12) - 1;
  const [letter, sharp] = PC_SPELL[midi % 12];
  return { idx: oct * 7 + letter, sharp };
}

// y for a diatonic index on a staff whose TOP line has diatonic index topIdx
function yFor(idx, topLineY, topIdx) {
  return topLineY + (topIdx - idx) * STEP;
}
const TREBLE_TOP_IDX = diatonic(77).idx; // F5 top line of treble
const BASS_TOP_IDX = diatonic(57).idx;   // A3 top line of bass

export class ScoreView {
  constructor(container) {
    this.container = container; // scrollable div
    this.svg = null;
    this.noteEls = new Map(); // note -> element
  }

  build(song, engine) {
    this.container.innerHTML = '';
    const beatsPerBar = song.timeSig[0];
    const endBeat = engine.endBeat;
    const bars = Math.ceil((endBeat - 0) / beatsPerBar);
    const width = 70 + bars * MEASURE_W;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', H);
    svg.style.display = 'block';
    this.svg = svg;
    this.noteEls.clear();
    this.beatsPerBar = beatsPerBar;
    this.width = width;

    // staves
    for (const top of [TREBLE_TOP, BASS_TOP]) {
      for (let i = 0; i < 5; i++) {
        line(svg, 10, top + i * STEP * 2, width - 10, top + i * STEP * 2, 'var(--score-line)');
      }
    }
    // clefs (SMuFL glyphs via text; Segoe UI Symbol has them on Windows)
    text(svg, 18, TREBLE_TOP + 4 * STEP * 2, '\u{1D11E}', 46, 'var(--score-ink)');
    text(svg, 18, BASS_TOP + 3 * STEP * 2 + 2, '\u{1D122}', 40, 'var(--score-ink)');
    // time signature (lesson prompts set noTimeSig: a lone drill note has no
    // meter, and Mark read the stacked 4/4 as "use octave 4", 2026-08-25)
    if (!song.noTimeSig) {
      text(svg, 52, TREBLE_TOP + STEP * 2 + 4, String(song.timeSig[0]), 20, 'var(--score-ink)', 'bold');
      text(svg, 52, TREBLE_TOP + STEP * 6 + 4, String(song.timeSig[1]), 20, 'var(--score-ink)', 'bold');
      text(svg, 52, BASS_TOP + STEP * 2 + 4, String(song.timeSig[0]), 20, 'var(--score-ink)', 'bold');
      text(svg, 52, BASS_TOP + STEP * 6 + 4, String(song.timeSig[1]), 20, 'var(--score-ink)', 'bold');
    }

    // bar lines + bar shading rects (for current/next highlight)
    this.barRects = [];
    for (let b = 0; b <= bars; b++) {
      const x = 70 + b * MEASURE_W;
      line(svg, x, TREBLE_TOP, x, BASS_TOP + 8 * STEP, 'var(--score-line)');
      if (b < bars) {
        const r = rect(svg, x, TREBLE_TOP - 20, MEASURE_W, BASS_TOP + 8 * STEP - TREBLE_TOP + 40, 'transparent');
        r.setAttribute('rx', 6);
        svg.insertBefore(r, svg.firstChild);
        this.barRects.push(r);
      }
    }

    // Map a beat to x INSIDE its measure with padding both sides, so late
    // off-beat notes can never render past the barline into the next bar.
    this.xForBeat = (beat) => {
      const bar = Math.floor(beat / beatsPerBar);
      const frac = (beat - bar * beatsPerBar) / beatsPerBar;
      return 70 + bar * MEASURE_W + 14 + frac * (MEASURE_W - 28);
    };

    // notes
    for (const n of song.notes) {
      const el = this._drawNote(svg, n, song);
      this.noteEls.set(n, el);
    }
    this.container.appendChild(svg);
  }

  _drawNote(svg, n, song) {
    const g = document.createElementNS(NS, 'g');
    const { idx, sharp } = diatonic(n.m);
    const treble = n.h === 'R';
    const y = treble ? yFor(idx, TREBLE_TOP, TREBLE_TOP_IDX) : yFor(idx, BASS_TOP, BASS_TOP_IDX);
    const x = this.xForBeat(n.b);

    // ledger lines
    const topY = treble ? TREBLE_TOP : BASS_TOP;
    const botY = topY + 8 * STEP;
    for (let ly = topY - STEP * 2; ly >= y - 1; ly -= STEP * 2) line(g, x - 9, ly, x + 9, ly, 'var(--score-line)');
    for (let ly = botY + STEP * 2; ly <= y + 1; ly += STEP * 2) line(g, x - 9, ly, x + 9, ly, 'var(--score-line)');

    const beats = n.d * (song.beatUnit === 8 ? 0.5 : 1); // duration in quarter notes
    const open = beats >= 2;
    const head = document.createElementNS(NS, 'ellipse');
    head.setAttribute('cx', x); head.setAttribute('cy', y);
    head.setAttribute('rx', 6); head.setAttribute('ry', 4.6);
    head.setAttribute('transform', `rotate(-15 ${x} ${y})`);
    head.setAttribute('fill', open ? 'transparent' : 'currentColor');
    head.setAttribute('stroke', 'currentColor');
    head.setAttribute('stroke-width', open ? 2 : 1);
    g.appendChild(head);

    if (sharp) text(g, x - 16, y + 5, '♯', 14, 'currentColor');
    const dotted = beats === 1.5 || beats === 3;
    if (dotted) circle(g, x + 11, y - 2, 2, 'currentColor');

    if (beats < 4) { // stem
      const up = treble ? idx < diatonic(71).idx : idx < diatonic(50).idx;
      const sx = up ? x + 5.5 : x - 5.5;
      const sy2 = up ? y - 30 : y + 30;
      line(g, sx, y, sx, sy2, 'currentColor', 1.6);
      if (beats <= 0.5) { // flag(s)
        const dir = up ? 1 : -1;
        flagPath(g, sx, sy2, dir);
        if (beats <= 0.25) flagPath(g, sx, sy2 + dir * 8, dir);
      }
    }
    if (n.f) text(g, x, treble ? y - 34 : y + 42, String(n.f), 10, 'var(--score-finger)');

    g.setAttribute('data-hand', n.h);
    g.style.color = 'var(--score-ink)';
    svg.appendChild(g);
    return g;
  }

  // Update highlight: current group amber, played notes dimmed, wrong flash
  // handled via CSS classes; auto-scroll keeps current + next measure visible.
  update(engine, hand) {
    if (!this.svg) return;
    const cur = engine.currentGroup();
    const curBar = Math.floor((cur ? cur.beat : engine.beat) / this.beatsPerBar);
    if (this._lastCurBar !== curBar) {
      this._lastCurBar = curBar;
      this.barRects.forEach((r, i) => {
        r.setAttribute('fill', i === curBar ? 'var(--score-cur-bar)' : i === curBar + 1 ? 'var(--score-next-bar)' : 'transparent');
      });
    }
    for (const [n, el] of this.noteEls) {
      const passive = hand !== 'both' && n.h !== hand;
      const isCur = cur && cur.beat === n.b && (hand === 'both' || n.h === hand);
      const played = n.b < (cur ? cur.beat : engine.beat);
      const color = isCur ? (n.h === 'R' ? 'var(--right)' : 'var(--left)')
        : passive ? 'var(--score-passive)'
        : played ? 'var(--score-played)' : 'var(--score-ink)';
      // style writes are the frame cost on 1600-note songs: only touch changes
      if (el.__c !== color) { el.style.color = color; el.__c = color; }
      const op = passive ? '0.45' : '1';
      if (el.__o !== op) { el.style.opacity = op; el.__o = op; }
    }
    const x = this.xForBeat(cur ? cur.beat : engine.beat);
    const target = Math.max(0, x - this.container.clientWidth * 0.3);
    if (Math.abs(this.container.scrollLeft - target) > 4) this.container.scrollLeft = target;
  }
}

function line(parent, x1, y1, x2, y2, stroke, width = 1) {
  const l = document.createElementNS(NS, 'line');
  l.setAttribute('x1', x1); l.setAttribute('y1', y1);
  l.setAttribute('x2', x2); l.setAttribute('y2', y2);
  l.setAttribute('stroke', stroke); l.setAttribute('stroke-width', width);
  parent.appendChild(l);
  return l;
}
function text(parent, x, y, str, size, fill, weight = 'normal') {
  const t = document.createElementNS(NS, 'text');
  t.setAttribute('x', x); t.setAttribute('y', y);
  t.setAttribute('font-size', size); t.setAttribute('fill', fill);
  t.setAttribute('font-weight', weight);
  t.setAttribute('text-anchor', 'middle');
  t.setAttribute('font-family', "'Segoe UI Symbol', 'Noto Music', serif");
  t.textContent = str;
  parent.appendChild(t);
  return t;
}
function rect(parent, x, y, w, h, fill) {
  const r = document.createElementNS(NS, 'rect');
  r.setAttribute('x', x); r.setAttribute('y', y);
  r.setAttribute('width', w); r.setAttribute('height', h);
  r.setAttribute('fill', fill);
  parent.appendChild(r);
  return r;
}
function circle(parent, cx, cy, r, fill) {
  const c = document.createElementNS(NS, 'circle');
  c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
  c.setAttribute('fill', fill);
  parent.appendChild(c);
  return c;
}
function flagPath(parent, x, y, dir) {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', `M ${x} ${y} q 10 ${dir * 6} 8 ${dir * 18}`);
  p.setAttribute('stroke', 'currentColor');
  p.setAttribute('stroke-width', 2.4);
  p.setAttribute('fill', 'none');
  parent.appendChild(p);
  return p;
}
