# E17 Tremolo marks.
#
# Chosen implementation: music21. A single-note tremolo is an expressions.Tremolo on the note with numberOfMarks (the
# strokes); a two-note tremolo is one expressions.TremoloSpanner over its two notes, so a start/stop pair counts once
# (ChatGPT's point: never two figures). Per staff: single-note tremolos by strokes, two-note tremolos by strokes, bars.
#
# Why: music21 already pairs <tremolo type="start"> with "stop" into one spanner and reads the stroke number, which is
# what my old raw walk did. Probed limits, left as known because tremolo marks are rare here (19 of our 842 files): an
# unpaired start is dropped (an encoding fault, no spanner), and an "unmeasured" tremolo comes in as a Tremolo with
# 0 marks (reported as strokes "0"). Written-out repeated or alternating notes are not the sign (E40 / PATTERNS).
# Marks on hidden notes are not printed (_notes.py).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter


def tremolo(score):
    """Per staff: single-note and two-note tremolos with stroke counts, bars."""
    import music21 as m
    from e01_layout import layout
    from _notes import printed
    L = layout(score)
    out = {}
    for k, idx in enumerate(L["staves"]):
        staff = score.parts[idx]
        single, strokes, two, two_strokes, bars = 0, Counter(), 0, Counter(), []
        for meas in staff.getElementsByClass(m.stream.Measure):
            for n, _ in printed(meas):
                for e in n.expressions:
                    if isinstance(e, m.expressions.Tremolo):
                        single += 1
                        strokes[str(e.numberOfMarks)] += 1
                        bar = bar_label(meas)
                        if not bars or bars[-1] != bar:
                            bars.append(bar)
        for sp in staff.recurse().getElementsByClass(m.expressions.TremoloSpanner):
            first = sp.getFirst()
            if first is not None and not first.style.hideObjectOnPrint:
                two += 1
                two_strokes[str(sp.numberOfMarks)] += 1
                meas = first.getContextByClass(m.stream.Measure)
                if meas is not None and bar_label(meas) not in bars:
                    bars.append(bar_label(meas))
        out[k + 1] = {"single": single, "strokes": dict(strokes), "two_note": two, "two_note_strokes": dict(two_strokes), "bars": bars}
    return out
