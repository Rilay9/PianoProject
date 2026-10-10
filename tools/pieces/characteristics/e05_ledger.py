# E05 Ledger lines, per staff.
#
# Chosen implementation: music21 gives each note's spelled pitch (Pitch.diatonicNoteNum, C4 = 29) and the clef in force
# at that note (getContextByClass(clef.Clef), which finds mid-bar clef changes: probed). The displayed position is the
# encoded (sounding) diatonic number moved by any ottava from E04 (8va = type down: printed 7 diatonic steps lower; 15ma
# 14), and by nothing else. Ledger lines: with b = the clef's bottom line and t = b + 8 the top line,
# below = (b - d) // 2 when d < b, above = (d - t) // 2 when d > t. A note on the first ledger line and one in the
# space just beyond it both need one line (C4 and B3 in treble), which the hand cases pin on both sides of both staves.
#
# Why the bottom line is computed, not taken from music21: music21's Clef.lowestLine is wrong for octave clefs
# (probed, 10.5: Treble8vaClef 24, should be 38; Bass8vbClef 19, should be 12; plain treble 31 and bass 19 are right).
# So the bottom line comes from music21's own sign, line and octaveChange: G line 1 = G4 (33), F line 1 = F3 (25),
# C line 1 = C4 (29), two diatonic steps per line, plus 7 per octave change (a treble-8vb clef prints sounding C4 where
# a treble clef prints C5). Percussion and tab clefs give no count.
#
# From ChatGPT's review (adopted): displayed spelling and clef at that instant, never MIDI; high counts are kept as data
# (by_count) with a separate possible_missing_8va flag when a count passes 5 (in the old branch 97 real files had 6+,
# many where an 8va was lost), not hidden. Notes after an unclosed ottava start are not shifted (its extent is unknown)
# and the staff is marked so. Each note of a chord counts; grace notes are counted apart; only printed
# notes count, small ones included (_notes.py).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter
from fractions import Fraction

BOTTOM = {"G": 33, "F": 25, "C": 29}


def ledger(score, path):
    """Per staff: notes by signed ledger-line count (negative = below), maxima, bars with 1-2 and 3+ lines, flags."""
    import music21 as m
    from e01_layout import layout
    from e04_ottava import ottava
    from _notes import printed
    L = layout(score)
    o = ottava(score, path)
    spans = o.get("spans", [])
    unclosed = {u["staff"] for u in o.get("unclosed", [])}
    out = {}
    for k, idx in enumerate(L["staves"]):
        staff = k + 1
        mine = [((s["start"][0], Fraction(s["start"][1])), (s["stop"][0], Fraction(s["stop"][1])),
                 (1 if s["size"] == "8" else 2 if s["size"] == "15" else 3) * (-7 if s["type"] == "down" else 7))
                for s in spans if s["staff"] == staff]
        c, grace, where, per_bar = Counter(), Counter(), {"1-2": [], "3+": []}, Counter()
        for mi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
            bar = bar_label(meas)
            for n, ps in printed(meas):
                cl = n.getContextByClass(m.clef.Clef)
                if cl is None or cl.sign not in BOTTOM or cl.line is None:
                    continue
                b = BOTTOM[cl.sign] - 2 * (cl.line - 1) + 7 * (cl.octaveChange or 0)
                t = (mi, Fraction(n.getOffsetInHierarchy(meas)).limit_denominator(10000))
                shift = next((sh for a, z, sh in mine if a <= t < z), 0)
                for p in ps:
                    d = p.diatonicNoteNum + shift
                    lc = -((b - d) // 2) if d < b else (d - b - 8) // 2 if d > b + 8 else 0
                    (grace if n.duration.isGrace else c)[lc] += 1
                    if lc and not n.duration.isGrace:
                        per_bar[mi] += 1
                        w = where["1-2" if abs(lc) <= 2 else "3+"]
                        if not w or w[-1] != bar:
                            w.append(bar)
        out[staff] = {"by_count": {str(x): v for x, v in sorted(c.items())},
                      "grace_by_count": {str(x): v for x, v in sorted(grace.items())},
                      "max_above": max([x for x in c if x > 0] or [0]), "max_below": -min([x for x in c if x < 0] or [0]),
                      "bars_1_2": where["1-2"], "bars_3_plus": where["3+"],
                      "possible_missing_8va": any(abs(x) > 5 for x in c),
                      "unclosed_ottava": staff in unclosed,
                      "ledger_notes_per_bar_index": dict(sorted(per_bar.items()))}
    return out
