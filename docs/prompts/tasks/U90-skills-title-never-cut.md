# U90 — A concept's name on Skills is never cut: on the runner's font the row "Leaps: a fourth or fifth" ends in an ellipsis at 342 px, which says neither leap; the title wraps instead, on every font, red first under a wide font

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/entry-123.md` (F2b: the two leaps, the Skills entry filed under Stage 2, the case "each name is read whole at this width"); `app/tests/e2e/plan.spec.ts` at the describe *the two leaps on Skills (F2b)* (`readWhole`: a title is read whole where `scrollWidth <= clientWidth`; the assertion "the beginner name is cut"); `app/src/style.css` at `.list-row__title` (`overflow: hidden; text-overflow: ellipsis`, and the places that set `white-space: normal` on it) and at the app's font stack (`system-ui, -apple-system, 'Segoe UI', …`); `app/src/ui/screens/PlanScreen.ts` or wherever the Skills list's rows are built (`#skills-list .skill-concept .list-row`); `docs/04-ui-spec.md` on list rows and the Skills screen; `docs/00-invariants.md` (never teach wrong; the words need their room); the CI run 36559774455 on 248c6138 (`gh run view 36559774455 --log-failed`): the one definite red in the full run, `plan.spec.ts:260`, on both attempts.

## The goal, in the orchestrator's words

CI's full run on 248c6138 (805 passed, one failed on both attempts, two flakes that passed on retry) fails F2b's case: at 342 px the Skills row for the beginner's leap has `scrollWidth > clientWidth`, so its name is cut to an ellipsis on the runner. The same case passed in F2b's landing here and in its builder's pictures at 342 × 740. The orchestrator's hypothesis: the app's font stack resolves to a wider face on the runner (Linux's `system-ui`) than on this machine (Segoe UI) or a phone (Roboto, San Francisco), and the row's title is one line with an ellipsis, so a name that just fits here is cut there. The refuting test: force a wide face in the case (`page.addStyleTag` with a font this machine has that is wider than Segoe UI, Verdana say) and read the title's widths; if the name still reads whole under the wide face, the mechanism is not the font and the report stops there.

A cut concept name teaches wrong ("Leaps: an o…" names neither leap; the F2b describe says so), and a learner's phone may carry a font this machine does not. The rule this seam lands: on Skills a concept's name is never cut; it wraps to the lines it needs.

## What is decided

1. **The Skills row's title wraps.** `.skill-concept .list-row__title` (or the narrowest selector that reaches every concept row on Skills and nothing else) gets `white-space: normal` and no ellipsis, so `scrollWidth <= clientWidth` holds on every font, and the row grows with its name. Other list rows keep their rule unless the same fault is observed there; say what you looked at.
2. **The case proves it on a wide font too.** In `plan.spec.ts`'s F2b describe, the whole-name assertion runs twice: on the app's own stack and after a style tag forcing a wider face available here (say which face, and that it is wider than the stack's first match on this machine, by the measured `scrollWidth` before the fix, stated as a relationship). Red first: the wide-font pass fails on the committed CSS (if it does not, the hypothesis is refuted; report and stop). Any other name on Skills that the wide face cuts is listed in the entry.
3. **The look at 342 × 740.** Pictures of the Skills list at Stage 2 before and after, on the app's stack and under the wide face: the wrapped row must read as one entry (the meta line and the *Find more* button in their places), not as two rows.
4. **The two flakes are recorded, not fixed.** `sweeps.spec.ts:54` (every lesson page opens by URL) and `wide.spec.ts:428` (phone-landscape, every screen centred and capped) passed on retry in the same run; the orchestrator records them as CI flakes (U91). Not U90's unless the wrap changes a screen those sweeps measure — then rerun them here and say so.
5. **Not U90's:** the leap concepts themselves (F2b/F2c, accepted), the Skills screen's structure, any other screen's row rule.

## Verification layers

- Browser, on port 4383 through a copy of `app/playwright.config.ts` as `app/playwright.u90-4383.config.ts`, `--workers=2` at most, with a check that every spec file you name exists before the step: `plan.spec.ts` whole (the F2b describe red first under the wide face, green after; every other case preserved); the state gallery is not needed; `wide.spec.ts`'s phone-landscape case and `sweeps.spec.ts` only if item 4's condition holds.
- Unit: none expected; `npx tsc -b` and `npm run lint`.
- The map: `python tools/docs/checks_for_paths.py app/src/style.css app/tests/e2e/plan.spec.ts` and say what it names.

## Rules and files

You own `app/src/style.css` at the Skills row's title rule, `app/tests/e2e/plan.spec.ts` at the F2b describe, the pictures under `docs/prompts/pictures/u90/`; `docs/04` rows in the entry's `## Doc rows`. Not `PlanScreen.ts` unless the wrap needs a class the rows lack (then the one class). Never name an AI model. Never assert a number measured on this machine (widths as relationships: the wide face's title wider than the row, the stack's not). No commits, pushes, stashes or checkouts. A fresh worktree's browser run needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24); if the offline build cannot produce `app/public/content`, copy that folder from `C:\Users\yalir\repos\Piano Stuff\PianoProject\app\public\content` and say so; `npm ci` in `app/` (a junction to the main checkout's `app/node_modules` is the recorded fallback). Nothing on port 4173.

## Sequencing

A narrow fix-forward of a CI red under F2b's accepted contract (788427c): dispatched now with a for-information line to the reviewer; the post-build review is the gate. CI's full run is red on every push until it lands.

## When to deviate

If the wide-face pass does not cut the name here, stop at the finding and say what else differs on the runner (the viewport the case sets, the row's siblings, the Stage select). If wrapping breaks the row's layout (the button or meta displaced), show it and stop.

## Report

Judgement first: the Skills row at 342 × 740 before and after, on the app's stack and under the wide face, as pictures; then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes; unverified beside what passes (the runner's font itself is unverified until CI reads the record commit).

**Landed 2026-09-29** (Entry 135; 994586f9, merged 994586f9); handoff `handoffs/994586f9.md`.

**Accepted 2026-09-29** (`responses/994586f9.md`, APPROVE). The grouped Skills rule stands (concept and exercise titles); U92 (the clipped count) a real learner-facing follow-up; U93 and U94 later waves with complete titles and complete actions as independent requirements.
