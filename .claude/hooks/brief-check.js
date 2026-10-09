// PreToolUse on Agent and SendMessage: a brief does not go out until the full checklist
// (CLAUDE.md, "Before reporting any piece of work", the same copy the stop hook reads) has
// been run against it (the owner, 2026-10-08: "each brief should be run by the full
// checklist that we have", after briefs went out that did the next step's work and opened
// open-ended searches; the stop checklist runs only after a reply, too late for a brief).
// The brief must carry a line starting "Brief check:" saying the checklist was run on it and
// what it changed. The line is a reminder that lets the brief through, not evidence that the
// brief was checked: the hook cannot tell whether the pass happened, and nothing here verifies
// a brief independently (2026-10-09). The brief auditor agent hook is the only independent look.
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let text = '';
  try {
    const t = JSON.parse(input).tool_input || {};
    text = String(t.prompt || t.message || '');
  } catch (e) {
    process.exit(0);
  }
  const root = path.resolve(__dirname, '..', '..');

  // A reminder only: the line is accepted as written, never treated as proof of a check.
  if (/^\s*Brief check:/m.test(text)) process.exit(0);
  // Both sections of CLAUDE.md: the brief questions (mistakes made in briefs, the owner,
  // 2026-10-08) first, then the eight reporting questions.
  const section = (md, heading) => {
    const start = md.indexOf(heading);
    if (start === -1) return '(CLAUDE.md has no "' + heading.slice(3) + '" section)';
    const next = md.indexOf('\n## ', start + 5);
    return md.slice(start, next === -1 ? undefined : next).trim();
  };
  let checklist = '(CLAUDE.md could not be read: run its "Before sending any brief" and "Before reporting any piece of work" questions)';
  try {
    const md = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');
    checklist = section(md, '## Before sending any brief') + '\n\n' + section(md, '## Before reporting any piece of work');
  } catch (e) { /* keep the fallback */ }

  process.stderr.write(
    'Brief not sent. Run every question below against this brief, as if the brief were the report: ' +
    'its goal against the owner\'s words, its scope, its inputs, its end condition, its rules. ' +
    'Fix the brief where a question finds a fault, then add a line starting "Brief check:" ' +
    'saying what the pass changed (or "nothing found"), and send again. The line is a reminder, ' +
    'not evidence that the brief was checked.\n\n' + checklist + '\n'
  );
  process.exit(2);
});
