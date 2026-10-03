"""The task index and in-flight are generated from the briefs' `## Record` blocks, never hand-kept (T58).

Each verdict used to be hand-appended to the same status in five places. The reviewer approved
generating the two mechanical mirrors from the human-edited truth on five conditions
(`docs/review/responses/questions-70656183.md`, proposal 2) and a scope guard
(`questions-bd7d303e.md`): deterministic and checked; loud on duplicates, broken references and
contradictory structured states; prior status words preserved, never rebuilt from prose; `current.md`
a pointer; the entries still enough to reconstruct HEAD → handoff → response. The committed mirrors
are held to `tools/docs/record_mirrors.py`'s `render()` here, on every push by docs-integrity.yml and
in the full run's content tests. Every failure the generator names is shown on a copy of the fixture
tree under `fixtures/record_mirrors/`, with nothing written; the migration is shown moving the
fixture's hand-kept mirrors into its blocks byte for byte and back.
"""
from __future__ import annotations

import io
import random
import shutil
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools" / "docs"))

import record_mirrors as rm  # noqa: E402

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "record_mirrors"
SCRATCH = ROOT / "build" / "test_record_mirrors"


class Copy:
    """A copy of the fixture tree, broken one way by a test, under the repository's gitignored build/."""

    def __init__(self) -> None:
        SCRATCH.mkdir(parents=True, exist_ok=True)
        self._tmp = tempfile.TemporaryDirectory(dir=SCRATCH)
        self.root = Path(self._tmp.name) / "tree"
        shutil.copytree(FIXTURE, self.root)

    def close(self) -> None:
        self._tmp.cleanup()

    def read(self, rel: str) -> str:
        return (self.root / rel).read_text(encoding="utf-8")

    def write(self, rel: str, text: str) -> None:
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8", newline="\n")

    def replace(self, rel: str, old: str, new: str) -> None:
        text = self.read(rel)
        assert text.count(old) == 1, f"{rel}: {old!r} is not there exactly once"
        self.write(rel, text.replace(old, new))

    def append(self, rel: str, text: str) -> None:
        self.write(rel, self.read(rel) + text)

    def snapshot(self) -> dict[str, bytes]:
        return {p.relative_to(self.root).as_posix(): p.read_bytes() for p in self.root.rglob("*") if p.is_file()}


def run(argv: list[str]) -> tuple[int, str, str]:
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        code = rm.main(argv)
    return code, out.getvalue(), err.getvalue()


def blocks_by_lane(root: Path) -> dict[str, rm.Block]:
    return {b.lane: b for b in rm.load(rm.Tree(root)).blocks if b.owner}


class RoundTrip:
    def assertRoundTrip(self, root: Path) -> None:
        """Generate, read the mirrors back, and find the sources' lanes, states, entries, events and cites."""
        files = rm.render(root)
        lanes = rm.parse_generated(files)
        blocks = blocks_by_lane(root)
        rendered = [b for b in rm.ordered(list(blocks.values())) if b.index is not None]
        self.assertEqual(list(lanes), [b.lane for b in rendered])
        for b in rendered:
            got = lanes[b.lane]
            with self.subTest(lane=b.lane):
                self.assertEqual(got["state"], b.current)
                self.assertEqual(got["entry"], b.entry)
                self.assertEqual(got["events"], [(e.state, e.date, e.words) for e in b.events], "the index row's events")
                self.assertEqual(got["line"] is not None, b.open, "listed in flight exactly when open")
                if got["line"] is not None:
                    self.assertEqual(got["line_events"], got["events"], "the in-flight line's events")
                wanted = set(rm.cited(" ".join(e.words for e in b.events)))
                self.assertLessEqual(wanted, set(got["cites"]), "every file an event cites is on the generated line")


class TheCommittedMirrors(RoundTrip, unittest.TestCase):
    def test_committed_mirrors_equal_generated(self) -> None:
        expected, actual = rm.render(), rm.on_disk()
        stale = [rel for rel in expected if expected[rel] != actual.get(rel)]
        self.assertEqual(stale, [], "a mirror differs from the record blocks: edit the lane's `## Record` block in its "
                                    "brief and run python tools/docs/record_mirrors.py (a mirror is never edited by hand)")

    def test_the_tree_round_trips(self) -> None:
        self.assertRoundTrip(ROOT)


class OnTheFixture(RoundTrip, unittest.TestCase):
    def setUp(self) -> None:
        self.copy = Copy()
        self.addCleanup(self.copy.close)

    def test_the_fixture_is_valid_and_its_mirrors_are_fresh(self) -> None:
        self.assertEqual(run(["--check", "--root", str(self.copy.root)])[0], 0)

    def test_round_trip_recovers_lanes_states_entries_events_and_cites(self) -> None:
        self.assertRoundTrip(self.copy.root)
        lanes = rm.parse_generated(rm.render(self.copy.root))
        self.assertEqual(lanes["A1"]["events"][-1], ("verdict", "2026-01-03", "APPROVE (`responses/aaa.md`)"))
        self.assertIn("handoffs/aaa.md", lanes["A1"]["cites"])  # condition 5: the HEAD sent and the response
        self.assertIn("responses/aaa.md", lanes["A1"]["cites"])

    def test_two_runs_are_byte_identical_and_shuffled_inputs_give_the_same_bytes(self) -> None:
        first = rm.render(self.copy.root)
        self.assertEqual(rm.render(self.copy.root), first)
        for seed in range(5):
            shuffle = random.Random(seed)
            with mock.patch.object(rm, "order", side_effect=lambda paths: shuffle.sample(paths, len(paths))):
                self.assertEqual(rm.render(self.copy.root), first, f"seed {seed}")

    def test_check_writes_nothing_and_names_each_stale_mirror(self) -> None:
        self.copy.replace(rm.INFLIGHT, "the third lane;", "the third lane, edited by hand;")
        before = self.copy.snapshot()
        code, out, _ = run(["--check", "--root", str(self.copy.root)])
        self.assertEqual(code, 1)
        self.assertIn(f"stale: {rm.INFLIGHT}", out)
        self.assertNotIn(rm.INDEX, out)
        self.assertEqual(self.copy.snapshot(), before)

    def test_a_run_regenerates_both_mirrors(self) -> None:
        self.copy.replace(rm.INFLIGHT, "the third lane;", "the third lane, edited by hand;")
        self.copy.replace(rm.INDEX, "| **B1** |", "| **B1** | a hand cell |")
        self.assertEqual(run(["--root", str(self.copy.root)])[0], 0)
        self.assertEqual(run(["--check", "--root", str(self.copy.root)])[0], 0)
        self.assertEqual(self.copy.read(rm.INFLIGHT), (FIXTURE / rm.INFLIGHT).read_text(encoding="utf-8"))


class EachFailureIsLoud(unittest.TestCase):
    """One fixture break per reason: the run names the reason, the file and the line, and writes nothing."""

    def setUp(self) -> None:
        self.copy = Copy()
        self.addCleanup(self.copy.close)

    def assertFails(self, reason: str, where: str) -> rm.Failure:
        with self.assertRaises(rm.RecordError) as caught:
            rm.render(self.copy.root)
        hits = [f for f in caught.exception.failures if f.reason == reason]
        self.assertTrue(hits, f"no {reason}; got {[str(f) for f in caught.exception.failures]}")
        self.assertTrue(any(f.where == where and f.line > 0 for f in hits), [str(f) for f in hits])
        before = self.copy.snapshot()
        code, _, err = run(["--root", str(self.copy.root)])
        self.assertEqual(code, 2)
        self.assertIn(f"record-mirrors: {reason}: {where}:", err)
        self.assertEqual(self.copy.snapshot(), before, "a failing run writes nothing")
        return hits[0]

    def test_duplicate_lane_two_blocks(self) -> None:
        self.copy.write(f"{rm.TASKS}/A1-again.md", "# A1 — again\n\n## Record\n\nlane: A1 · closes: — · entry: —\n"
                        "index: Again | x | y |\nin-flight: again\nstate: drafted 2026-01-04: drafted\n")
        failure = self.assertFails("duplicate-lane", f"{rm.TASKS}/A1-first.md")  # the second of the two in path order
        self.assertIn("A1-again.md", failure.message)

    def test_duplicate_lane_two_entries_with_one_number(self) -> None:
        self.copy.append(rm.PENDING, "\n### Entry 3 — B1: the same number again\n")
        self.assertFails("duplicate-lane", rm.PENDING)

    def test_brief_without_record(self) -> None:
        self.copy.write(f"{rm.TASKS}/Z1-new.md", "# Z1 — a brief with no record block\n")
        self.assertFails("brief-without-record", f"{rm.TASKS}/Z1-new.md")

    def test_missing_backlog_row(self) -> None:
        self.copy.replace(f"{rm.TASKS}/C1-third.md", "closes: C1", "closes: Z9")
        self.assertFails("missing-backlog-row", f"{rm.TASKS}/C1-third.md")

    def test_missing_entry_once_landed_and_legal_before(self) -> None:
        self.assertEqual(rm.render(self.copy.root).keys(), set(rm.MIRRORS))  # C1: Entry 5 named at drafting, legal
        self.copy.append(f"{rm.TASKS}/C1-third.md", "- landed 2026-01-04: merged 2222222\n")
        self.assertFails("missing-entry", f"{rm.TASKS}/C1-third.md")

    def test_missing_file(self) -> None:
        self.copy.append(f"{rm.TASKS}/A1-first.md", "- closed 2026-01-04: closed (`responses/nope.md`)\n")
        self.assertFails("missing-file", f"{rm.TASKS}/A1-first.md")

    def test_entry_without_brief(self) -> None:
        self.copy.append(rm.PENDING, "\n### Entry 6 — Q7: a lane no block declares\n")
        self.assertFails("entry-without-brief", rm.PENDING)

    def test_entry_copies_disagree(self) -> None:
        self.copy.replace(f"{rm.RUNS}/A1/ENTRY.md", "### Entry 2 — A1:", "### Entry 2 — B1:")
        self.assertFails("entry-copies-disagree", f"{rm.RUNS}/A1/ENTRY.md")

    def test_stale_record(self) -> None:
        self.copy.append(rm.PENDING, "\n### Entry 5 — C1: the third lane lands\n")
        self.assertFails("stale-record", f"{rm.TASKS}/C1-third.md")

    def test_verdict_mismatch(self) -> None:
        self.copy.replace(f"{rm.TASKS}/A1-first.md", "- verdict 2026-01-03: APPROVE (", "- verdict 2026-01-03: APPROVE WITH ONE REQUIRED CHANGE (")
        self.assertFails("verdict-mismatch", f"{rm.TASKS}/A1-first.md")

    def test_hand_line_outside_region_a_row(self) -> None:
        self.copy.replace(rm.INDEX, "| **H1** | An early brief | build | done |", "| **H1** | An early brief | build | done |\n| **A1** | a hand row | x | y |")
        self.assertFails("hand-line-outside-region", rm.INDEX)

    def test_hand_line_outside_region_a_line(self) -> None:
        self.copy.replace(rm.INFLIGHT, "- Another standing rule.", "- **C1** — a hand line\n- Another standing rule.")
        self.assertFails("hand-line-outside-region", rm.INFLIGHT)

    def test_unparsed_record(self) -> None:
        self.copy.append(f"{rm.TASKS}/C1-third.md", "status: a line the grammar does not have\n")
        self.assertFails("unparsed-record", f"{rm.TASKS}/C1-third.md")

    def test_entry_lane_mismatch(self) -> None:
        self.copy.replace(f"{rm.TASKS}/D1a-fix.md", "lane: D1a · closes: — · entry: —", "lane: D1a · closes: — · entry: 3")
        self.assertFails("entry-lane-mismatch", f"{rm.TASKS}/D1a-fix.md")

    def test_entry_claimed_twice(self) -> None:
        self.copy.replace(f"{rm.TASKS}/D1a-fix.md", "lane: D1a · closes: — · entry: —", "lane: D1a · closes: — · entry: 4")
        self.assertFails("entry-claimed-twice", f"{rm.TASKS}/D1a-fix.md")

    def test_entry_unrecorded(self) -> None:
        self.copy.replace(f"{rm.TASKS}/B1-second.md", "lane: B1 · closes: B1 · entry: 3", "lane: B1 · closes: B1 · entry: —")
        self.assertFails("entry-unrecorded", f"{rm.TASKS}/B1-second.md")

    def test_pointer_target_missing(self) -> None:
        self.copy.replace(f"{rm.TASKS}/D1a-fix.md", "pointer: D1", "pointer: C1")
        self.assertFails("pointer-target-missing", f"{rm.TASKS}/D1a-fix.md")

    def test_auxiliary_without_owner(self) -> None:
        self.copy.replace(f"{rm.TASKS}/A1-scoping.md", "lane: A1 ·", "lane: Z1 ·")
        self.assertFails("auxiliary-without-owner", f"{rm.TASKS}/A1-scoping.md")

    def test_history_with_state(self) -> None:
        self.copy.append(f"{rm.TASKS}/H1-history.md", "state: closed: done\n")
        self.assertFails("history-with-state", f"{rm.TASKS}/H1-history.md")

    def test_open_lane_without_text(self) -> None:
        text = self.copy.read(f"{rm.TASKS}/C1-third.md")
        self.copy.write(f"{rm.TASKS}/C1-third.md", "\n".join(l for l in text.split("\n") if not l.startswith("in-flight:")))
        self.assertFails("open-lane-without-text", f"{rm.TASKS}/C1-third.md")

    def test_missing_index_text(self) -> None:
        text = self.copy.read(f"{rm.TASKS}/C1-third.md")
        self.copy.write(f"{rm.TASKS}/C1-third.md", "\n".join(l for l in text.split("\n") if not l.startswith("index:")))
        self.assertFails("missing-index-text", f"{rm.TASKS}/C1-third.md")

    def test_state_cites_unrendered(self) -> None:
        self.copy.replace(f"{rm.TASKS}/B1-second.md", "state: closed 2026-01-02: APPROVE (`responses/bbb.md`)",
                          "state: closed 2026-01-02: APPROVE (`responses/aaa.md`)")
        self.assertFails("state-cites-unrendered", f"{rm.TASKS}/B1-second.md")

    def test_missing_markers(self) -> None:
        self.copy.replace(rm.INFLIGHT, rm.END + "\n", "")
        self.assertFails("missing-markers", rm.INFLIGHT)


class TheMigration(unittest.TestCase):
    """`--migrate` moves hand-kept mirror text into the blocks verbatim, and the run reverses it byte for byte."""

    def setUp(self) -> None:
        self.copy = Copy()
        self.addCleanup(self.copy.close)
        self.briefs = {p.name: p.read_text(encoding="utf-8") for p in (FIXTURE / rm.TASKS).glob("*.md") if p.name != "README.md"}

    def to_legacy(self) -> None:
        for name, text in self.briefs.items():
            kept = [l for l in text.split("\n") if not l.startswith(("index:", "in-flight", "pointer:"))]
            self.copy.write(f"{rm.TASKS}/{name}", "\n".join(kept))
        shutil.copy(FIXTURE / "legacy" / "README.md", self.copy.root / rm.INDEX)
        shutil.copy(FIXTURE / "legacy" / "in-flight.md", self.copy.root / rm.INFLIGHT)

    def test_migrate_moves_legacy_text_verbatim_and_is_reversible(self) -> None:
        self.to_legacy()
        code, out, err = run(["--migrate", "--root", str(self.copy.root)])
        self.assertEqual(code, 0, err)
        self.assertIn("10 moved, 0 extended, 0 block(s) created", out)
        for name, text in self.briefs.items():
            self.assertEqual(self.copy.read(f"{rm.TASKS}/{name}"), text, name)
        for rel in rm.MIRRORS:
            self.assertEqual(self.copy.read(rel), (FIXTURE / rel).read_text(encoding="utf-8"), rel)

    def test_migrate_is_idempotent(self) -> None:
        before = self.copy.snapshot()
        code, out, _ = run(["--migrate", "--root", str(self.copy.root)])
        self.assertEqual(code, 0)
        self.assertIn("0 moved, 0 extended, 0 block(s) created; 0 file(s) written", out)
        self.assertEqual(self.copy.snapshot(), before)

    def test_migrate_takes_an_extension_and_names_its_state_line(self) -> None:
        self.to_legacy()
        run(["--migrate", "--root", str(self.copy.root)])
        legacy = (FIXTURE / "legacy" / "in-flight.md").read_text(encoding="utf-8")
        line = next(l for l in legacy.split("\n") if l.startswith("- **C1** — "))
        self.copy.replace(rm.INFLIGHT, "- Another standing rule.", line + " **Approved** 2026-01-04.\n- Another standing rule.")
        # A record script extends a row inside its last cell, before the closing pipe.
        row = next(l for l in (FIXTURE / "legacy" / "README.md").read_text(encoding="utf-8").split("\n") if l.startswith("| **C1** |"))
        self.copy.replace(rm.INDEX, "| ~~H0~~ |", row[:-2] + "; **approved** 2026-01-04 |\n| ~~H0~~ |")
        code, out, err = run(["--migrate", "--root", str(self.copy.root)])
        self.assertEqual(code, 0, err)
        self.assertIn("extended: C1 inflight", out)
        self.assertIn("extended: C1 index", out)
        self.assertIn("state line reads with-reviewer: review it", out)
        c1 = blocks_by_lane(self.copy.root)["C1"]
        self.assertTrue(c1.inflight.endswith("(Entry 5). **Approved** 2026-01-04."))
        self.assertTrue(c1.index.endswith("; Entry 5; **approved** 2026-01-04 |"))
        self.assertNotIn("- **C1** — brief", self.copy.read(rm.INFLIGHT).split(rm.END)[1])
        self.assertEqual(self.copy.read(rm.INDEX).count("| **C1** |"), 1)

    def test_migrate_refuses_a_rewrite_and_writes_nothing(self) -> None:
        self.copy.replace(rm.INFLIGHT, "- Another standing rule.", "- **C1** — brief drafted 2026-01-03, reworded by hand.\n- Another standing rule.")
        before = self.copy.snapshot()
        code, _, err = run(["--migrate", "--root", str(self.copy.root)])
        self.assertEqual(code, 2)
        self.assertIn("--migrate refused: C1's inflight text differs", err)
        self.assertEqual(self.copy.snapshot(), before)

    def test_migrate_creates_a_question_block_for_a_new_lane(self) -> None:
        self.copy.write(f"{rm.TASKS}/N1-new.md", "# N1 — a lane drafted while the mirrors were still hand-kept\n")
        self.copy.replace(rm.INFLIGHT, "- Another standing rule.", "- **N1** — brief drafted 2026-01-05 (`N1-new.md`).\n- Another standing rule.")
        self.copy.replace(rm.INDEX, "| **H1** | An early brief | build | done |",
                          "| **H1** | An early brief | build | done |\n| **N1** | A new lane | docs | brief drafted 2026-01-05 (`N1-new.md`) |")
        code, out, err = run(["--migrate", "--root", str(self.copy.root)])
        self.assertEqual(code, 0, err)
        self.assertIn("created: N1", out)
        block = blocks_by_lane(self.copy.root)["N1"]
        self.assertEqual((block.state, block.entry, block.closes, block.index),
                         ("question", None, [], " A new lane | docs | brief drafted 2026-01-05 (`N1-new.md`) |"))
        self.assertIn("- **N1** — brief drafted 2026-01-05 (`N1-new.md`).", self.copy.read(rm.INFLIGHT))

    def test_migrate_decides_no_role_for_a_brief_no_mirror_names(self) -> None:
        self.copy.write(f"{rm.TASKS}/Z1-new.md", "# Z1 — named by no mirror\n")
        code, _, err = run(["--migrate", "--root", str(self.copy.root)])
        self.assertEqual(code, 2)
        self.assertIn(f"brief-without-record: {rm.TASKS}/Z1-new.md", err)


if __name__ == "__main__":
    unittest.main()
