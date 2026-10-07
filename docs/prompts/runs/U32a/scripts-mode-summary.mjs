// U32a: the stopped-state re-price probe's samples, one line a change (not for the commit).
//   node mode-summary.mjs <dir> [filter]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, filter = ''] = process.argv.slice(2);
for (const f of readdirSync(dir).sort().filter((n) => n.includes(filter))) {
  const d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const t0 = d.after[0].t;
  let last = '';
  console.log(`${f} before: ${JSON.stringify(d.before)}`);
  for (const s of d.after) {
    const k = `${s.running ? 'RUN ' : ''}stage ${s.h} slots ${s.slots} sheets ${JSON.stringify(s.sheets)} settled ${s.settled}`;
    if (k !== last) console.log(`   +${s.t - t0} ${k}`);
    last = k;
  }
}
