// X46 mutants: each replaces one line of the change, runs the test file that should catch it, and restores
// the source. A mutant the test does not turn red is reported as SURVIVED. Run from the worktree root.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const APP = join(process.cwd(), 'app');
const SCORE = join(APP, 'src/ui/screens/ScoreScreen.ts');
const RUNNER = join(APP, 'src/ui/sessionRunner.ts');

const mutants = [
  {
    name: 'R: the opening keeps the defaults',
    file: SCORE,
    from: "else if (!sightReading && todayRung !== undefined && input !== 'none') {",
    to: 'else if (false) {',
    test: 'tests/unit/sessionItemStory.test.ts',
  },
  {
    name: 'R2: Rhythm only stays on at the opening',
    file: SCORE,
    from: '        rhythmOnly = false;\r\n      }',
    to: '      }',
    test: 'tests/unit/sessionItemStory.test.ts',
  },
  {
    name: '(c): a Wait run completes the activity',
    file: SCORE,
    from: 'if (practice) drawNext();',
    to: 'if (false) drawNext();',
    test: 'tests/unit/sessionItemStory.test.ts',
  },
  {
    name: 'T: no To pass line',
    file: SCORE,
    from: 'if (missedStandard) {',
    to: 'if (false) {',
    test: 'tests/unit/sessionItemStory.test.ts',
  },
  {
    name: 'C: no control to the standard',
    file: SCORE,
    from: 'missedStandard && !tempoCanCount(score.mode, score.tempoPct, criteria)',
    to: 'false',
    test: 'tests/unit/sessionItemStory.test.ts',
  },
  {
    name: 'M: every completed activity is done',
    file: RUNNER,
    from: "return activity.result?.outcome === 'passed-full' ? 'done' : 'played';",
    to: "return 'done';",
    test: 'tests/unit/todaySessionRun.test.ts',
  },
  {
    name: 'F: the frozen reason stays on rows behind',
    file: RUNNER,
    from: "return !(activity.state === 'completed' || (activity.state === 'attempted' && activity.movedOn === true));",
    to: 'return true;',
    test: 'tests/unit/todaySessionRun.test.ts',
  },
];

const results = [];
for (const m of mutants) {
  const backup = `${m.file}.x46bak`;
  copyFileSync(m.file, backup);
  try {
    const text = readFileSync(m.file, 'utf8');
    if (!text.includes(m.from)) {
      results.push(`${m.name}: MUTANT LINE NOT FOUND`);
      continue;
    }
    writeFileSync(m.file, text.replace(m.from, m.to));
    const run = spawnSync('npx', ['vitest', 'run', m.test], { cwd: APP, shell: true, encoding: 'utf8' });
    const out = `${run.stdout}\n${run.stderr}`;
    const failed = out.match(/Tests\s+(\d+) failed/);
    results.push(`${m.name}: exit ${String(run.status)} — ${run.status === 0 ? 'SURVIVED' : `killed (${failed ? failed[1] : '?'} failed)`}`);
    const names = [...out.matchAll(/^\s+(?:×|✗|FAIL)\s+(.+)$/gm)].map((one) => one[1]).slice(0, 8);
    for (const name of names) results.push(`    red: ${name.trim()}`);
  } finally {
    copyFileSync(backup, m.file);
  }
}
writeFileSync(join(process.cwd(), 'build/x46/mutants.txt'), `${results.join('\n')}\n`);
console.log(results.join('\n'));
