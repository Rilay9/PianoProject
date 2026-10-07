"""U118b, one more unit mutant, run from app/. Not for the commit.

M-c4: the second read's mutant (the held size never let go at a turn) with the corrected case's
release check taken out, so only "takes a new one" (the picture against a run turned to 390 x 600
from 300 x 480) is left to catch it. Both files are put back byte for byte.
"""
import pathlib
import subprocess

APP = pathlib.Path.cwd()
RENDERER = APP / 'src' / 'score' / 'WindowRenderer.ts'
TEST = APP / 'tests' / 'unit' / 'windowRendererStage.test.ts'
OUT = APP / 'build' / 'u118b' / 'unit-mutants'
CRLF = chr(13) + chr(10)
EDITS = [
    (RENDERER, '        this.frozen = null;' + CRLF + '        // And every sheet drawn for the old width, the spare included.' + CRLF,
     '        // And every sheet drawn for the old width, the spare included.' + CRLF),
    (TEST, "    expect(releasedAtTheChange, 'the held size let go at the width change').toBe(true);" + CRLF, ''),
]
saved = {path: path.read_bytes() for path, _, _ in EDITS}
try:
    for path, old, new in EDITS:
        text = path.read_bytes().decode('utf-8')
        assert text.count(old) == 1, path
        path.write_bytes(text.replace(old, new).encode('utf-8'))
    proc = subprocess.run(
        ['npx', 'vitest', 'run', 'tests/unit/windowRendererStage.test.ts', '-t', 'a width change during a run releases the held size'],
        cwd=APP, capture_output=True, text=True, encoding='utf-8', errors='replace', shell=True,
    )
    text = proc.stdout + proc.stderr
    (OUT / 'M-c4-frozen-kept-no-release-check-corrected.txt').write_text(text[-6000:], encoding='utf-8')
    summary = [line.strip() for line in text.splitlines() if 'Tests ' in line or 'Error' in line][:3]
    print(f'M-c4 corrected exit {proc.returncode}  {" | ".join(summary)}', flush=True)
finally:
    for path, data in saved.items():
        path.write_bytes(data)
        assert path.read_bytes() == data
