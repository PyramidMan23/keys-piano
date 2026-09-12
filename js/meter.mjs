// Convert the written meter to the units actually stored in note.b/note.d.
// Curated legacy pieces can use eighth-note units; MIDI imports use quarters.
export function beatsPerBar(song) {
  const [count,denominator]=song.timeSig??[4,4];
  return count*(song.noteBeatUnit||song.beatUnit||denominator)/denominator;
}
