# E33 Pitch range per staff, whole piece and per bar.
#
# Chosen implementation: music21 pitches of the printed notes of each staff (_notes.printed), as MIDI numbers
# (Pitch.midi). Per staff: lowest and highest, span in semitones, with grace notes excluded (the main figure) and
# included (a second figure); and per bar (index and printed number): low, high, span, main notes only.
#
# Why music21's pitch needs no shift: MusicXML <pitch> is the sounding pitch and music21 keeps it under an ottava
# (probed in E04: a note printed C6 under an 8va is encoded C7 and music21 gives C7; its Ottava objects come in
# "non-transposing"). So the range is taken straight from the pitch and E04 is NOT applied: applying it would shift
# twice (ChatGPT's warning, and my row's fool case: encoded C7 under an 8va counts as C7, not C8). The printed staff
# position is E05's business, not this row's.
#
# Staff, never hand (ChatGPT asked to rename the row from per-hand range): notes written on a staff count on that
# staff, whoever plays them. The range is a sounding-pitch fact, not a hand stretch (E37 is the within-staff span).
# Earlier my old reader and the music21 cross-check disagreed on this row in 14 of 833 files; both dropped small notes
# and the cross-check kept hidden ones. Read on 3 of those files with this function: QmXNg staff 4 now reaches MIDI 78
# and QmVRRh staff 1 reaches 105 through printed small (size="cue") notes in bars 19-24 and 50-54, which are played;
# QmYz2h staff 1 no longer reaches 48, a hidden note in bar 25 (_notes.py).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import defaultdict


def pitch_range(score):
    """Per staff: low/high/span (main notes and with grace notes), and per-bar low/high/span."""
    import music21 as m
    from e01_layout import layout
    from _notes import printed
    out = {}
    for k, idx in enumerate(layout(score)["staves"]):
        main, every, bars = [], [], []
        for mi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
            here = []
            for n, ps in printed(meas):
                mid = [p.midi for p in ps]
                every += mid
                if not n.duration.isGrace:
                    main += mid
                    here += mid
            if here:
                bars.append({"bar_index": mi, "bar": bar_label(meas),
                             "low": min(here), "high": max(here), "span": max(here) - min(here)})

        def rng(xs):
            return {"low": min(xs), "high": max(xs), "span": max(xs) - min(xs)} if xs else {"low": None, "high": None, "span": None}
        out[k + 1] = {**rng(main), "with_grace": rng(every), "per_bar": bars,
                      "widest_bar": max(bars, key=lambda b: b["span"])["bar"] if bars else None}
    return out
