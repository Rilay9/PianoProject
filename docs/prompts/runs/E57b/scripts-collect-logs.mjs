// E57b: copy the run logs from build/e57b/ into docs/prompts/runs/E57b/, machine paths replaced by <worktree> and <home>,
// each kept log under 300 KB (the build's output keeps its last 400 lines when longer). Run from the worktree root.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

const W = resolve(import.meta.dirname, '..', '..', '..', '..');
const OUT = join(W, 'docs', 'prompts', 'runs', 'E57b');
const H = homedir();
const forms = (p) => [p, p.replace(/\\/g, '/'), p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`)];
const scrub = (s) => {
  for (const f of forms(W)) s = s.split(f).join('<worktree>');
  for (const f of forms(H)) s = s.split(f).join('<home>');
  return s.replace(/\x1b\[[0-9;]*m/g, '');
};
const LOGS = [
  ['setup.txt', 'setup.txt'],
  ['build.out.txt', 'content-build.txt', 400],
  ['build.err.txt', 'content-build.stderr.txt', 400],
  ['vitest.raw.txt', 'vitest-targeted.txt'],
  ['vitest-libwords.raw.txt', 'vitest-libraryImportWords.txt'],
  ['build-app.raw.txt', 'build-app.txt', 200],
  ['e2e.raw.txt', 'e2e.txt'],
  ['lint.raw.txt', 'lint.txt'],
];
for (const [from, to, tail] of LOGS) {
  const p = join(W, 'build', 'e57b', from);
  if (!existsSync(p)) { console.log(`absent: build/e57b/${from}`); continue; }
  let lines = scrub(readFileSync(p, 'utf8')).split(/\r?\n/);
  const n = lines.length;
  if (tail && n > tail) lines = [`(last ${tail} of ${n} lines)`, ...lines.slice(-tail)];
  const text = lines.join('\n');
  writeFileSync(join(OUT, to), text);
  console.log(`${to}: ${Buffer.byteLength(text)} bytes`);
}
