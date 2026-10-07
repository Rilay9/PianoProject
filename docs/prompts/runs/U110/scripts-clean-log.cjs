// Makes a Playwright list log captured through a PowerShell pipe readable: drops NULs and colour
// codes, turns each run of mangled non-ASCII bytes into ' / ', and replaces this machine's paths.
// Usage: node clean-log.cjs <in> <out>
const fs = require('node:fs');
const path = require('node:path');
const worktree = path.resolve(__dirname, '..', '..', '..');
let text = fs.readFileSync(process.argv[2], 'latin1');
text = text
  .replace(/\0/g, '')
  .replace(/\x1b\[[0-9;]*m/g, '')
  .replace(/[\x80-\xff]+/g, ' / ');
for (const form of [worktree, worktree.replace(/\\/g, '/')]) text = text.split(form).join('<worktree>');
fs.writeFileSync(process.argv[3], text);
