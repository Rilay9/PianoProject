# T35 — The window fit finished: two contradictions understood at their mechanism, the rotate spec run, the branch verified

**Read first:** `docs/prompts/operating-procedure.md` §1–§4 and §11–§13 (how work is
decided and reported here; it is short and it is the owner's word). Then the T34 brief
`T34-window-fit.md` (the owner's six rules for the window, in his words and in rules),
`T34-HANDOFF.md` (the design as built and every round's counts; read it whole, it is
short), and Entry 63 at the tail of `docs/pending-review.md`. In code: `app/src/score/
WindowRenderer.ts` (`scaleFor`, `chooseWindowShape`, `fitSlots`, `setZoom`, `drawInto`, the
chunk rule sideways), `app/src/score/slots.ts` (`packSlots`, the tiling), and the four
specs `app/tests/e2e/score.layout.spec.ts`, `score.screen.spec.ts`, `score.rotate.spec.ts`,
`score.window-rule.spec.ts`. `docs/08-score-render-states.md` §4.1 and §9.7 and `docs/04-
ui-spec.md` §5 say what the window promises; `docs/decisions/2026-09-23-score-window-
strategy.md` says why.

## The goal, in the orchestrator's words

A learner on any phone or tablet, either way up, sees the bars they asked for drawn as
large as the glass allows without the notes inside a bar being spread wider than the
engraving, with the next bar in view whenever there is room, and every control that
promises a change produces one they can see. The rule was built on 2026-09-23 (T32, T34)
and holds on the 60-cell spec. Two specs still contradict it and one was never run. This
task ends with the rule holding everywhere it is tested, the pictures opened, and the
branch ready to push.

## The owner's words

"Maximizing individual bar's readability given the screen size and orientation without
distortion, and being able to see the next bar when possible, are the most important
things." "By stretch I mean making the notes per bar too far apart from regular sheet
music, not that it shouldn't get proportionally bigger if it has the space." "The user
should still be able to size up/down and choose the number of bars if possible still,
and everything should resize based on the selection." Readability first, then the next
bar, then the count.

## The three items

**R1. `score.layout` at 880 × 412 sideways: 1 bar asked and 2 bars asked ink the same
three bars.** By the owner's rule 6 a picture that does not change across two settings is
a fault, unless rule 4 explains it on screen.

Hypotheses, so you inherit a question and not a conclusion:
- (a) Sideways draws one sliding system and the chunk rule engraves bars beyond the
  window to slide towards, so *asked* moves the window boundary and the greying, not the
  ink; the spec counts ink and cannot see the difference.
- (b) The count yields or a slot ceiling pins the count at that viewport, so the two
  settings really draw the same window.
- (c) The sideways prediction (the `readAheadScale` term added in round 2's FIX4) picks
  the same chunk for both.

The discriminating test: at that viewport, for asked = 1, 2 and 3, read
`data-window-asked` and `data-window-bars` on the stage, the drawn bar rectangles, and
which bars carry `is-ahead`. If `data-window-bars` differs while the ink does not, it is
(a) and the question becomes a product one: what should a learner see sideways at 1 bar
versus 2? The answer this brief takes, unless you find a better one and say why: the
current window's bars are drawn at the largest uniform scale for *that* count, so 1 bar
asked is bigger than 2 bars asked, and the bars beyond the window are greyed as
look-ahead; the same three bars at the same size is not that. If `data-window-bars` is
the same for both, it is (b) or (c), and `debugFit` tells which. Fix the mechanism; then
the spec asserts what a learner would notice (a size or a greying that differs), not
merely a byte difference.

**R2. `score.screen`: a Size + step at one viewport drew a smaller staff (about 270 to
250 px).** The stepper promises bigger; this is the opposite. Hypotheses: over 100 % the
count yields and the re-fit with fewer bars chooses a different row split whose largest
uniform scale is smaller (two rows becoming one, say); or the frozen-height hold
(`FROZEN_HEIGHT_HOLD`) or the look-ahead row's pricing (`drawnRowPx`) lowers the fit
after the step. Test: `debugFit` before and after the step at that viewport; compare
rows, count, scale and the ceiling. The rule the fix must satisfy: after a Size + step
the staff is never smaller than before it, even when the count yields; if a split would
make it smaller, that split is not chosen.

**R3. `score.rotate` was not run after `data-fit` gained the value `size`.** Run it. If
it reads `data-fit` for a rotation rule that still holds, teach the spec the new value;
if the rotation refit itself is wrong under the new sizing, that is a fault in the
renderer and the spec stays. Say which.

## Then

1. Re-shoot the 16-cell sheet (`app/tests/tour/t34-sheet.spec.ts`, run with `npx
   playwright test --config playwright.tour.config.ts t34-sheet` from `app/`) into
   `build/tour/T34/` and **open every PNG**. Say per cell what you saw, in a table: bars
   drawn, staff height as a share of the stage, next bar visible, any stretch. A picture
   that looks wrong outranks a passing spec (`00-invariants` §1, *look at the pictures*).
2. The chain, from `app/`, exit codes from unpiped runs: `npm run build:app`; then one at
   a time at two workers `score.window-rule`, `score.layout`, `score.screen`,
   `score.rotate`, `score.fill`, `score.fuzz`, `score.head-height`, `score.stepper-limits`,
   `score.states`; then `npx tsc -b`, `npm run lint`, `npx vitest run`. Stop the preview
   server before any build; never rebuild during a Playwright run.
3. Docs in the same change: `docs/04` §5 and `docs/08` §4.1 / §9.7 where a promise
   changed; the decision document's dated line; `docs/08-test-map.md` if a spec's meaning
   changed; Entry 64 appended to `docs/pending-review.md` in the report shape below.

## Rules and files

You own `app/src/score/WindowRenderer.ts`, `app/src/score/slots.ts`,
`app/src/score/autoFit.ts`, `app/tests/e2e/score.*.spec.ts`, `app/tests/tour/t34-sheet.spec.ts`,
`docs/04-ui-spec.md` §5, `docs/08-score-render-states.md`, `docs/08-test-map.md`, the
decision document, and the new entry. `app/src/ui/screens/ScoreScreen.ts` only for the
stepper's sentence; `ScoreSession.ts` not at all (another task follows you there). No
commits, no push, no stash. Never name an AI model. Never assert a number measured on this
machine in a test: express the relationship. A fix ships with a test seen red without it;
say so with the line. The specs serve the code: when the implementation makes more sense,
change the spec in the same change with the reason beside it.

You are the only Playwright user while you run; three read-only agents work beside you
in `docs/` and never start a browser.

## When to deviate

If R1's honest answer is that the current design makes *asked* meaningless sideways, do
not paper over it: propose the smallest change that makes the count mean something the
learner can see, build it, and say what you replaced. If a fix you make worsens any cell
of the sheet, the sheet wins and you go back to the mechanism. If the budget runs out
mid-way, leave `HANDOFF.md` in your scratch folder current with the step reached and the
counts, and say so; do not stop silently.

## Report

Judgement first: does the window rule now hold everywhere it is tested, and what did the
pictures show. Then Done / Not done / Follow-ups / Questions / Files. Per item: the
mechanism found, the test that told it from the alternatives, before and after measured
the same way, the red line. Unverified stated beside what passes. What has not been
heard, once.
