"""Shared setup for the mark.repeat / notation.times comparison (docs/classifier/evidence/1A/comparison/repeat-times.md).

Run every script here with the main checkout's .venv (music21 10.5.0, partitura 1.9.0), `-X utf8`.
Paths: WT = this worktree; MAIN = the main checkout (the built catalogue, app/public/content, is read in place).

The chunk-1 validators for mark.repeat (docs/classifier/evidence/1A/validation/walk.py, common.py, r_repeat.py,
survey_repeat.py) look for catalog.json, the scores and a cache next to themselves (their build folder, not committed).
`load_validators()` executes their source UNCHANGED except two substitutions in walk.py:
  HERE = Path(__file__)...parent   ->  HERE = <the catalogue folder>   (so catalog.json and the score files are found)
  cdir = HERE / "cache"            ->  cdir = <build/cmp1A/cache>      (so nothing is written into the catalogue folder)
and then imports common.py and r_repeat.py as they are.
"""
import sys, types, json, warnings
from pathlib import Path

warnings.simplefilter("ignore")
HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CONTENT = MAIN / "app/public/content"
VAL1A = HERE.parent / "validation"
VAL1C = WT / "docs/classifier/evidence/1C/validation"
CACHE = WT / "build/cmp1A/cache"
OUT = HERE


def load_validators():
    """Return (walk, common, r_repeat) modules built from the validators' own source."""
    if "walk" in sys.modules and getattr(sys.modules["walk"], "_cmp_patched", False):
        return sys.modules["walk"], sys.modules["common"], sys.modules["r_repeat"]
    src = (VAL1A / "walk.py").read_text(encoding="utf-8")
    a = "HERE = Path(__file__).resolve().parent"
    b = 'cdir = HERE / "cache"'
    assert src.count(a) == 1 and src.count(b) == 1
    src = src.replace(a, f"HERE = Path({str(CONTENT)!r})")
    src = src.replace(b, f"cdir = Path({str(CACHE)!r})")
    CACHE.mkdir(parents=True, exist_ok=True)
    walk = types.ModuleType("walk")
    walk.__file__ = str(VAL1A / "walk.py")
    walk._cmp_patched = True
    sys.modules["walk"] = walk
    exec(compile(src, str(VAL1A / "walk.py"), "exec"), walk.__dict__)
    sys.path.insert(0, str(VAL1A))
    import common, r_repeat  # unchanged source files
    return walk, common, r_repeat
