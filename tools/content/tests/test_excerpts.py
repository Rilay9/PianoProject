"""
The cut (E1 item 3) and the excerpt's identity (item 4): the adversaries the cutter answers.

Over constructed music21 parents written the way the build writes a score (`convert.write_mxl`),
and one real parent (Anh. 113 as the PDMX quarry bundles it, in `content/scores/pdmx/`):

- the bar count; the pickup kept when the row starts at bar 1 (adversary 5); a tie into the first
  bar severed to a plain note and a tie out of the last bar dropped; a one-hand cut a single
  staff; the clef, key, time and tempo in force at the cut carried into its first bar;
- the normalised header: the excerpt's id as the title and none of the parent's credits, so a
  parent whose title changed gives a byte-identical cut (adversary 8);
- a moved endpoint changes the id, the key and the bytes (adversary 7); a changed parent file
  changes the key and the bytes (adversary 9); the same bars with the other hand are a distinct
  id, key and measurement (adversary 6, measured through the bridge);
- a range across a repeat sign, a first-or-second ending or a jump refused with the bars named,
  and a repeat at the range's edge neutralised; a two-hand cut of bars one hand is silent in
  refused with the hand to select;
- the merge (`TheMerge`, `TheCutVersion`) and, since E51, the renewal of a stale approval
  (`TheRenewal`): a new decision on the parent's current bytes supersedes a row stale by provenance
  or by cut version, the old row kept whole in `superseded`; a current approval still refused.
"""
from __future__ import annotations

import contextlib
import copy
import io
import json
import re
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import bar, clef, converter, key, metadata, meter, note, spanner, stream, tempo, tie  # noqa: E402

import excerpts as X  # noqa: E402
from convert import write_mxl  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
FIXTURES = Path(__file__).resolve().parent / "fixtures" / "excerpts"
ANH_113_FILE = REPO / "content" / "scores" / "pdmx" / "QmZzbCrrGH19zjfe766mDvw9C1cXYXSa5ApF7MRnRhpqjL.mxl"


def xml_of(path: Path) -> str:
    with zipfile.ZipFile(path) as archive:
        name = next(n for n in archive.namelist() if not n.startswith("META-INF"))
        return archive.read(name).decode("utf-8")


def measures_xml(text: str) -> list[str]:
    """Each `<measure>` of the first part, as text."""
    part = re.search(r"<part id=\"[^\"]+\">(.*?)</part>", text, re.S)
    return re.findall(r"<measure\b.*?</measure>", part.group(1) if part else "", re.S)


def grand(bars: int, *, title: str = "A constructed parent", pickup: bool = False, tie_bars: tuple[int, ...] = (),
          key_change_at: int | None = None, clef_change_at: int | None = None, tempo_change_at: int | None = None,
          time_change_at: int | None = None, repeat_over: tuple[int, int] | None = None,
          volta_at: int | None = None, silent_left: tuple[int, ...] = (), right_pitch=None) -> stream.Score:
    """
    A two-staff parent: the right hand plays quarters (C5 D5 E5 F5 by default) and the left hand a
    whole C3 in every bar. `pickup` opens with a one-beat bar 1. `tie_bars` ties the right hand's
    last note of each named bar into the next bar's first note (made the same pitch). The other
    options put a key, clef, tempo or time change at the start of a printed bar, a repeat over a
    printed range, a first ending over a bar, and a silent left hand in the named bars.
    """
    upper, lower = stream.PartStaff(), stream.PartStaff()
    upper.id, lower.id = "P1-Staff1", "P1-Staff2"
    pitches = right_pitch or ["C5", "D5", "E5", "F5"]
    for number in range(1, bars + 1):
        short = pickup and number == 1
        top, bottom = stream.Measure(number=0 if pickup and number == 1 else (number - 1 if pickup else number)), stream.Measure()
        bottom.number = top.number
        if number == 1:
            top.append([clef.TrebleClef(), key.KeySignature(0), meter.TimeSignature("4/4"), tempo.MetronomeMark(number=84)])
            bottom.append([clef.BassClef(), key.KeySignature(0), meter.TimeSignature("4/4")])
        if key_change_at == number:
            top.append(key.KeySignature(2))
            bottom.append(key.KeySignature(2))
        if clef_change_at == number:
            bottom.append(clef.TrebleClef())
        if tempo_change_at == number:
            top.append(tempo.MetronomeMark(number=132))
        if time_change_at == number:
            top.append(meter.TimeSignature("3/4"))
            bottom.append(meter.TimeSignature("3/4"))
        beats = 3 if time_change_at is not None and number >= time_change_at else 4
        if short:
            top.append(note.Note("G4", quarterLength=1))
            bottom.append(note.Rest(quarterLength=1))
            top.paddingLeft = 3
            bottom.paddingLeft = 3
        else:
            row = [note.Note(p, quarterLength=1) for p in pitches[:beats]]
            if (number - 1) in tie_bars and number > 1:
                row[0] = note.Note(pitches[beats - 1], quarterLength=1)
                row[0].tie = tie.Tie("stop")
            if number in tie_bars:
                row[-1].tie = tie.Tie("start")
            top.append(row)
            if number in silent_left:
                bottom.append(note.Rest(quarterLength=beats))
            else:
                bottom.append(note.Note("C3", quarterLength=beats))
        if repeat_over and number == repeat_over[0]:
            top.leftBarline = bar.Repeat(direction="start")
            bottom.leftBarline = bar.Repeat(direction="start")
        if repeat_over and number == repeat_over[1]:
            top.rightBarline = bar.Repeat(direction="end")
            bottom.rightBarline = bar.Repeat(direction="end")
        upper.append(top)
        lower.append(bottom)
    score = stream.Score()
    score.metadata = metadata.Metadata()
    score.metadata.title = title
    score.metadata.composer = "A Composer"
    score.insert(0, upper)
    score.insert(0, lower)
    if volta_at is not None:
        tops = list(upper.getElementsByClass(stream.Measure))
        score.insert(0, spanner.RepeatBracket(tops[volta_at - 1], number=1))
    return score


class Parent:
    """A constructed parent written to a temporary built file."""

    def __init__(self, test: unittest.TestCase, score: stream.Score, name: str = "parent.mxl") -> None:
        self.dir = Path(tempfile.mkdtemp(prefix="excerpt-test-"))
        test.addCleanup(lambda: __import__("shutil").rmtree(self.dir, ignore_errors=True))
        self.path = self.dir / name
        write_mxl(score, self.path)

    def cut(self, low: int, high: int, selection: str = "both", eid: str | None = None, name: str | None = None) -> X.Cut:
        eid = eid or X.excerpt_id("song.test.parent", low, high, selection)
        return X.cut(self.path, low, high, selection, eid, self.dir / (name or f"{eid}.mxl"))


class TheIdentity(unittest.TestCase):
    def test_the_id_is_derived_from_the_definition(self) -> None:
        self.assertEqual(X.excerpt_id("song.classical.bach-menuet-bwv-anh-113.pdmx", 1, 8, "both"),
                         "excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b1-8")
        self.assertEqual(X.excerpt_id("song.folk.x", 5, 12, "right"), "excerpt.folk.x.b5-12.rh")
        self.assertEqual(X.excerpt_id("song.folk.x", 5, 12, "left"), "excerpt.folk.x.b5-12.lh")
        with self.assertRaises(ValueError):
            X.excerpt_id("song.folk.x", 5, 12, "both-hands")

    def test_the_key_covers_the_parent_bytes_the_range_the_selection_and_the_version(self) -> None:
        base = X.chain_key("a" * 64, 5, 12, "both")
        self.assertEqual(base, X.chain_key("a" * 64, 5, 12, "both"))
        for other in (X.chain_key("b" * 64, 5, 12, "both"), X.chain_key("a" * 64, 5, 13, "both"),
                      X.chain_key("a" * 64, 4, 12, "both"), X.chain_key("a" * 64, 5, 12, "right"),
                      X.chain_key("a" * 64, 5, 12, "both", X.CUT_VERSION + 1)):
            self.assertNotEqual(base, other)


class TheCut(unittest.TestCase):
    def test_it_has_the_bars_of_the_range(self) -> None:
        made = Parent(self, grand(8)).cut(3, 6)
        self.assertEqual(made.bars, 4)
        self.assertEqual(len(measures_xml(xml_of(made.path))), 4)
        self.assertEqual(made.staves, 2)

    def test_a_pickup_the_row_includes_is_kept(self) -> None:
        """Adversary 5 at the cutter: the anacrusis is bar 1, one beat long, before the first full bar."""
        made = Parent(self, grand(6, pickup=True)).cut(1, 3)
        text = xml_of(made.path)
        bars = measures_xml(text)
        self.assertEqual(len(bars), 3)
        self.assertIn('number="0"', bars[0], "the pickup keeps the number an engraver gives it")
        first = converter.parse(str(made.path)).parts[0].getElementsByClass(stream.Measure)[0]
        self.assertEqual(first.duration.quarterLength, 1.0, "the pickup is still one beat")
        self.assertEqual(float(first.paddingLeft), 3.0)

    def test_a_cut_from_bar_two_of_a_piece_with_a_pickup_starts_on_a_full_bar(self) -> None:
        made = Parent(self, grand(6, pickup=True)).cut(2, 4)
        first = converter.parse(str(made.path)).parts[0].getElementsByClass(stream.Measure)[0]
        self.assertEqual(first.number, 1)
        self.assertEqual(first.duration.quarterLength, 4.0)

    def test_a_tie_into_the_first_bar_is_severed_and_a_tie_out_of_the_last_is_dropped(self) -> None:
        # Ties from bar 2 into 3 and from bar 5 into 6; the cut is bars 3-5.
        made = Parent(self, grand(8, tie_bars=(2, 5))).cut(3, 5)
        bars = measures_xml(xml_of(made.path))
        self.assertEqual(len(bars), 3)
        self.assertNotIn('<tie type="stop"', bars[0], "the first note of the cut is plain: its tie came from outside")
        self.assertNotIn('<tied type="stop"', bars[0])
        self.assertNotIn('<tie type="start"', bars[-1], "the last bar ties into nothing")
        self.assertNotIn('<tied type="start"', bars[-1])
        # The parent's own ties are there, so the test would see one kept.
        parent_bars = measures_xml(xml_of(Parent(self, grand(8, tie_bars=(2, 5))).path))
        self.assertIn('<tie type="stop"', parent_bars[2])
        self.assertIn('<tie type="start"', parent_bars[4])

    def test_a_one_hand_cut_is_a_single_staff(self) -> None:
        parent = Parent(self, grand(6))
        right = xml_of(parent.cut(2, 4, "right").path)
        left = xml_of(parent.cut(2, 4, "left").path)
        for text, sign, hand in ((right, "G", "right"), (left, "F", "left")):
            self.assertNotIn("<staves>2</staves>", text, hand)
            self.assertEqual(re.findall(r"<clef[^>]*>\s*<sign>([A-Z])</sign>", text), [sign], hand)
        self.assertIn("<octave>5</octave>", right)
        self.assertNotIn("<octave>3</octave>", right)
        self.assertIn("<octave>3</octave>", left)
        self.assertNotIn("<octave>5</octave>", left)

    def test_the_clef_key_time_and_tempo_in_force_are_carried_in(self) -> None:
        score = grand(10, key_change_at=3, clef_change_at=4, tempo_change_at=5, time_change_at=6)
        first = measures_xml(xml_of(Parent(self, score).cut(7, 9).path))[0]
        self.assertIn("<fifths>2</fifths>", first, "the key changed at bar 3")
        self.assertIn("<beats>3</beats>", first, "the time changed at bar 6")
        signs = re.findall(r"<clef number=\"(\d)\">\s*<sign>([A-Z])</sign>", first)
        self.assertIn(("2", "G"), signs, "the lower staff moved to the treble clef at bar 4")
        self.assertIn(("1", "G"), signs)
        self.assertRegex(first, r'<sound tempo="132', "the tempo changed at bar 5")

    def test_the_header_is_the_excerpts_id_and_none_of_the_parents_credits(self) -> None:
        made = Parent(self, grand(6)).cut(2, 4, eid="excerpt.test.parent.b2-4")
        text = xml_of(made.path)
        self.assertIn("<work-title>excerpt.test.parent.b2-4</work-title>", text)
        self.assertIn("<movement-title>excerpt.test.parent.b2-4</movement-title>", text)
        for gone in ("A constructed parent", "A Composer", "<identification>", "<credit", "<encoding-date>", "<creator"):
            self.assertNotIn(gone, text)


class TheAdversariesOfIdentity(unittest.TestCase):
    def test_8_a_parent_whose_title_changed_gives_a_byte_identical_cut(self) -> None:
        one = Parent(self, grand(6, title="Minuet"))
        two = Parent(self, grand(6, title="Menuet (renamed)"))
        self.assertNotEqual(X.sha256_of(one.path), X.sha256_of(two.path), "the parents' files differ in their title")
        eid = "excerpt.test.parent.b2-4"
        self.assertEqual(one.cut(2, 4, eid=eid).path.read_bytes(), two.cut(2, 4, eid=eid).path.read_bytes())

    def test_8_catalogue_metadata_leaves_the_key_and_the_cut_alone(self) -> None:
        parent = Parent(self, grand(6))
        sha = X.sha256_of(parent.path)
        eid = "excerpt.test.parent.b2-4"
        first = parent.cut(2, 4, eid=eid, name="first.mxl").path.read_bytes()
        # A catalogue title is not in the file: the parent's bytes, the key and the cut are what they were.
        self.assertEqual(X.sha256_of(parent.path), sha)
        self.assertEqual(parent.cut(2, 4, eid=eid, name="second.mxl").path.read_bytes(), first)
        self.assertEqual(X.chain_key(sha, 2, 4, "both"), X.chain_key(X.sha256_of(parent.path), 2, 4, "both"))

    def test_7_an_endpoint_moved_one_bar_changes_the_id_the_key_and_the_bytes(self) -> None:
        parent = Parent(self, grand(8))
        sha = X.sha256_of(parent.path)
        a, b = parent.cut(2, 5), parent.cut(2, 6)
        self.assertNotEqual(X.excerpt_id("song.test.parent", 2, 5, "both"), X.excerpt_id("song.test.parent", 2, 6, "both"))
        self.assertNotEqual(X.chain_key(sha, 2, 5, "both"), X.chain_key(sha, 2, 6, "both"))
        self.assertNotEqual(a.path.read_bytes(), b.path.read_bytes())

    def test_9_a_changed_parent_file_changes_the_key_and_the_bytes(self) -> None:
        before = Parent(self, grand(6))
        after = Parent(self, grand(6, right_pitch=["C5", "D5", "E5", "G5"]))
        old, new = X.sha256_of(before.path), X.sha256_of(after.path)
        self.assertNotEqual(old, new)
        self.assertNotEqual(X.chain_key(old, 2, 4, "both"), X.chain_key(new, 2, 4, "both"))
        eid = "excerpt.test.parent.b2-4"
        self.assertNotEqual(before.cut(2, 4, eid=eid).path.read_bytes(), after.cut(2, 4, eid=eid).path.read_bytes())

    def test_9_the_old_provenance_no_longer_matches_the_parent(self) -> None:
        """The build's block names the approval as stale when the parent's bytes moved."""
        entry = {"_excerpt": {"of": "song.x", "fromBar": 2, "toBar": 4, "selection": "both", "targets": ["interval.leap"],
                              "event": "ex-1", "approvedParentSha256": "a" * 64, "parentSha256": "b" * 64}}
        block = X.provenance_block(entry, {"edition": "pdmx:Qm"})
        self.assertEqual(block["key"], X.chain_key("b" * 64, 2, 4, "both"))
        self.assertEqual(block["stale"]["approvedParentSha256"], "a" * 64)
        entry["_excerpt"]["approvedParentSha256"] = "b" * 64
        self.assertNotIn("stale", X.provenance_block(entry, {"edition": "pdmx:Qm"}))

    def test_6_the_same_bars_with_the_other_hand_are_another_id_key_and_measurement(self) -> None:
        import demands

        parent = Parent(self, grand(6))
        sha = X.sha256_of(parent.path)
        right, left = parent.cut(2, 4, "right"), parent.cut(2, 4, "left")
        self.assertNotEqual(X.excerpt_id("song.test.parent", 2, 4, "right"), X.excerpt_id("song.test.parent", 2, 4, "left"))
        self.assertNotEqual(X.chain_key(sha, 2, 4, "right"), X.chain_key(sha, 2, 4, "left"))
        measured = demands.measure_each([right.path, left.path])
        r, l = measured[str(right.path)], measured[str(left.path)]
        self.assertNotIn("error", r)
        self.assertNotIn("error", l)
        self.assertNotEqual(r["demands"], l["demands"])
        self.assertIn("interval.step", r["demands"], "the right hand's quarters move by step")
        self.assertNotIn("interval.step", l["demands"], "the left hand holds one note a bar")


class WhatTheCutterRefuses(unittest.TestCase):
    def test_a_range_across_a_repeat_sign_is_refused_with_the_bars_named(self) -> None:
        parent = Parent(self, grand(8, repeat_over=(3, 5)))
        with self.assertRaises(X.CutRefused) as caught:
            parent.cut(2, 4)
        self.assertIn("a repeat sign opens bar 3", str(caught.exception))
        with self.assertRaises(X.CutRefused) as caught:
            parent.cut(4, 7)
        self.assertIn("a repeat sign closes bar 5", str(caught.exception))

    def test_a_repeat_at_the_edges_is_neutralised_and_the_passage_presented_once(self) -> None:
        made = Parent(self, grand(8, repeat_over=(3, 5))).cut(3, 5)
        text = xml_of(made.path)
        self.assertEqual(made.bars, 3)
        self.assertNotIn("<repeat ", text)

    def test_a_first_or_second_ending_is_refused(self) -> None:
        with self.assertRaises(X.CutRefused) as caught:
            Parent(self, grand(8, volta_at=6)).cut(4, 7)
        self.assertIn("a first-or-second ending over bar 6", str(caught.exception))

    def test_the_real_parent_refuses_its_repeat(self) -> None:
        """Anh. 113 as bundled: a repeat closes bar 12 and opens bar 13."""
        score = converter.parse(str(ANH_113_FILE))
        faults = X.crossings(score, 11, 14)
        self.assertIn("a repeat sign closes bar 12", faults)
        self.assertIn("a repeat sign opens bar 13", faults)
        self.assertEqual(X.crossings(score, 17, 24), [])
        self.assertEqual(X.crossings(score, 13, 16), [], "a repeat at the range's first barline is its edge")

    def test_a_two_hand_cut_of_bars_one_hand_is_silent_in_is_refused(self) -> None:
        with self.assertRaises(X.CutRefused) as caught:
            Parent(self, grand(8, silent_left=(3, 4, 5))).cut(3, 5)
        self.assertIn("select right", str(caught.exception))

    def test_a_range_outside_the_printed_bars_is_refused(self) -> None:
        with self.assertRaises(X.CutRefused):
            Parent(self, grand(4)).cut(3, 6)

    def test_the_fixture_with_a_pickup_and_a_repeat(self) -> None:
        path = FIXTURES / "pickup-and-repeat.musicxml"
        score = converter.parse(str(path))
        self.assertEqual(X.crossings(score, 1, 3), ["a repeat sign opens bar 2"])
        self.assertEqual(X.crossings(score, 2, 3), [])


class TheRow(unittest.TestCase):
    def test_concepts_are_the_targets_where_the_vocabulary_names_them_once(self) -> None:
        """
        One detector finds every left-hand pattern (claims.CONCEPT_DEMANDS maps alberti, waltz, oom-pah,
        boogie and stride to it): which pattern the passage has is not in the demand, so no concept.
        """
        self.assertEqual(X.concepts_for(["texture.left-hand-pattern"]), [])
        self.assertEqual(X.concepts_for(["texture.walking-bass"]), ["walking-bass"])
        self.assertEqual(X.concepts_for(["syncopation"]), ["syncopation"])
        self.assertIn("chromatic", X.concepts_for(["pitch.chromatic"]))


class TheMerge(unittest.TestCase):
    """`excerpts.py --merge`: idempotent by event id; a range approved twice refused with the row named."""

    def line(self, **over) -> str:
        import json

        event = {"v": 1, "event": "ex-test-0001", "decision": "approve", "of": "song.test.parent", "fromBar": 5,
                 "toBar": 8, "selection": "both", "targets": ["interval.leap"], "note": "by rule", "parentSha256": "a" * 64,
                 "by": "a test", "at": "2026-09-28T00:00:00.000Z"}
        event.update(over)
        return json.dumps(event)

    def test_an_approval_becomes_a_row_and_a_rerun_appends_nothing(self) -> None:
        data = X.read_definitions(Path("does-not-exist.json"))
        first = X.merge_text(data, self.line() + "\n", {"song.test.parent"})
        self.assertEqual((first["appended"], first["refused"]), (["ex-test-0001"], []))
        row = first["data"]["excerpts"][0]
        self.assertEqual((row["of"], row["fromBar"], row["toBar"], row["selection"], row["targets"], row["parentSha256"]),
                         ("song.test.parent", 5, 8, "both", ["interval.leap"], "a" * 64))
        again = X.merge_text(first["data"], self.line() + "\n", {"song.test.parent"})
        self.assertEqual((again["appended"], again["skipped"], again["refused"]), ([], ["ex-test-0001"], []))
        self.assertEqual(X.serialise_definitions(again["data"]), X.serialise_definitions(first["data"]))

    def test_the_same_event_with_other_content_is_refused(self) -> None:
        first = X.merge_text(X.read_definitions(Path("none.json")), self.line(), {"song.test.parent"})
        changed = X.merge_text(first["data"], self.line(toBar=9), {"song.test.parent"})
        self.assertEqual(changed["appended"], [])
        self.assertIn("already in the file with other content", changed["refused"][0][1])

    def test_an_approval_of_a_range_already_present_is_refused_with_the_row_named(self) -> None:
        first = X.merge_text(X.read_definitions(Path("none.json")), self.line(), {"song.test.parent"})
        twice = X.merge_text(first["data"], self.line(event="ex-test-0002", note="again"), {"song.test.parent"})
        self.assertEqual(twice["appended"], [])
        self.assertIn("excerpt.test.parent.b5-8 is already approved (event ex-test-0001)", twice["refused"][0][1])
        # The other hand is another excerpt, and a moved endpoint another.
        other = X.merge_text(first["data"], self.line(event="ex-test-0003", selection="right") + "\n"
                             + self.line(event="ex-test-0004", toBar=9, decision="adjust", proposed={"fromBar": 5, "toBar": 8}),
                             {"song.test.parent"})
        self.assertEqual(other["appended"], ["ex-test-0003", "ex-test-0004"])
        self.assertEqual(other["data"]["excerpts"][-1]["proposed"], {"fromBar": 5, "toBar": 8})

    def test_a_rejection_is_kept_with_its_reason_and_needs_one(self) -> None:
        merged = X.merge_text(X.read_definitions(Path("none.json")),
                              self.line(event="ex-test-0005", decision="reject", reason="mid-phrase at both ends"), {"song.test.parent"})
        self.assertEqual(merged["data"]["excerpts"], [])
        self.assertEqual(merged["data"]["rejected"][0]["reason"], "mid-phrase at both ends")
        refused = X.merge_text(X.read_definitions(Path("none.json")), self.line(event="ex-test-0006", decision="reject"), {"song.test.parent"})
        self.assertEqual(refused["refused"][0][1], "a rejection needs a reason")

    def test_a_line_naming_a_parent_the_catalogue_lacks_or_malformed_is_refused(self) -> None:
        merged = X.merge_text(X.read_definitions(Path("none.json")), "\n".join([
            self.line(of="song.gone"), "not json", self.line(event="bad id!"), self.line(event="ex-test-0007", selection="middle"),
            self.line(event="ex-test-0008", targets=[]), self.line(event="ex-test-0009", at="2026-09-28")]), {"song.test.parent"})
        self.assertEqual(merged["appended"], [])
        reasons = [why for _n, why in merged["refused"]]
        self.assertEqual(len(reasons), 6)
        self.assertIn("song.gone is not in the built catalogue", reasons[0])

    def test_the_committed_file_is_the_merges_own_serialisation(self) -> None:
        """A round-trip through the merge's one serialiser is byte-identical to the file (no re-serialising hazard)."""
        if not X.DEFINITIONS.is_file():
            self.skipTest("no excerpts.json yet")
        raw = X.DEFINITIONS.read_bytes().decode("utf-8").replace(chr(13) + chr(10), chr(10))
        self.assertEqual(X.serialise_definitions(X.read_definitions()), raw)

    def test_the_committed_file_says_what_its_format_holds(self) -> None:
        """
        E51a (the E51 review's required change 2, `responses/dffa9c34.md`): the committed `_comment` is `COMMENT`.
        The merge keeps a stored comment, so a change to `COMMENT` is red here until the file follows in the same change.
        """
        if not X.DEFINITIONS.is_file():
            self.skipTest("no excerpts.json yet")
        self.assertEqual(X.read_definitions()["_comment"], X.COMMENT)


class TheRenewal(unittest.TestCase):
    """
    E51 (the reviewer's ruling on the E-tail, `responses/f972756.md`): an approval stale by provenance (its
    `parentSha256` other than the parent's current built bytes) or by cut version (merged under an older cutter;
    a row with no `cutVersion` under version 1) can be re-decided. A new explicit decision on the same parent,
    bars and selection supersedes it: an approval or adjustment naming the parent's current bytes becomes the one
    active row, a rejection withdraws it, and the old row is kept byte for byte in `superseded` with the event that
    replaced it. An approval of a range whose approval is current is refused as before, and nothing becomes
    current by implication: no stored row is rewritten, and nothing is renewed without an event of its own.
    """

    PARENT = "song.test.parent"
    OLD = "a" * 64
    NEW = "b" * 64

    def line(self, **over) -> str:
        event = {"v": 1, "event": "ex-renew-0002", "decision": "approve", "of": self.PARENT, "fromBar": 5, "toBar": 8,
                 "selection": "both", "targets": ["interval.leap"], "note": "compared with the old cut",
                 "parentSha256": self.OLD, "by": "a person", "at": "2026-09-29T12:00:00.000Z"}
        event.update(over)
        return json.dumps(event)

    def stored(self, **over) -> dict:
        """An approved row as the committed file holds one merged before E33: no `cutVersion`, so version 1."""
        row = {"of": self.PARENT, "fromBar": 5, "toBar": 8, "selection": "both", "targets": ["interval.leap"],
               "label": "", "note": "by rule", "parentSha256": self.OLD, "event": "ex-renew-0001", "by": "a builder",
               "at": "2026-09-28T00:00:00.000Z"}
        row.update(over)
        return row

    def data(self, *rows: dict) -> dict:
        return {"_comment": X.COMMENT, "excerpts": [copy.deepcopy(row) for row in rows], "rejected": []}

    def merge(self, data: dict, *lines: str, shas: dict | None = None) -> dict:
        text = "\n".join(lines) + "\n"
        if shas is None:
            return X.merge_text(data, text, {self.PARENT})
        return X.merge_text(data, text, {self.PARENT}, current_shas=shas)

    def assertKeptWhole(self, entry: dict, old: dict, by: str) -> None:
        """The superseded entry is the old row, every field and its order as it was, plus the event that replaced it."""
        self.assertEqual(entry.get("supersededBy"), by)
        self.assertEqual(json.dumps({k: v for k, v in entry.items() if k != "supersededBy"}), json.dumps(old))

    def test_a_a_row_with_no_cut_version_is_renewed_by_a_decision_on_the_current_parent(self) -> None:
        old = self.stored()
        renewed = self.merge(self.data(old), self.line())
        self.assertEqual(renewed["refused"], [], "a renewal of an approval stale by cut version is a decision the merge takes")
        self.assertEqual(renewed["appended"], ["ex-renew-0002"])
        rows = renewed["data"]["excerpts"]
        self.assertEqual([r["event"] for r in rows], ["ex-renew-0002"], "the renewal is the one active row")
        self.assertEqual((rows[0]["cutVersion"], rows[0]["parentSha256"], rows[0]["by"]), (X.CUT_VERSION, self.OLD, "a person"))
        self.assertEqual(len(renewed["data"]["superseded"]), 1)
        self.assertKeptWhole(renewed["data"]["superseded"][0], old, "ex-renew-0002")
        self.assertNotIn("cutVersion", renewed["data"]["superseded"][0], "the old row's absent cut version stays absent")
        # The same with the parent's current bytes read: the row is stale by cut version alone, and renewed.
        read = self.merge(self.data(old), self.line(), shas={self.PARENT: self.OLD})
        self.assertEqual((read["appended"], read["refused"]), (["ex-renew-0002"], []))
        self.assertEqual(read["superseding"], [("ex-renew-0002", "ex-renew-0001", read["superseding"][0][2])])
        self.assertTrue(all("cut version" in why for why in read["superseding"][0][2]), read["superseding"])

    def test_b_a_row_approved_on_other_parent_bytes_is_renewed_on_the_current_bytes(self) -> None:
        old = self.stored(cutVersion=X.CUT_VERSION)
        renewed = self.merge(self.data(old), self.line(parentSha256=self.NEW), shas={self.PARENT: self.NEW})
        self.assertEqual((renewed["appended"], renewed["refused"]), (["ex-renew-0002"], []))
        self.assertEqual([(r["event"], r["parentSha256"]) for r in renewed["data"]["excerpts"]], [("ex-renew-0002", self.NEW)])
        self.assertKeptWhole(renewed["data"]["superseded"][0], old, "ex-renew-0002")
        self.assertEqual(renewed["data"]["superseded"][0]["parentSha256"], self.OLD, "the old row keeps the bytes it was approved on")
        self.assertTrue(any("provenance" in why for why in renewed["superseding"][0][2]), renewed["superseding"])

    def test_c_a_renewal_naming_the_old_bytes_or_none_is_refused_with_the_reason(self) -> None:
        old = self.stored()
        # Without the current bytes (stale by cut version): a renewal still names the parent it was made on.
        bare = self.merge(self.data(old), self.line(parentSha256=None))
        self.assertEqual(bare["appended"], [])
        self.assertIn("a renewal is a decision on the current parent", bare["refused"][0][1])
        self.assertIn("names no parent bytes", bare["refused"][0][1])
        self.assertEqual(bare["data"]["excerpts"], [old], "the stale row stays as it was")
        # With them: a line naming the old bytes, or none, is refused; the stored row untouched.
        stale = self.merge(self.data(old), self.line(), shas={self.PARENT: self.NEW})
        self.assertEqual(stale["appended"], [])
        why = stale["refused"][0][1]
        self.assertIn("excerpt.test.parent.b5-8", why)
        self.assertIn("a renewal is a decision on the current parent", why)
        self.assertIn(f"names the parent's bytes {self.OLD[:12]}", why)
        self.assertIn(f"the parent is now {self.NEW[:12]}", why)
        self.assertEqual(stale["data"]["excerpts"], [old])
        self.assertEqual(stale["data"].get("superseded") or [], [])
        none = self.merge(self.data(old), self.line(parentSha256=None), shas={self.PARENT: self.NEW})
        self.assertIn("names no parent bytes", none["refused"][0][1])

    def test_d_an_approval_of_a_range_whose_approval_is_current_is_refused_as_before(self) -> None:
        current = self.stored(cutVersion=X.CUT_VERSION)
        twice = self.merge(self.data(current), self.line())
        self.assertEqual(twice["appended"], [])
        self.assertEqual(twice["refused"], [(1, "excerpt.test.parent.b5-8 is already approved (event ex-renew-0001)")])
        self.assertEqual(twice["data"]["excerpts"], [current])

    def test_d_current_by_both_with_the_parents_bytes_read_is_refused_as_before(self) -> None:
        current = self.stored(cutVersion=X.CUT_VERSION)
        for naming in (self.OLD, self.NEW, None):
            with self.subTest(naming=naming):
                twice = self.merge(self.data(current), self.line(parentSha256=naming), shas={self.PARENT: self.OLD})
                self.assertEqual(twice["appended"], [])
                self.assertEqual(twice["refused"], [(1, "excerpt.test.parent.b5-8 is already approved (event ex-renew-0001)")])
                self.assertEqual(twice["data"]["excerpts"], [current])

    def test_e_without_the_current_bytes_provenance_fails_closed_and_cut_version_is_judged(self) -> None:
        only_provenance = self.stored(cutVersion=X.CUT_VERSION)
        closed = self.merge(self.data(only_provenance), self.line(parentSha256=self.NEW))
        self.assertEqual(closed["appended"], [])
        self.assertIn("is already approved (event ex-renew-0001)", closed["refused"][0][1])
        self.assertEqual(closed["data"]["excerpts"], [only_provenance])
        by_cut_version = self.merge(self.data(self.stored()), self.line())
        self.assertEqual((by_cut_version["appended"], by_cut_version["refused"]), (["ex-renew-0002"], []))

    def test_f_the_old_export_and_the_renewal_merged_again_are_skipped_and_the_file_idempotent(self) -> None:
        old = self.stored()
        export = json.dumps({"v": 1, "event": old["event"], "decision": "approve", "of": old["of"], "fromBar": 5, "toBar": 8,
                             "selection": "both", "targets": old["targets"], "label": "", "note": old["note"],
                             "parentSha256": old["parentSha256"], "by": old["by"], "at": old["at"]})
        # The export reproduces the stored row: before any renewal it is the same decision, skipped.
        self.assertEqual(self.merge(self.data(old), export)["skipped"], [old["event"]])
        renewed = self.merge(self.data(old), self.line())
        self.assertEqual(renewed["appended"], ["ex-renew-0002"])
        text = X.serialise_definitions(renewed["data"])
        again = self.merge(json.loads(text), export, self.line())
        self.assertEqual((again["appended"], again["skipped"], again["refused"]), ([], [old["event"], "ex-renew-0002"], []))
        self.assertEqual(X.serialise_definitions(again["data"]), text, "a rerun changes no byte")
        # Written and read back through the file's own reader and serialiser: byte-identical, `superseded` carried.
        directory = Path(tempfile.mkdtemp(prefix="excerpt-renewal-file-"))
        self.addCleanup(lambda: __import__("shutil").rmtree(directory, ignore_errors=True))
        X.write_definitions(renewed["data"], directory / "excerpts.json")
        self.assertEqual(X.serialise_definitions(X.read_definitions(directory / "excerpts.json")), text)
        order = list(json.loads(text))
        self.assertEqual(order, ["_comment", "excerpts", "rejected", "superseded"])
        # A merge with no renewal writes no `superseded` key: the committed file still round-trips byte for byte.
        plain = self.merge(X.read_definitions(Path("none.json")), self.line(event="ex-renew-0009"))
        self.assertNotIn('"superseded"', X.serialise_definitions(plain["data"]))

    def test_g_a_rejection_of_a_stale_approval_withdraws_it(self) -> None:
        old = self.stored()
        withdrawn = self.merge(self.data(old), self.line(event="ex-renew-0003", decision="reject", parentSha256=None,
                                                         reason="compared with the new cut: the phrase ends a bar later"))
        self.assertEqual((withdrawn["appended"], withdrawn["refused"]), (["ex-renew-0003"], []))
        self.assertEqual(withdrawn["data"]["excerpts"], [], "the build stops cutting it")
        self.assertEqual([r["event"] for r in withdrawn["data"]["rejected"]], ["ex-renew-0003"])
        self.assertEqual(withdrawn["data"]["rejected"][0]["reason"], "compared with the new cut: the phrase ends a bar later")
        self.assertKeptWhole(withdrawn["data"]["superseded"][0], old, "ex-renew-0003")
        # The same export again: skipped, nothing moves.
        again = self.merge(withdrawn["data"], self.line(event="ex-renew-0003", decision="reject", parentSha256=None,
                                                        reason="compared with the new cut: the phrase ends a bar later"))
        self.assertEqual((again["appended"], again["skipped"]), ([], ["ex-renew-0003"]))
        self.assertEqual(X.serialise_definitions(again["data"]), X.serialise_definitions(withdrawn["data"]))

    def test_h_a_renewal_of_a_renewal_keeps_both_earlier_rows_in_order(self) -> None:
        first = self.stored()
        once = self.merge(self.data(first), self.line(), shas={self.PARENT: self.OLD})
        second = copy.deepcopy(once["data"]["excerpts"][0])
        # The parent's file changes (a re-conversion): the renewal is now stale by provenance, and re-decided.
        twice = self.merge(once["data"], self.line(event="ex-renew-0004", parentSha256=self.NEW), shas={self.PARENT: self.NEW})
        self.assertEqual((twice["appended"], twice["refused"]), (["ex-renew-0004"], []))
        self.assertEqual([r["event"] for r in twice["data"]["excerpts"]], ["ex-renew-0004"])
        kept = twice["data"]["superseded"]
        self.assertEqual([e["event"] for e in kept], ["ex-renew-0001", "ex-renew-0002"])
        self.assertKeptWhole(kept[0], first, "ex-renew-0002")
        self.assertKeptWhole(kept[1], second, "ex-renew-0004")

    def test_i_the_validator_reads_a_renewed_file_as_one_current_row(self) -> None:
        from validate import excerpt_findings

        directory = Path(tempfile.mkdtemp(prefix="excerpt-renewal-"))
        self.addCleanup(lambda: __import__("shutil").rmtree(directory, ignore_errors=True))
        (directory / "scores").mkdir()
        parent_file = directory / "scores" / "parent.musicxml"
        parent_file.write_bytes((FIXTURES / "pickup-and-repeat.musicxml").read_bytes())
        sha = X.sha256_of(parent_file)
        parent = {"id": self.PARENT, "type": "song", "title": "Pickup and repeat", "file": "scores/parent.musicxml",
                  "notation": {"bars": 5, "staves": 2}, "tags": []}
        eid = X.excerpt_id(self.PARENT, 4, 5, "both")
        demands = sorted(__import__("claims").load_vocabulary()[1])
        cut = {"id": eid, "type": "excerpt", "excerptOf": self.PARENT, "title": eid, "demands": demands,
               "measurement": {"status": "measured", "definitions": 3, "located": {d: 8 for d in demands}, "bars": 2,
                               "steps": 8, "notes": 8, "established": demands}}
        path = directory / "excerpts.json"
        old = self.stored(fromBar=4, toBar=5, parentSha256=sha)
        X.write_definitions(self.data(old), path)
        _errors, before = excerpt_findings([parent, cut], directory, path)
        self.assertTrue(any("stale by cut version" in w and eid in w for w in before), before)
        renewed = self.merge(X.read_definitions(path), self.line(fromBar=4, toBar=5, parentSha256=sha))
        self.assertEqual(renewed["refused"], [])
        X.write_definitions(renewed["data"], path)
        errors, warnings = excerpt_findings([parent, cut], directory, path)
        self.assertEqual(errors, [], "no duplicate signature: the superseded row is not an active one")
        self.assertEqual([w for w in warnings if "stale" in w], [], "the renewed row is current by both")

    def test_j_the_command_reads_the_parents_current_bytes_from_the_built_content(self) -> None:
        directory = Path(tempfile.mkdtemp(prefix="excerpt-renewal-main-"))
        self.addCleanup(lambda: __import__("shutil").rmtree(directory, ignore_errors=True))
        content = directory / "content"
        (content / "scores").mkdir(parents=True)
        (content / "scores" / "parent.mxl").write_bytes(b"the parent's built bytes, changed since the approval")
        sha = X.sha256_of(content / "scores" / "parent.mxl")
        (content / "catalog.json").write_text(json.dumps([{"id": self.PARENT, "type": "song", "file": "scores/parent.mxl"}]),
                                              encoding="utf-8")
        (content / "curriculum.json").write_text("{}", encoding="utf-8")
        definitions = directory / "excerpts.json"
        X.write_definitions(self.data(self.stored(cutVersion=X.CUT_VERSION)), definitions)
        decisions = directory / "decisions.jsonl"

        def run(*lines: str) -> tuple[int, str]:
            decisions.write_text("\n".join(lines) + "\n", encoding="utf-8")
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = X.main(["--merge", str(decisions), "--definitions", str(definitions), "--content", str(content)])
            return code, out.getvalue()

        code, printed = run(self.line())
        self.assertEqual(code, 1, printed)
        self.assertIn(f"names the parent's bytes {self.OLD[:12]}", printed)
        code, printed = run(self.line(parentSha256=sha))
        self.assertEqual(code, 0, printed)
        self.assertIn("appended 1, already in the file 0, refused 0", printed)
        self.assertIn("+ ex-renew-0002, superseding ex-renew-0001", printed)
        self.assertIn("stale by provenance", printed)
        written = json.loads(definitions.read_text(encoding="utf-8"))
        self.assertEqual([(r["event"], r["parentSha256"]) for r in written["excerpts"]], [("ex-renew-0002", sha)])
        self.assertEqual([e["event"] for e in written["superseded"]], ["ex-renew-0001"])


PDMX = REPO / "content" / "scores" / "pdmx"
HARK_FILE = PDMX / "QmZ71TE67XH7Mot39E8efbNmqK4yvNron44ufpN3Aj1oy1.mxl"
WABASH_FILE = PDMX / "QmWwJDFTEwoHzX3qXiVR8koWxt8Vc2oP9BHJSd68BfEVMt.mxl"
I_GOT_RHYTHM_FILE = PDMX / "QmPhAvchMjTLZuhQH2sWzVFR3uCugUjh9akyizjiy1ck98.mxl"


def words_of(text: str) -> list[str]:
    """Every `<words>` text of a written score, in order."""
    return [w.strip() for w in re.findall(r"<words[^>]*>([^<]*)</words>", text)]


class TheEditionTexts(unittest.TestCase):
    """
    E33: the cutter drops from a cut the edition's texts that are not the music the learner plays —
    a direction to other players, a copyright or licence line, and a swing the app does not play
    (said in the cut's provenance, not printed) — and keeps tempo, expression, dynamics, chord
    symbols written as words, rehearsal letters and a metronome mark written as text.
    """

    def parent_with_texts(self) -> Parent:
        from music21 import dynamics, expressions

        score = grand(6)
        tops = list(score.parts[0].getElementsByClass(stream.Measure))
        bottoms = list(score.parts[1].getElementsByClass(stream.Measure))
        for text in ("Medium swing", "Sax intro: start drums here", "Allegro", "dolce", "E6", "= 120"):
            tops[2].insert(0, expressions.TextExpression(text))
        tops[2].insert(0, dynamics.Dynamic("mf"))
        tops[2].insert(0, expressions.RehearsalMark("A"))
        bottoms[3].insert(0, expressions.TextExpression("Public Domain"))
        tops[4].insert(1, expressions.TextExpression("cresc."))
        tops[4].insert(2, expressions.TextExpression("Repeat for solos"))
        return Parent(self, score)

    def test_each_kind_is_dropped_and_the_music_is_kept(self) -> None:
        made = self.parent_with_texts().cut(3, 5)
        text = xml_of(made.path)
        kept = words_of(text)
        for word in ("Allegro", "dolce", "E6", "= 120", "cresc."):
            self.assertIn(word, kept, f"{word!r} is the music's and stays")
        for word in ("Medium swing", "Sax intro: start drums here", "Public Domain", "Repeat for solos"):
            self.assertNotIn(word, kept, f"{word!r} is not the music a learner plays")
        self.assertIn("<mf", text, "a dynamic stays")
        self.assertIn(">A</rehearsal>", text, "a rehearsal letter stays")
        self.assertEqual([(d["bar"], d["parentBar"], d["kind"], d["text"]) for d in made.dropped], [
            (1, 3, "swing", "Medium swing"),
            (1, 3, "band", "Sax intro: start drums here"),
            (2, 4, "copyright", "Public Domain"),
            (3, 5, "band", "Repeat for solos"),
        ])
        swing = next(d for d in made.dropped if d["kind"] == "swing")
        self.assertIn("straight", swing["why"], "the provenance says the app plays the eighths straight")

    def test_the_parents_texts_are_there_so_the_test_would_see_one_kept(self) -> None:
        parent = xml_of(self.parent_with_texts().path)
        for word in ("Medium swing", "Sax intro: start drums here", "Public Domain", "Repeat for solos", "Allegro"):
            self.assertIn(word, words_of(parent))

    def test_the_provenance_block_says_what_was_dropped(self) -> None:
        dropped = [{"bar": 1, "parentBar": 25, "staff": 1, "kind": "swing", "text": "Medium swing", "why": "the app plays the eighths straight"}]
        carried = {"of": "song.test.parent", "fromBar": 25, "toBar": 28, "selection": "both", "targets": ["syncopation"],
                   "event": "ex-test", "by": "a test", "approvedParentSha256": "a" * 64, "parentSha256": "a" * 64,
                   "approvedCutVersion": X.CUT_VERSION, "dropped": dropped}
        block = X.provenance_block({"_excerpt": carried}, {"edition": "pdmx:test"})
        self.assertEqual(block["dropped"], dropped)
        self.assertNotIn("stale", block)
        self.assertNotIn("dropped", X.provenance_block({"_excerpt": {**carried, "dropped": []}}, {}))

    def test_the_real_cuts_drop_what_their_pages_showed_and_nothing_of_the_music(self) -> None:
        """The five approved cuts' parents: Hark!'s band direction and swing, the Minuet's staff text; the rest nothing."""
        directory = Path(tempfile.mkdtemp(prefix="excerpt-texts-"))
        self.addCleanup(lambda: __import__("shutil").rmtree(directory, ignore_errors=True))
        cases = (
            (HARK_FILE, 25, 28, [("swing", "Medium swing"), ("band", "Sax intro: start drums here")], []),
            (ANH_113_FILE, 25, 32, [("copyright", "Public Domain")], []),
            # E50: the parent's printed "= 120" is its metronome mark now (convert.tempo_printed_as_text), so bars
            # 1-4 print no words; before E50 the cut kept them as the page showed them.
            (WABASH_FILE, 1, 4, [], []),
            (I_GOT_RHYTHM_FILE, 15, 18, [], ["Gm11", "E6", "\uE262", "13", "Cm9", "Cdim7/G"]),
        )
        for path, low, high, gone, kept in cases:
            made = X.cut(path, low, high, "both", f"excerpt.test.real.b{low}-{high}", directory / f"{path.stem}.mxl")
            self.assertEqual([(d["kind"], d["text"]) for d in made.dropped], gone, path.name)
            self.assertEqual([w for w in words_of(xml_of(made.path)) if w], kept, path.name)


class TheCutVersion(unittest.TestCase):
    """
    E33 moves the cutter to version 2: every cut's key changes, and an approval merged under an older
    cutter is stale by cut version (the block's `approvedCutVersion` below its `cutVersion`, and the
    validator's warning) — nothing carries it to the new cut. A row with no `cutVersion` was merged
    before E33, under version 1. `stale` keeps its one meaning, an approval on other parent bytes.
    """

    def test_the_cutter_is_version_2(self) -> None:
        self.assertEqual(X.CUT_VERSION, 2)

    def test_a_row_with_no_cut_version_was_approved_under_version_1(self) -> None:
        self.assertEqual(X.approved_cut_version({"of": "song.x"}), 1)
        self.assertEqual(X.approved_cut_version({"of": "song.x", "cutVersion": 2}), 2)

    def test_an_approval_under_an_older_cutter_is_stale_in_the_provenance(self) -> None:
        carried = {"of": "song.test.parent", "fromBar": 5, "toBar": 8, "selection": "both", "targets": ["interval.leap"],
                   "event": "ex-test", "by": "a test", "approvedParentSha256": "a" * 64, "parentSha256": "a" * 64,
                   "approvedCutVersion": 1, "dropped": []}
        block = X.provenance_block({"_excerpt": carried}, {})
        self.assertEqual((block["cutVersion"], block["approvedCutVersion"]), (X.CUT_VERSION, 1))
        self.assertEqual(block["key"], X.chain_key("a" * 64, 5, 8, "both", X.CUT_VERSION), "the key is the new cutter's")
        self.assertNotIn("stale", block, "the parent's bytes did not move")
        current = X.provenance_block({"_excerpt": {**carried, "approvedCutVersion": X.CUT_VERSION}}, {})
        self.assertEqual(current["approvedCutVersion"], current["cutVersion"])
        # A carried definition from before the field reads as version 1, as its row does.
        self.assertEqual(X.provenance_block({"_excerpt": {k: v for k, v in carried.items() if k != "approvedCutVersion"}}, {})["approvedCutVersion"], 1)

    def test_the_merge_records_the_cutter_an_approval_was_merged_under_and_an_old_export_still_merges_once(self) -> None:
        import json

        event = {"v": 1, "event": "ex-test-0101", "decision": "approve", "of": "song.test.parent", "fromBar": 5,
                 "toBar": 8, "selection": "both", "targets": ["interval.leap"], "note": "by rule", "parentSha256": "a" * 64,
                 "by": "a test", "at": "2026-09-28T00:00:00.000Z"}
        merged = X.merge_text(X.read_definitions(Path("none.json")), json.dumps(event), {"song.test.parent"})
        self.assertEqual(merged["data"]["excerpts"][0]["cutVersion"], X.CUT_VERSION)
        # A row merged before E33 carries no cutVersion; the same export merged again is the same decision.
        old = {**merged["data"], "excerpts": [{k: v for k, v in merged["data"]["excerpts"][0].items() if k != "cutVersion"}]}
        again = X.merge_text(old, json.dumps(event), {"song.test.parent"})
        self.assertEqual((again["appended"], again["skipped"], again["refused"]), ([], ["ex-test-0101"], []))


class TheRealParent(unittest.TestCase):
    def test_anh_113_bars_17_to_24(self) -> None:
        directory = Path(tempfile.mkdtemp(prefix="excerpt-anh-"))
        self.addCleanup(lambda: __import__("shutil").rmtree(directory, ignore_errors=True))
        eid = X.excerpt_id("song.classical.bach-menuet-bwv-anh-113.pdmx", 17, 24, "both")
        made = X.cut(ANH_113_FILE, 17, 24, "both", eid, directory / f"{eid}.mxl")
        self.assertEqual((made.bars, made.staves, made.time, made.tempo_bpm), (8, 2, "3/4", 96.0))
        text = xml_of(made.path)
        self.assertIn("<fifths>-1</fifths>", measures_xml(text)[0])
        self.assertIn(f"<work-title>{eid}</work-title>", text)
        self.assertNotIn("Anna Magdalena", text)


if __name__ == "__main__":
    unittest.main()
