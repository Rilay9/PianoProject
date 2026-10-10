# D01 Notes per second at the marked tempo (attack rate; not key velocity or finger technique).
#
# Chosen implementation: E25's tempo map (spans of quarter notes per minute, each starting at bar index + offset, with
# its source; qpm "UNKNOWN" where no usable number exists) turns written quarter positions into seconds: each span
# lasts from its start to the next span's start (or the end of the piece) and takes 60/qpm seconds per quarter. Attacks
# come from E36 (e36_simultaneous._staff_attacks: struck printed notes; a chord or simultaneous voices = one attack;
# chord members each count as notes). Reported per staff and for all staves together: attacks per second and notes per
# second over the stretch with a known tempo, the share of the piece that stretch covers, the densest 4 consecutive
# bars wholly inside it, and the tempo sources used. No known tempo anywhere -> UNKNOWN; no default tempo is assumed.
#
# Why E25 and not music21's secondsMap: secondsMap reads music21's own MetronomeMarks, which (probed for E25) lose the
# <sound tempo> sharing a direction with a metronome and treat every sound tempo, including a lone exporter-default 120,
# as a tempo. E25 already decides provenance (metronome first, sound tempo only without one, a lone 120 UNKNOWN,
# conflicting marks UNKNOWN), so the conversion here is plain arithmetic over its spans and inherits those decisions -
# ChatGPT's main point for this row. Written length, no repeats (repeat expansion is not in this batch).
# Not done: tempos from 8notes listings (allowed earlier by the owner) - no such value is in the score files, so a song
# without a printed tempo stays UNKNOWN here. A rate is one dimension of demand, not a difficulty label or a safe
# target speed (ChatGPT).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from fractions import Fraction


def rate(score, path):
    """Attacks and notes per second at the marked tempo, per staff and together, with coverage and densest 4 bars."""
    import music21 as m
    from e01_layout import layout
    from e25_tempo import tempo
    from e36_simultaneous import _staff_attacks
    L = layout(score)
    if not L["staves"]:
        return {"UNKNOWN": "no pitched staff"}
    t = tempo(score, path)
    ref = list(score.parts[L["staves"][0]].getElementsByClass(m.stream.Measure))
    starts = [Fraction(x.offset).limit_denominator(10000) for x in ref]
    end = max(Fraction(score.parts[i].highestTime).limit_denominator(10000) for i in L["staves"])
    spans = []
    for sp in t.get("spans", []):
        bi = sp["bar_index"]
        if bi < len(starts):
            spans.append([starts[bi] + Fraction(sp["offset"]), sp["qpm"] if isinstance(sp["qpm"], (int, float)) else None, sp["source"]])
    spans.sort(key=lambda x: x[0])
    known = [(a, (spans[i + 1][0] if i + 1 < len(spans) else end), q, src) for i, (a, q, src) in enumerate(spans) if q]
    if not known:
        return {"UNKNOWN": "no known tempo", "tempo_source": t.get("source")}

    def qpm_at(x):
        return next((q for a, b, q, _ in known if a <= x < b), None)

    def seconds(a, b):
        """Seconds between quarter positions a < b, or None if any part has no known tempo."""
        total = 0.0
        for s_a, s_b, q, _ in known:
            lo, hi = max(a, s_a), min(b, s_b)
            if lo < hi:
                total += float(hi - lo) * 60.0 / q
        covered = sum(max(Fraction(0), min(b, s_b) - max(a, s_a)) for s_a, s_b, _, _ in known)
        return total if covered == b - a else None
    known_secs = sum(float(b - a) * 60.0 / q for a, b, q, _ in known)
    att = {k + 1: _staff_attacks(score, idx) for k, idx in enumerate(L["staves"])}
    # note heads per attack: every printed head, unison doublings included (ChatGPT's review: distinct pitches undercount)
    heads = lambda a: len(a["pitches"]) + a.get("doublings", 0)  # noqa: E731
    together = {}
    for v in att.values():
        for a in v:
            together[a["time"]] = together.get(a["time"], 0) + heads(a)
    groups = dict(att)
    groups["all"] = [{"time": tm, "heads": n} for tm, n in sorted(together.items())]
    out = {"tempo_source": t.get("source"), "sources_used": sorted({src for _, _, _, src in known}),
           "known_tempo_share": round(float(sum(b - a for a, b, _, _ in known) / end), 3) if end else None,
           "known_seconds": round(known_secs, 1),
           # E25 keeps printed metronome marks and sets aside later playback-only <sound tempo> values; if there are
           # any, the printed tempo may not be what the file plays (ChatGPT's review): flagged, not silently used
           "playback_only_tempo_marks_set_aside": len(t.get("sound_only_marks") or [])}
    for k, v in groups.items():
        timed = [a for a in v if qpm_at(a["time"])]
        best = None
        for i in range(len(starts) - 3):  # exactly four bars (fixed after review: the end gave 1-3-bar windows)
            lo, hi = starts[i], (starts[i + 4] if i + 4 < len(starts) else end)
            secs = seconds(lo, hi) if hi > lo else None
            if secs:
                n = sum(1 for a in v if lo <= a["time"] < hi)
                r = n / secs
                if best is None or r > best[0]:
                    best = (r, i)
        out[k] = {"attacks_per_second": round(len(timed) / known_secs, 2) if known_secs else None,
                  "notes_per_second": round(sum(a["heads"] if "heads" in a else heads(a) for a in timed) / known_secs, 2) if known_secs else None,
                  "densest_4_bars_attacks_per_second": round(best[0], 2) if best else None,
                  "densest_4_bars_from": bar_label(ref[best[1]]) if best else None}
    return out
