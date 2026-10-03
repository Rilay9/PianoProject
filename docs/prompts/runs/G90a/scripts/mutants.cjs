// One mechanism per mutant: a source line changed, the unit files run, the line put back, and the
// changed source files checked against their backups by checksum afterwards.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const app = path.resolve(__dirname, '../../app');
const backups = path.resolve(__dirname, 'mutant-backups');
fs.mkdirSync(backups, { recursive: true });

const FILES = {
  run: 'src/data/sessionRun.ts',
  runner: 'src/ui/sessionRunner.ts',
  today: 'src/ui/screens/TodayScreen.ts',
  help: 'src/ui/help.ts',
  session: 'src/curriculum/session.ts',
};
const TESTS = ['tests/unit/sessionHeldSkip.test.ts', 'tests/unit/todayHeldSkip.test.ts', 'tests/unit/sessionHeldPiece.test.ts', 'tests/unit/todayHeldPiece.test.ts', 'tests/unit/sessionAdaptation.test.ts'];

const md5 = (file) => crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
for (const [key, rel] of Object.entries(FILES)) fs.copyFileSync(path.join(app, rel), path.join(backups, key + '.bak'));
const before = Object.fromEntries(Object.entries(FILES).map(([key, rel]) => [key, md5(path.join(app, rel))]));

const MUTANTS = [
  ['M1', 'the veto records skipped-redundant again, the kind widened (sessionRun.ts, apply withhold)', 'run',
    "target.adaptations.push({ kind: 'withdrawn', held: event.held, why: SESSION_TEXT.withheld(target.slot.title, event.held) });",
    "target.adaptations.push({ kind: 'skipped-redundant', why: SESSION_TEXT.withheld(target.slot.title, event.held) });"],
  ['M2', "Today's row keeps the composition's words for a withdrawn piece (TodayScreen.ts, activityRow)", 'today',
    'const line = withdrawn === undefined ? (showsReason(activity) ? cardLine(activity.reason, activity.slot.claim) : undefined) : SESSION_TEXT.withheldRow(withdrawn);',
    'const line = showsReason(activity) ? cardLine(activity.reason, activity.slot.claim) : undefined;'],
  ['M3', 'a swapped activity is never withdrawn, as before G90a (sessionRun.ts, isWithdrawnBy)', 'run',
    'if (activity.swappedAt !== undefined) return Date.parse(since) > Date.parse(activity.swappedAt);',
    'if (activity.swappedAt !== undefined) return false;'],
  ['M4', 'a swapped activity is withdrawn by a word from any time, the swap not ordered (sessionRun.ts, isWithdrawnBy)', 'run',
    'if (activity.swappedAt !== undefined) return Date.parse(since) > Date.parse(activity.swappedAt);',
    'if (activity.swappedAt !== undefined) return true;'],
  ['M5', 'a swap does not record when it was made (sessionRun.ts, apply swap)', 'run',
    'target.swappedAt = now.toISOString();',
    'void now;'],
  ['M6', 'a word at the very moment of the swap withdraws it, the swap not standing (sessionRun.ts, isWithdrawnBy)', 'run',
    'return Date.parse(since) > Date.parse(activity.swappedAt);',
    'return Date.parse(since) >= Date.parse(activity.swappedAt);'],
  ['M7', 'a stored run holding a withdrawn adaptation is discarded as malformed (sessionRun.ts, ADAPTATIONS)', 'run',
    "const ADAPTATIONS: ReadonlySet<unknown> = new Set(['skipped-redundant', 'kept-here', 'repurposed', 'withdrawn']);",
    "const ADAPTATIONS: ReadonlySet<unknown> = new Set(['skipped-redundant', 'kept-here', 'repurposed']);"],
  ['M8', 'a withdrawn adaptation is accepted without the state the learner left the piece in (sessionRun.ts, validateRun)', 'run',
    "&& (one.kind !== 'withdrawn' || HELD.has(one.held));",
    ';'],
  ['M9', 'a row tapped back to life keeps the record of its withdrawal (sessionRun.ts, apply choose)', 'run',
    "target.adaptations = target.adaptations.filter((one) => one.kind !== 'withdrawn');",
    'void 0;'],
  ['M10', "the transition's notes leave out a withdrawn piece (sessionRunner.ts, skipsBetween)", 'runner',
    ".filter((one) => one.kind === 'skipped-redundant' || one.kind === 'withdrawn')",
    ".filter((one) => one.kind === 'skipped-redundant')"],
  ['M11', 'a piece put away is said as paused (help.ts, youHeld)', 'help',
    "return state === 'paused' ? 'you paused it' : 'you put it away';",
    "return 'you paused it';"],
  ['M12', 'the lookup answers the moment it is asked as the moment the learner spoke (session.ts, heldWordOf)', 'session',
    '{ state: row.state, since: row.since }',
    '{ state: row.state, since: new Date().toISOString() }'],
  ['M13', 'an activity underway can be withdrawn (sessionRun.ts, apply withhold)', 'run',
    "if (target.state !== 'pending' || !isWithdrawnBy(target, event.since)) return { ok: false, why: 'illegal', run: stored };",
    "if (!isWithdrawnBy(target, event.since)) return { ok: false, why: 'illegal', run: stored };"],
  ['M14', 'a row the learner taps is settled before it opens, and so overruled (TodayScreen.ts, playActivity)', 'today',
    '      from = chosen.run;\n      run = from;\n    }\n    await openCurrent(from);',
    '      from = chosen.run;\n      run = from;\n    }\n    const settled = await settleHeld(from, now);\n    if (settled.withheld.length > 0) {\n      run = settled.run;\n      redrawSession();\n      return;\n    }\n    await openCurrent(from);'],
  ['M15', 'the swap moment is not checked when a stored run is read (sessionRun.ts, validateRun)', 'run',
    "if (raw.swappedAt !== undefined && !isText(raw.swappedAt)) return `activity ${String(at)} has a malformed swap moment`;",
    '// swap moment unchecked'],
  ['M17', 'a row says it was withdrawn whatever state it is in now (sessionRun.ts, withdrawnOf)', 'run',
    "if (activity.state !== 'skipped') return undefined;",
    '// any state'],
  ['M18', "the session's own offer is never withdrawn (sessionRun.ts, isWithdrawnBy)", 'run',
    'return activity.slot.claim !== undefined;',
    'return false;'],
  ['M19', 'an activity with no claim and no swap moment (the learner’s, in an older record) is withdrawn (sessionRun.ts, isWithdrawnBy)', 'run',
    'return activity.slot.claim !== undefined;',
    'return true;'],
  ['M20', 'a row tapped back to life loses every record of what the runner did, not only the withdrawal (sessionRun.ts, apply choose)', 'run',
    "target.adaptations = target.adaptations.filter((one) => one.kind !== 'withdrawn');",
    'target.adaptations = [];'],
  ['M21', 'the lookup answers for a project in any state, not only paused and put away (session.ts, heldWordOf)', 'session',
    "return row?.state === 'paused' || row?.state === 'retired' ? { state: row.state, since: row.since } : undefined;",
    'return row ? { state: row.state as HeldState, since: row.since } : undefined;'],
  ['M22', 'Today says a piece was withdrawn on every skipped row (TodayScreen.ts, activityRow)', 'today',
    'const withdrawn = withdrawnOf(activity);',
    "const withdrawn = activity.state === 'skipped' ? ('paused' as const) : undefined;"],
  ['M16', 'a withdrawn piece does not say which state the learner left it in on the record (sessionRun.ts, apply withhold)', 'run',
    "{ kind: 'withdrawn', held: event.held, why:",
    "{ kind: 'withdrawn', held: 'paused', why:"],
];

MUTANTS.sort((a, b) => Number(a[0].slice(1)) - Number(b[0].slice(1)));
const only = process.argv.slice(2);
const out = [];
const stamp = (line) => {
  out.push(line);
  console.log(line);
};
stamp('G90a mutants. One mechanism each: one source line changed, the unit files below run, the line put back, and the five changed');
stamp('source files checked against their backups by checksum afterwards. Counts are failing tests; the names are the cases that went red.');
stamp('Run: ' + TESTS.join(' '));
stamp('');

for (const [id, what, key, find, replace] of MUTANTS) {
  if (only.length > 0 && !only.includes(id)) continue;
  const file = path.join(app, FILES[key]);
  const original = fs.readFileSync(file, 'utf8');
  const crlf = original.includes('\r\n');
  const eol = (text) => (crlf ? text.replace(/\r?\n/g, '\r\n') : text);
  const target = eol(find);
  const first = original.indexOf(target);
  if (first < 0 || original.indexOf(target, first + 1) >= 0) {
    stamp(`${id}  ${what}   NOT RUN: the line was not found exactly once`);
    continue;
  }
  fs.writeFileSync(file, original.replace(target, () => eol(replace)));
  let result;
  try {
    result = spawnSync('npx', ['vitest', 'run', ...TESTS], { cwd: app, encoding: 'utf8', shell: true, timeout: 600000 });
  } finally {
    fs.writeFileSync(file, original);
  }
  const text = (result.stdout || '') + (result.stderr || '');
  const failed = [...new Set([...text.matchAll(/^ FAIL  (.+)$/gm)].map((found) => found[1].trim()))];
  const summary = /Tests\s+(.+)/.exec(text);
  stamp(`${id}  ${what}   ${failed.length > 0 ? 'CAUGHT, ' + String(failed.length) : 'SURVIVED'}   (${summary ? summary[1].trim() : 'no summary'})`);
  for (const name of failed) stamp('      ' + name.replace(/^tests\/unit\//, ''));
}

const after = Object.fromEntries(Object.entries(FILES).map(([key, rel]) => [key, md5(path.join(app, rel))]));
const same = Object.keys(FILES).every((key) => before[key] === after[key]);
stamp('');
stamp(`The five source files, compared by checksum before and after every mutant: ${same ? 'identical' : 'DIFFERENT'}.`);
fs.writeFileSync(path.resolve(__dirname, only.length > 0 ? 'mutants-partial.txt' : 'mutants.txt'), out.join('\n') + '\n');
