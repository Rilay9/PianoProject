// Classifies every result in build/u125/last-run.json: pass, or which
// assertion failed. Prints one line: label, counts. Run from app/.
import { readFileSync, appendFileSync } from 'node:fs';

const label = process.argv[2] ?? '';
const report = JSON.parse(readFileSync('build/u125/last-run.json', 'utf8'));
const counts = {};
const bump = (k) => (counts[k] = (counts[k] ?? 0) + 1);

function walk(suite) {
  for (const s of suite.suites ?? []) walk(s);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      for (const r of t.results ?? []) {
        if (r.status === 'passed') {
          bump('pass');
          continue;
        }
        const msg = (r.errors ?? []).map((e) => e.message ?? '').join('\n') + (r.error?.message ?? '');
        const plain = msg.replace(/\u001b\[[0-9;]*m/g, '');
        let kind = 'other';
        if (/toHaveText|Timeout|timed out|waitForFunction/i.test(plain)) kind = 'setup';
        else if (/^Error: expect\(received\)\.(toBeLessThan|toBeGreaterThan)/.test(plain.trim())) kind = 'marks';
        else if (/^Error: expect\(received\)\.toEqual/.test(plain.trim())) {
          // Which note came out null: the diff names the expected pair it replaces.
          const lines = plain.split('\n');
          const at = lines.findIndex((l) => /^\s*\+\s+null,/.test(l));
          const near = at >= 0 ? lines.slice(Math.max(0, at - 6), at).join(' ') : '';
          if (/62/.test(near)) kind = 'note62-null';
          else if (/60/.test(near)) kind = 'note60-null';
          else kind = 'notes-other';
        } else if (/toBe\(/.test(plain)) kind = 'count';
        bump(`fail:${kind}`);
      }
    }
  }
}
for (const s of report.suites ?? []) walk(s);
const line = `${label}\t${JSON.stringify(counts)}`;
console.log(line);
if (process.argv[3]) appendFileSync(process.argv[3], line + '\n');
