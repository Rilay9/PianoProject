"""
The licence gate (docs/03-content-pipeline.md §1).

These rules are the ones the doc calls hard, so the tests are deliberately
blunt: an NC licence never bundles, an absent licence never bundles, and a
composition with no known publication date never bundles.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from licensing import (  # noqa: E402
    AUTHOR_DEATH_CUTOFF_YEAR,
    PD_CUTOFF_YEAR,
    Verdict,
    composition_verdict,
    kern_reference_records,
    license_verdict,
    normalise_license,
)


class TestNormalise(unittest.TestCase):
    def test_recognises_the_creative_commons_family(self) -> None:
        self.assertEqual(normalise_license("CC BY 4.0"), "CC BY")
        self.assertEqual(normalise_license("Attribution-ShareAlike 4.0 (CC BY-SA 4.0)"), "CC BY-SA")
        self.assertEqual(normalise_license("cc-by-nc-sa"), "CC BY-NC-SA")
        self.assertEqual(normalise_license("CC0 1.0 Universal"), "CC0")

    def test_public_domain_prose(self) -> None:
        self.assertEqual(normalise_license("This work is in the public domain."), "PD")

    def test_unknown_text_comes_back_unchanged(self) -> None:
        self.assertEqual(normalise_license("ask me nicely"), "ask me nicely")


class TestEditionLicence(unittest.TestCase):
    def test_permissive_licences_bundle(self) -> None:
        for text in ("CC0", "CC BY 4.0", "CC BY-SA 4.0", "Public Domain"):
            self.assertTrue(license_verdict(text).bundlable, text)

    def test_non_commercial_never_bundles(self) -> None:
        # This is not hypothetical: five of the eight Humdrum repositories in
        # docs/03 §2 turned out to be CC BY-NC-SA.
        decision = license_verdict("Attribution-NonCommercial-ShareAlike 4.0 International")
        self.assertIs(decision.verdict, Verdict.LOCAL_ONLY)
        self.assertEqual(decision.license, "CC BY-NC")

    def test_no_derivatives_never_bundles(self) -> None:
        self.assertIs(license_verdict("CC BY-ND 4.0").verdict, Verdict.LOCAL_ONLY)

    def test_silence_is_not_permission(self) -> None:
        self.assertIs(license_verdict("").verdict, Verdict.REJECT)
        self.assertIs(license_verdict("   ").verdict, Verdict.REJECT)

    def test_an_unrecognised_licence_is_treated_as_unclear(self) -> None:
        decision = license_verdict("free for personal use")
        self.assertIs(decision.verdict, Verdict.REJECT)
        self.assertIn("unclear", decision.reason)

    def test_all_rights_reserved(self) -> None:
        self.assertFalse(license_verdict("Copyright 2008. All rights reserved.").bundlable)


class TestComposition(unittest.TestCase):
    def test_old_enough_is_public_domain(self) -> None:
        self.assertTrue(composition_verdict(composer="Chopin", published_year=1839).bundlable)
        self.assertTrue(
            composition_verdict(composer="X", published_year=PD_CUTOFF_YEAR).bundlable
        )

    def test_recent_compositions_are_refused(self) -> None:
        # Mariage d'Amour (Paul de Senneville, 1979) is filed in one library as
        # "Chopin - Spring Waltz"; the attribution does not make it old.
        decision = composition_verdict(composer="Paul de Senneville", published_year=1979)
        self.assertIs(decision.verdict, Verdict.REJECT)

    def test_traditional_is_public_domain(self) -> None:
        self.assertTrue(composition_verdict(composer=None, traditional=True).bundlable)

    def test_an_unknown_date_is_refused_rather_than_guessed(self) -> None:
        self.assertIs(
            composition_verdict(composer="Somebody", published_year=None).verdict, Verdict.REJECT
        )


class TestPersonalBuild(unittest.TestCase):
    """
    `--allow-nc`, the owner's amendment of 2026-09-05 (docs/00 D10a).

    It relaxes exactly one thing. Silence still grants nothing, and ND still
    forbids the normalisation the pipeline performs, whoever is listening.
    """

    def test_non_commercial_is_admitted_for_a_personal_build(self) -> None:
        decision = license_verdict("CC BY-NC-SA 4.0", allow_nc=True)
        self.assertIs(decision.verdict, Verdict.BUNDLE)
        self.assertIn("personal build", decision.reason)

    def test_it_does_not_admit_an_edition_with_no_licence(self) -> None:
        self.assertIs(license_verdict("", allow_nc=True).verdict, Verdict.REJECT)
        self.assertIs(
            license_verdict("Copyright 2008. All rights reserved.", allow_nc=True).verdict,
            Verdict.LOCAL_ONLY,
        )

    def test_it_does_not_admit_no_derivatives(self) -> None:
        self.assertIs(license_verdict("CC BY-ND 4.0", allow_nc=True).verdict, Verdict.LOCAL_ONLY)

    def test_it_is_off_by_default(self) -> None:
        self.assertIs(license_verdict("CC BY-NC-SA 4.0").verdict, Verdict.LOCAL_ONLY)


class TestHumdrumReferenceRecords(unittest.TestCase):
    """
    craigsapp's editions put the rights records *after* the music.

    A header-only reader gets the title and the composer and misses the licence
    entirely — which is the one record this function exists to find, so it is
    worth a test of its own.
    """

    SOURCE = (
        "!!!COM: Joplin, Scott\n"
        "!!!OTL: The Entertainer\n"
        "!!!ODT: 1902\n"
        "**kern\t**kern\n"
        "*-\t*-\n"
        "!!!YEC: Copyright 2001 by Craig Stuart Sapp\n"
        "!!!YEC: 2021 Craig Stuart Sapp\n"
        "!!!YEM: Licence: (CC BY-NC-SA 4.0) https://creativecommons.org/licenses/by-nc-sa/4.0\n"
    )

    def records(self) -> dict:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "rag.krn"
            path.write_text(self.SOURCE, encoding="utf-8")
            return kern_reference_records(path)

    def test_it_reads_records_after_the_last_data_line(self) -> None:
        records = self.records()
        self.assertEqual(records["OTL"], "The Entertainer")
        self.assertIn("CC BY-NC-SA 4.0", records["YEM"])

    def test_the_first_of_a_repeated_record_wins(self) -> None:
        self.assertEqual(self.records()["YEC"], "Copyright 2001 by Craig Stuart Sapp")

    def test_the_licence_it_finds_is_the_one_the_gate_rules_on(self) -> None:
        decision = license_verdict(self.records()["YEM"], allow_nc=True)
        self.assertIs(decision.verdict, Verdict.BUNDLE)
        self.assertIs(license_verdict(self.records()["YEM"]).verdict, Verdict.LOCAL_ONLY)


class TestCompositionByComposerDeath(unittest.TestCase):
    """
    The route for editions that carry no date at all (docs/03 §1 rule 1).

    The NIFC Chopin first editions name the publisher and the plate but never a
    year, so the year has to come from the composer instead. The test that
    matters is the one that keeps the bar at 1930 rather than at life+70.
    """

    def test_a_composer_dead_before_the_cutoff_is_public_domain(self) -> None:
        decision = composition_verdict(composer="Chopin", composer_died=1849)
        self.assertIs(decision.verdict, Verdict.BUNDLE)
        self.assertEqual(decision.license, "PD")

    def test_life_plus_seventy_alone_is_not_enough(self) -> None:
        # Bartók died in 1945 — inside life+70, outside the publication cutoff.
        # His 1940 editions are in copyright in the US, so he must not pass.
        self.assertLess(1945, AUTHOR_DEATH_CUTOFF_YEAR)
        self.assertGreater(1945, PD_CUTOFF_YEAR)
        self.assertIs(composition_verdict(composer="Bartók", composer_died=1945).verdict, Verdict.REJECT)

    def test_a_stated_publication_year_still_wins(self) -> None:
        # A dated file is not overridden by the composer's dates in either
        # direction: the date is the more direct evidence.
        late = composition_verdict(composer="Chopin", published_year=1990, composer_died=1849)
        self.assertIs(late.verdict, Verdict.REJECT)

    def test_neither_fact_is_still_a_refusal(self) -> None:
        self.assertIs(composition_verdict(composer="Anon").verdict, Verdict.REJECT)


if __name__ == "__main__":
    unittest.main()
