// A Standard MIDI File reader, and just enough of a writer to build test
// fixtures with. No dependencies, because the app has none and a song importer
// that drags in a parser is a song importer nobody can audit.
//
// Handles format 0 and 1, running status, sysex, and the meta events that
// matter for a score: tempo, time signature, track name. SMPTE division is
// rejected rather than guessed at.

export function parseMidi(buf) {
  let p = 0;
  const u32 = () => { const v = buf.readUInt32BE(p); p += 4; return v; };
  const u16 = () => { const v = buf.readUInt16BE(p); p += 2; return v; };
  const u8 = () => buf[p++];
  const tag = () => { const s = buf.toString('ascii', p, p + 4); p += 4; return s; };

  if (tag() !== 'MThd') throw new Error('not a MIDI file (no MThd header)');
  const headerLen = u32();
  const format = u16();
  const ntrks = u16();
  const division = u16();
  p += headerLen - 6;
  if (division & 0x8000) throw new Error('SMPTE time division is not supported; re-export with ticks per quarter note');
  const ticksPerQuarter = division;

  const tracks = [];
  const tempos = [{ tick: 0, usPerQuarter: 500000 }];   // 120bpm until told otherwise
  let timeSig = [4, 4];

  for (let t = 0; t < ntrks && p < buf.length; t++) {
    if (tag() !== 'MTrk') break;
    const len = u32();
    const end = p + len;
    let tick = 0, status = 0;
    const events = [];
    let trackName = '';

    while (p < end) {
      // variable length quantity
      let delta = 0;
      for (;;) { const b = u8(); delta = (delta << 7) | (b & 0x7f); if (!(b & 0x80)) break; }
      tick += delta;

      let b = buf[p];
      if (b & 0x80) { status = b; p++; } // else running status: reuse the last one
      const type = status & 0xf0;
      const channel = status & 0x0f;

      if (status === 0xff) {
        const meta = u8();
        let mlen = 0;
        for (;;) { const x = u8(); mlen = (mlen << 7) | (x & 0x7f); if (!(x & 0x80)) break; }
        const data = buf.subarray(p, p + mlen); p += mlen;
        if (meta === 0x51 && mlen === 3) tempos.push({ tick, usPerQuarter: (data[0] << 16) | (data[1] << 8) | data[2] });
        else if (meta === 0x58 && mlen >= 2) timeSig = [data[0], 2 ** data[1]];
        else if (meta === 0x03) trackName = data.toString('utf8').trim();
      } else if (status === 0xf0 || status === 0xf7) {
        let slen = 0;
        for (;;) { const x = u8(); slen = (slen << 7) | (x & 0x7f); if (!(x & 0x80)) break; }
        p += slen;
      } else if (type === 0x90 || type === 0x80) {
        const note = u8(), vel = u8();
        events.push({ tick, on: type === 0x90 && vel > 0, note, vel, channel });
      } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) { p += 2; }
      else if (type === 0xc0 || type === 0xd0) { p += 1; }
      else { throw new Error('unreadable MIDI event 0x' + status.toString(16) + ' at byte ' + p); }
    }
    p = end;
    tracks.push({ name: trackName, events });
  }

  tempos.sort((a, b) => a.tick - b.tick);
  // ☠️ THE PHANTOM 120. The default above is the spec's fallback for a file that
  // never states a tempo. A file that DOES state one at tick 0 was keeping the
  // default beside it, and tempoOf then averaged the two: Clair de Lune's
  // marked 60 shipped as 90, the Pathetique's 36 as 78, and every engraved
  // score in the library was taught too fast. A stated tempo replaces the
  // fallback; it never sits next to it.
  if (tempos.length > 1 && tempos[1].tick === 0) tempos.splice(0, 1);
  return { format, ticksPerQuarter, timeSig, tempos, tracks };
}

// Pair note-ons with note-offs and return notes in QUARTER-NOTE BEATS.
// Track and channel are kept, because a properly exported piano file usually
// says which hand plays what and that beats any algorithm we could write.
export function midiNotes(mid) {
  const out = [];
  mid.tracks.forEach((track, ti) => {
    const open = new Map();   // note+channel -> { tick, vel }
    for (const e of track.events) {
      const key = e.note * 16 + e.channel;
      if (e.on) {
        if (open.has(key)) closeNote(key, e.tick);       // re-struck without an off
        open.set(key, { tick: e.tick, vel: e.vel });
      } else closeNote(key, e.tick);
    }
    // anything still held at the end of the track stops there
    for (const key of [...open.keys()]) closeNote(key, lastTick(track));
    function lastTick(tr) { return tr.events.length ? tr.events[tr.events.length - 1].tick : 0; }
    function closeNote(key, tick) {
      const o = open.get(key); if (!o) return;
      open.delete(key);
      if (tick <= o.tick) return;
      out.push({ tick: o.tick, ticks: tick - o.tick, m: (key / 16) | 0, vel: o.vel, track: ti, channel: key % 16 });
    }
  });
  const q = mid.ticksPerQuarter;
  return out
    .map((n) => ({ ...n, b: n.tick / q, d: n.ticks / q }))
    .sort((a, b) => a.b - b.b || a.m - b.m);
}

// The average tempo in bpm. A piece with a big rubato tempo map cannot be
// taught at one number, so the caller is told the spread and decides.
export function tempoOf(mid, lastTick = null) {
  // ☠️ WEIGHTED BY TIME, NOT BY COUNT. A rubato score writes a tempo meta
  // every few ticks through a ritardando; counting those equally let a
  // two-bar slow-down set the number for a whole piece (Traumerei read 47
  // against its marked 60). Each tempo counts for the span it actually rules.
  const end = lastTick ?? Math.max(...mid.tracks.map((t) => t.events.length ? t.events[t.events.length - 1].tick : 0), mid.tempos[mid.tempos.length - 1].tick + 1);
  // ☠️ AND WEIGHTED BY TIME MEANS TOTAL BEATS OVER TOTAL TIME, not the mean of
  // the bpm values by tick span (Codex: four beats at 60 then four at 120 is
  // 8 beats in 6 seconds = 80, and the span-weighted mean says 90). The
  // number that makes the piece last as long as it really does is the one.
  let ticks = 0, us = 0;
  for (let i = 0; i < mid.tempos.length; i++) {
    const span = Math.max(0, (i + 1 < mid.tempos.length ? mid.tempos[i + 1].tick : end) - mid.tempos[i].tick);
    ticks += span; us += span * mid.tempos[i].usPerQuarter;
  }
  const bpms = mid.tempos.map((t) => 60000000 / t.usPerQuarter);
  return { bpm: Math.round(us ? 60000000 * ticks / us : bpms[0]),
    min: Math.round(Math.min(...bpms)), max: Math.round(Math.max(...bpms)), changes: mid.tempos.length - 1 };
}

// ---- writer, for test fixtures only ---------------------------------------
const vlq = (n) => {
  const bytes = [n & 0x7f];
  while ((n >>= 7) > 0) bytes.unshift((n & 0x7f) | 0x80);
  return Buffer.from(bytes);
};
const chunk = (id, body) => {
  const head = Buffer.alloc(8);
  head.write(id, 0, 'ascii');
  head.writeUInt32BE(body.length, 4);
  return Buffer.concat([head, body]);
};

// notes: [{ b, d, m, track }] in quarter beats
export function writeMidi({ notes, bpm = 100, timeSig = [4, 4], ticksPerQuarter = 480, tracks = 1 }) {
  const head = Buffer.alloc(6);
  head.writeUInt16BE(1, 0);                    // format 1
  head.writeUInt16BE(tracks + 1, 2);           // + the conductor track
  head.writeUInt16BE(ticksPerQuarter, 4);
  const us = Math.round(60000000 / bpm);
  const conductor = Buffer.concat([
    vlq(0), Buffer.from([0xff, 0x51, 0x03, (us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff]),
    vlq(0), Buffer.from([0xff, 0x58, 0x04, timeSig[0], Math.log2(timeSig[1]), 24, 8]),
    vlq(0), Buffer.from([0xff, 0x2f, 0x00]),
  ]);
  const chunks = [chunk('MThd', head), chunk('MTrk', conductor)];
  for (let t = 0; t < tracks; t++) {
    const evs = [];
    for (const n of notes.filter((x) => (x.track ?? 0) === t)) {
      evs.push({ tick: Math.round(n.b * ticksPerQuarter), bytes: [0x90, n.m, 90] });
      evs.push({ tick: Math.round((n.b + n.d) * ticksPerQuarter), bytes: [0x80, n.m, 0] });
    }
    evs.sort((a, b) => a.tick - b.tick || (a.bytes[0] & 0xf0) - (b.bytes[0] & 0xf0));
    let last = 0;
    const body = [];
    for (const e of evs) { body.push(vlq(e.tick - last), Buffer.from(e.bytes)); last = e.tick; }
    body.push(vlq(0), Buffer.from([0xff, 0x2f, 0x00]));
    chunks.push(chunk('MTrk', Buffer.concat(body)));
  }
  return Buffer.concat(chunks);
}
