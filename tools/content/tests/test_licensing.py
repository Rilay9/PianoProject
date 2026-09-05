"""
The licence gate (docs/03-content-pipeline.md §1).

These rules are the ones the doc calls hard, so the tests are deliberately
blunt: an NC licence never bundles, an absent licence never bundles, and a
composition with no known publication date never bundles.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from licensing import (  # noqa: E402
    PD_CUTOFF_YEAR,
    Verdict,
    composition_verdict,
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


if __name__ == "__main__":
    unittest.main()
