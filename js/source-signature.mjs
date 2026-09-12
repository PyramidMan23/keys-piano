// Drift detection, not a security hash. The source file itself carries SHA-256.
export function songSignature(song) {
  const text=JSON.stringify([song.bpm,song.beatUnit,song.timeSig,song.notes.map(n=>[n.b,n.d,n.m,n.h])]);
  let hash=2166136261;
  for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
  return `${song.notes.length}:${text.length}:${(hash>>>0).toString(16)}`;
}
