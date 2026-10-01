"""Assembles docs/prompts/runs/U122a/ from build/u122a/: the scripts (renamed scripts-*), the tables, the run
logs, a few cells' JSON and a few pictures. Machine paths become <worktree> and <home>; nothing over 300 KB."""
import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
WT = os.path.abspath(os.path.join(HERE, '..', '..'))
DEST = os.path.join(WT, 'docs', 'prompts', 'runs', 'U122a')
HOME = os.path.expanduser('~')
LIMIT = 300 * 1024


def scrub(text):
    for a in (WT, WT.replace('\\', '/'), WT.replace('\\', '\\\\')):
        text = text.replace(a, '<worktree>')
    for a in (HOME, HOME.replace('\\', '/'), HOME.replace('\\', '\\\\'), '/c/Users/' + os.path.basename(HOME), 'C:\\Users\\' + os.path.basename(HOME)):
        text = text.replace(a, '<home>')
    return text


def put_text(src, name):
    text = open(src, encoding='utf-8', errors='replace').read()
    text = scrub(text)
    out = os.path.join(DEST, name)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8', newline='\n').write(text)
    assert os.path.getsize(out) <= LIMIT, (name, os.path.getsize(out))


def put_bin(src, name):
    out = os.path.join(DEST, name)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    shutil.copyfile(src, out)
    assert os.path.getsize(out) <= LIMIT, (name, os.path.getsize(out))


app = os.path.join(WT, 'app', 'build', 'u122a')
scripts = {
    os.path.join(app, 'probe6', 'premise.spec.ts'): 'scripts-probe.spec.ts',
    os.path.join(app, 'probe', 'premise.spec.ts'): 'scripts-probe-firstpass.spec.ts',
    os.path.join(app, 'playwright.u122a-5383.config.ts'): 'scripts-playwright.u122a-5383.config.ts',
}
for f in ('run-chain.ps1', 'run-reruns.ps1', 'run-upright-c1.ps1', 'run-grids.ps1', 'analyse.py', 'checks.py', 'spread.py',
          'stale.py', 'heights.py', 'upright.py', 'runspread.py', 'peek.py', 'keep.py'):
    scripts[os.path.join(HERE, f)] = 'scripts-' + f
for src, name in scripts.items():
    put_text(src, name)

for f in ('summary.txt', 'music.txt', 'chrome.txt', 'texts.txt', 'refusal.txt', 'stability.txt', 'spread.txt', 'stale.txt',
          'heights.txt', 'checks.txt', 'upright.txt', 'npm-ci.txt', 'build-app.txt'):
    put_text(os.path.join(HERE, f), f)
for f in sorted(os.listdir(HERE)):
    if (f.startswith('run-') and f.endswith('.txt')) or (f.startswith('rerun-') and f.endswith('.txt')):
        put_text(os.path.join(HERE, f), f)

out = os.path.join(HERE, 'out')
cells = [
    'r-side-sideways-{c}-568x320-t115-stack-hcb', 'q-side-sideways-{c}-568x320-t115-stack-hcb',
    'r-side-sideways-{c}-568x320-t115-wider-hcb', 'q-side-sideways-{c}-568x320-t115-wider-hcb',
]
for pat in cells:
    for c in ('c1', 'c6'):
        put_text(os.path.join(out, pat.format(c=c) + '.json'), os.path.join('cells', pat.format(c=c) + '.json'))
for c in ('c1', 'c2', 'c3', 'c4', 'c5', 'c6'):
    n = f'r-side-sideways-{c}-780x360-t100-stack-moon'
    put_text(os.path.join(out, n + '.json'), os.path.join('cells', n + '.json'))
for c in ('c1', 'c4', 'c6'):
    n = f'r-extra-sideways-{c}-1200x360-t115-stack-hcb'
    put_text(os.path.join(out, n + '.json'), os.path.join('cells', n + '.json'))
for c in ('c1', 'c4'):
    for n in (f'r-tab-tablet-{c}-1024x768-t100-stack-moon', f'r-up-upright-{c}-280x740-t100-stack-moon'):
        put_text(os.path.join(out, n + '.json'), os.path.join('cells', n + '.json'))

for c, cell in (('c4', '568x320-t100-wider-moon'), ('c5', '568x320-t100-wider-moon'), ('c1', '568x320-t115-stack-moon'), ('c5', '568x320-t115-wider-moon'), ('c5', '640x360-t115-stack-moon')):
    n = f'f-side-sideways-{c}-{cell}'
    put_text(os.path.join(out, 'history', n + '.json'), os.path.join('cells', 'history', n + '.json'))

pics = os.path.join(out, 'pictures')
keep_pics = [
    'r-side-sideways-c1-780x360-t100-stack-hcb-rest.png',
    'r-side-sideways-c1-780x360-t100-stack-hcb-paused.png',
    'r-side-sideways-c1-780x360-t100-stack-hcb-run-folded.png',
    'r-side-sideways-c2-780x360-t100-stack-hcb-paused.png',
    'r-side-sideways-c3-780x360-t100-stack-hcb-rest.png',
    'r-side-sideways-c4-780x360-t100-stack-hcb-paused.png',
    'r-side-sideways-c5-780x360-t100-stack-hcb-paused.png',
    'r-side-sideways-c6-780x360-t100-stack-hcb-rest.png',
    'r-side-sideways-c6-780x360-t100-stack-hcb-paused.png',
    'r-side-sideways-c6-780x360-t100-stack-hcb-run-folded.png',
    'q-side-sideways-c1-568x320-t115-stack-hcb-rest-refused-hear.png',
    'q-side-sideways-c6-568x320-t115-stack-hcb-rest-refused-hear.png',
    'r-side-sideways-c1-568x320-t115-wider-hcb-paused.png',
    'r-side-sideways-c6-568x320-t115-wider-hcb-paused.png',
    'r-side-sideways-c1-780x360-t100-stack-moon-paused-refused-play.png',
    'r-side-sideways-c6-780x360-t100-stack-moon-paused-refused-play.png',
    'r-tab-tablet-c1-1024x768-t100-stack-moon-run-folded.png',
    'r-up-upright-c1-342x740-t100-stack-hcb-rest.png',
]
for p in keep_pics:
    put_bin(os.path.join(pics, p), os.path.join('pictures', p))

big = [(f, os.path.getsize(os.path.join(r, f))) for r, _, fs in os.walk(DEST) for f in fs if os.path.getsize(os.path.join(r, f)) > LIMIT]
print('kept', sum(len(fs) for _, _, fs in os.walk(DEST)), 'files; over the limit:', big)
