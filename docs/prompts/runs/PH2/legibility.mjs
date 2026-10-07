// PH2's legibility census, summarised: every split or conflicted bar of every bundled chart that has one
// (`charts.table.ts` lists them), opened in the browser at a device's width (`build/ph2/pictures/pictures.spec.ts`,
// the `census` tests), and how the screen drew it: proportional boxes at the cell's own size (20px) or a step
// smaller down to 14px, or each symbol placed over its beat above a rule, at 16px down to 12px. Run:
//   node docs/prompts/runs/PH2/legibility.mjs <folder holding census-<device>.json>
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] ?? path.join('build', 'ph2', 'pictures-out');
for (const name of readdirSync(dir).filter((n) => /^census-.*\.json$/.test(n)).sort()) {
  const rows = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
  const look = (row) =>
    row.layout === 'placed'
      ? `placed over the rule at ${row.size}, ${String(row.rows)} line${row.rows === 1 ? '' : 's'}`
      : row.layout === 'sequence'
        ? `in order over the rule at ${row.size}${row.lines > 1 ? `, wrapped to ${String(row.lines)} lines` : ', one line'}`
        : `boxes at ${row.size}`;
  const count = new Map();
  const bySegments = new Map();
  for (const row of rows) {
    count.set(look(row), (count.get(look(row)) ?? 0) + 1);
    const key = `${String(row.segments)} segment${row.segments === 1 ? '' : 's'}`;
    const entry = bySegments.get(key) ?? { boxes: 0, placed: 0, sequence: 0 };
    if (row.layout === 'placed') entry.placed += 1;
    else if (row.layout === 'sequence') entry.sequence += 1;
    else entry.boxes += 1;
    bySegments.set(key, entry);
  }
  console.log(`${name.replace(/^census-|\.json$/g, '')}: ${String(rows.length)} split or conflicted bars in ${String(new Set(rows.map((r) => r.id)).size)} charts`);
  for (const [k, v] of [...count.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(5)}  ${k}`);
  console.log(`  by segments (boxes / placed / in order): ${[...bySegments.entries()].sort().map(([k, v]) => `${k} ${String(v.boxes)}/${String(v.placed)}/${String(v.sequence)}`).join(', ')}`);
}
