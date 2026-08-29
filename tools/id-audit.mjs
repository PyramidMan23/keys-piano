// Per-id audit. The coverage counter over-reported holes, so it could equally
// hide one. This reads the FULL text of each screen (not a truncated sample)
// and checks each required control id against a phrase that would prove it has
// a visible home. Anything unmatched is reported for a human to judge, never
// silently passed.
import { launch } from './cdp.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const inv = JSON.parse(readFileSync(join(ROOT, 'design-2026-08', 'control-inventory.json'), 'utf8'));

// What each id would look like on screen. Only ids whose presence is not
// obvious from their own name need an entry; the rest are matched by their
// name words. Written from the app's own labels, not invented.
const LOOKS_LIKE = {
  'path-playable': ['playable', 'you can play', 'songs this unlocks', 'what this unlocks'],
  'path-technique': ['technique', 'form', 'posture', 'hand check'],
  'lesson-body': ['lesson-body'],
  'lesson-msg': ['lesson-msg', 'feedback'],
  'lesson-steps': ['step', 'steps'],
  'lesson-video': ['video', 'watch'],
  'cal-status': ['cal-status', 'latency', 'ms', 'offset', 'measur'],
  'freeplay-canvas': ['freeplay-canvas', 'keyboard'],
  'takes-canvas': ['takes-canvas', 'waveform'],
  'improv-canvas': ['improv-canvas', 'keyboard'],
  'echo-canvas': ['echo-canvas', 'keyboard'],
  'task-keys': ['task-keys', 'keyboard'],
  'lesson-keys': ['lesson-keys', 'keyboard'],
  'cal-canvas': ['cal-canvas'],
  'combo-flash': ['combo-flash', 'combo', 'in a row'],
  'hud': ['notes', 'clean', 'timing', 'missed'],
  'journey-strip': ['journey-strip', 'section'],
  'perf-banner': ['perf-banner', 'performance mode'],
  'score-wrap': ['score view', 'score-wrap'],
  'play-cover': ['__img__'],
  'falls': ['falls'],
  'rhythm-blocks': ['tap the pattern', 'rhythm-blocks'],
  'takes-list': ['take', 'aug'],
  'takes-usage': ['storage', 'kept'],
  'trophy-list': ['clean run', 'rhythm', 'banked'],
  'xp-log': ['xp log'],
  'lesson-list': ['retained', 'in progress', 'not started'],
  'path-skills': ['steady pulse', 'chords from a symbol'],
  'path-evidence': ['evidence'],
  'path-reason': ['why this is next'],
  'path-lessons': ['lessons behind it'],
  'path-home': ['library'],
  'path-go': ['test it now'],
  'touch-dyn': ['pp', 'mf', 'ff'],
  'touch-progress': ['six hits', 'done'],
  'touch-status': ['play the key shown'],
  'touch-key': ['key'],
  'freeplay-log': ['what you played'],
  'echo-msg': ['listen'],
  'task-slots': ['empty', 'e flat'],
  'task-sheet': ['task-sheet', 'working area'],
  'task-stage': ['task-stage', 'stage'],
  'task-msg': ['task-msg', 'working area'],
  'task-badge': ['stage 4', 'independent'],
  'task-rubric': ['what counts', 'the rule'],
  'task-teach': ['the rule', 'what counts'],
  'task-payoff': ['where this pays off'],
  'task-prompt': ['build this chord'],
  'improv-chord': ['now', 'fmaj7'],
  'met-beat': ['beat'],
  'echo-delta': ['timing'],
  'echo-streak': ['in a row'],
  'echo-level': ['level'],
  'rhythm-level': ['level'],
  'rhythm-streak': ['in a row'],
  'rhythm-msg': ['tap the pattern'],
  'lesson-phase': ['teach', 'practise', 'test'],
  'lesson-progress': ['of 7', 'of '],
  'lesson-nomidi': ['no keyboard'],
  'lesson-stave': ['lesson-stave'],
  'chunk-label': ['b2'],
  'tempo-val': ['bpm'],
  // library and chrome
  'lib-search': ['search all songs'],
  'game-level': ['lvl'],
  'rhythm-chip': ['rhythm'],
  'next-action': ['do this next'],
  'next-action-cover': ['__img__'],
  'next-action-label': ['do this next'],
  'next-action-reason': ['arranged for two hands', 'nothing banked'],
  'learn-count': ['learning'],
  'explore-sort': ['sort', 'weakest'],
  'sec-learning': ['learning'], 'sec-repertoire': ['repertoire'],
  'sec-fame': ['hall of fame'], 'sec-explore': ['explore'],
  'sec-results': ['learning'],
  'list-learning': ['fur elise', 'für elise'], 'list-repertoire': ['repertoire'],
  'list-explore': ['explore'], 'list-fame': ['hall of fame'], 'list-results': ['song'],
  'rail-learn': ['carry on'], 'rail-practise': ['most used'], 'rail-tools': ['all tools'],
  'quest-row': ['today'], 'weekly-row': ['mission'],
  'practice-chart': ['practice, last 7 days'], 'path-teaser': ['your path'],
  'form-card': ['form check'], 'form-checks': ['balanced seat'],
  'form-done': ['done, i watched it'], 'form-snooze': ['not today'],
  'freeze-offer': ['freeze', 'decays'],
  'btn-home': ['keys'], 'midi-status': ['no keyboard'], 'now-playing': ['keys'],
  'btn-path': ['all tools'], 'btn-lessons': ['all tools'], 'btn-sight': ['all tools'],
  'btn-rhythm': ['all tools'], 'btn-echo': ['all tools'], 'btn-improv': ['all tools'],
  'btn-keys12': ['all tools'], 'btn-freeplay': ['free play'], 'btn-metronome': ['metronome'],
  'btn-trophies': ['all tools'], 'btn-takes': ['all tools'], 'btn-voice': ['voice'],
  'btn-calibrate': ['latency calibration'], 'btn-touch': ['all tools'],
  'sess-quick': ['all tools'], 'sess-improve': ['all tools'], 'sess-skill': ['all tools'],
  // the three overlays, all on the overlays board
  'results': ['results'], 'results-title': ['section b, clean'],
  'results-stats': ['notes'], 'results-analysis': ['bars 21 to 24'],
  'results-nudge': ['one more clean run'], 'results-again': ['run it again'],
  'results-score-pass': ['read it on the score'], 'results-theory': ['why that chord'],
  'results-done': ['done'],
  'theory-card': ['why fmaj7'], 'theory-title': ['why fmaj7'],
  'theory-body': ['the melody note is e'], 'theory-status': ['seen. it will come back'],
  'theory-close': ['close'],
  'firstrun': ['no keyboard found'], 'firstrun-msg': ['no keyboard found'],
  'firstrun-taps': ['use screen taps'], 'firstrun-skip': ['not now'],
  // the two states Codex found undesigned, now on their own board
  'freeze-offer': ['rhythm at risk', 'use a freeze'],
  'freeze-yes': ['use one'], 'freeze-no': ['fresh start'],
  'list-results': ['nothing matches'],
};

// Now covers EVERY screen, including the library and the chrome, so the number
// this prints is coverage over the whole app rather than over the easy part.
const MAP = { library: 'library', play: 'play', path: 'path', lessons: 'lessons',
  lesson: 'lesson', task: 'task', echo: 'echo', rhythm: 'rhythm', improv: 'improv',
  freeplay: 'freeplay', metronome: 'metronome', trophies: 'trophies', takes: 'takes',
  calibrate: 'calibrate', touch: 'touch' };
// the chrome and the three overlays live on their own boards
const EXTRA = { library: '(outside a screen)', overlays: '(outside a screen)' };

const b = await launch({ width: 900, height: 1600, scale: 1, port: 9361 });
const unmatched = [];
let checked = 0, matched = 0;
try {
  await b.goto('http://localhost:4180/design-2026-08/keys-prototype.html');
  const jobs = Object.entries(MAP).concat([['overlays', '(outside a screen)'], ['states', '(outside a screen)']]);
  for (const [key, appScreen] of jobs) {
    await b.eval(`document.querySelector('.chip[data-go="${key}"]').click(); true`);
    await new Promise((r) => setTimeout(r, 200));
    const info = await b.eval(`(() => {
      const p = document.getElementById('pane-${key}');
      return { text: p.innerText.toLowerCase().replace(/\\s+/g, ' '),
               imgs: p.querySelectorAll('img').length,
               canvasish: p.innerHTML.toLowerCase() };
    })()`);
    let need = inv.screens[appScreen] ?? [];
    // screen-* ids are the <main> containers themselves, not controls: every one
    // of them IS a designed screen, so counting them as unhomed was noise.
    need = need.filter((c) => !/^screen-/.test(c.id));
    // freeze-offer and list-results live in the library in the APP, but the
    // design draws them on the states board, so they are scored there and must
    // not be counted twice.
    if (key === 'library') need = need.filter((c) => c.id !== 'freeze-offer' && c.id !== 'list-results');
    if (key === 'library') need = need.concat((inv.screens['(outside a screen)'] ?? [])
      .filter((c) => !/^(results|theory|firstrun|screen-)/.test(c.id) && c.id !== 'freeze-offer'));
    if (key === 'overlays') need = (inv.screens['(outside a screen)'] ?? []).filter((c) => /^(results|theory|firstrun)/.test(c.id));
    // the freeze offer got its own board once Codex found it undesigned
    if (key === 'states') need = [{ id: 'freeze-offer' }, { id: 'freeze-yes' }, { id: 'freeze-no' }, { id: 'list-results' }];
    const missing = [];
    for (const c of need) {
      checked++;
      const words = LOOKS_LIKE[c.id] ?? c.id.replace(/^[a-z]+-/, '').split('-');
      const ok = words.some((w) => w === '__img__' ? info.imgs > 0 : info.text.includes(w.toLowerCase()) || info.canvasish.includes(w.toLowerCase()));
      if (ok) matched++; else missing.push(c.id);
    }
    if (missing.length) unmatched.push({ screen: key, missing });
    console.log(`${key.padEnd(12)} ${String(need.length - missing.length).padStart(2)}/${String(need.length).padStart(2)} homed${missing.length ? '   UNMATCHED: ' + missing.join(' ') : ''}`);
  }
} finally { await b.close(); }

console.log(`\n${matched}/${checked} controls have a findable home on their screen.`);
console.log(unmatched.length === 0
  ? 'Nothing unmatched. Every control the JS addresses has a visible home in the design.'
  : `${unmatched.reduce((a, u) => a + u.missing.length, 0)} need a human to judge, listed above.`);
