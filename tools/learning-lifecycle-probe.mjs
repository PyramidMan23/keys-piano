import { launch } from './cdp.mjs';
const ORIGIN=process.env.KEYS_TEST_ORIGIN ?? 'http://localhost:4180';
const b=await launch({width:1400,height:1000});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function check(name,pass,value){console.log(`${pass?'PASS':'FAIL'} ${name} ${JSON.stringify(value)}`);if(!pass)process.exitCode=1;}
try {
 await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.__questFrames=new Set();
 const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
 window.requestAnimationFrame=function(fn){const quest=new Error().stack.includes('drawQuestKeys');let id=request(t=>{window.__questFrames.delete(id);fn(t)});if(quest)window.__questFrames.add(id);return id;};
 window.cancelAnimationFrame=function(id){window.__questFrames.delete(id);return cancel(id);};`});
 await b.goto(ORIGIN + '/');await b.ready();
 await b.eval(`localStorage.setItem('keys-v1',JSON.stringify({firstRunDone:true,diagnosticDone:1,songs:{},days:[]}));true`);
 await b.goto(ORIGIN + '/');await b.ready();
 await b.eval(`window.__learning.openQuest('nt-flats','guided');true`);await pause(300);
 let n=await b.eval('window.__questFrames.size');check('one quest animation loop',n===1,n);
 await b.eval(`document.getElementById('quest-kb').click();document.getElementById('quest-kb').click();document.getElementById('quest-kb').click();document.getElementById('quest-kb').click();true`);await pause(250);
 n=await b.eval('window.__questFrames.size');check('reopening keyboard never multiplies animation',n===1,n);
 await b.eval(`window.__show('play');true`);await pause(250);
 n=await b.eval('window.__questFrames.size');check('hidden quest stops animation',n===0,n);
 await b.eval(`(async()=>{const m=await import('./js/reading-session.mjs');const st=JSON.parse(localStorage.getItem('keys-v1'));st.sight=m.emptyReading();st.sight.reads=[{t:Date.now(),level:1,contentKey:'restore-fixture',mode:'guided',verdict:'clean',completed:true,independent:false,proof:false,scope:'whole',scopeFull:true,tempoPct:100,pitch:{correct:4,required:4,wrong:0,missed:0},rhythm:{measured:false,reason:'Guided reading'},continuity:{longestRun:4,stumbles:0},contaminants:[]}];localStorage.setItem('keys-v1',JSON.stringify(st));return true})()`);
 await b.goto(ORIGIN + '/');await b.ready();
 await b.eval(`window.__learning.openReading();true`);await pause(250);
 const result=await b.eval(`({hidden:document.getElementById('reading-result').hidden,rows:document.getElementById('reading-result-rows').children.length,text:document.getElementById('reading-result').textContent,milestones:document.querySelectorAll('#reading-result .lw-milestone').length})`);
 check('reload restores measured reading summary without replaying a milestone',!result.hidden&&result.rows===3&&/4 \/ 4/.test(result.text)&&/guided practice/.test(result.text)&&result.milestones===0,result);
} finally {await b.close();}
