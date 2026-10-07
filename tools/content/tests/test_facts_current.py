"""Every committed demand fact was proved under the build's current measurement definitions.

A demand fact (`content/sources/verified-facts.json`, kind "demand") counts for its rung only while its proof's
version equals `passages.definition_version()`: the measurement fingerprint over `demands.DEFINITION_FILES` plus the
witness's version. A change to any of those files without re-running `py -3.11 tools/content/passages.py --verify`
stales every fact, and the rungs those facts establish lose their claims in the next fresh build (2026-10-07: MT1's
metre move stale-d the four latin facts, and the failure surfaced only as "latin.6: its concepts name tresillo ...
none of its options establishes it"). This test fails in the unit suite instead, and says which command fixes it.
Identity staleness (a moved file) is left to the build, which reads the built catalogue.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import passages  # noqa: E402


class EveryDemandFactIsCurrent(unittest.TestCase):
    def test_every_committed_demand_fact_carries_the_current_definition_version(self) -> None:
        current = passages.definition_version()
        stale = {}
        for row in passages.demand_rows():
            verified = (row.get("proof") or {}).get("verified") or {}
            if verified.get("version") != current:
                stale[f"{row.get('item')} {(row.get('fact') or {}).get('demand')}"] = verified.get("version")
        self.assertEqual(stale, {}, f"proved under another definition version than {current}: run "
                         "`py -3.11 tools/content/passages.py --verify` and commit content/sources/verified-facts.json "
                         "with the change to the measurement definitions")


if __name__ == "__main__":
    unittest.main()
