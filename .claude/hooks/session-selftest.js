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

let hooks = {};
try {
  hooks = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'settings.json'), 'utf8')).hooks || {};
} catch (e) {
  fails.push('settings.json unreadable');
}
const registered = (event, script, matcher) =>
  (hooks[event] || []).some(
    (h) => (!matcher || new RegExp(matcher).test(h.matcher || '')) &&
      (h.hooks || []).some((x) => String(x.command || '').includes(script))
  );
if (!registered('Stop', 'stop-checklist.js')) fails.push('Stop checklist not registered');
if (!registered('PreToolUse', 'brief-check.js', 'Agent') || !registered('PreToolUse', 'brief-check.js', 'SendMessage'))
  fails.push('brief check not registered for Agent and SendMessage');

const run = (script, payload) =>
  spawnSync(process.execPath, [path.join(__dirname, script)], { input: JSON.stringify(payload), encoding: 'utf8' });
const bare = run('brief-check.js', { tool_input: { prompt: 'do x' } });
if (bare.status !== 2 || !/Before reporting any piece of work/.test(bare.stderr || '')) fails.push('brief check does not block a brief without its check line');
if (!/Before sending any brief/.test(bare.stderr || '') || !/Reuse first/.test(bare.stderr || '')) fails.push('brief check does not print the brief questions');
const checked = run('brief-check.js', { tool_input: { prompt: 'Brief check: nothing found\ndo x' } });
if (checked.status !== 0) fails.push('brief check blocks a brief that has its check line');
const stop = run('stop-checklist.js', {});
if (!/"decision":"block"/.test(stop.stdout || '')) fails.push('stop checklist does not block');

process.stdout.write(
  fails.length
    ? 'Hook self-test FAILED: ' + fails.join('; ') + '. Tell the owner before any brief goes out.\n'
    : 'Hook self-test OK: stop checklist and brief check registered and behaving.\n'
);
process.exit(0);
