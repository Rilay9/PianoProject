"""Hand-made cases for rows E33 onwards (kept apart from test_characteristics.py so parallel row builders never edit
the same file). Builders are imported from test_characteristics. Usage: python tools/pieces/characteristics/test_e33_e46.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from test_characteristics import N, R, D, back, fwd, attrs, score, BAR_C, BAR_LH  # noqa: E402,F401

CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("E33 range")
def _():
    from e33_range import pitch_range
    s, _ = score([N("C") + N("D") + N("E") + N("G")])
    r = pitch_range(s)[1]
    assert r["span"] == 7 and r["low"] == 60 and r["high"] == 67
    # fool: printed C6 under an 8va is encoded C7: counted at C7 (96), not shifted again
    s, _ = score([D('<octave-shift type="down" size="8"/>', staff=1) + N("C", 7, dur=16, typ="whole") +
                  D('<octave-shift type="stop" size="8"/>', staff=1)])
    assert pitch_range(s)[1]["high"] == 96
    # grace notes apart; per-bar figures
    s, _ = score([N("C", 6, grace=True, typ="16th") + BAR_C, N("C", 3, dur=16, typ="whole")])
    r = pitch_range(s)[1]
    assert r["high"] == 65 and r["with_grace"]["high"] == 84 and r["low"] == 48
    assert [b["span"] for b in r["per_bar"]] == [5, 0] and r["widest_bar"] == "1"


@case("E34 pitch inventory")
def _():
    from e34_pitch_inventory import pitch_inventory
    s, _ = score(["".join(N(x, dur=2, typ="eighth") for x in "CDEFGABC")])
    assert pitch_inventory(s)[1]["black_share"] == 0 and pitch_inventory(s)[1]["distinct_pitch_classes"] == 7
    # fool: C-E-flat-G chord: 1 of 3 black, counted inside the chord
    s, _ = score([N("C", dur=16, typ="whole") + N("E", alter=-1, chord=True, dur=16, typ="whole") + N("G", chord=True, dur=16, typ="whole")])
    assert pitch_inventory(s)[1]["black_share"] == round(1 / 3, 3)
    # C-flat is a white key; a tie continuation is not struck again; spelling kept apart from MIDI
    s, _ = score([N("C", 5, alter=-1, tie="start", dur=8, typ="half") + N("C", 5, alter=-1, tie="stop", dur=8, typ="half"),
                  N("B", 4, dur=8, typ="half") + N("C", alter=1, dur=8, typ="half")])
    r = pitch_inventory(s)[1]
    assert r["notes"] == 3 and r["black_share"] == round(1 / 3, 3) and r["distinct_pitches"] == 2 and r["distinct_spellings"] == 3


@case("E35 pitch entropy")
def _():
    from e35_pitch_entropy import pitch_entropy
    s, _ = score([N("C") + N("D") + N("C") + N("D")])
    assert pitch_entropy(s)[1]["pitch_entropy"] == 1.0
    s, _ = score([N("C") * 4])
    assert pitch_entropy(s)[1]["pitch_entropy"] == 0
    # fool: four pitches, one taking 97 of 100 notes -> well below 2 bits
    s, _ = score([N("C", dur=1, typ="16th") * 16] * 6 + [N("C", dur=1, typ="16th") + N("D", dur=1, typ="16th") + N("E", dur=1, typ="16th") +
                 N("F", dur=1, typ="16th") + R(dur=12, typ="half", dots=1)])
    r = pitch_entropy(s)[1]
    assert r["notes"] == 100 and r["pitch_entropy"] < 0.3, r
    s, _ = score([N("C", 4) + N("C", 5) + N("C", 4) + N("C", 5)])
    r = pitch_entropy(s)[1]
    assert r["pitch_entropy"] == 1.0 and r["pitch_class_entropy"] == 0


def chord(*ps, dur=16, typ="whole", **kw):
    return "".join(N(p[:-1][0], int(p[-1]), alter=-1 if "b" in p[1:-1] else 1 if "#" in p[1:-1] else None,
                     chord=i > 0, dur=dur, typ=typ, **kw) for i, p in enumerate(ps))


@case("E36 notes struck together")
def _():
    from e36_simultaneous import simultaneous
    s, _ = score([chord("C4", "E4", "G4")])
    assert simultaneous(s)[1]["per_staff"] == {"3": 1}
    s, _ = score([BAR_C])
    assert simultaneous(s)[1]["per_staff"] == {"1": 4}
    # fool: two voices on staff 1 starting a 2-note chord and a single note together -> 3 per staff, 2 and 1 per voice
    s, _ = score([chord("C5", "E5") + back(4) + N("G", 4, voice=2, dur=16, typ="whole")])
    r = simultaneous(s)[1]
    assert r["per_staff"] == {"3": 1} and r["per_voice"] == {"1": 1, "2": 1} and r["largest_in_one_voice"] == 2
    # a unison doubling between voices counts once; a held tie member is not struck again
    s, _ = score([N("E", 5, dur=16, typ="whole") + back(4) + N("E", 5, voice=2, dur=16, typ="whole")])
    r = simultaneous(s)[1]
    assert r["per_staff"] == {"1": 1} and r["unison_doublings"] == 1
    s, _ = score([chord("C4", "G4", dur=8, typ="half", tie="start") + chord("C4", "G4", dur=8, typ="half", tie="stop")])
    assert simultaneous(s)[1]["per_staff"] == {"2": 1}
    # spelled intervals kept apart: F-B (augmented 4th) vs F-C-flat (diminished 5th), both 6 semitones
    s, _ = score([chord("F4", "B4", dur=8, typ="half") + chord("F4", "Cb5", dur=8, typ="half")])
    r = simultaneous(s)[1]
    assert r["two_note_semitones"] == {6: 2} and r["two_note_intervals"] == {"A4": 1, "d5": 1}, r


@case("E37 span")
def _():
    from e37_span import span
    s, _ = score([chord("C4", "C5")])
    assert span(s)[1]["span_max"] == 12
    s, _ = score([BAR_C])
    assert span(s)[1]["span_max"] == 0
    # fool: a tenth marked with an arpeggio sign is reported as rolled, not as a stretch
    a = "<arpeggiate/>"
    s, _ = score([chord("C3", "E4", notations=a)])
    r = span(s)[1]
    assert r["span_max"] == 0 and r["wide_but_rolled"] == 1
    s, _ = score([chord("C3", "E4", dur=8, typ="half") + chord("C3", "D4", dur=8, typ="half")])
    r = span(s)[1]
    assert r["over_12"] == 2 and r["over_14"] == 1 and r["bars_over_14"] == ["1"]
    assert r["span_median"] == 15  # spans 14 and 16: the median of an even count is the mean of the middle two


@case("E38 octaves")
def _():
    from e38_octaves import octaves
    s, _ = score([chord("C3", "C4")])
    assert octaves(s)[1]["octave_dyads"] == 1
    s, _ = score([chord("C3", "G3")])
    r = octaves(s)[1]
    assert r["octave_dyads"] == 0 and r["octave_span_chords"] == 0
    s, _ = score([chord("C3", "E3", "C4")])
    r = octaves(s)[1]
    assert r["octave_dyads"] == 0 and r["octave_span_chords"] == 1  # fool: an octave-doubled triad
    s, _ = score([chord("C3", "G3", "C4", "E4", dur=4, typ="quarter") + chord("D3", "D4", dur=4, typ="quarter") +
                  chord("E3", "E4", dur=4, typ="quarter") + chord("F3", "A3", dur=4, typ="quarter")])
    r = octaves(s)[1]
    assert r["octave_doubling_inside_chord"] == 1 and r["octave_dyads"] == 2 and r["octave_dyad_longest_run"] == 2


@case("E39 movement")
def _():
    from e39_movement import movement
    s, _ = score([N("C") + N("D") + N("E") + R()])
    r = movement(s)[1]
    assert r["edge_intervals"] == {2: 2} and r["jumps_over_12_within_2q"] == 0 and r["voice_directions"] == {"up": 2}
    s, _ = score([N("C") * 4])
    assert movement(s)[1]["edge_largest"] == 0
    s, _ = score([N("C") + N("C", 6) + N("C") + N("C")])
    r = movement(s)[1]
    assert r["jumps_over_12_within_2q"] == 2 and r["edge_intervals"] == {0: 1, "13+": 2} and r["voice_largest"] == 24
    s, _ = score([N("C", 6, dur=8, typ="half") + R(dur=8, typ="half"), R(dur=12, typ="half", dots=1) + N("C", 4)])
    assert movement(s)[1]["jumps_over_12_within_2q"] == 0  # 24 semitones, 5 quarters apart
    # Alberti bass on staff 2: each eighth is one attack, so the bottom line moves with every note (my row's claim
    # that it "stays put" was wrong); the lower of two piano staves uses the bottom edge
    alb = "".join(N(x, o, dur=2, typ="eighth", staff=2) for x, o in [("C", 3), ("G", 3), ("E", 3), ("G", 3)] * 2)
    s, _ = score([N("E", 5, dur=16, typ="whole") + back(4) + alb])
    r = movement(s)[2]
    assert r["edge"] == "bottom" and r["edge_largest"] == 7 and r["voice_generic"] == {3: 4, 5: 3}, r


@case("E40 runs")
def _():
    from e40_runs import runs
    sixteenths = "".join(N(x, dur=1, typ="16th") for x in "CDEFGABC" * 2)
    r = runs(score([sixteenths])[0])[1]
    assert r["equal_value_run"] == 16 and r["repeated_pitch_run"] == 2 and r["equal_value"] == "16th"  # ...B C | C D...
    mixed = N("C", dur=2, typ="eighth") * 4 + N("C") * 2 + N("C", dur=2, typ="eighth") * 2
    r = runs(score([mixed])[0])[1]
    assert r["repeated_pitch_run"] == 8 and r["repeated_pitch"] == [60] and not r["repeated_is_chord"]
    # fool: 8 sixteenths, an eighth rest, 8 sixteenths -> two runs of 8, not 16
    split = "".join(N(x, dur=1, typ="16th") for x in "CDEFGABC") + R(dur=2, typ="eighth") + "".join(N(x, dur=1, typ="16th") for x in "CDEFGA") + R(dur=2, typ="eighth")
    assert runs(score([split])[0])[1]["equal_value_run"] == 8
    # a tie continuation neither extends nor breaks; runs continue across the barline
    s, _ = score([N("C") * 3 + N("C", tie="start"), N("C", tie="stop") + N("C") * 3])
    assert runs(s)[1]["repeated_pitch_run"] == 7
    # a hidden rest (padding) does not break a run
    hid = R(dur=2, typ="eighth").replace("<note>", '<note print-object="no">')
    s, _ = score([N("C", dur=2, typ="eighth") * 3 + hid + N("C", dur=2, typ="eighth") * 2 + N("C", dur=8, typ="half")])
    assert runs(s)[1]["equal_value_run"] == 5
    sl = N("B", notehead="slash") * 4
    s, _ = score([sl, sl])
    assert runs(s)[1]["repeated_pitch_run"] == 0  # slash heads are placeholders, no pitch (ChatGPT's review)


@case("E41 voices")
def _():
    from e41_voices import voices
    s, _ = score([N("C", 5, dur=16, typ="whole") + back(4) + N("E", 4, voice=2, dur=16, typ="whole")])
    r = voices(s)[1]
    assert r["bars_2plus_note_voices"] == 1 and r["max_sounding_voices"] == 2
    s, _ = score([BAR_C])
    assert voices(s)[1]["max_note_voices"] == 1 and voices(s)[1]["max_sounding_voices"] == 1
    # fool: voice 2 holds only a rest - declared, but not a note voice
    s, _ = score([BAR_C + back(4) + R(dur=16, typ="whole", voice=2)])
    r = voices(s)[1]
    assert r["max_declared_voices"] == 2 and r["max_note_voices"] == 1 and r["bars_2plus_note_voices"] == 0
    # two note voices that never overlap in time: 2 note voices, 1 sounding at once
    s, _ = score([N("C", 5, dur=8, typ="half") + R(dur=8, typ="half") + back(4) + R(dur=8, typ="half", voice=2) + N("E", 4, dur=8, typ="half", voice=2)])
    r = voices(s)[1]
    assert r["max_note_voices"] == 2 and r["max_sounding_voices"] == 1


@case("E42 attack rates")
def _():
    from e42_rates import rates
    s, _ = score([N("C", dur=2, typ="eighth") * 8 + back(4) + N("C", 3, dur=8, typ="half", staff=2) * 2])
    r = rates(s)
    assert r["per_staff"][1]["per_quarter"] == 2.0 and r["per_staff"][2]["per_quarter"] == 0.5
    assert r["per_staff"][1]["per_beat"] == 2.0 and r["ratio_staff1_to_staff2"] == 4.0 and r["beat_onset_share"] == 1.0
    # fool: a chord counts as one attack, not three
    s, _ = score([N("C") + N("E", chord=True) + N("G", chord=True) + R(dur=12, typ="half", dots=1)])
    r = rates(s)
    assert r["per_staff"][1]["attacks"] == 1 and r["ratio_staff1_to_staff2"] is None  # staff 2 silent: undefined
    # 6/8: the beat is a dotted quarter; six eighths are 3 per beat, 2 per quarter
    s, _ = score([N("C", dur=2, typ="eighth") * 6], first_attrs=attrs(time=("6", "8")))
    r = rates(s)
    assert r["per_staff"][1]["per_beat"] == 3.0 and r["per_staff"][1]["per_quarter"] == 2.0
    # 5/8 has no fixed beat: per-beat figures are None
    s, _ = score([N("C", dur=2, typ="eighth") * 5], first_attrs=attrs(time=("5", "8")))
    assert rates(s)["per_staff"][1]["per_beat"] is None and rates(s)["bars_with_a_beat"] == 0
    # a one-beat pickup in 3/4 has one beat, on its note
    s, _ = score([N("C"), N("C") * 3], first_attrs=attrs(time=("3", "4")), implicit_first=True)
    r = rates(s)
    assert r["beat_onset_share"] == 1.0 and r["per_staff"][1]["per_beat"] == 1.0


@case("E43 E44 E45 two-staff relations")
def _():
    from e43_shared_attacks import shared_attacks
    from e44_turn_taking import turn_taking
    from e45_hold_and_move import hold_and_move
    s, _ = score([BAR_C + back(4) + BAR_LH])  # melody over a held whole note
    r = shared_attacks(s)
    assert r["shared_attack_share"] == 0.25 and r["bars_both_sound_together"] == 1
    h = hold_and_move(s)["staff_holding"]
    assert h[2]["holds"] == 1 and h[2]["held_quarters"] == "4" and h[1]["holds"] == 0
    s, _ = score([BAR_C + back(4) + R(dur=16, typ="whole", staff=2)])
    r = shared_attacks(s)
    assert r["shared_attack_share"] == 0 and r["bars_both_have_sound"] == 0  # staff 1 alone
    # fool (E43): a staff-2 note tied over the barline sounds in bar 2 but does not attack there
    s, _ = score([BAR_C + back(4) + N("C", 3, dur=16, typ="whole", staff=2, tie="start"),
                  BAR_C + back(4) + N("C", 3, dur=16, typ="whole", staff=2, tie="stop")])
    r = shared_attacks(s)
    assert r["per_bar"][1]["shared_attack_share"] == 0 and r["bars_both_sound_together"] == 2
    assert hold_and_move(s)["staff_holding"][2]["held_quarters"] == "8"  # one 8-quarter hold, not two
    # E44: turns inside one bar
    s, _ = score([N("C") + R() + N("E") + R() + back(4) + R(staff=2) + N("C", 3, staff=2) + R(staff=2) + N("E", 3, staff=2)])
    t = turn_taking(s)
    assert t["turn_taking_bars"] == 1 and hold_and_move(s)["staff_holding"][2]["holds"] == 0
    # E44: a hand-off between bars is not a turn-taking bar
    s, _ = score([BAR_C + back(4) + R(dur=16, typ="whole", staff=2), R(dur=16, typ="whole") + back(4) + BAR_LH])
    t = turn_taking(s)
    assert t["handoffs_between_bars"] == 1 and t["turn_taking_bars"] == 0
    # E44 fool: staff 2 held under staff 1's entry - overlap, not turns
    s, _ = score([R() + N("D") + N("E") + N("F") + back(4) + N("C", 3, dur=8, typ="half", staff=2) + R(dur=8, typ="half", staff=2)])
    assert turn_taking(s)["turn_taking_bars"] == 0
    # E45 fool: staff 2 re-strikes the chord in quarters - no hold
    s, _ = score([BAR_C + back(4) + N("C", 3, staff=2) * 4])
    assert hold_and_move(s)["staff_holding"][2]["holds"] == 0
    # any other layout: UNKNOWN
    s, _ = score([[BAR_C], [N("C", 5) + R(dur=12, typ="half", dots=1)]], parts=[("Violin", 1), ("Piano", 1)])
    assert "UNKNOWN" in shared_attacks(s) and "UNKNOWN" in turn_taking(s) and "UNKNOWN" in hold_and_move(s)


@case("E46 density")
def _():
    from e46_density import density
    s, p = score([N("C", dur=2, typ="eighth") * 6 + N("F", alter=1, dur=2, typ="eighth", acc="sharp") + N("G", alter=1, dur=2, typ="eighth", acc="sharp") +
                  back(4) + BAR_LH, R(dur=16, typ="whole") + back(4) + N("C", 6, dur=16, typ="whole", staff=2)])
    r = density(s, p)
    assert r[1]["max_notes"] == 8 and r[1]["max_accidentals"] == 2 and r[1]["per_bar"][0]["notes_per_quarter"] == 2.0
    assert r[1]["per_bar"][1]["notes"] == 0  # fool: a whole-bar rest gives 0 notes on that staff
    assert r[2]["per_bar"][1]["ledger_notes"] == 1 and r[1]["densest_bars"][0]["bar"] == "1"  # C6 in bass clef needs lines


@case("D01 notes per second")
def _():
    from d01_rate import rate
    mm = lambda u, pm, dot="": D(f"<metronome><beat-unit>{u}</beat-unit>{dot}<per-minute>{pm}</per-minute></metronome>")  # noqa: E731
    s, p = score([mm("quarter", 60) + "".join(N(x, dur=1, typ="16th") for x in "CDEFGABC" * 2)])
    r = rate(s, p)
    assert r[1]["attacks_per_second"] == 4.0 and r["sources_used"] == ["metronome"] and r["known_tempo_share"] == 1.0
    s, p = score([BAR_C])
    assert "UNKNOWN" in rate(s, p)  # no tempo: no default assumed
    # fool: dotted quarter = 60 in 6/8, eighths -> 3 per second, not 2
    s, p = score([mm("quarter", 60, "<beat-unit-dot/>") + "".join(N(x, dur=2, typ="eighth") for x in "CDEFGA")], first_attrs=attrs(time=("6", "8")))
    assert rate(s, p)[1]["attacks_per_second"] == 3.0
    # chords: attacks vs notes; staves together merge simultaneous attacks
    s, p = score([mm("quarter", 120) + (N("C") + N("E", chord=True)) * 4 + back(4) + N("C", 3, dur=8, typ="half", staff=2) * 2])
    r = rate(s, p)
    assert r[1]["attacks_per_second"] == 2.0 and r[1]["notes_per_second"] == 4.0 and r["all"]["attacks_per_second"] == 2.0
    # a lone sound tempo of 120 is UNKNOWN (E25's rule), so no rate
    s, p = score([D("<words></words>", sound='<sound tempo="120"/>') + BAR_C])
    assert "UNKNOWN" in rate(s, p)
    # five bars, the last one dense: no window shorter than 4 bars may win (the old loop scored bar 5 alone)
    sixteenths = "".join(N(x, dur=1, typ="16th") for x in "CDEFGABC" * 2)
    s, p = score([mm("quarter", 60) + N("C", dur=16, typ="whole")] + [N("C", dur=16, typ="whole")] * 3 + [sixteenths])
    r = rate(s, p)[1]
    assert r["densest_4_bars_from"] == "2" and r["densest_4_bars_attacks_per_second"] == round(19 / 16, 2), r
    s, p = score([mm("quarter", 60) + BAR_C])
    assert rate(s, p)[1]["densest_4_bars_attacks_per_second"] is None  # fewer than four bars
    # a unison doubling in two voices is one attack but two note heads
    s, p = score([mm("quarter", 60) + N("C", dur=16, typ="whole") + back(4) + N("C", dur=16, typ="whole", voice=2)])
    r = rate(s, p)[1]
    assert r["attacks_per_second"] == 0.25 and r["notes_per_second"] == 0.5, r


def main():
    only = sys.argv[1:]
    bad = 0
    for name, fn in CASES:
        if only and not any(name.startswith(o) for o in only):
            continue
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
