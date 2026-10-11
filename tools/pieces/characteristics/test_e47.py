"""Hand-made MusicXML cases for e47_hand_marks (CLAUDE.md technical rule 2): found, not found, built to fool it. The cases
copy the structures measured in the review bundle (132: m.g. on the lower staff with an empty lower staff; 127: a voice
written wholly on the other staff; 124 bars 18-21, 134 bar 70, 135 bar 49: a voice crossing within a bar). A last group
reads the real bundle files when build/pieces/chatgpt-bundle exists on this machine (it is not in git) and is skipped
otherwise. Usage: python tools/pieces/characteristics/test_e47.py"""
import glob, os, sys, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_characteristics import N, D, back, fwd, score, BAR_C  # noqa: E402
from e47_hand_marks import hand_marks, hand_words  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
BUNDLE = os.path.join(ROOT, "build", "pieces", "chatgpt-bundle")
CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


def W(t):
    return f"<words>{t}</words>"


def run(measures, **kw):
    s, p = score(measures, **kw)
    return hand_marks(s, p)


def whole(step, octave, staff, voice):
    return N(step, octave, dur=16, typ="whole", staff=staff, voice=voice)


# a whole note on the lower staff in voice 3 (the shared BAR_LH is voice 1 on staff 2, which is Finale-style numbering)
BAR_LH = whole("C", 3, 2, 3)


def bars_of(r):
    return [(e["bar"], e["voice"], e["written_on_staff"], e["notes"], e["whole_bar"]) for e in r["cross_staff"]]


@case("found (case 132): m.g. on staff 2 in bar 3, staff 2 empty in bars 3-4, left-hand notes as voice 2 on staff 1")
def _():
    r = run([BAR_C + back(4) + BAR_LH, BAR_C + back(4) + BAR_LH,
             D(W("m.g."), staff=2) + BAR_C + back(4) + whole("E", 4, 1, 2),
             BAR_C + back(4) + whole("D", 4, 1, 2), BAR_C + back(4) + BAR_LH])
    assert r["n_marks"] == 1 and r["by_hand"] == {"left": 1}, r
    mk = r["marks"][0]
    assert (mk["bar_index"], mk["bar"], mk["hand"], mk["staff"], mk["against_staff_order"]) == (2, "3", "left", 2, False), mk
    assert mk["staff_empty_run"] == [2, 3] and mk["staff_empty_run_bars"] == ["3", "4"], mk
    assert mk["governed"]["other_staves"] == {1: {"voices": ["1", "2"], "notes": 10}}, mk["governed"]
    assert r["cross_staff"] == [], r  # voice 2 never leaves staff 1: only the mark shows this one


@case("found: words in several languages; one entry per hand token")
def _():
    want = {"m.d.": "right", "M.G.": "left", "m.s.": "left", "r.h.": "right", "L.H.": "left", "l. h.": "left",
            "linke Hand": "left", "mit der rechten Hand": "right", "rechte Hand": "right", "left hand": "left",
            "right hand": "right", "main gauche": "left", "Main droite": "right", "mano sinistra": "left",
            "mano destra": "right", "r.H.": "right", "l.H. 8va": "left"}
    for text, hand in want.items():
        assert [h for h, _ in hand_words(text)] == [hand], (text, hand_words(text))
    assert [h for h, _ in hand_words("m.d. e m.g.")] == ["right", "left"]
    r = run([D(W("m.d. e m.g.")) + BAR_C + back(4) + BAR_LH])
    assert r["n_marks"] == 2 and r["by_hand"] == {"right": 1, "left": 1}, r


@case("not found / built to fool it: look-alike words, no hand words")
def _():
    for text in ["rhythmic", "m.m. = 60", "Allegro", "right", "hand clap", "handel", "ritardando", "poco a poco", "mf",
                 "legato", "Rehearsal", "the lamp", "ma non troppo", ""]:
        assert hand_words(text) == [], (text, hand_words(text))
    r = run([D(W("Allegro moderato")) + BAR_C + back(4) + BAR_LH])
    assert r["n_marks"] == 0 and r["marks"] == [] and r["cross_staff"] == [] and r["ambiguous_voices"] == [], r


@case("a direction without <staff> is in every staff of the part: one mark, staff 'all', no order verdict")
def _():
    r = run([D(W("r.h.")) + BAR_C + back(4) + BAR_LH])
    assert r["n_marks"] == 1 and r["marks"][0]["staff"] == "all" and r["marks"][0]["against_staff_order"] is None, r
    assert r["marks"][0]["governed"] is None and r["marks"][0]["staff_empty_run"] == [], r


@case("staff against the usual order: r.h. on the lower staff and l.h. on the upper staff are flagged, the usual ones are not")
def _():
    r = run([D(W("r.h."), staff=2) + D(W("l.h."), staff=1) + BAR_C + back(4) + BAR_LH,
             D(W("r.h."), staff=1) + D(W("l.h."), staff=2) + BAR_C + back(4) + BAR_LH])
    got = [(x["bar_index"], x["hand"], x["staff"], x["against_staff_order"]) for x in r["marks"]]
    assert sorted(got) == [(0, "left", 1, True), (0, "right", 2, True), (1, "left", 2, False), (1, "right", 1, False)], got
    assert r["n_against_staff_order"] == 2, r
    # the staff holds notes in the mark's bar: the scope is not written -> UNKNOWN (None), no run
    assert all(x["governed"] is None and x["staff_empty_run"] == [] for x in r["marks"]), r


@case("found (case 127 bars 7-8): voice 1 written wholly on the lower staff, home staff 1 -> whole_bar entries")
def _():
    low = N("A", 3, staff=2, voice=1) + N("D", 4, staff=2, voice=1) + N("G", 3, staff=2, voice=1) + N("C", 4, staff=2, voice=1)
    five = N("F", 3, staff=2, voice=5) + N("E", 3, staff=2, voice=5) + N("G", 2, staff=2, voice=5) + N("D", 3, staff=2, voice=5)
    norm = BAR_C + back(4) + whole("C", 3, 2, 5)
    r = run([norm, norm, low + back(4) + five, low + back(4) + five, norm])
    assert bars_of(r) == [("3", "1", 2, 4, True), ("4", "1", 2, 4, True)], bars_of(r)
    assert r["cross_staff"][0]["home_staff"] == 1 and r["n_cross_staff_notes"] == 8 and r["cross_staff_bars"] == [[2, 0], [3, 0]], r
    assert r["ambiguous_voices"] == [] and r["marks"] == [], r


@case("found (cases 124 bars 18-21, 134 bar 70, 135 bar 49): a voice crossing within a bar; music21 shows no Voice there")
def _():
    # voice 1: two quarters on staff 1, then (after a forward) two on staff 2, disjoint in time; each staff-measure holds
    # ONE voice, so music21 drops the voice number (the measured gap this row patches)
    first = N("C", 5, staff=1, voice=1) + N("B", 4, staff=1, voice=1)
    second = fwd(2) + N("A", 3, staff=2, voice=1) + N("G", 3, staff=2, voice=1)
    crossing = first + back(2) + second
    r = run([BAR_C + back(4) + BAR_LH, BAR_C + back(4) + BAR_LH, crossing, BAR_C + back(4) + BAR_LH])
    assert bars_of(r) == [("3", "1", 2, 2, False)], bars_of(r)
    import music21 as m
    s, _p = score([crossing])
    assert not list(s.parts[1].getElementsByClass(m.stream.Measure)[0].getElementsByClass(m.stream.Voice))


@case("fool: voice 1 on BOTH staves in every bar (Finale/Sibelius numbering) is not cross-staff, the voice is ambiguous")
def _():
    both = BAR_C + back(4) + N("C", 3, dur=16, typ="whole", staff=2, voice=1)
    r = run([both, both, both])
    assert r["cross_staff"] == [] and [a["voice"] for a in r["ambiguous_voices"]] == ["1"], r
    assert r["ambiguous_voices"][0]["reason"] == "overlap in a bar", r


@case("fool: a voice with as many notes on one staff as on the other has no home staff -> ambiguous, not flagged")
def _():
    a = N("C", 5, staff=1, voice=1, dur=16, typ="whole")
    b = N("C", 3, staff=2, voice=1, dur=16, typ="whole")
    r = run([a, b])
    assert r["cross_staff"] == [] and r["ambiguous_voices"][0]["reason"] == "tie", r


@case("not found: ordinary piano (voices on their own staff), two one-staff parts, and a one-staff part")
def _():
    r = run([BAR_C + back(4) + BAR_LH, BAR_C + back(4) + BAR_LH])
    assert r["n_marks"] == 0 and r["n_cross_staff_entries"] == 0 and r["ambiguous_voices"] == [], r
    r = run([[BAR_C], [N("C", 3, dur=16, typ="whole")]], parts=[("Right Hand", 1), ("Left Hand", 1)])
    assert r["n_marks"] == 0 and r["cross_staff"] == [], r
    r = run([D(W("m.g.")) + BAR_C], parts=[("Piano", 1)])
    assert r["n_marks"] == 1 and r["marks"][0]["against_staff_order"] is None and r["cross_staff"] == [], r


@case("result is JSON-serialisable")
def _():
    import json
    json.dumps(run([D(W("m.g."), staff=2) + BAR_C + back(4) + whole("E", 4, 1, 2), BAR_C + back(4) + BAR_LH]))


def bundle(prefix):
    hits = glob.glob(os.path.join(BUNDLE, prefix + "_*", "score.musicxml"))
    return hits[0] if hits else None


def real(prefix):
    import music21 as m
    f = bundle(prefix)
    return hand_marks(m.converter.parse(f), f)


MEASURED = [
    ("132", "m.g. on the lower staff in bar 5, lower staff empty in bars 5-6; no cross-staff voice"),
    ("127", "voice 1 on the lower staff in bars 7-8, 23-24, 27-28 and no other bar"),
    ("124", "voice 2 written on the upper staff in bars 18-21 and no other bar"),
    ("134", "voice 1 on the lower staff in bar 70 only"),
    ("135", "voice 1 on the lower staff in bar 49 only"),
    ("001", "negative: Minuet in F, no marks and no cross-staff notes"),
]


def _measured(prefix):
    r = real(prefix)
    bars = [e["bar"] for e in r["cross_staff"]]
    if prefix == "132":
        assert [(x["bar"], x["text"], x["hand"], x["staff"]) for x in r["marks"]] == [("5", "m.g.", "left", 2)], r["marks"]
        assert r["marks"][0]["staff_empty_run_bars"] == ["5", "6"] and r["cross_staff"] == []
    elif prefix == "127":
        assert r["marks"] == [] and bars == ["7", "8", "23", "24", "27", "28"] and {e["voice"] for e in r["cross_staff"]} == {"1"}
        assert [e["whole_bar"] for e in r["cross_staff"]] == [True, True, True, False, True, True]
    elif prefix == "124":
        assert bars == ["18", "19", "20", "21"] and {(e["voice"], e["written_on_staff"]) for e in r["cross_staff"]} == {("2", 1)}
    elif prefix == "134":
        assert bars == ["70"] and r["cross_staff"][0]["voice"] == "1" and r["cross_staff"][0]["written_on_staff"] == 2
    elif prefix == "135":
        assert bars == ["49"] and r["cross_staff"][0]["voice"] == "1" and r["cross_staff"][0]["written_on_staff"] == 2
    else:
        assert r["n_marks"] == 0 and r["cross_staff"] == [] and r["ambiguous_voices"] == [], r


def _measured_case(prefix):
    def fn():
        if not bundle(prefix):
            print("   (skipped: bundle folder", prefix, "not on this machine)")
            return
        _measured(prefix)
    return fn


for _p, _d in MEASURED:
    CASES.append((f"measured bundle {_p}: {_d}", _measured_case(_p)))


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
