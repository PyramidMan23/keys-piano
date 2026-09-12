// Descriptions are derived from recorded attempts, never from time in the app.
export function comparableAttempt(attempts, context) {
  return (Array.isArray(attempts)?attempts:[]).findLast(e=>e&&Number.isFinite(e.acc)&&Number.isFinite(e.t)&&
    e.start===context.start&&e.end===context.end&&e.whole===context.whole&&e.hand===context.hand&&
    Math.abs(e.tempo-context.tempo)<.001&&e.wait===context.wait)??null;
}
export function practiceConditions({hand,tempo,wait}) {
  return `${hand==='R'?'Right hand':hand==='L'?'Left hand':'Both hands'} · ${Math.round(tempo)}% tempo · help ${wait?'on':'off'}`;
}
export function attemptComparison(attempts, context) {
  const match=comparableAttempt(attempts,context);
  if(!match)return {label:'Your starting point',text:'Your next complete attempt will set a baseline for these settings.'};
  const date=new Date(match.t).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  return {label:'Last time, same settings',text:`${Math.round(match.acc)}% accuracy on ${date}. ${match.acc>=85?'Try to make it repeatable.':'Aim for one cleaner attempt.'}`};
}
export function recentEvidence(attempts) {
  return (Array.isArray(attempts)?attempts:[]).filter(e=>e&&Number.isFinite(e.acc)&&Number.isFinite(e.t)).slice(-5).reverse();
}
export function passageBounds(start,end,total) {
  if(![start,end,total].every(Number.isFinite)||start<0||end>total||end-start<.25)return null;
  return {start,end};
}
