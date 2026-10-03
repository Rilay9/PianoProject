// U32 item 9: the long pieces' grid, before against after, one line a picture, from the probe's JSON.
//   node scripts-pictures-table.mjs <before-dir> <after-dir> > pictures-table.txt
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [before, after] = process.argv.slice(2);
const names = readdirSync(before).filter((n) => n.endsWith('.json') && !n.endsWith('.walk.json')).sort();
const read = (dir, n) => (existsSync(join(dir, n)) ? JSON.parse(readFileSync(join(dir, n), 'utf8')) : null);
const cell = (m) =>
  m === null
    ? 'missing'
    : `staff ${String(m.staffPx)}${m.staffOverFloor === false ? ' UNDER FLOOR' : ''}, ink ${String(Math.round(m.inkShare * 100))}% of the height, ` +
      `spacing x${String(m.worstSpacing)}, ahead [${m.ahead.join(' ')}], free below ${String(m.freeBelow)} vs a row ${String(m.rowPx)}, ` +
      `${String(m.slotCount)} slots/${String(m.systemsPerWindow)} systems, ${String(m.barsShown)} of ${String(m.barsAsked)} shown${m.windowWhy ? ` (${String(m.windowWhy)})` : ''}, sheets ${String(m.sheetsMade)}`;
console.log('U32 item 9, the long pieces: this machine, this run. Before | after, per picture.');
let smaller = 0;
let gained = 0;
let lost = 0;
for (const n of names) {
  const a = read(before, n);
  const b = read(after, n);
  const flags = [];
  if (a && b && a.staffPx !== null && b.staffPx !== null && b.staffPx < a.staffPx - 0.5) {
    flags.push(`WINDOW SMALLER ${String(a.staffPx)} -> ${String(b.staffPx)}`);
    smaller += 1;
  }
  if (a && b && a.ahead.length === 0 && b.ahead.length > 0) {
    flags.push('next row gained');
    gained += 1;
  }
  if (a && b && a.ahead.length > 0 && b.ahead.length === 0) {
    flags.push('NEXT ROW LOST');
    lost += 1;
  }
  console.log(`${n.replace('.json', '')}${flags.length ? `  [${flags.join('; ')}]` : ''}`);
  console.log(`  before: ${cell(a)}`);
  console.log(`  after:  ${cell(b)}`);
}
console.log(`\n${String(names.length)} pictures: the next row gained in ${String(gained)}, lost in ${String(lost)}; a window staff smaller after in ${String(smaller)}`);
