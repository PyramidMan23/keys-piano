import assert from 'node:assert/strict';
import {notationModel,notationKey,spellPitch,splitDuration} from '../js/notation.mjs';
import {attemptComparison,comparableAttempt,passageBounds,recentEvidence} from '../js/practice-insight.mjs';
import {parseMidi} from '../tools/midi.mjs';
import {musicSource} from '../js/music-source.mjs';
import {SONGS} from '../js/songs.mjs';
import {SOURCE_CHECKS} from '../js/source-checks.mjs';
import {beatsPerBar} from '../js/meter.mjs';
import {chunkRange} from '../js/engine.mjs';
const keyMidi=Buffer.from('4d546864000000060000000101e04d54726b0000000a00ff5902fe0000ff2f00','hex');
assert.deepEqual(parseMidi(keyMidi).keySignatures,[{tick:0,key:'Bb'}]);
assert.equal(notationKey('B♭ major'),'Bb');
assert.equal(spellPitch(70,'Bb'),'bb/4');
assert.equal(spellPitch(65,'F#'),'e#/4');
assert.equal(notationKey('guessed'),null);
assert.deepEqual(splitDuration(3.5,1.5,4).map(p=>[p.at,p.q]),[[3.5,.5],[4,1]]);
const song={key:'F major',beatUnit:8,timeSig:[6,8],notes:[{b:0,d:1,m:70,h:'R'},{b:1,d:1,m:72,h:'R'},{b:4,d:4,m:53,h:'L'}]};
const model=notationModel(song);
assert.equal(model.barLength,3);assert.equal(model.bars,2);
assert.equal(model.tracks.R[0][0].reduce((s,n)=>s+n.q,0),3);
assert.ok(model.tracks.L[0][0].some(n=>n.tieTo));
assert.ok(model.tracks.L[0][1].some(n=>n.tieFrom));
assert.ok(notationModel({...song,freeTime:true}).reason);
assert.ok(!notationModel({...song,notes:[{b:0,d:1/3,m:60,h:'R'}]}).reason);
assert.ok(notationModel({...song,notes:[{b:0,d:1/7,m:60,h:'R'}]}).reason);
const context={start:0,end:4,whole:false,hand:'R',tempo:80,wait:true};
const old={...context,t:Date.now()-86400000,acc:65};
assert.equal(comparableAttempt([old,{...old,hand:'both',acc:100}],context),old);
assert.equal(comparableAttempt([old],{...context,wait:false}),null);
assert.equal(comparableAttempt([old],{...context,whole:true}),null);
assert.match(attemptComparison([],context).text,/baseline/);
assert.equal(recentEvidence([null,{t:NaN,acc:3},old]).length,1);
assert.equal(passageBounds(8,4,12),null);assert.equal(passageBounds(0,13,12),null);
assert.deepEqual(passageBounds(0,4,12),{start:0,end:4});
const audited=SONGS.find(s=>SOURCE_CHECKS[s.id]);
assert.equal(musicSource(audited).label,'Source comparison available');
const changed={...audited,notes:audited.notes.map((n,i)=>i? n:{...n,m:n.m+1})};
assert.equal(musicSource(changed).label,'Arrangement needs source review','Changed notes invalidate source claims');
assert.equal(notationModel(changed).key,notationKey(changed.key),'Changed notes cannot inherit audited key');
for(const s of SONGS)assert.ok(!JSON.stringify(musicSource(s)).includes('undefined'));
const compound=notationModel({noteBeatUnit:4,beatUnit:8,timeSig:[6,8],notes:[{b:0,d:3,m:60,h:'R'}]});
assert.equal(compound.factor,1);assert.equal(compound.bars,1);
assert.equal(beatsPerBar({timeSig:[9,8],noteBeatUnit:4}),4.5);
assert.equal(beatsPerBar({timeSig:[3,8],beatUnit:8}),3);
assert.equal(chunkRange({timeSig:[9,8],noteBeatUnit:4,notes:[{b:0,d:36}]},1,2).start,9);
for(const id of ['mario','mario-hard','star-wars','zelda-main-theme','zelda-main-theme-easy','zelda-main-theme-hard']){
  const s=SONGS.find(s=>s.id===id),before=JSON.stringify(s.notes),m=notationModel(s);
  assert.ok(!m.reason,id+' has engraved triplets');
  let tuplets=0;
  for(const voices of Object.values(m.tracks))for(const voice of voices)for(const bar of voice){
    assert.ok(Math.abs(bar.reduce((sum,e)=>sum+e.q,0)-m.barLength)<1e-6,id+' voice fills its bar');
    const groups=Object.groupBy(bar.filter(e=>e.tuplet),e=>e.tuplet);
    for(const group of Object.values(groups)){assert.equal(group.length,3);tuplets++;}
  }
  assert.ok(tuplets>0);assert.equal(JSON.stringify(s.notes),before,'Engraving never changes playback');
}
for(const [id,check] of Object.entries(SOURCE_CHECKS)){
  assert.equal(check.matched,check.notes,id+' source onsets match');
  assert.equal(check.unexplainedHands,0,id+' hand changes have correction records');
  assert.equal(check.handMatches+check.documentedAdjustments,check.handCompared);
}
console.log('PASS notation, compound meter, ties, source-safe fallback and honest attempt comparisons');
