"""
The PDMX quarry, gate by gate, and once end to end (P13).

None of this touches the real archive. It runs against
`tests/fixtures/pdmx/` — a 30-row CSV with the archive's real column headers
and a tarball of scores written for the purpose — because the point of P13 is
that P14 is a *run* and not a debugging session on a Windows laptop.

Two things get most of the attention:

  - **The composer matcher**, because it is the only place a licence decision
    is made from free text somebody typed into a web form, and because every
    normalisation rule here is a real string from the archive.
  - **The end-to-end pass**, because five programs that each work alone and
    do not compose is the failure this fixture exists to prevent.
"""
from __future__ import annotations

import csv
import json
import os
import shutil
import subprocess
import sys
import tempfile
import types
import unittest
import zipfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]
# `tools/content` only, never `tools/content/pdmx`. A module in there with a
# standard library module's name outranks the real one for the whole process,
# which is what `select.py` (now `shortlist.py`) did twice: it broke this file
# the first time it ran under `unittest discover`, and later killed a server on
# its first connection when `socketserver` reached for `selectors`.
sys.path.insert(0, str(TOOLS))

import difficulty  # noqa: E402
from pdmx import commit as commit_mod  # noqa: E402
from pdmx import extract as extract_mod  # noqa: E402
from pdmx import review as review_mod  # noqa: E402
from pdmx import shortlist as shortlist_mod  # noqa: E402
from pdmx.composers import ComposerTable, fold, years_in  # noqa: E402
from pdmx.paths import ArchiveMissing, find_archive  # noqa: E402

REPO_ROOT = TOOLS.parents[1]
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "pdmx"
WANTS = REPO_ROOT / "content" / "sources" / "pdmx-wants.json"


class TestComposerFolding(unittest.TestCase):
    """Every normalisation rule, with strings the archive actually contains."""

    def test_accents_are_folded(self) -> None:
        self.assertEqual(fold("Antonín Dvořák"), "antonin dvorak")
        self.assertEqual(fold("Béla Bartók"), "bela bartok")

    def test_credit_words_are_removed(self) -> None:
        self.assertEqual(fold("Composed by Scott Joplin"), "scott joplin")
        self.assertEqual(fold("arr. John Smith"), "john smith")
        self.assertEqual(fold("Music by Erik Satie"), "erik satie")

    def test_bracketed_years_are_removed(self) -> None:
        self.assertEqual(fold("J.S. Bach (1685-1750)"), "js bach")
        self.assertEqual(fold("Chopin [1810 - 1849]"), "chopin")

    def test_punctuation_collapses(self) -> None:
        self.assertEqual(fold("J.S. Bach"), fold("js  bach"))
        self.assertEqual(fold("Mozart, W.A."), "mozart wa")

    def test_years_are_read_back_out(self) -> None:
        self.assertEqual(years_in("J.S. Bach (1685-1750)"), (1685, 1750))
        # `1685-50` is written too, and the century comes from the first year.
        self.assertEqual(years_in("Bach (1685-50)"), (1685, 1750))
        self.assertIsNone(years_in("Bach"))


class TestComposerTable(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.table = ComposerTable.load()

    def test_the_table_covers_the_curriculum(self) -> None:
        # Everything `02` Parts D-F names, plus the method-book composers.
        self.assertGreaterEqual(len(self.table), 60)
        for name in ("Bach", "Chopin", "Beethoven", "Czerny", "Burgmüller", "Türk", "Joplin"):
            self.assertTrue(self.table.match(name).matched, name)

    def test_a_public_domain_composer_is_labelled_pd(self) -> None:
        match = self.table.match("J.S. Bach (1685-1750)")
        self.assertEqual(match.canonical, "Johann Sebastian Bach")
        self.assertEqual(match.status, "pd")
        self.assertIsNone(match.year_conflict)

    def test_traditional_aliases(self) -> None:
        for name in ("Traditional", "trad.", "Anonymous", "Irish Traditional", "folk song"):
            match = self.table.match(name)
            self.assertTrue(match.traditional, name)
            self.assertEqual(match.status, "pd", name)

    def test_a_long_alias_matches_even_when_the_csv_ran_two_fields_together(self) -> None:
        # Real strings: the collector and a tempo marking with the space lost
        # between them. Hundreds of rows look like this.
        for name in ("after Chief F. O'Neillwith spirit", "after Sg't. J. O'Neillmoderate",
                     "Unattributedmoderate", "Urheber unbekanntDatum 1767"):
            self.assertTrue(self.table.match(name).traditional, name)

    def test_a_short_alias_does_not_claim_a_real_name(self) -> None:
        # "folk" as a bare prefix would claim Folkert Smit and "anon" would
        # claim Anona Winn, which is why the prefix rule has a length bar.
        for name in ("Folkert Smit", "Anona Winn", "Tradd Robinson"):
            self.assertFalse(self.table.match(name).traditional, name)

    def test_an_unmatched_name_is_unknown_and_not_a_rejection(self) -> None:
        match = self.table.match("Jane Q. Uploader")
        self.assertEqual(match.status, "unknown")
        self.assertFalse(match.matched)

    def test_NA_is_not_a_composer(self) -> None:
        for empty in ("NA", "", "  ", "none"):
            self.assertEqual(self.table.match(empty).status, "unknown", repr(empty))

    def test_the_typed_years_are_checked_not_believed(self) -> None:
        match = self.table.match("J.S. Bach (1600-1700)")
        self.assertEqual(match.canonical, "Johann Sebastian Bach")
        self.assertIsNotNone(match.year_conflict)


class TestDecoys(unittest.TestCase):
    """
    replan §2.7: the failure mode is the table being wrong about a death year,
    so the composers who must never pass are in the table with a reason, and
    this is the test that says so.
    """

    @classmethod
    def setUpClass(cls) -> None:
        cls.table = ComposerTable.load()

    def test_the_three_named_decoys_are_in_copyright(self) -> None:
        for name, died in (("Béla Bartók", 1945), ("Kabalevsky", 1987), ("Shostakovich", 1975)):
            match = self.table.match(name)
            self.assertEqual(match.status, "in-copyright", name)
            self.assertEqual(match.died, died, name)

    def test_every_decoy_is_in_copyright(self) -> None:
        for entry in self.table.decoys:
            self.assertEqual(
                self.table.match(entry["canonical"]).status, "in-copyright", entry["canonical"]
            )

    def test_a_living_composer_is_in_copyright(self) -> None:
        for name in ("Ludovico Einaudi", "Yiruma", "Hans Zimmer"):
            self.assertEqual(self.table.match(name).status, "in-copyright", name)


class TestGates(unittest.TestCase):
    """One test per gate, on the row written to fail it."""

    @classmethod
    def setUpClass(cls) -> None:
        with (FIXTURE / "PDMX.csv").open(encoding="utf-8", newline="") as handle:
            cls.rows = {row["mxl"].split("/")[-1].removesuffix(".mxl") or row["title"]: row
                        for row in csv.DictReader(handle)}
        # The no-mxl row has no cid in its path, so it is keyed by title.
        cls.by_title = {row["title"]: row for row in cls.rows.values()}

    def row(self, title: str) -> dict:
        return self.by_title[title]

    def test_gate_1_no_mxl(self) -> None:
        self.assertEqual(shortlist_mod.gate_has_mxl(self.row("No file here")),
                         "no mxl file in the archive")
        self.assertIsNone(shortlist_mod.gate_has_mxl(self.row("Minuet in G")))

    def test_gate_2_non_piano_program(self) -> None:
        self.assertIn("24", shortlist_mod.gate_piano_tracks(self.row("Guitar piece")) or "")
        self.assertIn("4 tracks", shortlist_mod.gate_piano_tracks(self.row("String quartet")) or "")
        self.assertIsNone(shortlist_mod.gate_piano_tracks(self.row("Sonatina Op. 36 No. 1")))

    def test_gate_3_subsets(self) -> None:
        self.assertIn("licence conflict", shortlist_mod.gate_subsets(self.row("Conflicted")) or "")
        self.assertIn("deduplicated", shortlist_mod.gate_subsets(self.row("A duplicate upload")) or "")

    def test_gate_4_draft_and_paywall(self) -> None:
        self.assertEqual(shortlist_mod.gate_not_draft(self.row("Work in progress")), "draft")
        self.assertEqual(shortlist_mod.gate_not_draft(self.row("Behind a paywall")), "paywalled")

    def test_gate_5_size(self) -> None:
        self.assertIn("4 bars", shortlist_mod.gate_size(self.row("Four bars")) or "")
        self.assertIn("900 bars", shortlist_mod.gate_size(self.row("Nine hundred bars")) or "")
        self.assertIn("12 notes", shortlist_mod.gate_size(self.row("Twelve notes")) or "")

    def test_the_track_column_is_dashes_not_json(self) -> None:
        # `"0-0"` is what the archive writes. Reading it as JSON gives nothing
        # and every two-staff file would be rejected as unreadable.
        self.assertEqual(shortlist_mod.parse_tracks("0-0"), [0, 0])
        self.assertEqual(shortlist_mod.parse_tracks("0"), [0])
        self.assertEqual(shortlist_mod.parse_tracks("40-41-42-43"), [40, 41, 42, 43])
        self.assertEqual(shortlist_mod.parse_tracks("nonsense"), [])

    def test_the_member_name_loses_its_leading_dot_slash(self) -> None:
        # The CSV writes `./mxl/…`; the tarball's members are `mxl/…`. A
        # mismatch extracts nothing and reads like a corrupt archive.
        self.assertEqual(
            shortlist_mod.member_name("./mxl/1/11/QmXYZ.mxl"), "mxl/1/11/QmXYZ.mxl"
        )
        self.assertEqual(shortlist_mod.member_name("mxl/1/11/QmXYZ.mxl"), "mxl/1/11/QmXYZ.mxl")
        self.assertEqual(shortlist_mod.cid_of("./mxl/1/11/QmXYZ.mxl"), "QmXYZ")

    def test_the_musescore_id_comes_from_the_metadata_path(self) -> None:
        self.assertEqual(shortlist_mod.musescore_id("./metadata/5/5740212.json"), "5740212")
        self.assertIsNone(shortlist_mod.musescore_id("./metadata/5/not-a-number.json"))


class TestSelection(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        table = ComposerTable.load()
        wants = shortlist_mod.load_wants(WANTS)
        cls.chosen, cls.rejections, cls.summary = shortlist_mod.select(
            FIXTURE / "PDMX.csv", table, wants, shortlist_mod.DEFAULT_QUOTAS
        )
        cls.by_cid = {c.cid: c for c in cls.chosen}

    def test_every_gate_rejected_exactly_the_row_written_for_it(self) -> None:
        self.assertEqual(self.summary["rowsRead"], 30)
        self.assertEqual(self.summary["passedGates"], 20)
        self.assertEqual(sum(self.rejections.counts.values()), 10)

    def test_composition_status_is_a_label_and_not_a_gate(self) -> None:
        # The decoys are chosen, and labelled. Rejecting them here would drop
        # two thirds of the archive on the strength of a free-text field
        # (docs/00 D23).
        for cid in ("QmFixtureDecoyBartok", "QmFixtureDecoyKabalevsky",
                    "QmFixtureDecoyShostakovich"):
            self.assertIn(cid, self.by_cid, cid)
            self.assertEqual(self.by_cid[cid].composition_status, "in-copyright", cid)
        self.assertEqual(self.by_cid["QmFixtureBachMinuet"].composition_status, "pd")
        self.assertEqual(self.by_cid["QmFixtureUnknownComposer"].composition_status, "unknown")

    def test_unmatched_composers_are_reported_so_the_table_can_grow(self) -> None:
        names = dict(self.rejections.unmatched_composers)
        self.assertIn("Jane Q. Uploader", names)

    def test_named_wants_are_admitted_outside_the_quotas(self) -> None:
        want = self.by_cid["QmFixtureWantRiverFlows"]
        self.assertEqual(want.want, "song.beautiful.river-flows-in-you")
        self.assertFalse(want.over_quota)
        rock = self.by_cid["QmFixtureWantSeizeTheDay"]
        self.assertEqual(rock.want, "song.rock.a7x-seize-the-day")

    def test_genre_buckets(self) -> None:
        self.assertEqual(self.by_cid["QmFixtureBachMinuet"].bucket, "classical")
        self.assertEqual(self.by_cid["QmFixtureTradHymn"].bucket, "folk-hymn-carol")
        self.assertEqual(self.by_cid["QmFixturePopFilm"].bucket, "pop-film-game")
        self.assertEqual(self.by_cid["QmFixtureJazzStandard"].bucket, "jazz-latin")

    def test_lyrics_are_flagged_and_ranked_down_but_kept(self) -> None:
        lyrical = self.by_cid["QmFixtureLyrics"]
        self.assertTrue(lyrical.lyrics)
        plain = shortlist_mod.score_row(4.1, 10, 2000, False, lyrics=False)
        self.assertLess(lyrical.score, plain)

    def test_the_ranking_prefers_the_better_rated_of_two_similar_rows(self) -> None:
        # A Bayesian rating, so one five-star vote does not outrank forty at 4.6.
        one_vote = shortlist_mod.score_row(5.0, 1, 1000, False, False)
        forty_votes = shortlist_mod.score_row(4.6, 40, 1000, False, False)
        self.assertGreater(forty_votes, one_vote)

    def test_a_bucket_that_cannot_fill_its_share_hands_the_remainder_on(self) -> None:
        # replan §2.2's remainder rule. The fixture has no jazz row in band 1-2
        # and the band still fills from what it has.
        quotas = {"1-2": {"classical": 1, "folk-hymn-carol": 1, "pop-film-game": 1,
                          "jazz-latin": 5}}
        table = ComposerTable.load()
        chosen, _, summary = shortlist_mod.select(
            FIXTURE / "PDMX.csv", table, [], quotas
        )
        taken = [c for c in chosen if c.band == "1-2" and not c.over_quota]
        self.assertGreater(len(taken), 2)
        self.assertEqual(summary["perBand"]["1-2"].get("jazz-latin", 0), 0)


class TestArchivePaths(unittest.TestCase):
    def test_a_missing_directory_is_a_paragraph_not_a_traceback(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ArchiveMissing) as caught:
                find_archive(tmp)
            message = str(caught.exception)
            self.assertIn("PDMX.csv", message)

    def test_a_missing_archive_names_both_accepted_layouts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "PDMX.csv").write_text("x", encoding="utf-8")
            with self.assertRaises(ArchiveMissing) as caught:
                find_archive(tmp)
            message = str(caught.exception)
            self.assertIn("mxl.tar.gz", message)
            self.assertIn("mxl/", message)

    def test_the_fixture_is_a_tarball_layout(self) -> None:
        archive = find_archive(FIXTURE)
        self.assertEqual(archive.layout, "mxl.tar.gz")
        self.assertIsNone(archive.unpacked)


class TestExtract(unittest.TestCase):
    def test_one_pass_writes_only_what_was_asked_for(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            wanted = {
                "mxl/1/10/QmFixtureBachMinuet.mxl": out / "QmFixtureBachMinuet.mxl",
            }
            result = extract_mod.extract_from_tar(
                FIXTURE / "mxl.tar.gz", wanted, progress=False
            )
            self.assertTrue(result.ok, result.missing)
            self.assertEqual(result.written, 1)
            self.assertTrue((out / "QmFixtureBachMinuet.mxl").is_file())
            self.assertEqual(len(list(out.iterdir())), 1)

    def test_a_member_that_is_not_there_is_reported_not_raised(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = extract_mod.extract_from_tar(
                FIXTURE / "mxl.tar.gz",
                {"mxl/9/99/QmNotInTheArchive.mxl": Path(tmp) / "x.mxl"},
                progress=False,
            )
            self.assertFalse(result.ok)
            self.assertEqual(result.missing, ["mxl/9/99/QmNotInTheArchive.mxl"])


class TestDifficulty(unittest.TestCase):
    """replan §2.4: features first, opinions second."""

    def test_a_scale_has_one_note_at_a_time_and_no_span(self) -> None:
        from music21 import converter

        score = converter.parse("tinyNotation: 4/4 c4 d e f g a b c'")
        found = difficulty.features(score)
        self.assertEqual(found["maxSimultaneousRight"], 1)
        self.assertEqual(found["maxSpanRight"], 0)
        self.assertEqual(found["rangeRight"], 12)
        self.assertEqual(found["distinctRhythms"], 1)

    def test_a_chord_exercise_has_three_notes_at_a_time(self) -> None:
        from music21 import chord, stream

        part = stream.Part()
        part.append(chord.Chord(["C4", "E4", "G4"], quarterLength=4))
        score = stream.Score()
        score.insert(0, part)
        found = difficulty.features(score)
        self.assertEqual(found["maxSimultaneousRight"], 3)
        self.assertEqual(found["maxSpanRight"], 7)

    def test_every_named_feature_is_returned(self) -> None:
        from music21 import converter

        found = difficulty.features(converter.parse("tinyNotation: 4/4 c4 d e f"))
        self.assertEqual(set(found), set(difficulty.FEATURE_NAMES))

    def test_the_fallback_table_is_kept_whether_or_not_a_model_is_fitted(self) -> None:
        # P14 fitted the model on 173 judged songs, so the shipped file now has
        # weights. The table stays beside them: it is what `estimate` falls back
        # to when a model file has none, and what P13 shipped before the fit.
        model = difficulty.load_model()
        self.assertTrue(model["fallback"]["bins"])
        unfitted = {**model, "fitted": False, "weights": {}}
        estimate = difficulty.estimate({"notesPerBar": 4.0, "shortestValue": 1.0}, unfitted)
        self.assertEqual(estimate.source, "fallback")
        self.assertEqual(estimate.level, 1.5)

    def test_the_shipped_model_is_the_one_P14_fitted(self) -> None:
        model = difficulty.load_model()
        self.assertTrue(model["fitted"])
        # Every weight has the sign the feature is allowed to have; the fit
        # drops the ones that come out backwards rather than clamping them.
        for name, weight in model["weights"].items():
            self.assertEqual(
                difficulty.MONOTONE_SIGNS[name] * weight >= 0, True, f"{name} {weight}"
            )
        estimate = difficulty.estimate(
            {name: 0.0 for name in difficulty.FEATURE_NAMES}, model
        )
        self.assertEqual(estimate.source, "model")
        self.assertGreaterEqual(estimate.level, difficulty.MIN_LEVEL)
        self.assertLessEqual(estimate.level, difficulty.MAX_LEVEL)

    def test_the_fit_recovers_a_known_linear_model(self) -> None:
        import math

        samples = []
        for step in range(40):
            density = 2 + step * 0.5
            features = {name: 0.0 for name in difficulty.FEATURE_NAMES}
            features.update({"notesPerBar": density, "bars": 16.0, "shortestValue": 1.0})
            samples.append(
                difficulty.Sample(features=features, level=min(9.0, 1 + 2 * math.log1p(density)))
            )
        report = difficulty.fit(samples)
        self.assertTrue(report.meets_bar, report.summary())
        self.assertGreater(report.spearman, 0.95)
        self.assertLess(report.median_absolute_error, 0.3)

    def test_a_feature_whose_weight_comes_out_backwards_is_dropped(self) -> None:
        # Monotone signs are enforced by dropping, not by clamping: a clamped
        # coefficient leaves the others carrying its variance and the report
        # then describes a model nobody would write down.
        samples = []
        for step in range(30):
            features = {name: 0.0 for name in difficulty.FEATURE_NAMES}
            # More accidentals, *easier* — which cannot be true, so the fit
            # must refuse to use the feature.
            features.update({"keyAccidentals": float(step % 7), "notesPerBar": 8.0})
            samples.append(difficulty.Sample(features=features, level=6.0 - (step % 7) * 0.5))
        report = difficulty.fit(samples, names=["keyAccidentals"])
        self.assertIn("keyAccidentals", report.dropped_features)


class TestWantsTable(unittest.TestCase):
    def test_every_rock_want_names_a_placeholder_that_exists(self) -> None:
        # A want that names an id nothing has would quietly create a second row
        # instead of replacing the first.
        catalog_path = REPO_ROOT / "app" / "public" / "content" / "catalog.json"
        if not catalog_path.is_file():
            self.skipTest("no built catalog; run tools/content/build.py")
        ids = {item["id"] for item in json.loads(catalog_path.read_text(encoding="utf-8"))}
        wants = shortlist_mod.load_wants(WANTS)
        rock = [want["id"] for want in wants if want["id"].startswith("song.rock.")]
        self.assertEqual(len(rock), 7)
        for item_id in rock:
            self.assertIn(item_id, ids)


class TestEndToEnd(unittest.TestCase):
    """
    shortlist -> extract -> quarry -> review -> commit -> import, in a temp dir.

    The render gate is skipped: it needs Chromium and a built app, and the
    `content-render.spec.ts` path it uses is covered by the e2e suite. Every
    other gate runs for real, on real music21 output.
    """

    @classmethod
    def setUpClass(cls) -> None:
        cls.tmp = Path(tempfile.mkdtemp(prefix="pdmx-e2e-"))
        cls.run_dir = cls.tmp / "run"
        cls.run_dir.mkdir(parents=True)

        table = ComposerTable.load()
        wants = shortlist_mod.load_wants(WANTS)
        chosen, _, _ = shortlist_mod.select(
            FIXTURE / "PDMX.csv", table, wants, shortlist_mod.DEFAULT_QUOTAS
        )
        from dataclasses import asdict

        cls.candidates_path = cls.run_dir / "candidates.json"
        cls.candidates_path.write_text(
            json.dumps({"header": {}, "candidates": [asdict(c) for c in chosen]}, indent=2),
            encoding="utf-8",
        )

        raw = cls.run_dir / "raw"
        raw.mkdir()
        wanted = {c.member: raw / f"{c.cid}.mxl" for c in chosen if not c.over_quota}
        extract_mod.extract_from_tar(FIXTURE / "mxl.tar.gz", wanted, progress=False)

        from pdmx import quarry as quarry_mod

        cls.rows = quarry_mod.quarry(
            [c for c in json.loads(cls.candidates_path.read_text(encoding="utf-8"))["candidates"]
             if not c["over_quota"]],
            raw,
            cls.run_dir,
            catalog_path=REPO_ROOT / "app" / "public" / "content" / "catalog.json",
            skip_render=True,
        )
        cls.quarried_path = cls.run_dir / "quarried.json"
        cls.quarried_path.write_text(
            json.dumps({"header": {}, "rows": [asdict(row) for row in cls.rows]}, indent=2),
            encoding="utf-8",
        )

    @classmethod
    def tearDownClass(cls) -> None:
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_the_quarry_gates_catch_the_files_written_to_fail_them(self) -> None:
        by_cid = {row.cid: row for row in self.rows}
        self.assertEqual(by_cid["QmFixtureMozart"].gate, "truncation")
        self.assertIn("16th grace", by_cid["QmFixtureMozart"].reason)
        self.assertEqual(by_cid["QmFixtureBurgmuller"].gate, "structure")
        self.assertIn("A0-C8", by_cid["QmFixtureBurgmuller"].reason)
        self.assertEqual(by_cid["QmFixtureCarol"].gate, "structure")
        self.assertIn("empty", by_cid["QmFixtureCarol"].reason)

    def test_a_single_line_upload_is_kept_and_labelled(self) -> None:
        row = {r.cid: r for r in self.rows}["QmFixtureTradTune"]
        self.assertTrue(row.ok)
        self.assertTrue(row.single_line)

    def test_everything_else_passes_and_has_a_level(self) -> None:
        passed = [row for row in self.rows if row.ok]
        self.assertGreaterEqual(len(passed), 15)
        for row in passed:
            self.assertGreater(row.level, 0, row.cid)
            self.assertTrue(row.features, row.cid)
            self.assertTrue(row.converted_sha256, row.cid)

    def test_commit_refuses_a_row_with_no_decision(self) -> None:
        review_dir = self.run_dir / "review-empty"
        review_dir.mkdir(exist_ok=True)
        rows = [r for r in json.loads(self.quarried_path.read_text(encoding="utf-8"))["rows"]
                if r["ok"]]
        review_mod.write_sheet(rows, review_dir / "review.csv")
        code = commit_mod.main([
            "--quarried", str(self.quarried_path),
            "--candidates", str(self.candidates_path),
            "--review", str(review_dir / "review.csv"),
            "--converted", str(self.run_dir / "converted"),
            "--scores", str(self.run_dir / "scores"),
            "--table", str(self.run_dir / "pdmx.json"),
        ])
        self.assertEqual(code, 2)

    def test_the_review_page_is_static_and_names_every_row(self) -> None:
        review_dir = self.run_dir / "review"
        review_dir.mkdir(exist_ok=True)
        rows = [r for r in json.loads(self.quarried_path.read_text(encoding="utf-8"))["rows"]
                if r["ok"]]
        candidates = {
            c["cid"]: c
            for c in json.loads(self.candidates_path.read_text(encoding="utf-8"))["candidates"]
        }
        page = review_dir / "index.html"
        review_mod.write_page(rows, candidates, page, self.run_dir / "previews")
        html = page.read_text(encoding="utf-8")
        self.assertNotIn("http://localhost", html)
        for row in rows:
            self.assertIn(row["cid"], html)

    def test_the_whole_chain_produces_a_catalog_that_validates_both_ways(self) -> None:
        import import_pdmx

        review_dir = self.run_dir / "review-decided"
        review_dir.mkdir(exist_ok=True)
        rows = [r for r in json.loads(self.quarried_path.read_text(encoding="utf-8"))["rows"]
                if r["ok"]]
        sheet = review_dir / "review.csv"
        review_mod.write_sheet(rows, sheet)
        decided = list(csv.DictReader(sheet.open(encoding="utf-8", newline="")))
        for index, record in enumerate(decided):
            record["decision"] = "drop" if index % 5 == 4 else "keep"
        with sheet.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(review_mod.CSV_COLUMNS))
            writer.writeheader()
            writer.writerows(decided)

        scores = self.run_dir / "scores"
        table_path = self.run_dir / "pdmx.json"
        code = commit_mod.main([
            "--quarried", str(self.quarried_path),
            "--candidates", str(self.candidates_path),
            "--review", str(sheet),
            "--converted", str(self.run_dir / "converted"),
            "--scores", str(scores),
            "--table", str(table_path),
            "--record", "unknown",
        ])
        self.assertEqual(code, 0)

        table = json.loads(table_path.read_text(encoding="utf-8"))
        self.assertEqual(table["header"]["zenodoRecord"], "unknown")
        self.assertTrue(table["items"])
        for entry in table["items"]:
            self.assertEqual(entry["levelSource"], "estimated")
            self.assertTrue((scores / entry["file"]).is_file())

        # The personal build bundles everything…
        out = self.run_dir / "content-personal"
        catalog = self.run_dir / "catalog.personal.json"
        report = import_pdmx.import_pdmx(
            out, catalog, personal=True, strict_license=False,
            scores_dir=scores, table_path=table_path,
        )
        self.assertEqual(report.failures, [])
        personal_items = json.loads(catalog.read_text(encoding="utf-8"))
        self.assertEqual(len(personal_items), len(table["items"]))
        self.assertTrue(all(item.get("file") for item in personal_items))
        self.assertTrue(report.personal, "the fixture has in-copyright rows and they were bundled")

        # …and the strict build turns the non-pd ones into placeholders.
        strict_out = self.run_dir / "content-strict"
        strict_catalog = self.run_dir / "catalog.strict.json"
        strict = import_pdmx.import_pdmx(
            strict_out, strict_catalog, personal=False, strict_license=True,
            scores_dir=scores, table_path=table_path,
        )
        self.assertEqual(strict.failures, [])
        self.assertTrue(strict.placeheld)
        strict_items = {item["id"]: item for item in
                        json.loads(strict_catalog.read_text(encoding="utf-8"))}
        for item_id in strict.placeheld:
            item = strict_items[item_id]
            self.assertIsNone(item.get("file"))
            self.assertTrue(item.get("importHint"))
            self.assertIn(import_pdmx.PERSONAL_BUILD_TAG, item["tags"])

    def test_a_changed_file_fails_the_build_naming_it(self) -> None:
        import import_pdmx

        table_path = self.run_dir / "pdmx-tamper.json"
        scores = self.run_dir / "scores-tamper"
        scores.mkdir(exist_ok=True)
        (scores / "x.mxl").write_bytes(b"not the file that was reviewed")
        table_path.write_text(
            json.dumps({
                "header": {},
                "items": [{
                    "id": "song.folk.x.pdmx", "cid": "x", "file": "x.mxl", "title": "X",
                    "convertedSha256": "0" * 64, "compositionStatus": "pd", "level": 3.0,
                    "bucket": "folk-hymn-carol", "features": {},
                }],
            }),
            encoding="utf-8",
        )
        report = import_pdmx.import_pdmx(
            self.run_dir / "content-tamper", self.run_dir / "catalog.tamper.json",
            personal=False, strict_license=False, scores_dir=scores, table_path=table_path,
        )
        self.assertEqual(len(report.failures), 1)
        self.assertIn("x.mxl", report.failures[0])
        self.assertIn("changed after it was reviewed", report.failures[0])


class TestReadme(unittest.TestCase):
    def test_the_readme_exists_and_gives_windows_commands(self) -> None:
        readme = TOOLS / "pdmx" / "README.md"
        self.assertTrue(readme.is_file())
        text = readme.read_text(encoding="utf-8")
        self.assertIn("py -3.11", text)
        self.assertIn("--pdmx-dir", text)
        for script in ("shortlist.py", "extract.py", "quarry.py", "review.py", "commit.py"):
            self.assertIn(script, text)


if __name__ == "__main__":  # pragma: no cover
    unittest.main()


class TestContentLock(unittest.TestCase):
    """
    `build.py` and the quarry write the same directory (P14).

    `build.py` empties `app/public/content/scores` at the start of every run;
    the quarry stages candidates into it so the render check's browser can
    fetch them. Run together — which happened once — vite's `copyDir` walks a
    tree `clean_scores` is deleting under it, and the build dies on an ENOENT
    for a file that existed a moment earlier.
    """

    def setUp(self) -> None:
        from common import CONTENT_LOCK

        self.lock_path = CONTENT_LOCK
        self.pre_existing = CONTENT_LOCK.exists()

    def test_the_second_writer_is_refused_not_queued(self) -> None:
        from common import ContentBusy, content_lock

        if self.pre_existing:
            self.skipTest("a real run holds the lock")
        with content_lock("the test"):
            with self.assertRaises(ContentBusy) as caught:
                with content_lock("a second run"):
                    pass
            # The message has to name what is holding it and how to clear it:
            # a lock nobody can explain is worse than the race it prevents.
            message = str(caught.exception)
            self.assertIn("the test", message)
            self.assertIn(".content-lock", message)

    def test_the_lock_is_released_even_when_the_body_raises(self) -> None:
        from common import content_lock

        if self.pre_existing:
            self.skipTest("a real run holds the lock")
        with self.assertRaises(ValueError):
            with content_lock("a run that fails"):
                raise ValueError("boom")
        self.assertFalse(self.lock_path.exists())

    def test_a_stale_lock_is_taken_over_rather_than_obeyed_for_ever(self) -> None:
        import os
        import time as clock

        from common import LOCK_STALE_SECONDS, content_lock

        if self.pre_existing:
            self.skipTest("a real run holds the lock")
        self.lock_path.parent.mkdir(parents=True, exist_ok=True)
        self.lock_path.write_text("a crashed run (pid 1)", encoding="utf-8")
        old = clock.time() - LOCK_STALE_SECONDS - 60
        os.utime(self.lock_path, (old, old))
        try:
            with content_lock("the run after it"):
                self.assertIn("the run after it", self.lock_path.read_text(encoding="utf-8"))
        finally:
            self.lock_path.unlink(missing_ok=True)


class TestArchiveIndex(unittest.TestCase):
    """
    The whole-archive index (`pdmx/index.py`).

    `shortlist.py` answers "which three hundred next"; this answers "what is in
    there at all, at my level". Its level comes from a proxy fitted on the
    quarry's own levels, so the two agree about difficulty without the index
    having to convert 37,499 files.
    """

    @classmethod
    def setUpClass(cls) -> None:
        from pdmx import index as index_mod

        cls.index_mod = index_mod
        cls.model = index_mod.load_model()

    def test_the_proxy_recovers_a_level_it_was_fitted_on(self) -> None:
        # A straight line through log(notes), chosen to stay inside 1-9 so the
        # clamp never fires: a fit that cannot reproduce a line it was handed
        # cannot be trusted with real data.
        import math

        samples = [
            ({"notes": n, "notesPerBar": 8.0, "bars": 32, "complexity": 1},
             1.0 + 0.9 * math.log1p(n))
            for n in range(40, 2000, 25)
        ]
        model = self.index_mod.fit_proxy(samples)
        worst = max(abs(self.index_mod.proxy_level(row, model) - level) for row, level in samples)
        self.assertLess(worst, 0.15, "the proxy cannot reproduce a line it was given")

    def test_a_level_is_always_inside_the_stage_range(self) -> None:
        for notes in (0, 30, 500, 50_000):
            level = self.index_mod.proxy_level(
                {"notes": notes, "notesPerBar": 40.0, "bars": 400, "complexity": 3}, self.model
            )
            self.assertGreaterEqual(level, 1.0)
            self.assertLessEqual(level, 9.0)

    def test_without_a_fitted_model_it_says_so_rather_than_guessing_wildly(self) -> None:
        level = self.index_mod.proxy_level(
            {"notes": 500, "notesPerBar": 9.0, "bars": 40, "complexity": 1}, {"fitted": False}
        )
        self.assertEqual(level, 4.5)

    def test_the_shipped_proxy_is_fitted_and_agrees_with_the_real_model(self) -> None:
        # Fitted against difficulty.py's output on the quarried files, so the
        # index sorts a shelf the way the catalog would sort it. The bar is
        # loose on purpose: this is a proxy for browsing, not a catalog level.
        if not self.model.get("fitted"):
            self.skipTest("no fitted proxy committed")
        self.assertGreaterEqual(self.model.get("fittedOn", 0), 100)
        self.assertIn("Spearman", self.model.get("report", ""))
        for field in self.index_mod.PROXY_FIELDS:
            self.assertIn(field, self.model["weights"])

    def test_the_index_reads_the_fixture_and_keeps_what_passes_the_gates(self) -> None:
        rows, summary = self.index_mod.build_index(
            FIXTURE / "PDMX.csv", ComposerTable.load(), self.model
        )
        self.assertEqual(summary["rowsRead"], 30)
        # The same twenty rows shortlist.py keeps — the gates are shared, not copied.
        self.assertEqual(summary["indexed"], 20)
        by_cid = {row["cid"]: row for row in rows}
        self.assertEqual(by_cid["QmFixtureDecoyBartok"]["status"], "in-copyright")
        self.assertEqual(by_cid["QmFixtureWantRiverFlows"]["want"],
                         "song.beautiful.river-flows-in-you")
        for row in rows:
            self.assertGreaterEqual(row["level"], 1.0)
            self.assertLessEqual(row["level"], 9.0)
            self.assertTrue(row["member"].startswith("mxl/"))

    def test_the_page_is_one_self_contained_file(self) -> None:
        rows, summary = self.index_mod.build_index(
            FIXTURE / "PDMX.csv", ComposerTable.load(), self.model
        )
        with tempfile.TemporaryDirectory() as tmp:
            page = Path(tmp) / "index.html"
            self.index_mod.write_page(rows, summary, self.model, page)
            text = page.read_text(encoding="utf-8")
            # No server, no CDN, no build step: it is opened from a laptop's
            # file system while the tarball is still on it.
            self.assertNotIn("http://localhost", text)
            self.assertNotIn("<script src=", text)
            for row in rows:
                self.assertIn(row["cid"], text)

    def test_extract_can_be_pointed_at_hand_picked_cids(self) -> None:
        # What the page's "copy picked CIDs" button feeds.
        with tempfile.TemporaryDirectory() as tmp:
            index_path = Path(tmp) / "index.json"
            rows, summary = self.index_mod.build_index(
                FIXTURE / "PDMX.csv", ComposerTable.load(), self.model
            )
            index_path.write_text(json.dumps({"summary": summary, "rows": rows}), encoding="utf-8")
            found = extract_mod.named_candidates(
                ["QmFixtureJoplin", "QmNotInTheArchive", "QmFixtureJoplin"],
                Path(tmp) / "no-candidates.json",
                index_path,
            )
            # Deduplicated, and an unknown CID is dropped rather than invented.
            self.assertEqual([row["cid"] for row in found], ["QmFixtureJoplin"])
            self.assertTrue(found[0]["member"].endswith("QmFixtureJoplin.mxl"))


class TestNoStdlibShadowing(unittest.TestCase):
    """
    Nothing in `pdmx/` may shadow a standard library module.

    `select.py` did, and the failure was baffling twice over: the package
    worked when its own test file ran alone and broke under `unittest
    discover`, and later a server here died on its first connection because
    `socketserver` had reached for `selectors` and got the shortlist. It is
    now `shortlist.py`, which is the real fix. The path hygiene below stays
    because the hazard is structural: a script's own directory goes first on
    `sys.path`, so the *next* badly named module would do it again.
    """

    def test_the_standard_library_select_is_the_real_one(self) -> None:
        import select as stdlib_select

        self.assertFalse(
            hasattr(stdlib_select, "GATES"),
            "something in pdmx/ has shadowed the standard library's select module",
        )

    def test_the_package_does_not_put_its_own_directory_on_the_path(self) -> None:
        pdmx_dir = str(TOOLS / "pdmx")
        self.assertNotIn(pdmx_dir, sys.path)

    def test_the_shortlist_module_is_reachable_by_package_name(self) -> None:
        self.assertTrue(hasattr(shortlist_mod, "GATES"))
        self.assertTrue(hasattr(shortlist_mod, "DEFAULT_QUOTAS"))


class TestNotASong(unittest.TestCase):
    """
    Telling an exercise from a piece (index.py).

    The generator already writes scales, arpeggios and rhythm rows, better and
    in every key, so a metronome track in the library is noise. But the rule
    that removes it must not remove Czerny's études — and the obvious rule,
    "the title contains an exercise word", does exactly that.
    """

    @classmethod
    def setUpClass(cls) -> None:
        from pdmx import index as index_mod

        cls.not_a_song = staticmethod(index_mod.not_a_song)
        cls.index_mod = index_mod

    def flag(self, title: str, entropy: float = 3.0, garbled: bool = False) -> str:
        return self.index_mod.not_a_song(title, entropy, garbled)

    def test_a_file_with_one_pitch_class_is_not_a_piece(self) -> None:
        # Zero entropy: a metronome, a paradiddle, a rhythm-reading sheet.
        for title in ("Metronome in 3/4 time", "Paradiddle Permutations", "reading 2A"):
            self.assertIn("rhythm only", self.flag(title, entropy=0.0), title)

    def test_the_entropy_line_sits_below_real_music(self) -> None:
        # 1.5-1.8 is where Gregorian chant and pop transcriptions start, so the
        # line is at 1.0 and anything above it survives on entropy alone.
        self.assertTrue(self.flag("Psalm 67 - Anonymous (Gregorian chant)", entropy=1.58) == "")
        self.assertTrue(self.flag("This Little Light of Mine", entropy=1.76) == "")
        self.assertIn("rhythm only", self.flag("Basic Drum Rhythms", entropy=1.0))

    def test_a_title_made_only_of_exercise_words_is_an_exercise(self) -> None:
        for title in ("Scales", "All Major Scales", "Arpeggios", "chord progression",
                      "Warm Up 1", "Exercises - Page 5", "Major Scales and Chords"):
            self.assertIn("exercise words", self.flag(title), title)

    def test_a_title_that_merely_mentions_one_is_not(self) -> None:
        # Every one of these was thrown away by "contains an exercise word",
        # and every one is real music the classical track wants.
        for title in (
            "Czerny: 160 Kurze Übungen op. 821 no. 3",
            "Brahms - 51 Übungen für Klavier No. 2b",
            "Czerny - The Art Of Finger Dexterity (Op. 740) - No. 3",
            "Broken Finger Waltz",
            "The sepulchre was empty - Adam Geibel",
            "untitled in MS - Torryburn Lasses",
            "Green Tea Frap (Snare Exercise)",
        ):
            self.assertEqual(self.flag(title), "", title)

    def test_a_title_with_no_letters_in_it_is_unusable(self) -> None:
        for title in ("12ef00a0e785e1a34670692a45534cdc643bf439", "2 08 20", "4"):
            self.assertIn("no usable title", self.flag(title), title)

    def test_a_garbled_title_is_kept_because_the_piece_is_real(self) -> None:
        # The CSV ate the name; the music is fine, and the MuseScore link still
        # has the real title. Dropping these would lose real repertoire to a
        # data-entry bug upstream.
        self.assertEqual(self.flag("ãæåãããªã¼ããªã¹ãã¹", garbled=True), "")

    def test_ordinary_music_is_left_alone(self) -> None:
        for title in ("Clair de Lune", "Nocturne Op. 9 No. 2", "The Skye Boat Song",
                      "Minuet in G", "Für Elise"):
            self.assertEqual(self.flag(title), "", title)


class TestShardedExtraction(unittest.TestCase):
    """
    Unpacking the whole library (`extract.py --from-index --shard`).

    37,261 files in one directory is legal everywhere and pleasant nowhere, so
    the whole-library run shards on two characters of the CID. The sharding has
    to agree with `manifest.py`, or every row in the manifest points at a path
    that is not there.
    """

    def test_the_shard_is_two_characters_after_the_qm(self) -> None:
        self.assertEqual(extract_mod.shard_of("QmbyQiyHSuzfTX"), "by")
        # Not every CID in the wild starts `Qm`; the fallback must not crash.
        self.assertEqual(extract_mod.shard_of("zdj7Wabc"), "zd")
        self.assertEqual(extract_mod.shard_of(""), "00")

    def test_sharding_is_off_unless_asked_for(self) -> None:
        out = Path("out")
        self.assertEqual(extract_mod.target_for(out, "Qmabcd", False), out / "Qmabcd.mxl")
        self.assertEqual(extract_mod.target_for(out, "Qmabcd", True), out / "ab" / "Qmabcd.mxl")

    def test_the_index_supplies_songs_and_leaves_the_exercises(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            index = Path(tmp) / "index.json"
            index.write_text(
                json.dumps(
                    {
                        "rows": [
                            {"cid": "Qmaa1", "member": "mxl/1/1/Qmaa1.mxl", "notASong": ""},
                            {"cid": "Qmbb2", "member": "mxl/1/2/Qmbb2.mxl",
                             "notASong": "rhythm only"},
                        ]
                    }
                ),
                encoding="utf-8",
            )
            songs = extract_mod.index_songs(index)
        self.assertEqual([row["cid"] for row in songs], ["Qmaa1"])

    def test_a_missing_index_is_empty_rather_than_an_exception(self) -> None:
        self.assertEqual(extract_mod.index_songs(Path("nowhere.json")), [])


class TestFolderManifest(unittest.TestCase):
    """
    `library.json`, the file that makes a folder of CIDs browsable (`04` §4b).

    The scores go on the phone and the app reads them from there, so the
    metadata has to travel with them — a folder of 37,261 files named
    `Qm....mxl` is unusable without it. The app reads the columns by name, so
    what is pinned here is that the header and the rows agree, and that a row
    is never written for a file the folder does not hold.
    """

    def setUp(self) -> None:
        from pdmx import manifest as manifest_mod

        self.manifest_mod = manifest_mod
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.library = self.tmp / "library"
        (self.library / "aa").mkdir(parents=True)
        (self.library / "aa" / "Qmaa1.mxl").write_bytes(b"PK\x03\x04")
        self.index = self.tmp / "index.json"
        self.index.write_text(
            json.dumps(
                {
                    "rows": [
                        {
                            "cid": "Qmaa1", "title": "Paddies Evermore", "composer": "O'Neill",
                            "artist": "", "level": 3.3, "bars": 25, "status": "pd",
                            "bucket": "folk-hymn-carol", "rating": 4.5, "ratings": 12,
                            "views": 2100, "lyrics": False, "garbled": False,
                            "museScore": "4702198", "notASong": "",
                        },
                        {
                            "cid": "Qmbb2", "title": "Not unpacked", "composer": "",
                            "artist": "", "level": 2.0, "bars": 8, "status": "pd",
                            "bucket": "classical", "rating": 0, "ratings": 0, "views": 0,
                            "lyrics": False, "garbled": False, "museScore": "", "notASong": "",
                        },
                        {
                            "cid": "Qmcc3", "title": "C major scale", "composer": "",
                            "artist": "", "level": 1.0, "bars": 4, "status": "pd",
                            "bucket": "classical", "rating": 0, "ratings": 0, "views": 0,
                            "lyrics": False, "garbled": False, "museScore": "",
                            "notASong": "the title is nothing but exercise words",
                        },
                    ]
                }
            ),
            encoding="utf-8",
        )

    def test_every_row_has_one_value_per_declared_field(self) -> None:
        built, _ = self.manifest_mod.build(self.index, self.library)
        for row in built["scores"]:
            self.assertEqual(len(row), len(built["fields"]))

    def test_the_columns_are_where_the_header_says_they_are(self) -> None:
        built, _ = self.manifest_mod.build(self.index, self.library)
        at = {name: i for i, name in enumerate(built["fields"])}
        row = built["scores"][0]
        self.assertEqual(row[at["file"]], "aa/Qmaa1.mxl")
        self.assertEqual(row[at["title"]], "Paddies Evermore")
        self.assertEqual(row[at["composer"]], "O'Neill")
        self.assertEqual(row[at["level"]], 3.3)
        self.assertEqual(row[at["museScore"]], "4702198")

    def test_a_row_is_never_written_for_a_file_that_is_not_there(self) -> None:
        built, absent = self.manifest_mod.build(self.index, self.library)
        self.assertEqual([row[0] for row in built["scores"]], ["aa/Qmaa1.mxl"])
        self.assertEqual(absent, 1)

    def test_exercises_are_left_in_the_archive(self) -> None:
        built, _ = self.manifest_mod.build(self.index, self.library)
        self.assertNotIn("C major scale", [row[1] for row in built["scores"]])

    def test_the_artist_stands_in_when_there_is_no_composer(self) -> None:
        row = self.manifest_mod.row_for({"artist": "Misc tunes"}, "aa/x.mxl")
        self.assertEqual(row[2], "Misc tunes")

    def test_it_writes_a_manifest_the_app_will_accept(self) -> None:
        out = self.tmp / "library.json"
        code = self.manifest_mod.main(
            ["--library", str(self.library), "--index", str(self.index), "--out", str(out)]
        )
        self.assertEqual(code, 0)
        written = json.loads(out.read_text(encoding="utf-8"))
        self.assertEqual(written["kind"], "pianopath-score-folder")
        self.assertEqual(written["version"], self.manifest_mod.MANIFEST_VERSION)
        self.assertEqual(written["count"], len(written["scores"]))

    def test_it_packs_the_folder_under_one_top_level_directory(self) -> None:
        # A zip of loose entries unpacks into 619 shard directories wherever it
        # was opened, and the app identifies a folder by its name.
        out = self.tmp / "library.zip"
        self.manifest_mod.main(
            [
                "--library", str(self.library),
                "--index", str(self.index),
                "--zip", str(out),
                "--folder-name", "pianopath-library",
            ]
        )
        with zipfile.ZipFile(out) as archive:
            names = archive.namelist()
            self.assertIsNone(archive.testzip())
            self.assertEqual({name.split("/")[0] for name in names}, {"pianopath-library"})
            self.assertIn("pianopath-library/library.json", names)
            self.assertIn("pianopath-library/aa/Qmaa1.mxl", names)
            manifest = json.loads(archive.read("pianopath-library/library.json"))
            # Every row's path must resolve inside the archive, or the folder
            # lists scores it cannot then add.
            for row in manifest["scores"]:
                self.assertIn(f"pianopath-library/{row[0]}", names)

    def test_the_scores_are_stored_and_the_manifest_deflated(self) -> None:
        # A .mxl is already a compressed zip container. Re-compressing 37,261
        # of them costs the whole run and saves nothing.
        out = self.tmp / "library.zip"
        self.manifest_mod.main(
            ["--library", str(self.library), "--index", str(self.index), "--zip", str(out)]
        )
        with zipfile.ZipFile(out) as archive:
            by_name = {info.filename: info.compress_type for info in archive.infolist()}
        self.assertEqual(by_name["pianopath-library/aa/Qmaa1.mxl"], zipfile.ZIP_STORED)
        self.assertEqual(by_name["pianopath-library/library.json"], zipfile.ZIP_DEFLATED)

    def test_the_app_and_the_writer_agree_on_the_shape(self) -> None:
        # The reader is TypeScript and cannot be imported here, so what is
        # checked is that its three constants still match this writer's.
        reader = (
            REPO_ROOT / "app" / "src" / "data" / "folderLibrary.ts"
        ).read_text(encoding="utf-8")
        self.assertIn("const MANIFEST_KIND = 'pianopath-score-folder';", reader)
        self.assertIn(
            "export const MANIFEST_VERSION = %d;" % self.manifest_mod.MANIFEST_VERSION, reader
        )
        self.assertIn(
            "export const MANIFEST_NAME = '%s';" % self.manifest_mod.MANIFEST_NAME, reader
        )


class TestEntryPointsRunAsScripts(unittest.TestCase):
    """
    Every `pdmx/` file must survive being *run*, not merely imported.

    Python puts a script's own directory first on `sys.path`, so running
    `pdmx/anything.py` puts every module in here ahead of the standard library
    for that whole process. That is how `select.py` -- now `shortlist.py` --
    came to answer `http.server`'s `socketserver` -> `selectors` -> `import
    select`, and kill a server on its first connection with an error naming
    neither PDMX nor sockets. The rename removed that collision; each entry
    point still drops its own directory from `sys.path` before the imports
    that would reach for it, because the next badly named module would do the
    same thing. This is the test that would have caught it.
    """

    def scripts(self) -> list[Path]:
        return sorted(
            path
            for path in (TOOLS / "pdmx").glob("*.py")
            # `paths.py` and `composers.py` are libraries, not commands: they
            # have no argument parser and nothing to print a usage line with.
            if path.name not in {"__init__.py", "paths.py", "composers.py"}
        )

    def test_each_script_reports_its_own_usage(self) -> None:
        self.assertGreaterEqual(len(self.scripts()), 6)
        for script in self.scripts():
            with self.subTest(script=script.name):
                done = subprocess.run(
                    [sys.executable, str(script), "--help"],
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    env={**os.environ, "PYTHONUTF8": "1"},
                )
                self.assertEqual(done.returncode, 0, done.stderr)
                self.assertIn("usage:", done.stdout)

    def test_a_script_leaves_the_standard_library_select_alone(self) -> None:
        probe = self.tmp / "probe.py"
        probe.write_text(
            "import runpy, sys\n"
            "sys.argv = ['manifest.py', '--help']\n"
            "try:\n"
            "    runpy.run_path(SCRIPT, run_name='not_main')\n"
            "except SystemExit:\n"
            "    pass\n"
            "import select, selectors\n"
            "assert not hasattr(select, 'GATES'), 'pdmx/select.py shadowed the stdlib'\n"
            "selectors.DefaultSelector().close()\n"
            "print('clean')\n".replace("SCRIPT", repr(str(TOOLS / "pdmx" / "manifest.py"))),
            encoding="utf-8",
        )
        done = subprocess.run(
            [sys.executable, str(probe)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            # `pdmx/` first on the path is exactly what running a script in
            # that directory does; the module's own fix has to undo it.
            env={**os.environ, "PYTHONUTF8": "1", "PYTHONPATH": str(TOOLS / "pdmx")},
        )
        self.assertEqual(done.returncode, 0, done.stderr)
        self.assertIn("clean", done.stdout)

    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)


class TestZenodoRecord(unittest.TestCase):
    """
    Which archive this was, read off the archive rather than remembered.

    PDMX is published twice. `mxl.tar.gz` is byte-identical in both records —
    1,894,335,797 bytes — so it cannot tell them apart, and asking a person to
    recall which of two nine-digit ids he downloaded months ago is a way of
    getting a wrong number written into every provenance row for good. The
    CSVs differ in size, so the CSV is the answer.

    Byte counts checked against the Zenodo API on 2026-09-06.
    """

    def test_the_january_archive_is_recognised(self) -> None:
        self.assertEqual(commit_mod.zenodo_record_for({"csvBytes": 209_574_867}), "14648209")

    def test_the_june_archive_is_recognised(self) -> None:
        self.assertEqual(commit_mod.zenodo_record_for({"csvBytes": 225_399_738}), "15571083")

    def test_an_unknown_size_is_not_guessed_at(self) -> None:
        self.assertEqual(commit_mod.zenodo_record_for({"csvBytes": 123}), "unknown")
        self.assertEqual(commit_mod.zenodo_record_for({}), "unknown")

    def test_the_two_records_are_told_apart_by_the_csv_alone(self) -> None:
        # If a future version ever ships the same CSV size as another, this
        # whole approach is silently wrong — so the table's keys must be unique
        # and its values distinct.
        sizes = list(commit_mod.ZENODO_BY_CSV_BYTES)
        self.assertEqual(len(sizes), len(set(sizes)))
        ids = list(commit_mod.ZENODO_BY_CSV_BYTES.values())
        self.assertEqual(len(ids), len(set(ids)))

    def test_the_owners_archive_is_the_january_one(self) -> None:
        # Not a hypothetical: this is the fingerprint select.py wrote from the
        # real CSV, and it is what will end up in pdmx.json.
        candidates = REPO_ROOT / "build" / "pdmx" / "candidates.json"
        if not candidates.is_file():
            self.skipTest("no quarry run on this machine")
        header = json.loads(candidates.read_text(encoding="utf-8"))["header"]
        self.assertEqual(header["csvBytes"], 209_574_867)
        self.assertEqual(commit_mod.zenodo_record_for(header), "14648209")


class TestAttestation(unittest.TestCase):
    """
    The floor under band 1-2 (`shortlist.attested`).

    P14's review measured what happens without it: 70 of the band's 80 rows
    came back melody-only lead sheets, 40 of them unrated with a median of 45
    views, and the band was dropped at 50% -- over the README's 40% stop rule.
    Every one of those 40 was junk and every one was unattested, so the floor
    is exactly the rule the evidence supports and no wider.
    """

    def row(self, band="1-2", n_ratings=0, n_views=0):
        candidate = types.SimpleNamespace(band=band, n_ratings=n_ratings, n_views=n_views)
        return candidate

    def test_an_unopened_file_is_refused_in_the_easy_band(self) -> None:
        self.assertFalse(shortlist_mod.attested(self.row(n_ratings=0, n_views=45)))

    def test_one_rating_is_enough(self) -> None:
        self.assertTrue(shortlist_mod.attested(self.row(n_ratings=1, n_views=0)))

    def test_a_hundred_views_is_enough(self) -> None:
        self.assertTrue(shortlist_mod.attested(self.row(n_ratings=0, n_views=100)))
        self.assertFalse(shortlist_mod.attested(self.row(n_ratings=0, n_views=99)))

    def test_every_other_band_is_untouched(self) -> None:
        # The floor exists because the *easy* band is full of lead sheets. The
        # others are not, and an unrated Stage 5 piece is a different question.
        for band in ("3", "4", "5", "6", "7-9"):
            self.assertTrue(
                shortlist_mod.attested(self.row(band=band, n_ratings=0, n_views=0)), band
            )

    def test_the_quotas_apply_it(self) -> None:
        # A floor nothing calls is not a floor.
        source = (TOOLS / "pdmx" / "shortlist.py").read_text(encoding="utf-8")
        quotas = source[source.index("def apply_quotas("):]
        self.assertIn("attested(c)", quotas)
