"""Hand-made MusicXML cases for e24_pedal (CLAUDE.md technical rule 2): found, not found, built to fool it, and one per
gap patched. Usage: python tools/pieces/characteristics/test_e24.py"""
import os, sys, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_characteristics import N, D, back, fwd, score, BAR_C, BAR_LH  # noqa: E402
from e24_pedal import pedal  # noqa: E402

B = BAR_C + back(4) + BAR_LH  # one bar: four quarters on staff 1, a whole note on staff 2


def P(typ, staff=None, number=None, line=None, sign=None, hidden=False):
    a = f'type="{typ}"' + (f' number="{number}"' if number else "") + (f' line="{line}"' if line else "") + \
        (f' sign="{sign}"' if sign else "")
    d = D(f"<pedal {a}/>", staff=staff)
    return d.replace("<direction>", '<direction print-object="no">') if hidden else d


def W(text, staff=None):
    return D(f"<words>{text}</words>", staff=staff)


def run(measures, **kw):
    s, p = score(measures, **kw)
    return pedal(s, p)


def spans(r, staff):
    return [(x["kind"], x["first_bar"], x["last_bar"], x["changes"]) for x in r["staves"][staff]["spans"]]


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("found (row): Ped. at bar 1, change at bar 2, release at bar 3 -> 1 span with 1 change")
def _():
    r = run([P("start", 1, line="yes") + B, P("change", 1, line="yes") + B, P("stop", 1, line="yes") + B])
    assert spans(r, 1) == [("sustain", "1", "3", 1)], r["staves"][1]
    assert r["staves"][1]["events"] == {"start": 1, "change": 1, "stop": 1} and r["marks"] == 1 and r["has_pedal_marks"]
    assert r["staves"][2]["events"] == {} and r["staves"][1]["unclosed"] == []
    # the stop sits on the downbeat of bar 3: the pedal was down in bars 1 and 2 only
    assert r["bars"] == 3 and r["bars_under_pedal"]["sustain"] == 2 and r["share_bars_under_pedal"]["sustain"] == 0.6667


@case("not found (row): no marks -> 0 events, no spans, share 0")
def _():
    r = run([B, B])
    assert r["marks"] == 0 and not r["has_pedal_marks"] and spans(r, 1) == [] and spans(r, 2) == []
    assert r["share_bars_under_pedal"]["sustain"] == 0 and r["words"] == []


@case("fool (row): 'con pedale' words with no marks -> 0 events, listed as text")
def _():
    r = run([W("con pedale", 1) + B, B])
    assert r["marks"] == 0 and not r["has_pedal_marks"] and r["staves"][1]["events"] == {}
    assert r["words"] == [{"text": "con pedale", "kind": "sustain_on", "bar_index": 0, "bar": "1", "staff": 1}]


@case("fool: a pedal POINT in analysis text, a tempo word and 'developed' are not pedal words")
def _():
    r = run([W("Pedal de dominante", 1) + W("en un pedal de dominante (c.25). El pedal resuelve", 1) +
             W("Adagio sostenuto", 1) + W("Cadenza developed from Second Theme", 2) + W("sostenuto", 2) + B])
    assert r["words"] == [] and r["marks"] == 0


@case("words: closed list, kinds kept apart (sustain on/off, sostenuto pedal, una corda, tre corde, damper words)")
def _():
    texts = ["Ped.", "col. Ped.", "sempre con Pedale", "Ped. simile", "senza ped.", "sost. ped.", "una corda",
             "una corda, sempre ligato", "u.c.", "tre corde", "tutte    le corde", "3 Cordes", "t.c.", "senza sordino",
             "con sordina"]
    r = run(["".join(W(t, 1) for t in texts) + B])
    got = [w["kind"] for w in r["words"]]
    assert got == ["sustain_on", "sustain_on", "sustain_on", "sustain_on", "sustain_off", "sostenuto_pedal", "soft_pedal_on",
                   "soft_pedal_on", "soft_pedal_on", "soft_pedal_off", "soft_pedal_off", "soft_pedal_off", "soft_pedal_off",
                   "damper_words", "damper_words"], got
    assert r["marks"] == 0, "una corda is a soft-pedal word, never a pedal mark or a sustain flag"


@case("soft pedal words with no <staff> in a two-staff part: staff 'unspecified', and ONE word (music21 copies it to both staves)")
def _():
    import music21 as m
    s, p = score([W("una corda") + B])
    assert len(list(s.recurse().getElementsByClass(m.expressions.TextExpression))) == 2  # the gap, pinned
    r = pedal(s, p)
    assert r["words"] == [{"text": "una corda", "kind": "soft_pedal_on", "bar_index": 0, "bar": "1", "staff": "unspecified"}]


@case("found: sostenuto pedal is its own kind, shares no count with sustain")
def _():
    r = run([P("sostenuto", 1, number="2") + B, P("stop", 1, number="2") + B])
    assert spans(r, 1) == [("sostenuto", "1", "2", 0)] and r["bars_under_pedal"] == {"sustain": 0, "sostenuto": 1}


@case("fool: a start with no stop is reported unclosed, never given an end, and covers no bars")
def _():
    r = run([P("start", 2) + B, B])
    assert spans(r, 2) == [] and r["staves"][2]["unclosed"] == [{"kind": "sustain", "form": "symbol", "bar_index": 0, "bar": "1"}]
    assert r["marks"] == 1 and r["bars_under_pedal"]["sustain"] == 0


@case("fool: a stop with nothing open is an orphan, not a span")
def _():
    r = run([P("stop", 1) + B, B])
    assert r["staves"][1]["orphan_stops"] == 1 and spans(r, 1) == [] and r["marks"] == 0


@case("fool: stop and start at the same time is a re-press (two spans), not one long span or an unclosed start")
def _():
    r = run([P("start", 1) + N("C") + N("D") + P("stop", 1) + P("start", 1) + N("E") + N("F") + back(4) + BAR_LH, P("stop", 1) + B])
    assert spans(r, 1) == [("sustain", "1", "1", 0), ("sustain", "1", "2", 0)] and r["staves"][1]["unclosed"] == []


@case("GAP PATCHED 1: marks written out of time order are paired by time (music21 pairs by document order)")
def _():
    # staff 2, the pattern of mxl/7/47 QmPUyKD5K bar 16: start@0, whole note, stop@4 (written first), then back to beat 3:
    # stop@3, start@3. In TIME order each bar is start 0..stop 3, start 3..stop 4: two spans inside the bar. music21 pairs by
    # document order and chains them across bars (bar 1's second start closed by bar 2's first stop), so two bars are written.
    import music21 as m
    bar = (BAR_C + back(4) + P("start", 2) + N("C", 3, dur=16, typ="whole", staff=2) + P("stop", 2) + back(4) + fwd(3) +
           P("stop", 2) + P("start", 2) + N("D", 3, staff=2))
    s, p = score([bar, bar])
    r = pedal(s, p)
    assert spans(r, 2) == [("sustain", "1", "1", 0)] * 2 + [("sustain", "2", "2", 0)] * 2, spans(r, 2)
    assert r["staves"][2]["unclosed"] == [] and r["staves"][2]["orphan_stops"] == 0 and r["marks"] == 4
    # music21 on the same file (pinned): 3 PedalMarks, the second one runs from bar 1 into bar 2
    pms = list(s.recurse().getElementsByClass(m.expressions.PedalMark))
    assert len(pms) == 3 and [e.getContextByClass(m.stream.Measure).number for e in pms[1].getSpannedElements()] == [1, 2]


@case("GAP PATCHED 1b: a stop written BEFORE its start in the file (second voice written later) still pairs by time")
def _():
    import music21 as m
    bar = BAR_C + back(4) + fwd(3) + P("stop", 2) + back(3) + fwd(1) + P("start", 2) + N("D", 3, staff=2)
    s, p = score([bar, B])
    r = pedal(s, p)
    assert spans(r, 2) == [("sustain", "1", "1", 0)] and r["staves"][2]["unclosed"] == [] and r["staves"][2]["orphan_stops"] == 0
    # music21 (pinned): the stop is met first, has nothing to close and is dropped, the start is never closed -> no mark
    assert len(list(s.recurse().getElementsByClass(m.expressions.PedalMark))) == 0


@case("GAP PATCHED 2: an unclosed start is counted (music21 imports no PedalMark for it)")
def _():
    import music21 as m
    s, p = score([P("start", 2) + B, B])
    assert len(list(s.recurse().getElementsByClass(m.expressions.PedalMark))) == 0  # the gap, pinned
    assert pedal(s, p)["marks"] == 1


@case("GAP PATCHED 3: start start stop stop (two overlapping marks, as two voices write them) -> 2 spans, none unclosed")
def _():
    r = run([P("start", 2) + P("start", 2) + B, P("stop", 2) + P("stop", 2) + B])
    assert spans(r, 2) == [("sustain", "1", "2", 0), ("sustain", "1", "2", 0)] and r["staves"][2]["unclosed"] == []
    assert r["staves"][2]["orphan_stops"] == 0 and r["marks"] == 2


@case("stop position is the stop's own (a stop at the start of bar 3 ends in bar 3, covering bars 1-2)")
def _():
    r = run([P("start", 2) + B, B, P("stop", 2) + B])
    assert spans(r, 2) == [("sustain", "1", "3", 0)] and r["bars_under_pedal"]["sustain"] == 2
    # a stop at the very end of bar 2 covers bar 2 whole
    r = run([P("start", 2) + B, B + P("stop", 2), B])
    assert spans(r, 2) == [("sustain", "1", "2", 0)] and r["bars_under_pedal"]["sustain"] == 2


@case("staves: marks on staff 1 and staff 2 at once stay on their own staff; nothing is spread to the other staff")
def _():
    r = run([P("start", 1) + P("start", 2) + B, P("stop", 1) + B, P("stop", 2) + B])
    assert spans(r, 1) == [("sustain", "1", "2", 0)] and spans(r, 2) == [("sustain", "1", "3", 0)]


@case("staff: no <staff> in a one-staff part is that staff; in a two-staff part it is 'unspecified', not staff 1")
def _():
    s1 = N("C", 4, dur=16, typ="whole")
    r = run([[P("start") + s1, P("stop") + s1]], parts=[("Piano", 1)])
    assert spans(r, 1) == [("sustain", "1", "2", 0)] and r["staves"]["unspecified"]["events"] == {}
    r = run([P("start") + B, P("stop") + B])
    assert r["staves"]["unspecified"]["events"] == {"start": 1, "stop": 1} and r["staves"][1]["events"] == {}
    assert spans(r, "unspecified") == [("sustain", "1", "2", 0)]


@case("hidden mark (print-object=no) is not a printed mark: counted apart")
def _():
    r = run([P("start", 1, hidden=True) + B, P("stop", 1) + B])
    assert r["hidden_marks"] == 1 and r["marks"] == 0 and r["staves"][1]["orphan_stops"] == 1


@case("unknown <pedal> type is counted, not guessed")
def _():
    r = run([P("wobble", 1) + B])
    assert r["unknown_type"] == 1 and r["marks"] == 0


@case("forms: line, symbol (Ped./*), both, and none written (symbol by the schema default)")
def _():
    r = run([P("start", 1, line="yes") + B, P("stop", 1, line="yes") + P("start", 1, line="no", sign="yes") + B,
             P("stop", 1) + P("start", 1, line="yes", sign="yes") + B, P("stop", 1) + P("start", 2) + B, P("stop", 2) + B])
    assert r["staves"][1]["forms"] == {"line": 1, "symbol": 1, "line+symbol": 1}, r["staves"][1]["forms"]
    assert r["staves"][2]["forms"] == {"symbol": 1}


@case("line with a gap: discontinue/resume counted as a gap inside the span, still one span")
def _():
    r = run([P("start", 1, line="yes") + B, P("discontinue", 1, line="yes") + B, P("resume", 1, line="yes") + B,
             P("stop", 1, line="yes") + B])
    assert len(r["staves"][1]["spans"]) == 1 and r["staves"][1]["spans"][0]["gaps"] == 1
    assert r["staves"][1]["events"] == {"start": 1, "discontinue": 1, "resume": 1, "stop": 1}


@case("numbers: two lines with different numbers on one staff are two marks, each closed by its own number")
def _():
    r = run([P("start", 1, number="1") + P("start", 1, number="2") + B, P("stop", 1, number="2") + B, P("stop", 1, number="1") + B])
    assert sorted(spans(r, 1)) == [("sustain", "1", "2", 0), ("sustain", "1", "3", 0)]


@case("playback only: <sound damper-pedal> is not a printed mark")
def _():
    r = run([D("<words>x</words>", staff=1, sound='<sound damper-pedal="yes"/>') + B, D("<words>y</words>", staff=1,
             sound='<sound damper-pedal="no"/>') + B])
    assert r["marks"] == 0 and r["playback_only"] == {"damper-pedal=yes": 1, "damper-pedal=no": 1}


@case("bar numbers are the printed ones: pickup bar 0, and a non-numeric number (MuseScore's X1) as written")
def _():
    import music21 as m
    r = run([[P("start", 1) + N("C"), B, P("stop", 1) + B]], implicit_first=True)
    assert spans(r, 1) == [("sustain", "0", "2", 0)], spans(r, 1)
    s, p = score([P("start", 1) + B, P("stop", 1) + B])
    with open(p, encoding="utf-8") as fh:
        txt = fh.read().replace('<measure number="2">', '<measure number="X1">')
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(txt)
    r = pedal(m.converter.parse(p, forceSource=True), p)
    assert spans(r, 1) == [("sustain", "1", "X1", 0)] and r["staves"][1]["spans"][0]["last_bar_index"] == 1


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
