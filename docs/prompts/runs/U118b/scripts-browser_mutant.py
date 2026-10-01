"""U118b's browser mutants for the sentinel, run from app/. Not for the commit.

Usage: python browser_mutant.py <name>
Applies one mutant to ScoreScreen.ts, builds the app, runs the window-rule spec's U118 cases and
U118b's case, writes build/u118b/browser-mutants/<name>.txt, and puts ScoreScreen.ts back byte for
byte (the dist left behind is the mutant's: rebuild before anything else reads it).
"""
import pathlib
import subprocess
import sys

APP = pathlib.Path.cwd()
SOURCE = APP / 'src' / 'ui' / 'screens' / 'ScoreScreen.ts'
OUT = APP / 'build' / 'u118b' / 'browser-mutants'
OUT.mkdir(parents=True, exist_ok=True)
NL = chr(10)
CRLF = chr(13) + chr(10)
CALLS = (
    '      ...AWAY_PRICED_COUNTS.map((count) => STATE_TEXT.away(count, false)),' + NL
    + '      ...AWAY_PRICED_COUNTS.map((count) => STATE_TEXT.away(count, true)),' + NL
)
MUTANTS = {
    # The sentinel back at a day: one count, 86 400 (the base tree's value, as a string).
    'M-s1-a-day': (
        'const AWAY_PRICED_COUNTS: readonly string[] = Array.from({ length: 10 }, (_, digit) => String(digit).repeat(14));' + NL,
        "const AWAY_PRICED_COUNTS: readonly string[] = ['86400'];" + NL,
    ),
    # The away sentence left out of the reserve altogether (the ruling forbids it). The constant stays
    # referenced, or the typecheck refuses the build for an unused name before anything is measured.
    'M-s2-no-away': (CALLS, '      ...AWAY_PRICED_COUNTS.filter(() => false),' + NL),
}
GREP = 'folded|what the chip says|every sentence fits one line|seconds away|tablet folds'

name = sys.argv[1]
old, new = MUTANTS[name]
saved = SOURCE.read_bytes()
log = []
try:
    text = saved.decode('utf-8')
    if CRLF in text:
        old, new = old.replace(NL, CRLF), new.replace(NL, CRLF)
    assert text.count(old) == 1, 'the line to mutate is not there exactly once'
    SOURCE.write_bytes(text.replace(old, new).encode('utf-8'))
    build = subprocess.run('npm run build:app', cwd=APP, capture_output=True, text=True, encoding='utf-8', errors='replace', shell=True)
    log.append(f'build exit {build.returncode}')
    if build.returncode != 0:
        log.append((build.stdout + build.stderr)[-3000:])
    if build.returncode == 0:
        run = subprocess.run(
            f'npx playwright test --config build/u118b/playwright.u118b-5343.config.ts score.window-rule.spec.ts -g "{GREP}"',
            cwd=APP, capture_output=True, text=True, encoding='utf-8', errors='replace', shell=True,
        )
        log.append(f'playwright exit {run.returncode}')
        log.append(run.stdout[-12000:])
finally:
    SOURCE.write_bytes(saved)
    assert SOURCE.read_bytes() == saved
(OUT / f'{name}.txt').write_text(NL.join(log), encoding='utf-8')
for line in NL.join(log).splitlines():
    s = line.strip()
    if s.startswith(('build exit', 'playwright exit', 'ok ', 'x ', 'Error:')) or 'passed' in s or 'failed' in s:
        print(s[:400])
