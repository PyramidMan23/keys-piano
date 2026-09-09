// Reconcile each tier against the full reviewed video reference. Easier tiers
// deliberately omit notes; their missing count is not silently set to zero.
export function reconciliationFor(notes, evidence) {
  const used = new Set(), moves = [];
  let missing = 0, handDisagreements = 0;
  for (const e of evidence.reference) {
    const i = notes.findIndex((n, i) => !used.has(i) && n.b === e.b && n.m === e.m);
    if (i < 0) { missing++; continue; }
    used.add(i);
    if (notes[i].h !== e.h) handDisagreements++;
    moves.push(Math.abs(e.onsetMs - notes[i].b * 60000 / evidence.sourceBpm));
  }
  moves.sort((a, b) => a - b);
  return { videoEvents: evidence.reference.length, shipped: notes.length,
    missing, extra: notes.length - used.size, handDisagreements,
    onsetMedianMs: moves.length ? +moves[Math.floor(moves.length / 2)].toFixed(6) : null,
    onsetWorstMs: moves.length ? +moves.at(-1).toFixed(6) : null };
}
export function videoProvenance(notes, evidence) {
  for (const k of ['videoId', 'bpmSource', 'handsSource', 'reconciledAt', 'status']) {
    if (typeof evidence[k] !== 'string' || !evidence[k].trim()) throw Error(`Missing video evidence: ${k}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(evidence.reconciledAt) || !Number.isFinite(Date.parse(evidence.reconciledAt))) throw Error('Invalid reconciliation date');
  if (!(evidence.sourceBpm > 0) || !Array.isArray(evidence.reference) || !evidence.reference.length) throw Error('Invalid video reference');
  const seen = new Set();
  for (const e of evidence.reference) {
    const key = `${e.b}:${e.m}`;
    if (!Number.isFinite(e.b) || !Number.isFinite(e.onsetMs) || !Number.isInteger(e.m) || !['L', 'R'].includes(e.h) || seen.has(key)) throw Error('Invalid or duplicate video reference event');
    seen.add(key);
  }
  const {videoId, bpmSource, handsSource, reconciledAt} = evidence;
  return {videoId, bpmSource, handsSource, reconciledAt,
    reconciliation: reconciliationFor(notes, evidence), reconciliationStatus: evidence.status};
}
