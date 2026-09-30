// U113: the read-out's two mutants, written from the final renderer (not for the commit).
//   node make-mutants.mjs <final.ts> <outdir>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [final, out] = process.argv.slice(2);
const src = readFileSync(final, 'utf8');
const line = 'ahead: aheadFor(shown, best.systems, drawn, maxSlots),';
if (src.split(line).length !== 2) throw new Error('the read-out line is not in the file exactly once');
const mutants = {
  // M1: the drawn shape's reservation copied onto every candidate.
  'mutant-1-copy-drawn': 'ahead,',
  // M2: each candidate's own rows, priced at the drawn shape's scale.
  'mutant-2-drawn-scale': 'ahead: aheadFor(shown, best.systems, choice.drawn, maxSlots),',
};
for (const [name, replacement] of Object.entries(mutants)) {
  writeFileSync(join(out, `${name}.ts`), src.replace(line, replacement));
  console.log(`${name}: ${line} -> ${replacement}`);
}
