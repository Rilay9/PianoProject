"""U118b's unit mutants for Follow-up 3, run from app/. Not for the commit.

Each mutant edits one source (or the corrected test), runs the corrected case (c) and the original
case (c) from HEAD (staged at tests/unit/windowRendererStage.original.test.ts), and puts the source
back byte for byte from a copy taken before. Writes build/u118b/unit-mutants/<name>-<case>.txt and
prints one line per run.
"""
import pathlib
import subprocess
import sys

APP = pathlib.Path.cwd()
OUT = APP / 'build' / 'u118b' / 'unit-mutants'
OUT.mkdir(parents=True, exist_ok=True)
RENDERER = APP / 'src' / 'score' / 'WindowRenderer.ts'
TEST = APP / 'tests' / 'unit' / 'windowRendererStage.test.ts'
ORIGINAL = APP / 'tests' / 'unit' / 'windowRendererStage.original.test.ts'
CASE = 'a width change during a run releases the held size'
NL = chr(10)
CRLF = chr(13) + chr(10)

MUTANTS = [
    ('none', None, None, None),
    # The second read's mutant: the turned branch runs, but the held size is never let go.
    ('M-c1-frozen-kept', RENDERER,
     '        this.frozen = null;' + NL + '        // And every sheet drawn for the old width, the spare included.' + NL,
     '        // And every sheet drawn for the old width, the spare included.' + NL),
    # The turned branch disabled outright: no width change is ever told from the one before.
    ('M-c2-turn-never', RENDERER,
     '      if (this.measuredWidth >= 0 && Math.abs(width - this.measuredWidth) > 2) {' + NL,
     '      if (false && this.measuredWidth >= 0 && Math.abs(width - this.measuredWidth) > 2) {' + NL),
    # The corrected case's first observation removed: the case falls back into the original's gap.
    ('M-c3-no-first-observation', TEST,
     '    // Follow-up 3).' + NL + '    observe();' + NL + '    await settle();' + NL + '    renderer.setRunning(true);' + NL,
     '    // Follow-up 3).' + NL + '    await settle();' + NL + '    renderer.setRunning(true);' + NL),
]


def run(name: str, test: pathlib.Path, tag: str) -> int:
    proc = subprocess.run(
        ['npx', 'vitest', 'run', str(test.relative_to(APP)).replace(chr(92), '/'), '-t', CASE],
        cwd=APP, capture_output=True, text=True, encoding='utf-8', errors='replace', shell=True,
    )
    text = proc.stdout + proc.stderr
    (OUT / f'{name}-{tag}.txt').write_text(text[-6000:], encoding='utf-8')
    summary = [line.strip() for line in text.splitlines() if 'Tests ' in line or 'AssertionError' in line][:3]
    print(f'{name:28s} {tag:9s} exit {proc.returncode}  {" | ".join(summary)}', flush=True)
    return proc.returncode


for name, path, old, new in MUTANTS:
    saved = path.read_bytes() if path else None
    try:
        if path:
            text = saved.decode('utf-8')
            if CRLF in text:  # the working copy's line endings (core.autocrlf)
                old, new = old.replace(NL, CRLF), new.replace(NL, CRLF)
            if text.count(old) != 1:
                print(f'{name}: the line to mutate is not there exactly once', flush=True)
                sys.exit(2)
            path.write_bytes(text.replace(old, new).encode('utf-8'))
        run(name, TEST, 'corrected')
        if path is not TEST:
            run(name, ORIGINAL, 'original')
    finally:
        if path:
            path.write_bytes(saved)
            assert path.read_bytes() == saved
