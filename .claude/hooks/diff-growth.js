// PostToolUse hook (Bash|Write|Edit): warn when one step rewrites far more of a
// tracked file than an edit should — the signature of a re-serialisation that
// reformatted a whole file (pdmx.json, 2026-09-18: 8,186 lines to change 3 rows).
//
// Line endings are deliberately NOT checked: core.autocrlf=true normalises them,
// so a CRLF/LF flip never reaches a diff. Formatting changes (0.0 -> 0, indent,
// key order, escapes) do.
//
// Compares `git diff --numstat` now against the previous call in this session.
// Untracked files have no numstat and are not covered.
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REMOVED_IN_ONE_STEP = 150;

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(input); } catch { /* ignore */ }
  // The repository is two levels above this file. Not CLAUDE_PROJECT_DIR: sessions are
  // often opened on the parent folder, which has no CLAUDE.md and is not a git repo.
  const root = path.resolve(__dirname, '..', '..');
  const session = String(payload.session_id || 'nosession').replace(/[^\w-]/g, '');
  const stateFile = path.join(os.tmpdir(), `pianoproject-diffstat-${session}.json`);

  let out = '';
  try {
    out = cp.execSync(
      'git diff --numstat -- . ":(exclude)app/public/content" ":(exclude)build"',
      { cwd: root, encoding: 'utf8', maxBuffer: 1e8, stdio: ['ignore', 'pipe', 'ignore'] },
    );
  } catch { process.exit(0); }

  const now = {};
  for (const line of out.split('\n')) {
    const [a, r, file] = line.split('\t');
    if (!file || a === '-') continue;
    now[file] = { a: Number(a), r: Number(r) };
  }

  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { /* first call */ }
  fs.writeFileSync(stateFile, JSON.stringify(now));
  if (!prev) process.exit(0);

  const flagged = [];
  for (const [file, { a, r }] of Object.entries(now)) {
    const was = prev[file] || { a: 0, r: 0 };
    const dr = r - was.r;
    const da = a - was.a;
    if (dr >= REMOVED_IN_ONE_STEP) flagged.push(`${file}: +${da} / -${dr} lines in this one step`);
  }
  if (!flagged.length) process.exit(0);

  const msg =
    'One step rewrote a large part of a tracked file:\n  ' + flagged.join('\n  ') +
    '\nIf the intent was to change a few rows, the file was probably re-serialised and reformatted. ' +
    'Check `git diff` on it before going on, and say so in the report either way.';
  process.stdout.write(JSON.stringify({
    systemMessage: msg,
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg },
  }));
});
