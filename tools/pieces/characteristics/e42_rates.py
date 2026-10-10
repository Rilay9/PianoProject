# E42 Attack rate per staff and the ratio between staves.
#
# Chosen implementation: over E36's per-staff attacks (e36_simultaneous._staff_attacks: struck printed notes, a chord
# or two voices starting together = one attack, grace notes and tie continuations left out) and music21's measures.
# Two denominators, never mixed (my row after ChatGPT):
# - per quarter note: attacks / written length in quarters (music21 highestTime of the staff, as written, no repeats);
# - per beat: the beat fixed by the time signature in force, by E09's class: simple -> one beat per denominator unit;
#   compound -> a dotted unit (three denominator units); irregular or UNKNOWN (6/4, 3/2, 5/8 ...) -> no beat, and those
#   bars are left out of every per-beat figure, which says how many bars it covers.
# The ratio staff 1 : staff 2 (two piano staves only, E01) is undefined - None, never infinity - when staff 2 has no
# attacks. Beat-onset share: of all beat positions in bars with a beat, the share where either staff has an attack;
# a pickup bar's beats are counted from the bar's end (music21 paddingLeft), so a one-beat pickup has its one beat.
# Per bar: attacks on each staff, for local rates.
#
# Why: onset counting over music21; no library has per-staff rates (new-library-research.md: jSymbolic's density is
# whole-score). These are STAFF rates: staff is not hand (the old branch measured the staff rule wrong on 41.5% of notes
# under printed hand words), and unequal rates alone do not mean hard coordination or polyrhythm (ChatGPT).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from fractions import Fraction


def rates(score):
    """Attacks per quarter and per beat on each staff, staff 1 : staff 2 ratio, beat-onset share, per-bar attacks."""
    import music21 as m
    from e01_layout import layout
    from e09_times import _class
    from e36_simultaneous import _staff_attacks
    L = layout(score)
    if not L["staves"]:
        return {"UNKNOWN": "no pitched staff"}
    att = {k + 1: _staff_attacks(score, idx) for k, idx in enumerate(L["staves"])}
    ref = list(score.parts[L["staves"][0]].getElementsByClass(m.stream.Measure))
    total = max(Fraction(score.parts[idx].highestTime).limit_denominator(10000) for idx in L["staves"])
    beats, beat_bars, beat_q = [], 0, Fraction(0)  # beat positions as (bar index, offset)
    for mi, meas in enumerate(ref):
        ts = meas.timeSignature or meas.getContextByClass(m.meter.TimeSignature)
        cls = _class(ts) if ts is not None else "UNKNOWN"
        if cls not in ("simple", "compound"):
            continue
        unit = Fraction(4, ts.denominator) * (3 if cls == "compound" else 1)
        length = Fraction(meas.duration.quarterLength).limit_denominator(10000)
        pad = Fraction(meas.paddingLeft).limit_denominator(10000)
        beat_bars += 1
        beat_q += length
        t = (-pad) % unit
        while t < length:
            beats.append((mi, t))
            t += unit
    on = {k: {(a["bar_index"], a["offset"]) for a in v} for k, v in att.items()}
    in_beat_bars = {mi for mi, _ in beats}
    per_staff = {}
    for k, v in att.items():
        n_beat = sum(1 for a in v if a["bar_index"] in in_beat_bars)
        per_staff[k] = {"attacks": len(v), "per_quarter": round(len(v) / float(total), 3) if total else None,
                        "per_beat": round(n_beat / len(beats), 3) if beats else None}
    out = {"per_staff": per_staff, "length_quarters": str(total), "bars_with_a_beat": beat_bars, "bars": len(ref),
           "beat_onset_share": round(sum(any(b in on[k] for k in on) for b in beats) / len(beats), 3) if beats else None}
    two = L["two_piano_staves"]
    if two:
        a, b = per_staff[1]["attacks"], per_staff[2]["attacks"]
        out["ratio_staff1_to_staff2"] = round(a / b, 3) if b else None
    else:
        out["ratio_staff1_to_staff2"] = "UNKNOWN (not two piano staves)"
    out["per_bar"] = [{"bar_index": mi, "bar": bar_label(meas),
                       "attacks": {k: sum(1 for a in v if a["bar_index"] == mi) for k, v in att.items()}}
                      for mi, meas in enumerate(ref)]
    return out
