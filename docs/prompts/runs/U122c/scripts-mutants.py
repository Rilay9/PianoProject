"""U122c's mutants: each a real source change, built, run against the cells that should catch it, and
restored byte for byte (checked by hash). Run from the worktree root; writes build/u122c-mutants/<id>.txt
and a summary to build/u122c-mutants/summary.txt."""
import hashlib
import os
import re
import subprocess
import sys

ROOT = os.getcwd()
APP = os.path.join(ROOT, 'app')
OUT = os.path.join(ROOT, 'build', 'u122c-mutants')
os.makedirs(OUT, exist_ok=True)
NPX = 'npx.cmd' if os.name == 'nt' else 'npx'
NPM = 'npm.cmd' if os.name == 'nt' else 'npm'

FOLDED_HEAD_RULE = ".screen--score[data-chrome='folded']:not([data-tablet='true']) .score-head {\n  display: none;\n}\n"
GLOBAL_ROW_RULE = ".screen--score[data-running='true'] .score-stage {\n  margin-bottom: 0;\n}\n"

MUTANTS = [
    {
        'id': 'm1-fold-on-a-run',
        'why': 'the fold asks whether a run exists, not whether the hands are on the keys (walk finding 5)',
        'file': 'app/src/ui/screens/scoreChrome.ts',
        'old': 'const handsOnKeys = facts.running && !facts.paused && !facts.finished;',
        'new': 'const handsOnKeys = facts.running && !facts.finished;',
        'grep': r'568x320 100% stack hcb|342x740 100% stack hcb',
        'specs': ['tests/e2e/score.task-chrome.spec.ts'],
        'unit': ['tests/unit/scoreChrome.test.ts'],
    },
    {
        'id': 'm2-count-on-the-stage',
        'why': 'the count-in drawn on the stage again (walk finding 8)',
        'file': 'app/src/ui/screens/ScoreScreen.ts',
        'old': '  bar.appendChild(countIn);',
        'new': '  stage.appendChild(countIn);',
        'grep': r'568x320 100% stack hcb|342x740 100% stack hcb|stays off the notation',
        'specs': ['tests/e2e/score.task-chrome.spec.ts', 'tests/e2e/score.countin.spec.ts'],
    },
    {
        'id': 'm3-row-taken-everywhere',
        'why': "the stage takes the bar's row during a run on every device, as before (the tablet's music grows at the run's start)",
        'file': 'app/src/style.css',
        'old': '/* The tempo label: its words are chosen by the row\'s chooser, long or short,',
        'new': GLOBAL_ROW_RULE + '\n/* The tempo label: its words are chosen by the row\'s chooser, long or short,',
        'grep': r'1366x1024 100% stack hcb|1024x768 100% stack hcb',
        'specs': ['tests/e2e/score.task-chrome.spec.ts'],
    },
    {
        'id': 'm4-header-leaves-upright',
        'why': 'the header leaves the flow when folded, upright, as before (the music jumps up at the fold)',
        'file': 'app/src/style.css',
        'old': '/* The tempo label: its words are chosen by the row\'s chooser, long or short,',
        'new': FOLDED_HEAD_RULE + '\n/* The tempo label: its words are chosen by the row\'s chooser, long or short,',
        'grep': r'342x740 100% stack hcb|768x1024 100% stack hcb',
        'specs': ['tests/e2e/score.task-chrome.spec.ts'],
    },
    {
        'id': 'm5-no-band-from-the-start',
        'why': "sideways, the sliding sheet not placed below the top line's band from the run's start",
        'file': 'app/src/style.css',
        'old': "  .screen--score[data-running='true'] .score-buffer {\n    top: var(--score-top-band);\n  }\n",
        'new': '',
        'grep': r'568x320 100% stack hcb|780x360 100% stack hcb',
        'specs': ['tests/e2e/score.task-chrome.spec.ts'],
    },
    {
        'id': 'm6-sheet-one-column-sideways',
        'why': 'the finished sheet one column sideways, as before (the next action below its first view)',
        'file': 'app/src/style.css',
        'old': '  .screen--score .summary-sheet {\n    display: grid;\n',
        'new': '  .screen--score .summary-sheet {\n',
        'grep': r'568x320 115% stack hcb|780x360 100% stack hcb',
        'specs': ['tests/e2e/score.task-chrome.spec.ts'],
    },
    {
        'id': 'm7-hands-floor-gone',
        'why': "R, L and Both back under the tap floor where they keep their place",
        'file': 'app/src/style.css',
        'old': ".score-group[data-floor='true'] > #score-hands-R,\n.score-group[data-floor='true'] > #score-hands-L,\n.score-group[data-floor='true'] > #score-hands-both {",
        'new': ".score-group[data-floor='never'] > #score-hands-R {",
        'grep': r'568x320 100% stack hcb|1366x1024 100% stack hcb',
        'specs': ['tests/e2e/score.task-chrome.spec.ts'],
    },
]


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def run(args, cwd, log):
    with open(log, 'a', encoding='utf-8', errors='replace') as f:
        f.write('$ ' + ' '.join(args) + '\n')
        f.flush()
        code = subprocess.call(args, cwd=cwd, stdout=f, stderr=subprocess.STDOUT)
        f.write(f'exit {code}\n')
    return code


only = set(sys.argv[1:])
summary = []
for m in MUTANTS:
    if only and m['id'] not in only:
        continue
    path = os.path.join(ROOT, m['file'])
    raw = open(path, 'rb').read()
    before = sha(path)
    crlf = b'\r\n' in raw
    text = raw.decode('utf-8')
    old = m['old'].replace('\n', '\r\n') if crlf else m['old']
    new = m['new'].replace('\n', '\r\n') if crlf else m['new']
    assert text.count(old) == 1, (m['id'], 'the original text is not there once')
    log = os.path.join(OUT, m['id'] + '.txt')
    open(log, 'w', encoding='utf-8').write(f"{m['id']}: {m['why']}\n{m['file']}\n")
    try:
        open(path, 'wb').write(text.replace(old, new).encode('utf-8'))
        if run([NPM, 'run', 'build:app'], APP, log) != 0:
            summary.append(f"{m['id']}: BUILD FAILED")
            continue
        unit = 0
        if m.get('unit'):
            unit = run([NPX, 'vitest', 'run', *m['unit']], APP, log)
        code = run([NPX, 'playwright', 'test', '--config', 'build/u122c/playwright.u122c.config.ts', *m['specs'], '--workers=2', '-g', m['grep']], APP, log)
        body = open(log, encoding='utf-8', errors='replace').read()
        failed = re.findall(r'^\s+(\d+) failed', body, re.M)
        passed = re.findall(r'^\s+(\d+) passed', body, re.M)
        summary.append(
            f"{m['id']}: browser exit {code}, failed {failed[-1] if failed else 0}, passed {passed[-1] if passed else 0}"
            + (f", unit exit {unit}" if m.get('unit') else '')
            + f" — {m['why']}"
        )
    finally:
        open(path, 'wb').write(raw)
        assert sha(path) == before, (m['id'], 'not restored')
    with open(os.path.join(OUT, 'summary.txt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(summary) + '\n')

# The tree as it is, built again.
code = run([NPM, 'run', 'build:app'], APP, os.path.join(OUT, 'rebuild.txt'))
summary.append(f'rebuild after the mutants: exit {code}')
with open(os.path.join(OUT, 'summary.txt'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(summary) + '\n')
print('\n'.join(summary))
