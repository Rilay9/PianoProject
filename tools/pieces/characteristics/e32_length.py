# E32 Length (written length only).
#
# Chosen implementation: built on E02 (bar list and bar lengths) and E10 (pickup): music21 Measures, plus E02's one raw
# read of the implicit flag. The bar count is not recounted. ONE patch is added here for a measured music21 gap
# (whole-measure rests, below); E02 and E10 are shared files and are not edited, so the correction lives in this file.
# Reported side by side, because they answer different questions (ChatGPT's review, adopted: stored <measure> elements
# are not semantic bars, and a pickup and repeats change what "length" means):
#   stored_measures      every <measure> element, as E02 lists them (the longest staff; per_staff_measures gives each);
#   excluded_from_count  bars the editor numbered "X1", "X2" ...: music21 keeps the Measure and turns the number into a
#                        suffix containing "X" (probed: "X1" after bar 2 -> number 2, suffix "X1"; "X1" right after bar
#                        number-1, e.g. after a pickup 0, -> number 1, suffix "X"; consecutive X bars accumulate "X1X2").
#                        The test is "X in the suffix", never the number;
#   bars                 stored_measures minus excluded_from_count: the bar count as the score prints it;
#   pickup               "confirmed" / "candidate" / "none" / "unknown" - E10's states, unchanged;
#   bars_excluding_pickup   bars minus the pickup bar when the pickup is confirmed;
#   bars_excluding_pickup_if_candidate   the same when a candidate alone is also taken as a pickup (the caller chooses;
#                        differs only for the 30 files where the pickup is a candidate and not confirmed);
#   quarters / quarters_excluding_pickup / quarters_decimal   notated length in quarters: the sum of the bar lengths
#                        (largest staff in each bar), the second without the pickup bar when confirmed. WRITTEN length:
#                        no repeat expansion (the old project's check found music21's expander right on 27 of 81
#                        disputed files, so it is not used here), no seconds (D01, built on E25 tempo);
#   over_full_bars       bars longer than their time signature by more than an eighth of a quarter (after the
#                        correction below): a property of the encoding (cadenzas, bars never re-metered, one stored
#                        measure holding several bars), so bar count and quarters can disagree;
#   corrected_bars       the bars where the gap below was patched.
#
# X bars - should a printed-number count use them? Yes for the bar count, no for the quarters. Measured: they are
# the bars MuseScore itself leaves out of its numbering - the second half of a bar split across a repeat sign (file
# QmbtqGpbZ6U9DECtd1YBPf2fXQP2kPyRnEU2A8odVEfzb1, 6/8: bar 33 is 3/2 quarters, 33X1 the other 3/2) or an extra pickup bar - so counting
# them makes that 64-bar piece 65. Their music is real, so quarters sums every stored measure.
#
# Probed on hand-made MusicXML (test_e32.py): music21 keeps every stored <measure> as its own Measure, so a multi-bar
# rest written as four <measure>s is four Measures; <measure-style><multiple-rest> leaves nothing on the Measure (not
# merged, not flagged); parts that differ in measure count keep their own counts; Measure.duration equals highestTime and
# barDuration is the time signature's, so a short bar is read from highestTime (what E02 does).
#
# THE GAP (measured, patched): a rest with measure="yes" and no <type> (or type whole/breve) is set by music21 to the
# whole bar of the time signature in force, ignoring its own <duration>: xmlToM21 sets r.fullMeasure = True and the
# rest's quarterLength to the bar's. Where the other staff is shorter than the bar (a pickup, a split bar, a short bar before a repeat), E02 reads
# the bar as full. Probed: a one-quarter bar whose staff 2 holds <rest measure="yes"/><duration>4</duration> (divisions
# 4) comes out at 4.0 quarters on staff 2. Measured on our 842 files by comparing E02's bar lengths with a raw walk of
# the <duration>/<backup>/<forward> cursor: 30 bars in 10 files (e.g. QmUDYpWTgiqpRaT1GF6FE2izqYyDBqVNrxNgYmdtkwJjHJ bar 9
# of a 3/4 piece: music21 3, file 1; QmSPmyZVe81hgJcKmYDyadC9svaiGGBQVFbcwyNgxSBHcZ bar 1: music21 4, file 1/2, a pickup E10
# then misses).
# Patch (moved into E02 after this row was built, so E10 and every other row get it too; the cursor walk is now
# _raw.bar_lengths): only bars where music21 holds a rest with fullMeasure True are re-measured with the raw cursor,
# and the cursor length replaces music21's only when the two differ by more than 1/8 quarter.
# The 30 measured bars are all shorter than music21 says; the same override also catches a longer one (a multi-bar rest
# stored as ONE whole-typed <rest> of several bars: music21 gives it one bar, probed), a case with 0 files in our corpus,
# kept because it is the same mechanism and is covered by a hand-made case only.
# That guard matters: the cursor adds integer <duration>s, which drift by up to 0.03 quarter in files with odd tuplets
# (16 bars in 10 files, E02 right in all 16), so it never overrides a bar by a small difference. The pickup state is
# E10's, which now reads E02's corrected lengths.
#
# Whole-corpus run of this function (842 files, Pool(3), scratch e32corpus.py) against an independent raw count: stored
# measures, X-numbered bars and printed bars (stored minus X): identical in all 842 (63,150 stored, 63,065 printed; 37
# files hold 85 X bars). Quarters against the raw cursor sum of every bar: identical in 830; in the other 12 the
# difference is at most 0.0125 quarter in 9 files (integer <duration> rounding in the file, music21's exact value kept),
# 0.085 in one (tuplet-heavy QmUrEcGLBEn1djBtaUHM..., 763 quarters), and 3 and -1 quarters in the two bars described under
# "Not patched". The patch changed 30 bars in 10 files; pickup status differs from E10 in 3 of those (E10 saw a full
# first bar): aiGGBQ... none -> candidate (first bar 1/2 of 4, no implicit flag, last bar full), pHgJKSvp... and
# LojGobUq... none -> confirmed (3/4 piece, first bar 1, last bar 2, no implicit flag). Staves never differ in measure
# count (0 files). Pickup states over the corpus: none 633, confirmed 175, candidate 30, unknown 4 (no time signature).
#
# Not patched, measured: 1 bar in 1 file (QmcRfYZGjX4W6phNstFQV4SUvyYY7j7ZCqg6dY53rB6Btj bar 26) where the measure begins with a
# <backup> before any note, so music21 reads staff 2 as 7 quarters in a 4/4 bar (invalid encoding; cursor says 4);
# the file's own <duration>s adding up to 4.002 in one file (QmU1nszC4coRA3qvzTpZW7MeKGb5D7P1GqvcGA6ZVr4uXd bar 61:
# quarters 144001/480 instead of 300; quarters_decimal shows 300.002). Not adopted: any level ceiling on bar counts
# (ChatGPT, removed: it was the project's own filter); played length (needs verified repeat expansion, mark.repeat);
# merging multi-bar rests (<multiple-rest> occurs in 0 of 842 files; a rest stored as one long measure is reported as an
# over-full bar, its bars are not split).
import re
from fractions import Fraction

TOLERANCE = Fraction(1, 8)  # a difference smaller than this is encoding noise, not a different bar length


def length(score, path):
    """Written length: stored measures, printed bar count, pickup status, quarters. See the comment above."""
    import music21 as m
    from e01_layout import layout
    from e02_bars import bars
    from e10_pickup import pickup
    ms = bars(score, path)["measures"]
    staves = [list(score.parts[i].getElementsByClass(m.stream.Measure)) for i in layout(score)["staves"]]
    if not ms:
        return {"stored_measures": 0, "per_staff_measures": [len(s) for s in staves], "excluded_from_count": [], "bars": 0,
                "pickup": "none", "bars_excluding_pickup": 0, "bars_excluding_pickup_if_candidate": 0, "quarters": "0",
                "quarters_excluding_pickup": "0", "quarters_decimal": 0.0, "over_full_bars": 0, "corrected_bars": []}
    lengths = [Fraction(x["length"]) for x in ms]
    # the whole-measure-rest gap is corrected in E02 itself (moved there from this file); E10 sees the corrected lengths
    corrected = [{"bar": x["number"], "index": x["index"], "music21": x["corrected_from"], "written": x["length"]}
                 for x in ms if "corrected_from" in x]
    p = pickup(score, path)
    status = "unknown" if p.get("UNKNOWN") else "confirmed" if p["confirmed"] else "candidate" if p["candidate"] else "none"
    xbar = re.compile(r"^X\d*$")  # MuseScore's split-bar numbering ("X1"), not any number containing X (review)
    excluded = [x["number"] for x in ms if xbar.match(x["number"] or "")]
    bars_counted = len(ms) - len(excluded)
    off = 0 if xbar.match(ms[0]["number"] or "") else 1  # a pickup already outside the count is not taken off twice
    quarters = sum(lengths)
    return {"stored_measures": len(ms), "per_staff_measures": [len(s) for s in staves], "excluded_from_count": excluded,
            "bars": bars_counted, "pickup": status,
            "bars_excluding_pickup": bars_counted - (off if status == "confirmed" else 0),
            "bars_excluding_pickup_if_candidate": bars_counted - (off if status in ("confirmed", "candidate") else 0),
            "quarters": str(quarters),
            "quarters_excluding_pickup": str(quarters - (lengths[0] if status == "confirmed" else 0)),
            "quarters_decimal": round(float(quarters), 3),
            "over_full_bars": sum(1 for i, x in enumerate(ms) if x["nominal"] is not None and lengths[i] > Fraction(x["nominal"]) + TOLERANCE),
            "corrected_bars": corrected}
