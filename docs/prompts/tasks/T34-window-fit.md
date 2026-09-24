# T34 — The score window: every bar as readable as the screen allows, undistorted, with the next bar in view

**Budget: the account has about 3 % of its weekly usage left. Read only what this brief
names, sections not files, never twice. Do the three items in order and keep the handoff
current after each step, because a cut-off can come at any moment.**

Read: `docs/prompts/working-rules.md` §1–§2 only, `docs/00-invariants.md` §1–§2, the
**Counts** section of the T32 handoff at
`C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\26d8772b-b51d-4e51-bd51-20002e98bae1\scratchpad\T32\HANDOFF.md`,
then in `app/src/score/WindowRenderer.ts` only `chooseWindowShape`, `applyWindowShape`,
`settleShape`, `scaleFor`, `fitToStage` and the chunk rule near line 1085, `app/src/score/
slots.ts` (`systemsPerWindow` and the tiling T32 added), and `app/tests/e2e/score.window-rule.spec.ts`.

## What the owner wants, in his words and then in rules

"Maximizing individual bar's readability given the screen size and orientation without
distortion, and being able to see the next bar when possible, are the most important
things." "By stretch I mean making the notes per bar too far apart from regular sheet
music, not that it shouldn't get proportionally bigger if it has the space."

1. **Scale is uniform and as large as the stage allows.** One scale for the whole window.
   Every bar is drawn at its engraved width times that scale; nothing is justified to the
   stage's edge; a row that is not full is left as it is. The scale is the largest at which
   the window's rows fit the stage's width and height, **capped by a ceiling**: the Size
   stepper, whose 100 % is the engraving's normal size (find the default zoom the renderer
   uses today and make that the 100 %). T32 named its own `scaleFor`, which sizes the window against the
   whole engraved page's ink width, as the likely reason the dense Nocturne fell under the
   floor; that is unproved. Measure it on the Nocturne upright first, then remove the
   cause you measured.
2. **The next bar is in view whenever it can be.** After the window's last bar, the
   following bar is drawn greyed: on the same row if it fits at the window's scale, else as
   one more row below, else, if neither fits, not at all, and only then. The bar being
   played is never the last thing on the stage while a next bar exists and room exists.
3. **Rows follow the stage's shape.** Try every split of the asked bars into consecutive
   rows; take the split whose scale from rule 1 is largest. A phone sideways gets one row;
   a phone upright gets one or two bars a row; a tablet gets rows of three or four. This is
   what T32's `systemsPerWindow` started; keep it and make the scale rule 1's.
4. **The count yields to readability, and says so.** If the best scale is under the
   floor, show one bar fewer and try again; the stepper's row sentence T32 built says
   *4 asked, 2 shown: 4 would be too small here*. Never draw a different number silently.
5. **Unchanged**: the frozen size during a run (Entry 58), the rotation refit, the row
   hidden in `Scroll`, the window advancing as it does today.
6. **The two steppers still work, and everything re-fits when they change.** The owner
   (2026-09-23): "the user should still be able to size up/down and choose the number of
   bars if possible still, and everything should resize based on the selection, just in
   case." A Size step moves the ceiling and the window re-fits at once; a Bars step
   re-fits at once, rows and scale both, and the drawn count changes unless rule 4 says
   why not. Assert both in the spec: a picture that is byte-identical across two settings
   is a fault (T30's "nothing changes" group).

## Do

1. **Fix the scale** (rule 1 and the ceiling), then rule 2, then rule 3's choice, in
   `WindowRenderer.ts` and `slots.ts`; state each rule in a comment where it lives. Do not
   rewrite what T32 built for the count and the sentence; correct the sizing under it.
2. **Re-point `score.window-rule.spec.ts`** at these invariants, on its existing 60 cells:
   (a) every bar in the window has the same drawn-width to engraved-width ratio, within a
   small tolerance (no stretch); (b) the window's ink touches the stage's width or its
   height, or the scale is at the ceiling (as big as allowed); (c) the next bar is visible,
   or no room for it at the window's scale is measured and stated; (d) drawn count equals
   asked, or the sentence is shown; (e) stave height not under the floor. Record the red
   counts against the tree as it stands before your change, then after. Every group must
   go to 0 or the cell says why.
3. **A 16-cell contact sheet for the owner's eye**, using the T30 camera
   (`app/tests/tour/t30.ts`): phone upright 342, phone sideways, tablet upright, tablet
   sideways × Twinkle and the Nocturne op. 48 no. 1 × 2 and 4 bars asked, mid-run, into
   `build/tour/T34/` with the measured caption. Then `npm run build:app` and, one at a
   time on 4173: `score.window-rule`, `score.fill`, `score.layout`, `score.fuzz` (two
   workers, once), `score.head-height`; `npx tsc -b --noEmit`, `npm run lint`,
   `npx vitest run tests/unit/slots.test.ts tests/unit/autoFit.test.ts`; exit codes from
   unpiped runs. CI runs the rest.

Update `docs/04-ui-spec.md` §5 and `docs/08-score-render-states.md` §4.1/§9.7 only where
T32's wording is now wrong (the sizing), one short entry in `docs/pending-review.md`
(next free number; check the tail with `tail`), one line in the decision document
`docs/decisions/2026-09-23-score-window-strategy.md` saying the rule built is this one.

## Rules

Files: `app/src/score/WindowRenderer.ts`, `app/src/score/slots.ts`, `app/src/score/autoFit.ts`
if the ceiling lives there, `app/tests/e2e/score.window-rule.spec.ts`, `app/tests/tour/`
for the sheet only, the four documents named. Never name an AI model. Commit nothing. A
picture is a proxy and the caption's numbers are the claim; an absence needs two searches;
a plural is several claims. `HANDOFF.md` in your scratch folder after every step. Final
message: the red counts before and after per invariant, what changed in the sizing and
why, the sheet's path, exit codes, what is unverified.
