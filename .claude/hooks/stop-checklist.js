// Stop hook: before a turn ends, put the checklist back in front of the model once.
// The checklist is read from CLAUDE.md so there is one copy of it, not two.
// `stop_hook_active` is true on the continuation this hook itself caused; letting
// that one stop is what prevents an endless loop.
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(input); } catch { /* no payload: still run */ }
  if (payload.stop_hook_active) process.exit(0);

  // The repository is two levels above this file. Not CLAUDE_PROJECT_DIR: sessions are
  // often opened on the parent folder, which has no CLAUDE.md and is not a git repo.
  const root = path.resolve(__dirname, '..', '..');
  let checklist = '(CLAUDE.md could not be read — run the checklist from docs/prompts/working-rules.md)';
  try {
    const md = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');
    const start = md.indexOf('## Before reporting any piece of work');
    if (start !== -1) {
      const next = md.indexOf('\n## ', start + 5);
      checklist = md.slice(start, next === -1 ? undefined : next).trim();
    }
  } catch { /* keep the fallback text */ }

  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason:
      'Checklist pass before this turn ends. Check what you just reported against the list below. ' +
      'If it finds a fault, fix it and say plainly what it caught. If it finds nothing, reply with ' +
      'one line: "Checklist: nothing found." Do not restate the report.\n\n' + checklist,
  }));
});
