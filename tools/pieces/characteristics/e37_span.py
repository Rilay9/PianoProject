# E37 Span of notes struck together, per staff.
#
# Chosen implementation: over E36's per-staff attacks (e36_simultaneous._staff_attacks: struck printed notes with one
# onset, across voices), span = highest minus lowest MIDI pitch. Per staff: largest and median span over attacks of 2+
# notes that are not rolled; how many spans exceed 12 and 14 semitones, with their bars; and, kept apart, wide spans
# (over 12) on rolled chords (an arpeggio sign at that onset, the same marks E16 reads).
#
# Why: a subtraction over E36's grouping, so the two rows always see the same attacks. Named a vertical PITCH SPAN on
# a staff, not a hand stretch (ChatGPT): two voices on one staff may belong to different hands, a rolled chord needs
# less simultaneous reach, and duplicated voices inflate it - none of which is decided here, only reported. No
# arrangement is judged unplayable from this row. Thresholds 12 and 14 are reporting bands from my row (an octave, and
# a ninth plus); the old branch's reach flag over 16 was validated as a flag only.


def span(score):
    """Per staff: largest / median span of unrolled attacks, counts and bars over 12 and 14, wide rolled chords."""
    from e01_layout import layout
    from e36_simultaneous import _staff_attacks
    out = {}
    for k, idx in enumerate(layout(score)["staves"]):
        at = [a for a in _staff_attacks(score, idx) if len(a["pitches"]) > 1]
        plain = [a for a in at if not a["rolled"]]
        spans = sorted(a["pitches"][-1] - a["pitches"][0] for a in plain)

        def bars(limit):
            b = []
            for a in plain:
                if a["pitches"][-1] - a["pitches"][0] > limit and (not b or b[-1] != a["bar"]):
                    b.append(a["bar"])
            return b
        out[k + 1] = {"span_max": spans[-1] if spans else 0,
                      "span_median": spans[len(spans) // 2] if spans else 0,
                      "over_12": sum(x > 12 for x in spans), "over_14": sum(x > 14 for x in spans),
                      "bars_over_12": bars(12), "bars_over_14": bars(14),
                      "wide_but_rolled": sum(1 for a in at if a["rolled"] and a["pitches"][-1] - a["pitches"][0] > 12)}
    return out
