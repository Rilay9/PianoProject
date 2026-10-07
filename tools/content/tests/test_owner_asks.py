"""No new review handoff asks the owner to check something a test could check.

The owner, 2026-10-06, after a manual "phone walk" was made the last gate before shipping: "that phone
walk was stupid terrible and useless". FABLE sections 1, 9 and 10 and the audience boundary: objective
behaviour is automated; an owner/device check exists only for a property automation cannot establish,
named with why, in cold-start plain language. This test reads every handoff under docs/review/handoffs/
that is not in the frozen baseline (the 222 written before the rule) and fails on a verification ask,
unless the handoff carries a line beginning "Non-automatable:" naming the property and the reason.
Quoted lines (starting with ">") are skipped. Decisions asked of the owner ("the owner decides") are not
matched; verification asks are.
"""
from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HANDOFFS = ROOT / "docs" / "review" / "handoffs"
BASELINE = Path(__file__).with_name("owner_ask_baseline.json")

ASKS = [
    re.compile(r"\b(your|the owner'?s)\s+(phone[\s-]?walk|walk[\s-]?through|walk|confirmation|sign[\s-]?off)\b", re.I),
    re.compile(r"\b(waits?|waiting|blocked|gated?)\s+(only\s+)?(on|for)\s+(you\b|your\b|the owner)", re.I),
    re.compile(r"\b(you|the owner)\s+(should\s+|could\s+|can\s+|need\s+to\s+|must\s+|will\s+)?(check|confirm|verify|tick|walk|test|try\s+it)\b", re.I),
    re.compile(r"\bon\s+(your|the owner'?s)\s+(phone|tablet|device)\b", re.I),
    re.compile(r"\b(owner|you)\s+(plays?|opens?)\b[^.\n]{0,60}\b(and|to)\s+(checks?|confirms?|see\s+whether|verif(y|ies))\b", re.I),
]
ESCAPE = re.compile(r"^\s*Non-automatable:\s*\S.{10,}", re.M)


def owner_asks(text: str) -> list[str]:
    """The lines of ``text`` that ask the owner to check something, or [] when it names why one must."""
    if ESCAPE.search(text):
        return []
    found = []
    for line in text.splitlines():
        if line.lstrip().startswith(">"):
            continue
        if any(p.search(line) for p in ASKS):
            found.append(line.strip()[:160])
    return found


class NoNewHandoffMakesTheOwnerATestHarness(unittest.TestCase):
    def test_every_new_handoff_is_free_of_owner_verification_asks(self):
        baseline = set(json.loads(BASELINE.read_text(encoding="utf-8"))["files"])
        offenders = {}
        for path in sorted(HANDOFFS.glob("*.md")):
            if path.name in baseline:
                continue
            asks = owner_asks(path.read_text(encoding="utf-8"))
            if asks:
                offenders[path.name] = asks
        self.assertEqual(offenders, {}, "a handoff asks the owner to check what a test could; automate it, "
                         "or add 'Non-automatable: <property> - <why no test can>'")


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

    def test_a_named_non_automatable_property_lets_a_device_check_through(self):
        text = ("Non-automatable: whether the phone's speaker carries the bass - no test can hear a speaker.\n"
                "Open Blue Bossa's chord chart on your phone and confirm you hear the bass.")
        self.assertEqual(owner_asks(text), [])


if __name__ == "__main__":
    unittest.main()
