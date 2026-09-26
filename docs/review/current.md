# Reviewer handoff

HEAD: e7c6009 (this file's commit is the next one)

## What changed since the reviewer's last read (5fdd01c)

- Parts 25–27 recorded (the chooser's axes; transfer as facts; the encounter model, L97) — all LATER-WAVE contracts.
- The pre-dispatch review of C7, F0 and D0 applied in the three briefs; the sequence F0 → C7 → D0 → E recorded everywhere it is named.
- The holistic review's five control changes are now rules for the waves in the plan; L97 and L59 have one post-E owner.
- The C6 fix-forward (`f3c4b7e`) is committed and pushed; its full chain is still running (content build, validator, content tests, tsc, lint, vitest, app build green; the default Playwright configuration in progress; the states gallery after it).
- `docs/prompts/views/` holds the fetchable views, checked fresh by `tools/content/tests/test_prompt_views.py`.

## Decisions made (the orchestrator's, to overrule)

- L96: the review row repeating one item for days after the exposure fix is recorded for the reviewer's judgement, not changed.
- Entry numbering by delivery order: T52 = 81, F0 = 82, C7 = 83.

## Files to inspect, in order

1. `docs/prompts/checkpoint-2026-09-26-slots.md` — the fix-forward section and question 4 (L96).
2. `docs/prompts/entry-80.md` from "Addendum (exposure precedence)"; `app/tests/unit/fallbackOrder.test.ts`; `docs/prompts/checkpoint-2026-09-26-slots-diaries-after.md`.
3. `docs/prompts/views/audit/part-25.md`, `part-26.md`, `part-27.md`; the review sections at the end of the audit file (`the-pre-dispatch-review-…`, `the-holistic-plan-review-…` in `views/audit/`).
4. `docs/prompts/plan-2026-09-25.md`, the rules for the waves (the new control block).

## Tests and verification

- Fix-forward, the builder's runs: tsc 0, lint 0, vitest 0 (5,974 passed), build 0, twelve Playwright specs 0.
- The orchestrator's chain over `f3c4b7e` (finished 19:48): content build, validator, content tests, tsc, lint, vitest, app build exit 0; the default Playwright configuration 791 passed, 7 skipped, none failed; the states gallery failed only on U62's two known light-theme contrasts (`#score-waiting`, `#score-help-more` at 4.3:1 — the only broken strings in its log). The fix-forward is verified green.
- T52 dispatched as Entry 81 after this chain; F0 follows it.

## Questions for the reviewer

1. L96: acceptable review, or is L32's reserved breadth share now urgent?
2. The handoff protocol: can the reviewer's tooling commit `reviewer-response.md`, or does the owner paste it?

## Do not re-review

Parts 12–24 (reviewed), the C6 packet's first three questions (answered in the C6 review), the D0 detector correction (applied), the T52 brief (approved).
