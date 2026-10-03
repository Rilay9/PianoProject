"""
The reuse census covers every registered mechanism exactly once (CT1, `CLAUDE.md`
*Reuse before reinvention*; `docs/prompts/runs/CT1/plan.md` §11.8).

A generator family, demand detector or drill kind added without a census row fails here,
and so does one given two rows. The decision must be recorded before the mechanism ships.

Three registries exist in code and are checked:
- generator families: `tools/content/family_contracts.json`;
- detectors: `DETECTOR_IDS` in `app/src/demands/detect.ts`;
- drill kinds: `content/catalog.static.json`.

Scoring rules and progression mechanisms have no registry in code, so they stay listed
by hand in the census (§9.3 and §9.8). Inventing a registry only to check it was
rejected, as process for its own sake.
"""
from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
CENSUS = REPO / "docs" / "prompts" / "runs" / "CT1" / "reuse-map.md"


def section(text: str, start: str, end: str) -> list[str]:
    """The first cell of every table row between two headings."""
    body = text[text.index(start):text.index(end)]
    return [line.split("|")[1] for line in body.splitlines() if line.startswith("|") and not line.startswith("|---")]


def rows_naming(cells: list[str], name: str) -> int:
    return sum(1 for cell in cells if re.search(r"`" + re.escape(name) + r"`", cell))


class ReuseCensusCoverage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = CENSUS.read_text(encoding="utf-8")

    def check(self, names: list[str], start: str, end: str):
        cells = section(self.text, start, end)
        self.assertTrue(names)
        for name in names:
            with self.subTest(name):
                self.assertEqual(rows_naming(cells, name), 1, f"{name} needs exactly one census row in {start}")

    def test_every_generator_family(self):
        contracts = json.loads((REPO / "tools" / "content" / "family_contracts.json").read_text(encoding="utf-8"))
        self.check(sorted(contracts["families"]), "### 9.1", "### 9.2")

    def test_every_detector(self):
        source = (REPO / "app" / "src" / "demands" / "detect.ts").read_text(encoding="utf-8")
        block = source[source.index("DETECTOR_IDS"):]
        block = block[:block.index("]")]
        self.check(re.findall(r"'(\w+)'", block), "### 9.2", "### 9.3")

    def test_every_drill_kind(self):
        static = json.loads((REPO / "content" / "catalog.static.json").read_text(encoding="utf-8"))
        items = static["items"] if isinstance(static, dict) else static
        kinds = sorted({(i.get("drill") or {}).get("kind") for i in items} - {None})
        self.check(kinds, "| Drill kinds (factory)", "### 9.5")


if __name__ == "__main__":
    unittest.main()
