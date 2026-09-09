// Reproduce the review without touching app data unless explicitly requested.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {IMPORTED} from '../../js/songs-imported.mjs';
const base='tools/video-lane/reconciliation-2026-09-09';
const configs=[
 ['silksong','tDT7qpAaRx0',70,2,'embers','Samuel Dickenson, Silksong end-card engraving, Flowing quarter = 70, presentation timestamp 89 seconds','Silksong end-card engraving by Samuel Dickenson: bars 1-4 note and staff comparison; further visible staves through bar 15 inspected. Red = right, grey = left. Whole-song sounding-span test: zero.'],
 ['gerudo-valley','Sna0iom85IU',120,4,'3d-blue-green','Andrew Wrangell, Gerudo Valley end-card engraving, Moderately fast quarter = 120, presentation timestamp 164 seconds','Gerudo Valley end-card engraving by Andrew Wrangell: bars 1-4 chords and bass, bars 5-6 melody and accompaniment inspected. Green = right, blue = left. Later engraved bars are not shown; whole-song held-span validation fails.'],
 ['zeldas-lullaby','O6MtYbfo1eY',110,3,'synthesia-2019',"Sheet Music Boss, Zelda's Lullaby end-card engraving, Flowing quarter = 110, presentation timestamp 190 seconds", "Zelda's Lullaby end-card engraving: bars 1-6 note and staff comparison; further visible staves through bar 20 inspected. Blue = left, green = right. Arranger name not shown. Whole-song held-span validation fails."],
];
for(const [id,videoId,bpm,meter,temp,bpmSource,handsSource] of configs){
 if(process.argv.includes('--id')&&process.argv[process.argv.indexOf('--id')+1]!==id)continue;
 const original=IMPORTED.find(s=>s.group===id&&s.level==='Hard');
 const source=id==='gerudo-valley'
  ? original.source.split('; Hard is the arranger')[0].split('; Reconciliation 2026-09-09')[0] + '; Reconciliation 2026-09-09: 1732 reviewed video strikes. See per-tier reconciliation for omissions. Held durations remain UNVERIFIED; the reach and tempo exemption does not certify releases or permit crossed hands.'
  : original.source;
 const evidence={videoId,handsSource,reconciledAt:'2026-09-09',status:'Reviewed whole-video onset candidates; complete engraved hand proof and physical release fidelity remain UNVERIFIED'};
 writeFileSync(`${base}/${id}.evidence.json`,JSON.stringify(evidence,null,1)+'\n');
 const midi=`${base}/${id}.mid`,template=`tools/video-lane/templates/sheet-music-boss-${temp}.json`;
 const run=args=>execFileSync(process.execPath,args,{stdio:'inherit'});
 run(['tools/video-lane/to-import.mjs',`${base}/${id}.reviewed.json`,template,'--bpm',String(bpm),'--bpm-source',bpmSource,'--meter',String(meter),'--evidence',`${base}/${id}.evidence.json`,'--out',midi]);
 // Metadata-only mode records the known missing notes against the full reviewed
 // reference, keeping note arrays unchanged while a fingering scope decision is pending.
 let input=midi;
 if(process.argv.includes('--metadata-only')){
  input=`${base}/${id}.accepted.mid`;
  run(['tools/video-lane/to-import.mjs',`${base}/${id}.raw.json`,template,'--bpm',String(bpm),'--bpm-source',bpmSource,'--meter',String(meter),'--out',input]);
 }
 run(['tools/import-midi.mjs',input,'--id',id,'--title',original.title,'--composer',original.composer,
  '--source',source,...(original.key?['--key',original.key]:[]),'--video-hands','--video-metadata',midi+'.video.json',
  '--preview-json',`${base}/${id}.import-preview.json`,...(process.argv.includes('--apply')?[]:['--dry'])]);
}
