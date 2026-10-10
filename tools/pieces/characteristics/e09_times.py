# E09 Time signatures, changes and metre class.
#
# Chosen implementation: music21 meter.TimeSignature objects on each staff for the written signature (ratioString,
# which keeps additive numerators such as "3/8+2/8"; numerator; denominator; symbol "common"/"cut"). A change is a
# signature different from the one in force on that staff; restatements are not changes; staves are merged by bar
# index so a change printed on both staves counts once.
#
# Class (simple / compound / irregular / UNKNOWN) is our rule on the written numbers, not music21's .classification:
# probed, music21 calls 3/8 "Other Single", 5/8 "Simple Quintuple" and 6/4 "Compound Duple" without doubt. The rule
# (my row after ChatGPT's review): numerator 2, 3 or 4 is simple, except 3/2, which is UNKNOWN; 6, 9, 12 over 8 or 16
# are compound, and so are 9/4 and 12/4; 6/4 is UNKNOWN (3+3 or 2+2+2); 5, 7, 11 numerators without a written sum are
# UNKNOWN; an additive numerator (3+2) is irregular, with its grouping as written; 1 is simple.
#
# One raw read, for a measured gap: music21 drops <time><senza-misura/></time> (probed: no TimeSignature object at
# all), which would make an unmetred passage look like the previous metre continuing. Bars carrying it are read by
# measure order in the first part and listed, class UNKNOWN.
#
# Not adopted from ChatGPT: reading beam groups to settle 6/4 (3+3 vs 2+2+2). It is pattern reading with its own
# failure cases, so 6/4 stays UNKNOWN here rather than being guessed from beams.

from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
def _class(ts):
    if "+" in ts.ratioString:
        return "irregular"
    n, d = ts.numerator, ts.denominator
    if n in (2, 3, 4):
        return "UNKNOWN" if (n, d) == (3, 2) else "simple"
    if n in (6, 9, 12) and d in (8, 16):
        return "compound"
    if (n, d) in ((9, 4), (12, 4)):
        return "compound"
    if n == 1:
        return "simple"
    return "UNKNOWN"


def times(score, path):
    """Signatures as written with bar, change flags, classes, senza-misura bars."""
    import music21 as m
    from e01_layout import layout
    from _raw import raw_root
    seen, out = set(), []
    for idx in layout(score)["staves"]:
        staff = score.parts[idx]
        index = {id(x): j for j, x in enumerate(staff.getElementsByClass(m.stream.Measure))}
        prev = None
        for ts in staff.recurse().getElementsByClass(m.meter.TimeSignature):
            sig = (ts.ratioString, ts.symbol or "")
            if sig == prev:
                continue
            meas = ts.getContextByClass(m.stream.Measure)
            key = (index.get(id(meas)), sig)
            if key not in seen:
                seen.add(key)
                out.append({"bar_index": key[0], "bar": bar_label(meas) if meas is not None else None,
                            "time": ts.ratioString, "symbol": ts.symbol or None, "class": _class(ts), "change": prev is not None})
            prev = sig
    out.sort(key=lambda x: (x["bar_index"] is None, x["bar_index"]))
    first = next(raw_root(path).iter("part"), None)
    senza = [i for i, meas in enumerate(first.findall("measure")) if meas.find("attributes/time/senza-misura") is not None] \
        if first is not None else []
    classes = sorted({x["class"] for x in out} | ({"UNKNOWN"} if senza else set()))
    return {"signatures": out, "n_changes": sum(x["change"] for x in out), "classes": classes,
            "senza_misura_bars": senza, "none": not out and not senza}
