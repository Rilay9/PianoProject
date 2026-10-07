"""
Sixteenth notes have an owner (L120c; the reviewer's Question 3 on L120a, `docs/review/responses/0bcd3be0.md`,
and the brief's approval with its guard, `docs/review/responses/questions-bbd7f99a.md`).

Until L120c no concept mapped to `rhythm.sixteenths` (`claims.CONCEPT_DEMANDS` had no row) and its `taughtAt`
was `[]`, so every option carrying written sixteenths was refused `untaught` wherever it stood: 207 options at
L120b's head, 67 of them on rungs whose lessons do teach sixteenths (`ragtime.5`, `technique.6`) or stand on
one that could. The reviewer ruled:

- core 4.4 is the first honest core owner, with a real teaching addition — the learner is working on a stream
  of Hanon sixteenths at a metronome, and the lesson now says what those sixteenths are: four even
  subdivisions of the quarter-note beat;
- `ragtime.5` (the sixteenth–eighth–sixteenth figure, played straight, "counting sixteenths out loud") and
  `technique.6` ("four notes to the beat", "a page of sixteenths") claim what their lessons already teach —
  explicit ownership records; on their paths 4.4 already teaches it, so they move no gate verdict;
- `latin.7` and `holiday.7` inherit and claim nothing; 3.5, the pedal lesson, gets nothing.

A concept `sixteenth-notes` names the demand (`subdivision` is a skill over three demands and so names none,
`claims.concepts_naming`). Each case here was written red on L120b's head.

Two groups of cases read the built content (run `python tools/content/build.py` first; CI: the step 'Build
content', before 'Content pipeline tests'): the claim rule at 4.4 and the table's lines. The Hanon cases read
the built files too, because the lesson's words are about the page the app prints.
"""
from __future__ import annotations

import json
import re
import sys
import unittest
import zipfile
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import claims  # noqa: E402
import untaught_options as U  # noqa: E402
import validate  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
CONTENT = REPO / "content"
BUILT = REPO / "app" / "public" / "content"
SIXTEENTHS = "rhythm.sixteenths"
CONCEPT = "sixteenth-notes"

#: The rungs whose lessons teach sixteenths and now say so (the brief's items 3-5).
CLAIMING = ["4.4", "ragtime.5", "technique.6"]


def source_curriculum() -> dict:
    stages: list[dict] = []
    for path in sorted((CONTENT / "curriculum").glob("stage-*.json")):
        stages.extend(json.loads(path.read_text(encoding="utf-8")).get("stages", []))
    return {"stages": stages}


def built(name: str):
    path = BUILT / name
    if not path.is_file():
        raise AssertionError(
            f"{path} is missing, and this test reads the built content: run "
            "`python tools/content/build.py` first (CI: the step 'Build content', "
            "before 'Content pipeline tests')"
        )
    return json.loads(path.read_text(encoding="utf-8"))


def probe(demand: str) -> dict:
    """A measured row carrying one demand, established: what the coping question asks of it at a rung."""
    return {"id": f"song.l120c.{demand}-probe", "demands": [demand],
            "measurement": {"status": "measured", "established": [demand], "located": {demand: 16}}}


class TheConceptAndItsMapping(unittest.TestCase):
    def test_sixteenth_notes_maps_to_rhythm_sixteenths(self) -> None:
        self.assertEqual(claims.CONCEPT_DEMANDS.get(CONCEPT), SIXTEENTHS,
                         "the one row the build's mapping table gains: sixteenth-notes names rhythm.sixteenths")
        skills, demands = claims.load_vocabulary()
        self.assertEqual(claims.concepts_naming(skills, demands).get(SIXTEENTHS), {CONCEPT},
                         "rhythm.sixteenths is named by sixteenth-notes alone (subdivision names three demands, so none)")

    def test_the_concept_has_a_display_name_and_a_finder(self) -> None:
        concepts = {c["id"]: c for c in json.loads((CONTENT / "curriculum" / "concepts.json").read_text(encoding="utf-8"))["concepts"]}
        entry = concepts.get(CONCEPT)
        self.assertIsNotNone(entry, "concepts.json has no sixteenth-notes entry")
        self.assertEqual(entry["display"], "Sixteenth notes")
        self.assertEqual(set(entry["finder"]), set(concepts["eighth-notes"]["finder"]), "the eighth-notes entry's shape")
        self.assertEqual(entry["finder"]["skill"], "playing four even notes to the beat")


class TheOwners(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.curriculum = source_curriculum()
        cls.ancestry = claims.rung_ancestry(cls.curriculum)
        cls.skills, cls.demands = claims.load_vocabulary()
        cls.lessons = {lesson["id"]: lesson for _s, _u, lesson in claims.lessons_in_order(cls.curriculum)}

    def naming(self) -> list[str]:
        return [rung for rung, lesson in self.lessons.items()
                if CONCEPT in list(lesson.get("concepts") or []) + list(lesson.get("introduces") or [])]

    def test_the_claims_are_4_4_ragtime_5_and_technique_6_and_no_other(self) -> None:
        self.assertEqual(sorted(self.naming()), sorted(CLAIMING))
        for rung in CLAIMING:
            self.assertIn(CONCEPT, self.lessons[rung]["concepts"], f"{rung} claims it under concepts, never introduces")
        for rung in ("latin.7", "holiday.7", "3.5"):
            self.assertNotIn(CONCEPT, self.lessons[rung]["concepts"], f"{rung} inherits or teaches none: no claim (the reviewer)")

    def test_its_derived_teaching_rung_is_4_4_alone(self) -> None:
        derived = claims.teaching_rungs(self.curriculum, {s: v for s, v in self.skills.items()}, self.demands, self.ancestry)
        self.assertEqual(derived[SIXTEENTHS], ["4.4"])
        for rung in ("ragtime.5", "technique.6"):
            self.assertIn("4.4", self.ancestry[rung], f"{rung} stands on 4.4: an ownership record that moves no verdict")
        earlier = [r for r in self.ancestry["4.4"] if r != "4.4" and CONCEPT in (self.lessons[r].get("concepts") or [])]
        self.assertEqual(earlier, [], "no rung 4.4's path holds names sixteenths")

    def test_taught_at_is_the_derivation_and_the_validator_is_clean_for_it(self) -> None:
        self.assertEqual(self.demands[SIXTEENTHS]["taughtAt"], ["4.4"])
        skills_file, demands_file = validate.load_vocabulary()
        errors, warnings = validate.taught_at_findings(skills_file, demands_file, self.curriculum)
        self.assertEqual([m for m in errors + warnings if SIXTEENTHS in m], [])

    def test_sixteenths_are_taught_on_the_paths_through_4_4_and_nowhere_else(self) -> None:
        item = probe(SIXTEENTHS)
        taught = ["ragtime.5", "ragtime.6", "ragtime.7", "ragtime.8", "ragtime.9",
                  "technique.6", "technique.7", "technique.8", "latin.7", "holiday.7", "4.4", "4.6"]
        for rung in taught:
            self.assertEqual(claims.untaught_on(item, rung, self.ancestry, self.demands, self.curriculum), [],
                             f"{SIXTEENTHS} at {rung}: 4.4 teaches it, on its path")
        for rung in ("3.5", "4.3", "classical.4.shelf", "technique.4"):
            self.assertEqual(claims.untaught_on(item, rung, self.ancestry, self.demands, self.curriculum), [SIXTEENTHS],
                             f"{SIXTEENTHS} at {rung}: no rung on its path teaches it")


class The4_4Addition(unittest.TestCase):
    """The words 4.4 gains, against the Hanon files the app prints (the reviewer's guard)."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.text = " ".join((CONTENT / "lessons" / "4.4.md").read_text(encoding="utf-8").split())
        cls.catalog = {row["id"]: row for row in built("catalog.json")}

    def page(self, number: int) -> str:
        path = BUILT / "scores" / "generated" / f"exercise.hanon.{number:02d}.both.mxl"
        with zipfile.ZipFile(path) as archive:
            name = next(n for n in archive.namelist() if n.endswith((".musicxml", ".xml")) and "container" not in n)
            return archive.read(name).decode("utf-8")

    def test_the_lesson_says_what_a_sixteenth_is_and_how_to_count_it(self) -> None:
        for words in ("**Sixteenths.** Every note but the last is a sixteenth", "four to a quarter-note beat",
                      "beamed in fours, two groups to a 2/4 bar", 'Count "1 e and a, 2 e and a"',
                      "four even notes per metronome click"):
            self.assertTrue(words in self.text, f"4.4's addition does not say {words!r}")
        # The lesson is read in three minutes at 200 words a minute (`lessonShape.test.ts`), and 4.4 is at the edge.
        body = re.sub(r"^---\r?\n[\s\S]*?\r?\n---\r?\n", "", (CONTENT / "lessons" / "4.4.md").read_text(encoding="utf-8"), count=1)
        self.assertLessEqual(len(body.split()), 600, "4.4 reads in more than three minutes")

    def test_hanon_1_to_5_are_sixteenths_in_2_4_four_to_each_quarter_beat(self) -> None:
        for number in range(1, 6):
            with self.subTest(number=number):
                xml = self.page(number)
                self.assertEqual(set(re.findall(r"<beats>(\d+)</beats>\s*<beat-type>(\d+)</beat-type>", xml)), {("2", "4")})
                types = Counter(re.findall(r"<type>(\w+)</type>", xml))
                self.assertEqual(set(types), {"16th", "half"}, "every note a sixteenth but the closing one")
                self.assertEqual(types["half"], 2, "the closing note in each hand is the one long note")
                divisions = int(re.search(r"<divisions>(\d+)</divisions>", xml).group(1))
                sixteenths = {int(re.search(r"<duration>(\d+)</duration>", note).group(1))
                              for note in re.findall(r"<note\b.*?</note>", xml, re.S) if "<type>16th</type>" in note}
                self.assertEqual(sixteenths, {divisions // 4}, "a sixteenth lasts a quarter of a quarter-note beat")
                # The primary beam groups the sixteenths four to a beam, begin-continue-continue-end.
                primary = re.findall(r'<beam number="1">(\w+)</beam>', xml)
                groups = "".join(p[0] for p in primary)
                self.assertEqual(groups, "bcce" * (types["16th"] // 4), "four sixteenths under each beam")
                self.assertEqual(self.catalog[f"exercise.hanon.{number:02d}.both"]["notation"]["times"], ["2/4"])

    def test_the_groups_of_four_start_on_the_beat(self) -> None:
        xml = self.page(1)
        divisions = int(re.search(r"<divisions>(\d+)</divisions>", xml).group(1))
        for measure in re.findall(r"<measure\b.*?</measure>", xml, re.S):
            # One voice at a time: a <backup> returns to the bar's start for the other hand.
            for voice in re.split(r"<backup>.*?</backup>", measure, flags=re.S):
                offset = 0
                for note in re.findall(r"<note\b.*?</note>", voice, re.S):
                    duration = int(re.search(r"<duration>(\d+)</duration>", note).group(1))
                    begins = re.search(r'<beam number="1">begin</beam>', note) is not None
                    if begins:
                        self.assertEqual(offset % divisions, 0, "a group of four begins on a quarter-note beat")
                    offset += duration

    def test_an_option_at_4_4_establishes_the_claim(self) -> None:
        curriculum = built("curriculum.json")
        lesson = next(l for _s, _u, l in claims.lessons_in_order(curriculum) if l["id"] == "4.4")
        self.assertIn(CONCEPT, lesson["concepts"])
        established = [item for item in lesson["exerciseOptions"] + lesson["songOptions"]
                       if SIXTEENTHS in ((self.catalog.get(item) or {}).get("measurement") or {}).get("established", [])]
        self.assertEqual(established, [f"exercise.hanon.0{n}.both" for n in range(1, 6)])


class TheCoreBefore4_4(unittest.TestCase):
    """
    Item 8, after the ownership re-run: every core option before 4.4 still refused for sixteenths was read at its
    notation and moved, replaced or simplified — never "taught" widened to keep it (the reviewer), never dropped
    from the Library. Red on the ownership run's build, where five such pairs stood (3.4, 3.5, 3.6, 4.2, 4.3).
    """

    BEGINNER = "song.classical.beethoven-fur-elise.beginner"
    EASY = "song.classical.beethoven-fur-elise.easy"
    CANON = "song.classical.pachelbel-canon-d.easy"
    CHORALE = "song.classical.schumann-schumann-album-for-the-young-op-68-no-4-a-hymn-tune-choral.pdmx"
    MELODY = "song.classical.schumann-melody-op-68-no-1.pdmx"

    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = built("catalog.json")
        cls.curriculum = built("curriculum.json")
        cls.ancestry = claims.rung_ancestry(cls.curriculum)
        cls.lessons = {l["id"]: l for _s, u, l in claims.lessons_in_order(cls.curriculum)}
        cls.core = [l["id"] for _s, u, l in claims.lessons_in_order(cls.curriculum) if u.get("track") == "core"]

    def songs(self, rung: str) -> list[str]:
        return self.lessons[rung]["songOptions"]

    def test_no_core_option_before_4_4_asks_sixteenths(self) -> None:
        report = U.table(self.catalog, self.curriculum)
        before = [f"{l['rung']} {l['item']}" for l in report["lines"]
                  if l["rung"] in self.core and "4.4" not in self.ancestry[l["rung"]]
                  and any(d["id"] == SIXTEENTHS for d in l["demands"])]
        self.assertEqual(before, [], "a core option before 4.4 is still refused for sixteenths")

    def test_each_placement_went_where_its_decision_says(self) -> None:
        for rung in ("3.4", "4.2"):
            self.assertNotIn(self.BEGINNER, self.songs(rung), f"{rung}: the beginner setting's sixteenths need 4.4")
            self.assertIn(self.EASY, self.songs(rung), f"{rung}: simplified to the easy setting, eighths in 3/4")
        self.assertEqual(self.songs("3.5")[0], self.CHORALE, "3.5: the Canon's place goes to the Chorale")
        self.assertNotIn(self.CANON, self.songs("3.5") + self.songs("3.6") + self.songs("4.3"))
        self.assertIn(self.MELODY, self.songs("4.3"), "4.3: the Canon replaced by Schumann's Melody")
        for rung in ("4.6", "4.7"):
            self.assertIn(self.CANON, self.songs(rung), f"{rung}: the Canon stays where 4.4 is on the path")
        ids = {row["id"] for row in self.catalog}
        self.assertTrue({self.BEGINNER, self.CANON} <= ids, "neither piece leaves the Library")


class TheTable(unittest.TestCase):
    def test_hanon_no_1_at_4_4_is_no_longer_a_line(self) -> None:
        report = U.table(built("catalog.json"), built("curriculum.json"))
        lines = {(line["rung"], line["item"]) for line in report["lines"]}
        self.assertFalse(("4.4", "exercise.hanon.01.both") in lines, "Hanon No. 1 at 4.4 is still refused untaught")
        mapping = [f"{line['rung']} {line['item']} {d['id']}" for line in report["lines"] for d in line["demands"]
                   if d["class"] == "B-mapping"]
        self.assertEqual(len(mapping), 0, f"B-mapping pairs left ({len(mapping)}), e.g. {mapping[:3]}: every one was a "
                                          "sixteenth pair, resolved by the ownership")


if __name__ == "__main__":
    unittest.main()
