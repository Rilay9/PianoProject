"""No new review handoff asks the owner to check something a test could check.

The owner, 2026-10-06, after a manual "phone walk" was made the last gate before shipping: "that phone
walk was stupid terrible and useless". FABLE sections 1, 9 and 10 and the audience boundary: objective
behaviour is automated; an owner/device check exists only for a property automation cannot establish,
named with why, in cold-start plain language. This test reads every handoff under docs/review/handoffs/
that is not in the frozen baseline (the 222 written before the rule) and fails on a verification ask,
unless the immediately preceding declaration is `Non-automatable: <property> - <why no test can>`.
That declaration exempts exactly one following owner-check line, never the whole handoff. Quoted lines
(starting with ">") are skipped. Decisions asked of the owner ("the owner decides") are not matched;
verification asks are.
"""
from __future__ import annotations

import unittest

from tools.content import owner_asks as guard

ROOT = guard.ROOT
HANDOFFS = ROOT / guard.HANDOFFS_REL
BASELINE = ROOT / guard.BASELINE_REL
owner_asks = guard.owner_asks


class NoNewHandoffMakesTheOwnerATestHarness(unittest.TestCase):
    def test_every_new_handoff_is_free_of_owner_verification_asks(self):
        self.assertEqual(
            guard.problems(ROOT),
            [],
            "a handoff asks the owner to check what another actor/test should establish; automate it or use one scoped Non-automatable declaration",
        )


class TheMatcherItself(unittest.TestCase):
    def test_the_asks_that_made_the_rule_are_caught(self):
        for text in (
            "A7c.1's only gate is the owner's phone walk.",
            "Bizet / latin.4 still needs only your phone walk.",
            "Shipping waits on the owner.",
            "Tick each line on the phone build once the deploy lands; you should check every step.",
            "Open the lesson on your phone and confirm the loop works.",
            "The owner plays it and checks the bass.",
        ):
            with self.subTest(text=text):
                self.assertTrue(owner_asks(text))

    def test_decisions_and_quotes_pass(self):
        for text in (
            "The owner decides the rung; say which.",
            "> The owner, verbatim: \"that phone walk was stupid terrible and useless\"",
            "The browser spec opens the chart and checks the bass events.",
            "The reviewer checks the notation.",
        ):
            with self.subTest(text=text):
                self.assertEqual(owner_asks(text), [])

    def test_a_named_non_automatable_property_lets_exactly_the_next_device_check_through(self):
        text = ("Non-automatable: whether the phone's speaker carries the bass - no test can hear a speaker.\n"
                "Open Blue Bossa's chord chart on your phone and confirm you hear the bass.")
        self.assertEqual(owner_asks(text), [])

    def test_one_non_automatable_declaration_does_not_exempt_an_unrelated_owner_check(self):
        text = ("Non-automatable: whether the phone's speaker carries the bass - no test can hear a speaker.\n"
                "Open Blue Bossa's chord chart on your phone and confirm you hear the bass.\n"
                "Then you should check whether Plan updated.")
        asks = owner_asks(text)
        self.assertEqual(len(asks), 1)
        self.assertIn("Plan updated", asks[0])

    def test_a_non_automatable_declaration_expires_if_it_does_not_immediately_govern_an_ask(self):
        text = ("Non-automatable: whether the phone's speaker carries the bass - no test can hear a speaker.\n"
                "This paragraph discusses the deployment first.\n"
                "Open Blue Bossa's chord chart on your phone and confirm you hear the bass.")
        self.assertEqual(len(owner_asks(text)), 1)

    def test_the_frozen_baseline_cannot_quietly_grow(self):
        self.assertEqual(guard.problems(ROOT), [])


if __name__ == "__main__":
    unittest.main()
