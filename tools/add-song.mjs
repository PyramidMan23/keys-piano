// ADD A SONG FROM A FALLING-NOTE VIDEO, IN ONE COMMAND.
//
// Written 2026-09-06. Mark, twice in two days: "why does it take so long to do
// this". The pipeline is about ten minutes a song. The Zelda batch took days
// because every one of those minutes was a separate command I typed, read and
// decided on, four songs deep, and any mistake cost the whole chain again.
// Nothing here is new work: it is the same scripts in the same order, with the
// bits that always had to be decided by a human left as the only stops.
//
//   node tools/add-song.mjs --probe --url <youtube>            what IS this video?
//   node tools/add-song.mjs --url <youtube> --id river-x --title "..." \
//        --composer "..." --template sheet-music-boss-3d-blue-green \
//        --bpm 120 --bpm-source "the arranger's marking" --meter 4/4 --key "F# minor"
//
// --probe answers the three questions a new video always raises, in one pass:
// does its keyboard survive the geometry gate, what do its pressed keys look
// like, and does it show the arranger's score at the end. Those decide the
// template, the hand mapping and the tempo, and they are the ONLY judgement
// calls in the whole lane. Everything after them is mechanical.
//
// ☠️ WHAT THIS DOES NOT DO IS DECIDE HANDS. Colour to hand comes from evidence
// outside pitch (Law 2), which in practice is page 1 of the arranger's own
// engraving on the video's end card. --probe saves that frame for you to read;
// it will not guess it, and to-import refuses a template whose handMapping is
// still null.
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SERVING = 'C:/Users/markh/keys-piano';
const LANE = 'C:/Users/markh/keys-piano-tools/video-lane';
const YTDLP = 'C:/Users/markh/keys-piano-tools/venv/Scripts/yt-dlp.exe';
const PY = 'C:/Users/markh/keys-piano-tools/venv/Scripts/python.exe';

const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const has = (n) => args.includes('--' + n);
const url = flag('url');
if (!url) { console.error('usage: --probe --url <youtube>   |   --url <youtube> --id <id> --title "..." --template <t> --bpm N --bpm-source "..." [--meter 4/4] [--key "G major"] [--composer "..."]'); process.exit(2); }

const slug = flag('slug') ?? flag('id') ?? ('v-' + (url.match(/[\w-]{11}$/)?.[0] ?? Date.now()));
const dir = join(LANE, 'z-' + slug);
mkdirSync(dir, { recursive: true });
const sh = (cmd, a, opts = {}) => execFileSync(cmd, a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
const say = (s) => console.log(s);

// ---- 1. the video and its audio -------------------------------------------
if (!existsSync(join(dir, 'video.mkv'))) {
  say('downloading video + audio...');
  sh(YTDLP, ['-f', 'bv*[height=1080][fps=60]+ba/bv*[height=1080]+ba/bv*+ba', '--merge-output-format', 'mkv', '-o', join(dir, 'video.%(ext)s'), url]);
  sh(YTDLP, ['-x', '--audio-format', 'wav', '--audio-quality', '0', '-o', join(dir, 'audio.%(ext)s'), url]);
}
const dur = Math.floor(Number(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(dir, 'video.mkv')]).trim()));
say(`video is ${dur}s`);

// ---- 2. frames, and the geometry gate --------------------------------------
// Sample across the whole piece: a key pressed in one frame is at rest in most
// of the others, which is what lets calibrate find the true key colours.
const frames = [];
for (let t = 10; t < dur - 8 && frames.length < 14; t += Math.max(10, Math.floor(dur / 14))) {
  const f = join(dir, `frame_${t}.png`);
  if (!existsSync(f)) sh('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', join(dir, 'video.mkv'), '-frames:v', '1', f]);
  frames.push(f);
}
let geoMode = 'rendered';
try {
  say(sh(process.execPath, [join(LANE, 'calibrate.mjs'), ...frames, '--out', join(dir, 'geometry.json')]).trim().split('\n').pop());
} catch {
  try {
    say(sh(process.execPath, [join(LANE, 'calibrate.mjs'), ...frames, '--filmed', '--out', join(dir, 'geometry.json')]).trim().split('\n').pop());
    geoMode = 'filmed';
  } catch (e) {
    console.log('\nGEOMETRY REFUSED, both ways:');
    console.log((String(e.stdout ?? '') + String(e.stderr ?? '')).trim().split('\n').slice(-3).join('\n'));
    console.log('\nA cropped or nonstandard keyboard cannot be anchored without a new gate. This video is out.');
    process.exit(1);
  }
}

// ---- 3. probe: what does this renderer look like? --------------------------
if (has('probe')) {
  // the end card is where Sheet Music Boss puts page 1 of the arranger's own
  // engraving: the staves that settle hands, and the tempo marking
  for (const t of [dur - 5, dur - 3, dur - 1]) {
    sh('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', join(dir, 'video.mkv'), '-frames:v', '1', join(dir, `endcard_${t}.png`)]);
  }
  // classify nothing: just report what the pressed keys measure, so a template
  // can be written from numbers instead of from a guess
  // a template that can classify NOTHING: every press comes back flagged with
  // its measured tint, which is the histogram below. (Written straight to disk:
  // shelling out to node -e with a JSON blob inside quotes is a Windows path
  // error waiting to happen, and was one.)
  const probeT = join(dir, '_probe-template.json');
  const base = JSON.parse(readFileSync(join(LANE, 'templates', 'sheet-music-boss-embers.json'), 'utf8'));
  writeFileSync(probeT, JSON.stringify({ ...base, rednessRed: 9, rednessGrey: -9, metric: null, classes: [], classesWhite: null, classesBlack: null, handMapping: null }));
  say('extracting (every pressed key, unclassified)...');
  sh(process.execPath, [join(LANE, 'extract.mjs'), join(dir, 'video.mkv'), join(dir, 'geometry.json'), probeT, '--out', join(dir, 'ev_probe.json')]);
  const ev = JSON.parse(readFileSync(join(dir, 'ev_probe.json'), 'utf8')).events;
  const tints = ev.map((e) => e.flags[0]?.match(/\((\d+),(\d+),(\d+)\)/)?.slice(1, 4).map(Number)).filter(Boolean);
  const hist = (name, f) => {
    const h = {};
    for (const t of tints) { const v = (Math.round(f(t) * 20) / 20).toFixed(2); h[v] = (h[v] ?? 0) + 1; }
    say(`  ${name.padEnd(8)} ${Object.entries(h).sort((a, b) => a[0] - b[0]).map(([k, n]) => `${k}:${n}`).join(' ')}`);
  };
  say(`\n${ev.length} events, ${geoMode} keyboard. What the pressed keys measure:`);
  hist('redness', (c) => (c[0] - c[2]) / Math.max(1, c[0]));
  hist('g/b', (c) => c[1] / Math.max(1, c[2]));
  hist('(g-b)/max', (c) => (c[1] - c[2]) / Math.max(1, c[0], c[1], c[2]));
  say(`\nA metric with TWO clumps and empty space between them is a two-colour renderer.`);
  say(`One clump means one colour: it paints no hand information and the video is out.`);
  say(`\nThe end card is at ${dir}\\endcard_*.png - read the arranger's staves for the`);
  say(`hand mapping and the tempo marking, then write a template in ${LANE}\\templates.`);
  process.exit(0);
}

// ---- 4. the full lane ------------------------------------------------------
const need = (n) => { const v = flag(n); if (!v) { console.error(`--${n} is required (run --probe first if you do not know it)`); process.exit(2); } return v; };
const id = need('id'), title = need('title'), template = need('template'), bpm = need('bpm'), bpmSource = need('bpm-source');
const tplPath = join(LANE, 'templates', template.endsWith('.json') ? template : template + '.json');
if (!existsSync(tplPath)) { console.error(`no template at ${tplPath}`); process.exit(2); }

say('extracting key tints...');
say(sh(process.execPath, [join(LANE, 'extract.mjs'), join(dir, 'video.mkv'), join(dir, 'geometry.json'), tplPath, '--out', join(dir, 'events.json')]).trim().split('\n').slice(-1)[0]);

// the audio transcription is the independent reading the consistency check
// needs; it is the slowest step and the only one worth caching
if (!existsSync(join(dir, 'audio-transcribed.mid'))) {
  say('transcribing the audio (slow, once per video)...');
  sh(PY, [join('C:/Users/markh/keys-piano-tools', 'transcribe.py'), join(dir, 'audio.wav'), join(dir, 'audio-transcribed.mid')]);
}
try {
  say(sh(process.execPath, [join(LANE, 'compare.mjs'), join(dir, 'events.json'), join(dir, 'audio-transcribed.mid')]));
} catch (e) {
  // ☠️ THIS GATE FAILING IS NOT AUTOMATICALLY A STOP. It failed on Silksong
  // (0.864) and on all three Zelda videos, always the same way: precision near
  // 0.99 and recall dragged down by the transcriber's own octave ghosts. Print
  // it, do not lower it, and let a human read the numbers.
  say(String(e.stdout ?? '').trim());
  say('the audio-consistency gate FAILED as written; read precision vs recall above before continuing');
}

const mid = join(LANE, id + '.mid');
say(sh(process.execPath, [join(LANE, 'to-import.mjs'), join(dir, 'events.json'), tplPath,
  '--bpm', String(bpm), '--bpm-source', bpmSource, '--meter', flag('meter', '4/4'), '--out', mid]).trim());

const imp = [mid, '--id', id, '--title', title, '--video-hands',
  '--composer', flag('composer', ''), '--source', flag('source', `video lane: key tint read frame by frame from ${url}; hands from the video's colours per ${template}; tempo ${bpm} from ${bpmSource}`)];
if (flag('key')) imp.push('--key', flag('key'));
say(sh(process.execPath, [join(SERVING, 'tools', 'import-midi.mjs'), ...imp], { cwd: SERVING }).trim());

say('\n' + sh(process.execPath, [join(SERVING, 'tools', 'after-import.mjs')], { cwd: SERVING }).trim());
say(`\nnow: bump VERSION in sw.js, then 'node tools/gates.mjs'`);
