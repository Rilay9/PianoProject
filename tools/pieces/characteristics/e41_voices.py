# E41 Written voices per staff.
#
# Chosen implementation: music21 Measure.voices on each staff (music21 builds one Voice per <voice> number used in the
# bar on that staff; a bar with a single voice has none and counts as 1). Three figures per bar, kept apart as ChatGPT
# asked: declared voices (every voice in the bar); voices that hold printed notes (a voice of rests only, or of hidden
# notes, does not count); and the most voices holding a printed note sounding at one moment. Per staff: how many bars
# have 2+ note-holding voices, the maxima, and those bars.
#
# Why: the file's own voice labels, read by music21, which handles unlabelled notes (a default voice) and voice numbers
# that are reused on the other staff (each staff is its own PartStaff). partitura's estimate_voices is not used: it
# estimates across staves and raised RecursionError on a corpus file (new-library-research.md). These are WRITTEN
# voices, not musical independence (my row; ChatGPT): exporters make a voice for one note, and rest-only voices are
# padding, which is why only note-holding voices are counted for the 2+ figure.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from fractions import Fraction


def voices(score):
    """Per staff: bars with 2+ voices holding printed notes, maximum declared / note-holding / simultaneously sounding."""
    import music21 as m
    from e01_layout import layout
    from _notes import printed
    out = {}
    for k, idx in enumerate(layout(score)["staves"]):
        bars2, max_declared, max_noted, max_sounding = [], 0, 0, 0
        for meas in score.parts[idx].getElementsByClass(m.stream.Measure):
            vs = list(meas.voices) or [meas]
            noted = []
            for v in vs:
                spans = [(Fraction(n.offset).limit_denominator(10000), Fraction(n.offset + n.quarterLength).limit_denominator(10000))
                         for n, _ in printed(v) if not n.duration.isGrace]
                if spans:
                    noted.append(spans)
            max_declared = max(max_declared, len(meas.voices) if meas.voices else (1 if meas.notesAndRests else 0))
            max_noted = max(max_noted, len(noted))
            if len(noted) >= 2:
                bars2.append(bar_label(meas))
                starts = {a for sp in noted for a, _ in sp}
                for t in starts:
                    max_sounding = max(max_sounding, sum(any(a <= t < b for a, b in sp) for sp in noted))
            elif noted:
                max_sounding = max(max_sounding, 1)
        out[k + 1] = {"bars_2plus_note_voices": len(bars2), "bars": bars2, "max_declared_voices": max_declared,
                      "max_note_voices": max_noted, "max_sounding_voices": max_sounding}
    return out
