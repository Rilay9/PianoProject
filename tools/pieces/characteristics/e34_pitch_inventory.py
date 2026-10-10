# E34 Pitch inventory and black-key share.
#
# Chosen implementation: music21 pitches of the struck printed notes of each staff (_notes.struck: every member of a
# chord counts; tie continuations, which are not struck again, and grace notes are left out), and of the staves
# together. Reported: note count; distinct sounding pitches (MIDI), distinct spellings with octave (music21
# nameWithOctave, e.g. "E-4"), distinct pitch classes; share of notes on black keys = pitch class 1, 3, 6, 8 or 10.
#
# Why: the counts are one line each over music21's Pitch (.midi, .pitchClass, .nameWithOctave); no library computes
# "black-key share" (new-library-research.md), and it is keyboard geography, so it is taken from the pitch class, never
# the spelling: C-flat is a white key, B-sharp too (my row; ChatGPT agreed). ChatGPT asked to keep spelling and octave
# beside pitch class: all three inventories are reported. A high black-key share is a material fact, not evidence that
# a piece teaches black-key groups or a fingering (ChatGPT). Counting policy stated in the docstring, as ChatGPT asked.
from collections import Counter

BLACK = {1, 3, 6, 8, 10}


def pitch_inventory(score):
    """Per staff and 'all': struck notes (chord members each, no tie continuations, no grace notes), distinct
    MIDI pitches, spellings and pitch classes, and the black-key share."""
    import music21 as m
    from e01_layout import layout
    from _notes import struck

    def summary(pitches):
        if not pitches:
            return {"notes": 0, "distinct_pitches": 0, "distinct_spellings": 0, "distinct_pitch_classes": 0, "black_share": None}
        return {"notes": len(pitches), "distinct_pitches": len({p.midi for p in pitches}),
                "distinct_spellings": len({p.nameWithOctave for p in pitches}),
                "distinct_pitch_classes": len({p.pitchClass for p in pitches}),
                "black_share": round(sum(p.pitchClass in BLACK for p in pitches) / len(pitches), 3),
                "pitch_classes": dict(sorted(Counter(p.pitchClass for p in pitches).items()))}
    out, everything = {}, []
    for k, idx in enumerate(layout(score)["staves"]):
        ps = list(struck(score.parts[idx]))
        everything += ps
        out[k + 1] = summary(ps)
    out["all"] = summary(everything)
    return out
