"""U119: copies the kept run files into docs/prompts/runs/U119/ and the pictures into docs/prompts/pictures/u119/,
machine paths replaced by <worktree> and <home>, and refuses any kept text file over 300 KB.
Idempotent: every run rewrites the same destinations from the same sources."""
import os
import re
import shutil

here = os.path.dirname(os.path.abspath(__file__))          # <worktree>/build/u119
wt = os.path.normpath(os.path.join(here, '..', '..'))
app_u119 = os.path.join(wt, 'app', 'build', 'u119')
runs = os.path.join(wt, 'docs', 'prompts', 'runs', 'U119')
pics = os.path.join(wt, 'docs', 'prompts', 'pictures', 'u119')
os.makedirs(runs, exist_ok=True)
os.makedirs(pics, exist_ok=True)

home = os.path.expanduser('~')
patterns = []
for root, token in ((wt, '<worktree>'), (home, '<home>')):
    for form in {root, root.replace('\\', '/'), root.replace('\\', '\\\\')}:
        patterns.append((re.compile(re.escape(form), re.IGNORECASE), token))


def scrub(text: str) -> str:
    for rx, token in patterns:
        text = rx.sub(token, text)
    return text


TEXT = {
    # run logs
    'npm-ci.txt': [os.path.join(here, 'npm-ci.log')],
    'build-app-base.txt': [os.path.join(here, 'build-app-base.log')],
    'build-app-fix.txt': [os.path.join(here, 'build-app-fix.log')],
    'build-app-after-mutants.txt': [os.path.join(here, 'build-app-after-mutants.log'), os.path.join(here, 'build-app-after-mutants.txt')],
    'build-m1.txt': [os.path.join(here, 'build-m1.log')],
    'build-m2.txt': [os.path.join(here, 'build-m2.log')],
    'tsc.txt': [os.path.join(here, 'tsc-final.log')],
    'lint.txt': [os.path.join(here, 'lint-final.log')],
    'browser-red-base.txt': [os.path.join(here, 'browser-red-base.txt')],
    'browser-red-base-failures.txt': [os.path.join(here, 'browser-red-base-failures.txt')],
    'browser-green.txt': [os.path.join(here, 'browser-green.txt')],
    'browser-green-repeat.txt': [os.path.join(here, 'browser-green-repeat.txt')],
    'browser-green-after-mutants.txt': [os.path.join(here, 'browser-green-after-mutants.txt')],
    'browser-green-final.txt': [os.path.join(here, 'browser-green-final.txt')],
    'score-screen-whole.txt': [os.path.join(here, 'score-screen-whole.txt')],
    'score-one-row.txt': [os.path.join(here, 'score-one-row.txt')],
    'mutants.txt': [os.path.join(here, 'mutants.txt')],
    'm1-score-screen.txt': [os.path.join(here, 'm1-score-screen.txt')],
    'm1-failures.txt': [os.path.join(here, 'm1-failures.txt')],
    'm2-new-cases.txt': [os.path.join(here, 'm2-new-cases.txt')],
    'm2-failures.txt': [os.path.join(here, 'm2-failures.txt')],
    'unit-targeted.txt': [os.path.join(here, 'unit-targeted.txt')],
    'probe-smoke-run.txt': [os.path.join(here, 'probe-smoke-run.txt')],
    'probe-grid-run.txt': [os.path.join(here, 'probe-grid-run.txt')],
    'probe-grid-table.txt': [os.path.join(here, 'probe-grid-table.txt')],
    'probe-long-run.txt': [os.path.join(here, 'probe-long-run.txt')],
    'probe-long-table.txt': [os.path.join(here, 'probe-long-table.txt')],
    'probe-final-run.txt': [os.path.join(here, 'probe-final-run.txt')],
    'probe-final-table.txt': [os.path.join(here, 'probe-final-table.txt')],
    'probe-finallong-run.txt': [os.path.join(here, 'probe-finallong-run.txt')],
    'probe-finallong-table.txt': [os.path.join(here, 'probe-finallong-table.txt')],
    'pictures-before-run.txt': [os.path.join(here, 'pictures-before-run.txt')],
    'pictures-after-run.txt': [os.path.join(here, 'pictures-after-run.txt')],
    # scripts
    'scripts-probe.spec.ts': [os.path.join(app_u119, 'probe', 'probe.spec.ts')],
    'scripts-pictures.spec.ts': [os.path.join(app_u119, 'pictures', 'pictures.spec.ts')],
    'scripts-playwright.u119-5323.config.ts': [os.path.join(app_u119, 'playwright.u119-5323.config.ts')],
    'scripts-mutant.py': [os.path.join(app_u119, 'mutant.py')],
    'scripts-summarise.py': [os.path.join(here, 'summarise.py')],
    'scripts-table.py': [os.path.join(here, 'table.py')],
    'scripts-failures.py': [os.path.join(here, 'failures.py')],
    'scripts-keep.py': [os.path.join(here, 'keep.py')],
    'scripts-same_where_fits.py': [os.path.join(here, 'same_where_fits.py')],
    'same-where-fits.txt': [os.path.join(here, 'same-where-fits.txt')],
    'built-css-before-comment.txt': [os.path.join(here, 'built-css-before-comment.txt')],
    'built-css-after-comment.txt': [os.path.join(here, 'built-css-after-comment.txt')],
    'build-app-final-comment.txt': [os.path.join(here, 'build-app-final-comment.log')],
}
for cell in (
    'grid-667x375-t100-wider-base', 'grid-667x375-t100-wider-h1', 'grid-667x375-t100-wider-h1e',
    'grid-667x375-t100-stack-base', 'grid-667x375-t100-stack-h1',
    'long-568x320-t115-wider-h1', 'long-568x320-t115-wider-h1h2sim', 'long-568x320-t115-wider-h2sim',
    'long-640x360-t115-wider-h1', 'long-780x360-t115-wider-h2sim', 'long-667x375-t100-wider-h2sim',
    'final-667x375-t100-wider-base', 'final-568x320-t115-wider-base',
):
    TEXT[f'probe-json-{cell}.json'] = [os.path.join(here, 'probe-out', f'{cell}.json')]

for name, sources in TEXT.items():
    parts = []
    for src in sources:
        parts.append(open(src, encoding='utf-8', errors='replace').read())
    text = scrub('\n'.join(parts))
    data = text.encode('utf-8')
    assert len(data) <= 300 * 1024, f'{name} is over 300 KB'
    open(os.path.join(runs, name), 'wb').write(data)

PICS = {
    **{f: os.path.join(here, 'pictures-out', f) for f in os.listdir(os.path.join(here, 'pictures-out')) if f.endswith('.png')},
    'bar-667x375-wider-face-before.png': os.path.join(here, 'probe-out', 'grid-667x375-t100-wider-base.png'),
    'bar-667x375-wider-face-h1-clip.png': os.path.join(here, 'probe-out', 'grid-667x375-t100-wider-h1.png'),
    'bar-667x375-wider-face-not-built-ellipsis.png': os.path.join(here, 'probe-out', 'grid-667x375-t100-wider-h1e.png'),
}
for name, src in PICS.items():
    shutil.copyfile(src, os.path.join(pics, name))

leaks = []
for d in (runs, pics):
    for f in os.listdir(d):
        p = os.path.join(d, f)
        if f.endswith('.png'):
            continue
        t = open(p, encoding='utf-8', errors='replace').read()
        if any(rx.search(t) for rx, _ in patterns) or os.path.basename(home).lower() in t.lower():
            leaks.append(f)
print(f'kept {len(TEXT)} text files, {len(PICS)} pictures; machine-path leaks: {leaks}')
