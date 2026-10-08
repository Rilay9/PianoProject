"""
Whether the file is the kind of piano score the rest of the classifier can read (docs/classifier/characteristics.yaml,
area integrity).
"""
from __future__ import annotations

import numpy as np

import score as S
from . import _common as C
from .harmony import symbols

#: General MIDI programs 1-8 are the piano family (acoustic grand ... clavinet); anything else is another instrument.
PIANO_PROGRAMS = range(1, 9)


@C.direct("integrity.extra-parts")
def integrity_extra_parts(sc: S.Score) -> S.Result:
    """Parts beyond a piano's: `count` is the number of reasons, each of: a part beyond the second (`parts_beyond_two`),
    a part with more than two staves (`staves_beyond_two`), a percussion part (unpitched notes, a percussion clef or
    MIDI channel 10), or a part whose MIDI program is not in the piano family (programs 1-8). Raw XML:
    `<part-list>` instruments, `<staves>`, `<unpitched>`, clef signs. `parts` and `max_staves` are the figures
    behind it; `reasons` names them."""
    root = C.xml_root(sc)
    parts = C.xml_parts(sc)
    if not parts:
        return C.unknown("no parts")
    reasons = []
    if len(parts) > 2:
        reasons += [f"part {i + 1} beyond the second" for i in range(2, len(parts))]
    maxst = 1
    perc = 0
    programs = {}
    for sp in root.iter("score-part"):
        pid = sp.get("id")
        prog = sp.find("midi-instrument/midi-program")
        chan = sp.find("midi-instrument/midi-channel")
        programs[pid] = (int(prog.text) if prog is not None and (prog.text or "").strip().isdigit() else None,
                         int(chan.text) if chan is not None and (chan.text or "").strip().isdigit() else None)
    for i, p in enumerate(parts):
        st = 1
        for e in p.iter("staves"):
            st = max(st, int(e.text))
        maxst = max(maxst, st)
        if st > 2:
            reasons.append(f"part {i + 1} has {st} staves")
        pitchless = p.find(".//unpitched") is not None or any((s.text or "").strip() == "percussion" for s in p.iter("sign"))
        prog, chan = programs.get(p.get("id"), (None, None))
        if pitchless or chan == 10:
            perc += 1
            reasons.append(f"part {i + 1} is percussion")
        elif prog is not None and prog not in PIANO_PROGRAMS:
            reasons.append(f"part {i + 1} plays program {prog}")
    return C.res({"count": len(reasons), "parts": len(parts), "max_staves": maxst, "percussion_parts": perc, "reasons": reasons})


@C.direct("integrity.lead-sheet-shape")
def integrity_lead_sheet_shape(sc: S.Score) -> S.Result:
    """Melody plus chord symbols with no written accompaniment: `lead_sheet` is true when the score prints chord symbols
    and only one hand has notes (by `score.load`'s hand rule). `chord_symbols` is their number, `hands_with_notes`
    the hands that play."""
    hands = len({str(h) for h in sc.hand}) if len(sc.notes) else 0
    syms = len(symbols(sc))
    return C.res({"lead_sheet": bool(syms > 0 and hands == 1), "chord_symbols": syms, "hands_with_notes": hands})


@C.direct("integrity.piano-range")
def integrity_piano_range(sc: S.Score) -> S.Result:
    """Every note on the 88 keys: `ok` is true when the lowest note is A0 (MIDI 21) or higher and the highest is C8
    (108) or lower; `min` and `max` are the extreme MIDI pitches and `outside` the notes beyond the keys. `where`
    lists the bars with an outside note."""
    if not len(sc.notes):
        return C.unknown("no notes")
    p = sc.notes["pitch"].astype(int)
    out = (p < 21) | (p > 108)
    return C.res({"ok": bool(not out.any()), "min": int(p.min()), "max": int(p.max()), "outside": int(out.sum())},
                 where=np.unique(sc.measure[out]))
