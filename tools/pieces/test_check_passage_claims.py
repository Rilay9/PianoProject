"""Tests for tools/pieces/check_passage_claims.py. Run:  python tools/pieces/test_check_passage_claims.py

Part A: the statement reader and the deciders on hand-made row answers (pass, fail, and fooling cases).
Part B: 8 cases taken from the answer key (build/pieces/chatgpt-121-135-check.md, task 3), 4 FALSE and 4 TRUE,
each confirmed in the MusicXML itself by a separate ElementTree reading (the `raw_*` helpers below do not use
music21 or the rows) and then run through the script. Part B needs build/pieces/chatgpt-bundle and is skipped without it.
The passage texts in part B are ChatGPT's, copied from its passages CSV.
"""
import glob
import os
import re
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import check_passage_claims as C  # noqa: E402

BUNDLE = os.path.join(ROOT, "build", "pieces", "chatgpt-bundle")


# ---------------------------------------------------------------------------------------------------------
# helpers for part A: row answers made by hand
# ---------------------------------------------------------------------------------------------------------
def e11(types=None, rests=None, whole=0, dotted=0):
    return {"notes_by_type": dict(types or {}), "rests_by_type": dict(rests or {}), "whole_bar_rests": whole, "dotted": dotted}


def e12(d8=0, d4=0):
    return {"dotted_eighth_sixteenth": d8, "dotted_quarter_eighth": d4, "dotted_eighth_sixteenth_then_rest": 0,
            "dotted_quarter_eighth_then_rest": 0, "bars": []}


def facts(first, last, bar_rows=None, rows=None, ctx=None):
    """Facts from hand-made answers. bar_rows: {bar: {"E11": {1: ..., 2: ...}, ...}} (staff keys as ints)."""
    pb = {}
    for b in range(first, last + 1):
        pb[str(b)] = {}
        for rid, per in ((bar_rows or {}).get(b) or {}).items():
            pb[str(b)][rid] = {str(k): v for k, v in per.items()} if rid in ("E11", "E12", "E36", "E39") else per
    base = {"E11": {"1": e11(), "2": e11()}}
    base.update(rows or {})
    return C.Facts({"rows": base, "ctx": ctx or {}, "bars": pb}, first, last)


def items_of(text):
    return [it for _, its in C.statement_items(text) for it in its]


def one(F, text, topic):
    its = [i for i in items_of(text) if i.topic == topic]
    assert its, f"no {topic} item in {text!r}"
    return C.decide(F, its[0])


class TestReader(unittest.TestCase):
    def test_abbreviations_do_not_end_statements(self):
        st = [s for s, _ in C.statement_items("printed p leads through cresc. and a rall. in m7.")]
        self.assertEqual(len(st), 1)

    def test_broken_dash_and_range(self):
        its = items_of("LH moves into eighths around m4�8 here")
        v = [i for i in its if i.topic == "value"][0]
        self.assertEqual(v.scope, (4, 8))
        its = items_of("m5–12 both hands switch toward block-chord attacks")
        self.assertEqual([i for i in its if i.topic == "chord"][0].scope, (5, 12))

    def test_second_half_is_not_a_note_value(self):
        self.assertEqual([i for i in items_of("The second half opens quietly") if i.topic == "value"], [])
        self.assertIn("half", [i.params["value"] for i in items_of("RH half notes") if i.topic == "value"])

    def test_dotted_quarter_is_not_a_plain_quarter(self):
        its = items_of("a dotted-quarter and short eighth response")
        self.assertEqual([i.params["value"] for i in its if i.topic == "value"], ["eighth"])
        self.assertTrue([i for i in its if i.topic == "dotted"])

    def test_hand_follows_the_nearest_hand_word(self):
        its = items_of("The RH moves in even eighth groups, while the LH holds whole-note sonorities")
        by = {i.params["value"]: i.hand for i in its if i.topic == "value"}
        self.assertEqual(by["eighth"], 1)
        self.assertEqual(by["whole"], 2)

    def test_value_spellings(self):
        for w in ("semiquaver", "sixteenth", "16th"):
            self.assertEqual([i.params["value"] for i in items_of(f"quick {w} runs") if i.topic == "value"], ["16th"])
        self.assertEqual([i.params["value"] for i in items_of("eight-note pick-ups") if i.topic == "value"], ["eighth"])

    def test_statement_without_item_is_listed_as_uncheckable(self):
        rec = {"passage_id": "x", "musical_notation_observation": "The melody climbs with great charm.", "teaching_passage_title": "Title"}
        rows, _ = C.check_passage(rec, facts(1, 4))
        self.assertTrue(rows and all(r["verdict"] == C.UNCHECK for r in rows))

    def test_then_and_before_end_a_statement(self):
        st = [s for s, _ in C.statement_items("upper staff shifts to treble then back to bass within the opening")]
        self.assertEqual(len(st), 2)

    def test_a_bar_named_once_goes_to_one_event(self):
        its = items_of("printed p leads through cresc. and a rall. in m7")
        by = {i.label: i.event_bar for i in its}
        self.assertEqual(by["printed 'rall'"], 7)
        self.assertIsNone(by["cresc"])
        its = items_of("After dimin. at m90 and p m91 the RH reuses motifs")
        by = {i.label: i.event_bar for i in its}
        self.assertEqual(by["dimin"], 90)
        self.assertEqual(by["dynamic p"], 91)

    def test_a_bar_taken_by_a_mark_does_not_scope_the_music(self):
        v = [i for i in items_of("after many 16ths there is a Poco rit. at m46") if i.topic == "value"][0]
        self.assertIsNone(v.scope)

    def test_by_a_bar_says_nothing_about_where_the_music_is(self):
        v = [i for i in items_of("by m34 forte the RH begins lengthy sixteenth runs") if i.topic == "scalar"][0]
        self.assertIsNone(v.scope)

    def test_repeat_like_is_not_a_repeat_sign(self):
        self.assertEqual([i for i in items_of("Final repeat-like material") if i.topic == "repeat"], [])
        self.assertTrue([i for i in items_of("a final backward repeat at m61") if i.topic == "repeat"])

    def test_hand_is_the_one_just_before_or_just_after_not_one_later(self):
        its = items_of("a chord response above changing bass figures")
        self.assertIsNone([i for i in its if i.topic == "chord"][0].hand)
        its = items_of("small gestures respond to punctuated left chords")
        self.assertEqual([i for i in its if i.topic == "chord"][0].hand, 2)
        its = items_of("RH half notes supported by three-note tuplet LH groups")
        self.assertEqual([i for i in its if i.topic == "tuplet"][0].hand, 2)

    def test_hand_is_not_carried_over_a_semicolon_or_a_while(self):
        its = items_of("RH moves in eighth groups; m7 adds short 16th motion")
        self.assertIsNone([i for i in its if i.topic == "value" and i.params["value"] == "16th"][0].hand)
        its = items_of("light LH support, while cresc. leads to a broad scale response")
        self.assertIsNone([i for i in its if i.topic == "scalar"][0].hand)
        its = items_of("runs through ascending semiquavers over sparer bass")
        self.assertIsNone([i for i in its if i.topic == "value"][0].hand)

    def test_accidentals_take_a_hand_only_when_it_is_next_to_them(self):
        its = items_of("LH alternates triplets and held notes, with chromatic alterations")
        self.assertIsNone([i for i in its if i.topic == "accidental"][0].hand)

    def test_tonic_chord_and_time_signature_reading(self):
        its = items_of("a 6/8 phrase with 3:2 groups")
        self.assertEqual([i.params["sig"] for i in its if i.topic == "time"], ["6/8"])


class TestValues(unittest.TestCase):
    def bars(self, per_bar):
        return {b: {"E11": {1: e11({"16th": 8}), 2: e11(x[0], rests=x[1])}, "E12": {1: e12(), 2: e12(*x[2:])}}
                for b, x in per_bar.items()}

    def test_continuous_sixteenths_pass_and_fail(self):
        every = self.bars({b: ({"16th": 8}, {}) for b in range(1, 9)})
        F = facts(1, 8, every)
        self.assertEqual(one(F, "the LH has continuous 16th pulses", "value").verdict, C.TRUE)
        two = self.bars({b: ({"16th": 8} if b in (1, 5) else {"eighth": 4}, {}) for b in range(1, 9)})
        self.assertEqual(one(facts(1, 8, two), "the LH has continuous 16th pulses", "value").verdict, C.FALSE)

    def test_a_few_sixteenths_do_not_make_them_continuous_but_do_exist(self):
        two = self.bars({b: ({"16th": 8} if b in (1, 5) else {"eighth": 4}, {}) for b in range(1, 9)})
        F = facts(1, 8, two)
        self.assertEqual(one(F, "the LH has 16th groups", "value").verdict, C.TRUE)

    def test_fool_dotted_pairs_are_not_eighths(self):
        pairs = self.bars({b: ({"eighth": 2, "16th": 2}, {}, 2, 0) for b in range(4, 9)})
        F = facts(4, 8, pairs)
        self.assertEqual(one(F, "the LH moves into broken eighths", "value").verdict, C.FALSE)
        plain = self.bars({b: ({"eighth": 4}, {}) for b in range(4, 9)})
        self.assertEqual(one(facts(4, 8, plain), "the LH moves into broken eighths", "value").verdict, C.TRUE)

    def test_fool_one_sixteenth_in_a_bar_of_quarters(self):
        mostly_q = self.bars({b: ({"quarter": 3, "16th": 1}, {}) for b in range(1, 5)})
        self.assertEqual(one(facts(1, 4, mostly_q), "the LH has continuous 16th pulses", "value").verdict, C.FALSE)

    def test_hand_selects_the_staff(self):
        F = facts(1, 4, {b: {"E11": {1: e11({"16th": 8}), 2: e11({"quarter": 2})}, "E12": {1: e12(), 2: e12()}} for b in range(1, 5)})
        self.assertEqual(one(F, "the LH has quarters", "value").verdict, C.TRUE)
        self.assertEqual(one(F, "the LH has 16ths", "value").verdict, C.FALSE)
        self.assertEqual(one(F, "the RH has 16ths", "value").verdict, C.TRUE)

    def test_dotted_in_the_claim_keeps_the_dotted_eighths_as_eighths(self):
        pairs = self.bars({b: ({"eighth": 2, "16th": 2}, {}, 2, 0) for b in range(1, 5)})
        F = facts(1, 4, pairs)
        self.assertEqual(one(F, "the RH has dotted-looking gestures in sixteenths/eighths", "value").verdict, C.TRUE)

    def test_half_and_quarter_are_one_set_when_a_share_is_asked(self):
        mix = {b: {"E11": {1: e11(), 2: e11({"half": 1, "quarter": 1} if b < 5 else {"eighth": 4})}, "E12": {1: e12(), 2: e12()}} for b in range(1, 9)}
        F = facts(1, 8, mix)
        its = [i for i in items_of("the LH is mainly half and quarter notes") if i.topic == "value"]
        self.assertEqual(its[0].params["group"], ("half", "quarter"))
        self.assertEqual(C.decide(F, its[0]).verdict, C.TRUE)  # 4 of 8 bars are half+quarter bars: 50% reaches 'mainly'
        self.assertEqual(C.decide(F, its[1]).verdict, C.TRUE)

    def test_bar_outside_the_passage_is_uncheckable(self):
        F = facts(1, 4, {b: {"E11": {1: e11({"16th": 8}), 2: e11()}, "E12": {1: e12(), 2: e12()}} for b in range(1, 5)})
        self.assertEqual(one(F, "the RH has 16th groups in m20-24", "value").verdict, C.UNCHECK)


class TestMarks(unittest.TestCase):
    def e20(self, *marks):
        return {"E20": {"marks": [{"value": v, "staff": 1, "bar_index": int(b) - 1, "bar": str(b), "offset": "0"} for v, b in marks]}}

    def test_dynamic_at_a_bar(self):
        F = facts(1, 12, rows=self.e20(("f", 1)))
        self.assertEqual(one(F, "marked f at m1", "dynamic").verdict, C.TRUE)
        self.assertEqual(one(F, "marked f at m5", "dynamic").verdict, C.FALSE)
        self.assertEqual(one(F, "marked f at m30", "dynamic").verdict, C.UNCHECK)

    def test_dynamic_punctuation_in_a_range_with_no_marks(self):
        F = facts(1, 12, rows=self.e20(("f", 1)))
        self.assertEqual(one(F, "in m5-12 firm dynamic punctuation", "dynamic").verdict, C.FALSE)

    def test_soft_with_only_loud_marks_is_false_and_with_none_is_unchecked(self):
        self.assertEqual(one(facts(1, 4, rows=self.e20(("f", 1))), "a soft passage", "dynlevel").verdict, C.FALSE)
        self.assertEqual(one(facts(1, 4, rows=self.e20()), "a soft passage", "dynlevel").verdict, C.UNCHECK)
        self.assertEqual(one(facts(1, 4, rows=self.e20(("p", 1))), "a soft passage", "dynlevel").verdict, C.TRUE)

    def test_hairpin_word_at_bar(self):
        bars = {3: {"E21": {"hairpins": [], "unclosed": [], "words": ["cresc."]}}}
        F = facts(1, 7, bars)
        self.assertEqual(one(F, "leads through cresc. m3", "hairpin").verdict, C.TRUE)
        self.assertEqual(one(F, "leads through cresc. m5", "hairpin").verdict, C.FALSE)
        self.assertEqual(one(facts(1, 7), "shorter crescendos", "hairpin").verdict, C.FALSE)

    def test_printed_word_and_uncued_legato(self):
        bars = {1: {"E25": {"tempo_words": [{"text": "Allegretto", "bar": "1"}]}, "E26": {"changes": [], "other_words": {"dolce": 1}}}}
        F = facts(1, 4, bars)
        self.assertEqual(one(F, "Allegretto theme", "word").verdict, C.TRUE)
        self.assertEqual(one(F, "Allegro theme", "word").verdict, C.FALSE)
        self.assertEqual(one(F, "a soft legato passage", "word").verdict, C.UNCHECK)  # not said to be printed, no slurs

    def test_repeat_and_jump(self):
        e31 = {"repeats": [{"bar": "9", "side": "right", "direction": "backward"}], "marks": [{"kind": "da_capo", "bar": "12"}]}
        F = facts(5, 12, rows={"E31": e31})
        self.assertEqual(one(F, "the first backward repeat at m9", "repeat").verdict, C.TRUE)
        self.assertEqual(one(F, "a forward repeat at m9", "repeat").verdict, C.FALSE)
        self.assertEqual(one(F, "the final silent bar m12 contains D.C.", "jump").verdict, C.TRUE)

    def test_clef_change_and_state(self):
        e03 = {"start": {"1": "G/2/0", "2": "F/4/0"}, "changes": [{"staff": 2, "bar": "8", "from": "F/4/0", "to": "G/2/0"}]}
        F = facts(8, 12, ctx={"E03": e03})
        self.assertEqual(one(F, "At m8 the lower staff switches to treble clef", "clef").verdict, C.TRUE)
        self.assertEqual(one(F, "At m9 the lower staff switches to treble clef", "clef").verdict, C.FALSE)
        self.assertEqual(one(F, "the upper staff shifts to bass clef", "clef").verdict, C.FALSE)

    def test_key_change(self):
        e06 = {"start": {"1": {"fifths": 0}}, "changes": [{"staff": 1, "bar": "25", "from": {"fifths": 0}, "to": {"fifths": -1}}]}
        F = facts(25, 32, ctx={"E06": e06})
        self.assertEqual(one(F, "The key signature changes to one flat at m25", "key").verdict, C.TRUE)
        self.assertEqual(one(F, "The key signature changes to one sharp at m25", "key").verdict, C.FALSE)


class TestTexture(unittest.TestCase):
    def e36(self, staff_sizes):
        return {b: {"E36": {s: {"per_staff": sz} for s, sz in per.items()}} for b, per in staff_sizes.items()}

    def test_block_chords_need_three_notes(self):
        dy = self.e36({b: {1: {"2": 4}, 2: {"1": 3}} for b in range(5, 13)})
        F = facts(5, 12, dy)
        self.assertEqual(one(F, "in m5-12 both hands switch toward block-chord attacks", "chord").verdict, C.FALSE)
        tri = self.e36({b: {1: {"3": 2}, 2: {"3": 1}} for b in range(5, 13)})
        self.assertEqual(one(facts(5, 12, tri), "in m5-12 both hands switch toward block-chord attacks", "chord").verdict, C.TRUE)

    def test_both_hands_needs_both_staves(self):
        one_hand = self.e36({b: {1: {"3": 2}, 2: {"1": 3}} for b in range(5, 13)})
        self.assertEqual(one(facts(5, 12, one_hand), "both hands play block chords", "chord").verdict, C.FALSE)

    def test_scalar_needs_steps_and_not_broken_chord_leaps(self):
        step = {b: {"E11": {1: e11({"16th": 8}), 2: e11({"16th": 8})}, "E39": {1: {"voice_semitones": {"1": 3, "2": 4}}, 2: {"voice_semitones": {"1": 3, "2": 4}}}} for b in range(40, 45)}
        leap = {b: {"E11": {1: e11({"16th": 8}), 2: e11({"16th": 8})}, "E39": {1: {"voice_semitones": {"1": 1, "4": 6}}, 2: {"voice_semitones": {"4": 7}}}} for b in range(40, 45)}
        self.assertEqual(one(facts(40, 44, step), "the left-hand scalar 16ths", "scalar").verdict, C.TRUE)
        self.assertEqual(one(facts(40, 44, leap), "the left-hand scalar 16ths", "scalar").verdict, C.FALSE)

    def test_pickup_figure_is_never_decided(self):
        self.assertEqual(one(facts(1, 4), "the RH has 16th pick-ups", "pickup").verdict, C.UNCHECK)


class TestUnmentioned(unittest.TestCase):
    def test_lists_only_what_the_text_leaves_out(self):
        rows = {"E14": {"1": {"n": 3, "bars": ["11", "15"]}, "2": {"n": 0, "bars": []}}}
        F = facts(10, 16, rows=rows)
        _, um = C.check_passage({"passage_id": "x", "musical_notation_observation": "plain quarters", "teaching_passage_title": ""}, F)
        self.assertTrue([u for u in um if u["row"] == "E14"])
        _, um = C.check_passage({"passage_id": "x", "musical_notation_observation": "with grace notes", "teaching_passage_title": ""}, F)
        self.assertFalse([u for u in um if u["row"] == "E14"])


# ---------------------------------------------------------------------------------------------------------
# part B: answer-key cases, confirmed in the XML by a reading that does not use music21 or the rows
# ---------------------------------------------------------------------------------------------------------
def raw_measures(number):
    p = glob.glob(os.path.join(BUNDLE, f"{number}_*", "score.musicxml"))[0]
    return ET.parse(p).getroot().find("part").findall("measure")


def raw_types(ms, bar, staff):
    c = Counter()
    for n in ms[bar - 1].findall("note"):
        if n.find("grace") is not None or n.find("rest") is not None or n.find("chord") is not None:
            continue
        if int(n.findtext("staff") or 1) == staff:
            c[n.findtext("type") + "." * len(n.findall("dot")) + ("~tuplet" if n.find("time-modification") is not None else "")] += 1
    return c


def raw_dirs(ms, bar):
    out = []
    for d in ms[bar - 1].findall("direction"):
        out += [("words", w.text) for w in d.iter("words")]
        out += [("wedge", w.get("type")) for w in d.iter("wedge")]
        dy = d.find("direction-type/dynamics")
        if dy is not None:
            out.append(("dyn", dy[0].tag))
        out += [("sound", dict(s.attrib)) for s in d.iter("sound")]
    return out


RECS = {
    "121-01": ("121", 1, 7, "Opening cantabile over whole-note harmony",
               "The RH moves in even eighth groups, under long slurs, while the LH holds widely spaced whole-note sonorities; printed p/dolce lusingando leads through cresc. and a rall. in m7."),
    "122-01": ("122", 1, 8, "Blunt rhythmic character and sudden clef switches",
               "Bold RH/LH figures begin in bass clef with continuous 16th pulses; upper staff shifts to treble then back to bass within the opening and hard accents and sf chords punctuate the repeated gesture."),
    "123-04": ("123", 25, 28, "Tempo-color change, held arrival, and second repeat",
               "The ending explicitly reads più lento then a tempo around high held sonorities before a short closing cadence with backward repeat."),
    "125-01": ("125", 1, 3, "Tranquil melody against LH triplets",
               "RH half and quarter notes in small slurred gestures are supported by *three-note tuplet* LH groups throughout each 3/4 bar; dolce legato is printed."),
    "128-01": ("128", 1, 8, "Allegretto theme and walking LH broken quarters",
               "RH notes alternate small long-short figures and slurred turns, while the LH has four evenly running eighths in G-major repeated across changing shapes."),
    "128-03": ("128", 24, 38, "Quieter second theme and chromatic textural changes",
               "The second half opens with a soft expressive upper turn and LH rests; chromatic altered pitches and more chordal lower accompaniment then give way to low-note answered RH figures and shorter crescendos."),
    "131-01": ("131", 1, 12, "Spiritoso theme: strong chords, swift turn and hand-role contrast",
               "The RH begins with a spirited rhythm and following upward quick note groups while LH provides repeated bass eighth support; in m5–12 both hands switch toward block-chord attacks and firm dynamic punctuation."),
    "135-04": ("135", 43, 53, "Broken-chord figuration, closing Rall. and D.C. instruction",
               "M43–49 move through repeated arpeggiated semiquaver figures and LH broken notes; m51 prints Rall., m52 marks the last sounding chord, and the final silent measure m53 contains D.C., calling a return to the opening until Fine at m28."),
}
_CACHE = {}


def run_passage(pid):
    if pid not in _CACHE:
        number, a, b, title, text = RECS[pid]
        src = glob.glob(os.path.join(BUNDLE, f"{number}_*", "score.musicxml"))[0]
        tmp = tempfile.mkdtemp(prefix="passclaims-")
        _, g = C.gather((pid, src, a, b, tmp))
        rec = {"passage_id": pid, "teaching_passage_title": title, "musical_notation_observation": text}
        _CACHE[pid] = C.check_passage(rec, C.Facts(g, a, b))
    return _CACHE[pid]


def verdicts(pid, claim_rx, item_rx=""):
    rows, _ = run_passage(pid)
    return [r["verdict"] for r in rows if re.search(claim_rx, r["claim_text"]) and re.search(item_rx, r["item"])]


@unittest.skipUnless(glob.glob(os.path.join(BUNDLE, "121_*", "score.musicxml")), "chatgpt-bundle scores not on this machine")
class TestAnswerKeyCases(unittest.TestCase):
    # ---- four the key judged FALSE
    def test_false_122_01_continuous_16ths(self):
        ms = raw_measures(122)  # XML: 16ths only in bars 1 and 5 on both staves; the rest eighths, one quarter in 4 and 8
        for staff in (1, 2):
            self.assertEqual({b for b in range(1, 9) if raw_types(ms, b, staff).get("16th")}, {1, 5})
        self.assertEqual(verdicts("122-01", r"continuous 16th", r"16th"), [C.FALSE])

    def test_false_128_01_title_walking_LH_quarters(self):
        ms = raw_measures(128)  # XML: the lower staff is eighths in every bar of 1-8 (m1 a rest, m7 three eighths and a rest), no quarter
        self.assertEqual({k for b in range(1, 9) for k in raw_types(ms, b, 2)}, {"eighth"})
        self.assertEqual(verdicts("128-01", r"LH broken quarters", r"quarter"), [C.FALSE])

    def test_false_131_01_dynamic_punctuation(self):
        ms = raw_measures(131)  # XML: bar 1 has f; bars 2-12 carry no dynamic, wedge or dynamic word
        self.assertEqual([d for b in range(5, 13) for d in raw_dirs(ms, b)], [])
        self.assertEqual(verdicts("131-01", r"firm dynamic punctuation", r"dynamic marks"), [C.FALSE])

    def test_false_128_03_shorter_crescendos(self):
        ms = raw_measures(128)  # XML bars 24-38: only p (24), f (34), p (38); no wedge and no cresc. word
        found = [d for b in range(24, 39) for d in raw_dirs(ms, b) if d[0] in ("wedge",) or (d[0] == "words" and d[1] and "cresc" in d[1].lower())]
        self.assertEqual(found, [])
        self.assertEqual(verdicts("128-03", r"shorter crescendos", r"cresc"), [C.FALSE])

    # ---- four the key judged TRUE
    def test_true_121_01_cresc_rall_and_p(self):
        ms = raw_measures(121)  # XML: p at 1, "cresc." at 3, "dimin." at 6, "rall." at 7
        self.assertIn(("words", "cresc."), raw_dirs(ms, 3))
        self.assertIn(("words", "rall."), raw_dirs(ms, 7))
        self.assertEqual(verdicts("121-01", r"cresc\. and a rall", r"cresc"), [C.TRUE])
        self.assertEqual(verdicts("121-01", r"cresc\. and a rall", r"rall"), [C.TRUE])
        self.assertEqual(verdicts("121-01", r"printed p", r"dynamic p"), [C.TRUE])

    def test_true_125_01_triplets_in_every_bar_of_the_lower_staff(self):
        ms = raw_measures(125)  # XML: lower staff nine tuplet eighths in each of bars 1-3, upper staff half + quarter
        for b in (1, 2, 3):
            self.assertEqual(dict(raw_types(ms, b, 2)), {"eighth~tuplet": 9})
        self.assertEqual(verdicts("125-01", r"three-note tuplet", r"tuplets"), [C.TRUE])

    def test_true_135_04_rall_and_dc(self):
        ms = raw_measures(135)  # XML: "Rall." in bar 51, "D.C." with sound dacapo in bar 53
        self.assertIn(("words", "Rall."), raw_dirs(ms, 51))
        self.assertTrue(any(d[0] == "sound" and d[1].get("dacapo") == "yes" for d in raw_dirs(ms, 53)))
        self.assertEqual(verdicts("135-04", r"m51 prints Rall", r"rall"), [C.TRUE])
        self.assertEqual(verdicts("135-04", r"contains D\.C", r"da_capo"), [C.TRUE])

    def test_true_123_04_piu_lento_a_tempo_and_repeat(self):
        ms = raw_measures(123)  # XML: "più lento" in bar 25, "a tempo" in 26, backward repeat on the right of 28
        self.assertTrue(any(d[0] == "words" and d[1] and d[1].endswith("lento") for d in raw_dirs(ms, 25)))
        self.assertIn(("words", "a tempo"), raw_dirs(ms, 26))
        self.assertTrue(any(b.find("repeat") is not None and b.find("repeat").get("direction") == "backward" for b in ms[27].findall("barline")))
        self.assertEqual(verdicts("123-04", r"explicitly reads", r"lento"), [C.TRUE])
        self.assertEqual(verdicts("123-04", r"explicitly reads|a tempo", r"a tempo"), [C.TRUE])
        self.assertEqual(verdicts("123-04", r"backward repeat", r"repeat"), [C.TRUE])


if __name__ == "__main__":
    unittest.main(verbosity=2)
