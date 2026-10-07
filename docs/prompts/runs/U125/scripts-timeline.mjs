// A diag JSON as a compact timeline, ms from the replay's connect (the first
// note's due time minus 100): the timers, every stalled tick, every tick that
// emitted an engine event, and the ticks either side of each. Run from app/.
import { readFileSync } from 'node:fs';

const run = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const z = run.log.find((e) => e[0] === 'to100')[1] - 100;
const rows = [];
let prev = null;
for (const [k, a, e, ev] of run.log) {
  const tick = k === 'iv' || k === 'raf';
  const gap = tick && prev !== null ? a - prev : null;
  if (tick) prev = a;
  rows.push({ k, a, e, ev, tick, gap });
}
const keep = new Set();
rows.forEach((r, i) => {
  if (r.k.endsWith(':end')) return;
  if (!r.tick || r.gap > 25 || r.ev) [i - 1, i, i + 1].forEach((j) => keep.add(j));
});
console.log(`notes (midi, step, ok, stamp from connect): ${JSON.stringify(run.notes.map((n) => [n[0], n[1], n[2], +(n[3] - z).toFixed(1)]))}`);
console.log(`long task ${(run.marks.busyFrom - z).toFixed(1)} to ${(run.marks.busyTo - z).toFixed(1)}`);
console.log('at\twhat');
rows.forEach((r, i) => {
  if (!keep.has(i) || r.k.endsWith(':end') || r.a - z < -20) return;
  const when = (r.tick ? r.a : r.e) - z;
  const what = r.tick
    ? `${r.k} tick, gap ${r.gap?.toFixed(1)}${r.gap > 25 ? ' (stalled)' : ''}, ran ${(r.e - r.a).toFixed(1)}${r.ev ? `, emitted ${r.ev}` : ''}`
    : `timer due ${(r.a - z).toFixed(1)} runs${r.k === 'to100' ? ' (note C)' : r.k === 'to869' ? ' (note D)' : r.k === 'to90' ? ' (the long task)' : ''}`;
  const end = r.k.startsWith('to') ? rows.find((x, j) => j > i && x.k === `${r.k}:end`) : null;
  console.log(`${when.toFixed(1)}\t${what}${end?.ev ? `, emitted ${end.ev}` : ''}`);
});
