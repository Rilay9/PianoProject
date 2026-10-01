"""U118a: copy the kept run files into docs/prompts/runs/U118a/, machine paths replaced.

Idempotent: every file is rewritten whole from its source.
"""
import io
import os
import re
import subprocess
import sys

W = '<worktree>'
OUT = os.path.join(W, 'docs/prompts/runs/U118a')
B = os.path.join(W, 'build')
os.makedirs(OUT, exist_ok=True)

PATHS = [
    (re.compile(r'C:[\\/]+Users[\\/]+<user>[\\/]+repos[\\/]+Piano Stuff[\\/]+PianoProject[\\/]+\.claude[\\/]+worktrees[\\/]+<worktree-name>', re.I), '<worktree>'),
    (re.compile(r'<home>/repos/Piano Stuff/PianoProject/\.claude/worktrees/<worktree-name>', re.I), '<worktree>'),
    (re.compile(r'C:[\\/]+Users[\\/]+<user>', re.I), '<home>'),
    (re.compile(r'<home>', re.I), '<home>'),
    (re.compile(r'<runner-checkout>'), '<runner-checkout>'),
]


def clean(text: str) -> str:
    for pattern, repl in PATHS:
        text = pattern.sub(repl, text)
    # What is left of a machine path in this script's own patterns.
    return text.replace('<user>', '<user>').replace('<worktree-name>', '<worktree-name>')


def read(path: str) -> str:
    return open(path, encoding='utf-8', errors='replace').read()


def write(name: str, text: str) -> None:
    data = clean(text)
    with open(os.path.join(OUT, name), 'w', encoding='utf-8', newline='\n') as f:
        f.write(data.replace('\r\n', '\n'))
    size = len(data.encode('utf-8'))
    assert size < 300_000, f'{name} is {size} bytes'


def copy(src: str, name: str) -> None:
    write(name, read(src))


def run(cmd: list[str]) -> str:
    return subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace').stdout


# Scripts.
copy(os.path.join(W, 'app/build/u118a/probe/hands-probe.spec.ts'), 'scripts-hands-probe.spec.ts')
copy(os.path.join(W, 'app/build/u118a/playwright.u118a-5341.config.ts'), 'scripts-playwright.u118a-5341.config.ts')
for s in ['variant-run.sh', 'build-mutant.sh', 'run-spec.sh', 'mutate.py', 'summarise.py', 'summarise_steps.py',
          'scan_bare_clicks.py', 'collect.py', 'ci-history.sh']:
    copy(os.path.join(B, 'u118a', s), f'scripts-{s}')
copy(os.path.join(B, 'u118a/ci-history.txt'), 'ci-green-history.txt')

# The CI failure: the run's summary of the failing test, and the score.run neighbours.
ci = read(os.path.join(B, 'u118a/ci-failed.log')).splitlines()
keep = [line for line in ci if re.search(r'score\.run\.spec\.ts:|Running \d+ tests using|\d+ (failed|flaky|passed)', line)]
start = next(i for i, line in enumerate(ci) if '1) tests/e2e/score.run.spec.ts:248' in line and '##[error]' not in line)
write('ci-36834528688-failure.txt',
      '# `gh run view 36834528688 --log-failed` (43e450a8), excerpt: the score.run.spec lines and the run totals,\n'
      '# then the final report of the failing test (both tries). The full log was not kept.\n\n'
      + '\n'.join(keep) + '\n\n# The final report, both tries:\n' + '\n'.join(ci[start:start + 100]) + '\n')

# Probe summaries.
logs = lambda names: [os.path.join(B, f'u118a-{n}.log') for n in names]
margins = run([sys.executable, os.path.join(B, 'u118a/summarise.py')] + logs([
    'run-base-w-cpu4', 'run-preU118-w-cpu4', 'run-preU119-w-cpu4',
    'run-base-w-cpu8b', 'run-preU118-w-cpu8b', 'run-preU119-w-cpu8b']))
write('probe-margins.txt',
      '# The start fold\'s margin over the Both click, per variant, wider face, CPU throttled through CDP.\n'
      '# base = 43e450a8; preU118 = ScoreScreen.ts and WindowRenderer.ts as at f11db71a; preU119 = style.css as at f11db71a.\n'
      '# margin = (the 700 ms timer armed + 700) - (the Both click reaching the page), page time from the ▶ click.\n\n' + margins)
steps = run([sys.executable, os.path.join(B, 'u118a/summarise_steps.py')] + logs([
    'probe-base-app', 'probe-base-wider', 'probe-base-delay800', 'probe-base-wider-cpu4', 'probe-base-wider-cpu8',
    'probe-base-wider-cpu16', 'run-base-old-cpu16', 'run-base-learner-cpu1', 'run-base-revised-cpu1',
    'run-base-revised-cpu16']))
write('probe-steps.txt',
      '# Per run on base (43e450a8): the state at the Both click, what sits at its centre, whether it landed, and after.\n'
      '# steps old = the spec as it stood; learner = after the fold a mouse tap where Both is, then Both;\n'
      '# revised = after the fold, pressControl. The early runs (no "steps" in the title) are the old steps.\n\n' + steps)
fold = read(os.path.join(B, 'u118a-run-base-old-delay1500.log'))
m = re.search(r'"events":\[[^\]]*\]', fold)
write('probe-slot-writes-at-the-fold.txt',
      '# Base, wider face, the old steps with 1.5 s waited before the Both click: every slot style write and chrome change,\n'
      '# page ms from the ▶ click, until the probe stopped watching (after the 4 s click timeout and 0.5 s of box sampling).\n\n'
      + (m.group(0).replace('","', '"\n"') if m else 'not found') + '\n')
raw = []
for name in sorted(os.listdir(B)):
    if name.startswith('u118a-') and name.endswith('.log') and ('probe-' in name or 'run-' in name):
        lines = [l for l in read(os.path.join(B, name)).splitlines() if 'PROBE ' in l]
        if lines:
            raw.append(f'== {name}\n' + '\n'.join(lines))
write('probe-raw.txt', '# Every probe record, as printed.\n\n' + '\n\n'.join(raw) + '\n')

# Mutants, the revised case, the chain.
for src, name in [('u118a-M1.log', 'mutant-M1-old-click.txt'), ('u118a-M2.log', 'mutant-M2-folded-tap-does-nothing.txt'),
                  ('u118a-revised-248.log', 'revised-248-x3.txt'), ('u118a-e2e-score-run.log', 'e2e-score-run.txt'),
                  ('u118a-lint.log', 'lint.txt'), ('u118a-tsc.log', 'tsc.txt'), ('u118a-record-mirrors.log', 'record-mirrors.txt'),
                  ('u118a-content-tests.log', 'content-tests.txt'), ('u118a-vitest-three.log', 'unit-three-rerun.txt')]:
    copy(os.path.join(B, src), name)
vt = read(os.path.join(B, 'u118a-vitest.log')).splitlines()
write('unit-all-summary.txt', '# `npx vitest run`, the whole unit suite: the failures and the totals. The full log was not kept.\n\n'
      + '\n'.join(l for l in vt if re.search(r'FAIL|Test Files|Tests |vitest exit|AssertionError|ENOENT|no reference', l)) + '\n')
ba = read(os.path.join(B, 'u118a-build-app.log')).splitlines()
write('build-app.txt', '# `npm run build:app` on the final tree: the last lines.\n\n' + '\n'.join(ba[-12:]) + '\n')
print('collected', sorted(os.listdir(OUT)))
