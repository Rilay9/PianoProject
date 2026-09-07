#!/usr/bin/env node
/**
 * Runs a content-pipeline script with whichever Python this machine calls it.
 *
 * `npm run content:build` used to say `python3`, which is right on the CI
 * runner and on Linux, and on Windows is a Microsoft Store shortcut that
 * prints "Python was not found" and exits — so `npm run build` failed at its
 * own prebuild step on the owner's laptop, which is the machine the APK is
 * built on. `py -3.11` is the Windows spelling, and there is no one spelling
 * that works everywhere, so this asks.
 *
 * A candidate has to *answer*, not merely exist: the Store shortcut is an
 * executable that runs and does nothing, so "the command was found" is not a
 * test. It has to print the sentinel below.
 *
 *   node tools/content/python.cjs tools/content/build.py --offline
 *
 * Set PIANOPATH_PYTHON to force one — a virtualenv's interpreter, say:
 *
 *   PIANOPATH_PYTHON=.venv/Scripts/python.exe npm run content:build
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

/** The repository root, from this file rather than from the caller's cwd. */
const ROOT = path.resolve(__dirname, '..', '..');

const SENTINEL = 'pianopath-python-ok';

/** Candidates in order of preference; each is a command and its leading args. */
function candidates() {
  const forced = process.env.PIANOPATH_PYTHON;
  if (forced) return [forced.split(' ')];
  return [
    // A virtualenv in the repository, which is what a developer machine tends
    // to have and what has the pinned music21 in it.
    [
      process.platform === 'win32'
        ? path.join(ROOT, '.venv', 'Scripts', 'python.exe')
        : path.join(ROOT, '.venv', 'bin', 'python'),
    ],
    ['python3'],
    ['py', '-3.11'],
    ['py', '-3'],
    ['python'],
  ];
}

function works(command) {
  const probe = spawnSync(command[0], [...command.slice(1), '-c', `print("${SENTINEL}")`], {
    encoding: 'utf8',
    shell: false,
  });
  return probe.status === 0 && (probe.stdout || '').includes(SENTINEL);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    process.stderr.write('usage: node tools/content/python.cjs <script.py> [args…]\n');
    return 2;
  }
  for (const command of candidates()) {
    if (!works(command)) continue;
    const run = spawnSync(command[0], [...command.slice(1), ...args], {
      stdio: 'inherit',
      // Windows consoles are not UTF-8 by default and the pipeline prints
      // score titles; without this the build dies on an accented composer.
      env: { ...process.env, PYTHONUTF8: '1' },
    });
    return run.status === null ? 1 : run.status;
  }
  process.stderr.write(
    'No working Python found. Tried: ' +
      candidates()
        .map((command) => command.join(' '))
        .join(', ') +
      '\nInstall Python 3.11 and `pip install -r tools/content/requirements.txt`, ' +
      'or set PIANOPATH_PYTHON to the interpreter to use.\n',
  );
  return 2;
}

process.exit(main());
