# Q83 + Q84 — A runner's log says what a fetch failure is: the build step prints the validator's warnings when it passes (Q84), and the Mutopia strict-flavour test names the unfetched placeholder as its cause (Q83) (Q80's follow-ups 2 and 3; P3, content tooling)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/entry-141.md` (Q80: the validator's `WARNING (ladder report, Q80)` line, and where it reaches a runner's log and where it does not — *the Pages job's log shows the `[MUTO]` placeholder line and "validation OK", but not the Q80 line; CI would print it in its final validate step but on a Mutopia outage fails first in the content-tests step*; follow-ups 2 and 3); the backlog rows Q83 and Q84; `tools/content/build.py` at `step_validate` (about 1358–1369: on success the step's `detail` is `summary_line(output)` alone, so every `WARNING` line the validator printed — Q75's deferred claims and Q80's set-aside placeholders alike — is dropped), at `Step` (its `warnings` field, and how `step_render` about 1372–1377 uses it) and at the runner that prints each step (find where `Step.warnings` is printed, and how); `tools/content/validate.py` at `main` (the warning loops: `concept_claim_findings(...)[1]` and `ladder_report_findings(...)[1]`, each printed as `  WARNING …`); `tools/content/tests/test_import_mutopia.py` at the strict-flavour case (search the file for *kept by no option on the strict flavour*; about 188 onward) and `tools/content/tests/test_build.py` or whichever test covers `step_validate` (search `tools/content/tests` for `step_validate`); `.github/workflows/pages.yml` and `ci.yml` (which step's log a phone deploy and a CI run show).

## The goal, in the orchestrator's words

Since Q75 and Q80 the validator says, by name, what a build could not measure or could not fetch; the build step throws those lines away when the validator passes, so the one log a deploy leaves shows *validation OK* and nothing else. And when a Mutopia outage hits CI, the failing test says *ragtime.8's stride bass is kept by no option on the strict flavour* without saying that the option is a placeholder for a file that was not fetched. Both are the same fault: the log does not name the fetch. The deploy question the reviewer and the owner now hold (Q86) cannot be judged from a log that hides it.

## What is decided

1. **Q84 — the warnings survive a pass.** `step_validate` collects every line of the validator's output that starts with `WARNING` (after its indentation) into the step's `warnings`, on success and on failure alike; the step's `detail` stays the summary line. The runner prints warnings the way it already prints `step_render`'s — read how, and if it prints nothing for a passing step, make it print each warning indented under the step, in the validator's own words, never reworded. Nothing else in `build.py` moves.
2. **Q83 — the strict test names the cause.** In `test_import_mutopia.py`'s strict-flavour case, when the assertion fails because the rag's option is a placeholder, the message names the placeholder's id and its `importHint` reason (read from the built catalogue row), so a CI log reads *…kept by no option on the strict flavour: `song.ragtime.joplin-pine-apple-rag.mutopia` is a placeholder (the edition's .ly file was not fetched)*. The test's pass condition does not change; only what it says when it fails. If the case cannot see the catalogue row it judged, say why and stop at the finding.
3. **Red first, unit:** for Q84, a test of `step_validate` (the pattern of the existing build-step tests, or a new small one) with a validator output that passes and carries two `WARNING` lines: before, the step's `warnings` is empty; after, it holds both lines verbatim. For Q83, the strict case run on a catalogue with the rag as a fetch placeholder (Q80's `unfetch` fixture path, `runs/Q80/scripts-ci-tests-unfetched.py`): before, the message names no placeholder; after, it names the id and reason.
4. **Observed, not inferred:** one offline build here on a catalogue with the rag's files moved aside (Q80's `unfetch.txt` shows how), so the build step's own log shows the Q80 warning under *validate*; the log in the run folder.
5. **Not Q83/Q84's:** the validator's words, the ladder check, the deploy guard (Q86), the CI workflow's order (the content-tests step still fails on an outage by design; a follow-up line if you think it should not), `import_mutopia.py`.

## Verification layers

- Unit, red first: item 3; `python -m unittest tools.content.tests.test_import_mutopia` and the build-step tests; the whole content suite `python -m unittest discover -s tools/content/tests -t tools/content`.
- The build: item 4, and the plain `python tools/content/build.py --offline --out <absolute path>` green; `python tools/content/validate.py --allow-nc --personal`; `python tools/content/review.py --check`.
- The map: `python tools/docs/checks_for_paths.py <changed paths>`, and every step it names (for `tools/content/**` it names the unit suite and the app build: `npx vitest run` and `npm run build:app` in `app/`).
- No browser; nothing on any port.

## Rules and files

You own `tools/content/build.py` at `step_validate` and the runner's printing of a step's warnings only, `tools/content/tests/test_import_mutopia.py` at the strict case's message only, the build-step test, the run folder; `docs/03` rows in the entry's `## Doc rows`. Not `validate.py`, not `import_mutopia.py`, not `import_kern.py`, `import_musetrainer.py`, `difficulty.py` or their tests (other builders work there), not the workflows. Never name an AI model. Never assert a number measured on this machine. No commits, pushes, stashes or checkouts. A fresh worktree needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24); if the offline build cannot produce `app/public/content`, copy that folder from `C:\Users\yalir\repos\Piano Stuff\PianoProject\app\public\content` and say so; `npm ci` in `app/`. Build with an absolute `--out`. Copy the main checkout's `content/scores/imported/mutopia` and `build/cache/mutopia` read-only if the worktree lacks them; never write to the main checkout.

## Sequencing

Q80's follow-ups 2 and 3 (P3), one lane: a narrow fix-forward under 788427c with a for-information line; its own handoff when it lands, short.

## Report

Judgement first: the build step's log lines under *validate* before and after on the unfetched build, as a runner would show them; then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes. Entry 148; every run file under `docs/prompts/runs/Q83-Q84/`; the entry as `docs/prompts/runs/Q83-Q84/ENTRY.md`, starting `### Entry 148 — Q83 + Q84`.

**Landed 2026-09-29** (Entry 148; c80e33f2, merged 36282f6f); handoff `handoffs/c80e33f2.md`.

**Accepted 2026-09-29** (`responses/c80e33f2.md`, APPROVE). Q89 ruled: fetch warnings first for display, from structured knowledge only.

## Record

lane: Q83+Q84 · closes: Q83, Q84 · entry: 148 · aliases: Q83 + Q84
index: A runner's log names a fetch failure: the build step keeps the validator's warnings when it passes (Q84) and the Mutopia strict-flavour test names the unfetched placeholder as its cause (Q83) | content | **done 2026-09-29**, Entry 148; merged 36282f6f; handoff `handoffs/c80e33f2.md`; **accepted 2026-09-29** (`responses/c80e33f2.md`, APPROVE); closed; Q89 ruled |
in-flight: brief drafted 2026-09-29 (`Q83-Q84-runner-log-names-the-fetch.md`): `step_validate` keeps the validator's `WARNING` lines on a pass and the runner prints them; the strict Mutopia case names the placeholder and its fetch reason when it fails; observed on an unfetched build here. Building, for information (Entry 148). **Landed** 2026-09-29 (merged 36282f6f, chain green); handoff `handoffs/c80e33f2.md`, with the reviewer. **Q83+Q84 accepted** 2026-09-29 (`responses/c80e33f2.md`, APPROVE); Q89 ruled (fetch warnings first, display only, no parser). Closed.
state: closed 2026-09-29: APPROVE (`responses/c80e33f2.md`)
