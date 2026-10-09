"""Validation helpers (build only, area 1.C validation, 2026-10-08)."""
from __future__ import annotations
import json, sys, zipfile, re, warnings
from fractions import Fraction as F
from pathlib import Path
# SHIM of docs/classifier/evidence/1C/validation/common.py: only the five path lines below (marked SHIM) differ;
# every function is the validators' own.
HERE = Path(__file__).resolve().parent
WT = HERE.parents[5]                       # SHIM: the worktree root (the validators' own was their build folder's worktree)
MAIN = WT.parents[2]                       # SHIM: the main checkout (read only: content/sources, content/scores/pdmx)
sys.path.insert(0, str(WT / "tools/classifier"))
CONTENT = WT / "app" / "public" / "content"   # SHIM: built catalogue and scores, copied into the worktree (gitignored)
CAT = json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))
BYID = {i["id"]: i for i in CAT}
EPS = F(1, 1000)


def xml_text(path):
    path = Path(path)
    if path.suffix == ".mxl":
        with zipfile.ZipFile(path) as z:
            names = [n for n in z.namelist() if not n.startswith("META-INF") and n.endswith((".xml", ".musicxml"))]
            try:
                c = z.read("META-INF/container.xml").decode("utf-8", "replace")
                m = re.search(r'full-path="([^"]+)"', c)
                if m:
                    names = [m.group(1)]
            except KeyError:
                pass
            return z.read(names[0]).decode("utf-8", "replace")
    return path.read_text(encoding="utf-8", errors="replace")


def item_xml(iid):
    return xml_text(CONTENT / BYID[iid]["file"])


def fr(x):
    return F(float(x)).limit_denominator(192)


def is_compound(b, t):
    return b in (6, 9, 12, 15, 18)


def beat_len(b, t):
    return F(4, t) * (3 if is_compound(b, t) else 1)


def weight(pos, b, t):
    """The page's beat weights (section 0): downbeat 1, beat 3 of a four-beat bar 0.5, other beats 0.25;
    off-beat positions 0."""
    B = beat_len(b, t)
    if pos % B:
        return F(0)
    k = pos / B
    nbeats = F(4 * b, t) / B
    if k == 0:
        return F(1)
    if nbeats == 4 and k == 2:
        return F(1, 2)
    return F(1, 4)


def load(iid):
    import score as S
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        return S.load(BYID[iid], content=CONTENT)
