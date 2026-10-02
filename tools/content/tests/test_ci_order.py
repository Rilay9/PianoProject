"""The CI workflow makes what a test reads before it runs the test (Q24, 2026-09-27).

A gate that skips is a gate that is open. `.github/workflows/ci.yml` ran the content tests
before `build.py`, so every test that reads the built catalogue, the curriculum or a fetched
edition skipped and passed there; the MIDI converter's harness was never run; the MIDI parity
test skipped for want of its reference. Those tests now fail when their input is missing, each
naming the step below that provides it, so the order of the steps is itself an invariant and
this file holds it.

Since T62 (2026-10-01) the workflow is a graph of jobs, each on a fresh runner: the content and
unit job, the browser shards, the shards' coverage check and the render-and-validate job. An
order inside one job is asserted inside that job; a dependency between jobs is asserted as the
graph that carries it — the later job `needs` the earlier one and restores, as an artifact of the
run, what the earlier one uploaded after the step that made it. A job after the first has nothing
but its own checkout, runtime and restored artifacts, so each one's setup is asserted too.

GitHub's runner cannot be run from here: this reads the workflow's text. Standard library
only, because the content requirements carry no YAML parser, so the jobs and their steps are read
by their indentation (single-line or `|` values, one level of nested map under a step).
"""
from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"

#: Step names the gated tests' failure messages cite. Renaming one here without the messages,
#: or the reverse, would send the reader of a red run to a step that does not exist; naming one in
#: two jobs would send them to two.
CITED = (
    "Build content",
    "Content pipeline tests",
    "MIDI converter harness",
    "Write the MIDI parity reference",
    "Unit tests",
    "Fetch the MAESTRO test recordings",
)

#: The jobs (T62).
CONTENT = "content-and-unit"
SHARDS = "e2e"
COVERAGE = "e2e-coverage"
RENDER = "render-and-validate"

#: What makes `playwright.config.ts` serve the restored app instead of rebuilding it.
PREBUILT = "PIANOPATH_PREBUILT_DIST"

KEY = re.compile(r"^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$")

#: The path-to-checks map (Q65) whose checks CI must be a superset of.
CHECKS_MAP = ROOT / "docs" / "prompts" / "checks.json"

#: The map's checks CI cannot run, each with its reason in the map. The state gallery compares
#: against reference pictures written locally and never committed.
NOT_IN_CI = ("states",)


def _width(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def _meaningful(lines: list[str]) -> list[str]:
    return [line for line in lines if line.strip() and not line.strip().startswith("#")]


def parse_steps(lines: list[str]) -> list[dict[str, str]]:
    """A `steps:` list's steps in file order, each as its keys (name, uses, run, if, ...), and the
    keys of a map one level under a step (`with:`, `env:`) as `with.name`, `env.CI`, ..."""
    steps: list[dict[str, str]] = []
    dash: int | None = None
    block: tuple[str, int] | None = None  # a `|` value being read: its key and its indent
    nested: str | None = None  # the step key whose map is being read (`with`, `env`)
    for line in _meaningful(lines):
        stripped = line.strip()
        width = _width(line)
        if dash is None:
            dash = width
        if width < dash:
            break
        if width == dash and stripped.startswith("- "):
            steps.append({})
            block, nested = None, None
            stripped, width = stripped[2:], dash + 2
        if block is not None and width > block[1]:
            key = block[0]
            steps[-1][key] = f"{steps[-1][key]}\n{stripped}".lstrip("\n")
            continue
        block = None
        match = KEY.match(stripped)
        if match is None:
            continue
        key, value = match.groups()
        if width == dash + 2:
            nested = None
        elif width == dash + 4 and nested is not None:
            key = f"{nested}.{key}"
        else:
            continue  # deeper than one nested map
        if value in ("|", "|-", ">", ">-"):
            steps[-1][key] = ""
            block = (key, width)
        elif value == "" and "." not in key:
            steps[-1][key] = ""
            nested = key
        else:
            steps[-1][key] = value
    return steps


def read_steps(text: str) -> list[dict[str, str]]:
    """The steps of the one `steps:` list in `text`, which is one job's lines: test_deploy_guard.py
    reads pages.yml's build job with it. A whole workflow of several jobs is `read_jobs`'s."""
    lines = text.splitlines()
    heads = [i for i, line in enumerate(lines) if line.strip() == "steps:"]
    if len(heads) != 1:
        raise AssertionError(f"expected one `steps:` list in one job's lines, found {len(heads)}")
    return parse_steps(lines[heads[0] + 1:])


def read_jobs(text: str) -> dict[str, dict]:
    """Every job in file order: its own keys (`name`, `needs`, `if`, ...), its nested blocks as raw
    text (`strategy`, `outputs`) and its steps."""
    lines = text.splitlines()
    heads = [i for i, line in enumerate(lines) if line.rstrip() == "jobs:"]
    if len(heads) != 1:
        raise AssertionError(f"expected one `jobs:` map in {WORKFLOW.name}, found {len(heads)}")
    body: list[str] = []
    for line in lines[heads[0] + 1:]:
        if line.strip() and not line.startswith(" ") and not line.startswith("#"):
            break
        body.append(line)
    jobs: dict[str, dict] = {}
    starts = [i for i, line in enumerate(body) if re.match(r"^  [A-Za-z0-9_-]+:\s*$", line)]
    for n, start in enumerate(starts):
        job_id = body[start].strip()[:-1]
        if job_id in jobs:
            raise AssertionError(f"job {job_id!r} appears twice in {WORKFLOW.name}")
        chunk = body[start + 1: starts[n + 1] if n + 1 < len(starts) else len(body)]
        keys: dict[str, str] = {}
        steps: list[dict[str, str]] | None = None
        for i, line in enumerate(chunk):
            if not line.strip() or line.strip().startswith("#") or _width(line) != 4:
                continue
            match = KEY.match(line.strip())
            if match is None:
                continue
            key, value = match.groups()
            if key == "steps":
                steps = parse_steps(chunk[i + 1:])
            elif value:
                keys[key] = value
            else:  # a nested block, kept as its raw lines
                inner = []
                for deeper in chunk[i + 1:]:
                    if deeper.strip() and not deeper.strip().startswith("#") and _width(deeper) <= 4:
                        break
                    inner.append(deeper)
                keys[key] = "\n".join(inner)
        if steps is None:
            raise AssertionError(f"job {job_id!r} in {WORKFLOW.name} has no `steps:` list")
        jobs[job_id] = {"keys": keys, "steps": steps}
    if not jobs:
        raise AssertionError(f"no job found under `jobs:` in {WORKFLOW.name}")
    return jobs


def needs_of(job: dict) -> list[str]:
    value = job["keys"].get("needs", "").strip()
    if value.startswith("["):
        return [part.strip() for part in value.strip("[]").split(",") if part.strip()]
    return [value] if value else []


def _runs(step: dict[str, str], needle: str) -> bool:
    return needle in step.get("run", "") or needle in step.get("uses", "")


def one_step_running(jobs: dict[str, dict], needle: str) -> tuple[str, int]:
    """The job and index of the one step in the whole graph whose `run` or `uses` holds `needle`."""
    hits = [(job_id, i) for job_id, job in jobs.items() for i, step in enumerate(job["steps"]) if _runs(step, needle)]
    if len(hits) != 1:
        where = ", ".join(f"{j}: {jobs[j]['steps'][i].get('name', '(unnamed)')!r}" for j, i in hits) or "none"
        raise AssertionError(f"expected one step in {WORKFLOW.name} running {needle!r}, found {len(hits)} ({where})")
    return hits[0]


def one_step_named(jobs: dict[str, dict], name: str) -> tuple[str, int]:
    """The job and index of the one step in the whole graph called `name`."""
    hits = [(job_id, i) for job_id, job in jobs.items() for i, step in enumerate(job["steps"]) if step.get("name") == name]
    if len(hits) != 1:
        where = ", ".join(job_id for job_id, _ in hits) or "no job"
        raise AssertionError(f"expected one step in {WORKFLOW.name} named {name!r}, found {len(hits)} (in {where})")
    return hits[0]


class TheWorkflowOrder(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.text = WORKFLOW.read_text(encoding="utf-8")
        cls.jobs = read_jobs(cls.text)

    def steps(self, job: str) -> list[dict[str, str]]:
        self.assertIn(job, self.jobs, f"{WORKFLOW.name} has no job {job!r}")
        return self.jobs[job]["steps"]

    def at(self, job: str, needle: str) -> int:
        """The index of the one step in `job` whose `run` or `uses` contains `needle`."""
        hits = [i for i, step in enumerate(self.steps(job)) if _runs(step, needle)]
        self.assertEqual(
            len(hits), 1,
            f"expected one step in {WORKFLOW.name}'s {job} job running {needle!r}, found {len(hits)}",
        )
        return hits[0]

    def where(self, job: str, **match: str) -> int:
        """The index of the one step in `job` whose keys hold every `match` value exactly."""
        hits = [
            i for i, step in enumerate(self.steps(job))
            if all(step.get(key.replace("__", ".")) == value for key, value in match.items())
        ]
        self.assertEqual(len(hits), 1, f"expected one step in {job} with {match}, found {len(hits)}")
        return hits[0]

    def assertBefore(self, job: str, first: str | int, then: str | int, why: str) -> None:  # noqa: N802
        a = first if isinstance(first, int) else self.at(job, first)
        b = then if isinstance(then, int) else self.at(job, then)
        steps = self.steps(job)
        self.assertLess(
            a, b,
            f"{job}: {steps[a].get('name', first)!r} (step {a + 1}) must run before "
            f"{steps[b].get('name', then)!r} (step {b + 1}): {why}",
        )

    def restores(self, job: str, artifact: str) -> int:
        """The index of `job`'s download of `artifact`, which `CONTENT` must upload."""
        return self.where(job, uses="actions/download-artifact@v4", with__name=artifact)

    # ---- inside the content and unit job: Q24's and Q47's orders, as they were ------------------

    def test_the_content_is_built_before_the_content_tests_read_it(self) -> None:
        self.assertBefore(
            CONTENT, "tools/content/build.py", "unittest discover -s tools/content/tests",
            "the content tests read the built catalogue, the curriculum and the fetched "
            "editions, and fail when they are missing",
        )

    def test_the_build_follows_what_it_needs(self) -> None:
        self.assertBefore(CONTENT, self.where(CONTENT, id="content-cache"), "tools/content/build.py",
                          "the conversion cache")
        self.assertBefore(
            CONTENT, "pip install -r tools/content/requirements.txt", "tools/content/build.py", "music21"
        )

    def test_the_converter_harness_runs(self) -> None:
        self.assertBefore(
            CONTENT,
            "pip install -r tools/content/requirements.txt",
            "unittest discover -s tools/midi-cleanup/tests",
            "the converter and its harness import music21",
        )

    def test_the_parity_reference_is_written_before_the_unit_tests_compare_against_it(self) -> None:
        self.assertBefore(
            CONTENT,
            "pip install -r tools/content/requirements.txt",
            "tools/midi-cleanup/tests/parity_reference.py",
            "the reference is the Python converter's answer",
        )
        self.assertBefore(
            CONTENT, "tools/midi-cleanup/tests/parity_reference.py", "npm run test",
            "midiParity.test.ts fails without build/midi-parity/",
        )

    def test_the_recordings_are_fetched_before_anything_reads_them(self) -> None:
        # Q47: the converter harness's real-recording class and parity_reference.py fail
        # under CI without the three MAESTRO performances, naming the fetch step; the cache
        # is restored before the fetch validates it, and saved only after a fetch passed.
        fetch = "tools/midi-cleanup/tests/fetch_maestro.py"
        restore = self.where(CONTENT, id="maestro")
        self.assertIn("actions/cache/restore@", self.steps(CONTENT)[restore].get("uses", ""))
        self.assertBefore(CONTENT, restore, fetch, "the fetch validates what was restored")
        self.assertBefore(CONTENT, fetch, "actions/cache/save@", "only a verified directory is cached")
        self.assertBefore(CONTENT, fetch, "unittest discover -s tools/midi-cleanup/tests",
                          "the real-recording class fails in CI without the recordings")
        self.assertBefore(CONTENT, fetch, "tools/midi-cleanup/tests/parity_reference.py",
                          "the reference writer fails in CI without the recordings")

    def test_the_unit_tests_run_after_the_content_build_they_read(self) -> None:
        self.assertBefore(CONTENT, "tools/content/build.py", "npm run test", "they read app/public/content")
        self.assertBefore(CONTENT, "npm ci", "npm run test", "vitest is an app dependency")

    # ---- across jobs: the render check after the build and every shard ---------------------------

    def test_the_render_check_and_the_second_validation_keep_their_places(self) -> None:
        # Not moved by Q24, and held here because the order is the point of both: the render
        # check loads the built app, and the second validation reads what `--apply` wrote. Since
        # T62 the build is in the content job and the render check in its own: the render job needs
        # the content job and every shard, and restores the app and the content the content job
        # uploaded after its build, then renders, then validates.
        render = self.at(RENDER, "render_check.py --apply")
        self.assertBefore(RENDER, render, "python3 tools/content/validate.py",
                          "the render check writes durations into the catalogue")
        self.assertEqual(sorted(needs_of(self.jobs[RENDER])), sorted([CONTENT, SHARDS]),
                         "the render job runs after the content job and after every shard")
        self.assertNotIn("if", self.jobs[RENDER]["keys"],
                         "an ordinary `needs`: no shard red, no render, as the one job skipped it")
        for artifact in ("app-dist", "content-and-render-state"):
            self.assertBefore(RENDER, self.restores(RENDER, artifact), render, f"it renders from {artifact}")
        self.assertBefore(RENDER, "tar -xf build/content-and-render-state.tar", render,
                          "the content and the manifest are unpacked where render_check.py reads them")

    def test_what_a_later_job_restores_was_uploaded_after_the_step_that_wrote_it(self) -> None:
        # The second read at 0d2c3472 (item 3): `npm run build` rebuilds the content through
        # `prebuild`, so the app the shards serve and the content the render check hashes are both
        # taken after it, and so are the same bytes.
        build = self.at(CONTENT, "npm run build")
        listed = [
            (step.get("with.name"), i) for i, step in enumerate(self.steps(CONTENT))
            if step.get("uses") == "actions/upload-artifact@v4"
        ]
        self.assertEqual(sorted(name for name, _ in listed),
                         sorted(["app-dist", "content-and-render-state", "content-build-cache"]),
                         "each artifact is uploaded once, by the content job")
        uploads = dict(listed)
        pack = self.at(CONTENT, "tar -cf build/content-and-render-state.tar")
        self.assertBefore(CONTENT, build, pack, "the content is packed after the last step that writes it")
        self.assertBefore(CONTENT, pack, uploads["content-and-render-state"], "the tar is uploaded once packed")
        self.assertBefore(CONTENT, build, uploads["app-dist"], "the app is uploaded once built")
        self.assertEqual(self.steps(CONTENT)[uploads["app-dist"]].get("with.path"), "app/dist")
        for job_id in (SHARDS, COVERAGE, RENDER):
            self.assertIn(CONTENT, needs_of(self.jobs[job_id]), f"{job_id} restores what {CONTENT} uploaded")
            for step in self.steps(job_id):
                if step.get("uses") == "actions/download-artifact@v4" and step.get("with.name"):
                    self.assertIn(step["with.name"], uploads, f"{job_id} restores an artifact no job uploads")

    def test_every_job_after_the_first_is_a_fresh_runner_with_its_own_tree(self) -> None:
        # The reviewer's correction 2 (responses/questions-53147902-correction-2.md): an artifact
        # holds the built app, not package.json, the configuration or the specs, so every later job
        # checks out the commit, sets up Node and installs the app's dependencies itself, and
        # restores the built bytes before the step that reads them.
        for job_id, reader in ((SHARDS, "npm run e2e"), (RENDER, "render_check.py --apply"),
                               (COVERAGE, "npx playwright test --list")):
            steps = self.steps(job_id)
            self.assertEqual(steps[0].get("uses"), "actions/checkout@v4", f"{job_id} checks out the commit first")
            read = self.at(job_id, reader)
            for setup in ("actions/setup-node@", "npm ci"):
                self.assertBefore(job_id, setup, read, f"{job_id} brings its own runtime")
            self.assertBefore(job_id, self.restores(job_id, "content-and-render-state"), read,
                              "the collection and the render check read app/public/content")
            self.assertBefore(job_id, "tar -xf build/content-and-render-state.tar", read,
                              "unpacked where they read it")
        for job_id, reader in ((SHARDS, "npm run e2e"), (RENDER, "render_check.py --apply")):
            self.assertBefore(job_id, self.restores(job_id, "app-dist"), self.at(job_id, reader),
                              f"{job_id} serves the built app")
            self.assertBefore(job_id, "npx playwright install --with-deps chromium", reader,
                              f"{job_id} runs Chromium on its own runner")
        # Python where a job's own steps need it: two specs run the content tools, and the second
        # validation reads every score with music21 (without it two checks skip).
        self.assertBefore(SHARDS, "pip install -r tools/content/requirements.txt", "npm run e2e",
                          "excerpts.spec.ts and microscope.spec.ts run the content tools")
        self.assertBefore(RENDER, "pip install -r tools/content/requirements.txt",
                          "python3 tools/content/validate.py", "validate.py needs music21")
        self.assertNotIn("npx playwright install", "\n".join(s.get("run", "") for s in self.steps(CONTENT)),
                         "the content job runs no browser since T62")

    def test_the_shards_run_the_whole_suite_once_and_keep_their_reports(self) -> None:
        shards = self.jobs[SHARDS]
        self.assertEqual(needs_of(shards), [CONTENT])
        strategy = shards["keys"].get("strategy", "")
        self.assertRegex(strategy, r"fail-fast:\s*false", "a red shard must not cancel the others' results")
        listed = re.search(r"shard:\s*\[([^\]]*)\]", strategy)
        total = re.search(r"total:\s*\[\s*(\d+)\s*\]", strategy)
        self.assertIsNotNone(listed, "the matrix names its shards")
        self.assertIsNotNone(total, "the matrix names one shard count")
        numbers = [int(n) for n in listed.group(1).split(",")]
        self.assertEqual(numbers, list(range(1, int(total.group(1)) + 1)), "shards 1..N, each once")
        run = self.at(SHARDS, "npm run e2e")
        step = self.steps(SHARDS)[run]
        self.assertEqual(step.get("run"), "npm run e2e -- --shard=${{ matrix.shard }}/${{ matrix.total }}")
        self.assertEqual(step.get(f"env.{PREBUILT}"), "'1'", "the shards serve the restored app")
        for artifact, path in (("e2e-blob-report", "app/blob-report"), ("e2e-test-results", "app/test-results")):
            upload = self.where(SHARDS, uses="actions/upload-artifact@v4",
                                with__name=f"{artifact}-${{{{ matrix.shard }}}}-of-${{{{ matrix.total }}}}")
            self.assertBefore(SHARDS, run, upload, "the report is written by the run")
            self.assertEqual(self.steps(SHARDS)[upload].get("if"), "always()", f"{artifact} survives a red shard")
            self.assertEqual(self.steps(SHARDS)[upload].get("with.path"), path)
        coverage = self.jobs[COVERAGE]
        self.assertEqual(sorted(needs_of(coverage)), sorted([CONTENT, SHARDS]))
        self.assertIn("!cancelled()", coverage["keys"].get("if", ""), "the coverage is read on a red shard too")
        self.assertBefore(COVERAGE, self.where(COVERAGE, uses="actions/download-artifact@v4",
                                               with__pattern="e2e-blob-report-*"),
                          "tools/ci/shard_coverage.py", "it reads every shard's blob report")
        self.assertBefore(COVERAGE, "npx playwright test --list --reporter=json", "tools/ci/shard_coverage.py",
                          "against the unsharded collection")

    def test_the_render_check_serves_the_app_only_where_it_matches_the_content(self) -> None:
        # The flag that skips the web server's rebuild is safe for the render check only while the
        # served copy of the content is the copy render_check.py hashes (the second read, item 3).
        render = self.at(RENDER, "render_check.py --apply")
        self.assertBefore(RENDER, "diff -r app/dist/content app/public/content", render,
                          "the served content is proven equal to the content it hashes first")
        self.assertEqual(self.steps(RENDER)[render].get(f"env.{PREBUILT}"), "'1'")

    def test_the_content_cache_is_saved_after_the_render_check_under_the_shared_key(self) -> None:
        # Restored in the content job and saved after the render check has added this run's
        # entries to the manifest; the key and the paths are the ones pages.yml restores, so a
        # change here would quietly cost the deploy its cache.
        restore = self.steps(CONTENT)[self.where(CONTENT, id="content-cache")]
        self.assertEqual(restore.get("uses"), "actions/cache/restore@v4",
                         "restore only: a post-job save here would hold the manifest from before the renders")
        pages = parse_steps_of(WORKFLOW.with_name("pages.yml").read_text(encoding="utf-8"))
        shared = next(s for s in pages if s.get("name") == "Restore content build cache")
        for key in ("with.key", "with.path"):
            self.assertEqual(restore.get(key), shared.get(key), f"{key} differs from pages.yml's")
        save = self.where(RENDER, uses="actions/cache/save@v4")
        step = self.steps(RENDER)[save]
        self.assertEqual(step.get("with.path"), restore.get("with.path"))
        self.assertEqual(step.get("with.key"), "${{ needs.content-and-unit.outputs.content-cache-key }}")
        self.assertIn("content-cache-key: ${{ steps.content-cache.outputs.cache-primary-key }}",
                      self.jobs[CONTENT]["keys"].get("outputs", ""))
        self.assertBefore(RENDER, "python3 tools/content/validate.py", save,
                          "saved only once the render check and the validation passed, as the post step was")
        self.assertBefore(RENDER, self.restores(RENDER, "content-build-cache"), save,
                          "the conversion cache comes from the content job")

    def test_failure_keeps_its_diagnostics_and_only_the_cache_save_may_fail_quietly(self) -> None:
        # The previews: written only by the render check, uploaded whatever happened, with: unchanged.
        previews = self.steps(RENDER)[self.where(RENDER, name="Upload content previews")]
        self.assertEqual(previews.get("if"), "always()")
        self.assertEqual(
            {k: v for k, v in previews.items() if k.startswith("with.")},
            {"with.name": "content-previews", "with.path": "build/previews",
             "with.if-no-files-found": "ignore", "with.retention-days": "7"},
        )
        quiet = [
            (job_id, step.get("name")) for job_id, job in self.jobs.items()
            for step in job["steps"] if step.get("continue-on-error") == "true"
        ]
        self.assertEqual(quiet, [(RENDER, "Restore the conversion cache for the cache save"),
                                 (RENDER, "Save the content build cache")],
                         "a check that cannot fail the run is a check that is not there")

    # ---- the whole file -------------------------------------------------------------------------

    def test_the_run_in_progress_completes_and_the_newest_tree_waits(self) -> None:
        # Revised 2026-09-29 (Q63, corrected by the outside reviewer the same night): the group
        # stays, so one run per branch runs at a time, and a newer push no longer cancels the run
        # in progress. GitHub keeps one pending run per group and replaces it with a newer one, so
        # the contract is: the run in progress completes, the newest code tree waits and runs
        # next, a superseded pending tree gets no conclusion of its own. Not "every push gets its
        # conclusion", and not `queue: max`. Docs-only pushes start no run (`paths-ignore`).
        # `concurrency` is a workflow key, so since T62 it still governs the whole run, every job.
        block = re.search(r"^concurrency:\n((?:[ \t]+.*\n)+)", self.text, re.MULTILINE)
        self.assertIsNotNone(block, f"{WORKFLOW.name} lost its `concurrency` block")
        self.assertRegex(block.group(1), r"group:\s*ci-\$\{\{\s*github\.ref\s*\}\}")
        self.assertRegex(block.group(1), r"cancel-in-progress:\s*false")
        for job_id, job in self.jobs.items():
            self.assertNotIn("concurrency", job["keys"], f"{job_id} must not narrow the run's group")

    def test_record_and_review_pushes_start_no_run_and_nothing_else_is_ignored(self) -> None:
        # Q63's first half, narrowed on the reviewer's correction: only the record and the review
        # stream are ignored; documentation that tests read stays under docs-integrity.yml; the
        # `pull_request` event is gone (its `branches` filter names the base, never this branch).
        on = re.search(r"^on:\n((?:[ \t]+.*\n)+)", self.text, re.MULTILINE)
        self.assertIsNotNone(on, f"{WORKFLOW.name} lost its `on` block")
        block = on.group(1)
        for path in ("docs/review/**", "docs/prompts/runs/**", "docs/prompts/pictures/**", "docs/prompts/entry-*.md", "docs/pending-review.md", "docs/prompts/in-flight.md"):
            self.assertIn(f"- '{path}'", block, f"{path} is record or reviewer churn and must start no run")
        self.assertNotIn("'docs/**'", block, "docs/** is too broad: the views and the maps are machine contracts")
        self.assertIsNone(re.search(r"^\s+pull_request:", block, re.MULTILINE), "the pull_request event never fired for the standing PR and was removed")
        docs = WORKFLOW.with_name("docs-integrity.yml").read_text(encoding="utf-8")
        self.assertIn("test_prompt_views", docs, "the views' freshness moved to docs-integrity.yml")
        # T58: the record's mirrors (the task index, in-flight) are generated and held to the record
        # blocks here: a record push starts no ci.yml run, so docs-integrity is its only check.
        self.assertIn("tools.content.tests.test_record_mirrors", docs, "the record's mirrors are checked on every push (T58)")
        self.assertIsNone(re.search(r"run:.*(playwright|vitest|build:app|render_check)", docs, re.IGNORECASE), "the docs workflow never runs the app's suites")

    def test_the_outside_builders_branches_are_checked_and_never_deployed(self) -> None:
        # 2026-10-01: the outside builder builds on its own `chatgpt/<lane>` branches. CI and the
        # docs check run there, so a build arrives with the runner's evidence; the run's group keys
        # on the ref (asserted above), so it never holds this branch's pending slot; and only this
        # branch deploys, since every push to it reaches the owner's phone.
        on = re.search(r"^on:\n((?:[ \t]+.*\n)+)", self.text, re.MULTILINE)
        self.assertIsNotNone(on, f"{WORKFLOW.name} lost its `on` block")
        self.assertRegex(on.group(1), r"branches:\s*\[claude/piano-teaching-app-bo19td, 'chatgpt/\*\*'\]")
        docs = WORKFLOW.with_name("docs-integrity.yml").read_text(encoding="utf-8")
        self.assertRegex(docs, r"branches:\s*\[claude/piano-teaching-app-bo19td, 'chatgpt/\*\*'\]")
        self.assertRegex(docs, r"group:\s*docs-\$\{\{\s*github\.ref\s*\}\}")
        pages = WORKFLOW.with_name("pages.yml").read_text(encoding="utf-8")
        self.assertNotIn("chatgpt", pages, "the outside builder's branches never deploy")
        self.assertRegex(pages, r"(?m)^\s+branches:\s*\[claude/piano-teaching-app-bo19td\]\s*$", "pages.yml deploys this branch alone")

    def test_the_steps_the_failure_messages_name_exist(self) -> None:
        # In every job, and each in exactly one: a red run's message names one step to open.
        for name in CITED:
            with self.subTest(step=name):
                one_step_named(self.jobs, name)

    def test_ci_runs_every_check_the_path_map_names(self) -> None:
        # Q65: docs/prompts/checks.json is the orchestrator's minimum for a landing; CI must run
        # a superset, so a check the map names has one step running it (the whole suite: `npm run
        # test`, `npm run e2e`, the content tests' discover), in whichever job. A check CI cannot
        # run says why and is pinned here, so a new exception is an edit to this file rather than
        # a quiet null.
        checks = json.loads(CHECKS_MAP.read_text(encoding="utf-8"))["checks"]
        for check in checks:
            if check.get("ci") is None:
                self.assertIn(check["id"], NOT_IN_CI, f"{check['id']}: the map names no CI step for it")
                self.assertTrue(check.get("not_in_ci", "").strip(), f"{check['id']}: say why CI cannot run it")
                continue
            with self.subTest(check=check["id"]):
                one_step_running(self.jobs, check["ci"])
        self.assertEqual(sorted(c["id"] for c in checks if c.get("ci") is None), sorted(NOT_IN_CI))


def parse_steps_of(text: str) -> list[dict[str, str]]:
    """Every step of every job in another workflow file, in file order."""
    return [step for job in read_jobs(text).values() for step in job["steps"]]


#: Two jobs claiming one cited step name and one check's command: what the whole-graph searches
#: must refuse (T62), since a red run would then point at two steps.
TWO_JOBS_ONE_NAME = """\
name: CI
jobs:
  first:
    runs-on: ubuntu-latest
    steps:
      - name: Unit tests
        working-directory: app
        run: npm run test
  second:
    needs: first
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Unit tests
        run: npm run test -- --shard=1/2
        env:
          CI: 'true'
"""


class TheGraphReader(unittest.TestCase):
    def test_two_jobs_with_one_cited_name_are_refused_naming_both(self) -> None:
        jobs = read_jobs(TWO_JOBS_ONE_NAME)
        with self.assertRaises(AssertionError) as raised:
            one_step_named(jobs, "Unit tests")
        self.assertIn("named 'Unit tests', found 2 (in first, second)", str(raised.exception))

    def test_two_jobs_running_one_check_are_refused_naming_both(self) -> None:
        jobs = read_jobs(TWO_JOBS_ONE_NAME)
        with self.assertRaises(AssertionError) as raised:
            one_step_running(jobs, "npm run test")
        self.assertIn("found 2 (first: 'Unit tests', second: 'Unit tests')", str(raised.exception))

    def test_the_reader_keeps_each_job_s_keys_steps_and_nested_maps(self) -> None:
        jobs = read_jobs(TWO_JOBS_ONE_NAME)
        self.assertEqual(list(jobs), ["first", "second"])
        self.assertEqual(needs_of(jobs["second"]), ["first"])
        self.assertEqual(jobs["second"]["steps"][1], {"name": "Unit tests", "run": "npm run test -- --shard=1/2", "env": "", "env.CI": "'true'"})
        self.assertEqual(jobs["first"]["steps"][0].get("working-directory"), "app")


if __name__ == "__main__":
    unittest.main()
