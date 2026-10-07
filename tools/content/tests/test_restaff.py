"""
The re-staffed teaching edition of Blues Riff in C, against its frozen source events (CK-7 extended).

Requirement `A7a1-bluesriff-restaff`; the ruling `docs/review/responses/a7a-lanes-landing.md` sections
12-14; the brief `docs/prompts/runs/A7a1/brief-bluesriff-restaff.md` Station 2.

* The committed edition (`content/scores/pdmx/<cid>.restaff.mxl`) is read by `restaff_verify.read`, a
  raw MusicXML walk that imports neither music21 nor the converter, and must equal the frozen fixture
  (`fixtures/restaff/<cid>.source-events.json`) exactly: staff 1 the source's Riff events, staff 2 the
  source's Piano staff-2 roots, by bar, onset, duration, spelled pitch and tie; nothing else sounding.
* The fixture was written by `restaff.py --freeze` from the raw archive member (sha256 69d5bb7e...),
  never from the edition; the raw member is not needed here (the ruling: CI verifies the committed
  edition without a committed raw file).
* Nine mutants, each written by a function below from the committed edition's bytes and never by
  hand, must each fail, and fail naming the bar and event that was changed.
* The `derivation` block on the `pdmx.json` row is validated by `import_pdmx.validate_derivation`.

Run: `py -3.11 -m unittest tools.content.tests.test_restaff`
"""
from __future__ import annotations

import copy
import hashlib
import json
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from fractions import Fraction
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]
REPO = TOOLS.parents[1]
sys.path.insert(0, str(TOOLS))

import import_pdmx  # noqa: E402
from pdmx import restaff  # noqa: E402
from pdmx import restaff_verify as rv  # noqa: E402

CID = "Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi"
RAW_SHA256 = "69d5bb7ee0e3cd6ff1aed15863a4d6340538a50b0108661b7657bd0d1b877481"
TABLE = REPO / "content" / "sources" / "pdmx.json"
SCORES = REPO / "content" / "scores" / "pdmx"
FIXTURE = TOOLS / "tests" / "fixtures" / "restaff" / f"{CID}.source-events.json"


def scratch_root() -> Path:
    """The repository's gitignored build/ (a fixture path must be repository-relative)."""
    root = REPO / "build"
    root.mkdir(exist_ok=True)
    return root


def table_rows() -> list[dict]:
    return json.loads(TABLE.read_text(encoding="utf-8"))["items"]


def the_row() -> dict:
    rows = [row for row in table_rows() if row.get("cid") == CID and row.get("derivation")]
    if len(rows) != 1:
        raise AssertionError(f"{len(rows)} derived rows for {CID} in content/sources/pdmx.json, want 1")
    return rows[0]


def edition_bytes() -> bytes:
    return (SCORES / the_row()["file"]).read_bytes()


# --------------------------------------------------------------------------- the mutants, by script


class Located:
    """One note of the edition's score file, with where the raw walk puts it."""

    def __init__(self, measure: ET.Element, note: ET.Element, bar: int, staff: int, onset: Fraction, head: str):
        self.measure, self.note, self.bar, self.staff, self.onset, self.head = measure, note, bar, staff, onset, head


def tree(data: bytes) -> ET.Element:
    return ET.fromstring(rv.score_xml(data))


def divisions(root: ET.Element) -> int:
    return int(next(root.iter("divisions")).text)


def notes(root: ET.Element) -> list[Located]:
    """Every pitched or unpitched note with its bar, staff, onset and spelled head (the walk's own rules)."""
    out: list[Located] = []
    div = divisions(root)
    for measure in root.iter("measure"):
        bar = int(measure.get("number"))
        position = last = Fraction(0)
        for element in measure:
            if element.tag == "backup":
                position -= Fraction(int(element.findtext("duration")), div)
            elif element.tag == "forward":
                position += Fraction(int(element.findtext("duration")), div)
            elif element.tag == "note":
                chord = element.find("chord") is not None
                onset = last if chord else position
                if element.find("pitch") is not None:
                    out.append(Located(measure, element, bar, int(element.findtext("staff") or 1), onset,
                                       rv.spell(element.find("pitch"))))
                if not chord:
                    last = position
                    position += Fraction(int(element.findtext("duration") or 0), div)
    return out


def find(root: ET.Element, *, bar: int, staff: int, head: str, onset: Fraction | None = None,
         duration: Fraction | None = None) -> Located:
    div = divisions(root)
    hits = [n for n in notes(root) if (n.bar, n.staff, n.head) == (bar, staff, head)
            and (onset is None or n.onset == onset)
            and (duration is None or Fraction(int(n.note.findtext("duration")), div) == duration)]
    if len(hits) != 1:
        raise AssertionError(f"{len(hits)} notes match bar {bar} staff {staff} {head} onset {onset} duration {duration}")
    return hits[0]


def serial(root: ET.Element) -> bytes:
    return ET.tostring(root, encoding="utf-8")


def index_in(measure: ET.Element, element: ET.Element) -> int:
    return list(measure).index(element)


def sub(parent: ET.Element, tag: str, value: str | None = None) -> ET.Element:
    child = ET.SubElement(parent, tag)
    if value is not None:
        child.text = value
    return child


def mutant_b4_to_bb4(data: bytes) -> bytes:
    """(1) The first B4 of bar 3 (beat 2) spelled B-flat 4."""
    root = tree(data)
    hit = find(root, bar=3, staff=1, head="B4", onset=Fraction(1))
    pitch = hit.note.find("pitch")
    alter = pitch.find("alter")
    if alter is None:
        alter = ET.Element("alter")
        pitch.insert(1, alter)
    alter.text = "-1"
    return serial(root)


def mutant_drop_sixty_fourth_c4(data: bytes) -> bytes:
    """(2) Bar 10's C4 of the sixty-fourth (C4+C5 at beat 4.9375) deleted; the C5 keeps its onset."""
    root = tree(data)
    hit = find(root, bar=10, staff=1, head="C4", onset=Fraction(63, 16))
    children = list(hit.measure)
    at = children.index(hit.note)
    if hit.note.find("chord") is None:
        # The chord's first head: the next head takes its place as the chord's first.
        following = children[at + 1]
        assert following.tag == "note" and following.find("chord") is not None, "the sixty-fourth's other head"
        following.remove(following.find("chord"))
    hit.measure.remove(hit.note)
    return serial(root)


def mutant_move_c6_onset(data: bytes) -> bytes:
    """(3) Bar 9's C6 (beat 1.75) moved a sixteenth earlier, to beat 1.5; every other onset unchanged."""
    root = tree(data)
    sixteenth = str(divisions(root) // 4)
    hit = find(root, bar=9, staff=1, head="C6", onset=Fraction(3, 4))
    assert hit.note.find("chord") is None
    backup, forward = ET.Element("backup"), ET.Element("forward")
    sub(backup, "duration", sixteenth)
    sub(forward, "duration", sixteenth)
    at = index_in(hit.measure, hit.note)
    hit.measure.insert(at + 1, forward)
    hit.measure.insert(at, backup)
    return serial(root)


def mutant_shorten_double_dotted(data: bytes) -> bytes:
    """(4) Bar 10's F4+F5 double-dotted sixteenth written as a dotted sixteenth; the next onset unchanged."""
    root = tree(data)
    div = divisions(root)
    heads = [find(root, bar=10, staff=1, head=h, onset=Fraction(7, 2)) for h in ("F4", "F5")]
    for hit in heads:
        assert Fraction(int(hit.note.findtext("duration")), div) == Fraction(7, 16)
        hit.note.find("duration").text = str(div * 3 // 8)
        dots = hit.note.findall("dot")
        assert len(dots) == 2, "a double-dotted sixteenth prints two dots"
        hit.note.remove(dots[-1])
    measure = heads[0].measure
    last = max(index_in(measure, hit.note) for hit in heads)
    forward = ET.Element("forward")
    sub(forward, "duration", str(div // 16))
    measure.insert(last + 1, forward)
    return serial(root)


def added_note(div: int, *, staff: int, pitch: tuple[str, int] | None, unpitched: tuple[str, int] | None,
               quarters: int) -> ET.Element:
    note = ET.Element("note")
    if pitch is not None:
        p = sub(note, "pitch")
        sub(p, "step", pitch[0])
        sub(p, "octave", str(pitch[1]))
    if unpitched is not None:
        u = sub(note, "unpitched")
        sub(u, "display-step", unpitched[0])
        sub(u, "display-octave", str(unpitched[1]))
    sub(note, "duration", str(div * quarters))
    sub(note, "voice", "9")
    sub(note, "staff", str(staff))
    return note


def append_in_bar(root: ET.Element, bar: int, note: ET.Element, quarters: int) -> bytes:
    """`note` at the bar's start in a voice of its own, the position returned to the bar's end."""
    div = divisions(root)
    measure = next(m for m in root.iter("measure") if int(m.get("number")) == bar)
    backup = ET.Element("backup")
    sub(backup, "duration", str(div * 4))
    measure.append(backup)
    measure.append(note)
    if quarters < 4:
        forward = ET.Element("forward")
        sub(forward, "duration", str(div * (4 - quarters)))
        measure.append(forward)
    return serial(root)


def mutant_add_voicing_head(data: bytes) -> bytes:
    """(5) The bar-1 voicing's E4 (a whole note) added to staff 1."""
    root = tree(data)
    return append_in_bar(root, 1, added_note(divisions(root), staff=1, pitch=("E", 4), unpitched=None, quarters=4), 4)


def mutant_add_drum_head(data: bytes) -> bytes:
    """(6) One unpitched drum head (a quarter at beat 1 of bar 1) added to staff 1."""
    root = tree(data)
    return append_in_bar(root, 1, added_note(divisions(root), staff=1, pitch=None, unpitched=("F", 4), quarters=1), 1)


def mutant_root_octave(data: bytes) -> bytes:
    """(7) Bar 5's root F2 moved an octave up, to F3."""
    root = tree(data)
    find(root, bar=5, staff=2, head="F2").note.find("pitch").find("octave").text = "3"
    return serial(root)


def mutant_bar12_root(data: bytes) -> bytes:
    """(8) Bar 12's root C2 changed to G2, the C shuffle's plan for that bar."""
    root = tree(data)
    find(root, bar=12, staff=2, head="C2").note.find("pitch").find("step").text = "G"
    return serial(root)


def mutant_swap_staves(data: bytes) -> bytes:
    """(9) The staves swapped: every note, rest and clef on staff 1 moved to staff 2 and back."""
    root = tree(data)
    for element in root.iter():
        if element.tag in ("note", "direction", "forward"):
            staff = element.find("staff")
            if staff is not None:
                staff.text = {"1": "2", "2": "1"}[staff.text]
        elif element.tag == "clef" and element.get("number") in ("1", "2"):
            element.set("number", {"1": "2", "2": "1"}[element.get("number")])
    return serial(root)


#: Each mutant, and what its failure must name: a bar, and a word of the event in that bar.
MUTANTS = {
    "1 B4 to Bb4 in bar 3": (mutant_b4_to_bb4, ["bar 3: B4", "bar 3: Bb4"]),
    "2 bar 10's sixty-fourth C4 deleted": (mutant_drop_sixty_fourth_c4, ["bar 10: C4 lasting 1/16"]),
    "3 bar 9's C6 onset moved a sixteenth": (mutant_move_c6_onset, ["bar 9: C6 lasting 1/4 quarter(s) at beat 1.75",
                                                                     "bar 9: C6 lasting 1/4 quarter(s) at beat 1.5"]),
    "4 bar 10's double-dotted sixteenth shortened": (mutant_shorten_double_dotted, ["bar 10: F4 lasting 7/16",
                                                                                    "bar 10: F4 lasting 3/8"]),
    "5 a voicing head added": (mutant_add_voicing_head, ["bar 1: E4 lasting 4 quarter(s) at beat 1: an omitted source event"]),
    "6 a drum head added": (mutant_add_drum_head, ["bar 1: x lasting 1 quarter(s) at beat 1: an unpitched head"]),
    "7 bar 5's root an octave up": (mutant_root_octave, ["bar 5: F2", "bar 5: F3"]),
    "8 bar 12's root G2": (mutant_bar12_root, ["bar 12: C2", "bar 12: G2"]),
    "9 the staves swapped": (mutant_swap_staves, ["staff 1 bar 1: C5", "staff 2 bar 1: C2"]),
}


# --------------------------------------------------------------------------- the tests


class TestFixture(unittest.TestCase):
    """The frozen source events: bound to the raw identity, and the two-reader table's counts."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = rv.load_fixture(FIXTURE)

    def test_it_is_bound_to_the_raw_member(self) -> None:
        self.assertEqual(self.fixture["rawSha256"], RAW_SHA256)
        self.assertEqual(self.fixture["fixtureVersion"], rv.FIXTURE_VERSION)
        self.assertEqual({k: self.fixture["upper"][k] for k in ("part", "name", "staff")},
                         {"part": "P2", "name": "Riff", "staff": 1})
        self.assertEqual({k: self.fixture["lower"][k] for k in ("part", "name", "staff")},
                         {"part": "P1", "name": "Piano", "staff": 2})

    def test_it_holds_the_probes_counts(self) -> None:
        # docs/prompts/runs/A7a1/readers.json: two readers agree on riff 57, root 12, voicing 36, drum 144 heads.
        f = self.fixture
        self.assertEqual((len(f["upper"]["events"]), len(f["upper"]["rests"])), (57, 6))
        self.assertEqual((len(f["lower"]["events"]), len(f["lower"]["rests"])), (12, 0))
        self.assertEqual((len(f["omitted"]["pitched"]), f["omitted"]["unpitchedHeads"]), (36, 144))
        self.assertEqual((f["bars"], f["metre"]), (list(range(1, 13)), ["4/4"]))
        self.assertEqual(sum(1 for e in f["upper"]["events"] if e["head"] == "B4"), 18)
        self.assertEqual([e["head"] for e in f["lower"]["events"]],
                         ["C2", "C2", "C2", "C2", "F2", "F2", "C2", "C2", "G2", "F2", "C2", "C2"])
        self.assertTrue(all(e["tie"] is None for e in f["upper"]["events"] + f["lower"]["events"]))


class TestCommittedEdition(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.row = the_row()
        cls.data = edition_bytes()
        cls.fixture = rv.load_fixture(FIXTURE)

    def test_the_row_carries_the_derivation(self) -> None:
        edition = restaff.EDITIONS[CID]
        self.assertEqual(self.row["derivation"], edition.derivation())
        self.assertEqual(self.row["file"], edition.file)
        self.assertEqual(self.row["rawSha256"], RAW_SHA256)
        self.assertEqual(self.row["derivation"]["sourceSha256"], self.row["rawSha256"])
        self.assertEqual(import_pdmx.validate_derivation(self.row), [])

    def test_the_committed_file_is_the_rows_identity(self) -> None:
        self.assertEqual(hashlib.sha256(self.data).hexdigest(), self.row["convertedSha256"])

    def test_tempo_is_the_converters_default_and_the_hands_both(self) -> None:
        # The ruling, section 14: no tempo is printed, so 96 is defaulted; "120" is title metadata only.
        self.assertEqual((self.row["tempoBpm"], self.row["tempoDefaulted"]), (96.0, True))
        self.assertEqual((self.row["hands"], self.row["singleLine"]), ("both", False))
        self.assertNotIn("120", self.row["title"])

    def test_the_edition_equals_the_frozen_source_events(self) -> None:
        verdict = rv.verify(self.data, self.fixture)
        self.assertEqual(verdict.failures, [])
        # The converter adds no rest the source does not print (H1): the six riff rests stand alone.
        self.assertEqual(verdict.notes, [])

    def test_the_b_naturals_are_as_written(self) -> None:
        reading = rv.read(self.data)
        upper = [e for e in reading.events if e.staff == 1]
        self.assertEqual(sum(1 for e in upper if e.head == "B4"), 18)
        self.assertEqual(sorted((e.bar, str(e.onset + 1)) for e in upper if e.head.startswith("Bb")),
                         [(9, "2"), (10, "1")])

    def test_every_derived_row_verifies(self) -> None:
        rows = [row for row in table_rows() if row.get("derivation")]
        self.assertGreaterEqual(len(rows), 1)
        for row in rows:
            with self.subTest(row["id"]):
                fixture = rv.load_fixture(REPO / row["derivation"]["fixture"])
                self.assertEqual(fixture["rawSha256"], row["rawSha256"])
                self.assertEqual(rv.verify((SCORES / row["file"]).read_bytes(), fixture).failures, [])


class TestMutants(unittest.TestCase):
    """Each mutant fails, naming the bar and the event; the edition itself passes (above)."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.data = edition_bytes()
        cls.fixture = rv.load_fixture(FIXTURE)

    def test_the_unmutated_edition_written_the_same_way_passes(self) -> None:
        # The mutants are re-serialised by ElementTree; the same round trip with no change must pass, so a
        # mutant's failure is its change and not the serialisation.
        self.assertEqual(rv.verify(serial(tree(self.data)), self.fixture).failures, [])

    def test_each_mutant_fails_naming_its_bar_and_event(self) -> None:
        for name, (make, named) in MUTANTS.items():
            with self.subTest(name):
                verdict = rv.verify(make(self.data), self.fixture)
                self.assertFalse(verdict.ok, f"{name}: the verifier passed a mutant")
                text = "\n".join(verdict.failures)
                for phrase in named:
                    self.assertIn(phrase, text, f"{name}: no failure names {phrase!r}")


class TestDerivationValidation(unittest.TestCase):
    """`import_pdmx.validate_derivation`: the build refuses a derived row whose block does not hold."""

    def setUp(self) -> None:
        self.good = {"id": "song.x.pdmx", "rawSha256": RAW_SHA256,
                     "derivation": restaff.EDITIONS[CID].derivation()}

    def test_a_row_with_no_derivation_has_nothing_to_validate(self) -> None:
        self.assertEqual(import_pdmx.validate_derivation({"id": "x", "rawSha256": RAW_SHA256}), [])

    def test_the_real_block_validates(self) -> None:
        self.assertEqual(import_pdmx.validate_derivation(self.good), [])

    def test_each_broken_block_is_refused(self) -> None:
        cases = {
            "an unknown kind": {"kind": "arrange"},
            "a source sha that is not the row's raw sha": {"sourceSha256": "0" * 64},
            "an empty keep": {"keep": []},
            "a part both kept and omitted": {"omit": ["Riff", "Drumset"]},
            "a tool that is not in the repository": {"tool": "tools/content/pdmx/nowhere.py"},
            "a fixture that is not in the repository": {"fixture": "tools/content/tests/fixtures/restaff/none.json"},
            "an unknown field": {"note": "x"},
        }
        for why, change in cases.items():
            with self.subTest(why):
                row = copy.deepcopy(self.good)
                row["derivation"].update(change)
                self.assertNotEqual(import_pdmx.validate_derivation(row), [], why)
        with self.subTest("a fixture bound to another raw sha"):
            with tempfile.TemporaryDirectory(dir=scratch_root()) as scratch:
                other = Path(scratch) / "other.json"
                other.write_text(json.dumps({**rv.load_fixture(FIXTURE), "rawSha256": "1" * 64}), encoding="utf-8")
                row = copy.deepcopy(self.good)
                row["derivation"]["fixture"] = other.relative_to(REPO).as_posix()
                self.assertNotEqual(import_pdmx.validate_derivation(row), [])

    def test_the_import_fails_naming_the_row(self) -> None:
        with tempfile.TemporaryDirectory(dir=scratch_root()) as scratch:
            scratch_path = Path(scratch)
            row = {**the_row()}
            row["derivation"] = {**row["derivation"], "sourceSha256": "0" * 64}
            (scratch_path / "pdmx.json").write_text(json.dumps({"items": [row]}), encoding="utf-8")
            report = import_pdmx.import_pdmx(scratch_path / "out", scratch_path / "catalog.json", personal=True,
                                             strict_license=False, table_path=scratch_path / "pdmx.json")
            self.assertEqual(len(report.failures), 1)
            self.assertIn(row["id"], report.failures[0])

    def test_the_catalogue_item_says_what_was_done(self) -> None:
        row = the_row()
        notes = import_pdmx.build_item(row, bundled=True, checksum=row["convertedSha256"])["source"]["editionNotes"]
        for phrase in ("tools/content/pdmx/restaff.py", "Riff", "P1-Staff2", "P1-Staff1", "Drumset"):
            self.assertIn(phrase, notes)


class TestSelection(unittest.TestCase):
    """`restaff.select` keeps by id and refuses any other shape (stub scores; no music21)."""

    class Part:
        def __init__(self, pid: str) -> None:
            self.id = pid

    class Score:
        def __init__(self, ids: list[str]) -> None:
            self.parts = [TestSelection.Part(pid) for pid in ids]

        def remove(self, part: object) -> None:
            self.parts.remove(part)

    edition = restaff.EDITIONS[CID]

    def test_the_source_shape_keeps_the_riff_and_the_roots(self) -> None:
        score = restaff.select(self.Score(["P1-Staff1", "P1-Staff2", "Riff", "Drumset"]), self.edition)
        self.assertEqual([p.id for p in score.parts], ["P1-Staff2", "Riff"])

    def test_other_shapes_are_refused(self) -> None:
        for ids in (["P1-Staff1", "P1-Staff2", "Drumset"],                 # the riff missing
                    ["P1-Staff1", "P1-Staff2", "Riff"],                    # an omitted part missing
                    ["P1-Staff1", "P1-Staff2", "Riff", "Drumset", "Bass"],  # a third pitched part
                    ["P1-Staff1", "P1-Staff2", "Riff", "Riff", "Drumset"]):  # an id twice
            with self.subTest(ids=ids):
                with self.assertRaises(restaff.RestaffError):
                    restaff.select(self.Score(ids), self.edition)

    def test_a_raw_file_with_another_sha_is_refused_before_it_is_read(self) -> None:
        with tempfile.TemporaryDirectory(dir=scratch_root()) as scratch:
            raw = Path(scratch) / f"{CID}.mxl"
            raw.write_bytes(b"not the member")
            with self.assertRaises(restaff.RestaffError):
                restaff.restaff(raw, Path(scratch) / "out.mxl", self.edition)


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
