"""Builds the kept evidence under docs/prompts/runs/G90 from the lane's logs under build/g90.

Machine paths are replaced by <worktree> and <home>; the two large logs are reduced to their summaries
and the failing names (no kept log over 300 KB). Run from the worktree root.
"""
import re
import shutil
from pathlib import Path

ROOT = Path('.').resolve()
SRC = ROOT / 'build' / 'g90'
OUT = ROOT / 'docs' / 'prompts' / 'runs' / 'G90'
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'scripts').mkdir(exist_ok=True)
(OUT / 'pictures').mkdir(exist_ok=True)


def clean(text: str) -> str:
    worktree = str(ROOT)
    for form in (worktree, worktree.replace('\\', '/'), worktree.replace('/', '\\')):
        text = text.replace(form, '<worktree>')
    home = str(Path.home())
    for form in (home, home.replace('\\', '/'), home.replace('/', '\\')):
        text = text.replace(form, '<home>')
    # Playwright prints paths in a few places with the separators doubled.
    text = text.replace(home.replace('\\', '\\\\'), '<home>')
    return text


def lines(name: str) -> list[str]:
    return (SRC / name).read_text(encoding='utf-8', errors='replace').splitlines()


# 1. red on the base: the verbose list of the new unit cases, durations dropped
red = ['# G90: the new unit cases against the base source (the six changed source files put back to HEAD, the new test files kept).',
       '# Verbose reporter, durations dropped. x = red, v = green. The full log (stack traces, 53 KB) was not kept.']
for line in lines('red-final-base.txt'):
    if re.match(r'^\s+(✓|×) ', line):
        line = re.sub(r' \d+ms$', '', line).replace(' ✓ ', 'v ').replace(' × ', 'x ')
        red.append(line.strip())
    elif re.search(r'Test Files|Tests ', line):
        red.append(line.strip())
(OUT / 'red-unit-base.txt').write_text(clean('\n'.join(red)) + '\n', encoding='utf-8')

# 2. the whole unit suite on the final tree: summaries and the failing names only
full = ['# G90: the whole unit suite on the final tree (`npx vitest run`, one run). The full log (900 KB) was not kept.']
for line in lines('green-unit-full-2.txt'):
    if re.search(r'Test Files|Tests ', line) or re.match(r'^\s+× ', line):
        full.append(re.sub(r' \d+ms$', '', line).strip())
full += ['',
         '# The two timeouts (expectedNote, tempoSoundAgainstMark) are load: the two files run alone, `npx vitest run`:']
for line in lines('alone-2.txt'):
    if re.search(r'Test Files|Tests ', line):
        full.append(line.strip())
full += ['',
         '# The four others, run on the BASE source (the six changed files at HEAD): the same four fail.',
         '# Reading: midiParity needs the parity reference file and taughtByAncestry needs build/rung-claims.json,',
         '# neither written in a fresh worktree; lessonClaimsAboutApp (two cases) reads ScoreScreen.ts and style.css text through "\\n"',
         '# against this CRLF checkout (checked: the two files carry CRLF, and the two strings fail to match for it), files G90 does not touch.']
for line in lines('env-failures-on-base.txt'):
    if re.search(r'Test Files|Tests ', line) or re.match(r'^\s+× ', line):
        full.append(re.sub(r' \d+ms$', '', line).strip())
(OUT / 'unit-summary.txt').write_text(clean('\n'.join(full)) + '\n', encoding='utf-8')

# 3. the browser runs, whole (small)
(OUT / 'e2e-red-base.txt').write_text(
    clean('# G90: tests/e2e/session-held-piece.spec.ts against the dist built from the BASE source (port 5463, one worker).\n'
          + (SRC / 'red-e2e-base.txt').read_text(encoding='utf-8', errors='replace')), encoding='utf-8')
(OUT / 'e2e-green.txt').write_text(
    clean('# G90: the new spec, then the targeted specs, against the dist built from the final source (port 5463, one worker).\n\n'
          + (SRC / 'green-e2e.txt').read_text(encoding='utf-8', errors='replace')
          + '\n--- session-held-piece, session-run, projects ---\n'
          + (SRC / 'green-e2e-targeted.txt').read_text(encoding='utf-8', errors='replace')
          + '\n--- sweeps, today, transfer-offer ---\n'
          + (SRC / 'green-e2e-targeted-2.txt').read_text(encoding='utf-8', errors='replace')
          + '\n--- empty-states, lesson-tools, start-and-return, first-day, lesson-flow ---\n'
          + (SRC / 'green-e2e-targeted-3.txt').read_text(encoding='utf-8', errors='replace')), encoding='utf-8')

# 4. the config copy and the pictures
shutil.copyfile(ROOT / 'app' / 'build' / 'g90' / 'playwright.g90.config.ts', OUT / 'scripts' / 'playwright.g90.config.ts')
shutil.copyfile(SRC / 'make_evidence.py', OUT / 'scripts' / 'make_evidence.py')
for picture in (ROOT / 'app' / 'test-results' / 'pictures' / 'g90').glob('*.png'):
    shutil.copyfile(picture, OUT / 'pictures' / picture.name)

for path in sorted(OUT.rglob('*')):
    if path.is_file():
        print(path.relative_to(ROOT).as_posix(), path.stat().st_size)
