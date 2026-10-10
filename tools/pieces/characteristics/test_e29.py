"""Hand-made MusicXML cases for e29_chord_symbols (CLAUDE.md technical rule 2): found, not found, built to fool it.
Usage: python tools/pieces/characteristics/test_e29.py"""
import json, os, sys, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_characteristics import N, R, back, score, xml, TMP, BAR_C, BAR_LH, D  # noqa: E402
from e29_chord_symbols import chord_symbols  # noqa: E402

BODY = BAR_C + back(4) + BAR_LH  # four quarters on staff 1, a whole note on staff 2


def H(root="C", kind="major", text=None, alter=None, bass=None, bassalter=None, degrees="", staff=None, offset=None,
      hidden=False, extra=""):
    t = f' text="{text}"' if text is not None else ""
    x = "<harmony" + (' print-object="no"' if hidden else "") + ">"
    if root is not None:
        x += f"<root><root-step>{root}</root-step>" + (f"<root-alter>{alter}</root-alter>" if alter is not None else "") + "</root>"
    x += f"<kind{t}>{kind}</kind>" if kind is not None else "<kind/>"
    if bass:
        x += f"<bass><bass-step>{bass}</bass-step>" + (f"<bass-alter>{bassalter}</bass-alter>" if bassalter is not None else "") + "</bass>"
    x += degrees + extra
    if offset is not None:
        x += f"<offset>{offset}</offset>"
    if staff:
        x += f"<staff>{staff}</staff>"
    return x + "</harmony>"


def deg(value, alter=0, typ="add"):
    return (f"<degree><degree-value>{value}</degree-value><degree-alter>{alter}</degree-alter>"
            f"<degree-type>{typ}</degree-type></degree>")


def run(measures, **kw):
    s, _ = score(measures, **kw)
    return chord_symbols(s)


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("found: C, F, G7 over three bars -> 3 symbols, 3 distinct, one per bar")
def _():
    r = run([H("C") + BODY, H("F") + BODY, H("G", "dominant") + BODY])
    assert r["n"] == 3 and r["n_chords"] == 3 and r["distinct"] == 3 and r["bars"] == 3, r
    assert [s["figure"] for s in r["symbols"]] == ["C", "F", "G7"]
    assert [(s["bar_index"], s["bar"], s["offset"]) for s in r["symbols"]] == [(0, "1", "0"), (1, "2", "0"), (2, "3", "0")]
    assert r["kinds"] == {"major": 2, "dominant-seventh": 1} and r["classes"] == {"major": 2, "dominant 7th": 1}
    assert r["per_bar"] == 1.0 and r["bars_with_symbols"] == 3 and r["changes"] == 2 and r["conflicts"] == []
    assert r["slash_bass"] == 0 and r["n_no_chord"] == 0
    assert r["duplicates_detail"] == {"other_staff_of_same_part": 3}  # music21's copy onto the second staff


@case("not found: no <harmony> -> 0, bars still counted")
def _():
    r = run([BODY, BODY, BODY])
    assert r["n"] == 0 and r["distinct"] == 0 and r["bars"] == 3 and r["symbols"] == [] and r["per_bar"] == 0
    assert r["duplicates_removed"] == 0 and r["bars_with_symbols"] == 0


@case("fool (row): 'Bb7' typed as <words> -> 0 symbols")
def _():
    typed = D("<words>Bb7</words>", staff=1)
    r = run([typed + BODY, D("<words>Cmaj7</words>") + BODY])
    assert r["n"] == 0 and r["function_labels"] == [] and r["text_labels"] == []


@case("fool: one staff-less symbol in a two-staff part is imported on both staves by music21 -> counted once")
def _():
    s, _ = score([H("C") + BODY])
    import music21 as m
    assert len(list(s.recurse().getElementsByClass(m.harmony.ChordSymbol))) == 2  # the music21 copy
    r = chord_symbols(s)
    assert r["n"] == 1 and r["duplicates_removed"] == 1 and r["symbols"][0]["staves"] == [0, 1]
    assert r["duplicates_detail"] == {"other_staff_of_same_part": 1}


@case("fool: the same symbol written twice on one staff at one position -> once, counted as same_staff_twice")
def _():
    r = run([H("C", staff=1) + H("C", staff=1) + BODY])
    assert r["n"] == 1 and r["duplicates_detail"] == {"same_staff_twice": 1}


@case("fool: the same symbol written on staff 1 and staff 2 at one position -> once; staff 2 only stays on staff 2")
def _():
    r = run([H("C", staff=1) + BAR_C + back(4) + H("C", staff=2) + BAR_LH])
    assert r["n"] == 1 and r["duplicates_removed"] == 1
    r = run([BAR_C + back(4) + H("C", staff=2) + BAR_LH])
    assert r["n"] == 1 and r["duplicates_removed"] == 0 and r["symbols"][0]["staves"] == [1]


@case("fool: the same symbol at two positions in one bar is NOT a duplicate")
def _():
    r = run([H("C") + N("C") + N("D") + H("C") + N("E") + N("F") + back(4) + BAR_LH])
    assert r["n"] == 2 and [s["offset"] for s in r["symbols"]] == ["0", "2"] and r["changes"] == 0
    assert r["distinct"] == 1 and r["max_in_bar"] == 2


@case("fool: two DIFFERENT symbols at one position are both kept and listed as a conflict")
def _():
    r = run([H("C") + H("A", "minor") + BODY])
    assert r["n"] == 2 and r["distinct"] == 2 and len(r["conflicts"]) == 1
    assert r["conflicts"][0]["symbols"] == ["C", "Am"] and r["conflicts"][0]["bar"] == "1"


@case("fool: the same symbol in two parts at one position -> once; a different kind in the other part stays two")
def _():
    r = run([[H("C") + BAR_C], [H("C") + BAR_C]], parts=[("Voice", 1), ("Piano", 1)])
    assert r["n"] == 1 and r["duplicates_removed"] == 1 and r["symbols"][0]["staves"] == [0, 1]
    assert r["duplicates_detail"] == {"other_part": 1}
    r = run([[H("C", "major") + BAR_C], [H("C", "minor") + BAR_C]], parts=[("Voice", 1), ("Piano", 1)])
    assert r["n"] == 2


@case("N.C.: kind none with N.C. text, no text, and no root are no-chord marks, counted apart")
def _():
    r = run([H("C", "none", text="N.C.") + BODY, H(None, "none") + BODY, H("C", "none", text="") + BODY, H("C") + BODY])
    assert r["n_no_chord"] == 3 and r["n_chords"] == 1 and r["n"] == 4 and r["classes"] == {"major": 1, "no chord": 3}
    assert r["function_labels"] == [] and r["text_labels"] == []


@case("fool: <function>V7</function> with kind none is a function label, not N.C.")
def _():
    fn = '<harmony print-frame="no"><function>V7</function><kind text="">none</kind></harmony>'
    r = run([fn + BODY, fn.replace("V7", "I") + BODY])
    assert r["n"] == 0 and r["n_no_chord"] == 0 and r["n_function_labels"] == 2, r
    assert [x["function"] for x in r["function_labels"]] == ["V7", "I"]


@case("fool: kind none holding free text ('Sol', '3', 'rit.', 'RE-7') is a text label, not N.C. and not a chord")
def _():
    r = run([H("C", "none", text="Sol") + BODY, H("C", "none", text="3") + BODY, H("C", "none", text="rit.") + BODY,
             H("C", "none", text="RE-7") + BODY])
    assert r["n"] == 0 and r["n_no_chord"] == 0 and r["n_text_labels"] == 4
    assert [x["text"] for x in r["text_labels"]] == ["Sol", "3", "rit.", "RE-7"]


@case("slash bass: C/E and G7/Bb counted, bass named with its alteration; C/C is not a slash chord")
def _():
    r = run([H("C", bass="E") + BODY, H("G", "dominant", bass="B", bassalter=-1) + BODY, H("C", bass="C") + BODY])
    assert r["slash_bass"] == 2, r["slash_bass"]
    assert [(s["root"], s["bass"], s["figure"]) for s in r["symbols"]] == [("C", "E", "C/E"), ("G", "Bb", "G7/Bb"), ("C", None, "C")]


@case("root alteration is kept: C#, Bb, F##; sharps and flats are different distinct symbols")
def _():
    r = run([H("C", alter=1) + BODY, H("B", "dominant", alter=-1) + BODY, H("F", alter=2) + BODY, H("C") + BODY])
    assert [s["root"] for s in r["symbols"]] == ["C#", "Bb", "F##", "C"] and r["distinct"] == 4
    assert r["symbols"][1]["figure"] == "Bb7"


@case("degrees (add / alter / subtract) are kept in the symbol and make it a different symbol")
def _():
    r = run([H("C", degrees=deg(9)) + BODY, H("D", "minor-seventh", degrees=deg(5, -1, "alter")) + BODY,
             H("C", "dominant", degrees=deg(3, 0, "subtract")) + BODY, H("C", degrees=deg(13) + deg(9, -1)) + BODY,
             H("C") + BODY])
    assert [s["degrees"] for s in r["symbols"]] == [["add 9"], ["alter b5"], ["subtract 3"], ["add 13", "add b9"], []]
    assert r["with_degrees"] == 4 and r["distinct"] == 5
    assert r["degrees"] == {"add 9": 1, "alter b5": 1, "subtract 3": 1, "add 13": 1, "add b9": 1}


@case("kinds: written kind kept as its own string; unknown kinds and 'other' go to class other; music21 aliases are named")
def _():
    r = run([H("C", "minor") + H("D", "major-seventh") + H("E", "dominant") + H("F", "min7") + BODY,
             H("G", "dominant-ninth") + H("A", "half-diminished") + H("B", "other") + H("C", "power") + BODY])
    assert r["kinds"] == {"minor": 1, "major-seventh": 1, "dominant-seventh": 1, "min7": 1, "dominant-ninth": 1,
                          "half-diminished-seventh": 1, "other": 1, "power": 1}, r["kinds"]
    assert r["classes"] == {"minor": 1, "dominant 7th": 1, "other": 6}


@case("kind text (the printed abbreviation) is kept")
def _():
    r = run([H("C", "major-seventh", text="maj7") + H("D", "minor", text="m") + BODY])
    assert [s["text"] for s in r["symbols"]] == ["maj7", "m"]


@case("bare root (empty <kind/>): kind '', counted as major, figure is the root only (not music21's 'Dbpedal')")
def _():
    r = run([H("D", None, alter=-1) + BODY])
    assert r["n"] == 1 and r["bare_root"] == 1 and r["classes"] == {"major": 1}
    assert r["symbols"][0]["figure"] == "Db" and r["symbols"][0]["kind"] == ""


@case("hidden symbol (print-object=no) is not counted; reported in hidden_not_counted")
def _():
    r = run([H("C", hidden=True) + BODY, H("F") + BODY])
    assert r["n"] == 1 and r["hidden_not_counted"] == 1 and r["symbols"][0]["figure"] == "F"
    r = run([H("C", staff=1, hidden=True) + BAR_C + back(4) + H("C", staff=2) + BAR_LH])
    assert r["n"] == 1  # printed on one staff: counted


@case("guitar frame: counted as a chord symbol and flagged")
def _():
    frame = "<frame><frame-strings>6</frame-strings><frame-frets>4</frame-frets></frame>"
    r = run([H("G", "dominant", extra=frame) + BODY, H("C") + BODY])
    assert r["n"] == 2 and r["frames"] == 1 and r["symbols"][0]["frame"] is True


@case("fool: <numeral> (MusicXML 4) without a root: not a chord, reported as unresolved, no crash")
def _():
    nm = "<harmony><numeral><numeral-root>5</numeral-root></numeral><kind>major</kind></harmony>"
    r = run([nm + BODY, H("C") + BODY])
    assert r["n"] == 1 and r["n_unresolved"] == 1 and r["n_function_labels"] == 0


@case("bars: printed number with suffix, index is the position; mid-bar offset and <offset> in quarters")
def _():
    x = xml([BODY, H("C") + N("C") + N("D") + H("G", offset=2) + N("E") + N("F") + back(4) + BAR_LH]).replace(
        '<measure number="2">', '<measure number="1a">')
    path = os.path.join(TMP, "suffix29.musicxml")
    open(path, "w", encoding="utf-8").write(x)
    import music21 as m
    r = chord_symbols(m.converter.parse(path, forceSource=True))
    assert [(s["bar_index"], s["bar"], s["offset"]) for s in r["symbols"]] == [(1, "1a", "0"), (1, "1a", "5/2")], r["symbols"]
    assert r["bar_list"] == [{"bar_index": 1, "bar": "1a", "n": 2}] and r["bars"] == 2 and r["per_bar"] == 1.0
    r = run([N("C") + N("D") + H("G") + N("E") + N("F") + back(4) + BAR_LH])
    assert r["symbols"][0]["offset"] == "2"


@case("changes: a repeated symbol is not a change")
def _():
    r = run([H("C") + BODY, H("C") + BODY, H("G") + BODY, H("G") + BODY])
    assert r["n"] == 4 and r["changes"] == 1 and r["distinct"] == 2


@case("no leak into notes: symbols do not change any note count or the shared printed-note helper")
def _():
    import music21 as m
    from _notes import printed
    from e01_layout import layout
    plain, _ = score([BODY, BODY])
    with_h, _ = score([H("C") + H(None, "none") + BODY, H("G", "dominant", bass="B") + BODY])
    assert len(list(printed(with_h))) == len(list(printed(plain))) == 10
    assert layout(with_h)["staff_detail"] == layout(plain)["staff_detail"]
    # the class is there in recurse().notes, which is why the shared helpers filter it
    assert any(isinstance(n, m.harmony.ChordSymbol) for n in with_h.recurse().notes)


@case("result is JSON-serialisable")
def _():
    r = run([H("C", bass="E") + BODY, H(None, "none") + BODY,
             '<harmony><function>V7</function><kind text="">none</kind></harmony>' + BODY])
    json.dumps(r)


# Known music21 behaviour, measured on our 842 files (see the top of e29_chord_symbols.py). Pinned so a change shows.
@case("known behaviour (pinned): music21 gives kind none the default text 'N.C.' even when the text was empty")
def _():
    s, _ = score([H("C", "none", text="") + BODY])
    import music21 as m
    cs = next(s.recurse().getElementsByClass(m.harmony.NoChord))
    assert cs.chordKindStr == "N.C."


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
