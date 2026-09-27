# Q24 — Invariants that are not gates: CI runs content tests before the content build, and the gates that should fail skip silently (overflow seam, 2026-09-27; the reviewer's package; dispatched when a builder frees)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; the matrix row Q24 in `docs/prompts/views/backlog/Q.md` (the converter harness never runs in CI; the MIDI parity test skips there; content tests needing the build skip because CI runs them before the build); `.github/workflows/ci.yml` (verified at the lines 2026-09-27: "Content pipeline tests" at line 61 runs before "Build content" at line 64; the `concurrency` block; the render and validate steps after the app build); the 21 skip sites — `grep -rn "skipTest\|unittest.skip\|self.skipTest\|test.skip(\|describe.skip" tools/content/tests app/tests/unit` — each with its reason; `tools/content/tests/test_prompt_views.py` (a test that must never skip); the converter harness and the MIDI parity test named in Q24's evidence (find them by the row's words; say their paths).

## The goal, in the orchestrator's words

A gate that skips is a gate that is open. CI runs the content tests before the content exists, so every test that needs the built catalogue skips and passes; the converter harness never runs in CI at all; the MIDI parity test skips there. After this task the workflow builds content before it tests content, every test that exists to gate something fails loudly when its precondition is missing instead of skipping, and a skip that remains is one a person chose, with its reason at the site.

## What is decided

1. **Order**: in `ci.yml`, "Build content" (and whatever it needs: the cache restore, the Python dependencies) runs before "Content pipeline tests"; the app's unit tests run after the content build they read; nothing else in the workflow moves. The `concurrency` block stays.
2. **Skips become failures where the skip hides a gate**: each of the 21 skip sites is classified — *a gate* (the precondition is what CI must provide: the built catalogue, the converter's inputs, a MIDI fixture) becomes a failure with a message naming the missing precondition and the workflow step that provides it; *an honest environmental skip* (a tool that cannot exist in CI, a hardware device) keeps its skip with the reason at the site and is listed in the entry; nothing is deleted.
3. **The converter harness runs in CI** as a step, or the entry says exactly why it cannot (its inputs, its runtime) and what would make it possible.
4. **Proof**: the workflow file's order is asserted by a small test (a Python test that reads `ci.yml` and checks the step order) so the regression is caught; each converted skip is seen red by removing its precondition once (the built catalogue moved aside), then green.
5. No product implementation changes; no test assertion weakened; no docs/08 cleanup (Q25 is not this seam).

## Rules and files

You own `.github/workflows/ci.yml`, the skip sites' test files (the skip lines and their messages only), a new `tools/content/tests/test_ci_order.py`, and this seam's entry. Not the generator, not lessons, not product source. Never name an AI model. Never assert a number measured on this machine. Every change red first with the assertion named; every touched test classified. Runs unpiped from the worktree root: the content build (copy the gitignored import libraries and the conversion cache from the main checkout as previous builders did; restore any tracked file the offline fetch rewrites), the content tests before and after the build to show what changed, and from `app/` `npx vitest run` (`npm ci` first if `node_modules` is absent). No browser, no app build, no Playwright. You cannot run GitHub's workflow here: say so, and make the order test the proof. No commits, no push, no stash, never `git add`. Your entry as `ENTRY.md` in your scratch folder, headed "### Entry 89 — Q24: …", with a table of every skip site: file and line, what it skipped on, gate or environmental, what it does now.

## Report

Judgement first: which gates were open and are now closed; then Done / Not done / Follow-ups / Questions / Files; the table; the red lines; exit codes; unverified beside what passes (the workflow itself runs only on the next push).

**Delivered 2026-09-27**, Entry 89, in an isolated worktree: the build before the content tests; the converter harness and the parity reference as CI steps; 26 skip sites classified (the brief's grep found 21; a wider search and the vitest run's fifth skip found five more), 14 now loud, 9 environmental, 3 by design; `test_ci_order.py` red on the committed workflow and nine mutants. Not done by the rule of the brief: the MAESTRO download (Q47, the owner's). Consumer: a fresh worktree's vitest needs `python tools/midi-cleanup/tests/parity_reference.py` first.

