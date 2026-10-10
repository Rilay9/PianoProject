"""Hand-made MusicXML cases for e30_slash (CLAUDE.md technical rule 2): found, not found, built to fool it, and one per
gap patched. Usage: python tools/pieces/characteristics/test_e30.py"""
import json, os, sys, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_characteristics import N, R, back, score, xml, TMP, BAR_C, BAR_LH, D  # noqa: E402
from e30_slash import slash_notation  # noqa: E402

SL4 = N(notehead="slash") * 4          # four slash quarters on staff 1
LH = back(4) + BAR_LH                  # then a whole note on staff 2


def MS(inner, number=None):
    n = f' number="{number}"' if number else ""
    return f"<attributes><measure-style{n}>{inner}</measure-style></attributes>"


def run(measures, **kw):
    s, p = score(measures, **kw)
    return slash_notation(s, p)


def run_text(text, name):
    """For cases that edit the MusicXML text after building it."""
    import music21 as m
    p = os.path.join(TMP, name)
    open(p, "w", encoding="utf-8").write(text)
    return slash_notation(m.converter.parse(p, forceSource=True), p)


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("found (row): four slash noteheads in a bar -> 4, bar index + printed number")
def _():
    r = run([BAR_C + LH, SL4 + LH, BAR_C + LH])
    a = r[1]
    assert a["slash_attacks"] == 4 and a["attacks"] == 12 and a["by_type"] == {"quarter": 4}, a
    assert a["bar_list"] == [{"bar_index": 1, "bar": "2", "n": 4}] and a["full_slash_bars"] == 1 and a["mixed_bars"] == 0
    assert a["stem_none"] == 0 and a["stem_not_none"] == 4 and a["longest_run_bars"] == 1
    assert r[2]["slash_attacks"] == 0 and r[0] == {"unpitched_slash": 0}
    assert a["measure_style"] == {"slash": 0, "beat-repeat": 0, "measure-repeat": 0} and a["style_marks"] == []


@case("not found (row): normal noteheads -> 0")
def _():
    r = run([BAR_C + LH, BAR_C + LH])
    assert r[1]["slash_attacks"] == 0 and r[1]["bar_list"] == [] and r[1]["attacks"] == 8 and r[1]["share_slash"] == 0.0


@case("fool (row): x noteheads -> 0; also the other look-alike heads and an invisible head")
def _():
    for head in ["x", "cross", "diamond", "slashed", "back slashed", "none", "normal"]:
        r = run([N(notehead=head) * 4 + LH])
        assert r[1]["slash_attacks"] == 0, head


@case("slash on staff 2 is reported on staff 2, not staff 1")
def _():
    r = run([BAR_C + back(4) + N("C", 3, notehead="slash", staff=2) * 4])
    assert r[1]["slash_attacks"] == 0 and r[2]["slash_attacks"] == 4 and r[2]["bar_list"][0]["bar"] == "1"


@case("fool: a bar of three slashes plus a real note is a mixed bar, not a full slash bar")
def _():
    r = run([N(notehead="slash") * 3 + N() + LH, SL4 + LH, SL4 + LH, BAR_C + LH, SL4 + LH])
    a = r[1]
    assert a["slash_attacks"] == 15 and a["mixed_bars"] == 1 and a["full_slash_bars"] == 3 and a["bars_with_slash"] == 4
    assert a["longest_run_bars"] == 3  # bars 1-3 in a row, a normal bar, then one more


@case("rhythm slashes (stems) apart from beat slashes (<stem>none</stem>); durations kept")
def _():
    text = xml([N(notehead="slash", typ="eighth", dur=2) * 8 + LH]).replace("</notehead>", "</notehead><stem>none</stem>")
    r = run_text(text, "nostem30.musicxml")
    assert r[1]["slash_attacks"] == 8 and r[1]["stem_none"] == 8 and r[1]["by_type"] == {"eighth": 8}


@case("hidden slash head (print-object='no') is not drawn: not counted, reported in hidden_slash")
def _():
    text = xml([SL4 + LH]).replace("<note><pitch><step>C", '<note print-object="no"><pitch><step>C', 1)
    r = run_text(text, "hid30.musicxml")
    assert r[1]["slash_attacks"] == 3 and r[1]["hidden_slash"] == 1 and r[1]["attacks"] == 3 and r[1]["full_slash_bars"] == 1


@case("chord with one slash member counts once and is flagged; chord of two slash members counts once")
def _():
    two = N(notehead="slash") + N(step="E", chord=True, notehead="slash")
    mixed = N(notehead="slash") + N(step="E", chord=True)
    r = run([two + mixed + N() + N() + LH])
    assert r[1]["slash_attacks"] == 2 and r[1]["mixed_chords"] == 1 and r[1]["attacks"] == 4


@case("grace note with a slash head is counted apart")
def _():
    r = run([N(grace=True, notehead="slash") + SL4 + LH])
    assert r[1]["slash_attacks"] == 4 and r[1]["grace_slash"] == 1


@case("unpitched note with a slash head is not a note here: counted only in key 0")
def _():
    u = ('<note><unpitched><display-step>E</display-step><display-octave>4</display-octave></unpitched><duration>4</duration>'
         '<voice>1</voice><type>quarter</type><notehead>slash</notehead><staff>1</staff></note>')
    r = run([u * 4 + LH])
    assert r[0]["unpitched_slash"] == 4 and r[1]["slash_attacks"] == 0


# ---- gap patched: music21 reads nothing of <measure-style> slash / beat-repeat / measure-repeat
@case("gap: <measure-style><slash> start ... stop -> one mark each, joined as a span, on every staff when no number")
def _():
    r = run([MS('<slash type="start" use-stems="yes"/>') + BAR_C + LH, BAR_C + LH, MS('<slash type="stop"/>') + BAR_C + LH])
    for k in (1, 2):
        a = r[k]
        assert a["measure_style"]["slash"] == 1 and a["slash_attacks"] == 0
        assert [(x["type"], x["bar_index"], x["bar"]) for x in a["style_marks"]] == [("start", 0, "1"), ("stop", 2, "3")]
        assert a["style_marks"][0]["use_stems"] == "yes"
        assert a["style_spans"] == [{"kind": "slash", "start_bar_index": 0, "start_bar": "1", "stop_bar_index": 2, "stop_bar": "3"}]
        assert a["style_unclosed"] == []


@case("gap: measure-style with number='2' applies to staff 2 only; start without stop is listed as unclosed")
def _():
    r = run([MS('<slash type="start"/>', number=2) + BAR_C + LH, BAR_C + LH])
    assert r[1]["style_marks"] == [] and r[2]["measure_style"]["slash"] == 1
    assert r[2]["style_spans"] == [] and r[2]["style_unclosed"] == [{"kind": "slash", "start_bar_index": 0, "start_bar": "1"}]


@case("gap: beat-repeat and measure-repeat are counted as their own kinds, never as slash")
def _():
    r = run([MS('<beat-repeat type="start" slashes="2"/>') + BAR_C + LH, MS('<beat-repeat type="stop"/>') + BAR_C + LH,
             MS('<measure-repeat type="start" slashes="1">1</measure-repeat>') + BAR_C + LH,
             MS('<measure-repeat type="stop"/>') + BAR_C + LH])
    a = r[1]
    assert a["measure_style"] == {"slash": 0, "beat-repeat": 1, "measure-repeat": 1}, a["measure_style"]
    assert a["style_marks"][0]["slashes"] == "2" and len(a["style_spans"]) == 2 and a["slash_attacks"] == 0


@case("gap fool: <multiple-rest> in a measure-style is another row's fact and is not counted here")
def _():
    r = run([MS("<multiple-rest>4</multiple-rest>") + BAR_C + LH])
    assert r[1]["measure_style"] == {"slash": 0, "beat-repeat": 0, "measure-repeat": 0} and r[1]["style_marks"] == []


@case("two one-staff parts: noteheads and an un-numbered measure-style map to the staff of their own part")
def _():
    r = run([[MS('<slash type="start"/>') + SL4], [N("C", 3, dur=16, typ="whole")]], parts=[("Right Hand", 1), ("Left Hand", 1)])
    assert r[1]["slash_attacks"] == 4 and r[1]["measure_style"]["slash"] == 1
    assert r[2]["slash_attacks"] == 0 and r[2]["measure_style"]["slash"] == 0


@case("result is JSON-serialisable")
def _():
    r = run([MS('<slash type="start"/>') + SL4 + LH, MS('<slash type="stop"/>') + BAR_C + LH])
    json.loads(json.dumps(r))


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
