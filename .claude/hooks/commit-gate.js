// PreToolUse on Bash and PowerShell: a git commit that would land a Phase 2 rules page
// (docs/classifier/rules/area-*.md) runs tools/classifier/check_rules.py on it first and is
// blocked if any rule lacks its reuse line, cites a tool the survey does not list for it, or
// claims a validation whose evidence file does not exist (the owner, 2026-10-08: enforce the
// library-first rule where work is accepted, with the hooks, not by reminders).
// Revised after the process review of 2026-10-08: it reads the files actually staged (plus any
// named in the same command's git add), only for a real `git commit`, ignores deletions, and
// accepts backslash paths.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const winPath = (p) => p.replace(/^\/([a-zA-Z])\//, (m, d) => d.toUpperCase() + ':/');

let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let j = {};
  try { j = JSON.parse(input); } catch (e) { process.exit(0); }
  const cmd = String((j.tool_input || {}).command || '').replace(/\\/g, '/');
  const segs = cmd.split(/&&|\|\||;|\||\n/).map((s) => s.trim());

  // A segment is a commit when its git subcommand (after options such as -C <dir>) is commit.
  const isCommit = (s) => {
    const m = s.match(/^git((?:\s+-[cC]\s+(?:"[^"]*"|'[^']*'|\S+)|\s+--?[\w-]+(?:=\S+)?)*)\s+commit\b/);
    return !!m;
  };
  if (!segs.some(isCommit)) process.exit(0);

  // The directory: git -C <dir>, else the first cd, else the session cwd.
  const gc = cmd.match(/\bgit\s+-C\s+(?:"([^"]+)"|'([^']+)'|(\S+))/);
  const cd = cmd.match(/\bcd\s+(?:"([^"]+)"|'([^']+)'|(\S+))/);
  let dir = gc ? (gc[1] || gc[2] || gc[3]) : cd ? (cd[1] || cd[2] || cd[3]) : (j.cwd || process.cwd());
  dir = winPath(dir);

  const pages = new Set();
  const re = /docs\/classifier\/rules\/area-[\w.-]+\.md/g;
  for (const s of segs) if (/^git\b.*\badd\b/.test(s)) (s.match(re) || []).forEach((p) => pages.add(p));
  const staged = spawnSync('git', ['-C', dir, 'diff', '--cached', '--name-only', '--diff-filter=AMR'], { encoding: 'utf8' });
  (staged.stdout || '').split(/\r?\n/).forEach((p) => { if (re.test(p)) pages.add(p.trim()); re.lastIndex = 0; });
  const present = [...pages].filter((p) => fs.existsSync(path.join(dir, p)));
  if (!present.length) process.exit(0);

  const checker = path.join(dir, 'tools', 'classifier', 'check_rules.py');
  if (!fs.existsSync(checker)) {
    process.stderr.write('Commit blocked: a rules page is being committed but ' + checker + ' is missing.\n');
    process.exit(2);
  }
  const r = spawnSync('python', [checker, ...present], { cwd: dir, encoding: 'utf8' });
  if (r.status === 0) process.exit(0);
  process.stderr.write(
    'Commit blocked by the rules gate (tools/classifier/check_rules.py):\n' +
    (r.stdout || '') + (r.stderr || '') +
    'Fix the rules page (reuse lines matching the tools survey row, evidence files under docs/classifier/evidence/) and commit again.\n'
  );
  process.exit(2);
});
