# E03 Clefs and clef changes, per staff.
#
# Chosen implementation: music21 clef.Clef objects of each staff (a PartStaff or one-staff Part), in order, with
# (sign, line, octaveChange). A change is a clef whose triple differs from the clef in force on that staff; a clef
# equal to the one in force (restated at a system break or as a courtesy) is not a change. "Inside the bar" = the
# clef's offset in its measure is above 0.
#
# Why: music21 already assigns each <clef number="n"> to its staff (a clef without a number goes to staff 1) and places
# mid-measure clefs at their offset, which is all my old raw walk did. On our 833 files under 1.5 MB the old raw count
# of changes and music21's agreed on every file, so there is no gap to patch.
#
# From ChatGPT's review (adopted): the opening clef is reported apart from changes; comparison is on sign, line and
# octave change, so treble-8va / bass-8vb clefs are distinct clefs; the in-measure position is kept; restatements are
# deduplicated against the clef in force, not counted as <clef> elements. Staff 2 is never assumed to be bass: the
# clef is read. Every staff of every pitched part is covered (E01), whatever the layout.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)


def clefs(score):
    """Opening clef per staff, every change with its bar (index and printed number) and position, counts."""
    import music21 as m
    from e01_layout import layout
    start, changes = {}, []
    for k, i in enumerate(layout(score)["staves"]):
        staff = score.parts[i]
        index = {id(x): j for j, x in enumerate(staff.getElementsByClass(m.stream.Measure))}
        prev = None
        for c in staff.recurse().getElementsByClass(m.clef.Clef):
            sig = (c.sign, c.line, c.octaveChange)
            if prev is None:
                start[k + 1] = "/".join(map(str, sig))
            elif sig != prev:
                meas = c.getContextByClass(m.stream.Measure)
                changes.append({"staff": k + 1, "bar_index": index.get(id(meas)),
                                "bar": bar_label(meas) if meas is not None else None,
                                "from": "/".join(map(str, prev)), "to": "/".join(map(str, sig)),
                                "inside_bar": meas is not None and c.getOffsetInHierarchy(meas) > 0})
            prev = sig
    for k in range(len(layout(score)["staves"])):
        start.setdefault(k + 1, "UNKNOWN")  # no clef on this staff (ChatGPT's review): reported, not dropped
    return {"start": start, "changes": changes, "n_changes": len(changes),
            "inside_bar": sum(c["inside_bar"] for c in changes),
            "per_staff": {k: sum(c["staff"] == k for c in changes) for k in start}}
