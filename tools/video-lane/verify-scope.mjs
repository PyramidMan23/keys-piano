// Read the baseline from git without modifying git state. Compare literal
// serialized song objects, not normalized JavaScript values.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const allowed=new Set(['silksong','gerudo-valley','zeldas-lullaby']);
const before=execFileSync('git',['show','20c68dd:js/songs-imported.mjs'],{encoding:'utf8',maxBuffer:32*1024*1024});
const after=readFileSync('js/songs-imported.mjs','utf8');
const blocks=text=>new Map([...text.matchAll(/^ \{\r?\n[\s\S]*?^ \}/gm)].map(m=>{const s=JSON.parse(m[0]);return[s.id,{group:s.group??s.id,text:m[0],notes:s.notes}];}));
const a=blocks(before),b=blocks(after),unchanged=[],changed=[];
const hash=s=>createHash('sha256').update(s).digest('hex');
if(!a.size||a.size!==b.size)throw Error('Song count changed or block parser failed');
for(const [id,old]of a){
 const next=b.get(id);if(!next)throw Error('Missing song '+id);
 if(!allowed.has(old.group)){
  if(old.text!==next.text)throw Error('Outside-scope song changed: '+id);
  unchanged.push({id,group:old.group,sha256:hash(old.text)});
 }else changed.push({id,notesIdentical:JSON.stringify(old.notes)===JSON.stringify(next.notes),before:old.notes.length,after:next.notes.length});
}
const result={baseline:'20c68dd',method:'Literal top-level serialized object byte comparison; SHA-256 means Secure Hash Algorithm with a 256-bit digest.',unchangedGroups:new Set(unchanged.map(s=>s.group)).size,unchangedTiers:unchanged.length,unchanged,reviewedGroups:changed};
writeFileSync('tools/video-lane/reconciliation-2026-09-09/scope-proof.json',JSON.stringify(result,null,1)+'\n');
console.log(`${result.unchangedGroups} other groups / ${result.unchangedTiers} tiers are byte-identical.`,changed);
