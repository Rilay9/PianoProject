// U32 item 9: compares two state-gallery records cell by cell.
//   node scripts-gallery-compare.mjs <before/states.json> <after/states.json> > gallery-compare.txt
// Every field of each cell's record is compared except `fit.sheets` (debugFit's field U32 adds);
// the brief's own list — the arrangement, the scale, the slots' ranges and boxes, the bands — is a
// subset of that. Differences are printed per cell, with the path of each field that differs.
import { readFileSync } from 'node:fs';

const [a, b] = process.argv.slice(2);
const before = JSON.parse(readFileSync(a, 'utf8'));
const after = JSON.parse(readFileSync(b, 'utf8'));
const byCell = (shots) => new Map(shots.map((s) => [s.cell, s]));
const left = byCell(before);
const right = byCell(after);

function diff(x, y, path, out) {
  if (path === '.state.fit.sheets') return;
  if (typeof x !== typeof y || x === null || y === null || typeof x !== 'object') {
    if (JSON.stringify(x) !== JSON.stringify(y)) out.push(`${path}: ${JSON.stringify(x)} -> ${JSON.stringify(y)}`);
    return;
  }
  if (Array.isArray(x) !== Array.isArray(y)) {
    out.push(`${path}: shape differs`);
    return;
  }
  const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
  for (const k of keys) diff(x[k], y[k], `${path}.${k}`, out);
}

const cells = [...new Set([...left.keys(), ...right.keys()])].sort();
let changed = 0;
const lines = [];
for (const cell of cells) {
  const l = left.get(cell);
  const r = right.get(cell);
  if (!l || !r) {
    lines.push(`${cell}: only ${l ? 'before' : 'after'}`);
    changed += 1;
    continue;
  }
  const out = [];
  diff({ state: l.state, broke: l.broke }, { state: r.state, broke: r.broke }, '', out);
  if (out.length > 0) {
    changed += 1;
    lines.push(`${cell}:`);
    for (const line of out.slice(0, 40)) lines.push(`  ${line.replace(/^\./, '')}`);
    if (out.length > 40) lines.push(`  ... ${String(out.length - 40)} more`);
  }
}
console.log(`${String(cells.length)} cells compared (${String(left.size)} before, ${String(right.size)} after), ${String(changed)} differ`);
for (const line of lines) console.log(line);
