// E57b's mutant: put "on this track " back into rock.7's first sentence, run lessonShape, restore the bytes.
// Run from the worktree root: node docs/prompts/runs/E57b/scripts-mutant.mjs > docs/prompts/runs/E57b/mutant.txt
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const W = resolve(import.meta.dirname, '..', '..', '..', '..');
const LESSON = join(W, 'content', 'lessons', 'rock.7.md');
const CUT = 'Every texture so far has been something to hold steady.';
const MUTANT = 'Every texture on this track so far has been something to hold steady.';
const scrub = (s) => s.split(W).join('<worktree>').split(W.replace(/\\/g, '/')).join('<worktree>');
const words = (raw) => raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').split(/\s+/).filter(Boolean).length;

const original = readFileSync(LESSON);
const text = original.toString('utf8');
if (text.split(CUT).length !== 2) throw new Error('the cut sentence does not occur exactly once');
let code = -1;
try {
  const mutated = text.replace(CUT, MUTANT);
  writeFileSync(LESSON, mutated);
  console.log(`mutant: rock.7 body ${words(mutated)} words (cut: ${words(text)})`);
  const r = spawnSync('npx vitest run tests/unit/lessonShape.test.ts', {
    cwd: join(W, 'app'),
    shell: true,
    encoding: 'utf8',
  });
  code = r.status;
  const out = scrub(`${r.stdout}\n${r.stderr}`);
  for (const line of out.split(/\r?\n/)) {
    if (/rock\.7|FAIL|✗|×|Test Files|Tests /.test(line)) console.log(line.trimEnd());
  }
  console.log(`mutant lessonShape exit ${code} (red expected)`);
} finally {
  writeFileSync(LESSON, original);
  const back = readFileSync(LESSON);
  console.log(`restored: ${Buffer.compare(back, original) === 0 ? 'bytes identical to the cut file' : 'MISMATCH'}`);
}
