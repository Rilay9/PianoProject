// U32: the Play-press measurements, one line each (scripts-zz-u32-play-debug.spec.ts's JSON).
//   node scripts-play-summary.mjs <dir> > play-press-debug.txt
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
console.log("U32: the Play press in the pictures probe's flow, one click, unthrottled, two workers, this machine.");
console.log('clickMs: how long the click took to be taken; tasks: [ms after the click, duration ms] of each long task.');
console.log("nosheets: the final code with no sheet made after create (mutant 1's build), the base's two sheets.\n");
for (const name of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
  const r = JSON.parse(readFileSync(join(dir, name), 'utf8'));
  console.log(`${name.replace('.json', '')}: click ${String(r.clickMs)} ms, running ${String(r.running)}, paused ${String(r.paused)}, slots ${String(r.slotCount)}, sheets ${JSON.stringify(r.sheets)}, long tasks ${JSON.stringify(r.tasks)}`);
}
