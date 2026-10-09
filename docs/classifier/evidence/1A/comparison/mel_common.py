"""Shared helpers for the melody-location / chord-symbols comparison (docs/classifier/evidence/1A/comparison/melody.md).

Run every script here with the main checkout's .venv (music21 10.5.0, partitura 1.9.0), `-X utf8`, from the worktree root:
    "<main>/.venv/Scripts/python.exe" -X utf8 docs/classifier/evidence/1A/comparison/<script>.py
Paths: WT = this worktree (scripts, tools/classifier, build/), MAIN = the main checkout (catalogue content, read in place, never written).

The chunk-1 validators (docs/classifier/evidence/1A/validation/) read a copy of the catalogue next to themselves. Here the
unchanged source of walk.py is executed with two lines re-pointed (the catalogue folder and the cache folder), then the
validators' own common.py, r_melody.py and r_misc.py are imported unchanged. `load_validators()` does that.
"""
import json, sys, warnings, time, os, types, re, collections
from pathlib import Path

warnings.simplefilter("ignore")
HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]                      # .../docs/classifier/evidence/1A/comparison -> worktree root
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CONTENT = MAIN / "app/public/content"
VALID = HERE.parent / "validation"
BUILD = WT / "build"
sys.path.insert(0, str(WT / "tools/classifier"))
sys.path.insert(0, str(WT / "tools/classifier/rules"))
sys.path.insert(0, str(VALID))


def load_validators():
    """Execute validation/walk.py with HERE -> the catalogue folder and the cache -> build/val1a-cache; import common, r_melody, r_misc."""
    if "walk" in sys.modules:
        return
    src = (VALID / "walk.py").read_text(encoding="utf-8")
    a = "HERE = Path(__file__).resolve().parent"
    b = 'cdir = HERE / "cache"; cdir.mkdir(exist_ok=True)'
    assert a in src and b in src
    cache_dir = (BUILD / "val1a-cache").as_posix()
    src = src.replace(a, f'HERE = Path(r"{CONTENT.as_posix()}")')
    src = src.replace(b, f'cdir = Path(r"{cache_dir}"); cdir.mkdir(parents=True, exist_ok=True)')
    mod = types.ModuleType("walk")
    mod.__file__ = str(VALID / "walk.py")
    sys.modules["walk"] = mod
    exec(compile(src, str(VALID / "walk.py"), "exec"), mod.__dict__)


def jdump(obj, path):
    Path(path).write_text(json.dumps(obj, indent=1, ensure_ascii=False, default=str), encoding="utf-8")


def jload(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def prf(tp, fp, fn):
    p = tp / (tp + fp) if tp + fp else None
    r = tp / (tp + fn) if tp + fn else None
    f = 2 * p * r / (p + r) if p and r else (0.0 if p is not None and r is not None else None)
    return p, r, f


def pct(x):
    return "-" if x is None else f"{100 * x:.1f}%"
