### Entry 151 — Q88 — the Pages deploy does not publish a public build that could not fetch what a healthy one bundles: a step *Guard the deploy* between the build and the upload runs `tools/content/deploy_guard.py`, which asks `validate.unfetched_placeholders` of the catalogue the artifact publishes and fails the build job naming each item and reason; licence and import-only placeholders pass; the validator is untouched (the reviewer's Q86 ruling; 2026-09-29)

**Judgement.** Nothing was looked at on a screen and nothing was heard: this seam decides whether a build reaches the phone, not what a screen shows. What changes for the learner: during a Mutopia outage the phone keeps its last complete build (with *Pine Apple Rag (repeats written out)* bundled and ragtime.8's stride bass kept by it) instead of receiving one where the rag is "import your own copy". The two logs below are the guard as the Pages step runs it, on two strict builds made here the way the Pages job makes its content (`PIANOPATH_STRICT_LICENSE=1`), offline, one with Mutopia's two files moved aside (Q80's unfetch path). On the runner the path would read `app/dist/content/catalog.json`; the rest is the guard's own text.

- **The build that could not fetch the rag** (`build-strict-unfetched.txt`: `[MUTO] imported 0 score(s), 1 placeholder(s)` and **`content validation OK`, exit 0**; this is the build HEAD's `pages.yml` would have uploaded, since it had no step between the build and `upload-pages-artifact`). The guard, `guard-strict-unfetched.txt`, **exit 1**:

  ```
  deploy guard: not publishing — 1 item(s) this build could not fetch:
    song.ragtime.joplin-pine-apple-rag.mutopia (the edition's .ly file was not fetched)
  ```

- **The full strict build** (`build-strict-full.txt`: `[MUTO] imported 1 score(s), 0 placeholder(s)`, validation OK, exit 0). The guard, `guard-strict-full.txt`, **exit 0**:

  ```
  deploy guard: publishing — build\q88-strict\content\catalog.json holds no fetch placeholder (2091 catalogue items)
  ```

  On that catalogue 306 rows have no file and none is read as the build's fetch (`placeholders-strict-full.txt`): the 227 licence placeholders (154 "composition is unknown", 46 CC BY-NC-SA, 21 "in-copyright", 6 "still in copyright"), the 7 rock import rows, the Op. 25 no. 7 étude and the 71 runtime drills, Q80's count reproduced. The unfetched build has the same 306 plus the rag (`placeholders-strict-unfetched.txt`).
- **What a runner would do with exit 1** is read from the workflow, not observed: the step has no `continue-on-error` and no `if`, so the `build` job fails; `configure-pages` and `upload-pages-artifact` after it do not run; `deploy` has `needs: build`, so `deploy-pages` does not run and the previous deployment stays live. **The runner is unverified** until a Pages run with a failed fetch is read.
- **The trade, stated once.** While a fetch keeps failing (Mutopia down for days, or a pinned file republished so the sha256 no longer matches) every push's Pages run is refused, including one that carries an unrelated fix. The ways out are a run that fetches, a re-pin of `content/sources/mutopia.json`, or a deliberate removal of the row, which the catalogue and the ladder report judge. That is the ruling's rule ("must not replace the last successful artifact"), not a choice made here; the step log names the item and the reason, so the cause is findable.

**The mechanism.** The fault the ruling names is a decision made in the wrong place: after Q80 the validator (rightly) passes a build whose only difference is a fetch, and nothing between the build and the upload asked whether the artifact is complete. The guard adds that question at the one place it belongs, and reads the structured fact rather than log text: `validate.unfetched_placeholders` (imported, not copied) returns each placeholder whose `importHint` carries one of `UNFETCHED_REASONS`, with the reason as the step wrote it. The discriminating test is the pair of real builds above: the same strict build with and without the rag's files, everything else equal, gives exit 1 naming the rag and exit 0. The unit cases build the placeholders through `import_mutopia.build_entry` itself, so a change to the step's wording that `UNFETCHED_REASONS` does not follow turns them red.

## Done

1. **Item 1, the guard reads the structured fact.** `tools/content/deploy_guard.py --dir <content dir>` loads `catalog.json` and calls `validate.unfetched_placeholders`. Rows: exit 1, `deploy guard: not publishing — <n> item(s) this build could not fetch:` and one line per item, `  <id> (<reason>)` (Q80's warning's shape). None: exit 0, one line saying the catalogue holds no fetch placeholder. Nothing is grepped from warning text. One addition the brief does not name, with the reason: a catalogue that is missing, is not JSON or is not a list exits 2 with `deploy guard: not publishing — …`, because a guard that cannot read its input and passes is open; without it a missing file would have exited 1 with a traceback, indistinguishable by code from a refusal. `--dir` defaults to `app/public/content`, as the validator's does.
2. **Item 2, what passes.** Everything whose `importHint` carries no fetch reason: observed on the real strict catalogue (306 rows, above) and on constructed ones (Mutopia's own licence refusal through `build_entry`, the kern, MuseTrainer and PDMX licence hints from their modules, every row without a file in `content/catalog.static.json`: the rock import rows and the drills). A deliberate removal is not read.
3. **Item 3, the step.** `pages.yml`, one step *Guard the deploy* after the build step and before `actions/configure-pages`: `run: python3 tools/content/deploy_guard.py --dir app/dist/content`, from the root, with a comment saying why. **`--dir app/dist/content`, not `app/public/content`**, my choice: it is the catalogue inside what `upload-pages-artifact` publishes (`path: app/dist`; vite copies `app/public/content` there, no `publicDir` override in `vite.config.ts`), so the guard judges the published bytes; the two are copies today. No `continue-on-error`, no retry, the build step and `ci.yml` untouched.
4. **Item 4, red first, unit.** `tools/content/tests/test_deploy_guard.py`, 10 cases in 3 classes, the guard run as a process as the step runs it:
   - `TestABuildThatCouldNotFetchIsNotPublished` (4): the unfetched edition (exit 1, id and reason); a fetched file that is not the pinned one (exit 1); two unfetched items each named once; an unreadable catalogue (exit 2);
   - `TestTheCataloguesOwnPlaceholdersPass` (2): licence and import-only placeholders with a bundled row (exit 0); an empty catalogue (exit 0);
   - `TheDeployStep` (4), reading `pages.yml`'s build job with `test_ci_order.read_steps` (imported; `read_steps` takes one `steps:` list, and `pages.yml` has two jobs, so the test hands it the build job's lines): the guard after `npm run build` and before `configure-pages` and the upload; its `--dir` is the upload's `path` plus `/content`, with no `working-directory`; no `continue-on-error` or `if` on the guard, no `if` on configure or upload; the deploy job `needs: build` (a pin, green before).
   - The step's place is pinned in this file, not in `test_ci_order.py` (the brief allowed either): that file is CI's, and one file holds the seam.
5. **Item 5, observed here.** The two strict builds and the two guard logs above, in the run folder. The runner is unverified.
6. **Item 6 held.** `validate.py`, the import steps, `build.py`, `difficulty.py`, `ci.yml`, `content/` and `app/src/**` untouched. No manifest: the catalogue's placeholder reasons are the structured fact today (Follow-up 2 says the one case they cannot see).

Technical verdict: done, runner unverified. Pedagogical verdict: not applicable; the learner-facing effect is which build the phone keeps, stated in the judgement and inferred from the workflow.

## Not done

- **The runner.** No Pages run with a failed fetch has been read; the step's effect on the job is read from the workflow. The orchestrator's, after the reviewer's post-build gate.
- **`docs/03`, `docs/08`, `docs/prompts/checks.json`, the backlog** are not edited (not this seam's files); the rows are under Doc rows. The map's `pages.yml` row still says no test opens the workflow, which is no longer true.

## Follow-ups

1. **A persistent fetch failure blocks every deploy (P3, the ruling's trade, recorded).** The judgement's last bullet. If that ever bites, the candidates are a re-pin or a deliberate removal of the row, both catalogue decisions; nothing here overrides the guard.
2. **The guard sees only rows that exist (P3, scoped).** A step that drops a missing file instead of placeholding it (kern and MuseTrainer today, `report.missing`) leaves no row to read. In Q80's observed case (`kern/joplin` moved aside) validation failed first on 22 cross-references and the stale report, so the build job fails before the guard; whether every such drop fails validation was not examined here. Q82 makes those drops placeholders with a fetch reason in `UNFETCHED_REASONS`, and the guard refuses them the day it lands with no change here. A fetch manifest would be the other way to close it; not needed once Q82 lands.
3. **The refusal is in the step log only (P3).** A red Pages run is what the owner sees; the reason is one click down. A GitHub `::error::` annotation line would put it on the run's summary page; not added, since the brief names the log.

## Questions

None.

## Files

- **New:** `tools/content/deploy_guard.py`; `tools/content/tests/test_deploy_guard.py`.
- **Changed:** `.github/workflows/pages.yml`, the one step *Guard the deploy* (its comment and its `run`) between the build and `configure-pages`.
- **Copied into the worktree for the record:** `docs/prompts/tasks/Q88-deploy-guard.md`, `docs/review/responses/2d9e7e2c.md`, from the main checkout, unchanged.
- **Consumers.** `pages.yml` and `ci.yml` key their content cache on `hashFiles('tools/content/*.py', …)`, so the new module changes the key once; `restore-keys: content-` restores the newest entry and CI saves a new one, and the cache changes no output (`docs/03` §3a). The map's `pages.yml` row (Doc rows). Q82's `UNFETCHED_REASONS` extension reaches the guard with no change here.
- **Not to commit (restored):** the builds rewrote `content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md`; all three copied back from the snapshot taken before the first build, and `git status` shows only this seam's paths (`restore.txt`, `restore2.txt`, `status-final.txt`).
- **Copied read-only from the main checkout** (`copy.txt`, robocopy 1 = copied, each): `build/cache` (with `build/cache/mutopia`), `build/midi-real`, the three `build/*-cache.json` (again before each build), `content/scores/imported/kern`, `musetrainer` and `mutopia`, without `.git`. The worktree's own `mutopia/published` moved aside under its `build/q88-aside/` and back (`chain.txt`); the main checkout's copies were not touched.
- **Captures:** `docs/prompts/runs/Q88/`: this entry, every log named here, and the scripts `scripts-chain.ps1`, `scripts-chain2.ps1`, `scripts-run-build.ps1`, `scripts-guard.sh`, `scripts-placeholders.py`, `scripts-mutants.py`.

## The red lines

`red-test_deploy_guard.txt`: the new file before `deploy_guard.py` existed and before the step, exit 1, 9 of 10 red.

- The five guard cases that expect an exit: `AssertionError: 2 != 1` (three) and `2 != 0` (two), stderr `can't open file '…\tools\content\deploy_guard.py': [Errno 2] No such file or directory`.
- `test_a_catalogue_that_cannot_be_read_is_not_published`: `AssertionError: 'deploy guard: not publishing' not found in ''`. Its exit-2 half was green by coincidence (Python exits 2 for a script it cannot open); the red is the message.
- The three step cases: `AssertionError: 0 != 1 : expected one step in pages.yml running 'tools/content/deploy_guard.py', found 0`.
- Green before and after, by design: `test_the_deploy_needs_the_build`.

`mutants.txt`: six mutants of the workflow, written under `build/q88-mutants/` with the test class pointed at them (the workflow itself never edited), each red: the guard after the upload; `continue-on-error: true` on it; `--dir app/public/content`; `if: always()` on the upload; the step removed; `needs: build` removed.

The builds' before: the unfetched strict build validates OK (exit 0), which HEAD's `pages.yml` would have uploaded.

## Tests

| Step | Exit | Note |
| --- | --- | --- |
| copies (`copy.txt`) · `parity_reference.py` (`parity.txt`) · `npm ci` (`npm-ci.txt`) | 1 each (robocopy: copied) · 0 · 0 | the fresh-worktree steps |
| red `test_deploy_guard` (`red-test_deploy_guard.txt`) | 1 | 9 of 10 red |
| green `test_deploy_guard` + `test_ci_order` (`green-targeted.txt`) | 0 | 21 |
| workflow mutants (`mutants.txt`) | 0 | 6 of 6 red |
| the new file under CI's discovery, `-t tools/content -p test_deploy_guard.py` (`discover-test_deploy_guard.txt`) | 0 | 10: its `tests.test_ci_order` import resolves as CI runs the suite |
| strict build, every file, absolute out (`build-strict-full.txt`) · the guard on it (`guard-strict-full.txt`) | 0 · 0 | `[MUTO]` 1 imported; 306 rows without a file, 0 read as fetch |
| strict build, Mutopia's files aside (`build-strict-unfetched.txt`) · the guard on it (`guard-strict-unfetched.txt`) | 0 · 1 | validation OK; the guard names the rag and its reason |
| placeholders grouped (`placeholders-strict-full.txt`, `placeholders-strict-unfetched.txt`) | 0 · 0 | only the rag, on the unfetched build |
| personal build, default out, first try (`build-personal-memoryerror.txt`) | 1 | `MemoryError: Unable to allocate output buffer` in `attach_notation` reading a score zip, while bash forks were failing on this machine; environmental, rerun |
| personal build, default out (`build-personal.txt`), the map's content-build | 0 | 2092 items, validation OK |
| `validate.py` (`validate-personal.txt`) · `review.py --check` (`review-check.txt`) | 0 · 0 | — |
| `unittest discover -s tools/content/tests -t tools/content` (`content-tests-all.txt`, output in `.stderr.txt`) | 0 | 1,455, 4 skipped (not identified), on the personal build; the new file's 10 among them |
| `npx vitest run` (`vitest-all.txt`), the map's `unit` | 1 | 310 of 312 files pass. Two are the recorded `lessonClaimsAboutApp` line-ending pair (blues.3, 4.7; Entry 101), which read lessons this change does not touch; the third, `expectedNote.test.ts`'s "every black key in every fixture carries its written spelling", timed out at 5 s under the whole suite and passes alone (`vitest-expectedNote-alone.txt`, exit 0, 12 of 12): load, and nothing it reads changed |
| `npm run build:app` (`build-app.txt`) · the guard on `app/dist/content` (`guard-dist-personal.txt`) | 0 · 0 | the step's own command on this machine's app build (the personal flavour, so no fetch placeholder): `deploy guard: publishing — app\dist\content\catalog.json holds no fetch placeholder (2092 catalogue items)` |
| `checks_for_paths.py` over every changed path (`checks-for-paths.txt`) | 0 | 65 of 65 matched, 0 unmatched; it names content-build, content-validate, review-check, content-tests, unit and build-app, every one run above (`pages.yml`'s row names none) |

No browser, and I started nothing on any port. The content suite's own packaging tests serve on 127.0.0.1 inside the suite, as they always do.

Unverified: the runner's refusal and its log; a Pages run on this change; the phone.

## Doc rows

- **`docs/03` §3a, a new paragraph after "The public build's placeholders, which no cache changes (Q75)".** "**The public build is not published without what it could not fetch (Q88, 2026-09-29; the reviewer's Q86 ruling).** The validator warns a build's own fetch placeholder and passes (§3 step 9, Q80); the deploy does not. `pages.yml`'s step *Guard the deploy*, after the build and before `configure-pages` and the upload, runs `tools/content/deploy_guard.py --dir app/dist/content`, which asks `validate.unfetched_placeholders` of the catalogue the artifact publishes. A row whose `importHint` carries this build's fetch reason (today `import_mutopia`'s *file was not fetched* and *is not the pinned file*; any reason Q82 or a later step adds to `UNFETCHED_REASONS`) fails the build job, naming each id and reason, so nothing is uploaded, `deploy-pages` does not run and the previous deployment stays live. Licence placeholders, import-only rows and runtime drills pass; a catalogue it cannot read is refused. A deliberate removal is judged by the catalogue and the ladder report, not here. While a fetch keeps failing, every push's deploy is refused, whatever else it carries. `tools/content/tests/test_deploy_guard.py` holds the guard and the step's place; the runner's refusal is unverified until a Pages run with a failed fetch is read."
- **`docs/03` §3, the tools list, after the `ladder_report.py` line.** "- `deploy_guard.py` — the Pages deploy's guard (Q88): refuses to publish a catalogue holding a placeholder whose reason is this build's fetch (`validate.unfetched_placeholders`), naming each; exit 0 publishes, 1 refuses, 2 cannot read the catalogue. Run by `pages.yml` only."
- **`docs/08`, a new row after Q75's.** Row: **The Pages deploy does not publish a build that could not fetch** (Q88, the reviewer's Q86 ruling). Covers: `deploy_guard.py` over `validate.unfetched_placeholders` (exit 1 naming each id and reason; licence, import-only and drill rows pass; an unreadable catalogue exit 2); `pages.yml`'s *Guard the deploy* after the build, before `configure-pages` and the upload, on the upload's `content`, nothing letting its failure through, `deploy` needing `build`. Guards against: a fetch-degraded public build replacing the last complete deployment (the rag as "import your own copy", ragtime.8's stride bass unkept); a guard that reads log text; a guard on a directory the upload does not publish, or one whose failure is let through. Tests: `tools/content/tests/test_deploy_guard.py` (`TestABuildThatCouldNotFetchIsNotPublished` 4, `TestTheCataloguesOwnPlaceholdersPass` 2, `TheDeployStep` 4). Status: done (Q88); the runner unverified until a Pages run with a failed fetch is read.
- **`docs/08`, the file line.** "`test_deploy_guard.py` — the Pages deploy's guard refuses a catalogue with a placeholder whose reason is this build's fetch, naming it, and passes licence, import-only and drill rows; its step stands between the build and the upload, on the upload's content, with nothing letting its failure through (Q88)".
- **`docs/prompts/checks.json`, the `.github/workflows/pages.yml` row** (a test-map change, for the reviewer): `"checks": {"content-tests": ["test_deploy_guard.py"]}`, the reason gaining "since Q88 `test_deploy_guard.py` reads the build job's step order and the guard's directory; the runner is still proved only by the Pages run". `tools/content/deploy_guard.py` is covered by `tools/content/*.py`.
- **Backlog.** Row Q86: "built (Q88, Entry 151): the Pages job's *Guard the deploy* refuses a catalogue with a fetch placeholder, naming it; the validator unchanged. Verified when a Pages run with a failed fetch is read." New row Q88 (area: content pipeline / deploy), P2, the same status; its follow-ups 1–3 as P3 lines if the orchestrator wants them as rows.
