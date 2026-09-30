"""U63's four mutants, each applied alone, the named test run, the file restored byte for byte.

Run from app/. Browser mutants rebuild the app (dist) first and run through the lane's config on
port 4673; the unit mutant runs vitest. Prints one line per mutant: caught (the test failed) or
SURVIVED, with the test's exit code. Restores every file even on an error, and rebuilds dist at the end.
"""
import os
import subprocess
import sys

APP = os.getcwd()
CSS = os.path.join(APP, 'src', 'style.css')
TODAY = os.path.join(APP, 'src', 'ui', 'screens', 'TodayScreen.ts')
LOG = os.path.join(APP, 'build', 'u63', 'mutants')
os.makedirs(LOG, exist_ok=True)

PW = 'npx playwright test --config build/u63/playwright.u63-4673.config.ts today.spec.ts'
MUTANTS = [
    {
        'id': 'M1', 'name': 'the reason clamped back to one line', 'file': CSS,
        'old': '  line-height: 1.25;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  line-clamp: 2;\n',
        'new': '  line-height: 1.25;\n  display: -webkit-box;\n  -webkit-line-clamp: 1;\n  line-clamp: 1;\n',
        'build': True, 'test': PW + ' -g "C6’s learner"',
        'killer': 'today.spec.ts › the reason keeps its deciding clause at 342 × 740 (U63) › C6’s learner … (wholeReason: whole)',
    },
    {
        'id': 'M2', 'name': 'the clause dropped (rowFor cuts the subtitle at its " — ")', 'file': TODAY,
        'old': 'subtitle: cardLine(slot.reason, slot.claim),',
        'new': "subtitle: cardLine(slot.reason, slot.claim).split(' — ')[0],",
        'build': True, 'test': PW + ' -g "C6’s learner"',
        'killer': 'today.spec.ts › … › C6’s learner … (toHaveText)',
    },
    {
        'id': 'M3', 'name': 'the reason’s clamp removed (the held line takes three lines)', 'file': CSS,
        'old': '  line-height: 1.25;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  line-clamp: 2;\n  -webkit-box-orient: vertical;\n',
        'new': '  line-height: 1.25;\n',
        'build': True, 'test': PW + ' -g "the held line"',
        'killer': 'today.spec.ts › … › the held line … (two-line bound; everyRow height)',
    },
    {
        'id': 'M4', 'name': 'G94’s mark removed from the swap sheet', 'file': TODAY,
        'old': 'badges: held ? [lifecycleBadge(held)] : [],',
        'new': 'badges: [],',
        'build': False, 'test': 'npx vitest run tests/unit/todaySwapWearsTheLifecycle.test.ts',
        'killer': 'todaySwapWearsTheLifecycle.test.ts › paused: Paused beside the option (and put away, and the running card’s sheet)',
    },
]


def run(cmd, log):
    with open(log, 'w', encoding='utf8') as out:
        return subprocess.call(cmd, shell=True, cwd=APP, stdout=out, stderr=subprocess.STDOUT, env={**os.environ, 'U63_DIST': 'dist'})


only = sys.argv[1:]
results = []
for m in MUTANTS:
    if only and m['id'] not in only:
        continue
    with open(m['file'], 'rb') as f:
        raw = f.read()
    text = raw.decode('utf8')
    crlf = '\r\n' in text
    old = m['old'].replace('\n', '\r\n') if crlf else m['old']
    new = m['new'].replace('\n', '\r\n') if crlf else m['new']
    if text.count(old) != 1:
        results.append(f"{m['id']} NOT APPLIED: the snippet occurs {text.count(old)} times")
        continue
    try:
        with open(m['file'], 'wb') as f:
            f.write(text.replace(old, new).encode('utf8'))
        if m['build']:
            code = run('npm run build:app', os.path.join(LOG, f"{m['id']}-build.log"))
            if code != 0:
                results.append(f"{m['id']} BUILD FAILED ({code})")
                continue
        code = run(m['test'], os.path.join(LOG, f"{m['id']}-test.log"))
        verdict = 'caught' if code != 0 else 'SURVIVED'
        results.append(f"{m['id']} {verdict} (test exit {code}): {m['name']} -> {m['killer']}")
    finally:
        with open(m['file'], 'wb') as f:
            f.write(raw)
        with open(m['file'], 'rb') as f:
            assert f.read() == raw, f"{m['file']} not restored"

code = run('npm run build:app', os.path.join(LOG, 'restore-build.log'))
results.append(f'dist rebuilt from the restored sources: exit {code}')
print('\n'.join(results))
with open(os.path.join(LOG, 'mutants.txt'), 'w', encoding='utf8') as f:
    f.write('\n'.join(results) + '\n')
