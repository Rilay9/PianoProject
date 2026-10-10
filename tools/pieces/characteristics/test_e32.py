"""Hand-made MusicXML cases for e32_length (CLAUDE.md technical rule 2): found, not found, built to fool it, one per gap
patched. Usage: python tools/pieces/characteristics/test_e32.py"""
import os, sys, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_characteristics import N, R, back, attrs, score, BAR_C, BAR_LH  # noqa: E402
from e32_length import length  # noqa: E402

ONE = [("Piano", 1)]
A1 = attrs(staves=1, clefs=(("G", 2),))  # one staff, 4/4
FULL = BAR_C  # four quarters


def MR(dur, staff=2, voice=5):
    """A whole-measure rest as MuseScore writes it: measure="yes", no <type>."""
    return f'<note><rest measure="yes"/><duration>{dur}</duration><voice>{voice}</voice><staff>{staff}</staff></note>'


def run(measures, **kw):
    s, p = score(measures, first_attrs=kw.pop("first_attrs", A1), parts=kw.pop("parts", ONE), **kw)
    return length(s, p)


def rewritten(measures, old, new, **kw):
    """Builds a case, replaces text in its file (to write what the helper cannot, e.g. an X bar number), parses again."""
    import music21 as m
    s, p = score(measures, first_attrs=kw.pop("first_attrs", A1), parts=kw.pop("parts", ONE), **kw)
    text = open(p, encoding="utf-8").read()
    assert old in text
    open(p, "w", encoding="utf-8").write(text.replace(old, new))
    return length(m.converter.parse(p, forceSource=True), p)


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("found: 16 plain bars -> 16, no pickup, 64 quarters")
def _():
    r = run([FULL] * 16)
    assert r["stored_measures"] == 16 and r["bars"] == 16 and r["pickup"] == "none"
    assert r["bars_excluding_pickup"] == 16 and r["quarters"] == "64" and r["excluded_from_count"] == []
    assert r["corrected_bars"] == [] and r["over_full_bars"] == 0


@case("fool: pickup + 16 full bars -> 17 measures, 16 excluding the pickup (implicit flag)")
def _():
    r = run([N("C")] + [FULL] * 16, implicit_first=True)
    assert r["stored_measures"] == 17 and r["bars"] == 17 and r["pickup"] == "confirmed"
    assert r["bars_excluding_pickup"] == 16 and r["quarters"] == "65" and r["quarters_excluding_pickup"] == "64"


@case("fool: pickup with a completing last bar and no implicit flag -> confirmed by the complement; N-1 full bars")
def _():
    r = run([N("C")] + [FULL] * 15 + [N("D") * 3])
    assert r["stored_measures"] == 17 and r["pickup"] == "confirmed" and r["bars_excluding_pickup"] == 16
    assert r["quarters"] == "64" and r["quarters_excluding_pickup"] == "63"


@case("fool: a short first bar alone is only a candidate - both counts are given, the caller chooses")
def _():
    r = run([N("C")] + [FULL] * 3 + [FULL])
    assert r["pickup"] == "candidate" and r["bars_excluding_pickup"] == 5 and r["bars_excluding_pickup_if_candidate"] == 4


@case("not found: no time signature -> pickup unknown, counts still given")
def _():
    r = run([FULL] * 3, first_attrs=attrs(staves=1, clefs=(("G", 2),), time=None))
    assert r["pickup"] == "unknown" and r["stored_measures"] == 3 and r["bars_excluding_pickup"] == 3


@case("X bars: 5 stored, one numbered X1 (split bar) -> printed bars 4, quarters count all five")
def _():
    half = N("C") + N("D")
    r = rewritten([FULL, FULL, half, half, FULL], '<measure number="4">', '<measure number="X1">')
    assert r["stored_measures"] == 5 and r["bars"] == 4 and r["excluded_from_count"] == ["3X1"]
    assert r["quarters"] == "16"


@case("X bar straight after a pickup numbered 0 (music21 reads number 1, suffix X) is still excluded")
def _():
    r = rewritten([N("C"), N("D") * 3, FULL], '<measure number="1">', '<measure number="X1">', implicit_first=True)
    assert r["stored_measures"] == 3 and len(r["excluded_from_count"]) == 1 and r["bars"] == 2


@case("multi-bar rest written as four stored measures -> four measures (music21 does not merge); nothing excluded")
def _():
    mr = '<attributes><measure-style><multiple-rest>4</multiple-rest></measure-style></attributes>'
    rest = R(dur=16, typ="whole")
    r = run([FULL, mr + rest, rest, rest, rest, FULL])
    assert r["stored_measures"] == 6 and r["bars"] == 6 and r["quarters"] == "24" and r["over_full_bars"] == 0


@case("a multi-bar rest stored as ONE whole-typed rest (music21 reads it as one bar) -> corrected to 16 quarters, over-full")
def _():
    r = run([FULL, R(dur=64, typ="whole"), FULL])
    assert r["stored_measures"] == 3 and r["over_full_bars"] == 1 and r["quarters"] == "24"
    assert r["corrected_bars"][0]["music21"] == "4" and r["corrected_bars"][0]["written"] == "16"


@case("two one-staff parts of different length -> per-staff counts differ, stored takes the longer")
def _():
    s, p = score([[FULL, FULL, FULL], [FULL, FULL]], parts=[("Right Hand", 1), ("Left Hand", 1)], first_attrs=A1)
    r = length(s, p)
    assert r["per_staff_measures"] == [3, 2] and r["stored_measures"] == 3


@case("GAP: whole-measure rest shorter than the bar (pickup, music21 stretches it to 4) -> corrected to the written 1 quarter")
def _():
    # staff 1: one quarter; staff 2: <rest measure="yes"/> of one quarter. music21 reads staff 2 as 4 quarters.
    two = attrs(staves=2)
    r = run([N("C") + back(1) + MR(4)] + [FULL + back(4) + BAR_LH] * 3, first_attrs=two, parts=[("Piano", 2)], implicit_first=True)
    assert r["corrected_bars"] and r["corrected_bars"][0]["music21"] == "4" and r["corrected_bars"][0]["written"] == "1"
    assert r["quarters"] == "13" and r["pickup"] == "confirmed" and r["bars_excluding_pickup"] == 3
    assert r["quarters_excluding_pickup"] == "12"


@case("GAP: the same short bar with no implicit flag - pickup confirmed only through the complement, which needs the correction")
def _():
    two = attrs(staves=2)
    r = run([N("C") + back(1) + MR(4)] + [FULL + back(4) + BAR_LH] * 2 + [N("D") * 3 + back(3) + MR(12)],
            first_attrs=two, parts=[("Piano", 2)])
    assert r["pickup"] == "confirmed" and r["quarters"] == "12" and len(r["corrected_bars"]) == 2


@case("GAP fool: a whole-measure rest that really is a full bar is not corrected")
def _():
    two = attrs(staves=2)
    r = run([FULL + back(4) + MR(16)] * 2, first_attrs=two, parts=[("Piano", 2)])
    assert r["corrected_bars"] == [] and r["quarters"] == "8" and r["pickup"] == "none"


@case("GAP guard: file durations 1/480 short of the bar (rounding) do not override music21")
def _():
    two = attrs(staves=2, div=480)
    bar = N("C", dur=480) + N("D", dur=480) + N("E", dur=480) + N("F", dur=479)
    r = run([bar + back(1919, div=1) + MR(1919)] * 2, first_attrs=two, parts=[("Piano", 2)])
    assert r["corrected_bars"] == [] and r["quarters"] == "8"


@case("a bar of 3/4 rests-only staff 2 beside a full bar: stretching to 3 is right and untouched")
def _():
    three = attrs(staves=2, time=("3", "4"))
    r = run([N("C") * 3 + back(3) + MR(12)] * 2, first_attrs=three, parts=[("Piano", 2)])
    assert r["corrected_bars"] == [] and r["quarters"] == "6"


def main():
    bad = 0
    for name, fn in CASES:
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
