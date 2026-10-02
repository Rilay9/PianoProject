// One line per diag file: verdict, preconditions, each note's delivery lateness
// (delivered minus stamped). Run from app/.
import { readdirSync, readFileSync } from 'node:fs';
for (const f of readdirSync('build/u125/diag').sort()) {
  const run = JSON.parse(readFileSync(`build/u125/diag/${f}`, 'utf8'));
  const b = run.marks.before;
  const pre = run.marks.busyFrom - b < 150 && run.marks.busyTo - run.marks.after > 150;
  const deliveredAt = (d) => run.log.find((e) => e[0] === `to${d}`)?.[2];
  const late = run.notes.map((n, i) => (deliveredAt(i === 0 ? 100 : 869) - n[3]).toFixed(0));
  if (f.includes('FAIL')) console.log(f, 'pre', pre, 'notes', JSON.stringify(run.notes.map((n) => [n[0], n[1], n[2]])), 'delivered-after-stamp', late.join(','));
}
