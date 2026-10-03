"""
X42's mutants: each a one-place edit to the amended reader (`app/src/score/tempoFromXml.ts`), the unit files run
against it, the summary kept, and the amended file restored byte for byte from build/x42/tempoFromXml.fixed.ts
after every mutant (and at the end, whatever happens). Run from the worktree root.

Usage: python build/x42/mutants.py <out-dir>
"""
import re
import shutil
import subprocess
import sys
from pathlib import Path

SRC = Path('app/src/score/tempoFromXml.ts')
FIXED = Path('build/x42/tempoFromXml.fixed.ts')
OUT = Path(sys.argv[1])
TESTS = ['tests/unit/tempoFromXml.test.ts', 'tests/unit/tempoSoundAgainstMark.test.ts']

AGREE = 'const agreeing = mark === undefined ? undefined : sounds.find((bpm) => Math.abs(bpm - mark.quarters) <= SERIALIZATION_TOLERANCE);'
MUTANTS = {
    'a-first-sound-always': (
        'the pre-amendment rule: the first sound at a position, whatever the mark says',
        [('const sound = agreeing ?? sounds[0];', 'const sound = sounds[0];')],
        TESTS + ['tests/unit/lessonClaimsAboutApp.test.ts'],
    ),
    'b-ratio-1.1': (
        "X40's evidence threshold as the reader's agreement: a ratio of at most 1.1",
        [('Math.abs(bpm - mark.quarters) <= SERIALIZATION_TOLERANCE', 'Math.max(bpm, mark.quarters) / Math.min(bpm, mark.quarters) <= 1.1')],
        TESTS,
    ),
    'c-any-mark': (
        "the tie-break's marks[:1] dropped: a sound agreeing with any mark at the position",
        [(AGREE, 'const marks = here.flatMap((one) => (one.mark === undefined ? [] : [one.mark])); '
                 'const agreeing = sounds.find((bpm) => marks.some((m) => Math.abs(bpm - m.quarters) <= SERIALIZATION_TOLERANCE));')],
        TESTS,
    ),
    'd-tolerance-x10': (
        'the tolerance an order of magnitude too wide (0.1)',
        [('export const SERIALIZATION_TOLERANCE = 0.01;', 'export const SERIALIZATION_TOLERANCE = 0.1;')],
        TESTS,
    ),
    'e-tolerance-under-noise': (
        "the tolerance under the corpus's own noise (0.0001, below MuseScore's 0.0002)",
        [('export const SERIALIZATION_TOLERANCE = 0.01;', 'export const SERIALIZATION_TOLERANCE = 0.0001;')],
        TESTS,
    ),
    'f-per-minute-not-quarters': (
        "agreement judged against the printed per-minute, not the mark normalised to quarter notes",
        [('Math.abs(bpm - mark.quarters) <= SERIALIZATION_TOLERANCE', 'Math.abs(bpm - mark.perMinute) <= SERIALIZATION_TOLERANCE')],
        TESTS,
    ),
}

ANSI = re.compile(r'\x1b\[[0-9;]*m')
summary = []
try:
    for name, (what, edits, tests) in MUTANTS.items():
        text = FIXED.read_text(encoding='utf-8')
        for old, new in edits:
            assert text.count(old) == 1, f'{name}: the target occurs {text.count(old)} times'
            text = text.replace(old, new)
        SRC.write_bytes(text.encode('utf-8'))
        run = subprocess.run(['npx', 'vitest', 'run', *tests], cwd='app', capture_output=True, text=True, encoding='utf-8',
                             errors='replace', shell=True)
        log = ANSI.sub('', run.stdout + run.stderr)
        failing = [l.strip() for l in log.splitlines() if l.startswith(' FAIL ')]
        counts = [l.strip() for l in log.splitlines() if l.strip().startswith('Tests ')]
        block = [f'=== mutant {name}: {what}', f'exit {run.returncode}', *counts, 'failing:', *[f'  {f}' for f in failing]]
        # The assertion diffs, short: the expected/received lines of each failure.
        diffs = [l for l in log.splitlines() if re.match(r'^\s*[-+]\s', l) and not l.strip().startswith(('- Expected', '+ Received'))]
        block += ['diff lines (expected -, received +):', *[f'  {d.rstrip()}' for d in diffs[:60]]]
        summary += block + ['']
        SRC.write_bytes(FIXED.read_bytes())
finally:
    SRC.write_bytes(FIXED.read_bytes())
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'mutants.txt').write_text('\n'.join(summary) + '\n', encoding='utf-8')
print('\n'.join(summary))
print('restored:', SRC.read_bytes() == FIXED.read_bytes())
