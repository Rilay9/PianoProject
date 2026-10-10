"""Hand-made MusicXML cases for e22_articulations (CLAUDE.md technical rule 2): found, not found, built to fool it.
Usage: python tools/pieces/characteristics/test_e22.py"""
import os, sys, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_characteristics import N, R, back, score, BAR_C, BAR_LH  # noqa: E402
from e22_articulations import articulations  # noqa: E402


def A(*tags):
    return "<articulations>" + "".join(tags) + "</articulations>"


def hide(note):
    return note.replace("<note>", '<note print-object="no">', 1)


def run(measures, **kw):
    s, _ = score(measures, **kw)
    return articulations(s)


STACC = A("<staccato/>")
CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("found: four staccato quarters -> 4 staccato, bar 1")
def _():
    r = run([N("C", notations=STACC) * 1 + N("D", notations=STACC) + N("E", notations=STACC) + N("F", notations=STACC)
             + back(4) + BAR_LH])
    s1 = r[1]
    assert s1["by_kind"] == {"staccato": 4} and s1["marked_attacks"] == 4 and s1["attacks"] == 4 and s1["bars"] == ["1"]
    assert r[2]["by_kind"] == {} and r[2]["attacks"] == 1


@case("not found: no articulations -> 0")
def _():
    r = run([BAR_C + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {} and r[1]["marked_attacks"] == 0 and r[1]["attacks"] == 4 and r[1]["bars"] == []
    assert r[1]["share_marked"] == 0


@case("fool (row): a 3-note chord with one staccato -> 1 attack; staccato on all three -> still 1")
def _():
    one = N("C", notations=STACC) + N("E", chord=True) + N("G", chord=True) + N("D") * 3
    allm = (N("C", notations=STACC) + N("E", chord=True, notations=STACC) + N("G", chord=True, notations=STACC)
            + N("D") * 3)
    mid = N("C") + N("E", chord=True, notations=STACC) + N("G", chord=True) + N("D") * 3
    for bar in (one, allm, mid):
        r = run([bar + back(4) + BAR_LH])
        assert r[1]["by_kind"] == {"staccato": 1} and r[1]["attacks"] == 4, r[1]


@case("fool: chord with staccato on one member and accent on another keeps both kinds, one attack each")
def _():
    r = run([N("C", notations=STACC) + N("E", chord=True, notations=A("<accent/>")) + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {"staccato": 1, "accent": 1} and r[1]["marked_attacks"] == 1
    assert r[1]["combos"] == {"accent+staccato": 1}


@case("fool: class hierarchy - staccatissimo, spiccato, strong-accent are their own kinds, not staccato/accent")
def _():
    r = run([N("C", notations=A("<staccatissimo/>")) + N("D", notations=A("<spiccato/>")) +
             N("E", notations=A("<strong-accent/>")) + N("F", notations=A("<accent/>")) + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {"staccatissimo": 1, "spiccato": 1, "strong-accent": 1, "accent": 1}, r[1]["by_kind"]
    assert "staccato" not in r[1]["by_kind"]


@case("fool: compound tenuto+staccato (portato) is kept as its own combination")
def _():
    r = run([N("C", notations=A("<tenuto/>", "<staccato/>")) + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {"staccato": 1, "tenuto": 1} and r[1]["combos"] == {"staccato+tenuto": 1}
    assert r[1]["marked_attacks"] == 1


@case("fool: technical marks (fingering, up-bow) are not articulations")
def _():
    r = run([N("C", notations="<technical><fingering>1</fingering><up-bow/></technical>") + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {} and r[1]["marked_attacks"] == 0


@case("fool: the same tag written twice on one note (export artefact) is one mark; duplicates are reported")
def _():
    r = run([N("C", notations=A("<staccato/>", "<staccato/>")) + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {"staccato": 1} and r[1]["duplicate_marks"] == 1


@case("fool: marks inside two separate <articulations> elements are both read")
def _():
    r = run([N("C", notations=STACC + "</notations><notations>" + A("<accent/>")) + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {"staccato": 1, "accent": 1}


@case("jazz and other tags keep their own names; other-articulation keeps its words")
def _():
    r = run([N("C", notations=A("<scoop/>")) + N("D", notations=A("<doit/>")) + N("E", notations=A("<falloff/>")) +
             N("F", notations=A("<other-articulation>sfz-ish</other-articulation>")) + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {"scoop": 1, "doit": 1, "falloff": 1, "other-articulation": 1}
    assert r[1]["other_text"] == {"sfz-ish": 1}
    r = run([N("C", notations=A("<breath-mark/>")) + N("D", notations=A("<caesura/>")) + N("E", notations=A("<tenuto/>"))
             + N("F", notations=A("<detached-legato/>")) + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {"breath-mark": 1, "caesura": 1, "tenuto": 1, "detached-legato": 1}


@case("staves: a mark on staff 2 belongs to staff 2")
def _():
    r = run([BAR_C + back(4) + N("C", 3, dur=16, typ="whole", staff=2, notations=A("<accent/>"))])
    assert r[1]["by_kind"] == {} and r[2]["by_kind"] == {"accent": 1}


@case("bars: printed number, each bar once, only bars with marks")
def _():
    r = run([BAR_C + back(4) + BAR_LH, N("C", notations=STACC) + N("D", notations=STACC) + N("E") * 2 + back(4) + BAR_LH,
             BAR_C + back(4) + BAR_LH, N("C", notations=A("<accent/>")) + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["bars"] == ["2", "4"]


@case("hidden notes do not count (print-object=no), single and whole hidden chord")
def _():
    r = run([hide(N("C", notations=STACC)) + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {} and r[1]["attacks"] == 3
    r = run([hide(N("C", notations=STACC)) + hide(N("E", chord=True)) + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {} and r[1]["attacks"] == 3


@case("small printed (cue-size) notes count, like every row (_notes.py)")
def _():
    r = run([N("C", cue=True, notations=STACC) + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {"staccato": 1} and r[1]["attacks"] == 4


@case("grace notes are counted apart and are not attacks")
def _():
    r = run([N("D", grace=True, notations=A("<accent/>")) + N("C", notations=STACC) + N("E") * 3 + back(4) + BAR_LH])
    assert r[1]["grace_by_kind"] == {"accent": 1} and r[1]["by_kind"] == {"staccato": 1} and r[1]["attacks"] == 4


@case("rests are not notes: a mark on a rest is ignored")
def _():
    r = run([N("C", rest=True, notations=STACC) + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {} and r[1]["attacks"] == 3


@case("tied continuation: mark counted (it is printed) and reported as on_tied_continuation")
def _():
    r = run([N("C", tie="start") + N("C", tie="stop", notations=STACC) + N("D") * 2 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {"staccato": 1} and r[1]["on_tied_continuation"] == 1


@case("two voices on one staff: each written note is its own attack (not merged by time position)")
def _():
    r = run([N("C", 5, dur=16, typ="whole", voice=1, notations=STACC) + back(4) + N("C", 4, dur=16, typ="whole", voice=2,
             notations=STACC) + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {"staccato": 2} and r[1]["attacks"] == 2


# Known music21 gaps, measured on our 842 files (see the top of e22_articulations.py) and NOT patched. These cases pin
# today's behaviour so that a music21 change shows up here; they are not claims that the behaviour is right.
@case("known gap (pinned): <soft-accent/> is not read by music21")
def _():
    r = run([N("C", notations=A("<soft-accent/>")) + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {}


@case("known gap (pinned): a mark on a hidden member of a printed chord is attributed to the chord")
def _():
    r = run([N("C") + hide(N("E", chord=True, notations=STACC)) + N("D") * 3 + back(4) + BAR_LH])
    assert r[1]["by_kind"] == {"staccato": 1}


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
