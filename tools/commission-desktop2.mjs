// Generate the 2026-08-29 desktop commission for Claude Design, from the app's
// own extracted boards. apply-design Rule 6: a commission is GENERATED from the
// inventory, never hand-typed, because a hand-typed list is a guess with
// formatting.
//
// Emits two files into design-2026-08/:
//   commission-7a-artforward.txt   the library-desktop RELAYOUT brief
//   commission-desktop-screens.txt the 14 missing desktop compositions
//
// Run: node tools/commission-desktop2.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EX = join(ROOT, 'design', 'extracted');

// The screens that today exist only as 756px phone columns. Each desktop board
// keeps the SAME ids, SAME tags and the EXACT same visible wording; only the
// composition changes. The binders anchor on ids and text, so a changed word is
// a dead control.
const PHONE = ['lessons', 'lesson', 'task', 'path', 'echo', 'rhythm', 'improv',
  'freeplay', 'metronome', 'trophies', 'takes', 'calibrate', 'touch', 'keys12'];

// artboard ids for the new boards, in the design project's own numbering lane
const BOARD_ID = {
  'library-desktop': '10a',
  lessons: '11a', lesson: '11b', task: '11c', path: '11d', echo: '11e',
  rhythm: '11f', improv: '11g', freeplay: '11h', metronome: '11i',
  trophies: '11j', takes: '11k', calibrate: '11l', touch: '11m', keys12: '11n',
};

function inventory(screen) {
  const html = readFileSync(join(EX, `${screen}.html`), 'utf8');
  const meta = JSON.parse(readFileSync(join(EX, `${screen}.json`), 'utf8'));
  const ids = [];
  for (const m of html.matchAll(/<(\w+)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const [, tag, id] = m;
    const attrs = m[0];
    const type = (attrs.match(/\btype="([^"]+)"/) || [])[1];
    ids.push({ id, tag, type });
  }
  const texts = [...new Set(meta.nodes.filter((n) => n.text).map((n) => n.text))];
  const canvases = ids.filter((x) => x.tag === 'canvas').map((x) => x.id);
  return { ids, texts, canvases, box: meta.box };
}

const LAW = `THE LANGUAGE IS LOCKED (5b/7a/9a): true black #000000 page, Fraunces only for display lines (brand, song titles, big numbers), ui-monospace for kicker labels, hairline #253129 structure, green accent #82bf9c with #2E6B47 as the ONLY filled green, amber #f0a832 = right hand and cyan #5ee0f2 = left hand and those two hues belong to the NOTES, not the chrome. The one allowed band tone is #131915. Type floor 11px, at most 6 size steps, tabular numerals on numbers. Mark is red-green colour-blind: no state may be carried by hue alone, every state = shape PLUS word. Every target 44px. No em dashes anywhere, no emoji anywhere, no element ids leaking as visible text. Each board is a self-contained inline-styled composition at EXACTLY 1418 x 738.`;

const RULES = `HARD RULES FOR EVERY BOARD:
1. Keep every element id listed, on the SAME tag as listed. The app addresses these ids; a missing id or a changed tag kills a live control.
2. Keep every visible text string EXACTLY as listed, byte for byte. The app's binders anchor on these strings; a reworded label is a dead control.
3. These are new desktop COMPOSITIONS, not the phone column stretched or centred. Use the whole 1418 x 738. Think how the play board 9a relates to the phone play board 6a: same controls, different architecture.
4. A canvas region gets a drawn resting-state decoration as an absolutely positioned non-interactive layer INSIDE its wrapper (the app hides it when it animates), and the real canvas element with its id stays underneath.
5. Every board draws its own way back: a control reading exactly "Library" (or the screen's own back control where listed, e.g. lesson-back, task-back, path-home).
6. No vertical scroll at 738. Fit the composition to the frame.`;

// ---- the 14 desktop screens -------------------------------------------------
const PURPOSE = {
  lessons: 'The curriculum list: a numbered spine of reading lessons plus the Quick review door. Desktop: give the spine room, two columns of lessons, the review card as its own object.',
  lesson: 'One reading lesson being taught: teaching steps, a stave prompt, a clickable keyboard, coaching line, video link. Desktop: stave and keyboard get real width side by side with the teaching column, like a music stand.',
  task: 'A teacher-loop task: prompt, stave sheet, answer slots, keyboard, help doors (Show me, Practice with help, Use the on-screen keyboard). Desktop: stage left, teaching rail right.',
  path: 'My path: the skills graph, the prescription with its reason and evidence, lesson list, playable-songs count, technique rubric door. Desktop: the path reads as a map, not a stack.',
  echo: 'Melody echo: the app plays a phrase, the player echoes it. Modes Echo / Sing first / Transpose, level, streak, delta. Desktop: the echo canvas is the stage, wide; controls in a rail.',
  rhythm: 'Rhythm tap: pattern blocks, level, streak, play-pattern control. Desktop: the pattern blocks become large readable slabs across the width.',
  improv: 'Improv: a chord loop plays, the player noodles. Loop select, chord readout, start/stop, improv canvas showing the highlighted keys. Desktop: the keyboard canvas is wide like the play deck, loop controls above.',
  freeplay: 'FREE PLAY IS THE FLAGSHIP OF THIS BATCH. Mark: it currently renders as a tiny keyboard strip floating in a void. On desktop it becomes the FULL-WIDTH keyboard with the same presence and light as the play deck 9a: the freeplay canvas owns virtually the whole frame, a thin header names the screen, the note log is one quiet mono line, and the way back is small. Same dark-glass keys, same true black, light belongs to the played notes.',
  metronome: 'Metronome: beat dots, bpm slider + typed number, time signature, start/stop. Desktop: a beautiful instrument face, big Fraunces bpm number, dots with real presence.',
  trophies: 'Trophies: the evidence cabinet (badges) and the XP ledger. Desktop: cabinet left, ledger right.',
  takes: 'Takes: recorded practice takes with playback, the takes canvas replays keys. Desktop: shelf of takes left, replay stage right with a wide canvas.',
  calibrate: 'Latency calibration: tap-along meter canvas, status line, redo/reset. Desktop: the meter gets width, the instructions read at a glance.',
  touch: 'Touch diagnostic: guided per-key velocity capture, status, current key, dynamics readout, progress, done/redo. Desktop: the capture reads like an instrument bench test.',
  keys12: 'The 12-key ladder: four grids (major scales, minor scales, major arpeggios, minor arpeggios), each cell a drill with its passed state. Desktop: all four grids visible at once, no scroll.',
};

let out = [];
out.push('COMMISSION: 14 desktop boards, 1418 x 738 each, one per screen listed below.');
out.push('');
out.push('Every screen in this app except the library and the play screen exists only as a 756px phone column, so on Mark\'s 1418 x 738 window those screens float as a narrow strip in a black void. Each needs a real desktop composition, exactly the way 9a gave the play screen one.');
out.push('');
out.push(LAW);
out.push('');
out.push(RULES);
out.push('');
out.push('Name each artboard with the id given (10-series/11-series). Here is each screen with its REQUIRED ids (id, tag, input type where set) and its EXACT wording inventory:');
for (const s of PHONE) {
  const inv = inventory(s);
  out.push('');
  out.push(`=== ${BOARD_ID[s]} ${s}-desktop ===`);
  out.push(PURPOSE[s]);
  out.push('Required ids: ' + inv.ids.map((x) => `${x.id}<${x.tag}${x.type ? ' type=' + x.type : ''}>`).join(', '));
  if (inv.canvases.length) out.push('Canvas surfaces (rule 4 applies): ' + inv.canvases.join(', '));
  out.push('Exact wording to keep (sample data may change VALUES but never label wording): ' + inv.texts.map((t) => JSON.stringify(t)).join(' '));
}
out.push('');
out.push('Deliver all 14 on the existing canvas next to the current boards. Do not modify any existing artboard in this message.');
writeFileSync(join(ROOT, 'design-2026-08', 'commission-desktop-screens.txt'), out.join('\n'));
console.log('wrote commission-desktop-screens.txt', out.join('\n').length, 'chars');

// ---- 7a relayout ------------------------------------------------------------
const lib = inventory('library-desktop');
let a = [];
a.push('COMMISSION: artboard 10a "library-desktop-2", 1418 x 738. A ground-up RELAYOUT of 7a, which Mark has rejected. His words: learning and tools are buried, the right-hand stack of cards squeezes the album artwork small, and it does not feel intuitive.');
a.push('');
a.push('THE BRIEF: art-forward, the way iTunes album view and Spotify home actually are. The album sleeves are the emotional heart: big, central, a real grid of artwork. The learning path (the DO THIS NEXT recommendation) and the tools must be obvious at a glance, not buried in a rail. Real hierarchy, less simultaneous clutter: quests, mission, practice chart and form check may collapse into quieter, smaller objects or a single strip; the art may not.');
a.push('');
a.push('CONVENE THE JUDGE PANEL used on the 9-series boards: the Apple HI designer, the iTunes library designer, the Spotify lead, the contrast scientist and the concert pianist. Have them force this to billion-dollar 2026 standard before you draw, and note their key rulings as annotation OUTSIDE the artboard.');
a.push('');
a.push(LAW);
a.push('');
a.push('FUNCTIONAL CONTENT THAT MUST SURVIVE, with the exact wording the app binds on (keep these strings byte for byte; sample VALUES like counts and song names may vary only where marked):');
a.push('- The recommendation: kicker exactly "DO THIS NEXT", a song title (sample: "Star Wars Main Title"), reason line exactly "John Williams, arranged for two hands. Nothing banked yet, start on the easy tier.", buttons exactly "Start" and "Choose another", and the song sleeve image. Start stays the ONLY filled green.');
a.push('- The four shelves as TABS, labels exactly "Learning", "Repertoire", "Hall of fame", "Explore", each with a numeric count, drawn with Learning selected. The tabs sit at the top of the song area.');
a.push('- THE SONG GRID, the new heart: a large album-art grid of sample songs (use the sleeves already on the canvas). Each tile: the sleeve big, the title (Fraunces), one state word from exactly this set: "Banked" / "Needs work" / "Not started", tier pips for Easy/Medium/Hard as shapes, and a plays count. Draw at least 8 tiles. Also draw one final tile-sized control reading exactly "Show the other 7 in Learning".');
a.push('- Sort segment, labels exactly "Weakest" and "A to Z".');
a.push('- A real <input type="search"> with placeholder exactly "Search all songs".');
a.push('- Status: exactly "LVL 1", "80/100", "1 day rhythm", "best 1".');
a.push('- Keyboard state: exactly "No keyboard" and "Screen taps. Plug your keyboard in for the real thing."');
a.push('- Carry on: exactly "Resume the session" with sub-line sample "Chords from a symbol".');
a.push('- Tools, visible at a glance (not buried): quick entries exactly "Free play", "Metronome", "Latency calibration", "Voice" (readout sample "Grand", metronome readout sample "140"), and one control reading exactly "All tools".');
a.push('- Quests: header sample "1 of 3 done", rows exactly "Master a section", "10 real minutes, done", "One clean run" with XP values, middle row drawn done (shape plus word).');
a.push('- Weekly mission: rows exactly "Make one song truly yours", "Bank two song proofs", "Three practice days", chip exactly "+150 each".');
a.push('- Practice, last 7 days: 7 bars plus day letters with the last labelled exactly "today". Draw three bar states: today (accent), a past day with minutes (outline), an empty day (dashed baseline).');
a.push('- Path teaser: skill line sample "Chords from a symbol", stage line exactly "Skill 2 of 5. Stage: independent, one stage short of retained.", pips with label exactly "4 OF 5 STAGES", button exactly "Continue".');
a.push('- Form check card: buttons exactly "Done, I watched it" and "Not today".');
a.push('- Table header line: exactly "LEARNING, WEAKEST FIRST" with a count, above or beside the grid.');
a.push('');
a.push('No vertical scroll at 738. No em dashes, no emoji, no visible element ids. The current 7a stays untouched on the canvas; 10a is a NEW artboard.');
writeFileSync(join(ROOT, 'design-2026-08', 'commission-7a-artforward.txt'), a.join('\n'));
console.log('wrote commission-7a-artforward.txt', a.join('\n').length, 'chars');
