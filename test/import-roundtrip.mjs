// THE IMPORTER'S ONE RUNNABLE CHECK.
//
// Take a song we already know is correctly arranged (Fur Elise, whose hands
// Mark and the audit both agree on), write it out as a two-track MIDI file the
// way a real piano export looks, import it back, and demand the notes and the
// HANDS come back identical. If the importer can lose or move a note of a song
// it was handed perfectly, it cannot be trusted with a song nobody has checked.
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SONGS } from '../js/songs.mjs';
import { writeMidi, parseMidi, midiNotes } from '../tools/midi.mjs';

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

const song = SONGS.find((s) => s.id === 'fur-elise');
const dir = join(tmpdir(), 'keys-import-test');
mkdirSync(dir, { recursive: true });
const mid = join(dir, 'fur-elise.mid');

// a real piano export puts each hand on its own track
const asTracks = song.notes.map((n) => ({ ...n, track: n.h === 'L' ? 0 : 1 }));
writeFileSync(mid, writeMidi({ notes: asTracks, bpm: song.bpm, timeSig: song.timeSig, tracks: 2 }));

// 1. the parser must return exactly what we wrote
const back = midiNotes(parseMidi(readFileSync(mid)));
ok(back.length === song.notes.length, `parser returned ${back.length} notes, wrote ${song.notes.length}`);
{
  const a = [...song.notes].sort((x, y) => x.b - y.b || x.m - y.m);
  const b = [...back].sort((x, y) => x.b - y.b || x.m - y.m);
  let worstB = 0, worstD = 0, wrongPitch = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i].m !== b[i].m) wrongPitch++;
    worstB = Math.max(worstB, Math.abs(a[i].b - b[i].b));
    worstD = Math.max(worstD, Math.abs(a[i].d - b[i].d));
  }
  ok(wrongPitch === 0, `${wrongPitch} notes came back at the wrong pitch`);
  ok(worstB < 0.01, `onsets moved by up to ${worstB.toFixed(4)} beats`);
  ok(worstD < 0.01, `durations moved by up to ${worstD.toFixed(4)} beats`);
}

// 2. the importer must recover the HANDS from the two tracks, not guess them
const out = execFileSync(process.execPath, [
  join(import.meta.dirname, '..', 'tools', 'import-midi.mjs'), mid,
  '--id', 'roundtrip-test', '--title', 'Round trip', '--composer', 'test',
  '--bpm', String(song.bpm), '--tiers', 'hard', '--dry',
], { encoding: 'utf8' });
ok(/hands: the file's own two parts/.test(out), 'the importer did not use the file\'s own hand evidence:\n' + out);
ok(/^ok\s+roundtrip-test-hard/m.test(out), 'the importer refused a song it was handed correctly:\n' + out);
{
  const m = out.match(/roundtrip-test-hard\s+(\d+) notes/);
  ok(m, 'could not read the note count back');
  if (m) ok(Math.abs(Number(m[1]) - song.notes.length) <= 1,
    `imported ${m[1]} notes from a song with ${song.notes.length}`);
}

// 3. and it must REFUSE a threshold-split file, which is the whole point
{
  const bad = song.notes.map((n) => ({ ...n, track: 0 }));   // one track, no hand evidence
  const badMid = join(dir, 'no-hands.mid');
  writeFileSync(badMid, writeMidi({ notes: bad, bpm: song.bpm, timeSig: song.timeSig, tracks: 1 }));
  const o2 = execFileSync(process.execPath, [
    join(import.meta.dirname, '..', 'tools', 'import-midi.mjs'), badMid,
    '--id', 'nohands-test', '--title', 'No hands', '--tiers', 'hard', '--dry',
  ], { encoding: 'utf8' });
  ok(/hands: derived by js\/hands\.mjs/.test(o2), 'a file with no staff information should fall back to the algorithm:\n' + o2);
}

rmSync(dir, { recursive: true, force: true });
console.log(fails.length ? 'IMPORT ROUND TRIP FAILED' : 'import round trip: notes, timing and hands all survive');
for (const f of fails) console.log('  FAIL  ' + f);
process.exit(fails.length ? 1 : 0);
