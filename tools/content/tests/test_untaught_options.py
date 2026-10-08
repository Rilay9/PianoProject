"""
The rung-own options the one gate's coping question refuses at their own rung (L120a).

`untaught_options.table` is the build's reading of the app's `eligibilityCore.uncoped` for a rung's
own options: the demands the item asks (the catalogue row's `demands` for a measured item), less
those the rung's ancestry teaches (`demands.json`'s `taughtAt`, `claims.rung_ancestry`), after the
gate's earlier refusals (a declared large-hand voicing, the teaching-use admission, an unmeasured
item). Two groups of cases:

- **The shipped curriculum** (reads the built content: run `python tools/content/build.py` first;
  CI: the step 'Build content', before 'Content pipeline tests'). The tool's lines equal the app's
  probe, `docs/prompts/runs/L120d/after/probe-refusals.txt` — L120d's snapshot: 216 `untaught` at
  L120d's head, written by `eligibility.eligibleFor` over every rung's own options with the learner
  the session builds at the rung (`session.taughtForLearner`: the taught set and the fixed positions)
  — line for line and demand for demand, apart from the differences recorded in
  `RECORDED_DIFFERENCES`, each with its reason. It replaced L120c's final snapshot
  (`docs/prompts/runs/L120c/after-placement/probe-refusals.txt`, 219) when L120d gave `interval.leap`
  the fixed positions `interval.skip` carries (the three *Jingle Bells* options left; both *When the
  Saints* options kept their syncopation), as L120c's had replaced L120b's (379) and L120b's X1's
  (387) (L124: the pin is a snapshot, re-run and recorded, never forced). The probe is a snapshot: a
  change to a rung's lists, a row's demands, `taughtAt`, `fixedPositions`, a lesson's concepts or the
  gate changes the app's reading too, so this goes red until the probe is re-run at the new head —
  copy `docs/prompts/runs/L120d/scripts-zzL120dProbe.test.ts` and `scripts-vitest.l120d.config.ts`
  into the gitignored `app/.probe/` (as `zzL120dProbe.test.ts` and `vitest.l120d.config.ts`), run
  `L120D_PROBE_OUT=<path> npx vitest run --config .probe/vitest.l120d.config.ts` from `app/`, point
  `PROBE` at the new `-refusals.txt` — and the record here says why the two differ. Nothing is forced
  equal.
- **A constructed curriculum** with one case of each class, under the reviewer's order of truths
  (`docs/review/responses/questions-4dc2f135.md`): (A) the material reading is in doubt,
  (B) a lesson at or below the rung teaches it and fails to declare or map it, (C) no lesson at
  or below the rung teaches it — a placement. An incidental demand is asked (the reviewer's first
  answer): it is a line, never an exemption.

Nothing here writes a file.
"""
from __future__ import annotations

import json
import re
import sys
import unittest
from unittest import mock
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import claims  # noqa: E402
import untaught_options as U  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
BUILT = REPO / "app" / "public" / "content"
#: Re-run 2026-10-06 at the W1b landing (Entry 233: 2.5 gains the G edition, hymns.2 swaps Joyful for the
#: right-hand Ode, the 16 contrary scales change version): 290 lines, replacing L120d's 291.
#: Re-run 2026-10-06 after the hand seam (Entry 244: rung 1.3's one-staff left-hand songs read as the left hand, so
#: Hot Cross Buns and Mary Had a Little Lamb lose `interval.skip` there): 290 lines, 215 `untaught`, two lines changed from W1b.
#: Re-run 2026-10-06 at the latin.4 placement (LP1): 297 lines, 218 `untaught`. Seven lines added, all latin.4's, and
#: no other line changed: the three tresillo exercises and the Bizet left-hand cut `teaching-use-not-approved` (no
#: teaching-use decision admits them), and the whole Bizet, Por Una Cabeza and The Crave `untaught` for
#: `rhythm.triplets` alone (the three context options; no rung on latin.4's path teaches triplets).
#: Re-run 2026-10-06 after the teaching-use decisions (Entry 253) and the cut's creating-system pin (Entry 255; CUT1): 294 lines,
#: 220 `untaught`. Five lines changed from LP1, none other: the three tresillo exercises leave latin.4 (admitted, and nothing
#: untaught there: the placement brief's H4 on the real path); at 3.6 `exercise.tresillo.c` is now refused `untaught` for
#: `rhythm.syncopation` and at latin.3 for `texture.left-hand-pattern`, two refusals the admission used to hide (the coping
#: question runs only on an admitted option): a placement finding, recorded, not fixed. The Bizet cut's latin.4 line stays
#: `teaching-use-not-approved`: its decision binds to the cut's former identity and is stale until re-issued.
#: Re-run 2026-10-06 at the SR2 landing (the 3/4 demand `metre.three-four`, taught at 1.4): 294 lines, 221 `untaught`. One line
#: added from CUT1's pin and none other: `1.2 exercise.rhythm.waltz-quarters.4bar` untaught for `metre.three-four`, a placement
#: finding (1.2 lists a 3/4 waltz two rungs before 1.4 teaches 3/4), recorded, not fixed.
#: Re-run 2026-10-07 at the detector corrections (DC1: a pickup or a bar opening the piece on a rest is not syncopation;
#: a stationary pulse or a stride left hand is not a walking bass): 203 `untaught`. Eighteen rung-own options at 2.2-4.3
#: (Danny Boy, Happy Birthday, the Greensleeves arrangements, Rock of Ages among them) were refused only for the false
#: syncopation and are no longer refused; no new refusal.
PROBE = REPO / "docs" / "prompts" / "runs" / "DC1" / "probe-refusals.txt"

#: Where the tool's lines on the shipped curriculum differ from the probe, and why. Keyed by
#: (rung, item); `side` says which reading has the line. Nothing else may differ. Since L120b's snapshot
#: the two options Q76 added after X1's head are in both, so the runtime reading row is the one line left.
RECORDED_DIFFERENCES: dict[tuple[str, str], dict] = {
    ("2.2", "drill.reading.sight-reading-2-right"): {
        "side": "probe",
        "why": "a runtime reading row: the app asks the demands its reading controls may write "
               "(`readingControls.ts`, app code); the build does not read them, so the tool lists "
               "the row apart as not read (`unread`), never as coped with",
    },
}

LINE = re.compile(r"^(\S+) (\S+): (\{.*\})$")


def built(name: str):
    path = BUILT / name
    if not path.is_file():
        raise AssertionError(
            f"{path} is missing, and this test reads the built content: run "
            "`python tools/content/build.py` first (CI: the step 'Build content', "
            "before 'Content pipeline tests')"
        )
    return json.loads(path.read_text(encoding="utf-8"))


def probe_untaught(path: Path) -> dict[tuple[str, str], tuple[str, ...]]:
    """The probe's `untaught` lines: {(rung, item): the demands the gate found untaught, in its order}."""
    out: dict[tuple[str, str], tuple[str, ...]] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        match = LINE.match(raw.strip())
        if not match:
            continue
        verdict = json.loads(match.group(3))
        if verdict.get("why") == "untaught":
            out[(match.group(1), match.group(2))] = tuple(verdict["demands"])
    return out


class TheShippedCurriculum(unittest.TestCase):
    """The tool's reading of the built content against the app's probe."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = built("catalog.json")
        cls.curriculum = built("curriculum.json")
        cls.report = U.table(cls.catalog, cls.curriculum)
        cls.mine = {(line["rung"], line["item"]): tuple(d["id"] for d in line["demands"]) for line in cls.report["lines"]}
        cls.probe = probe_untaught(PROBE)

    def test_the_probe_is_the_one_the_brief_names(self) -> None:
        # 216 under L120d; 215 after the W1b landing re-ran the probe (Entry 233: the G edition on 2.5, hymns.2's
        # options, the contrary scales' versions). The pin is a snapshot, re-run and recorded, never forced (L124).
        # 218 after the latin.4 placement (LP1): its three context options, untaught for triplets there.
        # 220 after the admissions and the cut's pin (CUT1): latin.4's three tresillo lines gone, tresillo.c refused at 3.6 and latin.3.
        # 221 after SR2: the 1.2 waltz untaught for the new 3/4 demand.
        self.assertEqual(len(self.probe), 203, "the DC1 probe records 203 `untaught` rung-own options (SR2's 221 less the eighteen refused only for a false syncopation)")

    def test_the_lines_equal_the_probe_but_for_the_recorded_differences(self) -> None:
        only_probe = {key for key in self.probe if key not in self.mine}
        only_mine = {key for key in self.mine if key not in self.probe}
        recorded_probe = {key for key, why in RECORDED_DIFFERENCES.items() if why["side"] == "probe"}
        recorded_mine = {key for key, why in RECORDED_DIFFERENCES.items() if why["side"] == "tool"}
        self.assertEqual(only_probe, recorded_probe, "lines the app's probe has and the tool does not, unrecorded")
        self.assertEqual(only_mine, recorded_mine, "lines the tool has and the app's probe does not, unrecorded")
        both = [key for key in self.probe if key in self.mine]
        differing = {key: (self.probe[key], self.mine[key]) for key in both if self.probe[key] != self.mine[key]}
        self.assertEqual(differing, {}, "the same option read with different untaught demands")
        # The count: the probe's, less what only the probe reads, plus what only the tool reads.
        self.assertEqual(len(self.mine), len(self.probe) - len(recorded_probe) + len(recorded_mine))

    def test_the_probe_only_line_is_listed_apart_as_not_read(self) -> None:
        unread = {(row["rung"], row["item"]) for row in self.report["unread"]}
        for key, why in RECORDED_DIFFERENCES.items():
            if why["side"] == "probe":
                self.assertIn(key, unread, f"{key}: recorded as a row the build does not read, and not listed so")

    def test_the_per_demand_counts_equal_the_probe_but_for_the_recorded_lines(self) -> None:
        probe_counts = Counter(d for key, demands in self.probe.items()
                               if RECORDED_DIFFERENCES.get(key, {}).get("side") != "probe" for d in demands)
        mine_counts = Counter(d for key, demands in self.mine.items()
                              if RECORDED_DIFFERENCES.get(key, {}).get("side") != "tool" for d in demands)
        self.assertEqual(mine_counts, probe_counts)
        self.assertEqual(Counter(self.report["summary"]["pairsByDemand"]),
                         Counter(d for demands in self.mine.values() for d in demands))

    def test_hot_cross_buns_at_0_3_is_read_as_the_probe_reads_it(self) -> None:
        line = next(line for line in self.report["lines"] if (line["rung"], line["item"]) == ("0.3", "song.folk.hot-cross-buns"))
        self.assertEqual([d["id"] for d in line["demands"]],
                         ["interval.step", "interval.skip", "rhythm.eighths", "rhythm.shorter-than-quarter"])
        step = line["demands"][0]
        self.assertEqual(step["concepts"], ["steps"])
        self.assertEqual(step["taughtAt"], ["1.1"])
        self.assertIn(step["verdict"], ("established", "incidental"))

    def test_every_line_is_classified_and_the_counts_add_up(self) -> None:
        summary = self.report["summary"]
        self.assertEqual(summary["options"], len(self.report["lines"]))
        self.assertEqual(sum(summary["linesByResolution"].values()), summary["options"])
        self.assertEqual(sum(summary["pairsByClass"].values()), summary["pairs"])
        for line in self.report["lines"]:
            for demand in line["demands"]:
                self.assertIn(demand["class"], U.CLASSES, f"{line['rung']} {line['item']} {demand['id']}")


# --- a constructed curriculum ----------------------------------------------------------------

SKILLS = {
    "interval-reading": {"id": "interval-reading", "opportunity": ["interval.step", "interval.skip", "interval.leap"]},
    "subdivision": {"id": "subdivision", "opportunity": ["rhythm.eighths", "rhythm.shorter-than-quarter", "rhythm.sixteenths"]},
    "triplets": {"id": "triplets", "opportunity": ["rhythm.triplets"]},
    "bass-clef": {"id": "bass-clef", "opportunity": ["clef.bass"]},
}


def demand(ident: str, taught: list[str]) -> dict:
    return {"id": ident, "display": ident, "taughtAt": taught}


def measured(ident: str, demands: list[str], established: list[str] | None = None, **extra) -> dict:
    measurement = {"status": "measured", "established": established if established is not None else list(demands),
                   "located": {d: 4 for d in demands}}
    measurement.update(extra.pop("measurement", {}))
    return {"id": ident, "type": "song", "title": ident, "demands": list(demands), "measurement": measurement, **extra}


def lesson(ident: str, songs: list[str], concepts: list[str] | None = None, exercises: list[str] | None = None) -> dict:
    return {"id": ident, "concepts": concepts or [], "songOptions": songs, "exerciseOptions": exercises or [],
            "textFile": f"lessons/{ident}.md"}


def curriculum_of(*stages: tuple[int, list[dict]], tracks: dict[int, list[tuple[str, list[dict]]]] | None = None) -> dict:
    out = []
    for number, lessons in stages:
        units = [{"track": "core", "lessons": lessons}]
        for track, track_lessons in (tracks or {}).get(number, []):
            units.append({"track": track, "lessons": track_lessons})
        out.append({"number": number, "units": units})
    return {"stages": out}


class OneCaseOfEachClass(unittest.TestCase):
    """(A) the reading in doubt, (B) a lesson teaches it undeclared, (C) no lesson teaches it: one line each."""

    def setUp(self) -> None:
        self.demands = {
            "clef.bass": demand("clef.bass", ["1.1"]),
            "interval.skip": demand("interval.skip", ["1.1"]),
            "rhythm.triplets": demand("rhythm.triplets", ["1.1"]),
        }
        self.catalog = [
            # A: the build recorded the detector's clef reading as a misreading on this file.
            measured("song.a", ["clef.bass"], measurement={"misread": {"demands": ["clef.bass"]}}),
            # B: 0.2's lesson teaches the skip in its words; no concept of 0.2 or below claims it.
            measured("song.b", ["interval.skip"]),
            # C: no lesson at or below 0.2 says a word about triplets; 1.1 teaches them.
            measured("song.c", ["rhythm.triplets"]),
        ]
        self.curriculum = curriculum_of(
            (0, [lesson("0.1", ["song.a"]), lesson("0.2", ["song.b", "song.c"])]),
            (1, [lesson("1.1", ["song.a", "song.b", "song.c"], concepts=["skips", "triplets", "grand-staff"])]),
        )
        self.texts = {"0.2": "Now the tune moves by a skip: from a line to the next line, one key left out between."}

    def report(self) -> dict:
        return U.table(self.catalog, self.curriculum, SKILLS, self.demands, text_of=lambda one: self.texts.get(one["id"], ""))

    def test_one_line_in_each_class(self) -> None:
        report = self.report()
        classes = {line["item"]: [d["class"] for d in line["demands"]] for line in report["lines"]}
        self.assertEqual(classes, {"song.a": ["A"], "song.b": ["B-claim"], "song.c": ["C-later"]})
        self.assertEqual({line["item"]: line["resolution"] for line in report["lines"]},
                         {"song.a": "reading", "song.b": "ownership", "song.c": "placement"})
        self.assertEqual(report["summary"]["linesByResolution"], {"reading": 1, "ownership": 1, "placement": 1})

    def test_the_rungs_that_teach_them_raise_no_line(self) -> None:
        self.assertFalse([line for line in self.report()["lines"] if line["rung"] == "1.1"])

    def test_each_line_carries_the_facts_it_was_classified_from(self) -> None:
        by_item = {line["item"]: line["demands"][0] for line in self.report()["lines"]}
        self.assertIn("clef assumption", by_item["song.a"]["doubt"][0])
        self.assertEqual(by_item["song.b"]["concepts"], ["skips"])
        self.assertEqual([m["rung"] for m in by_item["song.b"]["mentions"]], ["0.2"])
        self.assertEqual(by_item["song.c"]["earliest"], "1.1")
        self.assertEqual(by_item["song.c"]["later"], "1.1")
        self.assertEqual(by_item["song.c"]["mentions"], [])


class TheSubclasses(unittest.TestCase):
    """Within B, an existing concept's claim before a mapping; within C, a later rung before none."""

    # Revised (L120c). Old assumption: no concept maps to rhythm.sixteenths, so a lesson naming sixteenths is a
    # mapping gap. L120c added `sixteenth-notes` to `claims.CONCEPT_DEMANDS`, so the case takes that one row out
    # for its length (the classifier on a demand no concept maps is what it tests), and
    # `test_since_l120c_a_concept_maps_sixteenths_so_the_same_mention_is_a_claim` holds the shipped reading.
    @mock.patch.dict(claims.CONCEPT_DEMANDS)
    def test_a_mention_with_no_concept_mapping_it_is_a_mapping_gap_and_nowhere_is_said(self) -> None:
        del claims.CONCEPT_DEMANDS["sixteenth-notes"]
        demands = {"rhythm.sixteenths": demand("rhythm.sixteenths", [])}
        catalog = [measured("song.d", ["rhythm.sixteenths"]), measured("song.e", ["rhythm.sixteenths"])]
        curriculum = curriculum_of((0, [lesson("0.1", ["song.d"])]), (1, [lesson("1.1", ["song.e"])]),
                                   tracks={1: [("jazz", [lesson("jazz.1", ["song.e"])])]})
        texts = {"0.1": "Four sixteenth notes to the beat, counted 1-e-and-a."}
        report = U.table(catalog, curriculum, SKILLS, demands, text_of=lambda one: texts.get(one["id"], ""))
        classes = {(line["rung"], line["item"]): line["demands"][0]["class"] for line in report["lines"]}
        # 1.1 stands on 0.1, whose lesson names sixteenths; jazz.1 opens on the core path before stage 1 (0.1).
        self.assertEqual(classes, {("0.1", "song.d"): "B-mapping", ("1.1", "song.e"): "B-mapping",
                                   ("jazz.1", "song.e"): "B-mapping"})
        texts.clear()
        report = U.table(catalog, curriculum, SKILLS, demands, text_of=lambda one: "")
        self.assertEqual({line["demands"][0]["class"] for line in report["lines"]}, {"C-nowhere"})
        self.assertTrue(all(line["demands"][0]["earliest"] is None for line in report["lines"]))

    def test_since_l120c_a_concept_maps_sixteenths_so_the_same_mention_is_a_claim(self) -> None:
        # Added (L120c): with `sixteenth-notes` mapped, a lesson below that names sixteenths without claiming the
        # concept is a claim to repair (B-claim), never a mapping gap; and with no lesson naming them, C-nowhere.
        self.assertEqual(claims.CONCEPT_DEMANDS.get("sixteenth-notes"), "rhythm.sixteenths")
        demands = {"rhythm.sixteenths": demand("rhythm.sixteenths", [])}
        catalog = [measured("song.d", ["rhythm.sixteenths"])]
        curriculum = curriculum_of((0, [lesson("0.1", [])]), (1, [lesson("1.1", ["song.d"])]))
        texts = {"0.1": "Four sixteenth notes to the beat, counted 1-e-and-a."}
        named = U.table(catalog, curriculum, SKILLS, demands, text_of=lambda one: texts.get(one["id"], ""))
        self.assertEqual(named["lines"][0]["demands"][0]["class"], "B-claim")
        unnamed = U.table(catalog, curriculum, SKILLS, demands, text_of=lambda one: "")
        self.assertEqual(unnamed["lines"][0]["demands"][0]["class"], "C-nowhere")

    def test_a_demand_taught_off_this_path_is_elsewhere_not_nowhere(self) -> None:
        # The practice floor's shape: a track standing on 1.1 that nothing stands on, the demand taught at 1.2.
        demands = {"interval.skip": demand("interval.skip", ["1.2"])}
        floor = lesson("floor.1", ["song.p"])
        floor["prerequisites"] = ["1.1"]
        curriculum = curriculum_of((0, [lesson("0.1", [])]),
                                   (1, [lesson("1.1", ["song.p"]), lesson("1.2", [], concepts=["skips"])]),
                                   tracks={1: [("floor", [floor])]})
        report = U.table([measured("song.p", ["interval.skip"])], curriculum, SKILLS, demands, text_of=lambda one: "")
        rows = {line["rung"]: line["demands"][0] for line in report["lines"]}
        self.assertEqual({rung: row["class"] for rung, row in rows.items()}, {"1.1": "C-later", "floor.1": "C-elsewhere"})
        self.assertEqual((rows["floor.1"]["earliest"], rows["floor.1"]["later"]), ("1.2", None))

    def test_a_caution_that_the_detector_sees_less_is_no_doubt_about_presence(self) -> None:
        # E22's syncopation note says the detector misses some syncopations: an incidental reading may
        # understate the density, never invent the demand. Kept as a caution; the pair stays a placement.
        demands = {"rhythm.syncopation": demand("rhythm.syncopation", ["1.1"])}
        skills = {**SKILLS, "syncopation": {"id": "syncopation", "opportunity": ["rhythm.syncopation"]}}
        curriculum = curriculum_of((0, [lesson("0.1", ["song.s"])]), (1, [lesson("1.1", [], concepts=["syncopation"])]))
        report = U.table([measured("song.s", ["rhythm.syncopation"], established=[])], curriculum, skills, demands,
                         text_of=lambda one: "")
        row = report["lines"][0]["demands"][0]
        self.assertEqual(row["class"], "C-later")
        self.assertEqual(row["doubt"], [])
        self.assertEqual(row["caution"], [claims.E22_NOTATED_SYNC])

    # Replaced (L120b; the reviewer's ruling on L120a, `responses/0bcd3be0.md`; class: a test asserting the
    # readings being corrected). L120a's test held three doubts: a demand located nowhere, 3/8 read as compound
    # and a written sixteenth in 3/8. The key signature located nowhere is no longer asked by the gate (claims.
    # untaught_on), 3/8 is no longer compound at the detector, and a written sixteenth in 3/8 is a sixteenth:
    # the last two doubts are gone, and a demand other than the key signature located nowhere keeps the first.

    # Revised (L120c): as the mapping-gap case above, the unmapped state is taken for the case's length; what S1
    # holds is that a written sixteenth in 3/8 is never a doubt, whatever owns it.
    @mock.patch.dict(claims.CONCEPT_DEMANDS)
    def test_s1_written_sixteenths_in_three_eight_are_classified_by_ownership_and_placement(self) -> None:
        del claims.CONCEPT_DEMANDS["sixteenth-notes"]
        demands = {"rhythm.sixteenths": demand("rhythm.sixteenths", [])}
        catalog = [measured("song.f", ["rhythm.sixteenths"], timeSig="3/8")]
        curriculum = curriculum_of((0, [lesson("0.1", [])]), (1, [lesson("1.1", ["song.f"])]))
        nowhere = U.table(catalog, curriculum, SKILLS, demands, text_of=lambda one: "")
        row = nowhere["lines"][0]["demands"][0]
        self.assertEqual((row["class"], row["doubt"]), ("C-nowhere", []), "no rung teaches sixteenths: a placement, never a doubt")
        texts = {"0.1": "Four sixteenth notes to the beat, counted 1-e-and-a."}
        named = U.table(catalog, curriculum, SKILLS, demands, text_of=lambda one: texts.get(one["id"], ""))
        row = named["lines"][0]["demands"][0]
        self.assertEqual((row["class"], row["doubt"]), ("B-mapping", []), "a lesson below names sixteenths: ownership")

    def test_s2_compound_time_on_a_three_eight_row_is_not_the_readings_question(self) -> None:
        # After the detector's correction a 3/8 row carries compound time only from a genuinely compound bar.
        demands = {"metre.compound": demand("metre.compound", ["1.1"])}
        skills = {**SKILLS, "6/8": {"id": "6/8", "opportunity": ["metre.compound"]}}
        catalog = [measured("song.m", ["metre.compound"], timeSig="3/8")]
        curriculum = curriculum_of((0, [lesson("0.1", ["song.m"])]), (1, [lesson("1.1", [], concepts=["6/8"])]))
        row = U.table(catalog, curriculum, skills, demands, text_of=lambda one: "")["lines"][0]["demands"][0]
        self.assertEqual((row["class"], row["doubt"]), ("C-later", []))

    def test_s3_a_demand_located_nowhere_is_the_readings_question_but_the_key_signature_is_not_asked(self) -> None:
        demands = {"key.signature": demand("key.signature", ["1.1"]), "metre.compound": demand("metre.compound", ["1.1"])}
        key = measured("song.k", ["key.signature"], established=[])
        key["measurement"]["located"] = {}
        compound = measured("song.n", ["metre.compound"], established=[])
        compound["measurement"]["located"] = {}
        curriculum = curriculum_of((0, [lesson("0.1", ["song.k", "song.n"])]),
                                   (1, [lesson("1.1", [], concepts=["key-signature", "6/8"])]))
        skills = {**SKILLS, "key-signature": {"id": "key-signature", "opportunity": ["key.signature"]},
                  "6/8": {"id": "6/8", "opportunity": ["metre.compound"]}}
        report = U.table([key, compound], curriculum, skills, demands, text_of=lambda one: "")
        rows = {line["item"]: line["demands"][0] for line in report["lines"]}
        self.assertEqual(set(rows), {"song.n"}, "the key signature altering no sounding note is not asked, so no line")
        self.assertEqual((rows["song.n"]["class"], rows["song.n"]["doubt"]), ("A", [U.NOWHERE]))

    def test_a_mention_read_as_not_teaching_and_the_front_matter_do_not_count(self) -> None:
        demands = {"rhythm.triplets": demand("rhythm.triplets", ["1.1"])}
        curriculum = curriculum_of((0, [lesson("0.1", ["song.t"]), lesson("0.2", ["song.t"])]),
                                   (1, [lesson("1.1", [], concepts=["triplets"])]))
        texts = {"0.1": "---\ntitle: Triplets and more\n---\nThe triplets you meet later are built on these.",
                 "0.2": "---\ntitle: Triplets and more\n---\nNothing about rhythm here."}
        catalog = [measured("song.t", ["rhythm.triplets"])]
        unread = U.table(catalog, curriculum, SKILLS, demands, text_of=lambda one: texts.get(one["id"], ""), readings={})
        self.assertEqual([(l["rung"], l["demands"][0]["class"]) for l in unread["lines"]], [("0.1", "B-claim"), ("0.2", "B-claim")])
        self.assertEqual({m["rung"] for l in unread["lines"] for m in l["demands"][0]["mentions"]}, {"0.1"})
        read = U.table(catalog, curriculum, SKILLS, demands, text_of=lambda one: texts.get(one["id"], ""),
                       readings={("0.1", "rhythm.triplets"): "named once as something met later"})
        self.assertEqual([(l["rung"], l["demands"][0]["class"]) for l in read["lines"]], [("0.1", "C-later"), ("0.2", "C-later")])
        self.assertEqual(read["lines"][0]["demands"][0]["mentions"][0]["read"], "named once as something met later")
        self.assertEqual(read["summary"]["readAsNotTeaching"], 2)

    def test_a_concept_named_under_introduces_below_the_rung_is_the_claims_question(self) -> None:
        demands = {"interval.skip": demand("interval.skip", ["1.1"])}
        intro = lesson("0.1", ["song.f"])
        intro["introduces"] = ["skips"]
        curriculum = curriculum_of((0, [intro]), (1, [lesson("1.1", [], concepts=["skips"])]))
        report = U.table([measured("song.f", ["interval.skip"])], curriculum, SKILLS, demands, text_of=lambda one: "")
        line = report["lines"][0]["demands"][0]
        self.assertEqual(line["class"], "B-claim")
        self.assertEqual(line["introduced"], ["0.1"])


class TheGatesOrder(unittest.TestCase):
    """What the gate asks before the coping question, and an incidental demand, as the app reads them."""

    def setUp(self) -> None:
        self.demands = {"interval.skip": demand("interval.skip", ["1.1"])}
        self.curriculum = curriculum_of((0, [lesson("0.1", ["song.g", "song.h", "song.i", "song.j", "song.k"],
                                                     exercises=["drill.reading.row"])]),
                                        (1, [lesson("1.1", [], concepts=["skips"])]))

    def test_an_incidental_demand_is_asked(self) -> None:
        catalog = [measured("song.g", ["interval.skip"], established=[])]
        report = U.table(catalog, self.curriculum, SKILLS, self.demands, text_of=lambda one: "")
        self.assertEqual(len(report["lines"]), 1, "the reviewer's first answer: incidental presence is no exemption")
        self.assertEqual(report["lines"][0]["demands"][0]["verdict"], "incidental")

    def test_an_earlier_refusal_is_the_gates_verdict_and_is_listed_apart(self) -> None:
        excerpt = measured("song.h", ["interval.skip"], type="excerpt", provenance={"facts": {}, "review": {"teaching": None}})
        physical = measured("song.i", ["interval.skip"], provenance={"physical": {"prerequisite": "a ninth", "alternative": "roll it"}})
        approved = measured("song.j", ["interval.skip"], type="excerpt", provenance={"facts": {}, "review": {"teaching": True}})
        unmeasured = {"id": "song.k", "type": "song", "title": "k", "demands": "unmeasured",
                      "measurement": {"status": "unmeasured", "reason": "no file"}}
        report = U.table([excerpt, physical, approved, unmeasured], self.curriculum, SKILLS, self.demands, text_of=lambda one: "")
        self.assertEqual([line["item"] for line in report["lines"]], ["song.j"])
        self.assertEqual({row["item"]: row["why"] for row in report["shadowed"]},
                         {"song.h": "teaching-use-not-approved", "song.i": "physical"})
        self.assertEqual({row["item"]: row["demands"] for row in report["shadowed"]},
                         {"song.h": ["interval.skip"], "song.i": ["interval.skip"]})

    def test_a_runtime_reading_row_is_listed_as_not_read(self) -> None:
        row = {"id": "drill.reading.row", "type": "drill", "title": "row", "file": None,
               "drill": {"kind": "sight-reading", "params": {"level": 2}},
               "measurement": {"status": "runtime", "reason": "made when it opens"}}
        report = U.table([row], self.curriculum, SKILLS, self.demands, text_of=lambda one: "")
        self.assertEqual(report["lines"], [])
        self.assertEqual([(r["rung"], r["item"]) for r in report["unread"]], [("0.1", "drill.reading.row")])

    def test_the_ancestry_is_the_claims_modules(self) -> None:
        self.assertIs(U.rung_ancestry, claims.rung_ancestry)


class TheValidatorsWarning(unittest.TestCase):
    """L120b item 7: `validate.py` warns with the table's count, never fails, and lists the unread reading rows apart."""

    def test_the_warning_says_the_count_and_the_rows_not_read(self) -> None:
        import validate

        demands = {"interval.skip": demand("interval.skip", ["1.1"])}
        row = {"id": "drill.reading.row", "type": "drill", "title": "row", "file": None,
               "drill": {"kind": "sight-reading", "params": {"level": 2}},
               "measurement": {"status": "runtime", "reason": "made when it opens"}}
        curriculum = curriculum_of((0, [lesson("0.1", ["song.g"], exercises=["drill.reading.row"])]),
                                   (1, [lesson("1.1", [], concepts=["skips"])]))
        catalog = [measured("song.g", ["interval.skip"]), row]
        original = claims.load_vocabulary
        claims.load_vocabulary = lambda: (SKILLS, demands)
        try:
            warnings = validate.untaught_options_warnings(catalog, curriculum)
        finally:
            claims.load_vocabulary = original
        self.assertEqual(len(warnings), 2)
        self.assertTrue(warnings[0].startswith("WARNING (untaught rung-own options, L120b): 1 rung-own options on 1 rungs"), warnings[0])
        self.assertIn("(1 option-demand pairs: A 0,", warnings[0])
        self.assertTrue(warnings[1].endswith("0.1 drill.reading.row"), warnings[1])
        self.assertTrue(all(w.startswith("WARNING") for w in warnings), "a warning, never an error")


if __name__ == "__main__":
    unittest.main()
