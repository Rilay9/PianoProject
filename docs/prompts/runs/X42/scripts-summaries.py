"""Write X42's summary files under build/x42/keep/ from the run logs (ANSI stripped; keep.py replaces machine paths)."""
import re
import subprocess
from pathlib import Path

ANSI = re.compile(r'\x1b\[[0-9;]*[A-Za-z]')
B = Path('build/x42')
K = B / 'keep'
K.mkdir(exist_ok=True)


def read(name):
    return ANSI.sub('', (B / name).read_text(encoding='utf-8', errors='replace'))


def lines_matching(text, pattern):
    return [l for l in text.splitlines() if re.search(pattern, l)]


# e2e: every test's result line and the totals, for the union run, the committed-build screenshot run and the rerun.
e2e = read('e2e.log')
out = ['X42 e2e: the check map union (29 specs) on port 4642 against the amended build (app/build/x42/dist).',
       'Full log not kept (100 KB of traces); every result line and the failure causes kept.', '']
out += lines_matching(e2e, r'^\s+(ok|x|-)\s+\d+ ')
out += ['', 'failure causes (Error lines, counted):']
causes = {}
for l in lines_matching(e2e, r'^\s+Error: '):
    key = re.sub(r"doesn't exist at .*?, writing actual", "doesn't exist at <spec>-snapshots/<cell>-win32.png, writing actual", l.strip())
    causes[key] = causes.get(key, 0) + 1
out += [f'  {n} x {k}' for k, n in causes.items()]
out += lines_matching(e2e, r'^\s+\d+ (passed|failed|skipped)') + lines_matching(e2e, r'^exit ')
shots = read('e2e-screenshots-committed-build.log')
out += ['', 'the 15 screenshot cells against the COMMITTED reader\'s build (app/build/x42/dist-before), compared with the',
        'references the amended build had just written:'] + lines_matching(shots, r'^\s+(ok|x)\s+\d+ |passed|failed')
rerun = read('e2e-rerun.log')
out += ['', 'excerpts, microscope, score.layout and score.spec rerun on the amended build with app/public/dev copied in:']
out += lines_matching(rerun, r'passed|failed|^\s+x\s')
(K / 'e2e-summary.txt').write_text('\n'.join(out) + '\n', encoding='utf-8')

# states: the error lines on both builds.
out = ['X42 state gallery (playwright.states.config.ts copied to port 4643), both builds. Full logs not kept.']
for name, label in (('states-amended.log', 'amended reader'), ('states-committed.log', 'committed reader')):
    t = read(name)
    out += ['', f'--- {label}:'] + lines_matching(t, r'^\s+Error: |^\s+[a-z0-9-]+--[a-z0-9-]+: |^\s+\d+ (passed|failed)|^exit ')
    out += lines_matching(t, r'"cell": ')[:10]
(K / 'states-summary.txt').write_text('\n'.join(out) + '\n', encoding='utf-8')

# unit, all: counts and failing names.
t = read('unit-all.log')
out = ['X42 full unit suite (npx vitest run) on the amended reader. Full log (900 KB) not kept.']
out += sorted(set(lines_matching(t, r'^ FAIL ')))
out += lines_matching(t, r'Test Files |^\s+Tests ')
(K / 'unit-all-summary.txt').write_text('\n'.join(out) + '\n', encoding='utf-8')

# probe
out = ['X42 product probe (app/build/x42/probe/tempo-probe.spec.ts): the model\'s own numbers, nothing heard.', '', '--- committed reader\'s build:']
out += lines_matching(read('probe-before.log'), r'X42PROBE|passed|failed')
out += ['', '--- amended reader\'s build:'] + lines_matching(read('probe-after.log'), r'X42PROBE|passed|failed')
(K / 'probe.txt').write_text('\n'.join(out) + '\n', encoding='utf-8')

# content tests
out = ['X42 content checks.', '', '--- python -m unittest ... -p test_measured_demands.py:', read('content-test-measured-demands.log').strip(),
       '', '--- python -m unittest ... -p test_measured_truth.py (after copying build/score-checks.json read-only):',
       read('content-test-measured-truth.log').strip(), '', '--- python tools/content/validate.py (tail):']
out += read('content-validate.log').strip().splitlines()[-3:]
(K / 'content-tests.txt').write_text('\n'.join(out) + '\n', encoding='utf-8')

# the red, red and green unit logs, whole (small)
for src, dest in (('red-committed.log', 'red-committed.txt'), ('red-ragtime7-fixed-reader-old-string.log', 'red-ragtime7-old-string-amended-reader.txt'),
                  ('green.log', 'green.txt'), ('baseline.log', 'baseline-committed.txt'), ('unit-env-rerun.log', 'unit-env-rerun.txt')):
    (K / dest).write_text(read(src), encoding='utf-8')

# the one-shot checks, run again for their output
for script, dest in (('build/x42/crlf_check.py', 'crlf-check.txt'), ('build/x42/x31_opening.py', 'x31-opening.txt')):
    run = subprocess.run(['python', script], capture_output=True, text=True, encoding='utf-8', errors='replace')
    (K / dest).write_text(run.stdout + run.stderr[-500:], encoding='utf-8')
print('written')
