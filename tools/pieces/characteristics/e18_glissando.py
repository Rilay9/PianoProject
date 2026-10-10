# E18 Glissando and slide marks.
#
# Chosen implementation: music21 spanner.Glissando. music21 pairs MusicXML start/stop by number and keeps the kind:
# <glissando> comes in with slideType "chromatic" and <slide> with slideType "continuous" (probed), with lineType
# (wavy/solid). Each span is reported with its kind, start and end note, the staff and bar of each end (a span may run
# from one staff to the other, so both ends are given rather than assuming one staff). "gliss." typed as <words>
# makes no span; such words are listed from music21 TextExpressions.
#
# Why: music21 does the pairing my old raw walk did. The kind is reported as written (glissando vs slide); no
# white-key/black-key technique is inferred from a line (ChatGPT). Rare in our files (glissando 2, slide 4 of 842),
# kept because rung 3.4 names glissando. Spans whose first note is hidden are not printed (_notes.py).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
import re

GLISS_WORD = re.compile(r"(?<![a-z])gliss(\.|ando)?(?![a-z])", re.I)


def glissando(score):
    """Glissando and slide spans with kind, ends (staff, bar, pitch); 'gliss.' words apart."""
    import music21 as m
    from e01_layout import layout
    L = layout(score)
    staff_no = {id(score.parts[idx]): k + 1 for k, idx in enumerate(L["staves"])}

    def end(n):
        meas = n.getContextByClass(m.stream.Measure)
        part = n.getContextByClass(m.stream.Part)
        return {"staff": staff_no.get(id(part)), "bar": bar_label(meas) if meas is not None else None,
                "pitch": n.pitches[-1].nameWithOctave if getattr(n, "pitches", None) else None}

    spans = []
    for g in score.recurse().getElementsByClass(m.spanner.Glissando):
        els = g.getSpannedElements()
        if not els or els[0].style.hideObjectOnPrint:
            continue
        kind = {"chromatic": "glissando", "continuous": "slide"}.get(g.slideType, "UNKNOWN")
        spans.append({"kind": kind, "line": g.lineType,
                      "start": end(els[0]), "end": end(els[-1]) if len(els) > 1 else None})
    words = [x.content for x in score.recurse().getElementsByClass(m.expressions.TextExpression)
             if x.content and GLISS_WORD.search(x.content)]
    return {"spans": spans, "glissando": sum(s["kind"] == "glissando" for s in spans),
            "slide": sum(s["kind"] == "slide" for s in spans), "gliss_words": words}
