import { SOURCE_CHECKS } from './source-checks.mjs';
import { songSignature } from './source-signature.mjs';
export function musicSource(song) {
  const saved=SOURCE_CHECKS[song.id];
  const check=saved?.songSignature===songSignature(song)?saved:null;
  const rows=[['Arrangement',song.source||'Prepared for Keys; no external edition recorded'],
    ['Hands',song.handAssignment==='generated'||song.handsRepaired?'Computer-assigned or adjusted; not an editor’s hand assignment':song.handAssignment||'No independent hand comparison recorded'],
    ['Timing',song.freeTime?'Performance timing; meter unverified':song.meterVerified||`${(song.timeSig??[4,4]).join('/')} · ${song.bpm} BPM for this tier${song.timeSig?'':' (default meter; no independent check)'}`],
    ['Fingering',song.fingeringDerived?'Suggested by hand-movement rules; not editorial fingering':'Prepared fingering; independent edition check not recorded']];
  if(check){rows.push(['Source comparison',`${check.matched} of ${check.notes} shipped note onsets match within 0.126 quarter beats; ${check.missing} source onsets omitted.`]);
    rows.push(['Durations',`${check.durationMatches} matching notes also have the source duration (within 1/32 beat).`]);
    rows.push(['Source staves',check.handCompared?`${check.handMatches} of ${check.handCompared} compared notes retain the source staff mapping. ${check.documentedAdjustments??0} use recorded Keys hand adjustments; ${check.unexplainedHands??0} unexplained differences. Staff labels alone do not prove the intended playing hand.`:'No usable staff mapping recorded; no hand-fidelity claim.']);}
  else rows.push(['Source comparison','No complete source-file comparison recorded for this tier.']);
  return {label:check?'Source comparison available':'Arrangement needs source review',rows};
}
