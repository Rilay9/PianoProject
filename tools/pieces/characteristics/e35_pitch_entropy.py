# E35 Pitch entropy.
#
# Chosen implementation: scipy.stats.entropy(counts, base=2) over the same struck notes as E34 (printed notes, every
# chord member, no tie continuations, no grace notes): once over sounding pitches (MIDI) and once over pitch classes,
# per staff and for the staves together, each reported with its note count.
#
# Why: Shannon entropy H = -sum(p log2 p) is a library function (scipy, installed), so nothing is hand-written; muspy has
# the same one-liner but is unmaintained since 2022 and would add a dependency for it (new-library-research.md). The
# note selection is _notes.struck, shared with E34, so the two rows count the same notes.
#
# From ChatGPT's review (adopted): a descriptive statistic, not a difficulty score - a short chromatic figure can have
# low entropy and be hard, a long slow varied piece high entropy and be easy - so no grade is drawn from it here, and
# the sample size travels with every value (longer pieces tend to more varied pitches: my row's pitfall).
from collections import Counter


def pitch_entropy(score):
    """Per staff and 'all': entropy in bits of the pitch and pitch-class distributions, with the note count."""
    import music21 as m
    from scipy.stats import entropy
    from e01_layout import layout
    from _notes import struck

    def h(pitches):
        if not pitches:
            return {"notes": 0, "pitch_entropy": None, "pitch_class_entropy": None}
        return {"notes": len(pitches),
                "pitch_entropy": round(float(entropy(list(Counter(p.midi for p in pitches).values()), base=2)), 3),
                "pitch_class_entropy": round(float(entropy(list(Counter(p.pitchClass for p in pitches).values()), base=2)), 3)}
    out, everything = {}, []
    for k, idx in enumerate(layout(score)["staves"]):
        ps = list(struck(score.parts[idx]))
        everything += ps
        out[k + 1] = h(ps)
    out["all"] = h(everything)
    return out
