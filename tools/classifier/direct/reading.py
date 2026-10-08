"""
What the page asks of the reader's eye (docs/classifier/characteristics.yaml, area reading): the density of
the printed bar, the accidentals the key signature does not cover, and the notation that is out of the ordinary.
"""
from __future__ import annotations

import collections

import numpy as np

import score as S
from . import _common as C

_SHARP_ORDER = "FCGDAEB"
_FLAT_ORDER = "BEADGCF"


def key_alter(fifths: int, step: str) -> int:
    """The alteration a key signature gives a step letter."""
    if fifths > 0:
        return 1 if step in _SHARP_ORDER[:fifths] else 0
    if fifths < 0:
        return -1 if step in _FLAT_ORDER[:-fifths] else 0
    return 0


def needed_accidentals(sc: S.Score) -> list[tuple[int, str, int, bool]]:
    """The accidentals the notation needs, in score order: (measure, hand, pitch key, again).

    An accidental is needed on a note whose alteration differs from the one in force for its letter and octave on
    its staff: the key signature's at the start of a bar, then whatever the bar has set since (the standard rule:
    an accidental holds to the barline for that pitch only). A note that continues a tie across the barline is
    one note in partitura's array, so it asks for no second sign. `again` is True when the same pitch (letter and
    octave) already needed a sign earlier in the same bar: the sign cancels or restates an earlier one."""
    n = sc.notes
    if not len(n):
        return []
    out = []
    alter = np.nan_to_num(n["alter"].astype(float)).astype(int)
    order = np.lexsort((n["pitch"], np.round(n["onset_quarter"].astype(float), 5)))
    state: dict = {}
    seen: dict = {}
    cur_measure: dict = {}
    for i in order:
        h = str(sc.hand[i])
        staff = int(n["staff"][i])
        m = int(sc.measure[i])
        sk = (h, staff)
        if cur_measure.get(sk) != m:
            cur_measure[sk] = m
            state = {k: v for k, v in state.items() if k[0] != sk}
            seen = {k: v for k, v in seen.items() if k[0] != sk}
        step = str(n["step"][i])
        key = (sk, step, int(n["octave"][i]))
        inforce = state.get(key, key_alter(int(n["ks_fifths"][i]), step))
        if int(alter[i]) != inforce:
            out.append((m, h, f"{step}{int(n['octave'][i])}", key in seen))
            seen[key] = True
        state[key] = int(alter[i])
    return out


@C.direct("reading.accidental-churn")
def reading_accidental_churn(sc: S.Score) -> S.Result:
    """Accidentals that cancel and return within a bar: `count` is the number of needed accidental signs that fall
    on a pitch (letter and octave, on one staff) which already needed a sign earlier in the same bar (a sharp,
    its natural, the sharp again is 2). `needed` is all the signs the bars need beyond the key signature,
    `bars_with_churn` the bars that have any, `max_per_bar` the most signs in one bar. The signs are derived from
    the pitch spellings and the key signature in force (exact given the note array); where the file prints
    fewer or more courtesy signs, the engraved page differs."""
    if not len(sc.notes):
        return S.Result.unknown_because("no notes")
    ev = needed_accidentals(sc)
    per_bar = collections.Counter(m for m, *_ in ev)
    churn = [(m) for m, _, _, again in ev if again]
    return C.res(value={"count": len(churn), "needed": len(ev), "bars_with_churn": len(set(churn)),
                           "max_per_bar": max(per_bar.values()) if per_bar else 0},
                    provenance="exact", where=sorted(set(churn)))


@C.direct("reading.visual-density")
def reading_visual_density(sc: S.Score) -> S.Result:
    """How full the printed bar is: noteheads (every pitch of a chord is one; grace notes and tied
    continuations included, since they are printed), the most voices written in one staff of a bar, and the
    accidental signs a bar needs beyond its key signature (see `needed_accidentals`). Noteheads are summed over
    the staves of a bar index; `staff_max` is the most in one staff of one bar. `where` lists the bars with the
    most noteheads. Noteheads and voices from music21 (the page's own reading of the measure), accidentals from
    the note array."""
    root = C.m21(sc)
    parts = list(root.parts) or [root]
    heads: dict[int, int] = collections.Counter()
    staff_max = 0
    voices = 0
    for part in parts:
        for mi, meas in enumerate(part.getElementsByClass("Measure")):
            k = sum(len(n.pitches) for n in C.sounding_notes(meas))
            heads[mi] += k
            staff_max = max(staff_max, k)
            voices = max(voices, len(meas.voices) if meas.voices else 1)
    if not heads:
        return S.Result.unknown_because("no measures")
    nb = max(heads) + 1
    counts = np.array([heads.get(i, 0) for i in range(nb)], float)
    acc = collections.Counter(m for m, *_ in needed_accidentals(sc))
    acc_counts = np.array([acc.get(i, 0) for i in range(nb)], float)
    top = [int(i) for i in np.nonzero(counts == counts.max())[0]]
    return C.res(value={"bars": nb, "noteheads_mean": round(float(counts.mean()), 3), "noteheads_max": int(counts.max()),
                           "staff_max": int(staff_max), "voices_per_staff_max": int(voices),
                           "accidentals_mean": round(float(acc_counts.mean()), 3), "accidentals_max": int(acc_counts.max())},
                    provenance="one-witness", where=top)


def _cross_staff(sc: S.Score) -> tuple[int, list[int]]:
    """Notes whose staff differs from the immediately preceding note of the same voice, with no <backup> or
    <forward> between: a line that moves to the other staff in the middle of a bar."""
    n = 0
    where = []
    for part in C.xml_parts(sc):
        for mi, meas in enumerate(part.findall("measure")):
            prev = None  # (voice, staff)
            for el in meas:
                if el.tag in ("backup", "forward"):
                    prev = None
                elif el.tag == "note":
                    if el.find("chord") is not None or el.find("rest") is not None:
                        continue
                    voice = (el.findtext("voice") or "1").strip()
                    staff = (el.findtext("staff") or "1").strip()
                    if prev is not None and prev[0] == voice and prev[1] != staff:
                        n += 1
                        where.append(mi)
                    prev = (voice, staff)
    return n, where


@C.direct("reading.unusual-notation")
def reading_unusual_notation(sc: S.Score) -> S.Result:
    """Constructs that ask more of the reader than the usual: `cross_staff` (a line that continues on the other staff
    inside a bar: a note whose staff differs from the previous note of its voice with no backup between;
    raw XML), `cue_notes` (`<cue/>`; raw XML), `nested_tuplets` (notes inside a tuplet inside a tuplet; music21
    `duration.tuplets` longer than 1) and `clef_mid_bar` (a clef sign that is not at its bar's start; music21).
    `count` is their sum. A clef change at a barline is not counted."""
    from music21 import clef as m21clef
    cross, where = _cross_staff(sc)
    cue = 0
    for part in C.xml_parts(sc):
        for mi, note in ((mi, nt) for mi, meas in enumerate(part.findall("measure")) for nt in meas.findall("note")):
            if note.find("cue") is not None and note.find("chord") is None:
                cue += 1
                where.append(mi)
    root = C.m21(sc)
    nested = 0
    nw = []
    for el in C.sounding_and_rests(root):
        if len(el.duration.tuplets) > 1:
            nested += 1
            nw.append(el)
    mid = []
    for cl in root.recurse().getElementsByClass(m21clef.Clef):
        m = cl.getContextByClass("Measure")
        if m is not None:
            off = C.m21_offset(cl, root)
            mo = C.m21_offset(m, root)
            if off is not None and mo is not None and off - mo > 1e-6:
                mid.append(cl)
    where = C.merge_where(where, C.m21_where(sc, nw), C.m21_where(sc, mid))
    return C.res(value={"count": cross + cue + nested + len(mid), "cross_staff": cross, "cue_notes": cue,
                           "nested_tuplets": nested, "clef_mid_bar": len(mid)},
                    provenance="exact", where=where)
