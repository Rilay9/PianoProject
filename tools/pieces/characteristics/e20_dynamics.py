# E20 Dynamic marks.
#
# Chosen implementation: music21 dynamics.Dynamic objects on each staff (music21 files a <direction> with <staff>n</staff>
# under PartStaff n). Ordinary levels (pppppp..ffffff, mp, mf) are ordered on one scale; accent dynamics (sf, sfz,
# sffz, fz, fp, rf, rfz ...) and <other-dynamics> are listed apart, never placed on the scale (my row after ChatGPT).
# Reported: every mark with staff, bar and offset; levels used, softest and loudest; accent dynamics; and the time
# positions where the two piano staves (E01) carry different levels at the same moment (rung 7.4, different dynamics
# in each hand - read as staves, never hands).
#
# Why music21 without a patch, measured on our 842 files: ChatGPT and my row asked that a dynamic with no <staff> in a
# two-staff part be "unspecified", not staff 1 (music21 puts such a direction on both staves: probed). In our files that
# case does not occur: all 14,532 dynamics in two-staff parts carry <staff> (227 without are in one-staff parts, where
# the staff is not in doubt). music21 also drops a dynamic attached to a note (<notations><dynamics>: probed); our
# files have 0. music21 keeps <other-dynamics> as the value "other-dynamics" without its text; kept as "other". Words
# such as "dolce" or "p dolce" typed as <words> are not dynamics here (partitura classed "calando" as one).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter
from fractions import Fraction

LEVELS = ["pppppp", "ppppp", "pppp", "ppp", "pp", "p", "mp", "mf", "f", "ff", "fff", "ffff", "fffff", "ffffff"]


def dynamics(score):
    """Dynamic marks: per staff, levels used, softest/loudest, accent dynamics, staves differing at one moment."""
    import music21 as m
    from e01_layout import layout
    L = layout(score)
    marks = []
    for k, idx in enumerate(L["staves"]):
        for mi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
            for d in meas.recurse().getElementsByClass(m.dynamics.Dynamic):
                v = d.value if d.value != "other-dynamics" else "other"
                marks.append({"value": v, "staff": k + 1, "bar_index": mi, "bar": bar_label(meas),
                              "offset": str(Fraction(d.getOffsetInHierarchy(meas)).limit_denominator(10000))})
    levels = [x["value"] for x in marks if x["value"] in LEVELS]
    accents = Counter(x["value"] for x in marks if x["value"] not in LEVELS)
    differ = 0
    two = L["two_piano_staves"]
    if two:
        at = {}
        for x in marks:
            if x["value"] in LEVELS and x["staff"] in (1, 2):
                at.setdefault((x["bar_index"], x["offset"]), {})[x["staff"]] = x["value"]
        differ = sum(1 for v in at.values() if len(v) == 2 and v[1] != v[2])
    return {"n": len(marks), "levels_used": sorted(set(levels), key=LEVELS.index),
            "softest": min(levels, key=LEVELS.index) if levels else None,
            "loudest": max(levels, key=LEVELS.index) if levels else None,
            "accent_dynamics": dict(accents), "per_staff": dict(Counter(x["staff"] for x in marks)),
            "staves_differ_at": differ if two else "UNKNOWN (not two piano staves)", "marks": marks}
