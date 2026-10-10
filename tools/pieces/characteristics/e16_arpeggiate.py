# E16 Arpeggiated-chord sign.
#
# Chosen implementation: music21 marks, grouped by time position. music21 puts one expressions.ArpeggioMark on a
# chord (not one per note), with type "normal", "up", "down" or "non-arpeggio" (probed: <arpeggiate/> on all three
# notes of a chord -> one mark on the Chord; <non-arpeggiate> -> "non-arpeggio"); a numbered sign becomes an
# ArpeggioMarkSpanner over the marked notes or chords. A roll is then counted once per staff per time position (bar
# index + offset), whichever voices and chord objects carry it; a spanner whose elements lie on both staves is
# reported as a cross-staff roll.
#
# Why the time-position grouping (ChatGPT's grouping fix: one rolled chord, not three): music21's own chord-level
# mark is not enough. In the Schumann Album for the Young No. 30 shelf file the 15 rolls are each written across two
# voices with <arpeggiate number="1"> (30 marked notes), and music21 chains all of them into one spanner, so counting
# chord objects gives 30 and counting spanners gives 1; by staff and time position it is 15, which is the printed count.
# Direction and non-arpeggio stay distinct facts. A rolled chord is still a notated chord for E36. A written-out broken
# chord is a pattern, not this sign. Marks on hidden notes are not printed (_notes.py); one of our files (QmYz2h) has
# all 89 of its arpeggio marks on hidden notes, and gets 0.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter
from fractions import Fraction


def arpeggiate(score):
    """Per staff: rolls (by time position) by direction, non-arpeggio brackets, cross-staff rolls, bars."""
    import music21 as m
    from e01_layout import layout
    from _notes import printed
    L = layout(score)
    spanned = {}
    for sp in score.recurse().getElementsByClass(m.expressions.ArpeggioMarkSpanner):
        els = sp.getSpannedElements()
        staves = {id(x.getContextByClass(m.stream.Part)) for x in els}
        for e in els:
            spanned[id(e)] = (sp.type, len(staves) > 1)
    out = {}
    for k, idx in enumerate(L["staves"]):
        rolls = {}  # (bar index, offset) -> (kinds, cross, bar label)
        for mi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
            for n, _ in printed(meas):
                kinds = [e.type for e in n.expressions if isinstance(e, m.expressions.ArpeggioMark)]
                cross = False
                if id(n) in spanned:
                    kinds.append(spanned[id(n)][0])
                    cross = spanned[id(n)][1]
                if not kinds:
                    continue
                key = (mi, Fraction(n.getOffsetInHierarchy(meas)).limit_denominator(10000))
                old = rolls.get(key, ([], False, bar_label(meas)))
                rolls[key] = (old[0] + kinds, old[1] or cross, old[2])
        c, bars = Counter(), []
        for key in sorted(rolls):
            kinds, cross, bar = rolls[key]
            if all(t == "non-arpeggio" for t in kinds):
                c["non_arpeggiate"] += 1
                continue
            c["arpeggiated_chords"] += 1
            c["cross_staff"] += cross
            c["direction_" + next(t for t in kinds if t != "non-arpeggio")] += 1
            if not bars or bars[-1] != bar:
                bars.append(bar)
        out[k + 1] = {"arpeggiated_chords": c["arpeggiated_chords"], "non_arpeggiate": c["non_arpeggiate"],
                      "by_direction": {d: c["direction_" + d] for d in ("normal", "up", "down") if c["direction_" + d]},
                      "cross_staff": c["cross_staff"], "bars": bars}
    return out
