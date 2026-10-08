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
  const root = path.resolve(__dirname, '..', '..');

  if (/^\s*Brief check:/m.test(text)) {
    // A brief that writes, checks or applies Phase 2 rules must carry one template's binding
    // block word for word (the owner, 2026-10-08: chunk 1's briefs narrowed the library-first
    // rule and the agents never searched outside the repo).
    // Any brief that writes, checks or applies rules (path written either way, or named in words).
    if (!/rules[\\/]area-|phase 2 rules|rules pages?|rules for (one |an )?area/i.test(text)) process.exit(0);
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const block = (s) => {
      const m = s.match(/<!-- binding:start -->([\s\S]*?)<!-- binding:end -->/);
      return m ? norm(m[1]) : null;
    };
    const sent = block(text);
    const dir = path.join(root, 'docs', 'prompts', 'briefs');
    let known = [];
    try {
      known = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
        .map((f) => block(fs.readFileSync(path.join(dir, f), 'utf8'))).filter(Boolean);
    } catch (e) { /* no templates: block below */ }
    if (sent && known.includes(sent)) process.exit(0);
    process.stderr.write(
      'Brief not sent: a rules brief must carry the binding block of one template in ' +
      'docs/prompts/briefs/ (rules-writer, rules-checker or rules-apply) word for word, ' +
      'between its <!-- binding:start --> and <!-- binding:end --> markers. ' +
      (sent ? 'The block sent differs from every template.' : 'No binding block was found.') + '\n'
    );
    process.exit(2);
  }
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
    'saying what the pass changed (or "nothing found"), and send again.\n\n' + checklist + '\n'
  );
  process.exit(2);
});
