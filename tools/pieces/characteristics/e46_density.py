# E46 Visual density per bar.
#
# Chosen implementation: per staff and bar, four counts taken from the rows that define them, so density never counts
# differently from them: printed note heads (_notes.printed, grace notes apart), attacks (E36's per-staff attacks),
# encoded accidentals (E07's per_bar_index) and notes needing ledger lines (E05's ledger_notes_per_bar_index, with clef
# and ottava). Each count is also given per quarter note of the bar's written length (E02), as ChatGPT asked, so a busy
# 2/4 bar and a busy 4/4 bar compare fairly. Per staff: the median and the densest bars (by notes per quarter), listed
# with all four figures; a whole-bar rest gives 0 notes on that staff (my row's fool case).
#
# Why: sums over earlier rows; no library has a reading-density measure (new-library-research.md). Accidentals are the
# ENCODED ones (E07), which can differ from what a renderer draws (ChatGPT). Density is for choosing reading excerpts,
# not a reading grade: repetition makes dense bars easy, and rhythm and polyphony matter (my row; ChatGPT).
from fractions import Fraction
from statistics import median
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)


def density(score, path):
    """Per staff: notes, attacks, accidentals, ledger-line notes per bar (and per quarter); median and densest bars."""
    import music21 as m
    from e01_layout import layout
    from e02_bars import bars
    from e05_ledger import ledger
    from e07_accidentals import accidentals
    from e36_simultaneous import _staff_attacks
    from _notes import printed
    L = layout(score)
    lengths = {b["index"]: Fraction(b["length"]) for b in bars(score, path)["measures"]}
    led, acc = ledger(score, path), accidentals(score, path)
    out = {}
    for k, idx in enumerate(L["staves"]):
        att = {}
        for a in _staff_attacks(score, idx):
            att[a["bar_index"]] = att.get(a["bar_index"], 0) + 1
        rows = []
        for mi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
            heads = sum(len(ps) for n, ps in printed(meas) if not n.duration.isGrace)
            q = lengths.get(mi) or Fraction(0)
            row = {"bar_index": mi, "bar": bar_label(meas), "notes": heads, "attacks": att.get(mi, 0),
                   "accidentals": acc[k + 1]["per_bar_index"].get(mi, 0),
                   "ledger_notes": led[k + 1]["ledger_notes_per_bar_index"].get(mi, 0),
                   "notes_per_quarter": round(heads / float(q), 3) if q else None}
            rows.append(row)
        dens = [r["notes_per_quarter"] for r in rows if r["notes_per_quarter"] is not None]
        top = sorted((r for r in rows if r["notes_per_quarter"] is not None), key=lambda r: -r["notes_per_quarter"])[:5]
        out[k + 1] = {"median_notes_per_quarter": round(median(dens), 3) if dens else None,
                      "max_notes": max((r["notes"] for r in rows), default=0),
                      "max_accidentals": max((r["accidentals"] for r in rows), default=0),
                      "max_ledger_notes": max((r["ledger_notes"] for r in rows), default=0),
                      "densest_bars": top, "per_bar": rows}
    return out
