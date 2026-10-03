# Reviewer handoff — Q24, invariants are gates (its own seam; infrastructure, no product code)

Implementation HEAD: e32d0ef (Q24's commit on its worktree branch, merged as d9133af; the workflow, one new test file, the skip lines of thirteen test files)

## What changed

- **The order.** `ci.yml` ran "Content pipeline tests" before "Build content"; 22 content tests that read the built catalogue, the curriculum or the fetched Joplin edition skipped on every run. "Build content" now runs first, and after it those 22 run and pass (991 OK, 4 skipped, all four environmental).
- **Two steps that never existed.** "MIDI converter harness" (`unittest discover -s tools/midi-cleanup/tests`: 25 tests, 16 run, 9 skip for the MAESTRO recordings) and "Write the MIDI parity reference" (`parity_reference.py` before "Unit tests": four references from committed files; the TypeScript port agrees with all four, 38 passed). Before, the whole parity comparison was one skipped test and one passing "is missing" test.
- **26 skip sites classified by one question, can a CI step provide this precondition?** 14 that hid a gate now fail naming the missing file, the command that makes it and the CI step (the 22 content tests; the fitted-proxy and round-trip-fixture gates on committed inputs, which would have skipped silently if their file went; the parity suite's `describe.skipIf` and its silent complement that passed with a warning). 9 environmental skips keep their reason at the site (the unpacked PDMX archive and the 2026-09-15 re-run; a live run's lock; openssl; MAESTRO). 3 by design (the split-hands case; the two `runIf` invocation modes of `demandsOfFiles`). The table with file, line, what it skipped on, class and what it does now is in the entry.
- **The proof of the order** is `tools/content/tests/test_ci_order.py`, which reads the workflow's text: 4 of 8 red on the committed file, green on the edited one, red on each of nine mutants (unit tests before the build; validate before the render check; `concurrency` removed; the harness step renamed or removed; and so on) with three controls green. The builder could not run GitHub's workflow; the push that carries this handoff is its first run.
- No product code, no assertion weakened, nothing deleted. Nothing here is seen or heard; there is no pedagogical verdict to give.

## Files to inspect, in order

1. `docs/prompts/entry-89.md` — the judgement, the mechanism and the discriminating runs, the table of 26 sites, the tests-touched table, the checks with exit codes, the unverified list, the follow-ups, the question.
2. `docs/prompts/runs/Q24/` — the nine red captures (`red-ci-order-on-committed-ci.txt`, `red-ci-order-mutants.txt`, `red-gate-{built,joplin,proxy,fixture}.txt`, the three `red-midiParity-*.txt`) and the run captures (`run-unittest-committed-no-build.txt` with its 26 skips, `run-unittest-after-build.txt`, `run-converter-harness.txt`, `run-parity-reference.txt`, `green-midiParity-with-reference.txt`, `run-vitest.txt`, `run-typecheck.txt`).
3. `.github/workflows/ci.yml` — the moved step and the two new ones; `tools/content/tests/test_ci_order.py`.
4. One converted site of each kind: `tools/content/tests/test_score_checks.py` (`KnownItems.setUp`, eight tests behind it), `test_pdmx.py` (the fitted proxy), `tools/midi-cleanup/tests/test_converter.py` (`TestRenderedInput`, and the MAESTRO class's reason), `app/tests/unit/midiParity.test.ts` (the suite that always runs now).

## Verification

- The builder in its worktree, unpiped: content tests on the committed tree before any build exit 1 (983, 26 skipped, one failure explained as a concurrent `npm ci`, not shown in isolation); build 0 (2,061 items), validator 0; content tests after the build with the changes 0 (991, 4 skipped); harness 0 (25, 16 run) on the committed and the changed file; the reference script 0 (4 files); `test_ci_order` 1 on the committed workflow, 0 on the edited; tsc 0; eslint on the vitest file 0; vitest 1 with the known four in untouched files (two CRLF-checkout, two `sightReadingPromises` under load; alone 51 of 51).
- The orchestrator ran nothing further by the rule of 2026-09-27 (tests and the workflow; CI is the full run, and this push is the first run of the new order).
- Unverified: the workflow on GitHub (the runner's fresh clone of `craigsapp/joplin` — if unreachable, the build still succeeds and the five Joplin tests now fail naming the file, where they used to skip); that the runner writes the same four parity files (inferred from the music21 pin and the fixed seed); `test_serve_lan` on Ubuntu (openssl expected present); the job's added time.

## Follow-ups recorded, not fixed here

- Q45 (P3): the 13 e2e and tour skip sites are unclassified; three in `carry-overs.spec.ts` skip with no reason.
- Q46 (P2/P3): the split-hands parity never runs in CI (no committed reference holds a split; a one-track two-hand fixture would fix it); `test_technique_units` reads `build` relative to the cwd.
- Q25 (P3, the test-map rewrite): `docs/03:68` and `docs/08:388` say the parity tests skip — they now fail; no `docs/08` row for `test_ci_order.py`; `test_converter.py`'s docstring run command fails.
- A consumer for every builder brief: a fresh worktree's vitest now needs `python tools/midi-cleanup/tests/parity_reference.py` first; its content tests fail rather than skip until the build has run. Noted in E0's brief and `in-flight.md`.

## Questions

1. **For the owner (Q47), and for the reviewer's view:** should CI fetch the MAESTRO v3.0.0 MIDI zip (58 MB; the three performances are "test input only" per `build/midi-real/SOURCE.md`; the licence was recalled, not re-read) so the harness's real-recording class (nine tests, among them *no note is lost or invented between the file and the score*) and the three split-hands parity references run there? The builder left it undone rather than add a third-party download to every run. Until decided, that class runs only on a machine that has the files.
2. Is "fail naming the file, the command and the CI step" the right shape for every gate, or should the committed-input gates (the fitted proxy, the round-trip fixture) stay skips, since the checkout can never lack them and a failure there says something else went wrong?

## Do not re-review

T53c, F1, T53b, T53, C7 and L98, F0 and F0a, T52 (closed). H0 and D0 get their own handoffs when they land.
