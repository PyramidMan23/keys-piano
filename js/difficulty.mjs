// Song difficulty rating (Mark's ask 2026-08-28: "rank all songs by
// difficulty"). Rates the SONG's content, never the player, from measurable
// features only, each squashed into 0..1 so no single feature saturates the
// scale. Calibration is pinned by tests against library anchors (beginner
// pieces low, every group's Easy < Medium < Hard, the dense cover Hards top).
export function difficultyFeatures(song) {
  const notes = song.notes;
  const endBeat = Math.max(...notes.map((n) => n.b + n.d));
  const secs = endBeat * (60 / song.bpm);
  const nps = notes.length / secs; // notes per second at tempo
  const onsets = new Map();
  for (const n of notes) {
    const k = n.h + '|' + n.b;
    onsets.set(k, (onsets.get(k) ?? 0) + 1);
  }
  const chordFrac = [...onsets.values()].filter((c) => c >= 2).length / onsets.size;
  // coordination: fraction of RH onsets with an LH onset at the same instant, 
  // real hands-together moments, not "both hands appear somewhere in the bar"
  const lOnsets = new Set(notes.filter((n) => n.h === 'L').map((n) => n.b));
  const rOn = [...new Set(notes.filter((n) => n.h === 'R').map((n) => n.b))];
  const coord = rOn.length ? rOn.filter((b) => lOnsets.has(b)).length / rOn.length : 0;
  const blackFrac = notes.filter((n) => [1, 3, 6, 8, 10].includes(n.m % 12)).length / notes.length;
  const span = (Math.max(...notes.map((n) => n.m)) - Math.min(...notes.map((n) => n.m))) / 12;
  const offGrid = notes.filter((n) => Math.abs(n.b * 2 - Math.round(n.b * 2)) > 1e-6).length / notes.length;
  const minutes = secs / 60;
  // melodic variety: a two-note tremolo is far easier than its speed implies
  const variety = new Set(notes.map((n) => n.m)).size;
  return { nps, chordFrac, coord, blackFrac, span, offGrid, minutes, variety };
}

const sat = (v, cap) => Math.min(v, cap) / cap; // 0..1 with a ceiling
export function difficultyScore(song) {
  const f = difficultyFeatures(song);
  const score01 = (
    3.0 * sat(f.nps, 7) +
    1.6 * f.chordFrac +
    1.4 * f.coord +
    1.2 * sat(f.blackFrac, 0.4) +
    0.6 * sat(f.span, 5) +
    1.2 * sat(f.offGrid, 0.5) +
    0.5 * sat(f.minutes, 5) +
    1.0 * sat(f.variety, 25)
  ) / 10.5;
  return Math.max(1, Math.min(10, Math.round((1 + 9 * score01) * 10) / 10));
}
export const DIFF_BANDS = [
  [2.6, 'Beginner'], [4.0, 'Easy'], [5.4, 'Medium'], [6.8, 'Hard'], [Infinity, 'Expert'],
];
export function difficultyBand(score) {
  return DIFF_BANDS.find(([max]) => score < max)[1];
}
export function rankSongs(songs) {
  return songs
    .filter((s) => !s.ladder && !s.sightRead)
    .map((s) => ({ song: s, score: difficultyScore(s) }))
    .sort((a, b) => a.score - b.score);
}

// 🎬 Hall of fame: the screen songs (film / TV / game), curated provenance, 
// each entry names its screen source.
export const HALL_OF_FAME = [
  { group: 'interstellar', from: 'Interstellar (2014)' },
  { group: 'star-wars', from: 'Star Wars (1977)' },
  { group: 'pirates', from: 'Pirates of the Caribbean (2003)' },
  { group: 'see-you-again', from: 'Furious 7 (2015)' },
  { group: 'gangstas-paradise', from: 'Dangerous Minds (1995)' },
  { group: 'game-of-thrones', from: 'Game of Thrones (TV)' },
  { group: 'bella-ciao', from: 'Money Heist (TV) · Italian tradition' },
  { group: 'mario', from: 'Super Mario Bros. (game)' },
  { group: 'in-a-gadda-da-vida', from: 'The Simpsons (TV) · Iron Butterfly 1968' },
];

// Descriptive display only. The weighted score remains an internal sort heuristic.
export const difficultyLabel = (song) => difficultyBand(difficultyScore(song));

// Run C: measurable demands, not an arrangement or fingering review.
// Beat values use the same unit as the song's authored note positions.
// A phrase here is a continuous sounding span between complete rests.
export function songDemands(song) {
  const notes = song?.notes;
  if (!notes?.length || !Number.isFinite(song.bpm) || song.bpm <= 0 || song.freeTime ||
    notes.some(n => !Number.isFinite(n.b) || !Number.isFinite(n.d) || n.d <= 0 ||
      !Number.isFinite(n.m) || !['L','R'].includes(n.h))) return null;
  const sorted = [...notes].sort((a,b)=>a.b-b.b);
  let start=sorted[0].b, end=start, longestPhrase=0;
  for (const n of sorted) {
    if (n.b > end + 1e-6) { longestPhrase=Math.max(longestPhrase,end-start); start=n.b; }
    end=Math.max(end,n.b+n.d);
  }
  longestPhrase=Math.max(longestPhrase,end-start);
  const events=notes.flatMap((n,i)=>[{b:n.b,on:true,n,i},{b:n.b+n.d,on:false,n,i}])
    .sort((a,b)=>a.b-b.b || Number(a.on)-Number(b.on));
  const held={L:new Map(),R:new Map()}, reach={L:0,R:0}; let bothHands=false;
  for (const e of events) {
    if (e.on) held[e.n.h].set(e.i,e.n.m); else held[e.n.h].delete(e.i);
    const pitches=[...held[e.n.h].values()];
    if (pitches.length) reach[e.n.h]=Math.max(reach[e.n.h],Math.max(...pitches)-Math.min(...pitches));
    if (held.L.size && held.R.size) bothHands=true;
  }
  return {shortestNote:Math.min(...notes.map(n=>n.d)),reach,bothHands,longestPhrase,tempo:song.bpm};
}
export function demandsFit(need, met) {
  return !!need && !!met && need.shortestNote >= met.shortestNote && need.tempo <= met.tempo &&
    (met.rate == null || need.tempo/need.shortestNote <= met.rate + 1e-6) && need.reach.L <= met.reach.L && need.reach.R <= met.reach.R &&
    (!need.bothHands || met.bothHands) && need.longestPhrase <= met.longestPhrase + 1e-6;
}

// Temporal demands require timed, unassisted evidence. Guided playing can
// establish only the encountered key spans and hands, never the printed tempo.
export function metSongDemands(st, songs) {
  const met={shortestNote:Infinity,reach:{L:0,R:0},bothHands:false,longestPhrase:0,tempo:0,rate:0,sources:[]};
  const add=(d,title,timed=true)=>{
    if (!d) return;
    met.reach.L=Math.max(met.reach.L,d.reach.L); met.reach.R=Math.max(met.reach.R,d.reach.R);
    met.bothHands ||= d.bothHands;
    if (timed) {
      met.rate=Math.max(met.rate,d.tempo/d.shortestNote);
      met.shortestNote=Math.min(met.shortestNote,d.shortestNote); met.tempo=Math.max(met.tempo,d.tempo);
      met.longestPhrase=Math.max(met.longestPhrase,d.longestPhrase);
      met.sources.push({title,demands:d});
    }
  };
  const records=x=>Array.isArray(x) ? x : [];
  const passed=id=>records(st.mastery?.[id]?.evidence).some(e=>e?.passed === true && e.assisted === false);
  if (passed('pulse')) add({shortestNote:1,reach:{L:0,R:0},bothHands:false,longestPhrase:8,tempo:70},'your steady-pulse check');
  if (passed('chord-symbol') || passed('inversion')) met.reach.R=7;
  if (passed('two-hand')) {met.bothHands=true;met.reach.R=Math.max(met.reach.R,7);}
  if (passed('lead-sheet')) add({shortestNote:4,reach:{L:0,R:7},bothHands:true,longestPhrase:16,tempo:60},'your lead-sheet check');
  for (const song of songs) {
    if (st.playable?.[song.id]?.provenAt) add(songDemands(song),song.title);
    for (const proof of Object.values(st.pathProofs ?? {})) {
      if (proof?.songId !== song.id || !(proof.acc >= 85)) continue;
      const section=song.sections?.find(s=>s.name===proof.section);
      if (!section) continue;
      const notes=song.notes.filter(n=>n.b>=section.startBeat && n.b<section.endBeat)
        .map(n=>({...n,d:Math.min(n.d,section.endBeat-n.b)}));
      add(songDemands({...song,notes}),song.title + ', ' + section.name);
    }

    for (const e of records(st.songs?.[song.id]?.attempts)) {
      if (!e?.passed || !Number.isFinite(e.start) || !Number.isFinite(e.end)) continue;
      const notes=song.notes.filter(n=>n.b>=e.start && n.b<e.end && (e.hand==='both' || n.h===e.hand))
        .map(n=>({...n,d:Math.min(n.d,e.end-n.b)}));
      add(songDemands({...song,notes,bpm:song.bpm*e.tempo/100}),song.title,e.assisted===false);
    }
    for (const e of records(st.journeys?.[song.id]?.passes)) {
      if (!e || e.pass==='hear' || !Number.isFinite(e.acc) || e.acc < (e.pass==='lap70' ? 70 : 85)) continue;
      const section=e.section ? song.sections?.find(x=>x.name===e.section) : null;
      if (e.section && !section) continue;
      const notes=song.notes.filter(n=>(e.hand==='both' || n.h===e.hand) &&
        (!section || n.b>=section.startBeat && n.b<section.endBeat))
        .map(n=>section ? {...n,d:Math.min(n.d,section.endBeat-n.b)} : n);
      add(songDemands({...song,notes,bpm:song.bpm*e.tempo/100}),song.title,e.wait===false && Number.isFinite(e.tempo));
    }
  }
  return met;
}
export function demandConnection(song, met) {
  const need=songDemands(song);
  if (!demandsFit(need,met)) return null;
  const source=met.sources.find(s=>demandsFit(need,s.demands));
  return source
    ? `Your timed pass in ${source.title} covers this piece's note lengths, hand spans and phrase length at ${need.tempo} beats per minute${need.bothHands ? ', with both hands together' : ''}.`
    : `Your recorded playing covers this piece's note lengths, hand spans and phrase length at ${need.tempo} beats per minute${need.bothHands ? ', with both hands together' : ''}.`;
}
