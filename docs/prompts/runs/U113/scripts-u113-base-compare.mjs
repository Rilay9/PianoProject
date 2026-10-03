// U113: the 24 cells on the base build against the same cells with the read-out (not for the
// suite). The chooser's pick and every priced count must be the same; only `ahead` is new.
//   node scripts-u113-base-compare.mjs <base dir> <final dir>
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [baseDir, finalDir] = process.argv.slice(2);
const pick = (d) => {
  const f = d.fit;
  return {
    barsAsked: f.barsAsked,
    barsShown: f.barsShown,
    systemsPerWindow: f.systemsPerWindow,
    slotCount: f.slotCount,
    ahead: f.ahead,
    windowWhy: d.glass.windowWhy,
    rows: d.glass.rows.map((r) => `${r.bars}${r.ahead ? '~' : ''}`).join(','),
    glassStaff: d.glass.staffPx,
    candidates: (f.priced?.candidates ?? []).map((c) => `${String(c.shown)}:${String(c.systems)}:${String(c.staffPx)}`).join(' '),
  };
};
let same = 0;
let samePick = 0;
let total = 0;
for (const name of readdirSync(finalDir).filter((n) => n.endsWith('.json')).sort()) {
  const fin = pick(JSON.parse(readFileSync(join(finalDir, name), 'utf8')));
  let base;
  try {
    base = pick(JSON.parse(readFileSync(join(baseDir, name), 'utf8')));
  } catch {
    console.log(`${name}: no base cell`);
    continue;
  }
  total += 1;
  const diffs = Object.keys(fin).filter((k) => JSON.stringify(fin[k]) !== JSON.stringify(base[k]));
  if (diffs.length === 0) same += 1;
  if (diffs.every((k) => k === 'candidates')) samePick += 1;
  console.log(`${name.replace('.json', '')}: ${diffs.length === 0 ? 'same' : diffs.map((k) => `${k} base ${JSON.stringify(base[k])} final ${JSON.stringify(fin[k])}`).join('; ')}`);
}
console.log(`${String(samePick)} of ${String(total)} cells the same in the pick (shown, systems, slots, look-ahead state, reason) and on the glass (rows, staff)`);
console.log(`${String(same)} of ${String(total)} cells also the same in every priced count's shown, systems and staff`);
