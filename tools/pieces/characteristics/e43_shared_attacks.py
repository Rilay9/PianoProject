# E43 Attacks shared between the staves.
#
# Chosen implementation: for the two piano staves (E01; any other layout gives UNKNOWN), attack times from E36's
# per-staff attacks (e36_simultaneous._staff_attacks: absolute time in quarters, as written, no repeats; a tie
# continuation is not an attack) and SOUNDING intervals from music21's Stream.stripTies(), which merges each tie chain
# into one note with its full length, across barlines (probed). Reported, as ChatGPT asked, as separate facts:
# - shared-attack share = attack times common to both staves / all distinct attack times on either (the union); per
#   piece and per bar; None ("n/a") where neither staff attacks;
# - bars where both staves SOUND at one moment (their sounding intervals overlap inside the bar: a melody over a held
#   bass counts here even with no shared attack);
# - bars where both staves have sound somewhere in the bar, overlapping or not.
#
# Why: exact set and interval arithmetic on music21's offsets and durations; no library has it. Written durations
# only: pedal is ignored, so "sounding" means notated length. These are relations between NOTATED STAVES: staff is not
# hand, and a share is a coordination descriptor, not evidence of hand independence (ChatGPT). E44 and E45 import
# _sounding from this file, so the three rows share one definition of what sounds when.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from fractions import Fraction


def _sounding(score, idx):
    """Sounding intervals (start, end) in quarters of the printed, non-grace notes of one staff, ties merged."""
    import music21 as m
    from _notes import printed
    part = score.parts[idx].stripTies(inPlace=False)
    out = []
    for n, _ in printed(part):
        if n.duration.isGrace:
            continue
        a = Fraction(n.getOffsetInHierarchy(part)).limit_denominator(10000)
        out.append((a, a + Fraction(n.quarterLength).limit_denominator(10000)))
    return sorted(out)


def _bars(score, idx):
    """(bar label, start, end) in quarters for each measure of one staff."""
    import music21 as m
    return [(bar_label(x), Fraction(x.offset).limit_denominator(10000),
             Fraction(x.offset + x.duration.quarterLength).limit_denominator(10000))
            for x in score.parts[idx].getElementsByClass(m.stream.Measure)]


def shared_attacks(score):
    """Shared-attack share (piece and per bar), bars where both staves sound together, bars where both have sound."""
    from e01_layout import layout
    from e36_simultaneous import _staff_attacks
    two = layout(score)["two_piano_staves"]
    if not two:
        return {"UNKNOWN": "not two piano staves"}
    a1 = {a["time"] for a in _staff_attacks(score, two[0])}
    a2 = {a["time"] for a in _staff_attacks(score, two[1])}
    s1, s2 = _sounding(score, two[0]), _sounding(score, two[1])
    union = a1 | a2
    together, both_somewhere, per_bar = [], [], []
    for label, lo, hi in _bars(score, two[0]):
        c1 = [(max(a, lo), min(b, hi)) for a, b in s1 if a < hi and b > lo]
        c2 = [(max(a, lo), min(b, hi)) for a, b in s2 if a < hi and b > lo]
        if c1 and c2:
            both_somewhere.append(label)
            if any(x[0] < y[1] and y[0] < x[1] for x in c1 for y in c2):
                together.append(label)
        u = {t for t in union if lo <= t < hi}
        per_bar.append({"bar": label, "shared_attack_share": round(len(u & a1 & a2) / len(u), 3) if u else None})
    return {"shared_attacks": len(a1 & a2), "union_attacks": len(union),
            "shared_attack_share": round(len(a1 & a2) / len(union), 3) if union else None,
            "bars_both_sound_together": len(together), "bars_both_have_sound": len(both_somewhere),
            "bars_together": together, "per_bar": per_bar}
