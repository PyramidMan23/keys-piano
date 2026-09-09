import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {renderVideoFrame} from './rawframe.mjs';
const [id,folder,ext,kind='joint']=process.argv.slice(2);
const label=kind==='joint'?id:`${id}-${kind}`;
const base='tools/video-lane/reconciliation-2026-09-09';
const dir=`C:/Users/markh/keys-piano-tools/video-lane/${folder}`;
const geo=JSON.parse(readFileSync(`${dir}/geometry.json`));
const candidates=JSON.parse(readFileSync(`${base}/${id}.${kind}-candidates.json`));
mkdirSync(`${base}/scratch`,{recursive:true});
for(const [i,e] of candidates.entries()){
 const k=geo.keys.find(k=>k.midi===e.midi),cx=Math.round((k.x0+k.x1)/2);
 const x=Math.max(0,Math.min(geo.width-256,cx-128)),y=geo.height-400;
 e.frames=[];
 for(const [j,dt]of [-.08,.035].entries()) e.frames.push(renderVideoFrame(`${dir}/video.${ext}`,e.strike+dt,
  `${base}/scratch/${label}-candidate-${i}-${j}.png`,
  `crop=256:400:${x}:${y},drawbox=x=${cx-x}:y=180:w=1:h=220:color=yellow:t=1`));
}
writeFileSync(`${base}/${label}.candidate-frames.json`,JSON.stringify(candidates,null,1));
execFileSync('C:/Users/markh/keys-piano-tools/venv/Scripts/python.exe',['-c',`
from PIL import Image,ImageDraw
import json,math
base='${base}'; song='${label}'
data=json.load(open(base+'/'+song+'.candidate-frames.json'))
for page in range(math.ceil(len(data)/12)):
    sheet=Image.new('RGB',(1536,1728),'white'); draw=ImageDraw.Draw(sheet)
    for local,e in enumerate(data[page*12:page*12+12]):
        x=(local%3)*512; y=(local//3)*432
        draw.text((x+3,y+3),'#'+str(page*12+local)+' pitch '+str(e['midi'])+' '+e['colour']+' strike '+str(round(e['strike'],4)),fill='black')
        draw.text((x+3,y+17),'PTS '+str(e['frames'][0]['presentationSeconds'])+' / '+str(e['frames'][1]['presentationSeconds']),fill='black')
        for j,f in enumerate(e['frames']): sheet.paste(Image.open(f['path']),(x+j*256,y+32))
    sheet.save(base+'/'+song+'-candidates-'+str(page+1).zfill(2)+'.png')
`],{stdio:'inherit'});
