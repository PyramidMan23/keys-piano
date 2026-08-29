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
