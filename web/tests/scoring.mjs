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
];

let failed = 0;
for (const c of cases) {
  const got = (c.rhythm ? judgeRhythm : judge)(c.steps, c.played, c.tol);
  const ok = Object.entries(c.want).every(([k, v]) => got[k] === v);
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.name}${ok ? '' : `\n     want ${JSON.stringify(c.want)}\n     got  ${JSON.stringify(got)}`}`);
}
console.log(failed ? `${failed} of ${cases.length} failed` : `all ${cases.length} passed`);
process.exit(failed ? 1 : 0);
