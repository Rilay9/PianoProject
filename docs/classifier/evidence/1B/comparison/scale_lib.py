"""Shared pieces for the scale.collection comparison (docs/classifier/evidence/1B/comparison/scale-row.md).

Run every script here with the main checkout's .venv (music21 10.5.0, partitura 1.9.0), `-X utf8`.

- The current detector: the source of validation/t_coll.py above its line `only = set(sys.argv[1:])` is executed
  unchanged (item_name, passage_name, local_keys, SEVEN, ...), as cur_detector.py does for t_kc.py.
- music21 candidates: `ConcreteScale.deriveRanked` of each scale class, all twelve tonics (resultsReturned=12), pitch-class comparison.
- Labels: a (pitch-class set, tonic) is named with the project's own table (SEVEN of t_coll.py), so that every method's answer is
  compared in one vocabulary: "ionian (major)", "dorian", ..., "harmonic minor", "minor pentatonic", "blues scale", ...
"""
from cmp_common import *

_src = (VALID / "t_coll.py").read_text(encoding="utf-8").split("\nonly = set(sys.argv[1:])\n", 1)[0]
CUR = {"__name__": "t_coll_funcs"}
_saved = sys.argv
sys.argv = ["t_coll_funcs"]
exec(compile(_src, str(VALID / "t_coll.py"), "exec"), CUR)
sys.argv = _saved
SEVEN, BIG, sets_, item_name, passage_name, local_keys = CUR["SEVEN"], CUR["BIG"], CUR["sets"], CUR["item_name"], CUR["passage_name"], CUR["local_keys"]
ITEMS, load, pipeline, fam, one_line_staff = CUR["ITEMS"], CUR["load"], CUR["pipeline"], CUR["fam"], CUR["one_line_staff"]
H, view, scale_runs = CUR["H"], CUR["view"], CUR["scale_runs"]

SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
OCTATONIC = [frozenset((r + i) % 12 for i in (0, 2, 3, 5, 6, 8, 9, 11)) for r in range(12)]


def lab(S, T):
    """Name the pitch-class set S with tonic T (pc or None) in the project's vocabulary. Returns (label, tonic_or_None).
    label None = S equals no collection of the table (and is not twelve / octatonic)."""
    S = frozenset(S)
    n = len(S)
    if n == 12:
        return ("all twelve", None)
    for c, (iv, names) in SEVEN.items():
        if len(iv) != n:
            continue
        for r, s in sets_(iv):
            if s == S:
                if names is None:
                    return (c, None)
                if T is not None and T in S and (T - r) % 12 in names:
                    return (names[(T - r) % 12], T)
                return (f"{c} set (tonic not its own)", T)
    if S in OCTATONIC:
        return ("octatonic", None)
    return (None, T)


def lab_fixed(S, root_collection_label_of_all_tonics=None):
    """All (label, tonic) names a set can take: one per tonic in S whose degree is named in the table."""
    out = []
    for t in sorted(S):
        l, tt = lab(S, t)
        if l and "tonic not its own" not in l:
            out.append((l, tt))
    return out


def parse_cur_item(res):
    """item_name's (string, kind) -> (label, tonic) or None for 'no name'."""
    s, kind = res
    if kind == "twelve":
        return ("all twelve", None)
    if kind == "named":
        if " on " in s:
            nm, t = s.rsplit(" on ", 1)
            return (nm, NAMES.index(t))
        return (s, None)      # whole-tone
    return None               # few / set-of / set only
