// PreToolUse on Bash and PowerShell: a commit that names a Phase 2 rules page
// (docs/classifier/rules/area-*.md) runs tools/classifier/check_rules.py on it first and is
// blocked if any rule lacks its reuse line, cites a tool the survey does not list for it, or
// claims a validation whose evidence file does not exist (the owner, 2026-10-08: enforce the
// library-first rule where work is accepted, with the hooks, not by reminders).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let j = {};
  try { j = JSON.parse(input); } catch (e) { process.exit(0); }
  const cmd = String((j.tool_input || {}).command || '');
  if (!/git\b[^\n]*\bcommit\b/.test(cmd)) process.exit(0);
  const pages = [...new Set(cmd.match(/docs\/classifier\/rules\/area-[\w.-]+\.md/g) || [])];
  if (!pages.length) process.exit(0);

  // The directory the commit runs in: the first `cd` in the command, else the session's cwd.
  const cdm = cmd.match(/\bcd\s+(?:"([^"]+)"|'([^']+)'|(\S+))/);
  let dir = cdm ? (cdm[1] || cdm[2] || cdm[3]) : (j.cwd || process.cwd());
  dir = dir.replace(/^\/([a-zA-Z])\//, (m, d) => d.toUpperCase() + ':/');
  const checker = path.join(dir, 'tools', 'classifier', 'check_rules.py');
  if (!fs.existsSync(checker)) {
    process.stderr.write('Commit blocked: rules page staged but ' + checker + ' not found.\n');
    process.exit(2);
  }
  const r = spawnSync('python', [checker, ...pages], { cwd: dir, encoding: 'utf8' });
  if (r.status === 0) process.exit(0);
  process.stderr.write(
    'Commit blocked by the rules gate (tools/classifier/check_rules.py):\n' +
    (r.stdout || '') + (r.stderr || '') +
    'Fix the rules page (reuse lines from docs/classifier/tools-survey.md, evidence files that exist) and commit again.\n'
  );
  process.exit(2);
});
