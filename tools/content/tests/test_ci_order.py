"""The CI workflow makes what a test reads before it runs the test (Q24, 2026-09-27).

A gate that skips is a gate that is open. `.github/workflows/ci.yml` ran the content tests
before `build.py`, so every test that reads the built catalogue, the curriculum or a fetched
edition skipped and passed there; the MIDI converter's harness was never run; the MIDI parity
test skipped for want of its reference. Those tests now fail when their input is missing, each
naming the step below that provides it, so the order of the steps is itself an invariant and
this file holds it.

GitHub's runner cannot be run from here: this reads the workflow's text. Standard library
only, because the content requirements carry no YAML parser, so the step list is read by its
indentation (one job, one `steps:` list, single-line or `|` values).
"""
from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"

#: Step names the gated tests' failure messages cite. Renaming one here without the messages,
#: or the reverse, would send the reader of a red run to a step that does not exist.
CITED = (
    "Build content",
    "Content pipeline tests",
    "MIDI converter harness",
    "Write the MIDI parity reference",
    "Unit tests",
    "Fetch the MAESTRO test recordings",
)

KEY = re.compile(r"^([A-Za-z][A-Za-z-]*):\s*(.*)$")


def read_steps(text: str) -> list[dict[str, str]]:
    """The job's steps in file order, each as its top-level keys (name, uses, run, ...)."""
    lines = text.splitlines()
    heads = [i for i, line in enumerate(lines) if line.strip() == "steps:"]
    if len(heads) != 1:
        raise AssertionError(f"expected one `steps:` list in {WORKFLOW.name}, found {len(heads)}")
    steps: list[dict[str, str]] = []
    dash: int | None = None
    block: tuple[str, int] | None = None  # a `|` value being read: its key and its indent
    for line in lines[heads[0] + 1:]:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        width = len(line) - len(line.lstrip(" "))
        if dash is None:
            dash = width
        if width < dash:
            break
        if width == dash and stripped.startswith("- "):
            steps.append({})
            block = None
            stripped, width = stripped[2:], dash + 2
        if block is not None and width > block[1]:
            key = block[0]
            steps[-1][key] = f"{steps[-1][key]}\n{stripped}".lstrip("\n")
            continue
        block = None
        if width != dash + 2:
            continue  # inside `with:` or another nested map
        match = KEY.match(stripped)
        if match is None:
            continue
        key, value = match.groups()
        if value in ("|", "|-", ">", ">-"):
            steps[-1][key] = ""
            block = (key, width)
        else:
            steps[-1][key] = value
    return steps


class TheWorkflowOrder(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.text = WORKFLOW.read_text(encoding="utf-8")
        cls.steps = read_steps(cls.text)

    def at(self, needle: str) -> int:
        """The index of the one step whose `run` or `uses` contains `needle`."""
        hits = [
            i for i, step in enumerate(self.steps)
            if needle in step.get("run", "") or needle in step.get("uses", "")
        ]
        self.assertEqual(
            len(hits), 1,
            f"expected one step in {WORKFLOW.name} running {needle!r}, found {len(hits)}",
        )
        return hits[0]

    def assertBefore(self, first: str, then: str, why: str) -> None:  # noqa: N802
        a, b = self.at(first), self.at(then)
        self.assertLess(
            a, b,
            f"{self.steps[a].get('name', first)!r} (step {a + 1}) must run before "
            f"{self.steps[b].get('name', then)!r} (step {b + 1}): {why}",
        )

    def test_the_content_is_built_before_the_content_tests_read_it(self) -> None:
        self.assertBefore(
            "tools/content/build.py", "unittest discover -s tools/content/tests",
            "the content tests read the built catalogue, the curriculum and the fetched "
            "editions, and fail when they are missing",
        )

    def test_the_build_follows_what_it_needs(self) -> None:
        self.assertBefore("actions/cache@", "tools/content/build.py", "the conversion cache")
        self.assertBefore(
            "pip install -r tools/content/requirements.txt", "tools/content/build.py", "music21"
        )

    def test_the_converter_harness_runs(self) -> None:
        self.assertBefore(
            "pip install -r tools/content/requirements.txt",
            "unittest discover -s tools/midi-cleanup/tests",
            "the converter and its harness import music21",
        )

    def test_the_parity_reference_is_written_before_the_unit_tests_compare_against_it(self) -> None:
        self.assertBefore(
            "pip install -r tools/content/requirements.txt",
            "tools/midi-cleanup/tests/parity_reference.py",
            "the reference is the Python converter's answer",
        )
        self.assertBefore(
            "tools/midi-cleanup/tests/parity_reference.py", "npm run test",
            "midiParity.test.ts fails without build/midi-parity/",
        )

    def test_the_recordings_are_fetched_before_anything_reads_them(self) -> None:
        # Q47: the converter harness's real-recording class and parity_reference.py fail
        # under CI without the three MAESTRO performances, naming the fetch step; the cache
        # is restored before the fetch validates it, and saved only after a fetch passed.
        fetch = "tools/midi-cleanup/tests/fetch_maestro.py"
        self.assertBefore("actions/cache/restore@", fetch, "the fetch validates what was restored")
        self.assertBefore(fetch, "actions/cache/save@", "only a verified directory is cached")
        self.assertBefore(fetch, "unittest discover -s tools/midi-cleanup/tests",
                          "the real-recording class fails in CI without the recordings")
        self.assertBefore(fetch, "tools/midi-cleanup/tests/parity_reference.py",
                          "the reference writer fails in CI without the recordings")

    def test_the_unit_tests_run_after_the_content_build_they_read(self) -> None:
        self.assertBefore("tools/content/build.py", "npm run test", "they read app/public/content")
        self.assertBefore("npm ci", "npm run test", "vitest is an app dependency")

    def test_the_render_check_and_the_second_validation_keep_their_places(self) -> None:
        # Not moved by Q24, and held here because the order is the point of both: the render
        # check loads the built app, and the second validation reads what `--apply` wrote.
        self.assertBefore("npm run build", "render_check.py --apply", "it loads the built app")
        self.assertBefore(
            "render_check.py --apply", "python3 tools/content/validate.py",
            "the render check writes durations into the catalogue",
        )

    def test_one_run_per_branch_at_a_time(self) -> None:
        block = re.search(r"^concurrency:\n((?:[ \t]+.*\n)+)", self.text, re.MULTILINE)
        self.assertIsNotNone(block, f"{WORKFLOW.name} lost its `concurrency` block")
        self.assertRegex(block.group(1), r"group:\s*ci-\$\{\{\s*github\.ref\s*\}\}")
        self.assertRegex(block.group(1), r"cancel-in-progress:\s*true")

    def test_the_steps_the_failure_messages_name_exist(self) -> None:
        names = [step.get("name", "") for step in self.steps]
        self.assertEqual([name for name in CITED if name not in names], [])


if __name__ == "__main__":
    unittest.main()
