"""
The build's reader of verified hand facts (HD2; `docs/review/responses/hd2-corpus-diff.md` §2 and §4).

`verified_hand` reads only the `hand` rows of `content/sources/verified-facts.json`, checks each by the
hand rules, refuses a row whose identity is not the file's current sha256 (stale), and `attach_demands`
hands a file's current rows to the bridge as `verifiedHands`, re-measuring when they change. The app's
reader (`app/src/curriculum/verifiedFacts.ts`) holds the same rules (`verifiedHands.test.ts`).

No content build, no browser, no Node: the bridge is stubbed where the build is exercised.
"""
from __future__ import annotations

import hashlib
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build as B  # noqa: E402
import demands as D  # noqa: E402
import verified_hand as VF  # noqa: E402


def hand_row(**over) -> dict:
    out = {
        "item": "song.x",
        "identity": {"kind": "file", "sha256": "a" * 64},
        "bars": [40, 40],
        "staff": 1,
        "voice": 2,
        "kind": "hand",
        "fact": "R",
        "rungs": None,
        "proof": {"method": "m", "date": "2026-10-06", "evidence": "e"},
    }
    out.update(over)
    return out


class TestTheHandRules(unittest.TestCase):
    def test_the_committed_store_reads(self) -> None:
        rows = VF.read_hand_facts()
        self.assertEqual(len(rows), 5)
        self.assertEqual({r["item"] for r in rows}, {"song.jazz.the-crave", "song.ragtime.joplin-solace"})

    def test_a_malformed_hand_row_is_refused_naming_it(self) -> None:
        bad = {
            "fact": {"fact": "left"},
            "stale": {"stale": False},
            "rungs": {"rungs": ["latin.6"]},
            "staff": {"staff": None},
            "voice": {"voice": None},
            "bars": {"bars": [41, 40]},
            "identity": {"identity": {"kind": "file", "sha256": "abc"}},
            "proof": {"proof": {"method": "m"}},
        }
        for field, change in bad.items():
            with self.subTest(field=field):
                with self.assertRaisesRegex(VF.VerifiedFactsError, r"row 0 \(hand\)"):
                    VF.read_hand_facts({"facts": [hand_row(**change)]})

    def test_a_row_of_another_kind_is_not_read(self) -> None:
        demand = {"item": "song.x", "kind": "demand", "bars": [21, 26], "fact": "rhythm.tresillo", "rungs": ["latin.6"]}
        self.assertEqual(len(VF.read_hand_facts({"facts": [demand, hand_row()]})), 1)

    def test_a_row_whose_identity_is_not_the_files_is_stale_and_refused(self) -> None:
        rows = [hand_row()]
        self.assertEqual(VF.verified_hands("song.x", "a" * 64, rows), [{"bars": [40, 40], "staff": 1, "voice": 2, "hand": "R"}])
        self.assertEqual(VF.verified_hands("song.x", "b" * 64, rows), [])
        self.assertTrue(all(r["stale"] for r in VF.hand_facts_for("song.x", "b" * 64, rows)))
        self.assertEqual(VF.verified_hands("song.y", "a" * 64, rows), [], "another item's row is not this item's")


class TestTheBridgeListing(unittest.TestCase):
    def test_a_files_hands_go_with_it(self) -> None:
        a, b = Path("a.mxl"), Path("b.mxl")
        hands = [{"bars": [40, 40], "staff": 1, "voice": 2, "hand": "R"}]
        self.assertEqual(D._listing([a, b], None, {str(a): hands}), [{"path": str(a), "verifiedHands": hands}, str(b)])
        self.assertEqual(D._listing([a], "left", None), [{"path": str(a), "declaredHand": "left"}])
        self.assertEqual(D._listing([a], None), [str(a)])


class TestAttachDemandsVerifiedHands(unittest.TestCase):
    """`attach_demands` measures a file with its current verified hands and re-measures when they change."""

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.out = Path(self.tmp.name) / "out"
        (self.out / "scores").mkdir(parents=True)
        self.build_dir = Path(self.tmp.name) / "build"

    def score(self, name: str, text: str) -> tuple[str, str]:
        path = self.out / "scores" / name
        path.write_text(text, encoding="utf-8")
        return f"scores/{name}", hashlib.sha256(path.read_bytes()).hexdigest()

    def run_build(self, entries: list[dict], rows: list[dict], calls: list) -> None:
        def measure_each(paths, declared_hand=None, verified_hands=None, **_kw):
            calls.append([(p.name, (verified_hands or {}).get(str(p))) for p in paths])
            return {str(p): {"opportunities": {}, "measures": 4, "steps": 8, "notes": 8, "demands": [], "positions": {}}
                    for p in paths}

        with mock.patch.object(B, "BUILD_DIR", self.build_dir), \
                mock.patch.object(B, "clef_misread", return_value=None), \
                mock.patch.object(VF, "read_hand_facts", return_value=rows), \
                mock.patch.object(D, "measure_each", side_effect=measure_each):
            B.attach_demands(entries, self.out)

    def test_current_rows_reach_the_bridge_stale_ones_do_not_and_a_change_remeasures(self) -> None:
        file, sha = self.score("a.xml", "<a/>")
        entry = {"id": "song.x", "hands": "both", "file": file, "tags": ["authored"]}
        hands = [{"bars": [40, 40], "staff": 1, "voice": 2, "hand": "R"}]
        calls: list = []
        self.run_build([dict(entry)], [hand_row(identity={"kind": "file", "sha256": sha})], calls)
        self.assertEqual(calls, [[("a.xml", hands)]])
        # The same rows again: nothing measured.
        self.run_build([dict(entry)], [hand_row(identity={"kind": "file", "sha256": sha})], calls)
        self.assertEqual(len(calls), 1)
        # The row goes stale (another file identity): refused, and the file is measured again without it.
        self.run_build([dict(entry)], [hand_row(identity={"kind": "file", "sha256": "b" * 64})], calls)
        self.assertEqual(calls[1:], [[("a.xml", None)]])


if __name__ == "__main__":
    unittest.main()
