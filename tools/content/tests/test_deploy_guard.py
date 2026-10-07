"""
The Pages deploy does not publish a public build that could not fetch what a healthy one bundles (Q88, 2026-09-29).

Since Q80 a build that could not fetch a public piece validates with a warning, which is right for the build and
wrong for the phone: the Pages job would replace the last complete deployment with one where *Pine Apple Rag* is
"import your own copy" and ragtime.8's stride bass is kept by no bundled option, until a later deploy fetches. The
reviewer's Q86 ruling (`docs/review/responses/2d9e7e2c.md`) keeps the validator as built and guards the deployment:
`tools/content/deploy_guard.py` reads the built catalogue and asks `validate.unfetched_placeholders`, the one
definition of a placeholder that is this build's own fetch, and `.github/workflows/pages.yml` runs it between the
build and the artifact upload. What is held here:

- **the guard**, run as the step runs it (a process, its exit code and its log) on constructed catalogues: a
  placeholder whose reason is this build's fetch, as `import_mutopia.build_entry` writes it (so a change of that
  wording turns this red), is refused with exit 1, naming the id and the reason; the licence placeholders of the four
  import steps, the committed import-only rows and the runtime drills pass with exit 0; so does an empty catalogue; a
  catalogue that cannot be read is refused with exit 2, since a guard that skips is a guard that is open;
- **the step**, read from the workflow's text as `test_ci_order.py` reads CI's: after the build and before
  `configure-pages` and the upload, reading the catalogue the upload publishes, with nothing that lets its failure
  through; and the deploy job needing the build job, which is how a refusal keeps the previous deployment live (a pin).

GitHub's runner cannot be run from here: that the step fails the job on the runner is read from the workflow, not
observed. The catalogues are written under the worktree's gitignored `build/`, never under `docs/`.
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import BUILD_DIR  # noqa: E402
from tests.test_ci_order import read_steps  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
GUARD = REPO / "tools" / "content" / "deploy_guard.py"
PAGES = REPO / ".github" / "workflows" / "pages.yml"
STATIC = REPO / "content" / "catalog.static.json"
MUTOPIA = REPO / "content" / "sources" / "mutopia.json"
RAG = "song.ragtime.joplin-pine-apple-rag.mutopia"

#: What the step runs; `at()` finds the step by it.
GUARD_RUN = "tools/content/deploy_guard.py"


def mutopia_table() -> tuple[dict, dict]:
    table = json.loads(MUTOPIA.read_text(encoding="utf-8"))
    return table, next(item for item in table["items"] if item["id"] == RAG)


def mutopia_entry(tmp: Path, sources: Path, row: dict | None = None) -> dict:
    """The row `import_mutopia.build_entry` writes from what is (or is not) under `sources` (Q80's helper)."""
    import import_mutopia as M

    table, pinned = mutopia_table()
    return M.build_entry(row or pinned, table, sources_dir=sources, scores_out=tmp / "out" / "scores" / "imported",
                         report=M.ImportReport(), work_dir=tmp / "work", use_cache=False)


def bundled(item_id: str) -> dict:
    return {
        "id": item_id, "type": "song", "title": item_id.rsplit(".", 1)[-1].title(), "level": 3.0, "hands": "both",
        "tracks": ["core"], "concepts": [], "file": f"scores/imported/{item_id}.mxl", "tags": [],
        "source": {"name": "test", "license": "Public Domain", "pd_region": "worldwide"},
    }


def placeholder(item_id: str, hint: str, tags: list[str]) -> dict:
    return dict(bundled(item_id), file=None, importHint=hint, tags=tags)


class GuardCase(unittest.TestCase):
    def setUp(self) -> None:
        BUILD_DIR.mkdir(parents=True, exist_ok=True)
        self._tmp = tempfile.TemporaryDirectory(dir=BUILD_DIR, prefix="q88-guard-")
        self.tmp = Path(self._tmp.name)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def guard(self, catalog: list | None, *, raw: str | None = None) -> subprocess.CompletedProcess:
        """The guard as the step runs it, on a content directory holding `catalog` (or `raw` text, or nothing)."""
        content = self.tmp / "content"
        content.mkdir(exist_ok=True)
        if catalog is not None:
            (content / "catalog.json").write_text(json.dumps(catalog, indent=2), encoding="utf-8")
        elif raw is not None:
            (content / "catalog.json").write_text(raw, encoding="utf-8")
        env = dict(os.environ, PYTHONIOENCODING="utf-8")
        return subprocess.run([sys.executable, str(GUARD), "--dir", str(content)], capture_output=True,
                              encoding="utf-8", env=env, cwd=REPO, check=False)

    def assertExit(self, run: subprocess.CompletedProcess, code: int) -> None:  # noqa: N802
        self.assertEqual(run.returncode, code, f"stdout:\n{run.stdout}\nstderr:\n{run.stderr}")


class TestABuildThatCouldNotFetchIsNotPublished(GuardCase):
    def test_an_edition_this_build_did_not_fetch_is_refused_by_id_and_reason(self) -> None:
        unfetched = mutopia_entry(self.tmp, self.tmp / "nothing-fetched")
        self.assertIsNone(unfetched.get("file"), "an edition with no files is a placeholder")
        run = self.guard([bundled("song.core.one"), unfetched])
        self.assertExit(run, 1)
        self.assertIn("deploy guard: not publishing — 1 item(s) this build could not fetch:", run.stdout)
        self.assertIn(f"{RAG} (the edition's .ly file was not fetched)", run.stdout)

    def test_a_fetched_file_that_is_not_the_pinned_one_is_refused_too(self) -> None:
        _, row = mutopia_table()
        ly = self.tmp / "tampered" / row["ly"]["path"]
        ly.parent.mkdir(parents=True)
        ly.write_bytes(b'\\header { title = "not the edition" }\n')
        mismatched = mutopia_entry(self.tmp, self.tmp / "tampered")
        self.assertIsNone(mismatched.get("file"))
        run = self.guard([mismatched])
        self.assertExit(run, 1)
        self.assertIn(f"{RAG} (PineappleRag.ly is not the pinned file (sha256 ", run.stdout)

    def test_every_unfetched_item_is_named_once(self) -> None:
        unfetched = mutopia_entry(self.tmp, self.tmp / "nothing-fetched")
        second = dict(copy.deepcopy(unfetched), id="song.ragtime.second.mutopia")
        run = self.guard([unfetched, bundled("song.core.one"), second])
        self.assertExit(run, 1)
        self.assertIn("2 item(s) this build could not fetch:", run.stdout)
        self.assertEqual(run.stdout.count(f"{RAG} ("), 1, run.stdout)
        self.assertEqual(run.stdout.count("song.ragtime.second.mutopia ("), 1, run.stdout)

    def test_a_catalogue_that_cannot_be_read_is_not_published(self) -> None:
        self.assertExit(self.guard(None), 2)
        run = self.guard(None, raw="{ not json")
        self.assertExit(run, 2)
        self.assertIn("deploy guard: not publishing", run.stdout)


class TestTheCataloguesOwnPlaceholdersPass(GuardCase):
    """Placeholders a healthy public build carries: the licence gate's, the committed import-only rows, the drills."""

    def test_licence_and_import_only_placeholders_are_published(self) -> None:
        import import_kern
        import import_musetrainer
        import import_pdmx

        _, pinned = mutopia_table()
        sources = self.tmp / "non-commercial"
        row = copy.deepcopy(pinned)
        for part, data in (("ly", b'\\header {\n  license = "Creative Commons Attribution-NonCommercial 4.0"\n}\n'),
                           ("midi", b"MThd")):
            path = sources / row[part]["path"]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            row[part]["sha256"] = hashlib.sha256(data).hexdigest()
        refused = mutopia_entry(self.tmp, sources, row)
        self.assertIsNone(refused.get("file"))
        self.assertIn("the edition states", refused["importHint"])
        static = [item for item in json.loads(STATIC.read_text(encoding="utf-8")) if not item.get("file")]
        self.assertTrue(any("import-only" in item.get("tags", []) for item in static), "the rock import rows")
        self.assertTrue(any(item["type"] == "drill" for item in static), "the runtime drills")
        catalog = [
            bundled("song.core.one"),
            refused,
            placeholder("song.ragtime.kern", import_kern.IMPORT_HINT.format(repo="joplin"), ["kern", "import-only"]),
            placeholder("song.mt.beautiful", import_musetrainer.IMPORT_HINT, ["musetrainer", "import-only"]),
            placeholder("song.pdmx.personal", import_pdmx.IMPORT_HINT.format(status="unknown"), ["personal-build"]),
            *static,
        ]
        run = self.guard(catalog)
        self.assertExit(run, 0)
        self.assertIn("holds no fetch placeholder", run.stdout)
        self.assertNotIn("not publishing", run.stdout)

    def test_an_empty_catalogue_is_published(self) -> None:
        run = self.guard([])
        self.assertExit(run, 0)
        self.assertIn("holds no fetch placeholder", run.stdout)


def build_job(text: str) -> str:
    """The `build` job's lines: everything indented under `  build:` up to the next job."""
    match = re.search(r"^  build:\n((?:(?: {4}.*|[ \t]*)\n)+)", text, re.MULTILINE)
    if match is None:
        raise AssertionError(f"{PAGES.name} has no `build` job")
    return match.group(1)


class TheDeployStep(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.text = PAGES.read_text(encoding="utf-8")
        cls.steps = read_steps(build_job(cls.text))

    def at(self, needle: str) -> int:
        """The index of the one build-job step whose `run` or `uses` contains `needle`."""
        hits = [
            i for i, step in enumerate(self.steps)
            if needle in step.get("run", "") or needle in step.get("uses", "")
        ]
        self.assertEqual(len(hits), 1, f"expected one step in {PAGES.name} running {needle!r}, found {len(hits)}")
        return hits[0]

    def assertBefore(self, first: str, then: str, why: str) -> None:  # noqa: N802
        a, b = self.at(first), self.at(then)
        self.assertLess(
            a, b,
            f"{self.steps[a].get('name', first)!r} (step {a + 1}) must run before "
            f"{self.steps[b].get('name', then)!r} (step {b + 1}): {why}",
        )

    def test_the_guard_runs_after_the_build_and_before_the_upload(self) -> None:
        self.assertBefore("npm run build", GUARD_RUN, "it reads the catalogue the build wrote")
        self.assertBefore(GUARD_RUN, "actions/configure-pages@", "a refused build configures nothing")
        self.assertBefore(GUARD_RUN, "actions/upload-pages-artifact@", "a refused build uploads nothing")

    def test_the_guard_reads_the_catalogue_the_upload_publishes(self) -> None:
        step = self.steps[self.at(GUARD_RUN)]
        self.assertNotIn("working-directory", step, "the guard's --dir and the upload's path are both from the root")
        guarded = re.search(r"--dir\s+(\S+)", step["run"])
        self.assertIsNotNone(guarded, f"{step.get('name')!r} names no --dir")
        upload = re.search(r"uses:\s*actions/upload-pages-artifact@\S+\n\s+with:\n\s+path:\s*(\S+)", self.text)
        self.assertIsNotNone(upload, f"{PAGES.name}'s upload names no path")
        self.assertEqual(guarded.group(1).rstrip("/"), f"{upload.group(1).rstrip('/')}/content",
                         "the guard reads the content directory inside what the upload publishes")

    def test_nothing_lets_the_guards_refusal_through(self) -> None:
        step = self.steps[self.at(GUARD_RUN)]
        self.assertNotIn("continue-on-error", step, "a refusal must fail the build job")
        self.assertNotIn("if", step, "the guard runs on every deploy")
        for needle in ("actions/configure-pages@", "actions/upload-pages-artifact@"):
            self.assertNotIn("if", self.steps[self.at(needle)], f"{needle} must not run after a failed step")

    def test_the_deploy_needs_the_build(self) -> None:
        # A pin (true before Q88): a failed build job is what keeps `deploy-pages` from running, so the previous
        # deployment stays live.
        self.assertRegex(self.text, re.compile(r"^  deploy:\n(?: {4}.*\n)*? {4}needs:\s*\[?\s*build\s*\]?\s*$",
                                               re.MULTILINE))


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
