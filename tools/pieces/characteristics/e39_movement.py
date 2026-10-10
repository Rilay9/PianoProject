# E39 Staff outer-edge movement and per-voice intervals.
#
# Chosen implementation: two separate figures, never merged and never called "melody" (my row after ChatGPT).
# (a) Staff outer-edge displacement: over E36's per-staff attacks (e36_simultaneous._staff_attacks), the top note of
#     each attack, except on the lower of two piano staves (E01), where it is the bottom note; the interval in semitones
#     to the next attack with its direction, and the time between the two attacks in quarter notes (as written, no
#     repeats). Jumps = more than 12 semitones within 2 quarter notes (after Sebastien et al. 2012's hand-displacement
#     criterion, "over 12 semitones in under 2 beats"; the window is kept in quarters so it does not depend on the metre).
# (b) Per-voice melodic intervals: within each written voice (music21 Voice id, followed across bars; a chord counts by
#     its top note), music21 interval.Interval between consecutive struck notes: semitones, direction, and generic
#     size (2nd, 3rd ...), so steps, skips and leaps can be read in written terms as ChatGPT asked.
#
# Why: no library gives per-staff motion (music21's melodicIntervals and its jSymbolic interval features mix both staves
# and chord notes: new-library-research.md), so (a) is a subtraction over E36's grouping; (b) uses music21's Interval.
# Limits stated rather than hidden (ChatGPT): the outer edge can splice unrelated voices as chords turn over, and a
# written voice is not a verified hand, so (a) is a displacement statistic and neither figure certifies a physical
# hand leap or a melody-reading lesson. My row's fool case ("an Alberti bass: the bottom line stays put on the low
# note") was wrong and is dropped: each Alberti eighth is a single attack, so the bottom line moves with every note
# (C3-G3-E3-G3 gives 7, 3, 3 semitones), the same as the voice line (hand case in test_e33_e46.py).
from collections import Counter


def movement(score):
    """Per staff: outer-edge intervals (histogram, largest, jumps over 12 within 2 quarters) and per-voice melodic
    intervals (semitone histogram, directions, generic sizes, largest)."""
    import music21 as m
    from e01_layout import layout
    from e36_simultaneous import _staff_attacks
    from _notes import printed, _keep
    L = layout(score)
    lower = L["two_piano_staves"][1] if L["two_piano_staves"] else None
    hist = lambda xs: {("13+" if x == 13 else x): c for x, c in sorted(Counter(min(abs(v), 13) for v in xs).items())}  # noqa: E731
    out = {}
    for k, idx in enumerate(L["staves"]):
        at = _staff_attacks(score, idx)
        use_bottom = idx == lower
        edge = [(a["time"], a["pitches"][0] if use_bottom else a["pitches"][-1], a["bar"]) for a in at]
        iv = [b[1] - a[1] for a, b in zip(edge, edge[1:])]
        jumps = [b[2] for a, b in zip(edge, edge[1:]) if abs(b[1] - a[1]) > 12 and b[0] - a[0] < 2]
        lines = {}
        for meas in score.parts[idx].getElementsByClass(m.stream.Measure):
            for v in (list(meas.voices) or [meas]):
                vid = getattr(v, "id", "1") if v is not meas else "1"
                for n, ps in printed(v):
                    if n.duration.isGrace:
                        continue
                    members = [x for x in (n.notes if n.isChord else [n]) if _keep(x)]
                    if all(x.tie is not None and x.tie.type in ("stop", "continue") for x in members):
                        continue
                    lines.setdefault(str(vid), []).append(max(ps, key=lambda p: p.ps))
        semis, dirs, generic = [], Counter(), Counter()
        for line in lines.values():
            for a, b in zip(line, line[1:]):
                i = m.interval.Interval(a, b)
                semis.append(i.semitones)
                dirs["same" if i.semitones == 0 else "up" if i.semitones > 0 else "down"] += 1
                generic[i.generic.undirected] += 1
        out[k + 1] = {"edge": "bottom" if use_bottom else "top",
                      "edge_intervals": hist(iv),
                      "edge_largest": max((abs(x) for x in iv), default=0),
                      "jumps_over_12_within_2q": len(jumps), "jump_bars": sorted(set(jumps), key=jumps.index),
                      "voice_semitones": hist(semis),
                      "voice_directions": dict(dirs), "voice_generic": dict(sorted(generic.items())),
                      "voice_largest": max((abs(x) for x in semis), default=0)}
    return out
