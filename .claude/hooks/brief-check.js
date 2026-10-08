// PreToolUse on Agent and SendMessage: a brief does not go out until the full checklist
// (CLAUDE.md, "Before reporting any piece of work", the same copy the stop hook reads) has
// been run against it (the owner, 2026-10-08: "each brief should be run by the full
// checklist that we have", after briefs went out that did the next step's work and opened
// open-ended searches; the stop checklist runs only after a reply, too late for a brief).
// The brief must carry a line starting "Brief check:" saying the checklist was run on it and
// what it changed.
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
  // The line must answer each of the eight questions by number, not claim the pass in a
  // sentence (the owner, 2026-10-08: "you're still not running the checklist", after
  // briefs carried a one-line claim that the checklist was run).
  const at = text.search(/^\s*Brief check:/m);
  if (at !== -1) {
    const seg = text.slice(at, at + 2500);
    const missing = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => !new RegExp('(^|[\\s;,(])' + n + '[ .:)]').test(seg));
    if (missing.length === 0) process.exit(0);
    process.stderr.write('Brief not sent: the Brief check line does not answer question(s) ' + missing.join(', ') + ' by number.\n');
    process.exit(2);
  }

  const root = path.resolve(__dirname, '..', '..');
  let checklist = '(CLAUDE.md could not be read: run its "Before reporting any piece of work" questions)';
  try {
    const md = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');
    const start = md.indexOf('## Before reporting any piece of work');
    if (start !== -1) {
      const next = md.indexOf('\n## ', start + 5);
      checklist = md.slice(start, next === -1 ? undefined : next).trim();
    }
  } catch (e) { /* keep the fallback */ }

  process.stderr.write(
    'Brief not sent. Run every question below against this brief, as if the brief were the report: ' +
    'its goal against the owner\'s words, its scope, its inputs, its end condition, its rules. ' +
    'Fix the brief where a question finds a fault, then add a line starting "Brief check:" ' +
    'answering each question by number (1 to 8: what it found, or OK), and send again.\n\n' + checklist + '\n'
  );
  process.exit(2);
});
