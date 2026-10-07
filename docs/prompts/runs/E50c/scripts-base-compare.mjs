// E50c: tests measured the same way on the base source. Swaps the three changed source files for their base
// copies (written beforehand from 36be5a50 into `../build/e50c/base/`), runs the named test files — by default
// the files that failed in the whole-suite run on the fixed tree (`../build/e50c/failing-files.txt`) — writes
// vitest's output to the named file under `../build/e50c/`, and restores the fixed files from
// `../build/e50c/mine/` whatever happens. Run from `app/`; never touches git.
//   node ../docs/prompts/runs/E50c/scripts-base-compare.mjs failing-on-base.raw.txt
//   node ../docs/prompts/runs/E50c/scripts-base-compare.mjs red-base.raw.txt tests/unit/recordTruth.test.ts tests/unit/scoreSummaryTruth.test.ts
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['src/data/progressStore.ts', 'src/ui/screens/ScoreScreen.ts', 'src/curriculum/material.ts'];
const name = (path) => path.split('/').pop();
const [out = 'failing-on-base.raw.txt', ...named] = process.argv.slice(2);
const tests = named.length > 0
  ? named
  : readFileSync('../build/e50c/failing-files.txt', 'utf8').split(/\r?\n/).filter(Boolean);

let status = 1;
try {
  for (const path of FILES) copyFileSync(`../build/e50c/base/${name(path)}`, path);
  const run = spawnSync('npx', ['vitest', 'run', ...tests], { encoding: 'utf8', shell: true, maxBuffer: 256 * 1024 * 1024 });
  writeFileSync(`../build/e50c/${out}`, `${run.stdout}\n${run.stderr}`);
  status = run.status ?? 1;
} finally {
  for (const path of FILES) copyFileSync(`../build/e50c/mine/${name(path)}`, path);
}
console.log(`base run over ${String(tests.length)} files: exit ${String(status)} (../build/e50c/${out})`);
