"""
A demand can be taught at more than one rung (E0b; the reviewer's finding 2 on E0a,
`docs/review/responses/5bfe6d2.md`).

`demands.json`'s `taughtAt` named one rung, "the first rung whose concepts name" the demand:
first in the curriculum file, the order E0a stopped reading as the path. So the walking bass was
`blues.5`'s alone, and `jazz.6`, whose lesson teaches a walking line and assigns one, taught
nothing of it: a learner through `jazz.6` was withheld it at `jazz.8`. Since E0b `taughtAt` is
every rung that genuinely teaches the demand, one per path — a rung whose ancestry
(`claims.rung_ancestry`) already holds a listed rung of the same demand is not a second teaching
rung. The schema requires the list; the validator checks that every listed rung exists, the
one-per-path rule, and that each listed rung's concepts name the demand (where `taughtAtNote`
writes down a hand reading of the lesson for that rung, a warning instead, until F reads the
lesson); and it warns where a rung's concepts name the demand and no rung on its path is listed.

Each case is written to fail on the committed vocabulary and validator with the demand and the
rung in its message, except the ones marked as holding already (a sibling track, theory.9).
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import claims  # noqa: E402
import validate  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[3]
CONTENT = REPO_ROOT / "content"
WALK = "texture.walking-bass"


def source_curriculum() -> dict:
    stages: list[dict] = []
    for path in sorted((CONTENT / "curriculum").glob("stage-*.json")):
        stages.extend(json.loads(path.read_text(encoding="utf-8")).get("stages", []))
    return {"stages": stages}


class Vocabulary(unittest.TestCase):
    def setUp(self) -> None:
        self.skills, self.demands = validate.load_vocabulary()
        self.catalog = json.loads((CONTENT / "catalog.static.json").read_text(encoding="utf-8"))
        self.curriculum = source_curriculum()

    def with_taught_at(self, demand_id: str, value, note: str | None = None) -> dict:
        demands = copy.deepcopy(self.demands)
        for demand in demands["demands"]:
            if demand["id"] == demand_id:
                demand["taughtAt"] = value
                if note is not None:
                    demand["taughtAtNote"] = note
        return demands

    def errors(self, demands: dict) -> list[str]:
        return validate.vocabulary_errors(self.skills, demands, self.curriculum, self.catalog)

    def warnings(self, demands: dict) -> list[str]:
        # Looked up per call, so the committed validator's lack of it is this case's red, not the file's.
        return validate.taught_at_findings(self.skills, demands, self.curriculum)[1]


class TestTheShape(Vocabulary):
    def test_the_schema_refuses_one_rung_as_a_string(self) -> None:
        errors = self.errors(self.with_taught_at(WALK, "blues.5"))
        self.assertTrue(any("taughtAt" in e and "'blues.5' is not of type 'array'" in e for e in errors),
                        f"{WALK} taught at the string 'blues.5': the schema must require a list; got {errors}")

    def test_the_schema_refuses_null(self) -> None:
        errors = self.errors(self.with_taught_at("rhythm.sixteenths", None))
        self.assertTrue(any("taughtAt" in e and "None is not of type 'array'" in e for e in errors),
                        f"rhythm.sixteenths taught at null: taught nowhere is [] now; got {errors}")

    def test_taught_nowhere_is_an_empty_list_and_says_why(self) -> None:
        demands = self.with_taught_at("rhythm.sixteenths", [])
        self.assertEqual(self.errors(demands), [], "rhythm.sixteenths taught at []: the empty list is the shape")
        for demand in demands["demands"]:
            if demand["id"] == "rhythm.sixteenths":
                demand.pop("taughtAtNote", None)
        errors = self.errors(demands)
        self.assertTrue(any("'taughtAtNote' is a required property" in e for e in errors),
                        f"rhythm.sixteenths taught at [] with no note: the note is required; got {errors}")


class TestOneTeachingRungPerPath(Vocabulary):
    def test_two_paths_two_rungs(self) -> None:
        # Revised (F2): blues.6 for blues.5, which introduces the walking bass and so may not be listed.
        errors = self.errors(self.with_taught_at(WALK, ["blues.6", "jazz.6"]))
        self.assertEqual(errors, [], f"{WALK} at blues.6 and jazz.6, neither on the other's path, is valid")

    def test_a_listed_rung_on_another_listed_rung_s_path_fails(self) -> None:
        errors = self.errors(self.with_taught_at(WALK, ["blues.5", "blues.6"]))
        self.assertTrue(any(WALK in e and "'blues.6'" in e and "'blues.5'" in e and "one teaching rung per path" in e
                            for e in errors),
                        f"{WALK} at blues.5 and blues.6, which builds on blues.5: one teaching rung per path; got {errors}")

    def test_a_listed_rung_the_curriculum_lacks_fails(self) -> None:
        errors = self.errors(self.with_taught_at(WALK, ["blues.5", "jazz.66"]))
        self.assertTrue(any(WALK in e and "'jazz.66', which is not a rung" in e for e in errors),
                        f"{WALK} at jazz.66: not a rung; got {errors}")


class TestTheListIsTheLessons(Vocabulary):
    def test_a_listed_rung_whose_concepts_do_not_name_the_demand_fails(self) -> None:
        errors = self.errors(self.with_taught_at(WALK, ["blues.5", "classical.6"]))
        self.assertTrue(any(WALK in e and "'classical.6'" in e and "concepts name none of" in e for e in errors),
                        f"{WALK} at classical.6, whose concepts do not name walking-bass; got {errors}")

    def test_a_hand_reading_the_note_writes_down_warns_instead(self) -> None:
        """
        A listed rung whose concepts do not name the demand is a hand reading: warned where the note
        names the rung, failed where it does not, and failed whatever the note says where the rung
        only introduces the demand.

        Revised (F2a). Old assumption: the committed vocabulary holds a hand reading to read, 3.1's
        accidentals. F2a moved them to 3.3, which names them, and 3.1 introduces them; so the case is
        constructed on 3.2, whose concepts name neither `chromatic` nor `accidentals`, and 3.1 is the
        introducing rung no note may list.
        """
        errors = self.errors(self.with_taught_at("pitch.chromatic", ["3.2"], note="3.2 reads it by hand."))
        self.assertEqual(errors, [], "pitch.chromatic at 3.2 with a note naming 3.2 is a warning, not an error")
        warned = [w for w in self.warnings(self.with_taught_at("pitch.chromatic", ["3.2"], note="3.2 reads it by hand."))
                  if "pitch.chromatic" in w and "'3.2'" in w]
        self.assertEqual(len(warned), 1, "pitch.chromatic at 3.2 is a hand reading and is warned")
        errors = self.errors(self.with_taught_at("pitch.chromatic", ["3.2"], note="Read by hand from a lesson."))
        self.assertTrue(any("pitch.chromatic" in e and "'3.2'" in e for e in errors),
                        f"pitch.chromatic at 3.2 with a note that does not name 3.2 fails; got {errors}")
        errors = self.errors(self.with_taught_at("pitch.chromatic", ["3.1"], note="3.1 reads it by hand."))
        self.assertTrue(any("pitch.chromatic" in e and "'3.1'" in e and "only introduces it" in e for e in errors),
                        f"pitch.chromatic at 3.1, which introduces accidentals: no note makes it a teaching rung; got {errors}")

    def test_jazz_6_naming_the_walking_bass_must_make_the_list(self) -> None:
        # Revised (F2): blues.6 for blues.5, which introduces the walking bass and so may not be listed.
        demands = self.with_taught_at(WALK, ["blues.6", "jam.6"])
        self.assertEqual(self.errors(demands), [])
        warned = [w for w in self.warnings(demands) if WALK in w and "jazz.6" in w]
        self.assertEqual(len(warned), 1,
                         f"{WALK}: jazz.6's concepts name walking-bass and nothing on its path is listed; got {self.warnings(demands)}")

    def test_the_committed_lists_are_the_lessons_readings(self) -> None:
        """
        The committed vocabulary holds together and every listed rung is one whose concepts name the
        demand: no hand reading is left, so the build warns about none.

        Revised (F2, L110). Old assumption: four warnings, `latin` naming walking-bass (its lesson
        teaches a tumbao, never a walking bass) and 1.1's steps read by hand beside 1.5's and 3.1's.
        F2 removed `latin`'s concept and named `steps` in 1.1's concepts, so the derivation gives
        1.1 itself.

        Revised (F2a; the reviewer's required change, `responses/b41e19e.md`). Old assumption: 1.5's
        leap and 3.1's accidentals stay hand readings, warned. No option on either rung establishes
        its demand, and a hand reading may not grant taught status where no option does: 1.5 and 3.1
        now introduce them, 2.1 and 3.3 name them, and the two notes that read the lessons by hand
        are gone.
        """
        self.assertEqual(self.errors(self.demands), [])
        self.assertEqual(self.warnings(self.demands), [], "no hand reading and no teaching rung the lists omit")
        by_id = {d["id"]: d for d in self.demands["demands"]}
        self.assertEqual(by_id["interval.leap"]["taughtAt"], ["2.1"])
        self.assertEqual(by_id["pitch.chromatic"]["taughtAt"], ["3.3"])
        for demand_id, rung in (("interval.leap", "1.5"), ("pitch.chromatic", "3.1")):
            note = by_id[demand_id].get("taughtAtNote") or ""
            self.assertFalse(validate._names_rung(note, rung),
                             f"{demand_id}: the note still reads {rung}, which introduces it, by hand: {note!r}")


class TestTheDerivation(Vocabulary):
    def test_the_walking_bass_is_taught_on_three_paths(self) -> None:
        """
        Revised (F2 item 1). Old assumption: `blues.5` teaches the walking bass. Its one walking-bass
        exercise is the line alone, left hand only, and the demand is a walk under a right hand that
        plays; `blues.5` now introduces it (`introduces`), and `blues.6`, whose walking-bass exercise
        puts a right hand over the same line, is the blues path's teaching rung by the derivation.
        """
        by_id = {d["id"]: d for d in self.demands["demands"]}
        self.assertEqual(by_id[WALK]["taughtAt"], ["jazz.6", "blues.6", "jam.6"],
                         f"{WALK}: jazz.6 ('Comping, walking bass, and hearing the changes'), blues.6 ('a line that "
                         "walks') and jam.6 ('Walking bass, when there is no bass player'), in the curriculum's order")

    def test_the_rungs_whose_concepts_name_a_demand_one_per_path(self) -> None:
        # Revised (F2): `latin` no longer names walking-bass (L110) and `blues.5` introduces it, so the
        # derivation's walking-bass rungs are the listed ones and the `latin` exception below is gone.
        skills = {s["id"]: s for s in self.skills["skills"]}
        demands = {d["id"]: d for d in self.demands["demands"]}
        derived = claims.teaching_rungs(self.curriculum, skills, demands)
        self.assertEqual(derived[WALK], ["jazz.6", "blues.6", "jam.6"])
        self.assertEqual(derived["rhythm.syncopation"], ["latin.3", "4.5"])
        self.assertEqual(derived["key.signature"], ["3.1", "theory.3"])
        self.assertEqual(derived["texture.hands-together"], ["2.1", "holiday"])
        # Added (F2a): the leap is 2.1's and the note outside the key 3.3's, read from their concepts;
        # 1.5 and 3.1 introduce them (`introduces`), which the derivation never reads. It gave blues.7
        # and ragtime.9 (leaps) and technique.4 (chromatic) while no core rung named either.
        self.assertEqual(derived["interval.leap"], ["2.1"])
        self.assertEqual(derived["pitch.chromatic"], ["3.3"])
        # Every other derived rung is the listed one: the lists differ from the derivation only where
        # the entry says, per demand, why.
        ancestry = claims.rung_ancestry(self.curriculum)
        for demand_id, rungs in derived.items():
            listed = demands[demand_id]["taughtAt"]
            for rung in rungs:
                on_path = [r for r in listed if r in ancestry[rung]]
                self.assertTrue(on_path, f"{demand_id}: {rung}'s concepts name it and nothing on its path is listed")


class TestTheWalkingBassOnThePaths(unittest.TestCase):
    """The build's reading (`claims.untaught_on`), which the rung-claims report and D0's rung check share."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.curriculum = source_curriculum()
        cls.ancestry = claims.rung_ancestry(cls.curriculum)
        _skills, cls.demands = claims.load_vocabulary()
        cls.item = {"id": "song.e0b.walking-probe", "demands": [WALK],
                    "measurement": {"status": "measured", "established": [WALK]}}

    def untaught(self, rung: str) -> list[str]:
        return claims.untaught_on(self.item, rung, self.ancestry, self.demands)

    def test_jazz_6_teaches_it_without_blues_5(self) -> None:
        self.assertNotIn("blues.5", self.ancestry["jazz.6"], "jazz.6's path does not go through blues.5")
        for rung in ("jazz.6", "jazz.7", "jazz.8", "jazz.9"):
            self.assertEqual(self.untaught(rung), [], f"{WALK} at {rung}: jazz.6 teaches it, on {rung}'s path")

    def test_jam_6_teaches_it_on_its_own_path(self) -> None:
        self.assertNotIn("blues.5", self.ancestry["jam.6"])
        self.assertEqual(self.untaught("jam.6"), [], f"{WALK} at jam.6: 'Walking bass, when there is no bass player'")

    def test_theory_9_and_the_sibling_tracks_still_do_not_inherit_it(self) -> None:
        # Holding already on the committed vocabulary: adding jazz.6 must not change these.
        for rung in ("theory.9", "classical.6", "chords-pop.6", "jazz.5", "latin"):
            self.assertEqual(self.untaught(rung), [WALK], f"{WALK} at {rung}: no teaching rung on its path")

    def test_blues_5_introduces_it_and_blues_6_teaches_it(self) -> None:
        """
        F2 item 1: `blues.5` names the walking bass under `introduces` (its exercise is the line
        alone), which never makes it a teaching rung, so a walk is untaught there; from `blues.6`,
        whose walking-bass exercise has a right hand over it, the blues path has been taught one.
        Red on the committed vocabulary, where `blues.5` was listed.
        """
        self.assertEqual(self.untaught("blues.5"), [WALK], f"{WALK} at blues.5: introduced there, not taught")
        for rung in ("blues.6", "blues.7", "blues.8", "blues.9"):
            self.assertEqual(self.untaught(rung), [], f"{WALK} at {rung}: blues.6 teaches it, on {rung}'s path")


class TestTheCoreTeachesWhereAnOptionEstablishes(unittest.TestCase):
    """
    F2a (the reviewer's required change on F2, `responses/b41e19e.md`): the leap and the note outside
    the key are taught on the core where an option on the rung practises them. 1.5 introduces the leap
    (no option there establishes one) and 2.1 teaches it, where the left hand moves from C to F and to
    G; 3.1 introduces accidentals (its songs have none) and 3.3 teaches them, where A minor's raised
    seventh is written as one every time. So a later option carrying either demand is untaught after
    the introduction and taught from the teaching rung, on the build's reading (`claims.untaught_on`
    over the rung's ancestry, which the report, D0's record and the app's gate share). Red on the
    committed vocabulary, which listed 1.5 and 3.1 by hand reading.
    """

    @classmethod
    def setUpClass(cls) -> None:
        cls.curriculum = source_curriculum()
        cls.ancestry = claims.rung_ancestry(cls.curriculum)
        _skills, cls.demands = claims.load_vocabulary()
        cls.lessons = {lesson["id"]: lesson for _s, _u, lesson in claims.lessons_in_order(cls.curriculum)}

    def untaught(self, demand: str, rung: str) -> list[str]:
        item = {"id": f"song.f2a.{demand}-probe", "demands": [demand],
                "measurement": {"status": "measured", "established": [demand]}}
        return claims.untaught_on(item, rung, self.ancestry, self.demands)

    def test_the_leap_is_untaught_after_1_5_and_taught_from_2_1(self) -> None:
        # Revised (F2b part 2; the reviewer's required change on F2a, `responses/fc91e5a.md`). Old
        # assumption: 1.5 and 2.1 name `leaps`, the advanced jump's concept ("leaps of an octave or more",
        # Grades 5-6). They name the beginner's `leap`, a fourth or fifth; the demand is the same.
        self.assertIn("leap", self.lessons["1.5"].get("introduces") or [], "1.5 introduces the leap")
        self.assertNotIn("leap", self.lessons["1.5"]["concepts"])
        self.assertIn("leap", self.lessons["2.1"]["concepts"], "2.1 names the leap it practises")
        for rung in ("1.4", "1.5"):
            self.assertEqual(self.untaught("interval.leap", rung), ["interval.leap"],
                             f"interval.leap at {rung}: 1.5 only introduces it")
        for rung in ("2.1", "2.2", "2.5", "3.1"):
            self.assertEqual(self.untaught("interval.leap", rung), [], f"interval.leap at {rung}: 2.1 teaches it, on its path")

    def test_the_note_outside_the_key_is_untaught_after_3_1_and_taught_from_3_3(self) -> None:
        self.assertIn("accidentals", self.lessons["3.1"].get("introduces") or [], "3.1 introduces accidentals")
        self.assertNotIn("accidentals", self.lessons["3.1"]["concepts"])
        self.assertIn("accidentals", self.lessons["3.3"]["concepts"], "3.3 names the accidentals it practises")
        for rung in ("3.1", "3.2"):
            self.assertEqual(self.untaught("pitch.chromatic", rung), ["pitch.chromatic"],
                             f"pitch.chromatic at {rung}: 3.1 only introduces it")
        for rung in ("3.3", "3.4", "4.1", "technique.4"):
            self.assertEqual(self.untaught("pitch.chromatic", rung), [], f"pitch.chromatic at {rung}: 3.3 teaches it, on its path")

    def test_a_track_whose_path_leaves_the_core_before_the_teaching_rung_is_not_credited(self) -> None:
        # holiday's path leaves the core at 1.5 and blues.3's at 3.2 (E0a): each stood on a hand reading's
        # rung and no longer inherits a demand its path does not teach.
        self.assertEqual(self.untaught("interval.leap", "holiday"), ["interval.leap"])
        self.assertEqual(self.untaught("pitch.chromatic", "blues.3"), ["pitch.chromatic"])


class TestTheTwoLeapsAreTwoConcepts(unittest.TestCase):
    """
    F2b part 2 (the reviewer's required change on F2a, `responses/fc91e5a.md`): "leaps" meant two things
    under one id, the beginner's fourth or fifth that 1.5 introduces and 2.1 teaches, and the advanced
    jump of an octave or more that `blues.7` and `ragtime.9` name (Grades 5-6). A learner at 2.1 opening
    the entry read about a skill years away. The beginner's leap is its own concept, `leap`; the advanced
    `leaps` keeps its id and finder and is named only on those two technique rungs; each entry's name says
    which leap it is; and the detector reads the new concept as the leap demand, so the teaching rung is
    still 2.1. Red on the stage and concept files before F2b, where 1.5 and 2.1 name `leaps`.
    """

    #: Display names two concept ids already share, each pair with both ids named by lessons, so the Skills
    #: screen lists two entries under one name (found by F2b's case, not F2b's to merge; a follow-up in
    #: Entry 123). The case fails on a new collision, and on one of these being fixed without this line.
    KNOWN_COLLISIONS = {
        "alberti bass": ["alberti", "alberti-bass"],
        "broken chords": ["broken-chord", "broken-chords"],
        "call and response": ["call-and-response", "call-response"],
        "contrary motion": ["contrary", "contrary-motion"],
        "key signatures": ["key-signature", "key-signatures"],
        "open voicings": ["open-voicing", "open-voicings"],
        "slash chords": ["slash-chord", "slash-chords"],
        "suspended chords": ["sus", "sus-chords"],
        "the sustain pedal": ["CC64", "sustain-pedal"],
        "trills": ["trill", "trills"],
    }

    @classmethod
    def setUpClass(cls) -> None:
        cls.curriculum = source_curriculum()
        cls.lessons = {lesson["id"]: lesson for _s, _u, lesson in claims.lessons_in_order(cls.curriculum)}
        cls.stage_of = {lesson["id"]: stage["number"] for stage, _u, lesson in claims.lessons_in_order(cls.curriculum)}
        data = json.loads((CONTENT / "curriculum" / "concepts.json").read_text(encoding="utf-8"))
        cls.concepts = {entry["id"]: entry for entry in data["concepts"]}

    def naming(self, concept: str) -> list[str]:
        return sorted(rung for rung, lesson in self.lessons.items()
                      if concept in list(lesson.get("concepts") or []) + list(lesson.get("introduces") or []))

    def test_the_beginner_leap_is_introduced_at_1_5_and_taught_at_2_1(self) -> None:
        self.assertIn("leap", self.lessons["1.5"].get("introduces") or [], "1.5 introduces the fourth or fifth")
        self.assertIn("leap", self.lessons["2.1"]["concepts"], "2.1 teaches it")
        self.assertEqual(self.naming("leap"), ["1.5", "2.1"])

    def test_the_advanced_jump_is_named_only_on_its_technique_rungs(self) -> None:
        self.assertEqual(self.naming("leaps"), ["blues.7", "ragtime.9"],
                         "leaps (an octave or more) is named where the technique rungs name it, and nowhere else")
        early = [rung for rung in self.naming("leaps") if self.stage_of[rung] <= 3]
        self.assertEqual(early, [], "a Stage 1-3 rung names the advanced jump")

    def test_each_entry_says_which_leap_it_is(self) -> None:
        leap, leaps = self.concepts["leap"], self.concepts["leaps"]
        self.assertEqual(leap["display"], "Leaps: a fourth or fifth")
        self.assertEqual(leap["finder"]["skill"], "reading and playing a jump of a fourth or fifth without feeling for it")
        self.assertEqual(leap["finder"]["levelWords"], "easy, elementary")
        self.assertEqual(leap["finder"]["constraints"], ["a few leaps of a fourth or fifth in a stepwise melody"])
        self.assertEqual(leap["finder"]["avoid"], ["octave leaps"])
        self.assertEqual(leap["finder"]["formats"], leaps["finder"]["formats"], "the shared formats line")
        self.assertNotIn("octave or more", json.dumps(leap), "the beginner's entry speaks of the advanced jump")
        # The advanced entry keeps its finder and its Grades 5-6 words; its name says which leap it is, in
        # words short enough to be read whole beside Drill it and Find more at 342 px ("Leaps: an octave or
        # more" was cut to "Leaps: an o…" there; plan.spec.ts measures it).
        self.assertEqual(leaps["display"], "Wide leaps")
        self.assertEqual(leaps["finder"]["skill"], "jumping accurately to a note you cannot feel for")
        self.assertEqual(leaps["finder"]["levelWords"], "advanced, Grade 5 to 6")
        self.assertIn("leaps of an octave or more", leaps["finder"]["constraints"])

    def test_no_two_entries_share_a_name_where_the_leaps_are(self) -> None:
        by_name: dict[str, list[str]] = {}
        for ident, entry in self.concepts.items():
            by_name.setdefault(" ".join(entry["display"].split()).casefold(), []).append(ident)
        for ident in ("leap", "leaps"):
            name = " ".join(self.concepts[ident]["display"].split()).casefold()
            self.assertEqual(by_name[name], [ident], f"{ident}'s name {name!r} is shared")
        self.assertNotIn("leaps", by_name, "an entry is called just 'Leaps', which says neither leap")
        shared = {name: sorted(ids) for name, ids in by_name.items() if len(ids) > 1}
        self.assertEqual(shared, self.KNOWN_COLLISIONS, "a display name is shared that is not recorded (or a recorded one was fixed)")

    def test_the_detector_reads_the_beginner_leap_as_the_leap_and_2_1_still_teaches_it(self) -> None:
        self.assertEqual(claims.CONCEPT_DEMANDS.get("leap"), "interval.leap", "the leap demand's concept is the beginner's")
        skills, demands = claims.load_vocabulary()
        self.assertEqual(claims.teaching_rungs(self.curriculum, skills, demands)["interval.leap"], ["2.1"])
        self.assertEqual(demands["interval.leap"]["taughtAt"], ["2.1"], "demands.json unchanged")

    def test_a_fourth_never_establishes_the_advanced_jump(self) -> None:
        """
        F2c (the reviewer's required change on F2b, `responses/ddba53e9.md`): the leap detector finds a
        fourth or wider, so it can establish the beginner's fourth or fifth and cannot tell a fourth from the
        advanced jump of an octave or more. `leaps` maps to no demand until a detector proves octave-or-more material: on
        `blues.7` and `ragtime.9` it is a concept no detector measures, never a claim a fourth keeps. A
        fourth-only reading (a measured item whose one established demand is the leap) still keeps 2.1's
        claim. Red before F2c, where `leaps` mapped to `interval.leap` and that item kept a claim on both.
        """
        self.assertNotIn("leaps", claims.CONCEPT_DEMANDS,
                         "the advanced jump is read by the fourth-or-wider detector, which cannot tell a fourth from an octave")
        skills, demands = claims.load_vocabulary()
        self.assertEqual(claims.concepts_naming(skills, demands)["interval.leap"], {"leap"})
        fourth = {"id": "song.f2c.fourth-only-probe", "demands": ["interval.leap"],
                  "measurement": {"status": "measured", "established": ["interval.leap"]}}
        for rung in ("blues.7", "ragtime.9"):
            with self.subTest(rung=rung):
                rung_claims, unmeasurable = claims.rung_claims_of(self.lessons[rung], skills, demands)
                self.assertEqual([c for c in rung_claims if c["id"] == "interval.leap"], [], f"{rung} claims the leap demand")
                self.assertEqual([c for c in rung_claims if claims.status_of(c, fourth, skills) == "established"], [],
                                 f"a fourth keeps a claim of {rung}")
                self.assertIn("leaps", unmeasurable, f"{rung}: the octave-or-more jump is a concept no detector measures")
        rung_claims, _unmeasurable = claims.rung_claims_of(self.lessons["2.1"], skills, demands)
        leap = [c for c in rung_claims if c["id"] == "interval.leap"]
        self.assertEqual(leap, [{"kind": "demand", "id": "interval.leap", "from": "concept leap"}])
        self.assertEqual(claims.status_of(leap[0], fourth, skills), "established", "the beginner's claim is a fourth's to keep")


class TestThePracticeTrackWalksItsOwnRungs(unittest.TestCase):
    """
    F2a item 3, its track half (L109's data half): each practice rung after the first names the one
    before as its prerequisite, as the app walks the track (`strandsOf`: a track's next rung is the first
    of its line not passed), so its ancestry holds its own track's earlier rungs and an option two of its
    rungs list is read where the track first meets it. No rung outside the practice track names a
    practice rung, so no other rung's ancestry changes. Red on the committed stage file, where the
    practice rungs carry no prerequisites.
    """

    @classmethod
    def setUpClass(cls) -> None:
        cls.curriculum = source_curriculum()
        cls.ancestry = claims.rung_ancestry(cls.curriculum)
        cls.lessons = {lesson["id"]: lesson for _s, _u, lesson in claims.lessons_in_order(cls.curriculum)}

    def test_each_practice_rung_stands_on_the_one_before(self) -> None:
        for n in range(2, 6):
            rung, before = f"practice.{n}", f"practice.{n - 1}"
            with self.subTest(rung=rung):
                self.assertIn(before, self.lessons[rung].get("prerequisites") or [])
                self.assertTrue({f"practice.{k}" for k in range(1, n)} <= self.ancestry[rung],
                                f"{rung}'s ancestry holds every practice rung before it")

    def test_no_rung_off_the_practice_track_stands_on_one(self) -> None:
        outside = sorted(rung for rung, members in self.ancestry.items()
                         if not rung.startswith("practice.") and any(m.startswith("practice.") for m in members))
        self.assertEqual(outside, [], "a practice prerequisite changed another rung's ancestry")

    def test_the_floor_s_shared_options_are_read_where_the_track_first_meets_them(self) -> None:
        """
        Revised (F2b; the reviewer's required change on F2a, `responses/fc91e5a.md`, part 1). Old
        assumption: the five-finger pattern is first met on `practice.1`, whose path stopped at Stage 0.
        `practice.1` now stands on 1.1, which lists the pattern and *Ode to Joy*, so both are read at 1.1;
        the steps-and-skips study, which 1.5 lists and 1.1 does not, is still first met on `practice.1`.
        """
        firsts = claims.first_listings(self.curriculum, self.ancestry)
        for item_id in ("exercise.five-finger.c-major.right", "song.classical.ode-to-joy.rh"):
            with self.subTest(read_at_1_1=item_id):
                self.assertIn("1.1", firsts[item_id])
                self.assertNotIn("practice.1", firsts[item_id], "practice.1 stands on 1.1, which lists it")
        study = "exercise.reading.steps-and-skips-c"
        self.assertIn("practice.1", firsts[study])
        self.assertNotIn("practice.2", firsts[study], "practice.2 stands on practice.1, which lists it")

    def test_the_floor_stands_on_1_1(self) -> None:
        """
        F2b (the reviewer's required change on F2a, `responses/fc91e5a.md`, part 1): `practice.1` names
        1.1 as its core prerequisite, so the track's path holds the first Stage 1 rung and no later one,
        and the track opens from the second rung of Stage 1. What 1.1 teaches (its steps: the five-finger
        pattern, *Ode to Joy*) is taught on the floor; the steps-and-skips study's skips stay untaught
        there until 1.5, truthfully. Red on the committed stage file, where `practice.1` names no
        prerequisite and its path stops at Stage 0.
        """
        self.assertEqual(self.lessons["practice.1"].get("prerequisites"), ["1.1"])
        for n in range(1, 6):
            rung = f"practice.{n}"
            with self.subTest(path=rung):
                self.assertEqual(sorted(r for r in self.ancestry[rung] if r.startswith("1.")), ["1.1"],
                                 f"{rung} stands on 1.1 and on no later Stage 1 rung")
        _skills, demands = claims.load_vocabulary()

        def untaught(demand_ids: list[str], rung: str) -> list[str]:
            probe = {"id": "exercise.f2b.probe", "demands": demand_ids,
                     "measurement": {"status": "measured", "established": demand_ids}}
            return claims.untaught_on(probe, rung, self.ancestry, demands)

        # The demands the floor's rows carry on the build (the report's rows before F2b, census-before.txt).
        self.assertEqual(untaught(["interval.step"], "practice.1"), [], "the five-finger pattern and Ode: 1.1 teaches steps")
        self.assertEqual(untaught(["interval.step", "interval.skip"], "practice.1"), ["interval.skip"],
                         "the steps-and-skips study: its skips are 1.5's, still untaught on the floor")
        self.assertEqual(untaught(["interval.step", "interval.skip"], "1.5"), [], "and taught where 1.5 lists it (holding already)")


def fixture_path(first: dict) -> dict:
    """Three core rungs in order: `first`, then F.2 naming nothing, then F.3 whose option carries a walk."""
    lessons = [first,
               {"id": "F.2", "concepts": [], "exerciseOptions": [], "songOptions": []},
               {"id": "F.3", "concepts": [], "exerciseOptions": ["exercise.f2.walk"], "songOptions": []}]
    return {"stages": [{"number": 6, "units": [{"id": "F", "track": "core", "lessons": lessons}]}]}


class TestIntroducedIsNeverTaught(unittest.TestCase):
    """
    F2 item 7 (the reviewer's required change): an `introduces` entry never makes its rung a
    teaching rung, never enters `taughtAt`, and so leaves a later option carrying the demand on the
    same path untaught; the same concept in `concepts` teaches it. Read through the build's own
    functions: the derivation (`teaching_rungs`), then the report's and the gate's reading
    (`untaught_on`) with the vocabulary's list set to what the derivation gives.
    """

    ITEM = {"id": "exercise.f2.walk", "demands": [WALK], "measurement": {"status": "measured", "established": [WALK]}}

    def untaught_at_f3(self, first: dict) -> tuple[list[str], list[str]]:
        skills, demands = claims.load_vocabulary()
        curriculum = fixture_path(first)
        derived = claims.teaching_rungs(curriculum, skills, demands)[WALK]
        vocabulary = copy.deepcopy(demands)
        vocabulary[WALK]["taughtAt"] = derived
        return derived, claims.untaught_on(self.ITEM, "F.3", claims.rung_ancestry(curriculum), vocabulary)

    def test_an_earlier_rung_that_only_introduces_it_leaves_it_untaught(self) -> None:
        derived, untaught = self.untaught_at_f3(
            {"id": "F.1", "concepts": [], "introduces": ["walking-bass"], "exerciseOptions": [], "songOptions": []})
        self.assertEqual(derived, [], "F.1 introduces the walking bass: no teaching rung")
        self.assertEqual(untaught, [WALK], "F.3's option carries a walk F.1 only introduced")

    def test_an_earlier_rung_that_teaches_it_covers_the_later_option(self) -> None:
        derived, untaught = self.untaught_at_f3(
            {"id": "F.1", "concepts": ["walking-bass"], "exerciseOptions": [], "songOptions": []})
        self.assertEqual(derived, ["F.1"])
        self.assertEqual(untaught, [], "F.1 teaches the walking bass, on F.3's path")


if __name__ == "__main__":
    unittest.main()
