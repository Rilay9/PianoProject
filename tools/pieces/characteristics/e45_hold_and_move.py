# E45 One staff holding while the other moves.
#
# Chosen implementation: for the two piano staves (E01; otherwise UNKNOWN), a HOLD is a note or chord on one staff
# whose sounding length (E43's _sounding: music21 stripTies, ties merged across barlines) is at least one quarter note,
# during which the other staff has 2 or more attacks strictly inside it (after its start, before its end; attacks from
# E36's _staff_attacks). A re-struck note is a new note, so repeated chords in quarters are not a hold (my row's fool
# case). Per holding staff: number of holds, total held time in quarters (the union, so two held voices on one staff
# are not counted twice), and bars where holds start.
#
# Why: interval arithmetic over music21 offsets and durations, shared with E43 and E44. The unit is the quarter note
# (ChatGPT asked for an explicit unit; a felt-beat unit would make 6/8 holds depend on the metre class, which is UNKNOWN
# for some signatures). Written durations only: pedal is ignored. A relation between NOTATED STAVES, not hands, and no
# claim about voicing or balance (ChatGPT; rung 2.5 uses it only as a setting).
from fractions import Fraction


def hold_and_move(score):
    """Per holding staff: holds (>= 1 quarter, the other staff attacking 2+ times inside), held quarters, bars."""
    import music21 as m
    from e01_layout import layout
    from e36_simultaneous import _staff_attacks
    from e43_shared_attacks import _sounding, _bars
    two = layout(score)["two_piano_staves"]
    if not two:
        return {"UNKNOWN": "not two piano staves"}
    bars = _bars(score, two[0])
    label = lambda t: next((b for b, lo, hi in bars if lo <= t < hi), None)  # noqa: E731
    out = {}
    for k, (hold_idx, move_idx) in ((1, (two[0], two[1])), (2, (two[1], two[0]))):
        moves = sorted(a["time"] for a in _staff_attacks(score, move_idx))
        spans = []
        for a, b in _sounding(score, hold_idx):
            if b - a >= 1 and sum(1 for t in moves if a < t < b) >= 2:
                spans.append((a, b))
        merged = []
        for a, b in sorted(set(spans)):
            if merged and a <= merged[-1][1]:
                merged[-1] = (merged[-1][0], max(merged[-1][1], b))
            else:
                merged.append((a, b))
        starts = []
        for a, _ in sorted(set(spans)):
            lb = label(a)
            if lb is not None and (not starts or starts[-1] != lb):
                starts.append(lb)
        out[k] = {"holds": len(set(spans)), "held_quarters": str(sum((b - a for a, b in merged), Fraction(0))), "bars": starts}
    return {"staff_holding": out}
