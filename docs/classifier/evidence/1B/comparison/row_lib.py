"""Shared pieces for the pitch.tone-row comparison (docs/classifier/evidence/1B/comparison/scale-row.md).

The current detector: the source of validation/t_poly_row.py above its line `print("== built files")` is executed (ok_window,
statements, rows, windows, piece, the Op. 25 row and the built-score definitions), with ONE textual change: its output folder
`SY = OUT / "synth"` becomes this folder's `row_synth/` (so nothing is written outside the comparison folder). Everything else is
the validators' text, unchanged.
"""
from cmp_common import *

_src = (VALID / "t_poly_row.py").read_text(encoding="utf-8")
_head = _src.split('\nprint("== built files")\n', 1)[0]
_old = 'SY = OUT / "synth"'
assert _old in _head
_head = _head.replace(_old, 'SY = Path(r"%s")' % str(HERE / "row_synth").replace("\\", "/"))
PR = {"__name__": "t_poly_row_funcs"}
_saved = sys.argv
sys.argv = ["t_poly_row_funcs"]
exec(compile(_head, str(VALID / "t_poly_row.py"), "exec"), PR)
sys.argv = _saved
ok_window, statements, rows, windows, piece = PR["ok_window"], PR["statements"], PR["rows"], PR["windows"], PR["piece"]
view, load_path_v, ITEMS, load, pipeline, fam, one_line_staff = PR["view"], PR["load_path"], PR["ITEMS"], PR["load"], PR["pipeline"], PR["fam"], PR["one_line_staff"]
N12 = PR["N"]   # music21 pitch names by pitch class, flats as '-'


def has_12_in_a_run(line):
    """True when 12 consecutive notes of the line have 12 different pitch classes (no scale-figure filter)."""
    pcs = [p % 12 for p in line]
    return any(len(set(pcs[k:k + 12])) == 12 for k in range(len(pcs) - 11))


def run12_items(v):
    """Positions (hand, which line, index) of 12-distinct-pc runs in the top and bottom lines, no filter."""
    out = []
    for h, evs in v.hands.items():
        top = [e.high for e in evs]
        bot = [e.low for e in evs]
        for nm, line in (("top", top),) if top == bot else (("top", top), ("bottom", bot)):
            if has_12_in_a_run(line):
                out.append((h, nm))
    return out
