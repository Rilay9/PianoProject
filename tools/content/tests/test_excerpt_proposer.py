"""
The excerpt proposer's signals (E1 item 5), one case per signal, each red on its adversary; the
ranking that never reads a level (a lowest-difficulty mutant is red).

Over constructed MusicXML parents (`piece`) read by `read_bars`, and positions written as the
bridge writes them (per demand, per printed bar, [upper staff, lower staff]; the every-bar
detectors' bars; each hand's range per bar): the signals are pure functions of the two, so the
cases state both. `demandsOfFiles.test.ts` holds the bridge's positions to `detect.ts`'s located
places; this file holds what the proposer makes of them.

- phrase start: a window starting mid-phrase is not met; the ranking expands it to the phrase
  (adversary 3);
- ending: a window stopping a bar before the cadence is not met and says where the phrase ends
  (adversary 4);
- pickup: an upbeat before the start is included, never severed (adversary 5);
- opportunity and occurrences: the window rule (`perBar` and `minInWindow`), and recurrence
  through the bars rather than a cluster in one;
- the gates: a demand the judging rung has not taught refuses the window (hands together at
  1.5), and the one-hand selection of the same bars passes; the physical gate refuses an
  impossible leap;
- texture and length.
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import excerpt_proposer as P  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
TABLE = json.loads((REPO / "content" / "sources" / "opportunity-density.json").read_text(encoding="utf-8"))
STEP = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def midi(name: str) -> int:
    return (int(name[-1]) + 1) * 12 + STEP[name[0]] + (1 if "#" in name else -1 if "b" in name[1:-1] else 0)


def notes_xml(spec: str, staff: int) -> tuple[str, float]:
    """`"C5:1 r:1 G5:2"` — pitch or `r`, a colon, quarters — as `<note>`s on one staff (divisions 4)."""
    out, total = [], 0.0
    for token in spec.split():
        name, _, length = token.partition(":")
        quarters = float(length)
        duration = int(quarters * 4)
        tie = ""
        if name.endswith("~"):
            name = name[:-1]
            tie = '<tie type="start"/>'
        body = "<rest/>" if name == "r" else (
            f"<pitch><step>{name[0]}</step>{'<alter>1</alter>' if '#' in name else ''}<octave>{name[-1]}</octave></pitch>")
        out.append(f"<note>{body}<duration>{duration}</duration>{tie}<voice>{1 if staff == 1 else 5}</voice><staff>{staff}</staff></note>")
        total += quarters
    return "".join(out), total


def piece(bars: list[tuple[str, str]], *, fifths: int = 0, time: tuple[int, int] = (4, 4),
          rights: dict[int, str] | None = None, lefts: dict[int, str] | None = None) -> str:
    """A two-staff part, one (right, left) pair per bar; `rights`/`lefts` put a barline style on a bar's right or left."""
    measures = []
    for number, (right, left) in enumerate(bars, start=1):
        attributes = ""
        if number == 1:
            attributes = (f"<attributes><divisions>4</divisions><key><fifths>{fifths}</fifths></key><time><beats>{time[0]}</beats>"
                          f"<beat-type>{time[1]}</beat-type></time><staves>2</staves><clef number=\"1\"><sign>G</sign><line>2</line></clef>"
                          "<clef number=\"2\"><sign>F</sign><line>4</line></clef></attributes>")
        upper, length = notes_xml(right, 1)
        lower, _ = notes_xml(left, 2) if left else ("", 0)
        backup = f"<backup><duration>{int(length * 4)}</duration></backup>" if lower else ""
        left_bar = f'<barline location="left"><bar-style>{lefts[number]}</bar-style></barline>' if lefts and number in lefts else ""
        right_bar = f'<barline location="right"><bar-style>{rights[number]}</bar-style></barline>' if rights and number in rights else ""
        measures.append(f'<measure number="{number}">{attributes}{left_bar}{upper}{backup}{lower}{right_bar}</measure>')
    return ("<?xml version=\"1.0\"?><score-partwise version=\"4.0\"><part-list><score-part id=\"P1\"><part-name>Piano</part-name>"
            f"</score-part></part-list><part id=\"P1\">{''.join(measures)}</part></score-partwise>")


def hands_of(bars: list[tuple[str, str]]) -> dict:
    out: dict[str, dict] = {}
    for number, (right, left) in enumerate(bars, start=1):
        row: dict = {}
        for hand, spec in (("R", right), ("L", left)):
            pitches = [midi(t.split(":")[0].rstrip("~")) for t in spec.split() if not t.startswith("r")] if spec else []
            if pitches:
                row[hand] = [min(pitches), max(pitches)]
        if row:
            out[str(number)] = row
    return out


def context(bars: list[tuple[str, str]], positions: dict[str, dict[str, list[int]]], every_bar: dict | None = None,
            level: float = 3.0, item: str = "song.test.phrases", **kw) -> P.ParentContext:
    text = piece(bars, **kw)
    return P.ParentContext(
        entry={"id": item, "type": "song", "level": level, "file": f"scores/{item}.musicxml"},
        path=Path("."), sha="0" * 64, bars=P.read_bars(text),
        positions={"positions": positions, "everyBar": every_bar or {}, "hands": hands_of(bars), "printedBars": len(bars)},
        staves=2,
    )


#: Twelve bars in C, three four-bar phrases: quarters with leaps, each phrase's fourth bar a whole
#: note over the tonic after the dominant in the bass (G2 in bar 3, C3 in bar 4: V–I).
PHRASES = [
    ("C5:1 G5:1 E5:1 C6:1", "C3:4"),
    ("A5:1 E5:1 C5:1 F5:1", "F3:4"),
    ("D5:1 G5:1 B4:1 D5:1", "G2:4"),
    ("C5:4", "C3:4"),
    ("E5:1 C5:1 G5:1 E5:1", "C3:4"),
    ("F5:1 C5:1 A5:1 F5:1", "F3:4"),
    ("G5:1 D5:1 B4:1 G4:1", "G2:4"),
    ("C5:4", "C3:4"),
    ("G5:1 C5:1 E5:1 A5:1", "A2:4"),
    ("F5:1 C5:1 D5:1 G5:1", "D3:4"),
    ("E5:1 C6:1 G5:1 D5:1", "G2:4"),
    ("C5:4", "C3:4"),
]
#: The same phrase shape with the right hand inside a five-finger position (C5 to G5: leaps of a
#: fourth and a fifth, never a hand's shift) over the left hand's whole notes.
NARROW = [
    ("C5:1 G5:1 E5:1 C5:1", "C3:4"),
    ("F5:1 C5:1 G5:1 D5:1", "F3:4"),
    ("D5:1 G5:1 C5:1 F5:1", "G2:4"),
    ("E5:4", "C3:4"),
]
#: The leaps (a fourth or wider) located per bar on the upper staff, read from PHRASES.
LEAPS = {"interval.leap": {"1": [2, 0], "2": [2, 0], "3": [2, 0], "4": [1, 0], "5": [1, 0], "6": [2, 0], "7": [1, 0],
                           "8": [1, 0], "9": [2, 0], "10": [2, 0], "11": [2, 0], "12": [1, 0]},
         "interval.step": {"1": [0, 0]},
         "clef.bass": {str(b): [0, 1] for b in range(1, 13)}}


def window(ctx: P.ParentContext, low: int, high: int, selection: str = "both", target: str = "interval.leap",
           rung: str | None = None, ancestry: dict | None = None, vocabulary: dict | None = None) -> P.Scored:
    return P.score_window(ctx, low, high, selection, [target], (2, 16), TABLE, rung, ancestry or {}, vocabulary or {})


def part(scored: P.Scored, name: str) -> P.Part:
    return next(p for p in scored.parts if p.signal == name)


class PhraseStart(unittest.TestCase):
    def test_3_a_window_starting_mid_phrase_is_not_met(self) -> None:
        ctx = context(PHRASES, LEAPS)
        self.assertFalse(part(window(ctx, 3, 6), "phraseStart").fired, "bar 3 is the middle of the first phrase")
        self.assertTrue(part(window(ctx, 5, 8), "phraseStart").fired, "bar 5 follows bar 4's whole note")
        self.assertIn("after a long note", part(window(ctx, 5, 8), "phraseStart").detail)
        self.assertTrue(part(window(ctx, 1, 4), "phraseStart").fired)

    def test_3_the_ranking_expands_a_mid_phrase_start_to_the_phrase(self) -> None:
        ctx = context(PHRASES, LEAPS)
        ranked = sorted((window(ctx, low, low + size - 1) for size in (4, 5, 6, 7, 8) for low in range(1, 14 - size)),
                        key=P.rank_key)
        self.assertIn(ranked[0].low, (1, 5, 9), f"the best window starts at a phrase: {ranked[0].low}–{ranked[0].high}")
        self.assertIn(ranked[0].high, (4, 8, 12))

    def test_a_double_bar_and_a_rehearsal_less_edition(self) -> None:
        bars = [("C5:1 D5:1 E5:1 F5:1", "C3:4")] * 8
        ctx = context(bars, LEAPS, rights={4: "light-light"})
        self.assertEqual(part(window(ctx, 5, 8), "phraseStart").detail, "a double bar before bar 5")
        self.assertFalse(part(window(ctx, 3, 6), "phraseStart").fired)

    def test_a_long_note_opening_a_marked_phrase_is_not_a_phrase_end(self) -> None:
        """Beyer's No. 38: the repeat sign before bar 9, whose whole note opens the second half."""
        bars = [("G4:4", "G3:4"), ("D5:2 C5:2", "B3:4"), ("B4:1 D5:1 C5:1 A4:1", "G3:4"), ("G4:4", "G3:4"),
                ("A4:4", "C4:4"), ("G4:1 D5:1 C5:1 B4:1", "B3:4"), ("A4:4", "C4:4"), ("D5:1 G4:1 B4:1 A4:1", "B3:4")]
        ctx = context(bars, LEAPS, rights={4: "light-light"})
        start = part(window(ctx, 6, 8), "phraseStart")
        self.assertFalse(start.fired)
        self.assertIn("bar 5 opens the phrase the edition marks", start.detail)
        self.assertTrue(part(window(ctx, 5, 8), "phraseStart").fired)

    def test_the_bass_changing_alone_marks_no_phrase(self) -> None:
        ctx = context(PHRASES, LEAPS)
        start = part(window(ctx, 2, 5), "phraseStart")
        self.assertFalse(start.fired)
        self.assertIn("only the bass changing", start.detail)


class Ending(unittest.TestCase):
    def test_4_a_window_ending_a_bar_before_the_cadence_is_not_met(self) -> None:
        ctx = context(PHRASES, LEAPS)
        short = part(window(ctx, 5, 7), "ending")
        self.assertFalse(short.fired)
        self.assertIn("the phrase ends in bar 8", short.detail)
        full = part(window(ctx, 5, 8), "ending")
        self.assertTrue(full.fired)
        self.assertEqual(full.kind, "resolves")
        self.assertIn("cadence to the tonic", full.detail)

    def test_a_cadence_is_each_tonic_with_its_own_dominant(self) -> None:
        # In F (one flat): C in the bass into D (the relative minor's tonic) is deceptive, not a close.
        bars = [("F5:1 A5:1 C6:1 A5:1", "F3:4"), ("E5:1 G5:1 C6:1 G5:1", "C3:4"), ("F5:4", "D3:4"), ("F5:4", "F3:4")]
        end = part(window(context(bars, LEAPS, fifths=-1), 1, 3), "ending")
        self.assertTrue(end.fired)
        self.assertNotIn("cadence to the tonic", end.detail)
        bars[1] = ("E5:1 G5:1 C6:1 G5:1", "A2:4")
        self.assertIn("cadence to the tonic", part(window(context(bars, LEAPS, fifths=-1), 1, 3), "ending").detail)

    def test_a_half_cadence_is_marked_leading_onward(self) -> None:
        bars = [("C5:1 E5:1 G5:1 E5:1", "C3:4"), ("F5:1 A5:1 F5:1 D5:1", "D3:4"), ("E5:1 C5:1 A4:1 C5:1", "A2:4"), ("D5:4", "G2:4")]
        end = part(window(context(bars, LEAPS), 1, 4), "ending")
        self.assertEqual(end.signal, "ending")
        self.assertTrue(end.fired, "the piece's last bar")
        bars.append(("C5:4", "C3:4"))
        end = part(window(context(bars, LEAPS), 1, 4), "ending")
        self.assertEqual((end.kind, end.fired), ("leads-onward", True))
        self.assertIn("half cadence", end.detail)

    def test_a_tune_in_half_notes_is_not_ending_at_each_of_them(self) -> None:
        """Beyer's No. 38 as the corpus has it: D5 C5 in halves mid-phrase; the phrase ends on a whole note."""
        bars = [("G4:4", "G3:4"), ("D5:2 C5:2", "B3:4"), ("B4:1 D5:1 C5:1 A4:1", "G3:4"), ("G4:4", "G3:4")]
        self.assertFalse(part(window(context(bars + [("A4:4", "C4:4")], LEAPS), 1, 2), "ending").fired)
        self.assertTrue(part(window(context(bars + [("A4:4", "C4:4")], LEAPS), 1, 4), "ending").fired)
        # A half note longer than the rest of its bar is a long note.
        bars[1] = ("D5:1 C5:1 B4:2", "B3:4")
        self.assertTrue(part(window(context(bars + [("A4:4", "C4:4")], LEAPS), 1, 2), "ending").fired)

    def test_a_tie_out_of_the_last_bar_is_no_ending(self) -> None:
        bars = [("C5:1 D5:1 E5:1 F5:1", "C3:4"), ("G5:2 G5~:2", "C3:4"), ("G5:4", "C3:4"), ("C5:4", "C3:4")]
        self.assertFalse(part(window(context(bars, LEAPS), 1, 2), "ending").fired)


class Pickup(unittest.TestCase):
    def test_5_the_pieces_pickup_is_included_never_severed(self) -> None:
        bars = [("G4:1", "r:1")] + PHRASES[:8]
        ctx = context(bars, LEAPS)
        # Bar 1 is short: one beat before the first full bar.
        self.assertTrue(P.is_pickup_bar(ctx.bars[0]))
        severed = part(window(ctx, 2, 5), "pickup")
        self.assertFalse(severed.fired)
        self.assertIn("bar 1 is the piece's pickup", severed.detail)
        self.assertTrue(part(window(ctx, 1, 5), "pickup").fired)

    def test_5_an_upbeat_mid_piece_is_included(self) -> None:
        bars = [("C5:1 E5:1 G5:1 E5:1", "C3:4"), ("F5:1 D5:1 B4:1 D5:1", "G2:4"), ("E5:1 G5:1 C6:1 G5:1", "C3:4"),
                ("C5:2 r:1 G4:1", "C3:4"), ("C5:1 E5:1 G5:1 E5:1", "C3:4"), ("F5:1 D5:1 B4:1 D5:1", "G2:4"),
                ("E5:1 G5:1 C6:1 G5:1", "C3:4"), ("C5:4", "C3:4")]
        ctx = context(bars, LEAPS)
        self.assertFalse(part(window(ctx, 5, 8), "pickup").fired, "bar 4's last beat leads into bar 5")
        self.assertIn("an upbeat in bar 4 leads into bar 5", part(window(ctx, 5, 8), "pickup").detail)
        self.assertTrue(part(window(ctx, 4, 8), "pickup").fired)
        # Bar 4 opens with the previous phrase's half note before its rest and upbeat: the pickup is
        # present, and the start is not a clean one (a cut is whole bars).
        start = part(window(ctx, 4, 8), "phraseStart")
        self.assertFalse(start.fired)
        self.assertIn("cannot start at the upbeat", start.detail)
        # With a rest where the half note was, bar 4 is a clean pickup bar and the start is met.
        bars[3] = ("r:3 G4:1", "C3:4")
        self.assertTrue(part(window(context(bars, LEAPS), 4, 8), "phraseStart").fired)


class OpportunityAndOccurrences(unittest.TestCase):
    def test_the_window_rule_reads_per_bar_and_the_window_minimum(self) -> None:
        rule = TABLE["demands"]["interval.leap"]
        self.assertLessEqual(rule["minInWindow"], rule["min"])
        ctx = context(PHRASES, LEAPS)
        self.assertTrue(part(window(ctx, 1, 4), "opportunity").fired, "seven leaps in four bars")
        sparse = {"interval.leap": {"4": [2, 0]}}
        opp = part(window(context(PHRASES, sparse), 1, 4), "opportunity")
        self.assertFalse(opp.fired, "two leaps in four bars are below the window minimum")
        self.assertIn("below the window rule", opp.detail)

    def test_occurrences_ask_for_recurrence_not_a_cluster(self) -> None:
        clustered = {"interval.leap": {"2": [6, 0]}}
        scored = window(context(PHRASES, clustered), 1, 8)
        self.assertTrue(part(scored, "opportunity").fired, "six leaps in eight bars meet the window rule")
        self.assertFalse(part(scored, "occurrences").fired, "all of them in one bar")
        self.assertTrue(part(window(context(PHRASES, LEAPS), 1, 8), "occurrences").fired)

    def test_an_every_bar_demand_needs_every_bar_of_the_window(self) -> None:
        walk = {"texture.walking-bass": [5, 6, 7, 8]}
        ctx = context(PHRASES, LEAPS, every_bar=walk)
        self.assertTrue(part(window(ctx, 5, 8, target="texture.walking-bass"), "opportunity").fired)
        self.assertFalse(part(window(ctx, 4, 8, target="texture.walking-bass"), "opportunity").fired)
        self.assertIn("texture.walking-bass", window(ctx, 5, 8, target="texture.walking-bass").demands)
        self.assertNotIn("texture.walking-bass", window(ctx, 5, 8, "right", target="texture.walking-bass").demands)


class TheGates(unittest.TestCase):
    def setUp(self) -> None:
        import claims

        curriculum = json.loads((REPO / "app" / "public" / "content" / "curriculum.json").read_text(encoding="utf-8"))
        self.ancestry = claims.rung_ancestry(curriculum)
        self.vocabulary = claims.load_vocabulary()[1]

    def test_a_demand_the_judging_rung_has_not_taught_refuses_the_window(self) -> None:
        ctx = context(NARROW, {"interval.leap": {"1": [2, 0], "2": [3, 0], "3": [2, 0]}, "clef.bass": {str(b): [0, 1] for b in range(1, 5)}})
        both = window(ctx, 1, 4, "both", rung="1.5", ancestry=self.ancestry, vocabulary=self.vocabulary)
        self.assertIn("texture.hands-together", both.untaught, "hands together is taught at 2.1")
        self.assertEqual(both.refused_by, ["untaught"])
        right = window(ctx, 1, 4, "right", rung="1.5", ancestry=self.ancestry, vocabulary=self.vocabulary)
        # F2a: 1.5 introduces the leap and 2.1 teaches it, so at 1.5 the right hand's leaps are untaught too.
        self.assertEqual(right.untaught, ["interval.leap"], "the right hand alone at 1.5: the leap is introduced there, taught at 2.1 (F2a)")
        self.assertEqual(right.refused_by, ["untaught"])
        taught = window(ctx, 1, 4, "right", rung="2.1", ancestry=self.ancestry, vocabulary=self.vocabulary)
        self.assertEqual(taught.untaught, [], "the right hand alone at 2.1: leaps within a fifth, nothing 2.1 has not taught")
        self.assertEqual(taught.refused_by, [])

    def test_the_shift_is_read_from_the_windows_span(self) -> None:
        ctx = context(PHRASES, LEAPS)
        self.assertIn("range.beyond-position", window(ctx, 1, 4, "right").demands, "C5 to C6: an octave in the right hand")
        narrow = [("C5:1 E5:1 G5:1 E5:1", ""), ("D5:1 G5:1 D5:1 G5:1", ""), ("C5:1 F5:1 C5:1 G5:1", ""), ("C5:4", "")]
        self.assertNotIn("range.beyond-position", window(context(narrow, LEAPS), 1, 4, "right").demands)

    def test_the_physical_gate_refuses_an_impossible_leap(self) -> None:
        from music21 import converter

        # D0's gate reads a hand's place beat by beat: from C2 to C7 between beats is four octaves, past its two.
        leap = [("C2:1 C7:1 C2:1 C7:1", "C3:4"), ("C5:4", "C3:4")]
        score = converter.parse(piece(leap), format="musicxml")
        faults = P.physical_gate(score, 1, 2, "both")
        self.assertTrue(any(f.startswith("leap:") for f in faults), faults)
        self.assertEqual(P.physical_gate(converter.parse(piece(PHRASES), format="musicxml"), 1, 4, "both"), [])


class TheParents(unittest.TestCase):
    def test_a_parent_whose_clef_the_detectors_misread_is_not_proposed(self) -> None:
        entry = {"id": "song.test.bass-clef-upper", "type": "song", "file": "scores/x.mxl",
                 "measurement": {"status": "measured", "misread": {"demands": ["clef.bass", "pitch.ledger"],
                                                                    "why": "the upper staff moves into the bass clef"}}}
        found = P.load_parent(entry, REPO / "app" / "public" / "content", {})
        self.assertIsInstance(found, str)
        self.assertIn("misread its clef", str(found))


class TextureAndLength(unittest.TestCase):
    def test_a_two_hand_window_with_a_silent_hand_is_not_met(self) -> None:
        bars = [(r, "") for r, _l in PHRASES[:4]] + PHRASES[4:8]
        ctx = context(bars, LEAPS)
        silent = part(window(ctx, 1, 4), "texture")
        self.assertFalse(silent.fired)
        self.assertIn("select the other hand", silent.detail)
        self.assertTrue(part(window(ctx, 1, 4, "right"), "texture").fired)
        self.assertTrue(part(window(ctx, 5, 8), "texture").fired)

    def test_length(self) -> None:
        self.assertEqual(P.length_part(1, 4, (4, 8)).value, 1.0)
        self.assertEqual(P.length_part(1, 8, (4, 8)).value, 1.0)
        self.assertLess(P.length_part(1, 5, (4, 8)).value, 1.0)
        self.assertFalse(P.length_part(1, 3, (4, 8)).fired)


class NothingRanksByLowestDifficulty(unittest.TestCase):
    """The easier parent's fragment never outranks the harder parent's complete phrase."""

    def test_the_score_never_reads_a_level(self) -> None:
        easy = context(PHRASES, LEAPS, level=1.0)
        hard = context(PHRASES, LEAPS, level=8.5)
        for low, high in ((1, 4), (3, 6), (5, 8), (2, 9)):
            self.assertEqual(window(easy, low, high).score, window(hard, low, high).score)

    def test_a_lowest_difficulty_ranking_is_red(self) -> None:
        # The same bars in two parents: a complete phrase in a harder piece against a mid-phrase
        # fragment of an easier one, with the target at density in both.
        hard = context(PHRASES, LEAPS, level=6.0, item="song.test.harder")
        easy = context(PHRASES, LEAPS, level=1.5, item="song.test.easier")
        complete = window(hard, 5, 8)
        fragment = window(easy, 3, 6)
        ranked = sorted([fragment, complete], key=P.rank_key)
        self.assertEqual((ranked[0].parent, ranked[0].low, ranked[0].high), ("song.test.harder", 5, 8))


class TheSeedOrdersParentsAndAdmitsNothing(unittest.TestCase):
    """E28 (E2 item 5): the seed list of teaching repertoire orders the parents a run offers, and
    admits nothing — the reviewer's ruling: reputation puts a work on the shortlist; only measured
    presence on the file admits it to a claim.

    Within each pass (the windows meeting every signal, then the rest) the catalogue's editions of
    a work the seed knows for a concept naming the target are offered first; no window is added,
    removed or rescored by it, and a refused window stays refused.
    """

    def setUp(self) -> None:
        import claims

        self.skills, self.demands = claims.load_vocabulary()
        self.seed = P.load_seed()

    def test_the_works_known_for_a_concept_that_names_the_target(self) -> None:
        works = lambda demand: [w["work"] for w in P.seed_works_for([demand], self.seed, self.skills, self.demands)]  # noqa: E731
        self.assertEqual(works("texture.left-hand-pattern"),
                         ["Piano Sonata in C major, K. 545, first movement", "Für Elise, WoO 59", "The Entertainer", "Maple Leaf Rag"])
        self.assertEqual(works("rhythm.syncopation"), ["The Entertainer", "Maple Leaf Rag"])
        self.assertEqual(works("key.signature"), ["Minuet in G major, BWV Anh. 114"])
        self.assertEqual(works("interval.leap"), [])

    def test_a_seeded_parent_is_an_edition_of_the_work_or_a_variant_of_one(self) -> None:
        catalog = [
            {"id": "song.a", "provenance": {"composition": "work:scott joplin|the entertainer"}},
            {"id": "song.a.alt", "provenance": {"composition": "variant-of:song.a"}},
            {"id": "song.b", "provenance": {"composition": "work:somebody|something else"}},
            {"id": "song.c"},
        ]
        works = [{"work": "The Entertainer", "catalogue": ["work:scott joplin|the entertainer"]}]
        self.assertEqual(sorted(P.seeded_parents(catalog, works)), ["song.a", "song.a.alt"])

    def test_the_seed_orders_the_windows_considered_and_adds_removes_or_rescores_none(self) -> None:
        seeded = context(PHRASES, LEAPS, item="song.test.seeded")
        other = context(PHRASES, LEAPS, item="song.test.other")
        windows = [window(other, 5, 8), window(seeded, 5, 8), window(seeded, 3, 6), window(other, 3, 6)]
        self.assertTrue(all(p.fired for p in windows[0].parts), "bars 5-8 meet every signal")
        self.assertFalse(all(p.fired for p in windows[2].parts), "bars 3-6 start mid-phrase")
        self.assertEqual(windows[0].score, windows[1].score, "the same bars score the same, seed or no seed")
        ranked = sorted(windows, key=P.rank_key)
        plain = [(w.parent, w.low) for w in P.acceptance_order(ranked, set())]
        first = [(w.parent, w.low) for w in P.acceptance_order(ranked, {"song.test.seeded"})]
        self.assertEqual(plain, [("song.test.other", 5), ("song.test.seeded", 5), ("song.test.other", 3), ("song.test.seeded", 3)])
        self.assertEqual(first, [("song.test.seeded", 5), ("song.test.other", 5), ("song.test.seeded", 3), ("song.test.other", 3)])
        self.assertEqual(sorted(first), sorted(plain))

    def test_a_refused_window_stays_refused_on_a_seeded_parent(self) -> None:
        import claims

        curriculum = json.loads((REPO / "app" / "public" / "content" / "curriculum.json").read_text(encoding="utf-8"))
        ctx = context(NARROW, {"interval.leap": {"1": [2, 0], "2": [3, 0], "3": [2, 0]}, "clef.bass": {str(b): [0, 1] for b in range(1, 5)}},
                      item="song.test.seeded")
        refused = window(ctx, 1, 4, "both", rung="1.5", ancestry=claims.rung_ancestry(curriculum), vocabulary=self.demands)
        self.assertEqual(refused.refused_by, ["untaught"])
        self.assertEqual(P.acceptance_order([refused], {"song.test.seeded"}), [])

    def test_the_catalogues_editions_of_the_seeds_works_are_found_on_the_build(self) -> None:
        built = REPO / "app" / "public" / "content" / "catalog.json"
        if not built.is_file():
            self.skipTest("no built catalogue: run the content build")
        catalog = json.loads(built.read_text(encoding="utf-8"))
        found = P.seeded_parents(catalog, P.seed_works_for(["texture.left-hand-pattern"], self.seed, self.skills, self.demands))
        self.assertIn("song.classical.mozart-k545-i", found)
        self.assertIn("song.classical.mozart-k545-i.alt", found)
        self.assertIn("song.ragtime.joplin-entertainer.kern", found)
        self.assertNotIn("song.classical.bach-menuet-bwv-anh-113.pdmx", found)


class TheEditionMarks(unittest.TestCase):
    def test_a_double_bar_a_fermata_and_a_long_slur_are_the_editions_marks(self) -> None:
        bars = [("C5:1 D5:1 E5:1 F5:1", "C3:4")] * 8
        ctx = context(bars, LEAPS, rights={4: "light-light"})
        starts, ends = P.edition_marks(ctx.bars)
        self.assertEqual((starts, ends), ({1, 5}, {4, 8}))


class TheViewsFixtureIsTheProposersOwnOutput(unittest.TestCase):
    """
    `app/tests/e2e/fixtures/excerpt-candidates.json` (the excerpt view's spec input) is what the proposer
    writes for Anh. 113 on the built catalogue: a fresh run gives the same first candidate, part by part.
    Reads the build (`python tools/content/build.py` first; CI: 'Build content').
    """

    def test_a_fresh_run_gives_the_fixtures_candidate(self) -> None:
        built = REPO / "app" / "public" / "content"
        if not (built / "catalog.json").is_file() or not P.POSITIONS.is_file():
            self.skipTest("no built catalogue and positions: run the content build")
        fixture = json.loads((REPO / "app" / "tests" / "e2e" / "fixtures" / "excerpt-candidates.json").read_text(encoding="utf-8"))
        want = fixture["runs"][0]["candidates"][0]
        catalog = json.loads((built / "catalog.json").read_text(encoding="utf-8"))
        curriculum = json.loads((built / "curriculum.json").read_text(encoding="utf-8"))
        run = P.propose(catalog, curriculum, built, "key.signature", "classical.3", ["song.classical.bach-menuet-bwv-anh-113.pdmx"])
        got = run["candidates"][0]
        for key in ("of", "fromBar", "toBar", "selection", "score", "parts", "demands", "counts", "meetsEverySignal"):
            self.assertEqual(got[key], want[key], key)
        self.assertEqual(got["parent"]["sha256"], want["parent"]["sha256"], "the parent's built file changed: rewrite the fixture")
        self.assertEqual(len(got["neighbourhood"]), len(want["neighbourhood"]))


if __name__ == "__main__":
    unittest.main()
