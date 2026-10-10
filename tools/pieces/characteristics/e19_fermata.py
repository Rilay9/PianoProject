# E19 Fermatas.
#
# Chosen implementation: music21 expressions.Fermata on notes, chords and rests (one mark per chord: probed, a fermata
# written on both notes of a chord comes in once on the Chord).
# Reported: marks per staff, and pause locations = distinct (bar index, offset) over all staves, so the same fermata
# written on both staves is 2 marks but 1 pause (my row's fool case and ChatGPT's mark-vs-pause point).
#
# One raw read, for a measured gap: music21 drops a fermata written on a barline (probed: <barline><fermata> leaves
# Barline.pause None). Our files have 37 such fermatas in 25 files, often on the final barline, so they are read from
# the file (first part only, since a barline belongs to the whole system) and reported by bar index.
#
# Why music21 otherwise: it reads <notations><fermata> on notes and rests, which my old raw walk did. On the 4 files
# where the old count and music21 differed, read in the raw XML: one fermata in Debussy's Clair de Lune is on a hidden
# note (not printed, left out: _notes.py) and file Qme88 has two fermatas on rests that my old reader missed. No hold
# length is inferred. Shape is not reported: music21 gives a plain <fermata/> the type "inverted" (probed), while
# MusicXML's default is upright, and upright/inverted only places the sign above or below the note (ChatGPT asked for
# shape "where encoded"; it cannot be read reliably here and carries no musical difference).
from collections import Counter
from fractions import Fraction


def fermata(score, path):
    """Fermata marks per staff, pause locations, barline fermatas."""
    import music21 as m
    from e01_layout import layout
    from _raw import raw_root
    L = layout(score)
    per, pauses = Counter(), set()
    for k, idx in enumerate(L["staves"]):
        for mi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
            for x in meas.recurse().notesAndRests:
                if x.style.hideObjectOnPrint or isinstance(x, m.harmony.ChordSymbol):
                    continue
                for e in x.expressions:
                    if isinstance(e, m.expressions.Fermata):
                        per[k + 1] += 1
                        pauses.add((mi, Fraction(x.getOffsetInHierarchy(meas)).limit_denominator(10000)))
    first = next(raw_root(path).iter("part"), None)
    bar_fermatas = []
    if first is not None:
        for mi, meas in enumerate(first.findall("measure")):
            for b in meas.findall("barline"):
                if b.find("fermata") is not None:
                    bar_fermatas.append({"bar_index": mi, "bar": meas.get("number"), "location": b.get("location") or "right"})
    return {"marks": sum(per.values()), "per_staff": dict(per),
            "time_positions": len(pauses), "barline_fermatas": bar_fermatas}
