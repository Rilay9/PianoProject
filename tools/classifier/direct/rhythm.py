"""
Rhythm facts read straight from the score (docs/classifier/characteristics.yaml, area rhythm).
"""
from __future__ import annotations

import collections

import numpy as np

import score as S
from . import _common as C


def _value_name(d) -> str:
    """A printed duration as a name: its note type, dots, and tuplet ratio when it is one."""
    name = d.type
    if d.dots:
        name += "." * d.dots
    if d.tuplets:
        name += "".join(f"[{t.numberNotesActual}:{t.numberNotesNormal}]" for t in d.tuplets)
    return name


@C.direct("rhythm.values")
def rhythm_values(sc: S.Score) -> S.Result:
    """The rhythmic vocabulary: a histogram of the printed note values (type, dots, tuplet ratio) for notes and
    chords, and another for rests. Read with music21's `Duration` (the printed `<type>` and `<dot/>`s, a tie is
    two printed values, a grace note is left out). A rest that fills the bar (`<rest measure="yes"/>`) is
    counted apart as `full_measure_rests`, because it has no value of its own. `shortest_note` is the shortest
    sounding note value in quarters. One witness: music21 reads the durations (the raw `<type>` is the second
    witness, compared on the catalogue)."""
    from music21 import note as m21note
    notes: collections.Counter = collections.Counter()
    rests: collections.Counter = collections.Counter()
    full = 0
    shortest = None
    for el in C.sounding_and_rests(C.m21(sc)):
        d = el.duration
        if d.isGrace:
            continue
        if isinstance(el, m21note.Rest):
            if getattr(el, "fullMeasure", False) in (True, "always"):
                full += 1
            else:
                rests[_value_name(d)] += 1
        else:
            notes[_value_name(d)] += 1
            q = float(d.quarterLength)
            if q > 0 and (shortest is None or q < shortest):
                shortest = q
    if not notes and not rests:
        return S.Result.unknown_because("no notes or rests")
    return C.res(value={"notes": dict(sorted(notes.items())), "rests": dict(sorted(rests.items())),
                           "distinct_note_values": len(notes), "distinct_rest_values": len(rests),
                           "full_measure_rests": full, "shortest_note": shortest},
                    provenance="one-witness")


@C.direct("rhythm.repeated-notes")
def rhythm_repeated_notes(sc: S.Score) -> S.Result:
    """Repeated-note technique: the same key struck again. Per hand, staff and voice, a note repeats when its pitch is
    also in the voice's immediately preceding onset group (tied notes are already one note in partitura's array, so
    a tie is not a repeat; a rest between the two does not break it). `count` is the number of repeated strikes;
    `longest_run` the most strikes of one pitch in a row in one voice (a run of 4 repeated Cs is 4; 0 when there is no
    repeat)."""
    n = sc.notes
    if not len(n):
        return S.Result.unknown_because("no notes")
    keep = C.timed_mask(sc)  # a grace note has no duration and is not a struck repeat
    count = 0
    longest = 0
    where: set[int] = set()
    by_hand = {"R": 0, "L": 0}
    on = np.round(n["onset_quarter"].astype(float), 5)
    keys = np.stack([(sc.hand == "L").astype(int), n["staff"].astype(int), n["voice"].astype(int)], axis=1)
    for key in np.unique(keys, axis=0):
        sel = np.nonzero((keys == key).all(axis=1) & keep)[0]
        if not len(sel):
            continue
        order = sel[np.argsort(on[sel], kind="stable")]
        gon, gstart = np.unique(on[order], return_index=True)
        prev: dict[int, int] = {}
        for gi in range(len(gstart)):
            idx = order[gstart[gi]: gstart[gi + 1] if gi + 1 < len(gstart) else len(order)]
            pitches = {int(p) for p in n["pitch"][idx]}
            cur: dict[int, int] = {}
            for p in pitches:
                if p in prev:
                    cur[p] = prev[p] + 1
                    count += 1
                    by_hand["L" if key[0] else "R"] += 1
                    where.add(int(sc.measure[idx[0]]))
                    longest = max(longest, cur[p])
                else:
                    cur[p] = 1
            prev = cur
    return C.res(value={"count": count, "longest_run": longest, "by_hand": by_hand},
                    provenance="exact", where=sorted(where))
