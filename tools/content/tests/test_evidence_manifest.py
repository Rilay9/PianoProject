"""The evidence manifest is data read from a seam's captures, and it refuses a run it cannot close.

Q64 (2026-09-29): every landing rewrote the same evidence by hand (paths, commits, commands, exit
codes, captures, CI) in the entry, the note and the handoff. `tools/docs/evidence_manifest.py
<seam>` reads `docs/prompts/runs/<seam>/` and the git state and writes `MANIFEST.md` beside the
captures, so an entry states judgements and exceptions and points at the manifest for the rest.

The five folders the builders left on 2026-09-29 do not share one convention: D4 heads a capture
with `$ (cwd ...) command` and ends it `exit N`, with a `.done` file holding the code; E2, D5 and
D4a end with `exit N` and mostly name no command; F2 opens with `<label> exit N`. So the fixture
below carries each shape, and the manifest says where it read each exit rather than guessing.

A capture that names a command (`$ ...`) and records no exit is refused: the manifest is not
written, because a run whose result is missing is exactly what an entry must not report as done.
A capture with an exit and no command line is written and named in its own list.
"""
from __future__ import annotations

import hashlib
import io
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools" / "docs"))

import evidence_manifest as em  # noqa: E402


def git(root: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", *args],
        cwd=root, check=True, capture_output=True, text=True,
    ).stdout.strip()


class Fixture(unittest.TestCase):
    """A throwaway repository with one committed file, one seam change and a capture folder."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        git(self.root, "init", "-q")
        (self.root / "app").mkdir()
        (self.root / "app" / "kept.ts").write_text("export const a = 1;\n", encoding="utf-8")
        (self.root / "app" / "changed.ts").write_text("export const b = 1;\n", encoding="utf-8")
        git(self.root, "add", "-A")
        git(self.root, "commit", "-q", "-m", "base")
        self.base = git(self.root, "rev-parse", "HEAD")
        # The seam: one file changed, one added.
        (self.root / "app" / "changed.ts").write_text("export const b = 2;\n", encoding="utf-8")
        (self.root / "app" / "added.ts").write_text("export const c = 3;\n", encoding="utf-8")
        self.folder = self.root / "docs" / "prompts" / "runs" / "S1"
        self.folder.mkdir(parents=True)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def capture(self, name: str, text: str, newline: str = "\n") -> Path:
        path = self.folder / name
        path.write_bytes(text.replace("\n", newline).encode("utf-8"))
        return path

    def full_folder(self) -> None:
        self.capture("tsc.txt", "$ (cwd app) npx tsc -b\n\nexit 0\n")
        self.capture("build-1.txt", "$ python tools/content/build.py --offline\nok\n")
        self.capture("build-1.done", "0")
        self.capture("lint.txt", "﻿eslint (touched files) exit 0\n\n  17 passed (11.6s)\n\n")
        self.capture("content-build.log", "\n  ok    validate   content validation OK\ncontent-build exit 0\n")
        self.capture("vitest-named.txt", "\n RUN  v5\n Tests  3 passed (3)\n\nexit 0\n")
        self.capture("red-app-committed.txt", "$ npx vitest run tests/unit/a.test.ts\n1 failed\nexit 1\n")
        self.capture("mutant-guard-dropped.txt", "$ npx vitest run tests/unit/a.test.ts\nFAIL\nexit 1\n")
        self.capture("orchestrator-exit.txt",
                     "== tsc  00:10:36\ntsc exit=0\n== vitest-targeted  00:11:20\nvitest-targeted exit=1\n"
                     "== build-app  00:11:41\nCHAIN DONE 00:12:28\n")
        self.capture("README.md", "The builder's captures.\n")

    def write(self, *extra: str) -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = em.main(["S1", "--root", str(self.root), "--no-ci", *extra])
        return code, out.getvalue(), err.getvalue()


class EveryField(Fixture):
    def test_each_capture_its_command_exit_size_and_sha256(self) -> None:
        self.full_folder()
        code, _, err = self.write()
        self.assertEqual(code, 0, err)
        rows = {c.name: c for c in em.read_folder(self.folder)}
        tsc = rows["tsc.txt"]
        self.assertEqual((tsc.kind, tsc.command, tsc.exit, tsc.exit_from), ("capture", "(cwd app) npx tsc -b", 0, "last line"))
        raw = (self.folder / "tsc.txt").read_bytes()
        self.assertEqual(tsc.size, len(raw))
        self.assertEqual(tsc.sha256, hashlib.sha256(raw).hexdigest())
        # D4's shape: the exit in the .done file beside the capture.
        self.assertEqual((rows["build-1.txt"].exit, rows["build-1.txt"].exit_from), (0, "build-1.done"))
        self.assertEqual((rows["build-1.done"].kind, rows["build-1.done"].exit), ("sidecar", 0))
        # F2's shape: the label and the exit on the first line, behind a byte-order mark.
        lint = rows["lint.txt"]
        self.assertEqual((lint.command, lint.label, lint.exit, lint.exit_from), (None, "eslint (touched files)", 0, "first line"))
        # D4a's shape: `<label> exit N` last.
        log = rows["content-build.log"]
        self.assertEqual((log.command, log.label, log.exit, log.exit_from), (None, "content-build", 0, "last line"))
        self.assertEqual(rows["README.md"].kind, "artefact")
        self.assertEqual(rows["orchestrator-exit.txt"].kind, "chain")

    def test_the_manifest_lists_changed_files_red_lines_mutants_chain_and_ci(self) -> None:
        self.full_folder()
        code, _, err = self.write()
        self.assertEqual(code, 0, err)
        text = (self.folder / "MANIFEST.md").read_text(encoding="utf-8")
        self.assertIn(f"| HEAD | `{self.base}` |", text)
        changed_blob = git(self.root, "hash-object", "app/changed.ts")
        added_blob = git(self.root, "hash-object", "app/added.ts")
        self.assertIn(f"| `app/changed.ts` | M | `{changed_blob}` |", text)
        self.assertIn(f"| `app/added.ts` | A | `{added_blob}` |", text)
        self.assertNotIn("docs/prompts/runs/S1/", text.split("## Changed files", 1)[1].split("##", 1)[0])
        self.assertNotIn("MANIFEST.md", text.split("## Captures", 1)[1])
        red = text.split("## Red lines", 1)[1].split("##", 1)[0]
        self.assertIn("| `red-app-committed.txt` | 1 |", red)
        self.assertNotIn("mutant-guard-dropped", red)
        mutants = text.split("## Mutants", 1)[1].split("##", 1)[0]
        self.assertIn("| `mutant-guard-dropped.txt` | 1 |", mutants)
        chain = text.split("## Chain", 1)[1].split("##", 1)[0]
        self.assertIn("| tsc | 0 |", chain)
        self.assertIn("| vitest-targeted | 1 |", chain)
        self.assertIn("| build-app | no exit line |", chain)
        self.assertIn("| chain | `orchestrator-exit.txt`: 2 exit line(s), non-zero: vitest-targeted=1; 1 step(s) with no exit line; CHAIN DONE |", text)
        self.assertIn("| CI | not yet run: the seam's changes are uncommitted |", text)

    def test_the_manifest_is_data_the_same_folder_gives_the_same_bytes(self) -> None:
        self.full_folder()
        self.write()
        first = (self.folder / "MANIFEST.md").read_bytes()
        self.write()
        self.assertEqual((self.folder / "MANIFEST.md").read_bytes(), first)

    def test_no_chain_file_says_not_yet_run(self) -> None:
        self.capture("tsc.txt", "$ npx tsc -b\nexit 0\n")
        self.write()
        text = (self.folder / "MANIFEST.md").read_text(encoding="utf-8")
        self.assertIn("| chain | not yet run: no `orchestrator-exit.txt` |", text)


class Refusals(Fixture):
    def test_a_capture_naming_a_command_without_an_exit_line_is_refused(self) -> None:
        self.capture("tsc.txt", "$ npx tsc -b\nexit 0\n")
        self.capture("vitest-cut-off.txt", "$ npx vitest run tests/unit/a.test.ts\n RUN  v5\n")
        code, _, err = self.write()
        self.assertEqual(code, 2)
        self.assertIn("vitest-cut-off.txt", err)
        self.assertFalse((self.folder / "MANIFEST.md").exists(), "a refused folder writes no manifest")

    def test_a_capture_without_a_command_line_is_named(self) -> None:
        self.capture("vitest-named.txt", "\n RUN  v5\n Tests  3 passed (3)\n\nexit 0\n")
        code, _, err = self.write()
        self.assertEqual(code, 0, err)
        text = (self.folder / "MANIFEST.md").read_text(encoding="utf-8")
        named = text.split("## Captures without a command line", 1)[1].split("##", 1)[0]
        self.assertIn("`vitest-named.txt`", named)

    def test_an_empty_folder_is_refused(self) -> None:
        code, _, err = self.write()
        self.assertEqual(code, 2)
        self.assertIn("no captures", err)


class TheCommittedForm(Fixture):
    def test_a_crlf_capture_hashes_as_git_will_store_it(self) -> None:
        # core.autocrlf=true: a capture PowerShell wrote with CRLF is committed with LF, so the
        # manifest hashes the committed form and a checkout on any platform reproduces it.
        lf = self.capture("a.txt", "$ npx tsc -b\nexit 0\n")
        crlf = self.capture("b.txt", "$ npx tsc -b\nexit 0\n", newline="\r\n")
        a, b = em.read_capture(lf, self.folder), em.read_capture(crlf, self.folder)
        self.assertEqual((a.sha256, a.size), (b.sha256, b.size))
        self.assertEqual(em.committed_bytes(b"\x00\r\n"), b"\x00\r\n", "a binary file is hashed as it is")
        # Git's own rule: a lone CR makes the file binary to it, so it is stored unconverted
        # (D4's build-baseline.txt holds CR CR LF); colour codes do not.
        self.assertEqual(em.committed_bytes(b"a\r\r\nb\r\n"), b"a\r\r\nb\r\n")
        self.assertEqual(em.committed_bytes(b"\x1b[36mvite\x1b[39m\r\n"), b"\x1b[36mvite\x1b[39m\n")

    def test_commit_mode_reads_the_commit_and_its_blobs(self) -> None:
        git(self.root, "add", "app")
        git(self.root, "commit", "-q", "-m", "the seam")
        seam = git(self.root, "rev-parse", "HEAD")
        self.capture("tsc.txt", "$ npx tsc -b\nexit 0\n")
        code, _, err = self.write("--commit", seam)
        self.assertEqual(code, 0, err)
        text = (self.folder / "MANIFEST.md").read_text(encoding="utf-8")
        blob = git(self.root, "rev-parse", f"{seam}:app/changed.ts")
        self.assertIn(f"| commit | `{seam}` |", text)
        self.assertIn(f"| `app/changed.ts` | M | `{blob}` |", text)
        self.assertIn("| CI | not read: --no-ci |", text)


class TheCiRun(unittest.TestCase):
    RUNS = [
        {"databaseId": 1, "headSha": "a1", "status": "completed", "conclusion": "success", "createdAt": "2026-09-29T01:00:00Z"},
        {"databaseId": 2, "headSha": "b2", "status": "completed", "conclusion": "cancelled", "createdAt": "2026-09-29T02:00:00Z"},
        {"databaseId": 3, "headSha": "c3", "status": "completed", "conclusion": "failure", "createdAt": "2026-09-29T03:00:00Z"},
        {"databaseId": 4, "headSha": "d4", "status": "in_progress", "conclusion": "", "createdAt": "2026-09-29T04:00:00Z"},
    ]

    def carries(self, *heads: str):
        return lambda head: head in heads

    def test_the_first_carrying_run_that_finished_is_the_one(self) -> None:
        line = em.ci_line(self.RUNS, self.carries("b2", "c3", "d4"))
        self.assertEqual(line, "run 3: failure on `c3` (1 earlier carrying run(s) cancelled)")

    def test_a_run_still_going_is_said_so(self) -> None:
        self.assertEqual(em.ci_line(self.RUNS, self.carries("d4")), "run 4: in_progress on `d4`")
        self.assertEqual(em.ci_line(self.RUNS, self.carries("b2", "d4")),
                         "run 4: in_progress on `d4` (1 earlier carrying run(s) cancelled)")

    def test_only_cancelled_runs_say_none_finished(self) -> None:
        self.assertEqual(em.ci_line(self.RUNS, self.carries("b2")), "cancelled: 1 carrying run(s), none finished")

    def test_no_carrying_run_is_not_yet_run(self) -> None:
        self.assertEqual(em.ci_line(self.RUNS, self.carries()), "not yet run: no CI run's head carries the commit")

    def test_order_is_by_creation_not_by_the_listing(self) -> None:
        line = em.ci_line(list(reversed(self.RUNS)), self.carries("a1", "c3"))
        self.assertEqual(line, "run 1: success on `a1`")


if __name__ == "__main__":
    unittest.main()
