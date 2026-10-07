// E50c's mutants: each applies one edit to the fixed source, runs the named unit files, records which tests
// reddened, and restores the file from a copy taken first. Run from `app/`:
//   node ../docs/prompts/runs/E50c/scripts-mutants.mjs > ../docs/prompts/runs/E50c/mutants.txt
// Never touches git: the copy under `../build/e50c/mutant-backup/` is what restores each file.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, join } from 'node:path';

const STORE = 'src/data/progressStore.ts';
const SCREEN = 'src/ui/screens/ScoreScreen.ts';
const RECORD = 'tests/unit/recordTruth.test.ts';
const SHEET = 'tests/unit/scoreSummaryTruth.test.ts';
const BACKUP = '../build/e50c/mutant-backup';

const MUTANTS = [
  {
    id: 'a',
    what: 'the guard removed: every date counts, as before the fix',
    file: STORE,
    edits: [['(await daysTowardMastery(result, masterEligible, masteredOn, date)) >= MASTER_DAYS', 'masteredOn.length >= MASTER_DAYS']],
    tests: [RECORD],
  },
  {
    id: 'b',
    what: 'the guard refusing every day of a repaired item, comparable or not',
    file: STORE,
    edits: [['return counted.size;', 'return 0;']],
    tests: [RECORD],
  },
  {
    id: 'c-i',
    what: 'keyed on the item id alone: a run is refused because its id is a repaired row, tempoNotComparable not asked',
    file: STORE,
    edits: [
      ['if (masterEligible && !tempoNotComparable(result)) counted.add(date);', 'if (masterEligible && !tempoRepairedRow(result.itemId)) counted.add(date);'],
      ['!tempoNotComparable(run) && meetsMasterTerms(run)', '!tempoRepairedRow(run.itemId) && meetsMasterTerms(run)'],
    ],
    tests: [RECORD],
  },
  {
    id: 'c-ii',
    what: 'the repaired-file material alone: the per-run id clause (no material, no written base) never asked',
    file: STORE,
    edits: [
      ['if (masterEligible && !tempoNotComparable(result)) counted.add(date);', "if (masterEligible && !tempoNotComparable({ ...result, itemId: '' })) counted.add(date);"],
      ['!tempoNotComparable(run) && meetsMasterTerms(run)', "!tempoNotComparable({ ...run, itemId: '' }) && meetsMasterTerms(run)"],
    ],
    tests: [RECORD],
  },
  {
    id: 'd',
    what: 'support by any comparable run that day: the master terms dropped',
    file: STORE,
    edits: [['!tempoNotComparable(run) && meetsMasterTerms(run)', '!tempoNotComparable(run)']],
    tests: [RECORD],
  },
  {
    id: 'j',
    what: "a rhythm-only run's own flag not read: its numbers alone support a day",
    file: STORE,
    edits: [['run.rhythmOnly !== true &&', '']],
    tests: [RECORD],
  },
  {
    id: 'e',
    what: "sessionsForItem's default cap of five",
    file: STORE,
    edits: [['sessionsForItem(result.itemId, Number.POSITIVE_INFINITY)', 'sessionsForItem(result.itemId)']],
    tests: [RECORD],
  },
  {
    id: 'f',
    what: 'the repaired-row gate removed: every item asked for stored support',
    file: STORE,
    edits: [['if (masteredOn.length < MASTER_DAYS || !tempoRepairedRow(result.itemId)) return masteredOn.length;', 'if (masteredOn.length < MASTER_DAYS) return masteredOn.length;']],
    tests: [RECORD],
  },
  {
    id: 'g',
    what: "a stored run's day read as its UTC date (`at`'s own date substring)",
    file: STORE,
    edits: [['const day = dayKey(new Date(run.at));', 'const day = run.at.slice(0, 10);']],
    tests: [RECORD],
  },
  {
    id: 'h',
    what: "the historical disjunct touched: a mastered row re-judged",
    file: STORE,
    edits: [["if (row.status === 'mastered' || (await daysTowardMastery(", 'if ((await daysTowardMastery(']],
    tests: [RECORD],
  },
  {
    id: 'i',
    what: 'the heading counting the dates again',
    file: SCREEN,
    edits: [['Math.min(MASTER_DAYS - 1, row.masteredOn?.length ?? 1)', 'Math.min(MASTER_DAYS, row.masteredOn?.length ?? 1)']],
    tests: [SHEET],
  },
];

mkdirSync(BACKUP, { recursive: true });
const originals = new Map();
for (const path of [STORE, SCREEN]) {
  copyFileSync(path, join(BACKUP, basename(path)));
  originals.set(path, readFileSync(path, 'utf8'));
}

function run(tests) {
  const out = spawnSync('npx', ['vitest', 'run', ...tests], { encoding: 'utf8', shell: true });
  const text = `${out.stdout}\n${out.stderr}`;
  const failed = [...text.matchAll(/^\s*FAIL\s+(\S+) > (.+)$/gm)].map((m) => `${basename(m[1])} > ${m[2].trim()}`);
  const summary = (text.match(/^\s*Tests\s+.+$/m) ?? ['(no summary)'])[0].trim();
  return { status: out.status, failed: [...new Set(failed)], summary };
}

let problems = 0;
try {
  for (const mutant of MUTANTS) {
    let source = originals.get(mutant.file);
    for (const [from, to] of mutant.edits) {
      const count = source.split(from).length - 1;
      if (count !== 1) throw new Error(`mutant ${mutant.id}: expected one match of ${JSON.stringify(from)}, found ${count}`);
      source = source.replace(from, to);
    }
    writeFileSync(mutant.file, source);
    const result = run(mutant.tests);
    writeFileSync(mutant.file, originals.get(mutant.file));
    const red = result.status !== 0 && result.failed.length > 0;
    if (!red) problems += 1;
    console.log(`## mutant ${mutant.id}: ${mutant.what}`);
    console.log(`edit: ${mutant.file}; ran: ${mutant.tests.join(', ')}; exit ${String(result.status)}; ${result.summary}`);
    console.log(red ? 'RED (killed):' : 'GREEN (survived)');
    for (const name of result.failed) console.log(`  - ${name}`);
    console.log('');
  }
} finally {
  for (const [path, text] of originals) writeFileSync(path, text);
}
// The fixed tree, once more, after every restore.
const after = run([RECORD, SHEET]);
console.log(`## restored: ${RECORD}, ${SHEET}; exit ${String(after.status)}; ${after.summary}`);
if (after.status !== 0) problems += 1;
process.exitCode = problems === 0 ? 0 : 1;
