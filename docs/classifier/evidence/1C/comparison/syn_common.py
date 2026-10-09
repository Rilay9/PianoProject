"""Shared helpers for the rhythm.syncopation comparison (docs/classifier/evidence/1C/comparison/syncopation.md).

Run every script here with the main checkout's .venv (music21 10.5.0, partitura 1.9.0), `-X utf8`:
    <main>/.venv/Scripts/python.exe -X utf8 docs/classifier/evidence/1C/comparison/<script>.py
Paths: WT = this worktree (scripts, tools/classifier, build/), MAIN = the main checkout (catalogue content, read in place).

`current()` returns the validators' `sync.py` (the current rhythm.syncopation detector, corrected rule) executed
UNCHANGED from docs/classifier/evidence/1C/validation/, with that folder's `common` module pointed at the catalogue
(it was written for build/v1c/content, which is not held).
"""
from __future__ import annotations
import json, re, sys, time, warnings
from pathlib import Path

warnings.simplefilter("ignore")
HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]                      # .../docs/classifier/evidence/1C/comparison -> worktree root
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CONTENT = MAIN / "app/public/content"
VALID = HERE.parent / "validation"
BUILD = WT / "build"
sys.path.insert(0, str(WT / "tools/classifier"))
sys.path.insert(0, str(VALID))

# The reference/negative rule for generated items (fixed before any method was scored, see syncopation.md section 1):
SYN_CONCEPT = re.compile(r"syncop", re.I)


def catalogue():
    return json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))


def declares_syncopation(item):
    """Recipe declaration of a generated (exercise.*) item: its concepts name syncopation, or its drill kind is a
    syncopation drill. Positives = True, negatives = False (every other generated item)."""
    concepts = " ".join(item.get("concepts") or [])
    kind = ((item.get("drill") or {}).get("kind") or "")
    return bool(SYN_CONCEPT.search(concepts)) or bool(SYN_CONCEPT.search(kind))


def current():
    """The validators' sync.py, unchanged, with its helper module `common` pointed at this catalogue."""
    import types
    if "common" not in sys.modules:
        src = (VALID / "common.py").read_text(encoding="utf-8")
        assert 'CONTENT = HERE / "content"' in src
        src = src.replace('CONTENT = HERE / "content"', f'CONTENT = Path(r"{CONTENT}")')
        vc = types.ModuleType("common")
        vc.__file__ = str(VALID / "common.py")
        sys.modules["common"] = vc
        exec(compile(src, str(VALID / "common.py"), "exec"), vc.__dict__)
    vc = sys.modules["common"]
    import sync as vs
    return vs, vc


def pipe(i):
    return "gen" if i.startswith("exercise.") else "pdmx" if (i.endswith(".pdmx") or ".pdmx." in i) else "rep"


def pearson(x, y):
    n = len(x)
    mx = sum(x) / n; my = sum(y) / n
    sxx = sum((a - mx) ** 2 for a in x); syy = sum((b - my) ** 2 for b in y)
    sxy = sum((a - mx) * (b - my) for a, b in zip(x, y))
    return sxy / (sxx * syy) ** 0.5 if sxx > 0 and syy > 0 else float("nan")


def ranks(v):
    order = sorted(range(len(v)), key=lambda i: v[i])
    r = [0.0] * len(v)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and v[order[j + 1]] == v[order[i]]:
            j += 1
        for k in range(i, j + 1):
            r[order[k]] = (i + j) / 2 + 1
        i = j + 1
    return r


def spearman(x, y):
    return pearson(ranks(x), ranks(y))
