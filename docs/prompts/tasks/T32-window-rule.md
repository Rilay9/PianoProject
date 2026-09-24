# T32 — The score window: readable, never distorted, always looking ahead, and the count honoured where it can be

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/decisions/2026-09-23-score-window-strategy.md` in full (the gallery,
the fault table, the three probed rules and why each fails), `docs/08-score-render-states.md`
§4 and §9, `docs/04-ui-spec.md` §5 (*Bars in window*, *Size*, *Layout*), `app/src/score/
autoFit.ts`, `app/src/score/WindowRenderer.ts` (`fitToStage`, `fitSlots`, the chunk rule
near line 1085, the frozen scale, read-ahead), the tour's `t30-window.spec.ts` and
`t30.ts` (the camera and the measured caption), and Entries 58 and 60 in
`docs/pending-review.md` first. Read sections, not whole files.**

## The owner's decision (2026-09-23)

"Do what you think is best. Just remember that readability without distortion and being
able to look ahead are paramount." So the goods are ordered, and the rule follows the
order:

1. **Never distort.** A bar is drawn at the width its music needs at the current size; a
   system that is not full is never stretched to the stage's width; the size never falls
   under the readable floor (`08` §9's stave floor, the code's own 40 px, whichever the
   spec names).
2. **Always look ahead.** In every state before and during a run, at least the next bar
   after the window's last bar is visible on the stage, drawn as the following system
   (or, sideways with room, on the same system), greyed the way read-ahead is drawn today.
3. **Then the count.** *Bars in window* is honoured exactly when 1 and 2 allow it. When
   they do not, the window holds as many of the asked bars as fit at the floor size, and
   the stepper's row says so in words: *4 asked, 2 shown: 4 would be too small here*. The
   stepper stays live (`00` §1); it never silently draws a different number.

The layout that follows: the asked bars are laid over as many systems as the stage holds
(a phone upright with 3 asked gets three systems of one bar, or two of two and one,
whichever is larger and undistorted; a tablet sideways gets one system of three or four),
at the largest size where every asked bar and the next bar are on the stage. The
size is frozen for the run as today (Entry 58); a rotation re-fits under the same rule.

Two questions the owner left to this task, decided here by the same order:

- **`Scroll` layout**: the stepper is hidden there (`04` §0 R4: a control over nothing is
  gone), and the sheet says *Bars in window applies to the Window layout*.
- **Phone sideways**: the two extra bars either side that the chunk rule adds are
  read-ahead and context, not the window; the window is the asked bars, the next bar is
  the look-ahead, and any bar drawn before the window is context only when room is left
  after 1 to 3 are satisfied.

## Build

1. **Red first, from the gallery.** Before touching the renderer, turn the gallery's
   captions into assertions: a spec (`score.window-rule.spec.ts`, or the tour's shooting
   spec promoted into `tests/e2e/`) that for every cell of the T30 grid that failed asserts
   the rule above: no stretched system (a bar's drawn width relative to its ink width
   within the ratio full systems get), stave height not under the floor, the next bar
   visible, and the drawn count equal to the asked count or the row's sentence present.
   Run it once against today's renderer and record the counts per group; those are the
   red lines. Do not assert pixel numbers; assert relationships (`00` §2).
2. **The renderer.** Implement the rule in `autoFit.ts` and `WindowRenderer.ts`, replacing
   the chunk rule and whatever else the decision document names as the cause of each fault
   group, with the rule stated where the code is. The frozen-scale behaviour of Entry 58
   must survive (`score.head-height`, `score.fuzz`).
3. **The sheet.** The stepper's row gains the sentence when the count is not drawn; the
   row is hidden in `Scroll` with the sentence; `help.ts`'s entry for the stepper says the
   rule in the learner's words; `04` §5 and §5f say the same.
4. **Re-shoot the gallery** with the same specs (`build/tour/T30/` is gitignored; write to
   `build/tour/T32/`) and put the new fault table beside the old one in the decision
   document, marked as the rule now built. Every group's count must fall; where a cell
   still fails, say why and whether it is the floor speaking.
5. Chain: `npm run build:app`; then one at a time on 4173: the new spec, `score.fill`,
   `score.layout` (regenerate its Windows baselines only if the diff is the rule and say
   so; Linux CI's are the reference), `score.slots`, `score.readahead`, `score.rotate`,
   `score.fuzz` twice at two workers, `score.head-height`, `score.screen`, `score.states`;
   `npx tsc -b --noEmit`, `npm run lint`, `npx vitest run`, exit codes stated from
   unpiped runs. `08-score-render-states.md` §4.1's `ONE_SYSTEM_GAIN` note is corrected in
   the same step (Entry 60 §4 says it is stale).

## Rules

- Files: `app/src/score/**`, `app/src/ui/help.ts`, the `⋯` sheet in `ScoreScreen.ts`,
  `app/src/style.css` for the row, `app/tests/**`, `docs/04`, `docs/08-score-render-states.md`,
  `docs/08-test-map.md`, the decision document, one appended entry in
  `docs/pending-review.md` (next free number; check the tail). Never name an AI model.
  Commit nothing. An absence needs two searches; a plural is several claims; a picture is
  a proxy and the caption's numbers are the claim; nothing is heard.
- **The weekly usage window is nearly spent.** Keep `HANDOFF.md` in your scratch folder
  current after every step inside every item, with the exact file and function in flight,
  so a cap mid-edit loses nothing. Never stop silently.

## Final message

The red counts per group before and after; what changed in the renderer and why, per
fault group; the sheet's sentence; the specs and exit codes; what is unverified.
