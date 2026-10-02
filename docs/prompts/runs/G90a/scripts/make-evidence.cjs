// Builds the kept evidence under docs/prompts/runs/G90a from the lane's logs under build/g90a, and the pictures
// under docs/prompts/pictures/g90a. Machine paths are replaced by <worktree> and <home>; no kept log is over
// 300 KB (the full unit log is reduced to its summary and the failing names). Run from the worktree root.
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = process.cwd();
const src = path.join(root, 'build', 'g90a');
const out = path.join(root, 'docs', 'prompts', 'runs', 'G90a');
const pictures = path.join(root, 'docs', 'prompts', 'pictures', 'g90a');
fs.mkdirSync(path.join(out, 'scripts'), { recursive: true });
fs.mkdirSync(pictures, { recursive: true });

function clean(text) {
  const forms = (value) => [value, value.replace(/\\/g, '/'), value.replace(/\\/g, '\\\\'), encodeURI(value.replace(/\\/g, '/'))];
  for (const form of forms(root)) text = text.split(form).join('<worktree>');
  // The shell's own spelling of the same folder (`/c/Users/...`).
  const posix = root.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_all, letter) => '/' + letter.toLowerCase());
  text = text.split(posix).join('<worktree>');
  const home = os.homedir();
  for (const form of forms(home)) text = text.split(form).join('<home>');
  const homePosix = home.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_all, letter) => '/' + letter.toLowerCase());
  text = text.split(homePosix).join('<home>');
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

function keep(name, to = name, transform = (text) => text) {
  const text = clean(transform(fs.readFileSync(path.join(src, name), 'utf8')));
  if (Buffer.byteLength(text) > 300 * 1024) throw new Error(`${name} is over 300 KB`);
  fs.writeFileSync(path.join(out, to), text);
}

keep('red-unit-base.txt');
keep('e2e-red-base.txt');
keep('e2e-green.txt');
const m23 = [
  '',
  "M23 (browser, the layout claim) Today's row reason made too large to fit beside the controls and left to overflow (`app/src/style.css`, one rule",
  '    appended by `scripts/css-mutant.cjs`, the dist rebuilt for the run, the file put back and checked by checksum, the dist rebuilt again and the',
  '    spec run green: `e2e-green-restored.txt`)   CAUGHT, 2   (`e2e-m23.txt`)',
  "      session-held-skip.spec.ts > a piece paused / retired on its sheet ...: 'the reason is cut', at the first cell (342 × 740), in both states",
  '    The two swap walks do not measure the row and passed; the row is measured by the first two cases only.',
  '',
].join('\n');
keep('mutants.txt', 'mutants.txt', (text) => text.replace(/\s+$/, '\n') + m23);
keep('e2e-m23.txt');
keep('e2e-green-restored.txt');
keep('map-min.txt');

// The full unit run: the summary and the failing names, not the log.
const full = fs.readFileSync(path.join(src, 'unit-full.txt'), 'utf8');
const failing = [...new Set([...full.matchAll(/^ FAIL  (.+)$/gm)].map((found) => found[1]))];
const tail = full.slice(full.lastIndexOf(' Test Files'));
const alone = fs.readFileSync(path.join(src, 'unit-five-alone.txt'), 'utf8');
const aloneFailing = [...new Set([...alone.matchAll(/^ FAIL  (.+)$/gm)].map((found) => found[1]))];
const aloneTail = alone.slice(alone.lastIndexOf(' Test Files'));
const summary = [
  'The whole unit suite on the final tree (`npx vitest run`, app/): the full log was not kept; the summary and the failing cases are.',
  '',
  tail.trim(),
  '',
  'Failing in the full run:',
  ...failing.map((name) => `  ${name}`),
  '',
  'The five files of those, run alone on the same tree:',
  aloneTail.trim(),
  'Failing alone:',
  ...aloneFailing.map((name) => `  ${name}`),
  '',
].join('\n');
fs.writeFileSync(path.join(out, 'unit-summary.txt'), clean(summary));

// Scripts: the lane's browser config, the mutant runner and this script, as run.
const config = path.join(root, 'app', 'build', 'g90a', 'playwright.g90a.config.ts');
fs.writeFileSync(path.join(out, 'scripts', 'playwright.g90a.config.ts'), clean(fs.readFileSync(config, 'utf8')));
fs.writeFileSync(path.join(out, 'scripts', 'mutants.cjs'), clean(fs.readFileSync(path.join(src, 'mutants.cjs'), 'utf8')));
fs.writeFileSync(path.join(out, 'scripts', 'run-e2e.sh'), clean(fs.readFileSync(path.join(src, 'run-e2e.sh'), 'utf8')));
fs.writeFileSync(path.join(out, 'scripts', 'css-mutant.cjs'), clean(fs.readFileSync(path.join(src, 'css-mutant.cjs'), 'utf8')));
fs.writeFileSync(path.join(out, 'scripts', 'mutant-map.cjs'), clean(fs.readFileSync(path.join(src, 'mutant-map.cjs'), 'utf8')));
fs.writeFileSync(path.join(out, 'scripts', 'make-evidence.cjs'), fs.readFileSync(__filename, 'utf8'));

// Pictures: Today's skipped row, three designs, both states.
const taken = path.join(root, 'app', 'test-results', 'pictures', 'g90a');
for (const file of fs.readdirSync(taken)) fs.copyFileSync(path.join(taken, file), path.join(pictures, file));
console.log(fs.readdirSync(out).join(', '));
console.log(fs.readdirSync(pictures).join(', '));
