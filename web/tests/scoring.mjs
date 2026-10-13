// Play along's matching rule (src/matching.ts) on hand-made cases, including the ones a review found the
// first rule got wrong. Run: npm run check:scoring (Node 22.18+ runs the TypeScript file directly).
import { judge, judgeRhythm } from '../src/matching.ts';

const cases = [
  {
    name: 'all on time',
    steps: [{ t: 0, keys: [60] }, { t: 500, keys: [62] }],
    played: [{ midi: 60, t: 20, speed: 1 }, { midi: 62, t: 480, speed: 1 }],
    tol: 100, want: { total: 2, onTime: 2, early: 0, late: 0, missed: 0, wrong: 0 },
  },
  {
    name: 'a note within tolerance but after the next note was due still counts (fast passage)',
    steps: [{ t: 0, keys: [60] }, { t: 125, keys: [62] }],
    played: [{ midi: 62, t: 125, speed: 1 }, { midi: 60, t: 160, speed: 1 }],
    tol: 200, want: { total: 2, onTime: 2, early: 0, late: 0, missed: 0, wrong: 0 },
  },
  {
    name: 'a press goes to the nearer of two written notes of its key',
    steps: [{ t: 0, keys: [60] }, { t: 500, keys: [60] }],
    played: [{ midi: 60, t: 0, speed: 1 }, { midi: 60, t: 475, speed: 1 }],
    tol: 100, want: { total: 2, onTime: 2, early: 0, late: 0, missed: 0, wrong: 0 },
  },
  {
    name: 'the same key written in both hands at once is one press',
    steps: [{ t: 0, keys: [60, 60] }],
    played: [{ midi: 60, t: 10, speed: 1 }],
    tol: 100, want: { total: 1, onTime: 1, early: 0, late: 0, missed: 0, wrong: 0 },
  },
  {
    name: 'late, early, missed and wrong',
    steps: [{ t: 0, keys: [60] }, { t: 1000, keys: [62] }, { t: 2000, keys: [64] }, { t: 3000, keys: [65] }],
    played: [{ midi: 60, t: 300, speed: 1 }, { midi: 62, t: 700, speed: 1 }, { midi: 61, t: 2000, speed: 1 }],
    tol: 100, want: { total: 4, onTime: 0, early: 1, late: 1, missed: 2, wrong: 1 },
  },
  {
    name: 'timing is judged as heard: 50 ms of song time at half speed is 100 ms',
    steps: [{ t: 0, keys: [60] }, { t: 1000, keys: [62] }],
    played: [{ midi: 60, t: 50, speed: 0.5 }, { midi: 62, t: 1040, speed: 1 }],
    tol: 80, want: { total: 2, onTime: 1, early: 0, late: 1, missed: 0, wrong: 0 },
  },
  {
    name: 'rhythm: any key counts, a chord pressed as a chord is one tap',
    rhythm: true,
    steps: [{ t: 0, keys: [60, 64, 67] }, { t: 500, keys: [62] }],
    played: [{ midi: 48, t: 5, speed: 1 }, { midi: 52, t: 15, speed: 1 }, { midi: 71, t: 510, speed: 1 }],
    tol: 100, want: { total: 2, onTime: 2, early: 0, late: 0, missed: 0, wrong: 0 },
  },
  {
    name: 'rhythm: an extra tap and a missed beat',
    rhythm: true,
    steps: [{ t: 0, keys: [60] }, { t: 500, keys: [62] }, { t: 1000, keys: [64] }],
    played: [{ midi: 60, t: 0, speed: 1 }, { midi: 60, t: 250, speed: 1 }, { midi: 60, t: 520, speed: 1 }],
    tol: 100, want: { total: 3, onTime: 2, early: 0, late: 0, missed: 1, wrong: 1 },
  },
  // Holding (owner, 2026-10-13): a note must sound ¾ of its written length (held: ms each press sounded, real time).
  {
    name: 'hold: a half note (1000 ms) held 900 ms is on time and held',
    steps: [{ t: 0, keys: [60], durs: [1000] }], played: [{ midi: 60, t: 0, speed: 1, held: 900 }],
    tol: 100, want: { total: 1, onTime: 1, short: 0 },
  },
  {
    name: 'hold: the same let go after 400 ms is let go early',
    steps: [{ t: 0, keys: [60], durs: [1000] }], played: [{ midi: 60, t: 0, speed: 1, held: 400 }],
    tol: 100, want: { total: 1, onTime: 0, short: 1 },
  },
  {
    name: 'hold: a staccato note (length 0: not judged) let go at once is fine',
    steps: [{ t: 0, keys: [60], durs: [0] }], played: [{ midi: 60, t: 0, speed: 1, held: 50 }],
    tol: 100, want: { total: 1, onTime: 1, short: 0 },
  },
  {
    name: 'hold: at half speed 1000 ms written is 2000 real; held 1200 is let go early',
    steps: [{ t: 0, keys: [60], durs: [1000] }], played: [{ midi: 60, t: 0, speed: 0.5, held: 1200 }],
    tol: 100, want: { total: 1, onTime: 0, short: 1 },
  },
  {
    name: 'hold: a late note is marked late only (one thing a note)',
    steps: [{ t: 0, keys: [60], durs: [1000] }, { t: 1000, keys: [62], durs: [1000] }], played: [{ midi: 60, t: 300, speed: 1, held: 100 }, { midi: 62, t: 1000, speed: 1, held: 990 }],
    tol: 100, want: { total: 2, onTime: 1, late: 1, short: 0 },
  },
  {
    name: 'hold: still sounding (unknown) is never marked',
    steps: [{ t: 0, keys: [60], durs: [1000] }], played: [{ midi: 60, t: 0, speed: 1, held: Infinity }],
    tol: 100, want: { total: 1, onTime: 1, short: 0 },
  },
  {
    name: 'hold, rhythm: a tap for a whole note let go at once is let go early',
    rhythm: true,
    steps: [{ t: 0, keys: [60], durs: [2000] }], played: [{ midi: 50, t: 0, speed: 1, held: 150 }],
    tol: 100, want: { total: 1, onTime: 0, short: 1 },
  },
];

let failed = 0;
{
  const { holds } = await import('../src/holds.ts');
  holds.key(60, true, 1000); holds.key(60, false, 1100);
  const plain = holds.heldFor(60, 1000);
  holds.sustain(true, 2000); holds.key(62, true, 2000); holds.key(62, false, 2100); holds.sustain(false, 2900);
  const pedalled = holds.heldFor(62, 2000);
  holds.sustain(true, 3000); holds.key(64, true, 3000); holds.key(64, false, 3100); holds.key(64, true, 3500); holds.key(64, false, 3600); holds.sustain(false, 4000);
  const restruck = holds.heldFor(64, 3000);
  holds.key(65, true, 5000);
  const down = holds.heldFor(65, 5000);
  const ok = plain === 100 && pedalled === 900 && restruck === 500 && down === Infinity;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} holds: key 100 ms, under the pedal until it lifts 900, struck again under the pedal 500, still down: not known (got ${plain}, ${pedalled}, ${restruck}, ${down})`);
}
for (const c of cases) {
  const got = (c.rhythm ? judgeRhythm : judge)(c.steps, c.played, c.tol, (p) => p.held ?? Infinity);
  const ok = Object.entries(c.want).every(([k, v]) => got[k] === v);
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.name}${ok ? '' : `\n     want ${JSON.stringify(c.want)}\n     got  ${JSON.stringify(got)}`}`);
}
console.log(failed ? `${failed} of ${cases.length} failed` : `all ${cases.length} passed`);
process.exit(failed ? 1 : 0);
