"""G86a mutants: each applied to ScoreScreen.ts, the unit file run, the file restored."""
import io
import re
import shutil
import subprocess
import sys

SRC = 'src/ui/screens/ScoreScreen.ts'
BACKUP = '../build/g86a/ScoreScreen.ts.bak'
TEST = 'tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts'

MUTANTS = [
    (
        'the state check removed',
        "      if (audioEngine.state !== 'running') {\n        soundRefusedBy = tap;",
        "      if (false) {\n        soundRefusedBy = tap;",
    ),
    (
        'the sentence not set',
        "        soundRefusedBy = tap;\n        render();",
        "        render();",
    ),
    (
        'the waiting flags left set on a refusal',
        "        soundRefusedBy = tap;\n        render();",
        "        soundRefusedBy = tap;\n        startingSound = true;\n        playWaiting = tap === 'play';\n        render();",
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
        out.append(f'## {name}\nexit {proc.returncode}\n' + '\n'.join(summary) + '\n' + '\n'.join(failed) + '\n')
        io.open(SRC, 'w', encoding='utf-8', newline='').write(original)
finally:
    io.open(SRC, 'w', encoding='utf-8', newline='').write(original)

report = '\n'.join(out)
io.open('../docs/prompts/runs/G86a/mutants.txt', 'w', encoding='utf-8').write(report)
print(report)
