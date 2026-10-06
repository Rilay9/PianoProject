"""
The build's declared-hand rule is the app's (HD1a; Entry 244, the reviewer's required change in
`docs/review/responses/1a02701e.md` §1).

`app/src/curriculum/declaredHand.ts` decides when a one-staff item's `hands` is a statement the model
may take: a bundled file, not an import, and `provenance.facts.hands.kind` authored or reviewed.
`build.declared_hand` is the same rule for the measured-cells bridge. At `attach_demands` time a built
row has no provenance yet (`attach_provenance` runs after it), so the rule reads the fact the build
would write (`build.hands_fact`, which `attach_provenance` also writes from); a row that already
carries a provenance is read as the app reads it.

No content build, no browser, no Node: the bridge is stubbed where the cache is exercised.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build as B  # noqa: E402


def row(hands: str | None = "left", kind: str | None = "authored", **over) -> dict:
    """A bundled authored row; `kind` the provenance's hands fact (None: no provenance record at all)."""
    out: dict = {"id": "song.x", "hands": hands, "file": "scores/authored/x.mxl", "tags": ["authored"]}
    if kind is not None:
        out["provenance"] = {"source": "authored", "facts": {"hands": {"kind": kind, "via": "test"}}}
    out.update(over)
    return out


class TestDeclaredHandRule(unittest.TestCase):
    def test_authored_and_reviewed_left_and_right_are_declared(self) -> None:
        for kind in ("authored", "reviewed"):
            for hand in ("left", "right"):
                with self.subTest(kind=kind, hand=hand):
                    self.assertEqual(B.declared_hand(row(hand, kind)), hand)

    def test_an_inferred_fact_declares_nothing(self) -> None:
        self.assertIsNone(B.declared_hand(row("left", "inferred")))

    def test_a_row_with_a_record_but_no_hands_fact_declares_nothing(self) -> None:
        bare = row("left")
        bare["provenance"]["facts"] = {}
        self.assertIsNone(B.declared_hand(bare))
        bare["provenance"] = {"source": "authored"}
        self.assertIsNone(B.declared_hand(bare))

    def test_an_import_declares_nothing_whatever_it_says(self) -> None:
        self.assertIsNone(B.declared_hand(row("left", "authored", imported=True)))
        self.assertEqual(B.declared_hand(row("left", "authored", imported=False)), "left")

    def test_no_bundled_file_declares_nothing(self) -> None:
        for file in (None, ""):
            with self.subTest(file=file):
                self.assertIsNone(B.declared_hand(row("left", "authored", file=file)))
        self.assertIsNone(B.declared_hand({"id": "drill.x", "hands": "left", "tags": ["authored"]}))

    def test_both_and_absent_declare_nothing(self) -> None:
        self.assertIsNone(B.declared_hand(row("both")))
        self.assertIsNone(B.declared_hand(row("")))
        self.assertIsNone(B.declared_hand(row(None)))

    def test_a_built_row_before_its_provenance_is_read_as_the_fact_the_build_will_write(self) -> None:
        # attach_demands runs before attach_provenance: the same rule, from the same fact.
        for tags, file in ((["authored"], "scores/authored/x.mxl"), (["pdmx"], "scores/pdmx/x.mxl"),
                           (["kern"], "scores/kern/x.mxl"), (["musetrainer"], "scores/m/x.mxl"),
                           (["mutopia"], "scores/mutopia/x.mxl")):
            with self.subTest(tags=tags):
                self.assertEqual(B.declared_hand(row("right", None, tags=tags, file=file)), "right")
        excerpt = row("left", None, type="excerpt", excerptOf="song.parent", tags=[])
        self.assertEqual(B.declared_hand(excerpt), "left")
        generated = row("right", None, tags=[], file="scores/generated/g.mxl", drill={"generator": {"family": "f"}})
        self.assertEqual(B.declared_hand(generated), "right")

    def test_a_file_the_build_cannot_attribute_declares_nothing(self) -> None:
        # No source kind, so no hands fact is written for it (`attach_provenance`), and so no declaration.
        stray = row("left", None, tags=[], file="somewhere/else.mxl")
        self.assertIsNone(B.hands_fact(stray))
        self.assertIsNone(B.declared_hand(stray))

    def test_the_fact_the_provenance_pass_writes_is_an_authoritative_kind(self) -> None:
        for entry in (row("left", None), row("right", None, tags=["pdmx"], file="scores/pdmx/x.mxl"),
                      row("left", None, type="excerpt", tags=[])):
            with self.subTest(tags=entry["tags"], type=entry.get("type")):
                fact = B.hands_fact(entry)
                self.assertIsNotNone(fact)
                self.assertIn(fact["kind"], B.AUTHORITATIVE_HAND_KINDS)


class TestAttachDemandsDeclaration(unittest.TestCase):
    """`attach_demands` measures under the rule's answer, caches on it, and stops on a contradiction."""

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.out = Path(self.tmp.name) / "out"
        (self.out / "scores").mkdir(parents=True)
        self.build_dir = Path(self.tmp.name) / "build"

    def score(self, name: str, text: str = "<score-partwise/>") -> str:
        (self.out / "scores" / name).write_text(text, encoding="utf-8")
        return f"scores/{name}"

    def run_build(self, entries: list[dict], calls: list) -> None:
        def measure_each(paths, declared_hand=None, **_kw):
            calls.append((sorted(p.name for p in paths), declared_hand))
            return {str(p): {"opportunities": {}, "measures": 4, "steps": 8, "notes": 8, "demands": [], "positions": {}}
                    for p in paths}

        import demands as D

        with mock.patch.object(B, "BUILD_DIR", self.build_dir), \
                mock.patch.object(B, "clef_misread", return_value=None), \
                mock.patch.object(D, "measure_each", side_effect=measure_each):
            B.attach_demands(entries, self.out)

    def test_the_bridge_is_asked_under_the_rules_answer_not_the_rows_word(self) -> None:
        authored = row("left", "authored", id="a", file=self.score("a.xml", "<a/>"))
        inferred = row("left", "inferred", id="b", file=self.score("b.xml", "<b/>"))
        calls: list = []
        self.run_build([authored, inferred], calls)
        self.assertEqual(sorted(calls, key=lambda c: c[1] or ""), [(["b.xml"], None), (["a.xml"], "left")])

    def test_the_cache_remeasures_when_the_declaration_changes_and_only_then(self) -> None:
        file = self.score("a.xml", "<a/>")
        calls: list = []
        self.run_build([row("left", "authored", id="a", file=file)], calls)
        self.run_build([row("left", "authored", id="a", file=file)], calls)
        self.assertEqual(calls, [(["a.xml"], "left")], "a second run under the same declaration measures nothing")
        # the same file, no longer an authoritative declaration: measured again, with none
        self.run_build([row("left", "inferred", id="a", file=file)], calls)
        self.assertEqual(calls[1:], [(["a.xml"], None)])

    def test_two_rows_declaring_different_hands_for_one_file_stop_the_build(self) -> None:
        file = self.score("shared.xml", "<s/>")
        with self.assertRaises(SystemExit) as caught:
            self.run_build([row("left", "authored", id="a", file=file), row("right", "authored", id="b", file=file)], [])
        self.assertIn("declare different hands", str(caught.exception))

    def test_a_non_authoritative_row_and_an_authoritative_one_for_one_file_stop_the_build(self) -> None:
        # The rule's answers differ (none and left), so the one model of the file cannot be both.
        file = self.score("shared.xml", "<s/>")
        with self.assertRaises(SystemExit):
            self.run_build([row("left", "authored", id="a", file=file), row("left", "inferred", id="b", file=file)], [])


if __name__ == "__main__":
    unittest.main()
