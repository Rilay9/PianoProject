# E38 Octaves on one staff.
#
# Chosen implementation: over E36's per-staff attacks (e36_simultaneous._staff_attacks), three separate counts, as
# ChatGPT asked: a PURE OCTAVE DYAD = exactly two distinct pitches 12 semitones apart (C3+C4); an OCTAVE-SPAN CHORD =
# three or more pitches whose outer notes are 12 apart (C3-E3-C4: an octave-doubled triad, not an octave played as
# such); an OCTAVE DOUBLING INSIDE a chord = any two of its pitches 12 apart where the outer notes are not (C3-G3-C4-E4
# has C3/C4 inside a tenth). Also the longest run of consecutive attacks that are pure octave dyads, and bars.
#
# Why: arithmetic over E36's grouping. music21's Chord.hasAnyRepeatedDiatonicNote was not used: it returned 0 on a
# corpus file that has octaves (new-library-research.md). Broken (alternating) octaves and repeated octave melodies
# are patterns, not this row (my row; ChatGPT). Staff, not hand: a dyad split between two voices still counts on the
# staff, and no one-hand claim is made.


def octaves(score):
    """Per staff: pure octave dyads (and longest run), octave-span chords, octave doublings inside wider chords, bars."""
    from e01_layout import layout
    from e36_simultaneous import _staff_attacks
    out = {}
    for k, idx in enumerate(layout(score)["staves"]):
        at = _staff_attacks(score, idx)
        pure = span_chord = inside = run = longest = 0
        bars = []
        for a in at:
            ps = a["pitches"]
            is_pure = len(ps) == 2 and ps[1] - ps[0] == 12
            run = run + 1 if is_pure else 0
            longest = max(longest, run)
            if is_pure:
                pure += 1
            elif len(ps) >= 3 and ps[-1] - ps[0] == 12:
                span_chord += 1
            elif len(ps) >= 3 and any(q - p == 12 for i, p in enumerate(ps) for q in ps[i + 1:]):
                inside += 1
            else:
                continue
            if not bars or bars[-1] != a["bar"]:
                bars.append(a["bar"])
        out[k + 1] = {"octave_dyads": pure, "octave_dyad_longest_run": longest, "octave_span_chords": span_chord,
                      "octave_doubling_inside_chord": inside, "bars": bars}
    return out
