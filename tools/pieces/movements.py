"""Movements inside a candidate file, and the movements a wanted title names.

A file holding several movements is split where a bar ends with a final barline and the next bar brings a new time
signature and a text (tempo) marking, the same rule ref_ends.closing uses for the first movement.
A wanted title names movements as "3rd and 4th movements", "2nd movt", "mvt 3", "Movement II" or ": III".
"""
import re

ROMAN = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10}
ORD = r"\b(\d+)\s*(?:st|nd|rd|th)"  # whole numbers: "10th" is 10, not 0 (ChatGPT's script review H6)
RN = r"(x|ix|viii|vii|vi|v|iv|iii|ii|i)"


def named_movements(title):
    """Movement numbers a wanted title names, in order; [] when it names none."""
    t = title.lower()
    m = re.search(ORD + r"\s+and\s+" + ORD + r"\s+mov", t)
    if m:
        return [int(m.group(1)), int(m.group(2))]
    m = re.search(r"\b(?:mvts?|movts?|movements?)\.?\s*(\d+)\s*(?:and|&|-)\s*(\d+)\b", t)  # "mvt 2 and 3"
    if m:
        return [int(m.group(1)), int(m.group(2))]
    m = re.search(ORD + r"\s+mov", t) or re.search(r"\bmvt\.?\s*(\d+)", t) or re.search(r"\bmovement\s+(\d+)", t)
    if m:
        return [int(m.group(1))]
    m = re.search(r"\bmovement\s+" + RN + r"\b", t) or re.search(r":\s*" + RN + r"\s*$", t)
    if m:
        return [ROMAN[m.group(1)]]
    return []


def spans(staves):
    """(first, last) measure indexes, 0-based and inclusive, of each movement in two staff lists."""
    import music21
    n = min(len(x) for x in staves)
    cuts = []
    for k in range(1, n):
        m, nxt = staves[0][k - 1], staves[0][k]
        if m.rightBarline is not None and m.rightBarline.type == "final" and \
                nxt.recurse().getElementsByClass(music21.meter.TimeSignature) and \
                nxt.recurse().getElementsByClass(music21.expressions.TextExpression):
            cuts.append(k)
    starts = [0] + cuts
    ends = [c - 1 for c in cuts] + [n - 1]
    return list(zip(starts, ends))


def excerpt(path, mvts, n=3):
    """First n bars of the first named movement and last n bars of the last named one, as (label, bars) lists like
    worklist.opening / ref_ends.closing. Returns None when the file has fewer movements than named."""
    import music21
    from worklist import bar_text
    s = music21.converter.parse(path)
    staves = [list(p.getElementsByClass(music21.stream.Measure)) for p in (s.parts[0], s.parts[-1])]
    sp = spans(staves)
    if not mvts or max(mvts) > len(sp):
        return None
    a, b = sp[mvts[0] - 1][0], sp[mvts[-1] - 1][1]
    while b > a and not any(x[b].recurse().notes for x in staves):
        b -= 1
    first, last = [], []
    for label, ms in (("RH (top staff)", staves[0]), ("LH (bottom staff)", staves[1])):
        first.append((label, [f"b{k - a + 1} (file bar {k + 1}, movement {mvts[0]}): " + bar_text(ms[k]) for k in range(a, min(a + n, b + 1))]))
        last.append((label, [f"file bar {k + 1} (end of movement {mvts[-1]}): " + bar_text(ms[k]) for k in range(max(a, b - n + 1), b + 1)]))
    return first, last
