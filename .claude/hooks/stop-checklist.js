// Stop hook: before a turn ends, put the four "before reporting" questions back in
// front of the model once, and only when the turn was substantial enough to have
// reported something.
//
// Rewritten 2026-09-25 after an outside audit found the previous version was making
// the model spend whole turns auditing the wording of its own report. Two changes:
// the questions are read from CLAUDE.md as before (one copy), and the preamble says a
// correction is owed only where it would change a decision. A turn whose last
// message is short (an acknowledgement, a one-line answer, a question back to the
// owner) is let through without the pass at all.
//
// `stop_hook_active` is true on the continuation this hook itself caused; letting
// that one stop is what prevents an endless loop.
const fs = require('fs');
const path = require('path');

const SHORT_TURN_CHARS = 600;

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(input); } catch { /* no payload: still run */ }
  if (payload.stop_hook_active) process.exit(0);
  if (lastAssistantTextLength(payload.transcript_path) < SHORT_TURN_CHARS) process.exit(0);

  // The repository is two levels above this file. Not CLAUDE_PROJECT_DIR: sessions are
  // often opened on the parent folder, which has no CLAUDE.md and is not a git repo.
  const root = path.resolve(__dirname, '..', '..');
  let checklist = '(CLAUDE.md could not be read — run §11 of docs/prompts/operating-procedure.md)';
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
      'Before this turn ends, run the four questions below against what you just reported. ' +
      'Fix a fault only if it would change what the owner or the next agent does, and say in ' +
      'one line what it caught. Wording alone earns nothing. If nothing would change, reply ' +
      'with the single line "Checklist: nothing found." Do not restate the report.\n\n' + checklist,
  }));
});

// The length of the last assistant message's text in the transcript, or a large
// number when the transcript cannot be read, so an unreadable transcript still gets
// the pass rather than skipping it.
function lastAssistantTextLength(transcriptPath) {
  if (!transcriptPath) return Number.MAX_SAFE_INTEGER;
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i].trim();
      if (!line) continue;
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      if (entry.type !== 'assistant') continue;
      const content = entry.message && entry.message.content;
      if (!Array.isArray(content)) return Number.MAX_SAFE_INTEGER;
      let length = 0;
      let sawToolUse = false;
      for (const block of content) {
        if (block.type === 'text' && typeof block.text === 'string') length += block.text.length;
        if (block.type === 'tool_use') sawToolUse = true;
      }
      // A message that is only tool calls is mid-turn, not a report: keep looking back
      // would be wrong too, so treat it as substantial and let the pass run.
      if (sawToolUse && length === 0) return Number.MAX_SAFE_INTEGER;
      return length;
    }
  } catch { /* fall through */ }
  return Number.MAX_SAFE_INTEGER;
}
