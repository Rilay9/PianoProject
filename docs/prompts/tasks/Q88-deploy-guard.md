# Q88 — The Pages deploy does not replace the last successful build with one that could not fetch content a healthy public build bundles: a deploy-side guard between the build and the artifact upload, fed by the built catalogue's fetch placeholders (the reviewer's Q86 ruling; a workflow change for the reviewer's post-build gate; P2)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/2d9e7e2c.md` (the Q86 section: *guard the deployment*; keep Q80's validator as built; a structured build/fetch result as the guard's input, never warning text; allowed — expected catalogue placeholders such as licence or import-only material; not published — a build-owned failure to obtain content a healthy public build bundles; deliberate removal judged through the catalogue truth); `docs/prompts/entry-141.md` (Q80: `validate.UNFETCHED_REASONS`, `unfetched_placeholders(catalog)` — each placeholder whose reason is this build's fetch, with the reason as the step wrote it; on the personal and strict catalogues none of the 227 licence placeholders is read as the build's own) and `docs/prompts/tasks/Q82-clone-missing-is-a-placeholder.md` (another builder is extending the same reasons to the kern and MuseTrainer steps; the guard covers them the day Q82 lands because it reads the one function); `tools/content/validate.py` at `unfetched_placeholders` and `UNFETCHED_REASONS`; `.github/workflows/pages.yml` whole (the build step about 70–84 with `PIANOPATH_STRICT_LICENSE`, `actions/configure-pages`, `actions/upload-pages-artifact`, the `deploy` job with `actions/deploy-pages`); `.github/workflows/ci.yml` for a step's shape and `tools/content/tests/test_ci_order.py` for how a workflow's step order is pinned by a test; `docs/03` on the build and the deploy.

## The goal, in the orchestrator's words

Since Q80 a build that could not fetch a public piece validates with a warning, which is right for the build and wrong for the phone: the Pages job would then replace the last complete build with one where *Pine Apple Rag* is *import your own copy* and ragtime.8's stride bass is kept by no bundled option, until a later deploy fetches. The reviewer ruled the boundary: the validator stays as built, and the deployment is guarded — a fetch-degraded public build must not replace the previous successful artifact. After Q88 the Pages job stops before the upload when the built catalogue holds a fetch placeholder, so the previous deployment stays live, and the log names what was not fetched.

## What is decided

1. **The guard reads the structured fact.** `tools/content/deploy_guard.py --dir <the built content dir>` loads the built catalogue and asks `validate.unfetched_placeholders` (imported, never copied: one definition of *this build's own placeholder*). Any row returned: exit 1, printing `deploy guard: not publishing — <n> item(s) this build could not fetch:` and one line per item with its id and reason. None: exit 0 with one line saying the catalogue holds no fetch placeholder. Nothing is grepped from warning text.
2. **What passes.** Licence placeholders, import-only rows, PDFs and every other placeholder whose `importHint` carries no fetch reason pass; a deliberate removal is not the guard's business (the catalogue and the ladder report judge it). The guard reads only the fetch reasons.
3. **The step.** In `pages.yml`, one step *Guard the deploy* after the build step and before `actions/configure-pages`/`upload-pages-artifact`, running the guard on the directory the build wrote; when it fails, the `build` job fails, the artifact is not uploaded, and `deploy-pages` does not run, so the previous deployment stays live. No `continue-on-error`, no retry of the fetch, no change to the build step or to CI.
4. **Red first, unit:** `tools/content/tests/test_deploy_guard.py` on constructed catalogues — one fetch placeholder (Mutopia's reason): exit 1 naming id and reason; only licence and import-only placeholders: exit 0; an empty catalogue: exit 0; the reasons come from `import_mutopia.build_entry` where the Q80 tests build them, so a change of wording turns this red too. And the step's place pinned the way `test_ci_order.py` pins CI's order: the guard stands after the build and before the upload in `pages.yml`.
5. **Observed here, not inferred:** the guard run on a strict build with the rag's files moved aside (Q80's `unfetch` path, or a copy of the catalogue with the rag row's file removed and its hint set to the step's words if a rebuild is too long): exit 1 naming the rag; on the full strict build: exit 0. Both logs in the run folder. The runner itself is unverified until a Pages run with a failed fetch is read — say so.
6. **Not Q88's:** the validator (Q80 as built, Q82 in flight), the fetch step's retries, CI's order, `build.py`, the manifest the reviewer mentioned as a possible richer input (the catalogue's placeholder reasons are that structured fact today; a manifest is a follow-up line if you think one is needed).

## Verification layers

- Unit, red first: item 4; `python -m unittest tools.content.tests.test_deploy_guard tools.content.tests.test_ci_order`; the whole content suite `python -m unittest discover -s tools/content/tests -t tools/content`.
- The builds of item 5; `python tools/content/review.py --check`.
- The map: `python tools/docs/checks_for_paths.py <changed paths>`, and every step it names (a workflow change may name the workflow tests; `tools/content/**` names the unit suite and the app build — run them).
- No browser; nothing on any port.

## Rules and files

You own `tools/content/deploy_guard.py` (new), `tools/content/tests/test_deploy_guard.py` (new), `.github/workflows/pages.yml` at the one new step, `tools/content/tests/test_ci_order.py` if that is where the step order is pinned, the run folder; `docs/03` rows in the entry's `## Doc rows`. Not `validate.py`, `import_*.py`, `build.py`, `difficulty.py` or their tests (other builders), not `ci.yml`. Never name an AI model. Never assert a number measured on this machine. No commits, pushes, stashes or checkouts. Temp state under the worktree's own gitignored `build/`. A fresh worktree needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24); copy the main checkout's `content/scores/imported/mutopia` and `build/cache/mutopia` read-only if the worktree lacks them; build with an absolute `--out`; never write to the main checkout.

## Sequencing

The reviewer's Q86 ruling designed this guard; a workflow change, so its handoff carries the `pages.yml` step for the reviewer's post-build gate before it is trusted; dispatched now, for information.

## Report

Judgement first: the guard's two logs (unfetched, full) as a runner would print them; then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes; unverified beside what passes. Entry 151; every run file under `docs/prompts/runs/Q88/`; the entry as `docs/prompts/runs/Q88/ENTRY.md`, starting `### Entry 151 — Q88`.

**Architecture approved 2026-09-29** (`responses/questions-ea14b1fe.md`); the step's read-back on the handoff.

**Landed 2026-09-29** (Entry 151; d249d64f, merged 918cbb24); handoff `handoffs/d249d64f.md`.

## Record

lane: Q88 · closes: Q88 · entry: 151
index: The Pages deploy is guarded: a step between the build and the artifact upload fails when the built catalogue holds fetch placeholders, so the last successful build stays live (the reviewer's Q86 ruling) | content, workflow | **done 2026-09-29**, Entry 151; merged 918cbb24; handoff `handoffs/d249d64f.md` |
in-flight: brief drafted 2026-09-29 (`Q88-deploy-guard.md`): the reviewer's Q86 ruling — a deploy guard reading the built catalogue's fetch placeholders through `validate.unfetched_placeholders`, one step in `pages.yml` before the artifact upload; red first; observed on an unfetched build here. Building, for the reviewer's post-build gate (Entry 151). **Landed** 2026-09-29 (merged 918cbb24, chain green); handoff `handoffs/d249d64f.md`, with the reviewer.
state: landed 2026-09-29: merged 918cbb24; handoff `handoffs/d249d64f.md`, with the reviewer
