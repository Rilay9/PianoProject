"""Hand-made MusicXML cases for e31_repeats (CLAUDE.md technical rule 2): found, not found, built to fool it, and one per
gap patched. Usage: python tools/pieces/characteristics/test_e31.py"""
import os, sys, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_characteristics import N, D, back, fwd, score, BAR_C, BAR_LH  # noqa: E402
from e31_repeats import repeats_and_jumps, word_kind  # noqa: E402

B = BAR_C + back(4) + BAR_LH  # one bar: four quarters on staff 1, a whole note on staff 2


def BL(inner, loc="right"):
    return f'<barline location="{loc}">{inner}</barline>'


FWD = BL('<bar-style>heavy-light</bar-style><repeat direction="forward"/>', "left")
BWD = BL('<bar-style>light-heavy</bar-style><repeat direction="backward"/>')


def ES(n, typ="start", loc="left"):
    return BL(f'<ending number="{n}" type="{typ}"/>', loc)


def EE(n, typ="stop", rep=False):
    return BL(f'<ending number="{n}" type="{typ}"/>' + ('<bar-style>light-heavy</bar-style><repeat direction="backward"/>' if rep else ""))


def W(text, staff=1, sound=""):
    return D(f"<words>{text}</words>", staff=staff, sound=sound)


def run(measures, **kw):
    s, p = score(measures, **kw)
    return repeats_and_jumps(s, p)


def marks(r):
    return [(k["kind"], k["target"], k["bar"], tuple(k["sources"])) for k in r["marks"]]


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("found (row): repeat from bar 1, backward repeat at bar 3 with endings 1 and 2 -> all listed with bars")
def _():
    r = run([FWD + B, B, ES(1) + B + EE(1, rep=True), ES(2) + B + EE(2, "discontinue")])
    assert [(x["bar"], x["side"], x["direction"], x["times"]) for x in r["repeats"]] == [("1", "left", "forward", None), ("3", "right", "backward", None)]
    assert [(e["numbers"], e["first_bar"], e["last_bar"], e["end_type"], e["closed"]) for e in r["endings"]] == \
        [([1], "3", "3", "stop", True), ([2], "4", "4", "discontinue", True)]
    assert r["has_repeats"] and r["has_endings"] and not r["has_jump_marks"] and r["forward"] == 1 and r["backward"] == 1
    assert r["flags"]["forward_repeats_not_closed"] == [] and r["flags"]["endings_not_closed"] == 0


@case("not found (row): no signs -> empty lists, nothing present")
def _():
    r = run([B, B])
    assert r["repeats"] == [] and r["endings"] == [] and r["marks"] == [] and r["mark_counts"] == {}
    assert not (r["has_repeats"] or r["has_endings"] or r["has_jump_marks"])


@case("fool (row): a double barline and a final barline are not repeats")
def _():
    r = run([B + BL("<bar-style>light-light</bar-style>"), B + BL("<bar-style>light-heavy</bar-style>")])
    assert r["repeats"] == [] and not r["has_repeats"]


@case("fool: words that contain jump words but are not jumps are not marks (tempo text, prose, a bare 'al fine', Finale)")
def _():
    texts = ["poco a poco accelerando al fine", "sempre stretto sin al fine", "play repeat signs after D.C.", "al fine", "Finale",
             "Coda (optional)", "Ped a chaque mesure al fine.", "To my darling daughter Stephanie.", "Allegro con fine", "Fine print"]
    r = run([W(t) + B for t in texts])
    assert r["marks"] == [], marks(r)


@case("fool: a title or credit reading Coda or Fine is not a direction -> no mark")
def _():
    s, p = score([B, B])
    with open(p, encoding="utf-8") as fh:
        txt = fh.read().replace("<part-list>", "<credit page=\"1\"><credit-words>Fine</credit-words></credit>"
                                "<movement-title>Coda</movement-title><part-list>", 1)
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(txt)
    assert repeats_and_jumps(s, p)["marks"] == []


@case("words are found as written: D.C. / D.S. with targets, Fine, To Coda, Coda, Segno, each told apart")
def _():
    r = run([W("D.C. al Fine") + B, W("D.S. al Coda") + B, W("Fine") + B, W("To Coda") + B, W("Coda") + B, W("Segno") + B,
             W("D.C.") + B, W("Dal Segno al Fine") + B])
    assert marks(r) == [("da_capo", "fine", "1", ("words",)), ("dal_segno", "coda", "2", ("words",)), ("fine", None, "3", ("words",)),
                        ("to_coda", None, "4", ("words",)), ("coda", None, "5", ("words",)), ("segno", None, "6", ("words",)),
                        ("da_capo", None, "7", ("words",)), ("dal_segno", "fine", "8", ("words",))]
    assert r["flags"]["marks_from_words_only"] == 8 and r["mark_counts"]["da_capo"] == 2


@case("gap (music21 matches whole text only): spacing, markup, 'sino al Fine', 'senza repetizione', a section name before da capo")
def _():
    r = run([W("D. C. al Fine") + B, W("<i>D.C. al Fine</i>") + B, W("D.C. sino al Fine") + B, W("D.C. senza repetizione al Fine") + B,
             W("Menuet I da capo") + B, W("Menuetto da Capo al Fine.") + B, W("da capo Trio") + B])
    assert [k["kind"] for k in r["marks"]] == ["da_capo"] * 7, marks(r)
    assert [k["target"] for k in r["marks"]] == ["fine", "fine", "fine", "fine", None, "fine", None]
    assert word_kind("Dal Segno") == ("dal_segno", None) and word_kind("Lords") is None and word_kind("Odd cs") is None


@case("gap (music21 reads no <sound> attribute): dacapo, dalsegno, fine, tocoda, coda, segno found with no words, and merged with words")
def _():
    snd = lambda a: f"<sound {a}/>"  # noqa: E731
    bare = lambda a: '<direction><direction-type><words/></direction-type>' + snd(a) + "</direction>"  # noqa: E731
    r = run([bare('dacapo="yes"') + B, bare('dalsegno="s"') + B, bare('fine="yes"') + B, bare('tocoda="c"') + B, bare('coda="c"') + B,
             bare('segno="s"') + B, W("Fine", sound=snd('fine="yes"')) + B, W("D.C. al Coda", sound=snd('dacapo="yes"')) + B,
             bare('dacapo="no"') + B])
    assert marks(r) == [("da_capo", None, "1", ("sound",)), ("dal_segno", None, "2", ("sound",)), ("fine", None, "3", ("sound",)),
                        ("to_coda", None, "4", ("sound",)), ("coda", None, "5", ("sound",)), ("segno", None, "6", ("sound",)),
                        ("fine", None, "7", ("sound", "words")), ("da_capo", "coda", "8", ("sound", "words"))]
    assert r["flags"]["marks_from_words_only"] == 0


@case("segno and coda symbols in a direction -> found; same symbol on both staves and on both parts is ONE mark")
def _():
    sym = lambda t, st: D(f"<{t}/>", staff=st)  # noqa: E731
    r = run([sym("segno", 1) + sym("segno", 2) + B, sym("coda", None) + B])
    assert marks(r) == [("segno", None, "1", ("symbol",)), ("coda", None, "2", ("symbol",))]
    r = run([[sym("segno", 1) + N("C"), B + BWD], [sym("segno", 1) + N("C", 3), B + BWD]], parts=[("Piano", 1), ("Piano 2", 1)])
    assert marks(r) == [("segno", None, "1", ("symbol",))] and len(r["repeats"]) == 1, (marks(r), r["repeats"])


@case("gap (music21 drops segno/coda written on a barline): found with side and source barline")
def _():
    r = run([BL("<segno/>", "left") + B, B + BL("<coda/>")])
    assert [(k["kind"], k["bar"], k["side"], k["sources"]) for k in r["marks"]] == [("segno", "1", "left", ["barline"]), ("coda", "2", "right", ["barline"])]


@case("gap (music21 wrong): an ending with no stop does not swallow the next one; it is reported not closed")
def _():
    # ending 1 starts bar 2 and is never stopped; ending 2 starts bar 3 and stops. music21 makes ONE bracket numbered 2
    # from bar 2 to bar 3 and loses ending 1.
    r = run([FWD + B, ES(1) + B + BWD, ES(2) + B + EE(2, "discontinue"), B])
    assert [(e["numbers"], e["first_bar"], e["closed"], e["last_bar"]) for e in r["endings"]] == [([1], "2", False, None), ([2], "3", True, "3")]
    assert r["flags"]["endings_not_closed"] == 1
    # and a lone unclosed ending at the end of the piece
    r = run([B, ES(1) + B])
    assert [(e["numbers"], e["closed"]) for e in r["endings"]] == [([1], False)]


@case("gap (music21 invents): stop with no start -> orphan, no ending; no number -> numbers [] (music21 says 1)")
def _():
    r = run([B + EE(1), B])
    assert r["endings"] == [] and len(r["flags"]["orphan_ending_stops"]) == 1 and r["flags"]["orphan_ending_stops"][0]["bar"] == "1"
    r = run([BL('<ending type="start"/>', "left") + B + BL('<ending type="stop"/>'), B])
    assert r["endings"][0]["numbers"] == [] and r["flags"]["endings_without_number"] == 1


@case("ending numbers: '1, 2' is both, '1.' is 1, an ending over three bars has its first and last bar")
def _():
    r = run([ES("1, 2") + B + EE("1, 2"), ES("1.") + B, B, B + EE("1.")])
    assert [(e["numbers"], e["first_bar"], e["last_bar"]) for e in r["endings"]] == [([1, 2], "1", "1"), ([1], "2", "4")]
    assert r["endings"][0]["text"] == "1, 2"


@case("times attribute kept; forward repeat never closed is flagged; backward with no forward is not")
def _():
    r = run([FWD + B, B + BL('<bar-style>light-heavy</bar-style><repeat direction="backward" times="3"/>'), FWD + B, B])
    assert [x["times"] for x in r["repeats"]] == [None, 3, None]
    assert [x["bar"] for x in r["flags"]["forward_repeats_not_closed"]] == ["3"]
    r = run([B + BWD, B])
    assert r["backward"] == 1 and r["flags"]["forward_repeats_not_closed"] == []


@case("repeat written on a later part only is not read (first part only, as E19); the same on both parts is counted once")
def _():
    r = run([[B, B], [B + BWD, B]], parts=[("A", 1), ("B", 1)])
    assert r["repeats"] == []
    r = run([[B + BWD, B], [B + BWD, B]], parts=[("A", 1), ("B", 1)])
    assert len(r["repeats"]) == 1 and r["repeats"][0]["bar"] == "1"


@case("printed bar labels are the file's own: a pickup bar 0 and a non-numeric number (MuseScore's X1) as written")
def _():
    r = run([[N("C"), B + BWD, B]], implicit_first=True)
    assert r["repeats"][0]["bar"] == "1" and r["repeats"][0]["bar_index"] == 1
    s, p = score([B, B + BWD])
    with open(p, encoding="utf-8") as fh:
        txt = fh.read().replace('<measure number="2">', '<measure number="X1">')
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(txt)
    import music21 as m
    r = repeats_and_jumps(m.converter.parse(p, forceSource=True), p)
    assert r["repeats"][0]["bar"] == "X1" and r["repeats"][0]["bar_index"] == 1


@case("a hidden direction (print-object=no) is a mark with printed False; a printed one wins when both are written")
def _():
    hid = D("<words>D.C. al Fine</words>", staff=1).replace("<direction>", '<direction print-object="no">')
    r = run([hid + B, hid + W("D.C. al Fine") + B])
    assert [(k["bar"], k["printed"]) for k in r["marks"]] == [("1", False), ("2", True)]


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
