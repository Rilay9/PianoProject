# T35 — The two red window specs and the un-run one, classified before anyone fixes them

**Read-only with respect to production code.** You change nothing under `app/src/`,
`content/` or `tools/`. You may run the existing specs, read the renderer's debug output,
and add one probe spec of your own (`app/tests/e2e/t35-probe.spec.ts`) which you delete
before you finish. Your output is one file: `docs/prompts/traces/2026-09-25-window-reds.md`,
plus the report.

**Read first:** `docs/prompts/operating-procedure.md` §1–§4 and §11–§13. Then
`docs/prompts/audit-2026-09-25-outside.md` Part 2, point 8, which is why this task is a
classification and not a fix. Then the T34 brief `T34-window-fit.md` (the owner's six
rules for the window, in his words and in rules), `T34-HANDOFF.md` (the design as built
and every round's counts), and Entry 63 at the tail of `docs/pending-review.md`. In code:
`app/src/score/WindowRenderer.ts` (`scaleFor`, `chooseWindowShape`, `fitSlots`, `setZoom`,
`drawInto`, `debugFit`, the chunk rule sideways), `app/src/score/slots.ts`, and the specs
`app/tests/e2e/score.layout.spec.ts`, `score.screen.spec.ts`, `score.rotate.spec.ts`,
`score.window-rule.spec.ts`. `docs/08-score-render-states.md` §4.1 and §9.7 and
`docs/04-ui-spec.md` §5 say what the window promises; `docs/decisions/2026-09-23-score-
window-strategy.md` says why.

## The goal, in the orchestrator's words

Two specs are red on the branch and one has not been run since the renderer changed. The
branch was pushed with them red. Before anyone changes the renderer, find out what each
red actually is: a fault in the renderer, a spec that describes an older promise, a fault
in the test itself, or the renderer doing something new on purpose that needs a changed
invariant. The classification, with the measurement that supports it, is the deliverable.
The fix comes later, in a wave the owner has approved.

## The owner's words on the window

"Maximizing individual bar's readability given the screen size and orientation without
distortion, and being able to see the next bar when possible, are the most important
things." "By stretch I mean making the notes per bar too far apart from regular sheet
music, not that it shouldn't get proportionally bigger if it has the space." "The user
should still be able to size up/down and choose the number of bars if possible still,
and everything should resize based on the selection." Readability first, then the next
bar, then the count.

## The three items, and the hypotheses you inherit as questions

**R1. `score.layout` at 880 × 412 sideways: 1 bar asked and 2 bars asked ink the same
three bars.** Hypotheses: (a) sideways draws one sliding system and the chunk rule
engraves bars beyond the window to slide towards, so *asked* moves the window boundary
and the greying, not the ink, and the spec counts ink; (b) the count yields or a slot
ceiling pins the count at that viewport; (c) the sideways prediction (the
`readAheadScale` term from round 2's FIX4) picks the same chunk for both. Discriminating
measurement: at that viewport, for asked = 1, 2 and 3, read `data-window-asked` and
`data-window-bars` on the stage, the drawn bar rectangles, which bars carry `is-ahead`,
and `debugFit`. If `data-window-bars` differs while the ink does not, (a) holds and the
question is what a learner should see; if it is the same, (b) or (c), and `debugFit`
says which. There may be a (d) you find; say so.

**R2. `score.screen`: a Size + step at one viewport drew a smaller staff (about 270 to
250 px).** Hypotheses: over 100 % the count yields and the re-fit with fewer bars chooses
a row split whose largest uniform scale is smaller; or the frozen-height hold
(`FROZEN_HEIGHT_HOLD`) or the look-ahead row's pricing (`drawnRowPx`) lowers the fit after
the step. Measurement: `debugFit` before and after the step at that viewport; rows,
count, scale, ceiling. Also ask whether the spec's own reading of "staff height" is the
same measurement before and after (a test bug is one of the four classes).

**R3. `score.rotate` has not been run since `data-fit` gained the value `size`.** Run it.
If it fails, classify the failure the same way.

## The classification

For each of R1, R2, R3, one of:
- **implementation bug**: the renderer breaks one of the owner's rules or its own stated
  promise (`04` §5, `08` §4.1/§9.7), and you can name the mechanism and the measurement;
- **incorrect or outdated spec**: the spec asserts a promise the design no longer makes
  and the new behaviour is right by the owner's rules; say which sentence of the spec is
  stale and what it should assert;
- **test bug**: the spec's measurement or fixture is wrong (a selector, a race, a
  viewport, a stale attribute), and the behaviour is fine;
- **intentional behaviour requiring a changed invariant**: the renderer does something
  new on purpose and a documented invariant has to change; say which and why.

Each verdict carries: what you observed (the attribute values, the `debugFit` fields, the
pixel relationships, never a bare number asserted as fact), what you inferred, and what
would refute the verdict. If a verdict is *implementation bug*, also say the smallest
fix you would make and which of the owner's three goods it serves; do not make it.

## Then

1. Re-shoot the 16-cell sheet (`app/tests/tour/t34-sheet.spec.ts`, run with `npx
   playwright test --config playwright.tour.config.ts t34-sheet` from `app/`) into
   `build/tour/T34/` and **open every PNG**. Per cell, in a table: bars drawn, staff height
   as a share of the stage, next bar visible, any stretch, and whether the cell looks
   right to you as a reader of music. A picture that looks wrong is a finding whether or
   not a spec is red.
2. Run, one at a time at two workers from `app/`, after `npm run build:app`:
   `score.window-rule`, `score.layout`, `score.screen`, `score.rotate`, `score.fill`,
   `score.fuzz`, `score.head-height`, `score.stepper-limits`, `score.states`. Report each
   exit code from an unpiped run and every red line with its cause classified as above.
   Stop the preview server before the build; never build during a run.

## Rules and files

You write only `docs/prompts/traces/2026-09-25-window-reds.md`, your scratch folder, and
the temporary probe spec, which you delete. No changes under `app/src/`. No commits, no
push, no stash. Never name an AI model. You are the only Playwright user while you run;
three read-only agents work beside you under `docs/prompts/traces/` and never start a
browser. Hold every hypothesis above loosely: the point is to find out what is true, and
a verdict that contradicts the orchestrator's hypothesis is the most useful kind.

## Report

Judgement first: the three verdicts in three lines, and whether the branch's baseline is
sound enough to build on. Then per item the observation, the inference, the refuting
test, and for bugs the smallest fix. Then the sheet table. Then what is unverified. Files
read.
