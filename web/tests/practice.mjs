// The Play along judge (src/practice.ts) around a mash (review 2026-10-14, F11): in fast music (sixteenths at 120, a
// step every 125 ms) a quarter-second burst can start a step or two before the step the pause lands on, and its first
// keys were counted as wrong keys in the summary. Driven with a stand-in score view, as the score screen drives it
// (its pause handler: forgetMash, then suspend). Run: npm run check:practice.
globalThis.window = globalThis;
const { Practice } = await import('../src/practice.ts');
const STEP = 125, N = 40;
const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` — ${detail}`}`); if (!ok) failures.push(name); };

function run(burstStart, alsoRight) {
  let now = 0, index = 0;
  const view = {
    get index() { return index; }, get stepCount() { return N; }, playing: true, songClock: null,
    stepT: (i) => i * STEP, struckAt: (i) => (i < N ? [60 + (i % 2) * 2] : []), durationsAt: () => [STEP], gracesAt: () => [],
    loopRange: (a, b) => ({ a: Math.floor(a / 8) * 8, b: Math.floor(b / 8) * 8 + 7 }),
    songNow: () => now, goTo: (i) => { index = i; }, pause() {}, play() {}, set onReached(_) {},
  };
  const p = new Practice(view, { stop() {} }, {}, () => ({ mode: 'along', hands: 'both', speed: 1, onTime: 'normal' }));
  let summary = null;
  p.onSummary = (s) => { summary = s; };
  p.onAutoPause = (reason, step) => { if (reason === 'mash') p.forgetMash(performance.now()); p.suspend(step); index = step; };
  p.startAlong();
  const press = (midi, t) => { now = t; index = Math.min(N - 1, Math.floor(t / STEP)); p.key({ midi, on: true, time: performance.now() }); };
  for (let i = 0; i < 8; i++) press(60 + (i % 2) * 2, i * STEP); // steps 0–7 played right
  if (alsoRight) press(60, 8 * STEP); // step 8's note, right on time, inside the burst's quarter second
  for (let k = 0; k < 6; k++) press(40 + k, burstStart + k * 40); // the mash: six keys not in the score, 40 ms apart
  p.finishRun();
  return summary;
}
for (const start of [1020, 1060, 1130]) {
  const s = run(start, false);
  check(`a mash from ${start} ms (spanning a step boundary) counts none of its keys as wrong`, s?.wrong === 0, `wrong ${s?.wrong}, extra ${JSON.stringify(s?.extra)}`);
}
const kept = run(1010, true);
check('a right note played inside the burst’s quarter second still counts as played on time', kept?.onTime === 9 && kept?.wrong === 0, `onTime ${kept?.onTime}, wrong ${kept?.wrong}`);

console.log(failures.length ? `${failures.length} failed` : 'all passed');
process.exit(failures.length ? 1 : 0);
