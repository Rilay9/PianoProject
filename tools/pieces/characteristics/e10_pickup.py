# E10 Anacrusis (pickup bar).
#
# Chosen implementation: built on E02 (music21 measure lengths and the raw implicit flag). Three observations are
# reported side by side: (1) the first bar is shorter than its time signature; (2) the file marks it
# <measure implicit="yes"> (E02's raw read; music21 drops the flag); (3) the last bar is short by the complement, so
# first + last = one full bar. music21's own Measure.paddingLeft (its pickup inference: Maple Leaf Rag bar 0 gives 1.5
# of 2.0) is reported as a fourth, for comparison. Pickup is a CANDIDATE on (1) alone, and CONFIRMED only when (1)
# agrees with (2) or (3). "Confirmed" means two observations in the file agree, not that a printed score was checked
# (ChatGPT's review asked for a weaker name; the key is kept because E32 reads it). The displacement (nominal - first length, in quarters) is given for anything that counts
# beats from the bar line.
#
# Why: ChatGPT's review (adopted) - a short first bar can be an omitted rest, a clipped transcription or a cadenza,
# and implicit="yes" can be exporter metadata; neither alone proves a pickup, so both are reported and the conclusion
# needs two to agree. The complement check is evidence when present, never a requirement (many pieces with a real
# pickup end on a full bar). A first bar with one voice full and another missing its rest is full: E02 takes the
# largest voice, so it is not a candidate.


def pickup(score, path):
    """Pickup candidate / confirmed, with the observations behind them."""
    from fractions import Fraction
    from e02_bars import bars
    import music21 as m
    b = bars(score, path)["measures"]
    if not b:
        return {"UNKNOWN": "no measures"}
    first, last = b[0], b[-1]
    if first["nominal"] is None:
        return {"candidate": None, "confirmed": None, "UNKNOWN": "no time signature at the first bar", "implicit": first["implicit"]}
    nominal, fl = Fraction(first["nominal"]), Fraction(first["length"])
    short_first = fl < nominal
    short_last = len(b) > 1 and last["nominal"] is not None and Fraction(last["length"]) < Fraction(last["nominal"])
    complements = short_first and short_last and fl + Fraction(last["length"]) == nominal
    meas0 = score.parts[0].getElementsByClass(m.stream.Measure).first() if len(score.parts) else None
    return {"candidate": short_first, "confirmed": short_first and (first["implicit"] or complements),
            "first_length": str(fl), "nominal": str(nominal), "displacement": str(nominal - fl) if short_first else "0",
            "implicit": first["implicit"], "last_length": last["length"], "last_complements": complements,
            "music21_padding_left": float(meas0.paddingLeft) if meas0 is not None else None}
