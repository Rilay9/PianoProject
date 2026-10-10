# E06 Key signatures and key-signature changes.
#
# Chosen implementation: music21 key.KeySignature objects on each staff (isinstance, since a <key> with <mode> arrives
# as the subclass key.Key), in order. Written values only: `sharps` (fifths), the written mode when music21 made a Key
# from a <mode> element, and for a non-traditional signature (<key-step>/<key-alter>: music21 gives sharps None) the
# altered pitches as written. A change is a signature different from the one in force on that staff; a restatement
# (system break, courtesy) is not. Score-level changes merge the staves by bar index and position, so a change printed
# on both staves of a piano counts once, and a staff-only change (the `number` attribute) still counts.
#
# Why: music21 already applies <key number="n"> to its staff and keeps in-measure position; my old raw walk read only
# the first part to avoid double counts, which music21 per staff plus the merge does without that shortcut. On 832 of
# 833 files the old count and music21's agreed; on the 833rd (QmT2F, staff-1-only changes at bars 105 and 106, read in
# the raw XML) music21 was right and my old reader wrong.
#
# From ChatGPT's review (adopted): mode is never inferred (missing <mode> stays None); a non-traditional signature is
# reported as such, never collapsed to 0 or C; the signature is a printed reading fact, not the tonic or a modulation
# (E08 says whether the altered degrees are actually used).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from fractions import Fraction


def keys(score):
    """Opening signature per staff, every change (bar index, printed bar, offset, staff, from, to), counts."""
    import music21 as m
    from e01_layout import layout

    def desc(k):
        if k.sharps is None:
            return {"fifths": None, "mode": None, "nontraditional": [p.name for p in k.alteredPitches]}
        return {"fifths": k.sharps, "mode": k.mode if isinstance(k, m.key.Key) else None}

    start, changes = {}, []
    for k, idx in enumerate(layout(score)["staves"]):
        staff = score.parts[idx]
        index = {id(x): j for j, x in enumerate(staff.getElementsByClass(m.stream.Measure))}
        prev = None
        for ks in staff.recurse().getElementsByClass(m.key.KeySignature):
            d = desc(ks)
            if prev is None:
                start[k + 1] = d
            elif d != prev:
                meas = ks.getContextByClass(m.stream.Measure)
                changes.append({"staff": k + 1, "bar_index": index.get(id(meas)),
                                "bar": bar_label(meas) if meas is not None else None,
                                "offset": str(Fraction(ks.getOffsetInHierarchy(meas)).limit_denominator(10000)) if meas is not None else None,
                                "from": prev, "to": d})
            prev = d
    merged = sorted({(c["bar_index"], c["offset"], str(c["to"])) for c in changes}, key=lambda x: (x[0] is None, x[0], x[1]))
    return {"start": start, "changes": changes, "n_changes": len(merged),
            "per_staff": {s: sum(c["staff"] == s for c in changes) for s in start},
            "nontraditional": any(v["fifths"] is None for v in start.values()) or any(c["to"]["fifths"] is None for c in changes)}
