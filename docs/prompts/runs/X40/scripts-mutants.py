"""X40's two mutants of the check, each run on a temporary copy of the test (deleted after), outputs kept.
  (a) the comparison disabled: `contradictions` returns no findings;
  (b) R widened to 1.25."""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEST = ROOT / 'app/tests/unit/tempoSoundAgainstMark.test.ts'
OUT = ROOT / 'docs/prompts/runs/X40'
source = TEST.read_text(encoding='utf-8')

MUTANTS = {
    'a': ('    return Math.max(bpm, mark) / Math.min(bpm, mark) > r ? [{ measure: event.measure, offset: event.offset, sound: bpm, mark }] : [];',
          '    return false && Math.max(bpm, mark) / Math.min(bpm, mark) > r ? [{ measure: event.measure, offset: event.offset, sound: bpm, mark }] : [];'),
    'b': ('const R = 1.1;', 'const R = 1.25;'),
}
for name, (old, new) in MUTANTS.items():
    assert source.count(old) == 1, name
    copy = TEST.with_name(f'tempoSoundAgainstMark.mutant{name}.test.ts')
    copy.write_text(source.replace(old, new), encoding='utf-8')
    try:
        run = subprocess.run(['npx', 'vitest', 'run', f'tests/unit/{copy.name}'], cwd=ROOT / 'app', capture_output=True,
                             text=True, encoding='utf-8', errors='replace', shell=True)
    finally:
        copy.unlink()
    text = re.sub(r'\x1b\[[0-9;]*m', '', run.stdout + run.stderr)
    (OUT / f'mutant-{name}.txt').write_text(f"mutant ({name}): {new.strip()}\n\n{text}\nexit {run.returncode}\n", encoding='utf-8')
    print(name, 'exit', run.returncode)
