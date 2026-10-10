"""Hand-made MusicXML cases for e27_fingering (CLAUDE.md technical rule 2): found, not found, built to fool it, one per
pitfall. Usage: python tools/pieces/characteristics/test_e27.py"""
import os, sys, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_characteristics import N, R, D, back, score, BAR_C, BAR_LH  # noqa: E402
from e27_fingering import fingering  # noqa: E402


def F(*items):
    """<technical> holding fingerings; an item is text or (text, attributes)."""
    out = ""
    for it in items:
        t, a = it if isinstance(it, tuple) else (it, "")
        out += f"<fingering{a}>{t}</fingering>" if t is not None else f"<fingering{a}/>"
    return "<technical>" + out + "</technical>"


def hide(note):
    return note.replace("<note>", '<note print-object="no">', 1)


def run(measures, **kw):
    s, _ = score(measures, **kw)
    return fingering(s)


def lyric(text):
    return f'<lyric number="1"><syllabic>single</syllabic><text>{text}</text></lyric>'


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("found: five fingered notes of eight -> 5 fingered attacks, share 5/8, digits, bars")
def _():
    bar1 = N("C", notations=F(1)) + N("D", notations=F(2)) + N("E", notations=F(3)) + N("F", notations=F(4))
    bar2 = N("G", notations=F(5)) + N("A") * 2 + N("B")
    r = run([bar1 + back(4) + BAR_LH, bar2 + back(4) + BAR_LH])
    s1 = r[1]
    assert s1["fingered_attacks"] == 5 and s1["attacks"] == 8 and s1["fingerings"] == 5, s1
    assert s1["share_fingered"] == round(5 / 8, 4) and s1["digits"] == {"1": 1, "2": 1, "3": 1, "4": 1, "5": 1}
    assert s1["by_form"] == {"single": 5} and s1["bars"] == [[0, "1"], [1, "2"]]
    assert r[2]["fingerings"] == 0 and r[2]["attacks"] == 2


@case("not found: no fingering -> 0, share 0")
def _():
    r = run([BAR_C + back(4) + BAR_LH])
    s1 = r[1]
    assert s1["fingerings"] == 0 and s1["fingered_attacks"] == 0 and s1["share_fingered"] == 0 and s1["bars"] == []
    assert s1["possible_text"] == {"words": {}, "lyrics": {}}


@case("fool (row): digits typed as <words> and as lyrics -> 0 fingerings, listed as possible text")
def _():
    bar = (D("<words>1 2 3</words>", staff=1) + N("C") + D("<words>5</words>", staff=1) + N("D") +
           N("E") + N("F") + back(4) + BAR_LH)
    r = run([bar])
    assert r[1]["fingerings"] == 0 and r[1]["possible_text"]["words"] == {"1 2 3": 1, "5": 1}, r[1]
    note = N("C").replace("<staff>1</staff>", "<staff>1</staff>" + lyric("3")) + N("D") * 3
    r = run([note + back(4) + BAR_LH])
    assert r[1]["fingerings"] == 0 and r[1]["possible_text"]["lyrics"] == {"3": 1}, r[1]
    # not digit-only text: a verse number and a tempo word with a digit are not listed
    note = N("C").replace("<staff>1</staff>", "<staff>1</staff>" + lyric("1.")) + N("D") * 3
    bar = D("<words>Allegro 4</words>", staff=1) + note + back(4) + BAR_LH
    r = run([bar])
    assert r[1]["possible_text"] == {"words": {}, "lyrics": {}}


@case("fool: numeric words that are not fingerings (tempo 100, 165, a bar-like 24) are not listed; '1-2' and '3 4' are")
def _():
    bar = (D("<words>100</words>", staff=1) + D("<words>165</words>", staff=1) + D("<words>24</words>", staff=1) +
           D("<words>1-2</words>", staff=1) + D("<words>3 4</words>", staff=1) + BAR_C + back(4) + BAR_LH)
    r = run([bar])
    assert r[1]["possible_text"]["words"] == {"1-2": 1, "3 4": 1}, r[1]["possible_text"]


@case("fool: the same digit typed on both staves at one moment (both hands) counts on each staff")
def _():
    bar = D("<words>1</words>", staff=1) + D("<words>1</words>", staff=2) + BAR_C + back(4) + BAR_LH
    r = run([bar])
    assert r[1]["possible_text"]["words"] == {"1": 1} and r[2]["possible_text"]["words"] == {"1": 1}


@case("chord: a fingering on every member -> 1 fingered attack, 3 fingerings (not 1, not 3 attacks)")
def _():
    bar = (N("C", notations=F(5)) + N("E", chord=True, notations=F(3)) + N("G", chord=True, notations=F(1)) +
           N("D") * 3 + back(4) + BAR_LH)
    s1 = run([bar])[1]
    assert s1["attacks"] == 4 and s1["fingered_attacks"] == 1 and s1["fingerings"] == 3, s1
    assert s1["chords_fingered"] == 1 and s1["chord_fingerings"] == 3 and s1["digits"] == {"1": 1, "3": 1, "5": 1}


@case("chord: a fingering on one member only -> 1 fingered attack, 1 fingering (member not reported)")
def _():
    bar = N("C") + N("E", chord=True, notations=F(3)) + N("G", chord=True) + N("D") * 3 + back(4) + BAR_LH
    s1 = run([bar])[1]
    assert s1["fingered_attacks"] == 1 and s1["fingerings"] == 1 and s1["chord_fingerings"] == 1


@case("stacked: one label with two fingers ('3' newline '5', '1 2', '4,') -> 1 mark each, form stacked, digits read apart")
def _():
    bar = N("C", notations=F("3\n5")) + N("D", notations=F("1 2")) + N("E", notations=F("4,")) + N("F") + back(4) + BAR_LH
    s1 = run([bar])[1]
    assert s1["fingerings"] == 3 and s1["by_form"] == {"stacked": 3}, s1
    assert s1["digits"] == {"1": 1, "2": 1, "3": 1, "4": 1, "5": 1}, s1


@case("substitution: attribute pair (3 then 1) and text '3-1' -> counted as substitutions; alternate apart")
def _():
    sub = ' substitution="yes"'
    bar = (N("C", notations=F(("3", sub), ("1", sub))) + N("D", notations=F("3-1")) +
           N("E", notations=F("2", ("3", ' alternate="yes"'))) + N("F") + back(4) + BAR_LH)
    s1 = run([bar])[1]
    assert s1["substitutions"] == 3 and s1["alternates"] == 1 and s1["fingerings"] == 5, s1
    assert s1["by_form"] == {"single": 4, "pair": 1} and s1["notes_with_several"] == 2 and s1["fingered_attacks"] == 3


@case("odd values: '0' is not a finger 1-5; '6', adjacent digits '34', a bad byte, 'p' and an empty element are listed")
def _():
    bar = (N("C", notations=F("0")) + N("D", notations=F("6")) + N("E", notations=F("34", "p")) + N("F", notations=F(None)) +
           back(4) + N("G", notations=F("¨2")) + R(dur=12, typ="half", dots=1) + BAR_LH)
    s1 = run([bar])[1]
    assert s1["by_form"] == {"zero": 1, "other": 4, "empty": 1}, s1
    assert s1["odd_text"] == {"0": 1, "6": 1, "34": 1, "p": 1, "": 1, "¨2": 1} and s1["digits"] == {}


@case("a fingering on a rest is ignored; on a hidden note is not counted; on a grace note is counted apart")
def _():
    bar = (N("C", rest=True, notations=F(1)) + hide(N("D", notations=F(2))) + N("E", grace=True, notations=F(3)) +
           N("F", notations=F(4)) + N("G") + back(4) + BAR_LH)
    s1 = run([bar])[1]
    assert s1["fingerings"] == 1 and s1["grace_fingerings"] == 1 and s1["attacks"] == 2 and s1["digits"] == {"4": 1}, s1


@case("small printed (cue-size) notes count, like every row (_notes.py)")
def _():
    s1 = run([N("C", cue=True, notations=F(1)) + N("D") * 3 + back(4) + BAR_LH])[1]
    assert s1["fingerings"] == 1 and s1["attacks"] == 4


@case("not a fingering: other technical marks (up-bow, a digit in other-technical) are not counted")
def _():
    t = "<technical><up-bow/><other-technical>3</other-technical><heel/></technical>"
    s1 = run([N("C", notations=t) + N("D") * 3 + back(4) + BAR_LH])[1]
    assert s1["fingerings"] == 0 and s1["fingered_attacks"] == 0


@case("fool: <pluck> (a plucking finger, music21 subclass of Fingering) and <string>/<fret> are not fingerings")
def _():
    t = "<technical><pluck>3</pluck></technical>"
    bar = (N("C", notations=t) + N("E", chord=True, notations="<technical><pluck>p</pluck></technical>") +
           N("D", notations="<technical><string>2</string><fret>3</fret></technical>") + N("E") * 2 + back(4) + BAR_LH)
    s1 = run([bar])[1]
    assert s1["fingerings"] == 0 and s1["fingered_attacks"] == 0 and s1["attacks"] == 4, s1


@case("two voices on one staff and tied continuation: each written note its own attack; tied reported")
def _():
    bar = (N("C", 5, dur=16, typ="whole", voice=1, notations=F(5)) + back(4) + N("C", 4, dur=8, typ="half", voice=2,
           tie="start", notations=F(1)) + N("C", 4, dur=8, typ="half", voice=2, tie="stop", notations=F(1)) + back(4) + BAR_LH)
    s1 = run([bar])[1]
    assert s1["fingered_attacks"] == 3 and s1["on_tied_continuation"] == 1, s1


@case("per staff: a fingering on staff 2 is counted on staff 2")
def _():
    r = run([N("C", notations=F(1)) + N("D") * 3 + back(4) + N("C", 3, dur=16, typ="whole", staff=2, notations=F(5))])
    assert r[1]["digits"] == {"1": 1} and r[2]["digits"] == {"5": 1}


# Known music21 behaviour, measured on our 842 files (see the top of e27_fingering.py) and NOT patched. These cases pin
# today's behaviour so that a music21 change shows up here; they are not claims that the behaviour is right.
@case("known gap (pinned): a fingering on a hidden member of a printed chord is attributed to the chord (0 in the corpus)")
def _():
    bar = N("C", notations=F(1)) + hide(N("E", chord=True, notations=F(3))) + N("D") * 3 + back(4) + BAR_LH
    s1 = run([bar])[1]
    assert s1["fingerings"] == 2


@case("known gap (pinned): words with no <staff> in a two-staff part arrive on both staves and count twice (1 word in 1 file)")
def _():
    bar = D("<words>2</words>") + BAR_C + back(4) + BAR_LH
    r = run([bar])
    assert r[1]["possible_text"]["words"] == {"2": 1} and r[2]["possible_text"]["words"] == {"2": 1}


@case("known gap (pinned): print-object=no on the fingering element itself is ignored")
def _():
    s1 = run([N("C", notations=F(("1", ' print-object="no"'))) + N("D") * 3 + back(4) + BAR_LH])[1]
    assert s1["fingerings"] == 1


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
