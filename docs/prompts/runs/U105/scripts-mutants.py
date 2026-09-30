"""U105 mutants: each applied to ScoreScreen.ts, the unit file run, the file restored.

Run from app/. Writes ../build/u105/mutants.txt.
"""
import io
import re
import shutil
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

SRC = 'src/ui/screens/ScoreScreen.ts'
BACKUP = '../build/u105/ScoreScreen.ts.bak'
TEST = 'tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts'

MUTANTS = [
    (
        'Slower left ungated (the brief: one tap left ungated)',
        "      button('Slower (−10%)', () => fromTheSummary(() => {\n"
        "        tempoPct = Math.max(30, tempoPct - 10);\n"
        "        tempo.value = String(tempoPct);\n"
        "        startRun();\n"
        "      }, SLOWER_TAP), 'summary-slower'),",
        "      button('Slower (−10%)', () => {\n"
        "        tempoPct = Math.max(30, tempoPct - 10);\n"
        "        tempo.value = String(tempoPct);\n"
        "        startRun();\n"
        "      }, 'summary-slower'),",
    ),
    (
        'Carry on names ▶ (the brief: the sentence naming the wrong control)',
        "const CARRY_ON_TAP: SoundTap = { id: 'score-resume-go', control: 'Carry on' };",
        "const CARRY_ON_TAP: SoundTap = { id: 'score-resume-go', control: '▶' };",
    ),
    (
        "the standing refusal not let go by a start (the brief: item 6's clear removed)",
        "    if (playReadsPause()) soundRefusedBy = null;\n",
        "",
    ),
    (
        'a key on the screen fed after the sound started late (the reviewer: a back-dated first note)',
        "      if (!inTheKeysMoment) return;\n",
        "",
    ),
]

shutil.copyfile(SRC, BACKUP)
original = io.open(SRC, encoding='utf-8', newline='').read()
out = []
try:
    for name, old, new in MUTANTS:
        text = original.replace('\r\n', '\n')
        crlf = '\r\n' in original
        assert text.count(old) == 1, f'{name}: anchor found {text.count(old)} times'
        mutated = text.replace(old, new)
        if crlf:
            mutated = mutated.replace('\n', '\r\n')
        io.open(SRC, 'w', encoding='utf-8', newline='').write(mutated)
        proc = subprocess.run(
            f'npx vitest run {TEST}', shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace'
        )
        log = proc.stdout + proc.stderr
        summary = [l.strip() for l in log.splitlines() if re.search(r'Tests\s+\d', l)]
        failed = [l.strip() for l in log.splitlines() if l.strip().startswith('×')]
        red = [l.strip() for l in log.splitlines() if l.strip().startswith('AssertionError')]
        out.append(
            f'## {name}\nexit {proc.returncode}\n'
            + '\n'.join(summary)
            + '\n'
            + '\n'.join(failed)
            + '\n'
            + '\n'.join(sorted(set(red)))
            + '\n'
        )
        io.open(SRC, 'w', encoding='utf-8', newline='').write(original)
finally:
    io.open(SRC, 'w', encoding='utf-8', newline='').write(original)

report = '\n'.join(out)
io.open('../build/u105/mutants.txt', 'w', encoding='utf-8').write(report)
print(report)
