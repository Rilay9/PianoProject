"""Writes the lane's kept evidence into docs/prompts/runs/U122c/, machine paths replaced, each log trimmed to
its result lines where the full log would be long."""
import os
import re
import shutil
import sys

ROOT = os.getcwd()
OUT = os.path.join(ROOT, 'docs', 'prompts', 'runs', 'U122c')
os.makedirs(OUT, exist_ok=True)
HOME = os.path.expanduser('~')


def clean(text):
    text = text.replace(ROOT, '<worktree>').replace(ROOT.replace('\\', '/'), '<worktree>')
    text = text.replace(HOME, '<home>').replace(HOME.replace('\\', '/'), '<home>')
    text = re.sub(r'\x1b\[[0-9;]*m', '', text)
    return text


def results(src):
    """The run's per-test lines and its totals, and the first lines of each failure."""
    body = open(src, encoding='utf-8', errors='replace').read()
    keep = []
    lines = body.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if re.match(r'^\s+(ok|x|✓|✘|-)\s+\d+ ', line) or re.match(r'^\s+\d+ (passed|failed|flaky|skipped|did not run)', line) or line.startswith('Running ') or line.startswith('exit'):
            keep.append(line)
        elif re.match(r'^\s+\d+\) ', line):
            keep.append(line)
            # the failure's first error lines
            n = 0
            j = i + 1
            while j < len(lines) and n < 6:
                if lines[j].strip() and not lines[j].strip().startswith('at '):
                    keep.append(lines[j])
                    n += 1
                j += 1
        i += 1
    return '\n'.join(keep) + '\n'


def write(name, text, header=''):
    path = os.path.join(OUT, name)
    open(path, 'w', encoding='utf-8').write(clean(header + text))
    size = os.path.getsize(path)
    assert size < 300_000, (name, size)
    print(name, size)


what = sys.argv[1:]
if 'mutants' in what:
    parts = [open(os.path.join(ROOT, 'build', 'u122c-mutants', 'summary.txt'), encoding='utf-8').read(), '']
    for f in sorted(os.listdir(os.path.join(ROOT, 'build', 'u122c-mutants'))):
        if f.startswith('m') and f.endswith('.txt'):
            body = open(os.path.join(ROOT, 'build', 'u122c-mutants', f), encoding='utf-8', errors='replace').read()
            head = '\n'.join(body.splitlines()[:2])
            fails = sorted(set(re.findall(r'(?:rest|count-in|armed|playing|paused|refused|finished): [^\n"\\]{0,110}', body)))
            parts.append(f'== {head}\n' + results(os.path.join(ROOT, 'build', 'u122c-mutants', f)) + 'the checks that failed:\n  ' + '\n  '.join(fails[:20]) + '\n')
    write('mutants.txt', '\n'.join(parts), 'U122c mutants: each a real source change, built, run against the cells that should catch it, restored by hash (`scripts-mutants.py`). Run on the tree before the last two row fixes (the 90 % row count and upright today\'s row), which touch no mutated line.\n\n')
if 'base' in what:
    write('red-base-run.txt', results(os.path.join(ROOT, 'build', 'u122c-base', 'run-base.txt')), 'The red-first: the base (`af18a3ae`) app built from the base sources (`scripts-base-run.py`), and this lane\'s final walk spec run against it (subset and the suite cases).\n\n')
    shutil.copyfile(os.path.join(ROOT, 'build', 'base-final-counts.txt'), os.path.join(OUT, 'red-base-counts.txt'))
for item in what:
    if item.startswith('log='):
        name, src = item[4:].split(':', 1)
        write(name, results(os.path.join(ROOT, src)))
    if item.startswith('copy='):
        name, src = item[5:].split(':', 1)
        write(name, open(os.path.join(ROOT, src), encoding='utf-8', errors='replace').read())
