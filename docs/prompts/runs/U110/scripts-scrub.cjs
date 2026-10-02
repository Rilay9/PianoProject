// Replaces this machine's worktree and home paths in kept files with <worktree> and <home>.
// Usage: node scrub.cjs <file> [...]
const fs = require('node:fs');
const path = require('node:path');
const worktree = path.resolve(__dirname, '..', '..', '..');
const home = require('node:os').homedir();
const forms = (p) => [p, p.replace(/\\/g, '/')];
for (const file of process.argv.slice(2)) {
  let text = fs.readFileSync(file, 'utf8');
  for (const form of forms(worktree)) text = text.split(form).join('<worktree>');
  for (const form of forms(home)) text = text.split(form).join('<home>');
  fs.writeFileSync(file, text);
}
