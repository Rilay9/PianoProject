"""Hand-made MusicXML cases for e26_tempo_change (CLAUDE.md technical rule 2): found, not found, built to fool it, one per
patched gap (the dropped <swing> element). Usage: python tools/pieces/characteristics/test_e26.py"""
import os, sys, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_characteristics import N, R, D, back, score, attrs, BAR_C, BAR_LH  # noqa: E402
from e26_tempo_change import tempo_change  # noqa: E402


def W(t, extra=""):
    return f"<words{extra}>{t}</words>"


def run(measures, **kw):
    s, p = score(measures, **kw)
    return tempo_change(s, p)


def one(text, **kw):
    """One bar holding one word direction; returns the result."""
    return run([D(W(text), **kw) + BAR_C])


def words(r):
    return [(c["bar_index"], c["bar"], [x["word"] for x in c["matches"]]) for c in r["changes"]]


def kinds(text):
    r = one(text)
    return [x["word"] for c in r["changes"] for x in c["matches"]]


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("found: 'rit.' at bar 15 and 'a tempo' at bar 17 -> 2 entries with bar index and printed number")
def _():
    ms = [BAR_C] * 17
    ms[14] = D(W("rit.")) + BAR_C
    ms[16] = D(W("a tempo")) + BAR_C
    r = run(ms)
    assert words(r) == [(14, "15", ["ritardando"]), (16, "17", ["a_tempo"])], r
    assert r["n_changes"] == 2 and r["by_effect"] == {"gradual_slower": 1, "return": 1}, r


@case("not found: no words at all -> empty, no swing")
def _():
    r = run([BAR_C + back(4) + BAR_LH])
    assert r["changes"] == [] and r["swing_elements"] == [] and r["other_words"] == {} and r["n_changes"] == 0, r


@case("not found: words that are not tempo changes are listed with their text, not classified")
def _():
    r = run([D(W("dolce")) + BAR_C, D(W("dolce")) + BAR_C])
    assert r["changes"] == [] and r["other_words"]["dolce"]["count"] == 2, r


@case("fool (row): 'ritmico' is a character word, not a ritardando -> other words")
def _():
    r = one("ritmico")
    assert r["changes"] == [] and "ritmico" in r["other_words"], r


@case("fool (row): 'accelerated' is not accelerando; 'Parallel Period' not 'ral'; 'swinging' not swing; 'rallying' not rall")
def _():
    for t in ("accelerated", "Parallel Period - measures 5-21", "swinging", "rallying", "stringent", "Rite of Spring", "tempestoso"):
        assert kinds(t) == [], (t, kinds(t))


@case("spellings of each promised word, with case, accents and trailing punctuation ignored")
def _():
    want = {"rit.": "ritardando", "Rit.": "ritardando", "RIT": "ritardando", "ritard.": "ritardando", "Ritardando": "ritardando",
            "rall.": "rallentando", "Rallentando": "rallentando", "rallent.": "rallentando", "Ral.": "rallentando",
            "riten.": "ritenuto", "ritenuto": "ritenuto", "ritenente": "ritenuto", "allargando": "allargando",
            "accel.": "accelerando", "Accelerando": "accelerando", "stringendo": "stringendo", "string.": "stringendo",
            "a tempo": "a_tempo", "A Tempo": "a_tempo", "a  tempo": "a_tempo", "in tempo": "a_tempo", "Im Tempo": "a_tempo",
            "Tempo I": "tempo_primo", "Tempo I.": "tempo_primo", "tempo 1º": "tempo_primo", "Tempo primo": "tempo_primo",
            "Ⅰ Tempo": "tempo_primo", "rubato": "rubato", "tempo rubato": "rubato",
            "meno mosso": "meno_mosso", "Meno mosso.": "meno_mosso", "più mosso": "piu_mosso", "piu mosso": "piu_mosso",
            "Swing": "swing", "swung": "swing", "Straight eighths": "straight", "straight": "straight"}
    for t, w in want.items():
        assert kinds(t) == [w], (t, kinds(t))


@case("words combined with other text keep the full text and still match ('poco rit.', 'rit. e dim.', 'cresc. ed accel.')")
def _():
    r = run([D(W("poco rit.")) + BAR_C, D(W("rit. e dim.")) + BAR_C, D(W("cresc. ed accel.")) + BAR_C])
    assert words(r) == [(0, "1", ["ritardando"]), (1, "2", ["ritardando"]), (2, "3", ["accelerando"])], r
    assert r["changes"][0]["text"] == "poco rit.", r


@case("two vocabulary words in one text -> two matches ('più mosso a tempo')")
def _():
    assert sorted(kinds("più mosso a tempo")) == ["a_tempo", "piu_mosso"], kinds("più mosso a tempo")


@case("fool: 'A tempo I' is one return (tempo_primo), not also a_tempo")
def _():
    assert kinds("A tempo I") == ["tempo_primo"], kinds("A tempo I")


@case("fool: \"Tempo l'istesso\" / \"L'istesso tempo\" is the SAME tempo, not a return")
def _():
    assert kinds("Tempo l'istesso") == [] and kinds("L'istesso tempo.") == []


@case("fool: 'senza rit.' / 'non rit.' (without) is not a ritardando -> negated, not counted; 'sans ralentir' not matched")
def _():
    r = one("senza rit.")
    assert r["changes"] == [] and r["negated"][0]["negated"][0]["word"] == "ritardando", r
    assert one("non rit.")["changes"] == [] and one("sans ralentir")["changes"] == []


@case("fool: 'Tempo II' and 'tempo 120' are not tempo I")
def _():
    assert kinds("Tempo II") == [] and kinds("tempo 120") == []


@case("fool: a metronome / other tempo word near the word does not change it ('Allegro' alone is other)")
def _():
    r = run([D(W("Allegro") + "<metronome><beat-unit>quarter</beat-unit><per-minute>120</per-minute></metronome>") + BAR_C])
    assert r["changes"] == [] and "Allegro" in r["other_words"], r


@case("words with a dashes line and words typed with dashes: one change each, the word is not lost")
def _():
    r = run([D(W("rit.") + '<dashes type="start" number="1"/>') + BAR_C, BAR_C + D('<dashes type="stop" number="1"/>'),
             D(W("rall. - - - -")) + BAR_C])
    assert words(r) == [(0, "1", ["ritardando"]), (2, "3", ["rallentando"])], r


@case("words on staff 2 only: one change on that staff; no staff given: one change listed on both staves (merged)")
def _():
    r = run([D(W("rit."), staff=2) + BAR_C + back(4) + BAR_LH])
    assert len(r["changes"]) == 1 and r["changes"][0]["staves"] == [1], r
    r = run([D(W("rit.")) + BAR_C + back(4) + BAR_LH])
    assert len(r["changes"]) == 1 and r["changes"][0]["staves"] == [0, 1], r


@case("position inside the bar is kept (a word after two beats is at offset 2)")
def _():
    r = run([N("C") + N("D") + D(W("rit.")) + N("E") + N("F")])
    assert r["changes"][0]["offset"] == "2", r


@case("a pickup bar: bar_index 0, printed number as written")
def _():
    r = run([D(W("a tempo")) + N("G"), BAR_C], implicit_first=True)
    assert r["changes"][0]["bar_index"] == 0 and r["changes"][0]["bar"] == "0", r


@case("several <words> in one direction-type are both found")
def _():
    r = run([D(W("rit.") + W("a tempo")) + BAR_C])
    assert sorted(x["word"] for c in r["changes"] for x in c["matches"]) == ["a_tempo", "ritardando"], r


@case("words split across two directions at one place ('s' + 'tringendo', a real file) are ONE change, pieces not listed")
def _():
    r = run([D(W("s")) + D(W("tringendo")) + BAR_C])
    assert r["n_changes"] == 1 and r["changes"][0]["text"] == "stringendo" and r["changes"][0]["joined_from"] == ["s", "tringendo"], r
    assert r["joined_pieces"][0]["joined"] == "stringendo" and r["other_words"] == {}, r
    r = run([D(W("a")) + D(W("tempo")) + BAR_C])
    assert [x["word"] for c in r["changes"] for x in c["matches"]] == ["a_tempo"], r


@case("fool: a fingering '1' in another direction beside 'Tempo' is not 'tempo 1'; pieces that match alone are not joined")
def _():
    r = run([D(W("Tempo")) + D(W("1")) + BAR_C])
    assert r["changes"] == [] and r["joined_pieces"] == [], r
    r = run([D(W("poco")) + D(W("rit.")) + BAR_C])
    assert r["n_changes"] == 1 and r["joined_pieces"] == [] and r["changes"][0]["text"] == "rit.", r


@case("fool: jump words 'D.C. al Fine' / 'Fine' / 'Coda' are not tempo changes (music21 imports them as RepeatExpression)")
def _():
    r = run([D(W("D.C. al Fine")) + BAR_C, D(W("Fine")) + BAR_C])
    assert r["changes"] == [], r


@case("gap: <swing><straight/> inside a direction is read (music21 drops it)")
def _():
    snd = "<sound><swing><straight/></swing></sound>"
    s, p = score([D(W("Straight 8ths"), sound=snd) + BAR_C])
    import music21 as m
    assert not [x for x in s.recurse() if "swing" in type(x).__name__.lower()], "music21 now keeps swing: re-measure"
    r = tempo_change(s, p)
    assert r["swing_elements"][0]["straight"] is True and r["swing_elements"][0]["bar_index"] == 0, r
    assert r["swing_elements"][0]["offset"] == "0" and r["swing_elements"][0]["swing_type"] is None, r


@case("gap: <swing> with first/second/swing-type/style at a position and as a child of <measure> (bar only)")
def _():
    sw = ("<sound><swing><first>2</first><second>1</second><swing-type>eighth</swing-type>"
          "<swing-style>Medium</swing-style></swing></sound>")
    r = run([N("C") + N("D") + D("", sound=sw) + N("E") + N("F"), sw + BAR_C])
    a, b = r["swing_elements"]
    assert (a["bar_index"], a["offset"], a["first"], a["second"], a["swing_type"], a["style"], a["straight"]) == \
        (0, "2", 2, 1, "eighth", "Medium", False), a
    assert (b["bar_index"], b["offset"], b["bar"]) == (1, None, "2"), b


@case("fool: the word 'Swing' without the element is a word match only; no <swing> -> swing_elements empty")
def _():
    r = one("Swing")
    assert kinds("Swing") == ["swing"] and r["swing_elements"] == [], r


@case("result is JSON-serialisable")
def _():
    import json
    sw = "<sound><swing><straight/></swing></sound>"
    json.dumps(run([D(W("rit."), sound=sw) + BAR_C, D(W("ri")) + D(W("tard.")) + BAR_C, D(W("senza rit.")) + BAR_C]))


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
