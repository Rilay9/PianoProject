# E44 Staves taking turns.
#
# Chosen implementation: for the two piano staves (E01; otherwise UNKNOWN), sounding intervals from E43's _sounding
# (music21 stripTies: ties merged, written durations, printed non-grace notes), clipped to each bar. Two outputs, kept
# apart (ChatGPT's required change, since my first pass example contradicted my definition):
# (1) turn-taking bars: both staves sound inside the bar and their intervals never overlap there (one staff on beats 1
#     and 3, the other on 2 and 4);
# (2) hand-offs between bars: a bar where only one staff sounds followed by a bar where only the other does.
#
# Why: interval arithmetic over music21 durations, shared with E43 and E45 so the three rows agree on what sounds.
# Written durations only: pedal would make the notes overlap in sound, and that is not read here (my row's pitfall).
# A note held on one staff under the other's entry overlaps, so it is not turn-taking (my row's fool case). Staves, not
# hands; no hand assignment is claimed (ChatGPT).


def turn_taking(score):
    """Turn-taking bars (both staves sound, never at once) and hand-offs between bars, with bars."""
    from e01_layout import layout
    from e43_shared_attacks import _sounding, _bars
    two = layout(score)["two_piano_staves"]
    if not two:
        return {"UNKNOWN": "not two piano staves"}
    s1, s2 = _sounding(score, two[0]), _sounding(score, two[1])
    turns, alone, handoffs = [], [], []
    for label, lo, hi in _bars(score, two[0]):
        c1 = [(max(a, lo), min(b, hi)) for a, b in s1 if a < hi and b > lo]
        c2 = [(max(a, lo), min(b, hi)) for a, b in s2 if a < hi and b > lo]
        if c1 and c2 and not any(x[0] < y[1] and y[0] < x[1] for x in c1 for y in c2):
            turns.append(label)
        alone.append((label, 1 if c1 and not c2 else 2 if c2 and not c1 else None))
    for (la, sa), (lb, sb) in zip(alone, alone[1:]):
        if sa and sb and sa != sb:
            handoffs.append(lb)
    return {"turn_taking_bars": len(turns), "bars": turns, "handoffs_between_bars": len(handoffs), "handoff_bars": handoffs}
