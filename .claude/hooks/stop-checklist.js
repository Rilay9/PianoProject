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
// Revised 2026-09-29: length alone let "All tests green." through, which is exactly
// the kind of claim the pass exists for. A turn is now substantive when any of three
// signals holds: the last message makes a claim (a result word such as green, passed,
// done, fixed, verified, merged, landed, an exit code, "no errors"); the turn ran a
// tool that does work (an edit, a write, a shell command, an agent) since the last
// human message; or the last message is long. Short, claim-free, tool-free turns —
// "Okay.", a question back, the pass's own one-line reply — still skip it.
//
// `stop_hook_active` is true on the continuation this hook itself caused; letting
// that one stop is what prevents an endless loop.
const fs = require('fs');
const path = require('path');

const SHORT_TURN_CHARS = 600;
const CLAIM = /\b(green|pass(ed|es|ing)?|fail(ed|s|ing)?|done|fixed|verified|works?|working|merged|landed|pushed|committed|complete[ds]?|resolved|no (errors|failures|issues)|all (tests|checks|specs)|exit(ed)? ?(code )?\d|\d+ (passed|failed))\b/i;
const WORK_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'Bash', 'PowerShell', 'Agent', 'Workflow', 'SendMessage']);

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(input); } catch { /* no payload: still run */ }
  if (payload.stop_hook_active) process.exit(0);
  const turn = lastTurn(payload.transcript_path);
  if (!turn.substantive) process.exit(0);

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

// Reads the transcript backwards from its end to the last human message: the last
// assistant text (its length and whether it makes a claim) and whether any assistant
// message in between used a tool that does work. Unreadable transcript: substantive,
// so the pass runs rather than being skipped.
function lastTurn(transcriptPath) {
  const substantive = { substantive: true };
  if (!transcriptPath) return substantive;
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
    let lastText = null;
    let workTool = false;
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i].trim();
      if (!line) continue;
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      const content = entry.message && entry.message.content;
      if (entry.type === 'user') {
        // A tool result is stored as a user entry; a human message has a string or a
        // text block and no tool_result block.
        if (typeof content === 'string') break;
        if (Array.isArray(content) && !content.some((b) => b && b.type === 'tool_result')) break;
        continue;
      }
      if (entry.type !== 'assistant') continue;
      if (!Array.isArray(content)) return substantive;
      let text = '';
      for (const block of content) {
        if (block.type === 'text' && typeof block.text === 'string') text += block.text;
        if (block.type === 'tool_use' && WORK_TOOLS.has(block.name)) workTool = true;
      }
      if (lastText === null && text.length > 0) lastText = text;
    }
    if (lastText === null) return substantive; // only tool calls, or nothing read: let the pass run
    if (/^\s*Checklist:/i.test(lastText)) return { substantive: false };
    return {
      substantive: workTool || CLAIM.test(lastText) || lastText.length >= SHORT_TURN_CHARS,
    };
  } catch { /* fall through */ }
  return substantive;
}
