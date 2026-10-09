"""Shared setup for the notation.times part of repeat-times.md.

docs/classifier/evidence/1C/validation/times.py (the current detector as the validators implemented it) imports `common` from its own folder, and that
common.py looks for catalog.json and the score files in a `content` folder beside itself (the validators' build copy, not committed).
`load_times()` executes common.py's source UNCHANGED except one substitution
  CONTENT = HERE / "content"   ->  CONTENT = <the built catalogue folder app/public/content, read in place>
registers it as module `common`, then imports times.py unchanged.
"""
import sys, types, json, warnings
from pathlib import Path

warnings.simplefilter("ignore")
HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CONTENT = MAIN / "app/public/content"
VAL1C = WT / "docs/classifier/evidence/1C/validation"
OUT = HERE


def load_times():
    src = (VAL1C / "common.py").read_text(encoding="utf-8")
    a = 'CONTENT = HERE / "content"'
    assert src.count(a) == 1
    src = src.replace(a, f"CONTENT = Path({str(CONTENT)!r})")
    mod = types.ModuleType("common")
    mod.__file__ = str(VAL1C / "common.py")
    sys.modules["common"] = mod
    mod.__dict__["__name__"] = "common"
    exec(compile(src, str(VAL1C / "common.py"), "exec"), mod.__dict__)
    sys.path.insert(0, str(VAL1C))
    import times  # unchanged source
    return mod, times
