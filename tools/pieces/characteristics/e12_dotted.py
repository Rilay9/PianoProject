# E12 Dotted figures in simple time.
#
# Chosen implementation: music21 voices. Within each bar of each staff, each voice's notes and rests in order
# (Measure.voices, or the measure itself when it has one voice); a figure is two consecutive NOTES in that voice, the
# second starting where the first ends: (dotted quarter, eighth) or (dotted eighth, sixteenth), the first not inside a
# tuplet, the second not a tie continuation, in a bar whose time signature is "simple" by E09's rule. Written types and
# dots come from music21 Duration (E11).
#
# Why: the voice sequence and durations are music21's; my old version rebuilt voices from the raw walk.
#
# From ChatGPT's review (adopted): two actual note onsets in one voice; a dotted note followed by a rest of the short
# value is a different cell and is counted apart (`..._then_rest`), never folded in; the dotted quarter as the beat of
# 6/8 is not this figure, so compound and UNKNOWN-class bars are excluded here (E11 still counts every dotted value).
# Ties: a dotted quarter tied into an eighth is one held sound, not the figure. The reverse figure (eighth then dotted
# quarter) is not counted. Figures crossing a barline are not counted (in simple time the dotted note of the figure
# begins on a beat inside the bar).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter

FIG = {("quarter", "eighth"): "dotted_quarter_eighth", ("eighth", "16th"): "dotted_eighth_sixteenth"}


def dotted(score):
    """Per staff: counts of the two dotted figures (and their rest variants) in simple-time bars, with bars."""
    import music21 as m
    from e01_layout import layout
    from e09_times import _class
    out = {}
    for k, idx in enumerate(layout(score)["staves"]):
        c, where = Counter(), []
        for meas in score.parts[idx].getElementsByClass(m.stream.Measure):
            ts = meas.timeSignature or meas.getContextByClass(m.meter.TimeSignature)
            if ts is None or _class(ts) != "simple":
                continue
            for v in (list(meas.voices) or [meas]):
                seq = [x for x in v.notesAndRests if not x.duration.isGrace and not isinstance(x, m.harmony.ChordSymbol)
                       and not x.style.hideObjectOnPrint]  # hidden notes and rests are not printed: _notes.py
                for a, b in zip(seq, seq[1:]):
                    if a.isRest or a.offset + a.quarterLength != b.offset or a.duration.tuplets or a.duration.dots != 1 \
                            or b.duration.dots != 0 or b.duration.tuplets:
                        continue
                    name = FIG.get((a.duration.type, b.duration.type))
                    if not name:
                        continue
                    if b.isRest:
                        c[name + "_then_rest"] += 1
                        continue
                    ties = [x.tie for x in b.notes] if b.isChord else [b.tie]
                    if any(t is not None and t.type in ("stop", "continue") for t in ties):
                        continue
                    c[name] += 1
                    bar = bar_label(meas)
                    if not where or where[-1] != bar:
                        where.append(bar)
        out[k + 1] = {"dotted_quarter_eighth": c["dotted_quarter_eighth"], "dotted_eighth_sixteenth": c["dotted_eighth_sixteenth"],
                      "dotted_quarter_eighth_then_rest": c["dotted_quarter_eighth_then_rest"],
                      "dotted_eighth_sixteenth_then_rest": c["dotted_eighth_sixteenth_then_rest"], "bars": where}
    return out
