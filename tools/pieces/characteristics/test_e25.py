"""Hand-made MusicXML cases for e25_tempo (CLAUDE.md technical rule 2): found, not found, built to fool it, one per
patched gap. Usage: python tools/pieces/characteristics/test_e25.py"""
import os, sys, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_characteristics import N, R, D, back, score, attrs, BAR_C, BAR_LH  # noqa: E402
from e25_tempo import tempo  # noqa: E402


def MET(unit="quarter", pm="120", dots=0, print_obj=None):
    po = f' print-object="{print_obj}"' if print_obj else ""
    return f"<metronome{po}><beat-unit>{unit}</beat-unit>{'<beat-unit-dot/>' * dots}<per-minute>{pm}</per-minute></metronome>"


def SND(t):
    return f'<sound tempo="{t}"/>'


def W(t):
    return f"<words>{t}</words>"


def run(measures, **kw):
    s, p = score(measures, **kw)
    return tempo(s, p)


def qpms(r):
    return [(s["bar_index"], s["offset"], s["qpm"]) for s in r["spans"]]


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("found: quarter = 120 -> 120 from the start")
def _():
    r = run([D(MET()) + BAR_C])
    assert qpms(r) == [(0, "0", 120)] and r["source"] == "metronome" and r["opening"] == "at_start", r


@case("not found: no tempo at all -> UNKNOWN, not 120 and not a default")
def _():
    r = run([BAR_C + back(4) + BAR_LH])
    assert qpms(r) == [(0, "0", "UNKNOWN")] and r["source"] == "none" and r["known_qpm"] == [] and r["opening"] == "none"


@case("fool (row): dotted quarter = 60 in 6/8 -> 90 quarters per minute, not 60")
def _():
    r = run([D(MET("quarter", 60, 1)) + N("C") * 3], first_attrs=attrs(time=("6", "8")))
    s = r["spans"][0]
    assert s["qpm"] == 90 and s["beat_unit_quarters"] == 1.5 and s["per_minute_written"] == 60, r


@case("units: half = 60 -> 120; eighth = 200 -> 100; double-dotted quarter = 60 -> 105; 16th = 300 -> 75")
def _():
    for unit, pm, dots, want in (("half", 60, 0, 120), ("eighth", 200, 0, 100), ("quarter", 60, 2, 105), ("16th", 300, 0, 75)):
        r = run([D(MET(unit, pm, dots)) + BAR_C])
        assert r["spans"][0]["qpm"] == want, (unit, r["spans"])


@case("found: sound tempo only (144), as an Asturias-type file -> 144, source sound tempo")
def _():
    r = run([D(W("x"), sound=SND(144)) + BAR_C])
    assert qpms(r) == [(0, "0", 144)] and r["source"] == "sound tempo"


@case("fool: a lone sound tempo 120 looks like an exporter default -> UNKNOWN, 120 kept as sound_qpm")
def _():
    r = run([D(W("x"), sound=SND(120)) + BAR_C, D(W("y"), sound=SND(120)) + BAR_C])
    assert all(s["qpm"] == "UNKNOWN" for s in r["spans"]) and r["spans"][0]["sound_qpm"] == 120, r
    assert r["source"].startswith("sound tempo (120 only")
    # 120 next to another value is a real tempo
    r = run([D(W("x"), sound=SND(120)) + BAR_C, D(W("y"), sound=SND(90)) + BAR_C])
    assert qpms(r) == [(0, "0", 120), (1, "0", 90)], r


@case("gap patched: metronome 132 with <sound tempo=100> in the same direction -> both kept, disagree flagged, printed mark wins")
def _():
    r = run([D(MET("quarter", 132), sound=SND(100)) + BAR_C])
    s = r["spans"][0]
    assert s["qpm"] == 132 and s["metronome_qpm"] == 132 and s["sound_qpm"] == 100 and s["disagree"] and r["n_disagree"] == 1, s


@case("gap patched: sound tempo equal, or within rounding (47 vs 47.5), is not a disagreement")
def _():
    for pm, snd in ((132, 132), (47, 47.5)):
        r = run([D(MET("quarter", pm), sound=SND(snd)) + BAR_C])
        s = r["spans"][0]
        assert s["sound_qpm"] == snd and not s["disagree"], s
    # dotted beat unit: the sound value is quarters, 60 dotted quarters = 90 quarters
    r = run([D(MET("quarter", 60, 1), sound=SND(90)) + N("C") * 3], first_attrs=attrs(time=("6", "8")))
    assert not r["spans"][0]["disagree"], r["spans"]
    r = run([D(MET("quarter", 60, 1), sound=SND(60)) + N("C") * 3], first_attrs=attrs(time=("6", "8")))
    assert r["spans"][0]["disagree"] and r["spans"][0]["qpm"] == 90


@case("fool (ChatGPT): a range 100-108 is not one BPM -> UNKNOWN with a reason")
def _():
    r = run([D(MET("quarter", "100-108")) + BAR_C])
    s = r["spans"][0]
    assert s["qpm"] == "UNKNOWN" and s["why"] and r["known_qpm"] == [], s
    r = run([D(MET("quarter", "c. 60")) + BAR_C])
    assert r["spans"][0]["qpm"] == "UNKNOWN"


@case("fool: metric modulation (q = dotted q) is not a number, and ends the old tempo -> UNKNOWN span after 100")
def _():
    mod = "<metronome><beat-unit>quarter</beat-unit><beat-unit>quarter</beat-unit><beat-unit-dot/></metronome>"
    r = run([D(MET("quarter", 100)) + BAR_C, D(mod) + BAR_C])
    assert qpms(r) == [(0, "0", 100), (1, "0", "UNKNOWN")], r["spans"]


@case("fool: a tempo word gives no number (Allegro alone -> UNKNOWN), but the word is reported")
def _():
    r = run([D(W("Allegro")) + BAR_C])
    assert r["spans"][0]["qpm"] == "UNKNOWN" and r["opening_word"] == "allegro", r
    assert r["tempo_words"][0]["bar_index"] == 0 and r["tempo_words"][0]["opening"]


@case("tempo words: whole word only (Allegretto is not allegro), case-blind, a later word is not the opening one")
def _():
    r = run([D(W("Allegretto")) + BAR_C, D(W("Piu PRESTO")) + BAR_C, D(W("Pallegrox")) + BAR_C])
    assert [w["word"] for w in r["tempo_words"]] == ["allegretto", "presto"], r["tempo_words"]
    assert r["opening_word"] == "allegretto" and [w["opening"] for w in r["tempo_words"]] == [True, False]
    r = run([D(W("Allegro ma non troppo")) + BAR_C])
    assert r["opening_word"] == "allegro"


@case("metronome and word together: number from the metronome, word kept apart")
def _():
    r = run([D(W("Andante") + MET("quarter", 76)) + BAR_C])
    assert qpms(r) == [(0, "0", 76)] and r["opening_word"] == "andante"


@case("fool: music21's invented word (120 -> 'animato') is not reported as a tempo word")
def _():
    r = run([D(MET("quarter", 120)) + BAR_C])
    assert r["tempo_words"] == [] and r["opening_word"] is None


@case("changes: a mid-bar mark (offset 2) in bar 3, and one placed by <offset> -> exact positions")
def _():
    r = run([D(MET("quarter", 100)) + BAR_C, BAR_C, N("C") + N("D") + D(MET("quarter", 60)) + N("E") + N("F")])
    assert qpms(r) == [(0, "0", 100), (2, "2", 60)], r["spans"]
    r = run([D(MET("quarter", 100)) + BAR_C, N("C") + N("D") + D(MET("quarter", 80), offset=4) + N("E") + N("F")])
    assert qpms(r) == [(0, "0", 100), (1, "3", 80)], r["spans"]


@case("fool (ChatGPT): a first mark after sounding notes is not the opening tempo -> UNKNOWN until it")
def _():
    r = run([BAR_C, D(MET("quarter", 90)) + BAR_C])
    assert qpms(r) == [(0, "0", "UNKNOWN"), (1, "0", 90)] and r["opening"] == "after_notes", r["spans"]
    # a mid-bar mark after the first note too
    r = run([N("C") + D(MET("quarter", 90)) + N("D") * 3])
    assert qpms(r) == [(0, "0", "UNKNOWN"), (0, "1", 90)], r["spans"]


@case("a mark after a rest-only first bar still governs from the start (no printed note before it)")
def _():
    r = run([R(dur=16, typ="whole"), D(MET("quarter", 90)) + BAR_C], parts=[("Piano", 1)],
            first_attrs=attrs(staves=1, clefs=(("G", 2),)))
    assert qpms(r) == [(0, "0", 90)] and r["opening"] == "at_start", r["spans"]


@case("pickup bar: a mark at the pickup's first note is the opening")
def _():
    r = run([D(MET("quarter", 90)) + N("G"), BAR_C], first_attrs=attrs(time=("4", "4")), implicit_first=True)
    assert qpms(r) == [(0, "0", 90)] and r["opening"] == "at_start"


@case("staff handling: a mark on staff 2 only is found; a mark with no staff (copied to both staves) is one span")
def _():
    r = run([D(MET("quarter", 90), staff=2) + BAR_C + back(4) + BAR_LH])
    assert qpms(r) == [(0, "0", 90)], r["spans"]
    r = run([D(MET("quarter", 90)) + BAR_C + back(4) + BAR_LH])
    assert qpms(r) == [(0, "0", 90)]


@case("two one-staff parts both carrying the same mark -> one span")
def _():
    two = dict(parts=[("Right Hand", 1), ("Left Hand", 1)])
    r = run([[D(MET("quarter", 90)) + BAR_C], [D(MET("quarter", 90)) + N("C", 3, dur=16, typ="whole")]], **two)
    assert qpms(r) == [(0, "0", 90)]


@case("hidden metronome (print-object=no) is still read, with printed False")
def _():
    r = run([D(MET("quarter", 90, print_obj="no")) + BAR_C])
    assert r["spans"][0]["qpm"] == 90 and r["spans"][0]["printed"] is False


@case("file with a metronome mark: later sound-only marks (rit. ramps) are listed apart and do not start spans")
def _():
    r = run([D(MET("quarter", 85), sound=SND(85)) + BAR_C, D(W("rit."), sound=SND(70)) + BAR_C])
    assert qpms(r) == [(0, "0", 85)] and r["sound_only_marks"] == [{"bar_index": 1, "offset": "0", "sound_qpm": 70}], r


@case("file with a metronome mark: a sound-only value before it is not the opening -> UNKNOWN until the mark")
def _():
    r = run([D(W("x"), sound=SND(158)) + BAR_C, D(MET("quarter", 100)) + BAR_C])
    assert qpms(r) == [(0, "0", "UNKNOWN"), (1, "0", 100)] and r["sound_only_marks"][0]["sound_qpm"] == 158, r


@case("standalone <sound tempo> child of the measure is read (no direction)")
def _():
    r = run([SND(77) + BAR_C])
    assert qpms(r) == [(0, "0", 77)] and r["source"] == "sound tempo"


@case("typed tempo (a note symbol = 105 as words) is listed, not turned into a number")
def _():
    r = run([D(W("Allegro (♩ = 105)")) + BAR_C])
    assert r["spans"][0]["qpm"] == "UNKNOWN" and r["typed_equations"][0]["text"] == "Allegro (♩ = 105)", r


@case("gap patched: words with their own sound tempo (144) and a metronome with its own (138) at one place -> the metronome's own sound is compared")
def _():
    r = run([D(W("Allegro"), sound=SND(144)) + D(MET("half", 69), sound=SND(138)) + BAR_C])
    s = r["spans"][0]
    assert s["qpm"] == 138 and s["sound_qpm"] == 138 and not s["disagree"], s
    r = run([D(MET("half", 69), sound=SND(138)) + D(W("Allegro"), sound=SND(144)) + BAR_C])   # other order
    s = r["spans"][0]
    assert s["qpm"] == 138 and s["sound_qpm"] == 138 and not s["disagree"], s
    r = run([D(W("Allegro"), sound=SND(144)) + D(MET("quarter", 100), sound=SND(100)) + BAR_C])
    assert r["spans"][0]["sound_qpm"] == 100 and not r["spans"][0]["disagree"], r["spans"]


@case("fool: two different metronome marks at one place (quarter = 120 and quarter = 100) -> UNKNOWN, both values shown")
def _():
    r = run([D(MET("quarter", 120)) + D(MET("quarter", 100)) + BAR_C])
    s = r["spans"][0]
    assert s["qpm"] == "UNKNOWN" and s["metronome_qpms"] == [100, 120], s
    # the same mark written twice (both staves, or repeated) is one value
    r = run([D(MET("quarter", 120)) + D(MET("quarter", 120)) + BAR_C])
    assert r["spans"][0]["qpm"] == 120


@case("result is JSON-serialisable")
def _():
    import json
    json.dumps(run([D(MET("quarter", 132), sound=SND(100)) + BAR_C, D(W("Allegro")) + BAR_C]))


# Known music21 gap, measured at 0 files in our 842 (see the top of e25_tempo.py) and NOT patched. Pinned so a music21
# change shows up here; it is not a claim that the behaviour is right.
@case("known gap (pinned): <beat-unit-tied> is dropped by music21, so quarter+eighth = 60 reads as quarter = 60")
def _():
    tied = ("<metronome><beat-unit>quarter</beat-unit><beat-unit-tied><beat-unit>eighth</beat-unit></beat-unit-tied>"
            "<per-minute>60</per-minute></metronome>")
    r = run([D(tied) + BAR_C])
    assert r["spans"][0]["qpm"] == 60


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
