### Entry 201 — T62: CI's browser tests run as parallel shards

**Judgement.** Nothing a learner meets changed: this lane is CI and its test tooling only; no screen, score or sentence was touched. What a reviewer reading a run gets once the graph lands, as built and proven locally, with the runner's own proof still owed by the two proof pushes:

- **The Actions UI shows a graph, not one job:** `Content and unit tests` → eight `E2E shard i/8` jobs side by side → `E2E test-id coverage` and `Render check and validate` after them. A red shard is visible by number, and the others still run to the end (`fail-fast: false`).
- **When the browser verdict arrives (a projection from run 36807990772's own step times, not a measurement).** Today the one E2E step runs from 29.6 to 71.2 minutes into the job. In the graph, the shards start after the content job's tests, its app build and its uploads, so the *first* browser result comes a few minutes later than today's first one. The slowest of the eight shards carries 24% of the baseline's per-test time, against 42% at four shards. So the *whole* browser verdict should come about a quarter of the old E2E step after the shards start, plus each shard's setup. In the baseline's timings that setup is roughly 71 s (checkout, Node, pip, `npm ci`, Chromium), plus artifact downloads the baseline cannot measure. The proof runs measure the real figure.
- **What the coverage check prints on a healthy run:** one line per shard (`shard i/8: given k tests; final results: passed …, skipped …; retried r`), a totals line, then `OK: each of the 896 tests in the collection was given to exactly one shard and reported a result there`. 896 is the count at 0d2c3472 on the main checkout's content. On a fault it prints `FAIL` and names every test id, with file, line and title path, that no shard was given, that two shards were given, or that a shard was given but never reported.

**Done**

- **The job graph** (`.github/workflows/ci.yml`; `on:`, `paths-ignore` and the `concurrency` block are byte-identical to 0d2c3472):
  - **`content-and-unit`**
    - Steps: the one job's steps up to "Unit tests", in their order, minus Chromium, then "Build" (`npm run build`, unchanged), "Pack the content and render state" (a tar of `app/public/content` plus `build/render-manifest.json` when present), and three uploads.
    - `app-dist`: `app/dist`, hidden files kept.
    - `content-and-render-state`: the tar.
    - `content-build-cache`: `build/cache`, only when the content cache missed.
    - The content cache is now `actions/cache/restore@v4`: same key, same paths. Its outputs give the hit and the key to the render job.
  - **`e2e`**
    - A matrix, shard `[1..8]`, total `[8]`, `fail-fast: false`, `needs: content-and-unit`.
    - Steps: checkout, Node, Python 3.11 with the content requirements (excerpts.spec and microscope.spec run the content tools), `npm ci`, restore `app-dist` into `app/dist`, restore and unpack the content tar, install Chromium, then `npm run e2e -- --shard=${{ matrix.shard }}/${{ matrix.total }}` with `PIANOPATH_PREBUILT_DIST: '1'`.
    - Two uploads, `if: always()`: `e2e-blob-report-i-of-8` (`app/blob-report`) and `e2e-test-results-i-of-8` (`app/test-results`).
  - **`e2e-coverage`**
    - `needs: [content-and-unit, e2e]`, `if: ${{ !cancelled() && needs.content-and-unit.result == 'success' }}`.
    - Steps: checkout, Node, Python, `npm ci`, the content tar (the collection reads the catalogue), every `e2e-blob-report-*` artifact, the unsharded `npx playwright test --list --reporter=json` (written to a file through `PLAYWRIGHT_JSON_OUTPUT_FILE`), then `python3 tools/ci/shard_coverage.py`.
  - **`render-and-validate`**
    - `needs: [content-and-unit, e2e]` and no `if:`.
    - Steps: checkout, Node, Python and the content requirements (`validate.py` needs music21), `npm ci`, restore `app-dist` and the content tar, `diff -r app/dist/content app/public/content`, Chromium, "Render every catalog item" (with the flag), "Validate again".
    - The content cache's save comes after these. When the content job missed, it downloads `content-build-cache` and runs `actions/cache/save@v4` with the content job's primary key and the identical two paths. Both steps carry `continue-on-error: true`, because the old post-step save only warned. Then "Upload content previews", `with:` unchanged, `if: always()`.
- **N = 8, by measurement** (`captures-shard-balance.txt`).
  - Method: the real collection, 896 tests at 0d2c3472, listed with `--list --shard=i/N` for N = 2, 3, 4, 5, 6, 8. Every N partitions it with 0 duplicated, 0 missing and 0 extra. Each test is weighted by its own duration in the baseline's E2E log.
  - Playwright 1.63 gives each shard an equal *count* of tests in collection order. The slow specs sit at the end of the alphabet (`score.window-rule`, `sweeps`, `wide`), so the last shard is always the heaviest.
  - Largest shard's share of the test time: N=3 0.511, N=4 0.422, N=6 0.358, N=8 0.241. A simulation of the same split gives 0.22 at N=10 and 0.206 at N=12, while each extra shard adds its own setup and runner.
  - The only knob for a duration-weighted split is the internal `PWTEST_SHARD_WEIGHTS` environment variable (`lib/runner/index.js` `filterForShard`). It is not in the CLI or the types, and it is not used.
- **`playwright.config.ts`, the three lines** (`captures-config-proof.txt`, read through Playwright's own loader under five environments, with HEAD's file read the same way):
  - `reporter: process.env.CI ? [['github'], ['list'], ['blob']] : 'list'`
  - `trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure'`
  - `command: process.env.CI && process.env.PIANOPATH_PREBUILT_DIST === '1' ? 'npm run preview' : 'npm run build:app && npm run preview'`
  - With the flag unset, the resolved command equals HEAD's literal byte for byte, with CI set or not. It also equals it with the flag set but CI unset, and with `PIANOPATH_PREBUILT_DIST=true`.
  - `baseURL`, `forbidOnly`, `fullyParallel`, `retries`, `storageState`, `workers` and the test count equal HEAD's in every environment.
  - With the flag set and no `dist`, `vite preview` fails and Playwright stops: `The directory "dist" does not exist` (`captures-missing-dist.txt`). It does not rebuild.
- **The shard step keeps `npm run e2e`.** `checks.json`'s e2e check is `"ci": "npm run e2e"`, and `test_ci_order.py` asserts that one step of the graph contains it. A bare `playwright test` here would break that map assertion.
- **The render job serves the restored app** (`captures-render-either-way.txt`).
  - After a fresh `npm run build:app`, `diff -r app/dist/content app/public/content` exits 0 (2157 files each side).
  - The render spec, given render_check.py's environment, ran on the first 40 catalogue items with the manifest ignored, on port 4262. One run served the prebuilt `dist` (flag set; the log shows only `npx vite preview`); the other rebuilt it (no flag; `npm run build:app && npx vite preview`).
  - Result: every report field except the timing `renderMs` is equal on all 40 items, the 40 preview PNGs are byte-identical, and the manifests are equal except `renderMs`.
  - Scope: 40 items of the catalogue, not the whole of it. CI's `diff -r` step is what holds the invariant on every run.
- **Test-level coverage** (`tools/ci/shard_coverage.py`, a script, not an inline step; `captures-coverage-on-real-blobs.txt`, `captures-run-test_shard_coverage.txt`).
  - It reads Playwright's own blob reports: `onBlobReportMetadata` for the shard, `onProject` for the tests the shard was given, `onTestEnd` for each attempt. It compares them with the unsharded listing's `id`s.
  - Real Playwright 1.63 blobs, passing:
    - a browserless 9-test suite, where `a.spec.ts` gave tests to two shards and one test failed once and passed on its retry;
    - a real 9-test slice of the default suite, in three browser shards on port 4262 serving the prebuilt app.
  - Real blobs, failing:
    - mis-sharded 1/2 with 2/3 named two duplicated and three dropped tests by id, file, line and title;
    - mis-sharded 1/2 with 3/3 named the dropped `app-shell.spec.ts:57 › app shell › theme preference persists across reload`.
  - Eleven fixture cases pass or fail as named.
  - On a red real run, the coverage held, and shard 1's blob carried the retry's trace and error context as attachments.
- **`test_ci_order.py`, rewritten job-aware: 20 tests, green** (`captures-run-test_ci_order.txt`).
  - Old against new: 0d2c3472's file against the new graph errors in `setUpClass`, `AssertionError: expected one `steps:` list in ci.yml, found 4`.
  - New against old: the new file against the old single-job workflow gives 12 failures and 1 error.
  - 25 single-fault mutants of the new workflow are each red, with no survivor (`captures-ci-order-reds.txt`, `scripts-mutants.py`).
  - Same job (`content-and-unit`), the same facts as before: the content built before the content tests; the build after the cache and pip; the converter harness after pip; the parity reference after pip and before the unit tests; the MAESTRO restore (now found by `id: maestro`, because two cache restores share the job), then fetch, then save, before the harness and the reference; the unit tests after the content build and `npm ci`.
  - Became cross-job, `test_the_render_check_and_the_second_validation_keep_their_places`:
    - render before validate is still same-job;
    - "build before render" is now the graph: the render job needs content and e2e, has no `if:`, and restores both artifacts and unpacks before rendering.
  - Workflow-level, unchanged: concurrency, now also "no job narrows the group"; paths-ignore.
  - Whole-graph: the six cited names and every mapped check each match exactly one step.
  - New, Decision 6 and the fresh-runner extension:
    - `test_what_a_later_job_restores_was_uploaded_after_the_step_that_wrote_it`: each artifact uploaded once, after `npm run build`, and only names the content job uploads are downloaded;
    - `test_every_job_after_the_first_is_a_fresh_runner_with_its_own_tree`: checkout first, Node, `npm ci`, the restores before the reading step, Chromium where a browser runs, pip where a step needs it, no Chromium in the content job;
    - `test_the_shards_run_the_whole_suite_once_and_keep_their_reports`;
    - `test_the_render_check_serves_the_app_only_where_it_matches_the_content`;
    - `test_the_content_cache_is_saved_after_the_render_check_under_the_shared_key`: key and paths compared with `pages.yml`'s;
    - `test_failure_keeps_its_diagnostics_and_only_the_cache_save_may_fail_quietly`.
  - `TheGraphReader` holds the loud failure. Two jobs claiming one cited name, or one check's command, are refused naming both jobs.
  - `read_steps` (one job's steps) is kept: `test_deploy_guard.py` imports it to read `pages.yml`'s build job, and it passes (`captures-run-consumers.txt`).
- **Previews** (Decision 5). `build/previews` has one producer in CI: `content-render.spec.ts`, through `render_check.py`, called in the test body, which is skipped in the shards. The previews upload stays `if: always()` in the render job. So a red shard skips that job and leaves no previews, as today, where an E2E failure also found nothing to upload. A render or validate failure still uploads what the render wrote, and a clean run uploads them as before. The reviewer's premise that the content job produces previews does not hold: it produces none.
- **The proof route** (Decision 7): a push trigger on a disposable branch, not `workflow_dispatch`. `workflow_dispatch` is not in the final diff, because there is no independent reason for it.
  - The proof-only change is `build/t62/proof-trigger.patch` in the worktree: `branches: [claude/piano-teaching-app-bo19td, proof/t62-ci-shards]`.
  - The branch's runs fall in the group `ci-refs/heads/proof/t62-ci-shards`, so they cannot take the working branch's pending slot.
  - `pages.yml` and `docs-integrity.yml` trigger on the working branch only.
  - The second push adds `build/t62/proof-failing-shard.patch`: a new spec, never landing, that fails on both attempts. On the local listing it lands in shard 8/8.
- **`docs/08-test-map.md`**: the CI paragraph rewritten for the graph; the `test_ci_order.py` line extended; a `test_shard_coverage.py` line added.
- **Exit codes**: `test_ci_order` 0, `test_shard_coverage` 0, `test_deploy_guard` 0, `test_checks_for_paths` 0, `npx tsc -b` 0, `npm run lint` 0 (`captures-exits.txt`).

**Not done, each with its reason**

- **What only the runner proofs can show**, the orchestrator's two pushes:
  - per-job timings beside the 76m6s baseline;
  - the coverage check's output on both runs;
  - the second push waiting, not cancelling, while the first is `in_progress`;
  - the failed shard turning the run `failure`, with its report and trace present and the render job skipped;
  - `content-previews` present on the clean run;
  - the content cache saved by the render job on a miss;
  - `score.sheet-rows.spec.ts`'s duration and retry on both runs.
  None of these exists before a runner runs the graph.
- **`score.sheet-rows.spec.ts`: not repaired**, because the brief makes the repair conditional on the proof runs.
  - On the baseline run, its test `no control in the sheet is split across lines` took 25.9 s of the default 30 s.
  - Mechanism, read at the code: twelve full Score-screen loads (six widths at two text sizes) inside one test under the default per-test budget. Its inner `toBeVisible({ timeout: 60_000 })` can never be reached inside 30 s.
  - The per-runner load in a shard is today's (two workers on one runner), so it is expected to stay at the edge.
  - If the proof runs confirm it, the repair is that one test's own budget, scaled to its twelve loads (`test.setTimeout(…)` or `test.slow()`), never a global raise.
- **A YAML loader's parse of the edited workflow: not done.** None exists on this machine: no `yaml` Python module, no `yaml` or `js-yaml` in `app/node_modules`, no Perl `YAML`, no `actionlint`. Installing one is a download this lane did not take. What was done instead: `read_jobs` read every job, step and `with:`/`env:` key in the shapes asserted, and `git apply --check` accepted both proof patches. GitHub refuses an invalid workflow on the first proof push.
- **No Chromium cache added.** The brief's "the existing `actions/cache`" does not exist in `ci.yml`. Each browser job runs today's install step, 35 s and 29 s on the two measured runs, and OS dependencies are installed even on a cache hit.

**Deviations, each with the line that forced it**

1. **A fourth job, `e2e-coverage`.** "The test-id coverage check's actual output on both runs" (Verification layers), and one of those runs has a red shard, which skips the render job under its ordinary `needs`.
2. **The shards restore `app/public/content` and install the content requirements**, beyond `app/dist`.
   - Six specs read `public/content/*.json` from disk (first-day, offline, perf, placement-branches, side-panel-prose, sweeps), and two of them (placement-branches, side-panel-prose) build tests from the catalogue at collection time. Without the content, the listing fails with ENOENT.
   - excerpts.spec and microscope.spec run `tools/content/*.py`.
   - Correction 2's list ("the checkout supplies test/config/source files; the artifact supplies the exact built app bytes") omits both.
3. **The content job builds with `npm run build`, as the old "Build" step did**, not `build:app`. The second read's item 3 requires both artifacts after the last content writer, and dropping the step would drop a check. As a result, the shards serve the `npm run build` output, the same bytes the render check renders, where the old E2E served `build:app`'s build of the first content build. Inferred, not measured: a fetch that fails only in `prebuild` would now reach the browser tests too.
4. **`.gitignore` gains `app/blob-report/`.** Decision 3c's blob reporter writes there under any local `CI=1` run.
5. **The content was copied for the collection listing, not only for the web-server read** (the brief's harness line). The collection itself reads the catalogue.
6. **Premise counts:**
   - `test_ci_order.py` held eleven tests, not nine;
   - `test_deploy_guard.py` imports its `read_steps`, so that function stays.

**Follow-ups and questions**

- **The proof commits carry the code only:** `ci.yml`, `playwright.config.ts`, the two test files, `tools/ci/`, `.gitignore`. With this folder's `ENTRY.md` present and no landing event in T62's record block, `record_mirrors.py --check` exits 2 ("stale-record … shows it landed"). `test_record_mirrors` runs in the content job's tests, so a proof run carrying this folder would go red before any browser test. The steps are in `build/t62/proof-commands.txt` in the worktree.

- **checks.json** (a question for the orchestrator; the map is not this lane's): `tools/ci/shard_coverage.py` matches no pattern, so the landing prints it as unmatched and takes the full suites. A row would read `tools/ci/**` → `content-tests: [test_shard_coverage.py, test_ci_order.py]`. `.gitignore` is unmatched too.
- **`tools/docs/evidence_manifest.py`** lists `ci.yml` runs without `--branch`. While the proof branch exists, a seam's CI line can name a proof run, since that branch's head descends from the working branch.
- **Observation:** `docs/08-test-map.md`:730 cites `ci.yml:86` for `npm run e2e`, which was already stale at 0d2c3472, where the line is 182.
- **For the reviewer, carried from the brief:** under `on-first-retry`, a test that fails and then passes keeps the passing attempt's trace. Playwright 1.63 also offers `retain-on-first-failure` and `retain-on-failure-and-retries`. Changing it is one line.
