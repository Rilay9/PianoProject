# E21 Hairpins and cresc./dim. words.
#
# Chosen implementation: wedge ends from the file, words from music21. The <wedge type="crescendo|diminuendo|stop">
# directions are read with _raw.directions (time position in the bar) and paired per part, staff and `number` by
# _raw.pair_spans, the same pairing as E04's ottava lines. Each hairpin: kind, staff, first and last bar (index and
# printed number). Unclosed starts and orphan stops are counted, never given an invented end. "cresc.", "dim." and
# similar words come from music21 TextExpressions matched against a closed list; they are labels with no extent
# (ChatGPT: never fabricate a fade interval after "cresc.").
#
# Why not music21's dynamics.Crescendo/Diminuendo spanners: measured on the files where they disagreed with the raw
# count (38 of 833, about one wedge each), music21 pairs wedge ends in document order, not time order, so a stop written
# after the next start in the same bar is matched to the wrong wedge. File QmUaMY: bar 4 has a crescendo at beat 1, its
# stop at 3/4, a diminuendo at 3/4 and its stop at 3/2, written stop(3/2), stop(3/4), dim(3/4); music21 makes one
# diminuendo from bar 4 to bar 20. File Qmbm31: music21 chains wedges across bars 79-110 that the file closes within
# single bars. Hairpins are reading facts on rungs A.6, B.8 and 1.6, so this is worth the small raw read; music21's
# typed objects are still used for everything else.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
import re

WORDS = re.compile(r"(?<![a-z])(cresc(\.|endo)?|dim(\.|inuendo)?|decresc(\.|endo)?)(?![a-z])", re.I)


def hairpins(score, path):
    """Hairpins with kind, staff and bars; unclosed and orphan counts; cresc./dim. words."""
    import music21 as m
    from e01_layout import layout
    from _raw import raw_root, directions, pair_spans
    L = layout(score)
    root = raw_root(path)
    raw_parts = list(root.iter("part"))
    if len(raw_parts) != len(L["parts"]):
        return {"UNKNOWN": f"{len(raw_parts)} parts in the file, {len(L['parts'])} in music21"}
    staff_no = {idx: k + 1 for k, idx in enumerate(L["staves"])}
    events = []
    for order, (pi, mi, st, pos, el) in enumerate(directions(root, "wedge")):
        ids = L["parts"][pi]["staff_indices"]
        typ = el.get("type")
        if st - 1 < len(ids) and ids[st - 1] in staff_no and typ in ("crescendo", "diminuendo", "stop"):
            events.append({"key": (staff_no[ids[st - 1]], el.get("number") or "1"), "time": (mi, pos), "order": order,
                           "start": typ != "stop", "kind": typ})
    spans, unclosed, orphans = pair_spans(events)
    bars = list(score.parts[L["staves"][0]].getElementsByClass(m.stream.Measure)) if L["staves"] else []
    label = lambda mi: bar_label(bars[mi]) if mi < len(bars) else None  # noqa: E731
    out = sorted(({"kind": a["kind"], "staff": a["key"][0], "first_bar_index": a["time"][0], "first_bar": label(a["time"][0]),
                   "last_bar": label(b["time"][0])} for a, b in spans), key=lambda x: (x["first_bar_index"], x["staff"]))
    words = [x.content for x in score.recurse().getElementsByClass(m.expressions.TextExpression)
             if x.content and WORDS.search(x.content)]
    return {"crescendo": sum(x["kind"] == "crescendo" for x in out), "diminuendo": sum(x["kind"] == "diminuendo" for x in out),
            "hairpins": out, "unclosed": [{"kind": u["kind"], "staff": u["key"][0], "start_bar": label(u["time"][0])} for u in unclosed],
            "orphan_stops": orphans, "words": words}
