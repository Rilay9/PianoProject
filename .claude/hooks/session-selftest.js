// SessionStart: check, at the start of every session, that the checklist hooks are registered
// and behave (the owner, 2026-10-08: "There should be another hook for that", after the brief
// hook was added mid-session and did not fire; hook settings are read when a session starts,
// so a registration found here is the one this session runs). Prints one line into the
// session's context: OK, or what failed.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const fails = [];

// The settings the session actually loads: the session's project folder (CLAUDE_PROJECT_DIR,
// often the parent "Piano Stuff" folder), settings.json and settings.local.json, plus the repo's
// own (the process review of 2026-10-08 found the hooks registered only where no session read them).
const proj = process.env.CLAUDE_PROJECT_DIR || root;
const hooks = {};
for (const f of [path.join(proj, '.claude', 'settings.json'), path.join(proj, '.claude', 'settings.local.json')]) {
  try {
    const h = JSON.parse(fs.readFileSync(f, 'utf8')).hooks || {};
    for (const k of Object.keys(h)) hooks[k] = (hooks[k] || []).concat(h[k]);
  } catch (e) { /* absent file */ }
}
const registered = (event, script, matcher) =>
  (hooks[event] || []).some(
    (h) => (!matcher || new RegExp(matcher).test(h.matcher || '')) &&
      (h.hooks || []).some((x) => String(x.command || '').includes(script))
  );
if (!registered('Stop', 'stop-checklist.js')) fails.push('Stop checklist not registered');
if (!registered('PreToolUse', 'commit-gate.js', 'Bash')) fails.push('rules commit gate not registered');
// The independent brief auditor (an agent hook) must carry the repo's current prompt.
try {
  const want = fs.readFileSync(path.join(__dirname, 'brief-auditor-prompt.md'), 'utf8').replace(/\r/g, '');
  const ok = (hooks.PreToolUse || []).some((h) => /Agent/.test(h.matcher || '') &&
    (h.hooks || []).some((x) => x.type === 'agent' && String(x.prompt || '').replace(/\r/g, '') === want));
  if (!ok) fails.push('brief auditor not registered with the current prompt (run .claude/hooks/install_hooks.py)');
} catch (e) { fails.push('brief auditor prompt file missing'); }
if (!registered('PreToolUse', 'brief-check.js', 'Agent') || !registered('PreToolUse', 'brief-check.js', 'SendMessage'))
  fails.push('brief check not registered for Agent and SendMessage');

const run = (script, payload) =>
  spawnSync(process.execPath, [path.join(__dirname, script)], { input: JSON.stringify(payload), encoding: 'utf8' });
const bare = run('brief-check.js', { tool_input: { prompt: 'do x' } });
if (bare.status !== 2 || !/Before reporting any piece of work/.test(bare.stderr || '')) fails.push('brief check does not block a brief without its check line');
if (!/Before sending any brief/.test(bare.stderr || '') || !/Reuse first/.test(bare.stderr || '')) fails.push('brief check does not print the brief questions');
const checked = run('brief-check.js', { tool_input: { prompt: 'Brief check: nothing found\ndo x' } });
if (checked.status !== 0) fails.push('brief check blocks a brief that has its check line');
const rulesBare = run('brief-check.js', { tool_input: { prompt: 'Brief check: nothing found\nwrite docs/classifier/rules/area-2D.md' } });
if (rulesBare.status !== 2) fails.push('brief check lets a rules brief through without a template binding block');
const stop = run('stop-checklist.js', {});
if (!/"decision":"block"/.test(stop.stdout || '')) fails.push('stop checklist does not block');

process.stdout.write(
  fails.length
    ? 'Hook self-test FAILED: ' + fails.join('; ') + '. Tell the owner before any brief goes out.\n'
    : 'Hook self-test OK: stop checklist, brief check, brief auditor and rules commit gate registered; the command hooks behave.\n'
);
process.exit(0);
