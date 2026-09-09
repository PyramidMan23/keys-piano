import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {renderVideoFrame} from './rawframe.mjs';
import {readings} from './reconciliation-2026-09-09/score-readings.mjs';
const base='tools/video-lane/reconciliation-2026-09-09';
const config=[['silksong','silksong','webm',70,2,'embers'],['gerudo-valley','z-gerudo-valley','mkv',120,4,'3d-blue-green'],['zeldas-lullaby','z-zeldas-lullaby','mkv',110,3,'synthesia-2019']];
mkdirSync(`${base}/scratch`,{recursive:true});
for(const [id,folder,ext,bpm,meter,temp] of config){
 if(process.argv[2]&&process.argv[2]!==id)continue;
 const dir=`C:/Users/markh/keys-piano-tools/video-lane/${folder}`;
 const geo=JSON.parse(readFileSync(`${dir}/geometry.json`));
 const raw=JSON.parse(readFileSync(`${base}/${id}.raw.json`)).events.filter(e=>e.colour!=='ambiguous');
 const T=JSON.parse(readFileSync(`tools/video-lane/templates/sheet-music-boss-${temp}.json`));
 const start=raw[0].on,beat=60/bpm,ledger=[];
 for(const [i,[bar,b,m,h,d]]of readings[id].entries()){
  const expected=start+((bar-1)*meter+b)*beat;
  const candidates=raw.filter(e=>e.midi===m && Math.abs(e.on-expected)<.08);
  const e=candidates.sort((a,b)=>Math.abs(a.on-expected)-Math.abs(b.on-expected))[0];
  const key=geo.keys.find(k=>k.midi===m),cx=Math.round((key.x0+key.x1)/2);
  const x=Math.max(0,Math.min(geo.width-384,cx-192)),y=geo.height-280;
  const seconds=expected+d*beat+.04;
  const frame=renderVideoFrame(`${dir}/video.${ext}`,seconds,`${base}/scratch/${id}-${i}.png`,
   `crop=384:280:${x}:${y},drawbox=x=${cx-x-1}:y=0:w=3:h=280:color=yellow:t=1`);
  ledger.push({sample:i+1,bar,beatWithinBar:b,midi:m,hand:h,writtenDurationBeats:d,
   expectedStrikeSeconds:expected,event:e??null,
   handAgrees:e?T.handMapping[e.colour]===h:null,
   tintDurationBeats:e?(e.off-e.on)/beat:null,
   status:e?'measured tint, finger release NOT established':'MISSING strike in key extraction',frame});
 }
 writeFileSync(`${base}/${id}.releases.json`,JSON.stringify(ledger,null,1));
}
execFileSync('C:/Users/markh/keys-piano-tools/venv/Scripts/python.exe',['-c',`
from PIL import Image, ImageDraw
import json,math
base='${base}'
for song in ['silksong','gerudo-valley','zeldas-lullaby']:
    if '${process.argv[2]??''}' and song != '${process.argv[2]??''}': continue
    data=json.load(open(base+'/'+song+'.releases.json'))
    sheet=Image.new('RGB',(1536,340*math.ceil(len(data)/4)),'white')
    draw=ImageDraw.Draw(sheet)
    for i,e in enumerate(data):
        x=(i%4)*384; y=(i//4)*340
        sheet.paste(Image.open(e['frame']['path']),(x,y+60))
        length='MISSING' if e['tintDurationBeats'] is None else str(round(e['tintDurationBeats'],3))
        draw.text((x+4,y+3),str(i+1)+' bar '+str(e['bar'])+' pitch '+str(e['midi'])+' '+e['hand'],fill='black')
        draw.text((x+4,y+20),'written '+str(e['writtenDurationBeats'])+' beat; tint '+length,fill='black')
        draw.text((x+4,y+37),'PTS '+str(e['frame']['presentationSeconds'])+' s, after written release',fill='black')
    sheet.save(base+'/'+song+'-releases.png')
`],{stdio:'inherit'});
