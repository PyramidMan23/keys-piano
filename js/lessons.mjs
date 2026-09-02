// The taught curriculum (2026-08-23): what a teacher would explain before
// asking you to read. Each lesson = plain-English teaching + a drill answered
// ON THE PIANO while reading real notation. Sequential unlock. DOM-free logic.
//
// 2026-08-24 teachability council (note: 2026-08-24-council-keys-lessons-
// teachability.md): lessons teach in micro-steps with ONE worked stave-to-key
// example (`ex`), drills run through the FIND/READ LessonCoach below, and
// every lesson carries a hand-VERIFIED free video escape hatch (oEmbed-checked
// 2026-08-24; never invent links).

const R = 'R', L = 'L';

// Zoomed lesson keyboard (2026-08-25, Mark lost between E4 and E5 on the full
// 88 keys): octave-snapped range around the drill's notes, always including
// middle C so the taught landmark stays on screen. Pure, node-tested.
export function lessonKeyRange(midis) {
  const ms = [...midis, 60];
  const lo = Math.floor(Math.min(...ms) / 12) * 12;
  const hi = Math.ceil((Math.max(...ms) + 1) / 12) * 12 - 1;
  return { lo, hi };
}

// Verified videos (YouTube oEmbed returned the title for every one of these).
const VID_GRAND_STAFF = { url: 'https://www.youtube.com/watch?v=5QL__ryn0js', title: 'How To Read Music for Piano Beginners: the Grand Staff' };
const VID_READ_PRACTICE = { url: 'https://www.youtube.com/watch?v=2-OkKG0E2og', title: 'Easy Practice Lesson: How to Read Sheet Music' };
const VID_SHARPS_FLATS = { url: 'https://www.youtube.com/watch?v=rmn1-N27DOA', title: 'Sharps and Flats Explained' };
const VID_INTERVALS = { url: 'https://www.youtube.com/watch?v=GqKxN0Znojw', title: 'Piano Quickie: Intervals Explained' };
const VID_TRIADS = { url: 'https://www.youtube.com/watch?v=P28KMjSNQYg', title: 'Master Major and Minor Triads' };
const VID_NOTE_VALUES = { url: 'https://www.youtube.com/watch?v=vMZv0j8_3Wg', title: 'Understanding Note Values' };

export const LESSONS = [
  {
    id: 'middle-c',
    title: 'Middle C and the grand staff',
    steps: [
      'Piano music lives on TWO staves joined together: the top one (treble) is mostly your right hand, the bottom one (bass) is mostly your left.',
      'The keyboard is just 7 letters, C D E F G A B, repeated over and over. Each repeat is an OCTAVE, and the number says which repeat: middle C is C4, the next C to the right is C5, the one to the left is C3. Same letter + different number = a different key.',
      'Middle C is the C nearest the middle of your keyboard. On paper it sits BETWEEN the two staves, on its own little line (a ledger line). It wears a dot on the keyboard below: count from it whenever you are lost.',
      'Worked example: the note lit on the keyboard below is middle C. That exact key is what the drill will ask for.',
    ],
    ex: { m: 60, h: R },
    video: VID_GRAND_STAFF,
    drill: { type: 'staff', need: 6, pool: [{ m: 60, h: R }, { m: 60, h: L }] },
    game: {
      intro: [
        { pool: [{ m: 60, h: R }], focus: { m: 60, h: R }, name: 'Find middle C' },
        { pool: [{ m: 60, h: R }, { m: 60, h: L }], focus: { m: 60, h: L }, name: 'Both staves, same key' },
      ],
      mixed: [{ m: 60, h: R }, { m: 60, h: L }],
      melody: [{ m: 60, h: R }, { m: 60, h: L }, { m: 60, h: R }, { m: 60, h: L }],
      capability: 'You can now find middle C from either staff.',
    },
  },
  {
    id: 'treble-lines',
    title: 'The treble lines: E G B D F',
    steps: [
      'The five LINES of the top staff, reading bottom to top, are E-G-B-D-F: "Every Good Boy Deserves Fruit".',
      'A note is ON a line when the line passes through its middle. The bottom line is E4, the E just above middle C.',
      'A full piano has eight Es, so which E? HEIGHT on the paper decides: the higher a note sits on the stave, the further RIGHT it is on the keyboard. Everything on the treble staff lives between middle C and the C two octaves up. (A stacked 4/4 at the start of real music is the TIME signature, beats per bar; it has nothing to do with octave numbers.)',
      'Worked example: the note shown on the stave is B4, the MIDDLE line. It is lit on the keyboard below: count up from middle C if you lose it (C, D, E, F, G, A, B).',
    ],
    ex: { m: 71, h: R },
    video: VID_GRAND_STAFF,
    drill: { type: 'staff', need: 10, pool: [{ m: 64, h: R }, { m: 67, h: R }, { m: 71, h: R }, { m: 74, h: R }, { m: 77, h: R }] },
    game: {
      intro: [
        { pool: [{ m: 60, h: R }, { m: 64, h: R }], focus: { m: 64, h: R }, name: 'Meet E4, the bottom line' },
        { pool: [{ m: 60, h: R }, { m: 64, h: R }, { m: 67, h: R }], focus: { m: 67, h: R }, name: 'Add G4' },
        { pool: [{ m: 64, h: R }, { m: 67, h: R }, { m: 71, h: R }], focus: { m: 71, h: R }, name: 'B4, the middle line' },
        { pool: [{ m: 67, h: R }, { m: 71, h: R }, { m: 74, h: R }], focus: { m: 74, h: R }, name: 'Up to D5' },
        { pool: [{ m: 71, h: R }, { m: 74, h: R }, { m: 77, h: R }], focus: { m: 77, h: R }, name: 'F5, the top line' },
      ],
      mixed: [{ m: 64, h: R }, { m: 67, h: R }, { m: 71, h: R }, { m: 74, h: R }, { m: 77, h: R }],
      melody: [{ m: 64, h: R }, { m: 67, h: R }, { m: 71, h: R }, { m: 74, h: R }, { m: 77, h: R }, { m: 74, h: R }, { m: 71, h: R }, { m: 67, h: R }, { m: 64, h: R }],
      capability: 'You can now read all five treble lines: E G B D F.',
    },
  },
  {
    id: 'treble-spaces',
    title: 'The treble spaces: F A C E',
    steps: [
      'The four GAPS between the treble lines spell a word, bottom to top: F-A-C-E.',
      'A note IN a space sits snugly between two lines, not touching through its middle.',
      'Worked example: the stave shows the bottom space, F4. It is lit below: the white key just right of E4.',
    ],
    ex: { m: 65, h: R },
    video: VID_GRAND_STAFF,
    drill: { type: 'staff', need: 10, pool: [{ m: 65, h: R }, { m: 69, h: R }, { m: 72, h: R }, { m: 76, h: R }] },
    game: {
      intro: [
        { pool: [{ m: 64, h: R }, { m: 65, h: R }, { m: 67, h: R }], focus: { m: 65, h: R }, name: 'F4, the bottom space' },
        { pool: [{ m: 65, h: R }, { m: 67, h: R }, { m: 69, h: R }], focus: { m: 69, h: R }, name: 'A4' },
        { pool: [{ m: 69, h: R }, { m: 71, h: R }, { m: 72, h: R }], focus: { m: 72, h: R }, name: 'C5' },
        { pool: [{ m: 72, h: R }, { m: 74, h: R }, { m: 76, h: R }], focus: { m: 76, h: R }, name: 'E5, the top space' },
      ],
      mixed: [{ m: 65, h: R }, { m: 69, h: R }, { m: 72, h: R }, { m: 76, h: R }],
      melody: [{ m: 65, h: R }, { m: 69, h: R }, { m: 72, h: R }, { m: 76, h: R }, { m: 72, h: R }, { m: 69, h: R }, { m: 65, h: R }],
      capability: 'You can now read the treble spaces: F A C E.',
    },
  },
  {
    id: 'bass-lines',
    title: 'The bass lines: G B D F A',
    steps: [
      'Left hand territory now. The bass staff lines, bottom to top, are G-B-D-F-A: "Good Boys Deserve Fruit Always".',
      'The TOP line is the A just below middle C, so this whole staff lives to the LEFT of where you have been playing.',
      'Worked example: the stave shows the middle line, D3. It is lit below, an octave and a bit left of middle C.',
    ],
    ex: { m: 50, h: L },
    video: VID_GRAND_STAFF,
    drill: { type: 'staff', need: 10, pool: [{ m: 43, h: L }, { m: 47, h: L }, { m: 50, h: L }, { m: 53, h: L }, { m: 57, h: L }] },
    game: {
      intro: [
        { pool: [{ m: 60, h: L }, { m: 57, h: L }], focus: { m: 57, h: L }, name: 'A3, the top line' },
        { pool: [{ m: 60, h: L }, { m: 57, h: L }, { m: 53, h: L }], focus: { m: 53, h: L }, name: 'Down to F3' },
        { pool: [{ m: 57, h: L }, { m: 53, h: L }, { m: 50, h: L }], focus: { m: 50, h: L }, name: 'D3, the middle line' },
        { pool: [{ m: 53, h: L }, { m: 50, h: L }, { m: 47, h: L }], focus: { m: 47, h: L }, name: 'B2' },
        { pool: [{ m: 50, h: L }, { m: 47, h: L }, { m: 43, h: L }], focus: { m: 43, h: L }, name: 'G2, the bottom line' },
      ],
      mixed: [{ m: 43, h: L }, { m: 47, h: L }, { m: 50, h: L }, { m: 53, h: L }, { m: 57, h: L }],
      melody: [{ m: 43, h: L }, { m: 47, h: L }, { m: 50, h: L }, { m: 53, h: L }, { m: 57, h: L }, { m: 53, h: L }, { m: 50, h: L }, { m: 47, h: L }, { m: 43, h: L }],
      capability: 'You can now read all five bass lines: G B D F A.',
    },
  },
  {
    id: 'bass-spaces',
    title: 'The bass spaces: A C E G',
    steps: [
      'The bass staff spaces spell A-C-E-G, bottom to top: "All Cows Eat Grass".',
      'That C in the second space is C3, the one your left hand plays all through Ode to Joy.',
      'Worked example: the stave shows C3, lit on the keyboard below.',
    ],
    ex: { m: 48, h: L },
    video: VID_GRAND_STAFF,
    drill: { type: 'staff', need: 10, pool: [{ m: 45, h: L }, { m: 48, h: L }, { m: 52, h: L }, { m: 55, h: L }] },
    game: {
      intro: [
        { pool: [{ m: 53, h: L }, { m: 55, h: L }, { m: 57, h: L }], focus: { m: 55, h: L }, name: 'G3, the top space' },
        { pool: [{ m: 50, h: L }, { m: 52, h: L }, { m: 55, h: L }], focus: { m: 52, h: L }, name: 'E3' },
        { pool: [{ m: 48, h: L }, { m: 50, h: L }, { m: 52, h: L }], focus: { m: 48, h: L }, name: 'C3, your Ode to Joy bass' },
        { pool: [{ m: 43, h: L }, { m: 45, h: L }, { m: 48, h: L }], focus: { m: 45, h: L }, name: 'A2, the bottom space' },
      ],
      mixed: [{ m: 45, h: L }, { m: 48, h: L }, { m: 52, h: L }, { m: 55, h: L }],
      melody: [{ m: 45, h: L }, { m: 48, h: L }, { m: 52, h: L }, { m: 55, h: L }, { m: 52, h: L }, { m: 48, h: L }, { m: 45, h: L }],
      capability: 'You can now read the bass spaces: A C E G.',
    },
  },
  {
    id: 'the-cs',
    title: 'Landmark Cs and ledger lines',
    steps: [
      'When notes run off the staff we add short LEDGER lines for them, like extending a ladder.',
      'Learn three landmark Cs and you can find anything nearby: C3 (bass, second space), middle C4 (between the staves), C5 (treble, third space). Navigate FROM the nearest landmark instead of counting from the bottom.',
      'Worked example: the stave shows C5, the treble third space, lit below one octave right of middle C.',
    ],
    ex: { m: 72, h: R },
    video: VID_GRAND_STAFF,
    drill: { type: 'staff', need: 8, pool: [{ m: 48, h: L }, { m: 60, h: R }, { m: 60, h: L }, { m: 72, h: R }] },
    game: {
      intro: [
        { pool: [{ m: 60, h: R }, { m: 72, h: R }], focus: { m: 72, h: R }, name: 'C5, one octave up' },
        { pool: [{ m: 60, h: L }, { m: 48, h: L }], focus: { m: 48, h: L }, name: 'C3, one octave down' },
      ],
      mixed: [{ m: 48, h: L }, { m: 60, h: R }, { m: 60, h: L }, { m: 72, h: R }],
      melody: [{ m: 48, h: L }, { m: 60, h: L }, { m: 72, h: R }, { m: 60, h: R }, { m: 48, h: L }],
      capability: 'You can now navigate from the three landmark Cs.',
    },
  },
  {
    id: 'phrases',
    title: 'Reading short phrases',
    steps: [
      'Real reading is not naming one note at a time: find a LANDMARK note you know, then follow the SHAPE.',
      'Line-space-line climbing is STEPS (next letter each time). A jump that skips a line or space is a SKIP (a third).',
      'Play each phrase in order. A wrong note restarts the phrase, just like real reading practice.',
    ],
    ex: { m: 60, h: R },
    video: VID_READ_PRACTICE,
    drill: { type: 'phrase', need: 6 },
    game: {
      // phrase values mirror entries in PHRASES below (kept by value: PHRASES
      // is declared after LESSONS, and the runner compares by key not reference)
      intro: [
        { pool: [{ h: R, ms: [60, 62, 64] }, { h: R, ms: [67, 65, 64] }], focus: { h: R, ms: [60, 62, 64] }, name: 'Three-note steps' },
        { pool: [{ h: R, ms: [64, 65, 67, 69] }, { h: R, ms: [72, 71, 69, 67] }], focus: { h: R, ms: [64, 65, 67, 69] }, name: 'Four-note shapes' },
        { pool: [{ h: L, ms: [48, 50, 52] }, { h: L, ms: [55, 53, 52, 50] }], focus: { h: L, ms: [48, 50, 52] }, name: 'Left-hand phrases' },
      ],
      mixed: [{ h: R, ms: [60, 64, 62, 60] }, { h: R, ms: [67, 69, 71, 72] }, { h: R, ms: [65, 64, 62, 60] }, { h: L, ms: [43, 45, 47, 48] }],
      melody: [{ h: R, ms: [60, 62, 64, 67, 65] }],
      capability: 'You can now read short phrases by shape, both hands.',
    },
  },
  {
    id: 'sharps-flats',
    title: 'Sharps, flats, and the black keys',
    steps: [
      'A SHARP (#) moves a note one key to the RIGHT (usually onto a black key). A FLAT (b) moves it one key LEFT.',
      'Every black key has two names: C# and Db are the same key. On paper the # sign sits just BEFORE the notehead, at the same height.',
      'Worked example: the stave shows F#4, lit below: the black key just right of F4. Your songs use these: Game of Thrones needs Eb, Runaway needs D#, C# and G#.',
    ],
    ex: { m: 66, h: R },
    video: VID_SHARPS_FLATS,
    drill: { type: 'staff', need: 10, pool: [{ m: 61, h: R }, { m: 63, h: R }, { m: 66, h: R }, { m: 68, h: R }, { m: 70, h: R }] },
    game: {
      intro: [
        { pool: [{ m: 65, h: R }, { m: 66, h: R }, { m: 67, h: R }], focus: { m: 66, h: R }, name: 'F# lives between F and G' },
        { pool: [{ m: 60, h: R }, { m: 61, h: R }, { m: 66, h: R }], focus: { m: 61, h: R }, name: 'C#' },
        { pool: [{ m: 61, h: R }, { m: 63, h: R }, { m: 64, h: R }], focus: { m: 63, h: R }, name: 'D# (your Runaway note)' },
        { pool: [{ m: 67, h: R }, { m: 68, h: R }, { m: 69, h: R }], focus: { m: 68, h: R }, name: 'G#' },
        { pool: [{ m: 69, h: R }, { m: 70, h: R }, { m: 71, h: R }], focus: { m: 70, h: R }, name: 'A#' },
      ],
      mixed: [{ m: 61, h: R }, { m: 63, h: R }, { m: 66, h: R }, { m: 68, h: R }, { m: 70, h: R }],
      melody: [{ m: 66, h: R }, { m: 68, h: R }, { m: 70, h: R }, { m: 68, h: R }, { m: 66, h: R }],
      capability: 'You can now read sharps and flats on the black keys.',
    },
  },
  {
    id: 'intervals',
    title: 'Intervals: the distance between notes',
    steps: [
      'An INTERVAL is the distance between two notes, counted in letters INCLUDING both ends: C to D is a 2nd, C to E is a 3rd, C to G is a 5th.',
      'On the staff a 2nd looks like notes touching; a 3rd is line-to-line or space-to-space. Good readers read intervals, not note names.',
      'Worked example: the stave shows C4 and E4 together, a 3rd. Both keys are lit below. In the drill, play both notes AT THE SAME TIME.',
    ],
    ex: { m: 60, h: R },
    exChord: [60, 64], // the worked 3rd from the steps: C4 + E4, both lit in the demo
    video: VID_INTERVALS,
    drill: { type: 'together', need: 6, items: [[60, 62], [60, 64], [62, 65], [64, 67], [60, 67], [65, 69]] },
    game: {
      intro: [
        { pool: [[60, 62], [60, 64]], focus: [60, 64], name: '2nd vs 3rd' },
        { pool: [[62, 65], [64, 67]], focus: [64, 67], name: 'Thirds move up' },
        { pool: [[60, 67], [65, 69]], focus: [60, 67], name: 'The wide 5th' },
      ],
      mixed: [[60, 62], [60, 64], [62, 65], [64, 67], [60, 67], [65, 69]],
      melody: [[60, 64], [62, 65], [64, 67], [60, 64]],
      capability: 'You can now read and play 2nds, 3rds, 4ths and 5ths.',
    },
  },
  {
    id: 'triads',
    title: 'Triads: chords on the staff',
    steps: [
      'Stack two 3rds and you get a TRIAD, the basic chord. On the staff it looks like a snowman: line-line-line or space-space-space.',
      'Major triads have a bottom gap of 4 semitones, minor 3. Still D.R.E. is three minor-family triads with one moving note.',
      'Worked example: the stave shows the C major triad, C-E-G. All three keys are lit below. Play every chord ALL NOTES TOGETHER.',
    ],
    ex: { m: 60, h: R },
    exChord: [60, 64, 67], // the worked C major triad from the steps
    video: VID_TRIADS,
    drill: { type: 'together', need: 4, items: [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]] },
    game: {
      intro: [
        { pool: [[60, 64, 67], [57, 60, 64]], focus: [57, 60, 64], name: 'C major vs A minor' },
        { pool: [[65, 69, 72], [67, 71, 74]], focus: [67, 71, 74], name: 'F and G' },
      ],
      mixed: [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]],
      melody: [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74], [60, 64, 67]],
      capability: 'You can now play the chords behind most of your songs.',
    },
  },
  {
    id: 'rhythm-values',
    title: 'Rhythm: note values',
    steps: [
      'Note SHAPES tell you how long: hollow with no stem = whole note (4 beats), hollow with stem = half (2), filled with stem = quarter (1), flag or beam = eighth (half a beat).',
      'A dot after a note adds half its value again. The time signature (4/4, 3/4) says how many beats fill a bar.',
      'To finish this lesson, go win one clean round of Rhythm tap, then come back.',
    ],
    ex: null,
    video: VID_NOTE_VALUES,
    drill: { type: 'rhythm-gate' },
  },
];

// ---- lessons as a game (9th council, 2026-08-25) ----
// Endless FIND/READ drills replaced by short guaranteed-finish LEVELS:
// fixed prompts, pass at 4/5 (not a streak), fail = instant retry of that
// level only, progress across levels monotonic. Each level's active pool is
// capped at 4 items (one new note vs secure anchors + its confusable
// neighbour, authored per lesson in `game`). A miss resurfaces two prompts
// later. Every lesson ends in a melody payoff level. litems stays the
// mastery/review evidence layer; level completion is pacing, not mastery.

// stable identity for any drill item (staff note, chord, phrase), the same
// keys the litems ledger and review already use
export function lessonItemKeyOf(it) {
  if (Array.isArray(it)) return `c:${it.join('-')}`;
  if (it.ms) return `p:${it.ms.join('-')}`;
  return `s:${it.m}|${it.h}`;
}

// materialize a lesson's authored game metadata into runnable levels
export function buildLevels(les) {
  const g = les.game;
  if (!g) return null;
  const type = les.drill.type;
  const prompts = type === 'staff' ? 5 : type === 'together' ? 4 : 3;
  const pass = type === 'staff' ? 4 : type === 'together' ? 3 : 2;
  const levels = g.intro.map((iv) => ({ pool: iv.pool, focus: iv.focus, name: iv.name, labels: true, prompts, pass }));
  levels.push({ pool: g.mixed, name: 'Mix round', labels: false, prompts, pass, mixed: true });
  levels.push({ melody: g.melody, name: 'The melody', labels: false });
  return levels;
}

export class LevelRunner {
  constructor(levels, rng = Math.random) {
    this.levels = levels;
    this.rng = rng;
    this.li = 0;
    this.misses = 0;   // total this lesson (clean-run badge = 0)
    this.done = false;
    this.down = new Set();
    this.seqIdx = 0;
    this._startLevel();
  }
  get level() { return this.levels[this.li]; }
  get current() { return this.queue?.[this.qi]; }

  _startLevel() {
    const lv = this.level;
    this.qi = 0;
    this.firstTry = 0;
    this.missedCurrent = false;
    this.down.clear();
    this.seqIdx = 0;
    if (lv.melody) {
      this.queue = [...lv.melody];
      this.slots = this.queue.map(() => 'todo');
      this.slotOf = this.queue.map((_, i) => i);
      return;
    }
    // prompts: the focus item opens the level and returns near the end;
    // the rest sample the pool without immediate repeats
    const q = [];
    const key = lessonItemKeyOf;
    for (let i = 0; i < lv.prompts; i++) {
      if (lv.focus && (i === 0 || i === lv.prompts - 2)) { q.push(lv.focus); continue; }
      let pick, guard = 0;
      do { pick = lv.pool[Math.floor(this.rng() * lv.pool.length)]; }
      while (lv.pool.length > 1 && q.length && key(pick) === key(q[q.length - 1]) && ++guard < 8);
      q.push(pick);
    }
    this.queue = q;
    // fixed attempt ledger (10th council): one slot per AUTHORED prompt;
    // resurfaced copies map back to their original slot, the row never grows
    this.slots = q.map(() => 'todo');
    this.slotOf = q.map((_, i) => i);
  }

  // one physical input against the current prompt.
  // true = prompt satisfied, false = wrong, null = nothing to judge yet,
  // 'part' = correct step inside a sequence
  _judge(midi, isDown, it, now = Date.now()) {
    if (Array.isArray(it)) {
      // attempt window: released keys stay evidence 1.5s so rolled and
      // staccato chords land (the rejected-G class, Mark live 2026-08-28)
      if (!isDown) { this.down.delete(midi); return null; }
      this.down.add(midi);
      (this.win ??= new Map()).set(midi, now);
      if (!it.includes(midi)) { this.down.delete(midi); this.win.clear(); return false; }
      const live = (m) => this.down.has(m) || (this.win.has(m) && now - this.win.get(m) <= 1500);
      if (it.every(live)) { this.win.clear(); return true; }
      return null;
    }
    if (!isDown) return null;
    if (it.ms) {
      if (midi === it.ms[this.seqIdx]) {
        this.seqIdx++;
        return this.seqIdx >= it.ms.length ? true : 'part';
      }
      this.seqIdx = 0; // wrong note restarts the phrase, like reading practice
      return false;
    }
    return midi === it.m;
  }

  note(midi, isDown) {
    if (this.done || !this.level) return { ok: null, done: true };
    const lv = this.level;
    const it = this.current;
    const r = this._judge(midi, isDown, it);
    if (r === null || r === 'part') return { ok: r === 'part' ? true : null, part: r === 'part', done: false };
    if (r === false) {
      const firstMiss = !this.missedCurrent;
      if (firstMiss) {
        this.missedCurrent = true;
        this.misses++;
        // the missed prompt comes back two prompts later (bounded); the copy
        // keeps its original slot so the visible ledger never grows
        if (!lv.melody && this.queue.length < lv.prompts + 3) {
          const pos = Math.min(this.qi + 2, this.queue.length);
          this.queue.splice(pos, 0, it);
          this.slotOf.splice(pos, 0, this.slotOf[this.qi]);
        }
      }
      return { ok: false, firstMiss, done: false };
    }
    // prompt complete
    const firstAttempt = !this.missedCurrent;
    if (firstAttempt) this.firstTry++;
    const slot = this.slotOf[this.qi];
    if (this.slots[slot] === 'todo') this.slots[slot] = firstAttempt ? 'clean' : 'recov';
    this.qi++;
    this.missedCurrent = false;
    this.down.clear();
    this.seqIdx = 0;
    const out = { ok: true, firstAttempt, promptDone: true, done: false };
    if (this.qi >= this.queue.length) {
      if (lv.melody || this.firstTry >= lv.pass) {
        this.li++;
        if (this.li >= this.levels.length) { this.done = true; out.lessonDone = true; out.done = true; }
        else { out.levelPassed = true; this._startLevel(); }
      } else {
        out.levelFailed = true; // instant retry, nothing else lost
        this._startLevel();
      }
    }
    return out;
  }

  // what the learner should play right now (for lighting keys + coaching)
  expected() {
    const it = this.current;
    if (!it) return [];
    if (Array.isArray(it)) return it.filter((m) => !this.down.has(m));
    if (it.ms) return [it.ms[this.seqIdx]];
    return [it.m];
  }

  progress() {
    const lv = this.level;
    return {
      level: Math.min(this.li + 1, this.levels.length), of: this.levels.length,
      name: lv?.name ?? '', labels: lv ? lv.labels !== false : true,
      qi: this.qi, qlen: this.queue?.length ?? 0, firstTry: this.firstTry,
      slots: [...(this.slots ?? [])], activeSlot: this.done ? -1 : this.slotOf?.[this.qi] ?? -1,
      melody: !!lv?.melody, mixed: !!lv?.mixed, pass: lv?.pass, done: this.done,
    };
  }
}

// Phrase-reading bridge (council 2026-08-24): 3-5 sequential notes read off
// the stave, untimed. Landmark start, mostly steps, the odd skip. This is the
// missing rung between single-note reading and 2-bar sight-reading.
export const PHRASES = [
  { h: 'R', ms: [60, 62, 64] },
  { h: 'R', ms: [67, 65, 64] },
  { h: 'R', ms: [64, 65, 67, 69] },
  { h: 'R', ms: [72, 71, 69, 67] },
  { h: 'R', ms: [60, 64, 62, 60] },      // skip then steps
  { h: 'R', ms: [67, 69, 71, 72] },
  { h: 'R', ms: [65, 64, 62, 60] },
  { h: 'R', ms: [60, 62, 64, 67, 65] },
  { h: 'L', ms: [48, 50, 52] },
  { h: 'L', ms: [55, 53, 52, 50] },
  { h: 'L', ms: [43, 45, 47, 48] },
  { h: 'L', ms: [52, 48, 50, 52] },      // skip down, steps back
];

export class PhraseDrill {
  constructor(pool, need, rng = Math.random) {
    this.pool = pool;
    this.need = need;
    this.rng = rng;
    this.correctPhrases = 0;
    this.idx = 0;
    this.missesOnCurrent = 0;
    this.current = null;
    this.next();
  }
  next() {
    let pick;
    do { pick = this.pool[Math.floor(this.rng() * this.pool.length)]; }
    while (this.pool.length > 1 && pick === this.current);
    this.current = pick;
    this.idx = 0;
    this.missesOnCurrent = 0;
  }
  answer(midi) {
    if (midi === this.current.ms[this.idx]) {
      this.idx++;
      if (this.idx >= this.current.ms.length) {
        this.correctPhrases++;
        const firstAttempt = this.missesOnCurrent === 0;
        if (this.correctPhrases >= this.need) return { ok: true, done: true, firstAttempt };
        this.next();
        return { ok: true, done: false, phraseDone: true, firstAttempt };
      }
      return { ok: true, done: false, idx: this.idx };
    }
    this.missesOnCurrent++;
    this.idx = 0; // wrong note restarts the phrase, like real reading practice
    return { ok: false, done: false, hint: this.missesOnCurrent >= 2 };
  }
}

// Mixed cumulative retrieval (council 2026-08-24): review items drawn from
// ALL completed lessons, weighted toward observed first-attempt errors;
// cold-start prior = least-recently-passed lesson first.
// candidates: [{key, lessonId, ...item}], litems: {key: {n, fm}},
// lessonTs: {lessonId: timestampOrTrue}
export function pickReviewItems(candidates, litems, lessonTs, count = 6, rng = Math.random) {
  const ts = (id) => (typeof lessonTs[id] === 'number' ? lessonTs[id] : 0);
  const scored = candidates.map((c) => {
    const rec = litems?.[c.key];
    // unknown items take a middle prior: above proven-clean, below known-trouble
    const errRate = rec && rec.n > 0 ? rec.fm / rec.n : 0.15;
    return { c, errRate, ts: ts(c.lessonId), r: rng() };
  });
  scored.sort((a, b) => {
    if (b.errRate !== a.errRate) return b.errRate - a.errRate;
    if (a.ts !== b.ts) return a.ts - b.ts; // least-recently-passed first
    return a.r - b.r;
  });
  return scored.slice(0, count).map((s) => s.c);
}

// Staff drill: show a note on the staff, the answer is playing that key.
export class StaffDrill {
  constructor(pool, need, rng = Math.random) {
    this.pool = pool;
    this.need = need;
    this.rng = rng;
    this.correct = 0;
    this.missesOnCurrent = 0;
    this.current = null;
    this.next();
  }
  next() {
    let pick;
    do { pick = this.pool[Math.floor(this.rng() * this.pool.length)]; }
    while (this.pool.length > 1 && this.current && pick.m === this.current.m && pick.h === this.current.h);
    this.current = pick;
    this.missesOnCurrent = 0;
    return pick;
  }
  answer(midi) {
    if (midi === this.current.m) {
      const firstAttempt = this.missesOnCurrent === 0;
      this.correct++;
      if (this.correct >= this.need) return { ok: true, done: true, firstAttempt };
      this.next();
      return { ok: true, done: false, firstAttempt };
    }
    this.missesOnCurrent++;
    return { ok: false, done: false, hint: this.missesOnCurrent >= 2, firstMiss: this.missesOnCurrent === 1 };
  }
}

// Together drill: play the displayed notes simultaneously.
export class TogetherDrill {
  constructor(items, need, rng = Math.random) {
    this.items = items;
    this.needRaw = need; // Infinity = endless coach-driven mode
    this.need = Math.min(need, items.length);
    this.rng = rng;
    this.order = [...items].sort(() => rng() - 0.5).slice(0, this.need);
    this.idx = 0;
    this.down = new Set();
    this.missesOnCurrent = 0;
  }
  get current() { return this.order[this.idx]; }
  // The attempt window: a released key stays evidence for 1.5s, so rolled AND
  // staccato chords land (a real G chord was silently rejected when judged
  // only on still-held keys. Mark, live, 2026-08-28). A wrong note resets it.
  note(midi, isDown, now = Date.now()) {
    if (isDown) { this.down.add(midi); (this.win ??= new Map()).set(midi, now); } else this.down.delete(midi);
    if (!isDown) return { ok: null, done: false };
    const want = this.current;
    if (!want.includes(midi)) {
      this.down.delete(midi);
      this.win?.clear();
      this.missesOnCurrent++;
      return { ok: false, done: false, firstMiss: this.missesOnCurrent === 1 };
    }
    const live = (m) => this.down.has(m) || (this.win?.has(m) && now - this.win.get(m) <= 1500);
    if (want.every(live)) {
      const firstAttempt = this.missesOnCurrent === 0;
      this.idx++;
      this.down.clear();
      this.win?.clear();
      this.missesOnCurrent = 0;
      // endless mode (need = Infinity): the LessonCoach owns completion, the
      // drill just keeps dealing; reshuffle when the deck runs out
      if (this.idx >= this.order.length && !isFinite(this.needRaw)) {
        this.order = [...this.items].sort(() => this.rng() - 0.5);
        this.idx = 0;
        return { ok: true, done: false, firstAttempt };
      }
      return { ok: true, done: this.idx >= this.order.length, firstAttempt };
    }
    return { ok: null, done: false };
  }
  // deal a different item now (transfer check after a reveal)
  skip() {
    this.down.clear();
    this.win?.clear();
    this.missesOnCurrent = 0;
    this.idx++;
    if (this.idx >= this.order.length) {
      this.order = [...this.items].sort(() => this.rng() - 0.5);
      this.idx = 0;
    }
  }
}
