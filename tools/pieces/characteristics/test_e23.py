"""Hand-made MusicXML cases for e23_slurs (CLAUDE.md technical rule 2): found, not found, built to fool it, and one per
gap the function patches over music21. Usage: python tools/pieces/characteristics/test_e23.py"""
import os, sys, warnings
from fractions import Fraction

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_characteristics import N, R, back, score, BAR_LH  # noqa: E402
from e23_slurs import slurs, _find  # noqa: E402


def S(kind, number=1):
    return f'<slur type="{kind}" number="{number}"/>'


def hide(note):
    return note.replace("<note>", '<note print-object="no">', 1)


def run(measures, **kw):
    s, p = score(measures, **kw)
    return slurs(s, p), s


def m21_slurs(s):
    """What music21 alone says: slurs it closed over two or more notes."""
    import music21 as m
    return [x for x in s.recurse().getElementsByClass(m.spanner.Slur) if len(x.getSpannedElements()) >= 2]


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


FOUR = N("C", notations=S("start")) + N("D") + N("E") + N("F", notations=S("stop"))


@case("found: a slur over four notes -> 1 slur, 4 notes, bar 1")
def _():
    r, _ = run([FOUR + back(4) + BAR_LH])
    s1 = r[1]
    assert s1["slurs"] == 1 and s1["notes_under"] == 4 and s1["attacks"] == 4 and s1["share_under"] == 1.0, s1
    assert s1["avg_notes_per_slur"] == 4.0 and s1["bars"] == ["1"] and s1["bar_indices"] == [0], s1
    assert r[2]["slurs"] == 0 and r[2]["attacks"] == 1 and r[2]["notes_under"] == 0


@case("not found: no slurs -> 0")
def _():
    r, _ = run([N("C") + N("D") + N("E") + N("F") + back(4) + BAR_LH])
    s1 = r[1]
    assert s1["slurs"] == 0 and s1["notes_under"] == 0 and s1["share_under"] == 0.0 and s1["avg_notes_per_slur"] is None
    assert s1["bars"] == [] and s1["unclosed_starts"] == [] and s1["orphan_stops"] == [] and s1["possible_tie"] == []


@case("fool (row): a slur between two Cs of the same pitch -> listed as a possible tie, still a slur")
def _():
    r, _ = run([N("C", dur=8, typ="half", notations=S("start")) + N("C", dur=8, typ="half", notations=S("stop")) + back(4) + BAR_LH])
    s1 = r[1]
    assert s1["slurs"] == 1 and s1["possible_tie"] == [{"bar_index": 0, "bar": "1", "number": "1"}], s1
    # the same two notes really tied, with a slur drawn over the tie: not listed
    tied = (N("C", dur=8, typ="half", tie="start", notations='<tied type="start"/>' + S("start"))
            + N("C", dur=8, typ="half", tie="stop", notations='<tied type="stop"/>' + S("stop")))
    assert run([tied + back(4) + BAR_LH])[0][1]["possible_tie"] == []
    # same pitch at both ends but a note between them (C D C): a normal slur, not a tie
    cdc = N("C", notations=S("start")) + N("D") + N("C", notations=S("stop")) + N("E")
    r, _ = run([cdc + back(4) + BAR_LH])
    assert r[1]["slurs"] == 1 and r[1]["possible_tie"] == [], r[1]
    # the same pitch in different octaves is not the same note
    c8 = N("C", 4, dur=8, typ="half", notations=S("start")) + N("C", 5, dur=8, typ="half", notations=S("stop"))
    assert run([c8 + back(4) + BAR_LH])[0][1]["possible_tie"] == []


@case("gap (cross-staff, stop written before start): music21 loses the slur, the function pairs by time")
def _():
    # staff 1 is written first and holds the STOP at beat 2; staff 2, written second, holds the START at beat 1
    bar = (N("C", 5) + N("D", 5, notations=S("stop")) + N("E", 5, dur=8, typ="half") + back(4)
           + N("C", 3, staff=2, notations=S("start")) + N("D", 3, staff=2) + N("E", 3, staff=2, dur=8, typ="half"))
    r, s = run([bar])
    assert m21_slurs(s) == [], "music21 now keeps this slur: the patch may be unnecessary"
    # slurs are counted at the staff of the start note; the notes under it are that staff's notes, here C3 D3
    assert r[2]["slurs"] == 1 and r[2]["cross_staff"] == 1 and r[2]["notes_under"] == 2 and r[1]["slurs"] == 0, r
    assert r[2]["unclosed_starts"] == [] and r[1]["orphan_stops"] == []


@case("gap (cross-staff, start written first): 1 slur from staff 1, notes of staff 1 only")
def _():
    bar = (N("C", 5, notations=S("start")) + N("D", 5) + N("E", 5, dur=8, typ="half") + back(4)
           + N("C", 3, staff=2) + N("D", 3, staff=2, notations=S("stop")) + N("E", 3, staff=2, dur=8, typ="half"))
    r, _ = run([bar])
    assert r[1]["slurs"] == 1 and r[1]["cross_staff"] == 1 and r[1]["notes_under"] == 2 and r[2]["slurs"] == 0, r


@case("gap (same number, two voices at once): music21 merges them across a barline, the function keeps two slurs")
def _():
    # voice 1: slur 1 from bar 1 beat 1 to bar 2 beat 1. voice 2: slur 1 inside bar 1, beats 2-3. Same number, overlapping.
    v1 = N("C", 5, notations=S("start")) + N("D", 5) + N("E", 5) + N("F", 5)
    v2 = R(voice=2) + N("A", 4, voice=2, notations=S("start")) + N("B", 4, voice=2, notations=S("stop")) + R(voice=2)
    b2 = N("G", 5, notations=S("stop")) + N("A", 5) + N("B", 5) + N("C", 6)
    r, s = run([v1 + back(4) + v2 + back(4) + BAR_LH, b2 + back(4) + BAR_LH])
    mm = m21_slurs(s)
    ends = sorted((x.getSpannedElements()[0].nameWithOctave, x.getSpannedElements()[-1].nameWithOctave) for x in mm)
    assert ends != [("A4", "B4"), ("C5", "G5")], "music21 pairs this correctly now: the patch may be unnecessary"
    assert r[1]["slurs"] == 2 and r[1]["unclosed_starts"] == [] and r[1]["orphan_stops"] == [], r[1]
    # notes under: voice 1 notes C D E F | G = 5; voice 2 notes A B = 2; no double counting; bars: both start in bar 1
    assert r[1]["notes_under"] == 7 and r[1]["bars"] == ["1"] and r[1]["ambiguous_stops"] == 1 and r[1]["ambiguous_no_winner"] == 0, r


@case("gap (a note ends one slur and starts the next): both orders of the marks give 2 slurs")
def _():
    for order in (S("stop") + S("start"), S("start") + S("stop")):
        bar = N("C", notations=S("start")) + N("D") + N("E", notations=order) + N("F", notations=S("stop"))
        r, s = run([bar + back(4) + BAR_LH])
        assert r[1]["slurs"] == 2 and r[1]["unclosed_starts"] == [] and r[1]["orphan_stops"] == [], (order, r[1])
        assert r[1]["notes_under"] == 4 and r[1]["avg_notes_per_slur"] == 2.5, r[1]
    # the (start, stop) order is the one music21 mis-pairs
    bar = N("C", notations=S("start")) + N("D") + N("E", notations=S("start") + S("stop")) + N("F", notations=S("stop"))
    assert len(m21_slurs(run([bar + back(4) + BAR_LH])[1])) != 2, "music21 pairs this correctly now"


@case("gap (a mark on every member of a chord): one slur, music21 adds a one-note fragment")
def _():
    start = N("C", dur=8, typ="half", notations=S("start")) + N("E", dur=8, typ="half", chord=True, notations=S("start"))
    stop = N("D", dur=8, typ="half", notations=S("stop")) + N("F", dur=8, typ="half", chord=True, notations=S("stop"))
    r, s = run([start + stop + back(4) + BAR_LH])
    assert r[1]["slurs"] == 1 and r[1]["notes_under"] == 2 and r[1]["unclosed_starts"] == [] and r[1]["orphan_stops"] == [], r[1]
    import music21 as m
    assert len(list(s.recurse().getElementsByClass(m.spanner.Slur))) == 2, "music21 no longer makes the fragment"


@case("gap (the same mark twice on one note = two slurs ending there): not merged as a chord duplicate")
def _():
    # two voices on staff 1 each start slur 1 at beat 1; both end on the one note at beat 3, which carries two stop marks
    v1 = N("C", 5, dur=8, typ="half", notations=S("start")) + N("D", 5, dur=8, typ="half", notations=S("stop") + S("stop"))
    v2 = N("E", 4, dur=8, typ="half", voice=2, notations=S("start"))
    r, _ = run([v1 + back(4) + v2 + R(dur=8, typ="half", voice=2) + back(4) + BAR_LH])
    assert r[1]["slurs"] == 2 and r[1]["orphan_stops"] == [] and r[1]["unclosed_starts"] == [], r[1]


@case("grace-note run: consecutive grace notes carrying the same mark are separate marks, not chord duplicates")
def _():
    # g1 starts a slur that g2 stops; g2 starts the slur that the main note stops
    bar = (N("A", 4, grace=True, notations=S("start")) + N("B", 4, grace=True, notations=S("stop") + S("start"))
           + N("C", 5, notations=S("stop")) + N("D", 5) + N("E", 5) + N("F", 5))
    r, _ = run([bar + back(4) + BAR_LH])
    assert r[1]["slurs"] == 2 and r[1]["orphan_stops"] == [] and r[1]["unclosed_starts"] == [], r[1]
    assert r[1]["notes_under"] == 1, r[1]  # only the main note C is an attack under them


@case("_snap: an end whose time is off by a rounding goes to the nearest attack of the staff; a distant one is not moved")
def _():
    from e23_slurs import _snap
    times = [(0, Fraction(0)), (0, Fraction(1, 4)), (1, Fraction(0))]
    assert _snap(times, 0, Fraction(1, 4) - Fraction(1, 60)) == Fraction(1, 4) and _snap(times, 0, Fraction(1, 24)) == Fraction(0)
    assert _snap(times, 0, Fraction(1, 2)) is None and _snap(times, 2, Fraction(0)) is None


@case("nested slurs (numbers 1 and 2): 2 slurs, the inner notes are not counted twice")
def _():
    bar = N("C", notations=S("start", 1)) + N("D", notations=S("start", 2)) + N("E", notations=S("stop", 2)) + N("F", notations=S("stop", 1))
    r, _ = run([bar + back(4) + BAR_LH])
    assert r[1]["slurs"] == 2 and r[1]["notes_under"] == 4 and r[1]["avg_notes_per_slur"] == 3.0, r[1]


@case("a slur across a barline and the number reused after it closes")
def _():
    b1 = N("C", dur=8, typ="half") + N("D", dur=8, typ="half", notations=S("start"))
    b2 = N("E", dur=8, typ="half", notations=S("stop")) + N("F", dur=8, typ="half", notations=S("start"))
    b3 = N("G", dur=8, typ="half", notations=S("stop")) + N("A", dur=8, typ="half")
    r, _ = run([b1 + back(4) + BAR_LH, b2 + back(4) + BAR_LH, b3 + back(4) + BAR_LH])
    assert r[1]["slurs"] == 2 and r[1]["bars"] == ["1", "2"] and r[1]["notes_under"] == 4 and r[1]["attacks"] == 6, r[1]


@case("dangling: a start never closed and a stop with no start are reported with their bar, not given an end")
def _():
    bar = N("C", notations=S("start", 1)) + N("D") + N("E", notations=S("stop", 2)) + N("F")
    r, _ = run([bar + back(4) + BAR_LH, FOUR + back(4) + BAR_LH])
    s1 = r[1]
    assert s1["slurs"] == 1 and s1["unclosed_starts"] == [{"bar_index": 0, "bar": "1", "number": "1"}], s1
    assert s1["orphan_stops"] == [{"bar_index": 0, "bar": "1", "number": "2"}], s1


@case("hidden notes: a slur starting on a print-object=no note is not a printed slur")
def _():
    bar = hide(N("C", notations=S("start"))) + N("D") + N("E", notations=S("stop")) + N("F")
    r, _ = run([bar + back(4) + BAR_LH])
    assert r[1]["slurs"] == 0 and r[1]["not_printed"] == 1 and r[1]["attacks"] == 3, r[1]


@case("grace note: a slur from a grace note to its main note covers the main note once; grace notes are not attacks")
def _():
    bar = N("B", 4, grace=True, notations=S("start")) + N("C", 5, notations=S("stop")) + N("D", 5) + N("E", 5) + N("F", 5)
    r, _ = run([bar + back(4) + BAR_LH])
    assert r[1]["slurs"] == 1 and r[1]["notes_under"] == 1 and r[1]["attacks"] == 4, r[1]
    # a slur that ENDS on a grace note does not cover the main note written after it
    bar = N("C", 5, notations=S("start")) + N("B", 4, grace=True, notations=S("stop")) + N("D", 5) + N("E", 5) + N("F", 5)
    r, _ = run([bar + back(4) + BAR_LH])
    assert r[1]["slurs"] == 1 and r[1]["notes_under"] == 1, r[1]


@case("voices: only the slur's own voice is under it; a bar with one voice counts all its notes")
def _():
    v1 = N("C", 5, notations=S("start")) + N("D", 5) + N("E", 5) + N("F", 5, notations=S("stop"))
    v2 = N("C", 4, dur=8, typ="half", voice=2) + N("D", 4, dur=8, typ="half", voice=2)
    r, _ = run([v1 + back(4) + v2 + back(4) + BAR_LH])
    assert r[1]["slurs"] == 1 and r[1]["notes_under"] == 4 and r[1]["attacks"] == 6, r[1]
    # a slur whose end is in another voice (voice change): both voices' notes count
    v1 = N("C", 5, dur=8, typ="half", notations=S("start")) + N("D", 5, dur=8, typ="half")
    v2 = R(dur=8, typ="half", voice=2) + N("E", 4, dur=8, typ="half", voice=2, notations=S("stop"))
    r, _ = run([v1 + back(4) + v2 + back(4) + BAR_LH])
    assert r[1]["slurs"] == 1 and r[1]["voice_change"] == 1 and r[1]["notes_under"] == 3, r[1]


@case("a slur ending on a rest is counted and flagged")
def _():
    bar = N("C", notations=S("start")) + N("D") + N("E") + N("F", rest=True).replace("</note>", "<notations>" + S("stop") + "</notations></note>")
    r, _ = run([bar + back(4) + BAR_LH])
    assert r[1]["slurs"] == 1 and r[1]["ends_on_rest"] == 1 and r[1]["notes_under"] == 3, r[1]


@case("two-part file (right and left hand as separate parts): numbers are scoped by part, so each hand keeps its own slur 1")
def _():
    rh = N("C", 5, notations=S("start")) + N("D", 5) + N("E", 5) + N("F", 5, notations=S("stop"))
    lh = N("C", 3, notations=S("start")) + N("D", 3) + N("E", 3) + N("F", 3, notations=S("stop"))
    s, p = score([[rh], [lh]], parts=[("Right Hand", 1), ("Left Hand", 1)])
    r = slurs(s, p)
    assert r[1]["slurs"] == 1 and r[2]["slurs"] == 1 and r[1]["notes_under"] == 4 and r[2]["notes_under"] == 4, r


@case("_find: a time that differs by a rounding of 1/240 still finds the attack; a real neighbour is not taken")
def _():
    lst = [(0, Fraction(0)), (0, Fraction(1, 12)), (1, Fraction(0))]
    assert _find(lst, 0, Fraction(1, 12) + Fraction(1, 240)) == 1 and _find(lst, 0, Fraction(-1, 240)) == 0
    assert _find(lst, 0, Fraction(1, 24)) is None and _find(lst, 2, Fraction(0)) is None


def main():
    only = sys.argv[1:]
    bad = 0
    for name, fn in CASES:
        if only and not any(name.startswith(o) for o in only):
            continue
        try:
            fn()
            print("ok ", name)
        except AssertionError as e:
            bad += 1
            print("BAD", name, "-", e)
        except Exception as e:  # noqa: BLE001
            bad += 1
            import traceback
            print("ERR", name, "-", type(e).__name__, e)
            traceback.print_exc()
    print("all cases pass" if not bad else f"{bad} cases fail")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
