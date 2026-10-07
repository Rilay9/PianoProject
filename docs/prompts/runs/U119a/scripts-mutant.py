# U119a's mutants: apply one to the source (keeping the original bytes aside), or restore and check by hash.
# python mutant.py apply <m1..m6> | python mutant.py restore
import hashlib, pathlib, shutil, sys

root = pathlib.Path(__file__).resolve().parents[2]
keep = pathlib.Path(__file__).resolve().parent / 'orig'
ts = root / 'app/src/ui/screens/ScoreScreen.ts'
css = root / 'app/src/style.css'

MUTANTS = {
    # The new minimum check removed: `fitBarControls` back to `barIsOverfull` alone.
    'm1': (ts, 'if (!barIsOverfull() && !leftGroupIsCut()) return;', 'if (!barIsOverfull()) return;'),
    # The minimum counts the name's own width as required (over-triggering).
    'm2': (ts,
           'const cut = whereSide.getBoundingClientRect().right > barLeft.getBoundingClientRect().right;',
           'const cut = whereSide.getBoundingClientRect().right + (titleSide.scrollWidth - titleSide.clientWidth) > barLeft.getBoundingClientRect().right;'),
    # The status line's own truncation removed: back to `flex: none`, cut flush by the group's clip.
    'm3': (css,
           '  .screen--score .score-bar__left > .score-bar__status {\n    flex: 0 1 auto;\n    min-width: 0;\n  }',
           '  .screen--score .score-bar__left > .score-bar__status {\n  }'),
    # The status line shares the shrink with the name in proportion (the name's weight removed).
    'm4': (css, '    flex-shrink: 1000000;\n', ''),
    # The row test counts the grown left group again.
    'm5': (ts, '.filter((k) => k !== barLeft && k.getBoundingClientRect().height > 0)', '.filter((k) => k.getBoundingClientRect().height > 0)'),
    # The location priced at the bar under the cursor, not the piece's widest.
    'm6': (ts, '    if (model) {\n      const last = String(printedBar(model.sourceMeasureCount - 1));\n      whereSide.textContent = `bar ${last} / ${last}`;\n    }\n', ''),
}


def sha(p: pathlib.Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


if sys.argv[1] == 'apply':
    path, old, new = MUTANTS[sys.argv[2]]
    keep.mkdir(exist_ok=True)
    saved = keep / path.name
    if not saved.exists():
        shutil.copyfile(path, saved)
    raw = path.read_bytes()
    crlf = b'\r\n' in raw
    text = raw.decode('utf-8').replace('\r\n', '\n')
    assert text.count(old) == 1, f'{sys.argv[2]}: the text to mutate is not there exactly once'
    text = text.replace(old, new)
    path.write_bytes((text.replace('\n', '\r\n') if crlf else text).encode('utf-8'))
    print(f'{sys.argv[2]} applied to {path.name}: {sha(saved)[:12]} -> {sha(path)[:12]}')
elif sys.argv[1] == 'restore':
    for path in (ts, css):
        saved = keep / path.name
        if saved.exists():
            shutil.copyfile(saved, path)
            assert sha(saved) == sha(path)
            print(f'{path.name} restored, {sha(path)[:12]}')
            saved.unlink()
