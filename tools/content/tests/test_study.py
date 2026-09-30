"""
The generated study (D3; G19, G16, Part 15 §14): the grammar, the realiser, the four gates on their
adversaries, the rung that bounds every demand, and the candidate-rungs report.

- **The grammar** writes a cadence at every phrase end and an authentic cadence at the close, in the
  major and in the minor, and restates only what it declares.
- **The realiser** is valid first, then scored, and fails closed: a recipe it cannot write at its
  rung is refused with the reason before a note is drawn; a draw that breaks the hard layer is never
  scored; a recipe whose budget yields nothing above the musical floor is refused, never shipped.
- **The rung bounds every demand**: every study's measured demands — the app's detectors through
  the bridge (`tests/planned.measured`) — are taught at the rung its recipe names (E0a's ancestry).
- **The four gates** hold every study in the plan and go red on the brief's adversaries: a
  random-walk tune with the right demands (musical), a middle that repeats its opening bar four
  times (pedagogical), a cadence on a note outside its chord (musical), a left hand that stretches
  past an octave (physical); structural is `test_generator_invariants.py`'s row.
- **No placement**: no rung lists a study; the candidate-rungs report is `claims.py`'s reading,
  nothing more.
"""
from __future__ import annotations

import copy
import dataclasses
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import chord as m21chord, note as m21note, pitch as m21pitch  # noqa: E402

import build  # noqa: E402
import claims  # noqa: E402
import demands  # noqa: E402
import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402
import musical_evaluator as ME  # noqa: E402
import study as S  # noqa: E402
from tests import planned  # noqa: E402

CANONICAL = S.PLAN[0]


def studies() -> list:
    return planned.by_family()["study"]


class TestTheGrammar(unittest.TestCase):
    def test_every_progression_closes_as_its_phrase_claims(self) -> None:
        for mode, g in S.GRAMMAR.items():
            for progression in g["antecedent"] + g["contrast"]:
                with self.subTest(mode=mode, progression=progression):
                    self.assertEqual(S.chord_spec(mode, progression[-1])[0], 4, "a half cadence ends on the dominant")
                    self.assertEqual(S.chord_spec(mode, progression[0])[0] in (0, 1, 3, 5), True)
            for cadence in g["cadence"]:
                with self.subTest(mode=mode, cadence=cadence):
                    self.assertEqual(S.chord_spec(mode, cadence[-1][-1])[0], 0, "an authentic cadence ends on the tonic")
                    self.assertEqual(S.chord_spec(mode, cadence[-2][-1])[0], 4, "after the dominant")

    def test_the_minor_dominant_has_its_leading_tone(self) -> None:
        recipe = dataclasses.replace(CANONICAL, key="A", mode="minor", rung="3.1", texture="blocked")
        root = S.lh_root(recipe, "V", S.Limits.of("3.1"))
        self.assertEqual([p.name for p in S.chord_pitches(recipe, "V", root)], ["E", "G#", "B"])
        recipe = dataclasses.replace(recipe, key="D")
        root = S.lh_root(recipe, "V7", S.Limits.of("3.1"))
        self.assertEqual([p.name for p in S.chord_pitches(recipe, "V7", root)], ["A", "C#", "E", "G"])

    def test_each_form_declares_its_phrases_cadences_and_restatements(self) -> None:
        import random

        for bars in (8, 12, 16):
            recipe = dataclasses.replace(CANONICAL, bars=bars)
            plan = S.draw_plan(recipe, random.Random(bars), S.realisable_chords(recipe, S.Limits.of(recipe.rung)))
            with self.subTest(bars=bars):
                self.assertEqual(len(plan.progression), bars)
                self.assertEqual([p[2] for p in plan.phrases][-1], "authentic")
                self.assertEqual([p[1] - p[0] for p in plan.phrases], [4] * (bars // 4))
                for bar, source in plan.restated.items():
                    self.assertLess(source, bar)
                    self.assertEqual(plan.progression[bar], plan.progression[source])
                model = ME.Model(tonic=0, scale=ME.MAJOR, metre=ME.Metre(4, 4), bars=bars, melody=[],
                                 harmony=[[ME.Chord(*[S.chord_spec("major", n)[i] for i in (0, 2)]) for n in b]
                                          for b in plan.progression],
                                 max_leap=4, rests_allowed=True, phrases=[ME.Phrase(s, e, c) for s, e, c, _r in plan.phrases])
                for phrase in model.phrases:
                    self.assertTrue(ME.harmonic_cadence(model, phrase), phrase)

    def test_a_chord_the_rung_cannot_reach_is_not_drawn(self) -> None:
        """
        At 2.1 the left hand keeps a five-note position under a held root: vi's root is outside it, ii's,
        IV's and V's are not (a held root sounds alone, so V7's seventh is the tune's to sound).
        """
        allowed = S.realisable_chords(CANONICAL, S.Limits.of("2.1"))
        self.assertEqual(sorted(allowed), sorted(["I", "ii", "IV", "V", "V7"]))
        self.assertIn("vi", S.realisable_chords(dataclasses.replace(CANONICAL, rung="2.5"), S.Limits.of("2.5")))


class TestTheRealiserFailsClosed(unittest.TestCase):
    def test_a_recipe_the_rung_cannot_carry_is_refused_with_the_reason(self) -> None:
        cases = {
            "minor at 2.1": (dataclasses.replace(CANONICAL, key="A", mode="minor"), "leading tone"),
            "6/8 at 3.1": (dataclasses.replace(CANONICAL, target="metre.compound", metre="6/8", rung="3.1"), "6/8"),
            "Alberti at 2.5": (dataclasses.replace(CANONICAL, texture="alberti", rung="2.5"), "pattern in every bar"),
            "blocked at 2.1": (dataclasses.replace(CANONICAL, texture="blocked"), "five-note position"),
            "a key signature at 2.5": (dataclasses.replace(CANONICAL, key="G", rung="2.5"), "key signature"),
            "eighths at 2.1": (dataclasses.replace(CANONICAL, target="subdivision"), "eighth notes"),
            "one hand's rung": (dataclasses.replace(CANONICAL, rung="1.5"), "hands together"),
            "a skill invented": (dataclasses.replace(CANONICAL, target="phrasing"), "first targets"),
            "syncopation over held chords": (dataclasses.replace(S.PLAN[12], texture="blocked"), "sounds it"),
        }
        for name, (recipe, why) in cases.items():
            with self.subTest(case=name):
                with self.assertRaises(S.StudyRefusal) as refused:
                    S.compose(recipe)
                self.assertIn(why, str(refused.exception))

    def test_an_invalid_draw_is_never_scored(self) -> None:
        realiser = S.Realiser(CANONICAL)
        scored = []
        original = ME.score_study

        def spy(model):
            scored.append(model)
            return original(model)

        ME.score_study = spy
        try:
            draws_seen = []
            real_draw = realiser.draw

            def draw():
                d = real_draw()
                draws_seen.append(d)
                return d

            realiser.draw = draw
            _d, report = realiser.compose()
        finally:
            ME.score_study = original
        valid = [d for d in draws_seen if not realiser.hard_faults(d)]
        self.assertEqual(len(scored), len(valid))
        self.assertEqual(report["valid"], len(valid))
        self.assertGreater(report["draws"], report["valid"], "the hard layer refused nothing: the check saw nothing")

    def test_no_candidate_within_the_budget_is_a_refusal_never_a_draw(self) -> None:
        realiser = S.Realiser(CANONICAL)
        realiser.target_faults = lambda d: ["target: never met"]
        with self.assertRaises(S.StudyRefusal) as refused:
            realiser.compose()
        self.assertIn(f"within {S.BUDGET} draws", str(refused.exception))

    def test_nothing_below_the_musical_floor_is_kept(self) -> None:
        original = S.MUSICAL_FLOOR
        S.MUSICAL_FLOOR = 1.01
        try:
            with self.assertRaises(S.StudyRefusal) as refused:
                S.Realiser(CANONICAL).compose()
            self.assertIn("musical floor", str(refused.exception))
        finally:
            S.MUSICAL_FLOOR = original

    def test_the_same_recipe_writes_the_same_notes_and_another_seed_others(self) -> None:
        a = S.Realiser(CANONICAL).compose()[0]
        b = S.Realiser(CANONICAL).compose()[0]
        c = S.Realiser(dataclasses.replace(CANONICAL, seed=99)).compose()[0]
        notes = lambda d: [(n.onset, n.length, n.step) for n in d.notes]  # noqa: E731
        self.assertEqual(notes(a), notes(b))
        self.assertNotEqual(notes(a), notes(c))


class TestEveryStudyInThePlan(unittest.TestCase):
    def test_the_plan_writes_every_first_target_canonical_variable_and_transfer(self) -> None:
        roles: dict[str, set] = {}
        for _sc, entry in studies():
            roles.setdefault(entry["drill"]["params"]["target"], set()).add(entry["role"])
            self.assertLessEqual(entry["drill"]["params"]["bars"], 16)
        self.assertEqual(sorted(roles), sorted(S.TARGETS))
        for target, seen in roles.items():
            with self.subTest(target=target):
                self.assertEqual(seen, {"canonical", "variable", "transfer"})
        variable = sum(1 for _sc, e in studies() if e["role"] == "variable")
        self.assertEqual(variable, 2 * len(S.TARGETS), "two variable realisations of each target")

    def test_the_musical_gate_passes_every_study_on_its_written_page(self) -> None:
        row = FC.contract("study")
        for sc, entry in studies():
            verdict = FC.musical_gate(row, sc, entry)
            with self.subTest(item=entry["id"]):
                self.assertTrue(verdict["evaluated"])
                self.assertTrue(verdict["passes"], verdict["why"])
                # the page is the candidate the realiser chose
                self.assertAlmostEqual(verdict["total"], entry["drill"]["study"]["chosen"]["score"], places=3)

    def test_no_bar_is_repeated_beyond_the_grammar(self) -> None:
        row = FC.contract("study")
        for sc, entry in studies():
            with self.subTest(item=entry["id"]):
                self.assertEqual(FC.written_repetition_faults(row, sc, entry), [])

    def test_every_measured_demand_is_taught_at_the_recipe_s_rung(self) -> None:
        """The hard layer, measured: the detectors' demands on every study against its rung's ancestry."""
        measured = planned.measured()
        ancestry = claims.rung_ancestry(S.curriculum_sources())
        _skills, vocabulary = claims.load_vocabulary()
        for _sc, entry in studies():
            rung = entry["drill"]["params"]["rung"]
            with self.subTest(item=entry["id"], rung=rung):
                self.assertEqual(claims.untaught_on(measured[entry["id"]], rung, ancestry, vocabulary), [])

    def test_every_study_is_spelled_in_its_key(self) -> None:
        """No note outside the key except the minor's leading tone; no double accidental; the left hand spells its chords."""
        measured = planned.measured()
        for sc, entry in studies():
            minor = entry["drill"]["params"]["quality"] == "minor"
            with self.subTest(item=entry["id"]):
                if not minor:
                    self.assertNotIn("pitch.chromatic", measured[entry["id"]]["demands"])
                for n in sc.recurse().notes:
                    for p in n.pitches:
                        self.assertLessEqual(abs(p.alter), 1, p.nameWithOctave)

    def test_the_left_hand_plays_the_declared_progression(self) -> None:
        for sc, entry in studies():
            facts = entry["drill"]["study"]
            recipe = S.recipe_from_params(entry["drill"]["params"], entry["tempoBpm"])
            tonic = S.tonic_pc(recipe)
            scale = S.scale_of(recipe)
            bar_q = S.bar_quarters(recipe.metre)
            lh = sc.parts[1]
            for m in lh.getElementsByClass("Measure"):
                index = m.number - 1
                chords = facts["progression"][index]
                share = bar_q / len(chords)
                for n in m.notes:
                    chord = chords[min(len(chords) - 1, int(float(n.offset) // share))]
                    tones = ME.Chord(chord["root"], bool(chord.get("seventh"))).tones()
                    for p in n.pitches:
                        with self.subTest(item=entry["id"], bar=index + 1, pitch=p.nameWithOctave):
                            self.assertIn(ME.degree_of(p.midi, tonic, scale), tones)

    def test_no_study_is_placed_on_any_rung(self) -> None:
        """The reviewer's required change: in the Library and the contract, on no rung."""
        ids = {entry["id"] for _sc, entry in studies()}
        for _stage, _unit, lesson in claims.lessons_in_order(S.curriculum_sources()):
            with self.subTest(rung=lesson["id"]):
                self.assertEqual(ids & set(lesson.get("exerciseOptions", []) + lesson.get("songOptions", [])), set())


def _written(sc, entry) -> dict:
    """One scratch file through the bridge: the adversaries are measured by the app's detectors too."""
    with tempfile.TemporaryDirectory() as scratch:
        path = Path(G.write(sc, scratch, entry["id"]))
        return demands.measure_opportunities([path])[str(path)]


class TestTheGatesOnTheirAdversaries(unittest.TestCase):
    """The brief's adversaries, each failing the gate it is for and passing the others it should."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.row = FC.contract("study")
        cls.sc, cls.entry = G.make_study(CANONICAL)

    def adversary_entry(self, facts: dict) -> dict:
        entry = copy.deepcopy(self.entry)
        entry["drill"]["study"] = {**facts, "chosen": {}}
        return entry

    def test_a_random_walk_with_the_right_demands_fails_the_musical_gate(self) -> None:
        refused = passed_pedagogy = 0
        walks = []
        for seed in range(1, 7):
            recipe = dataclasses.replace(CANONICAL, seed=seed)
            sc, facts, _report = S.compose(recipe, "random-walk")
            entry = self.adversary_entry(facts)
            walks.append((sc, entry))
            refused += not FC.musical_gate(self.row, sc, entry)["passes"]
        # the walks carry the demands the contract asks for: the pedagogical gate cannot tell them apart
        sc, entry = walks[0]
        measured = _written(sc, entry)
        self.assertEqual(FC.pedagogical_faults(self.row, FC.recipe_of(entry), measured), [])
        passed_pedagogy += 1
        self.assertGreaterEqual(refused, 5, f"{refused} of 6 random walks refused by the musical floor")
        self.assertTrue(passed_pedagogy)

    def test_a_middle_repeating_its_opening_bar_four_times_fails_the_pedagogical_gate(self) -> None:
        sc = copy.deepcopy(self.sc)
        rh = sc.parts[0]
        measures = list(rh.getElementsByClass("Measure"))
        opening = [(n.pitch.nameWithOctave, n.duration.quarterLength) for n in measures[0].notes]
        for m in measures[1:5]:
            for n in list(m.notesAndRests):
                m.remove(n)
            at = 0.0
            for name, length in opening:
                m.insert(at, m21note.Note(name, quarterLength=length))
                at += length
        faults = FC.written_repetition_faults(self.row, sc, self.entry)
        self.assertTrue(faults and faults[0].startswith("repetition:"), faults)
        self.assertEqual(FC.written_repetition_faults(self.row, self.sc, self.entry), [])

    def test_a_cadence_on_a_note_outside_its_chord_fails_the_musical_gate(self) -> None:
        sc = copy.deepcopy(self.sc)
        last = list(sc.parts[0].getElementsByClass("Measure"))[-1]
        final = [n for n in last.notes][-1]
        final.pitch = m21pitch.Pitch("D4")  # D over the tonic chord
        verdict = FC.musical_gate(self.row, sc, self.entry)
        self.assertFalse(verdict["passes"])
        self.assertTrue(any("outside its chord" in w for w in verdict["wrong"]))
        self.assertTrue(FC.musical_gate(self.row, self.sc, self.entry)["passes"])

    def test_a_left_hand_stretched_past_an_octave_fails_the_physical_gate(self) -> None:
        sc = copy.deepcopy(self.sc)
        lh = list(sc.parts[1].getElementsByClass("Measure"))
        first = [n for n in lh[0].notes][0]
        lh[0].replace(first, m21chord.Chord([first.pitch.nameWithOctave, "E4"], quarterLength=first.quarterLength))
        faults = FC.physical_faults(self.row, FC.recipe_of(self.entry), sc, self.entry)
        self.assertTrue(any(f.startswith("span:") for f in faults), faults)
        self.assertEqual(FC.physical_faults(self.row, FC.recipe_of(self.entry), self.sc, self.entry), [])

    def test_the_gate_evaluates_only_where_the_row_names_an_evaluator(self) -> None:
        self.assertEqual(FC.musical_gate(FC.contract("scale"))["applies"], False)
        groove = FC.musical_gate(FC.contract("tumbao"))
        self.assertEqual((groove["applies"], groove["evaluated"]), (True, False))
        self.assertIn("idiom needs hearing", groove["why"])
        self.assertEqual(FC.musical_gate(self.row)["evaluated"], False, "no score, no evaluation")


def _study_catalogue() -> list[dict]:
    """
    Every plan study's catalogue row as the build's attach step writes it (`build.attach_demands`): the
    detectors' ids and located counts, what they establish by the density table or by the family
    contract's own density, and each sounding hand's range over the piece (`measurement.span`,
    `build.span_of` the bridge's per-bar `hands`), which the coping question's fixed positions read.
    The range joined in L120e: without it no row here could take the position route the build's rows
    take since L120b.
    """
    measured = planned.measured()
    table = build.read_json(build.DENSITY_FILE)
    order = list(claims.load_vocabulary()[1])
    catalog = []
    for _sc, entry in studies():
        row = measured[entry["id"]]
        located = {d: int(n) for d, n in row["opportunities"].items() if int(n) > 0}
        by_density = build.established_by_density(located, int(row["measures"]), table, order)
        by_contract = build.established_by_contract(entry, row)
        span = build.span_of(row.get("hands"))
        item = copy.deepcopy(entry)
        item["demands"] = list(row["demands"])
        item["measurement"] = {"status": "measured", "located": located,
                               "established": [d for d in order if d in by_density or d in by_contract],
                               **({"span": span} if span else {})}
        catalog.append(item)
    return catalog


class TestTheCandidateRungsReport(unittest.TestCase):
    """`study.candidate_rungs` is claims.py's reading of the studies, and places nothing."""

    def test_the_report_is_exactly_the_rung_claims_reading(self) -> None:
        # The rows are built by `_study_catalogue` (F2c moved them there unchanged, for the case below).
        # The coping question is read with the curriculum, as the report reads it (L120b): a skip or leap
        # inside a taught fixed position is coped with (L120e: the rows now carry their range, so the
        # curriculum-free reading this used to compare against would part from the report's).
        catalog = _study_catalogue()
        curriculum = S.curriculum_sources()
        report = S.candidate_rungs(catalog, curriculum)
        self.assertEqual(len(report), len(catalog))
        skills, vocabulary = claims.load_vocabulary()
        ancestry = claims.rung_ancestry(curriculum)
        by_id = {item["id"]: item for item in catalog}
        lessons = {lesson["id"]: lesson for _s, _u, lesson in claims.lessons_in_order(curriculum)}
        some = 0
        for row in report:
            item = by_id[row["item"]]
            listed = {c["rung"] for c in row["candidates"]}
            some += bool(listed)
            for rung, lesson in lessons.items():
                untaught = claims.untaught_on(item, rung, ancestry, vocabulary, curriculum)
                rung_claims, _unmeasurable = claims.rung_claims_of(lesson, skills, vocabulary)
                established = [c for c in rung_claims if claims.status_of(c, item, skills) == "established"]
                with self.subTest(item=row["item"], rung=rung):
                    self.assertEqual(rung in listed, not untaught and bool(established))
            # the recipe's own rung taught every demand; whether it is a candidate depends on its claims
            self.assertEqual(claims.untaught_on(item, row["recipeRung"], ancestry, vocabulary), [])
        self.assertGreater(some, 0, "no study has a candidate rung: the report saw nothing")

    def test_a_primer_fourth_satisfies_no_claim_of_the_advanced_rungs(self) -> None:
        """
        F2c (the reviewer's required change on F2b, `responses/ddba53e9.md`): the studies written for 2.1
        leap by a fourth or fifth (the held root moving C to F and to G), which the leap detector reads as
        a leap, a fourth or wider. That reading keeps 2.1's beginner claim and never a claim of `blues.7` or
        `ragtime.9`, whose leap is an octave or more and measured by no detector yet: no study is a candidate
        for either rung. Red before F2c, where every 2.1 study was a candidate for both through
        `concept leaps`.
        """
        report = S.candidate_rungs(_study_catalogue(), S.curriculum_sources())
        primer = [row for row in report if row["recipeRung"] == "2.1"]
        self.assertGreater(len(primer), 0, "no study written for 2.1 to read")
        for row in primer:
            with self.subTest(item=row["item"]):
                self.assertIn("interval.leap", row["established"], "the detector's leap is the case")
                at_2_1 = next(c for c in row["candidates"] if c["rung"] == "2.1")
                self.assertIn({"kind": "demand", "id": "interval.leap", "from": "concept leap"}, at_2_1["established"],
                              "2.1's beginner leap is a fourth's to keep")
        for row in report:
            with self.subTest(item=row["item"]):
                advanced = [c["rung"] for c in row["candidates"] if c["rung"] in ("blues.7", "ragtime.9")]
                self.assertEqual(advanced, [], "a fourth-or-wider reading makes a study a candidate for an octave-or-more rung")

    def test_the_report_makes_placement_no_owners(self) -> None:
        """
        D3a (`responses/ee70b43.md`): placement is F's on a stated gate that needs no owner — a
        candidate-rungs line on the combined build and a current `goodTeachingUse: yes` in D2's record
        by a named reviewer — and the committed report says what its source writes.
        """
        text = S.candidate_rungs_markdown([])
        self.assertNotIn("owner's", text, "the report makes placement the owner's")
        self.assertIn("No owner review or placement is required", text)
        self.assertIn("goodTeachingUse: yes", text)
        committed = (Path(__file__).resolve().parents[3] / "docs" / "prompts" / "runs" / "D3" / "candidate-rungs.md")
        header = committed.read_text(encoding="utf-8").replace("\r\n", "\n").split("\n## ")[0].rstrip("\n")
        self.assertEqual(header, text.split("\n## ")[0].rstrip("\n"), "the committed report's opening is not its source's")


class TestACopingOnlyAdmissionIsNamed(unittest.TestCase):
    """
    L120e (the reviewer's required change on L120d, `docs/review/responses/4e76c768.md`): a rung a study
    is a candidate for only because a taught fixed position's note reading copes with a skip or leap the
    rung's taught set leaves is flagged in the report — *eligible by taught-position coping; does not
    establish interval-reading evidence* — and the flag says so again where the study targets interval
    reading; a rung whose taught set teaches the interval carries no flag; the flag never adds or removes a
    candidate. The case is the C-major study written for 2.1 whose hands stay in C position: `holiday`'s
    path leaves the core before 2.1, so its leap is coped with there only by the positions 1.1 and 1.3
    teach, while at 2.1 the leap is taught.
    """

    INTERVAL_READING = "exercise.study.interval-reading.c-major.4-4.8bar.sustained.01"
    HANDS_TOGETHER = "exercise.study.texture-hands-together.c-major.4-4.8bar.sustained.01"

    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = _study_catalogue()
        cls.curriculum = S.curriculum_sources()
        cls.report = {row["item"]: row for row in S.candidate_rungs(cls.catalog, cls.curriculum)}
        cls.items = {item["id"]: item for item in cls.catalog}
        cls.ancestry = claims.rung_ancestry(cls.curriculum)
        cls.vocabulary = claims.load_vocabulary()[1]

    def _at(self, item_id: str, rung: str) -> dict | None:
        return next((c for c in self.report[item_id]["candidates"] if c["rung"] == rung), None)

    def _line(self, item_id: str, rung: str) -> str:
        text = S.candidate_rungs_markdown([self.report[item_id]])
        return next(line for line in text.split("\n") if line.startswith(f"| {rung} ("))

    def test_the_case_leaps_inside_c_position_and_holiday_teaches_no_leap(self) -> None:
        # What the cases below stand on, so a red there means what it says.
        for item_id in (self.INTERVAL_READING, self.HANDS_TOGETHER):
            item = self.items[item_id]
            with self.subTest(item=item_id):
                span = item["measurement"]["span"]
                self.assertTrue(60 <= span["R"][0] and span["R"][1] <= 67, span)
                self.assertTrue(48 <= span["L"][0] and span["L"][1] <= 55, span)
                self.assertEqual(claims.untaught_on(item, "holiday", self.ancestry, self.vocabulary), ["interval.leap"],
                                 "holiday's taught set leaves the leap alone")
                self.assertEqual(claims.untaught_on(item, "2.1", self.ancestry, self.vocabulary), [], "2.1 teaches it")
        self.assertIn("interval-reading", self.items[self.INTERVAL_READING]["targetSkills"])
        self.assertNotIn("interval-reading", self.items[self.HANDS_TOGETHER]["targetSkills"])

    def test_a_study_targeting_interval_reading_admitted_by_coping_alone_is_flagged(self) -> None:
        at = self._at(self.INTERVAL_READING, "holiday")
        self.assertIsNotNone(at, "the candidate is kept: the flag never removes it")
        self.assertEqual(at.get("positionCoped"), ["interval.leap"])
        self.assertEqual(at.get("notEvidenceFor"), ["interval-reading"])
        self.assertEqual(at.get("targetsNotEvidenced"), ["interval-reading"])
        line = self._line(self.INTERVAL_READING, "holiday")
        self.assertIn("eligible by taught-position coping (interval.leap)", line)
        self.assertIn("does not establish interval-reading evidence", line)
        self.assertIn("the study targets interval-reading", line)

    def test_a_rung_whose_taught_set_teaches_the_interval_carries_no_flag(self) -> None:
        at = self._at(self.INTERVAL_READING, "2.1")
        self.assertIsNotNone(at)
        self.assertEqual((at.get("positionCoped"), at.get("notEvidenceFor"), at.get("targetsNotEvidenced")), ([], [], []))
        line = self._line(self.INTERVAL_READING, "2.1")
        self.assertIn("| taught |", line)
        self.assertNotIn("coping", line)
        self.assertNotIn("does not establish", line)

    def test_a_study_not_targeting_interval_reading_is_flagged_without_the_target_clause(self) -> None:
        at = self._at(self.HANDS_TOGETHER, "holiday")
        self.assertIsNotNone(at, "the candidate is kept")
        self.assertEqual(at.get("positionCoped"), ["interval.leap"])
        self.assertEqual(at.get("notEvidenceFor"), ["interval-reading"])
        self.assertEqual(at.get("targetsNotEvidenced"), [])
        line = self._line(self.HANDS_TOGETHER, "holiday")
        self.assertIn("eligible by taught-position coping (interval.leap)", line)
        self.assertIn("does not establish interval-reading evidence", line)
        self.assertNotIn("the study targets", line)

    def test_the_flag_never_changes_eligibility(self) -> None:
        flagged = 0
        for item_id, row in self.report.items():
            item = self.items[item_id]
            for c in row["candidates"]:
                with self.subTest(item=item_id, rung=c["rung"]):
                    # listed on eligibility alone: the coping question with the curriculum finds nothing
                    self.assertEqual(claims.untaught_on(item, c["rung"], self.ancestry, self.vocabulary, self.curriculum), [])
                    # the flag is exactly what the taught set leaves, each a demand that names fixed positions
                    self.assertEqual(c.get("positionCoped"), claims.untaught_on(item, c["rung"], self.ancestry, self.vocabulary))
                    for demand in c.get("positionCoped") or []:
                        self.assertTrue(self.vocabulary[demand].get("fixedPositions"), demand)
                    flagged += bool(c.get("positionCoped"))
        self.assertGreater(flagged, 0, "no rung flagged: the case saw nothing")
        # The flag admits nothing either: the same study with its right hand reaching A4 (outside C position)
        # is no candidate on holiday, and 2.1, which teaches the leap, keeps it.
        moved = copy.deepcopy(self.items[self.INTERVAL_READING])
        moved["measurement"]["span"]["R"] = [60, 69]
        rungs = [c["rung"] for c in S.candidate_rungs([moved], self.curriculum)[0]["candidates"]]
        self.assertNotIn("holiday", rungs)
        self.assertIn("2.1", rungs)


if __name__ == "__main__":
    unittest.main()
