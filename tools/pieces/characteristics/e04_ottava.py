# E04 Ottava lines (8va, 8vb, 15ma, 15mb).
#
# Chosen implementation: span ends from the file, notes from music21. The <octave-shift> directions are read with
# _raw.directions (their time position in the bar), paired by staff and `number` in time order, and laid over
# music21's notes of that staff: a note is inside when start <= its onset < stop (the stop is written after the last
# note under the line, so the note at the stop position is the first one after it). Words such as "8va" typed as
# <words> are read from music21 TextExpressions and listed apart; they make no span.
#
# Why not music21's spanner.Ottava, which the reuse rule asks for first: measured on the 8 files where it disagreed
# with the raw count, music21 (10.5) (a) loses every span that starts and stops inside one bar (file QmXXdT: bars 78,
# 79, 83 lost; QmZjz6: three in bars 24-25 lost), (b) drops unclosed spans entirely (hand case; QmPcq4 bar 124), and
# (c) mis-pairs when a stop and a new start share a bar, producing overlapping spans 53-56, 56-68, 66-75 (QmZemC).
# Ottava lines matter for reading rungs and for E05/E33, so this is a gap worth the small raw read. music21's pitch
# for notes under a line was checked and is the sounding pitch (C7 under an 8va stays C7), so no note is re-read.
#
# Direction (ChatGPT's review, adopted and checked): MusicXML's type is the shift from printed to sounding pitch, so a
# usual 8va is type="down" (printed an octave below the sound) and 8vb is type="up". Measured on our files, notes under
# "down" spans sit in octaves 5-7 and under "up" in 0-3, which agrees. `continue` is a continuation, not a new span.
# Pairing is _raw.pair_spans (shared with E21 hairpins): time order, a stop closes the oldest open span, and at one time
# position stops are taken before starts unless nothing is open (then an empty span, not an orphan). Unclosed spans
# are listed with their start and no note count (UNKNOWN extent); orphan stops are counted.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
import re
from fractions import Fraction

KIND = {("down", "8"): "8va", ("down", "15"): "15ma", ("down", "22"): "22ma",
        ("up", "8"): "8vb", ("up", "15"): "15mb", ("up", "22"): "22mb"}
WORDS = re.compile(r"(?<![a-z0-9])(8va|8vb|15ma|15mb|ottava|loco)(?![a-z])", re.I)


def ottava(score, path):
    """Spans per staff with first and last bar and notes inside; unclosed spans; orphan stops; ottava words.
    Each span also carries `start`/`stop` as (bar index, offset in quarters) for E05 and E33."""
    import music21 as m
    from e01_layout import layout
    from _raw import raw_root, directions, pair_spans
    from _notes import printed
    L = layout(score)
    root = raw_root(path)
    raw_parts = list(root.iter("part"))
    if len(raw_parts) != len(L["parts"]):
        return {"UNKNOWN": f"{len(raw_parts)} parts in the file, {len(L['parts'])} in music21"}
    staff_no = {idx: k + 1 for k, idx in enumerate(L["staves"])}
    events = []
    for order, (pi, mi, st, pos, el) in enumerate(directions(root, "octave-shift")):
        ids = L["parts"][pi]["staff_indices"]
        if st - 1 < len(ids) and ids[st - 1] in staff_no and el.get("type") in ("up", "down", "stop"):
            events.append((staff_no[ids[st - 1]], el.get("number") or "1", (mi, pos), order, el.get("type"), el.get("size") or "8"))
    # notes of each staff as (bar index, onset in bar, heads)
    notes = {}
    for idx, k in staff_no.items():
        lst = []
        for mi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
            for n, ps in printed(meas):
                lst.append(((mi, Fraction(n.getOffsetInHierarchy(meas)).limit_denominator(10000)), len(ps)))
        notes[k] = lst
    bars = list(score.parts[L["staves"][0]].getElementsByClass(m.stream.Measure)) if L["staves"] else []
    label = lambda mi: bar_label(bars[mi]) if mi < len(bars) else None  # noqa: E731
    spans, unclosed, orphans = pair_spans([{"key": (e[0], e[1]), "time": e[2], "order": e[3], "start": e[4] != "stop", "e": e}
                                           for e in events])
    spans = [(a["e"][0], a["e"], b["e"]) for a, b in spans]
    unclosed = [u["e"] for u in unclosed]
    out = []
    for staff, a, b in sorted(spans, key=lambda x: (x[0], x[1][2])):
        inside = sum(h for t, h in notes[staff] if a[2] <= t < b[2])
        out.append({"staff": staff, "kind": KIND.get((a[4], a[5]), f"{a[4]} {a[5]}"), "type": a[4], "size": a[5],
                    "first_bar": label(a[2][0]), "last_bar": label(b[2][0]), "notes": inside,
                    "start": [a[2][0], str(a[2][1])], "stop": [b[2][0], str(b[2][1])]})
    words = [x.content for x in score.recurse().getElementsByClass(m.expressions.TextExpression)
             if x.content and WORDS.search(x.content)]
    return {"spans": out, "n_spans": len(out),
            "unclosed": [{"staff": e[0], "kind": KIND.get((e[4], e[5]), e[4]), "start_bar": label(e[2][0]),
                          "start": [e[2][0], str(e[2][1])]} for e in unclosed],
            "orphan_stops": orphans, "empty_spans": sum(s["notes"] == 0 for s in out), "ottava_words": words}
