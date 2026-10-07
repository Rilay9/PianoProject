// U32: merges the slot snapshot's per-cell files into one sorted JSON, and diffs two merged files.
//   node scripts-snapshot-merge.mjs merge <dir> <out.json>
//   node scripts-snapshot-merge.mjs diff <a.json> <b.json> <out.txt>
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [mode, a, b, c] = process.argv.slice(2);

if (mode === 'merge') {
  const cells = {};
  for (const name of readdirSync(a).filter((n) => n.endsWith('.json') && !n.startsWith('_')).sort()) {
    const data = JSON.parse(readFileSync(join(a, name), 'utf8'));
    for (const [bars, cell] of Object.entries(data.cells)) cells[`${data.id} | ${data.shape} | bars ${bars}`] = cell;
  }
  const sorted = Object.fromEntries(Object.keys(cells).sort().map((k) => [k, cells[k]]));
  writeFileSync(b, `${JSON.stringify(sorted, null, 1)}\n`);
  console.log(`merged ${String(Object.keys(sorted).length)} cells into ${b}`);
} else if (mode === 'diff') {
  const left = JSON.parse(readFileSync(a, 'utf8'));
  const right = JSON.parse(readFileSync(b, 'utf8'));
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  const lines = [];
  for (const key of keys) {
    const l = left[key];
    const r = right[key];
    if (l === undefined || r === undefined) {
      lines.push(`${key}: only in ${l === undefined ? 'the second' : 'the first'}`);
      continue;
    }
    for (const field of [...new Set([...Object.keys(l), ...Object.keys(r)])]) {
      if (JSON.stringify(l[field]) !== JSON.stringify(r[field])) {
        lines.push(`${key}: ${field} ${JSON.stringify(l[field])} -> ${JSON.stringify(r[field])}`);
      }
    }
  }
  const head = `${String(keys.length)} cells compared, ${String(lines.length)} difference(s)`;
  writeFileSync(c, `${head}\n${lines.join('\n')}${lines.length > 0 ? '\n' : ''}`);
  console.log(head);
}
