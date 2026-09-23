# T30 — What the score window shows: a gallery of every option on every screen, the faults, and a strategy for the owner to choose

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/04-ui-spec.md` §5 (the `⋯` sheet: *Bars in window*, *Size*, *Layout*
`Window | Scroll`; the stepper rules near "Both steppers say where they are"),
`docs/08-score-render-states.md`, `docs/08-test-map.md` (the tour, states and corpus
sections), `app/src/score/autoFit.ts`, `app/src/score/WindowRenderer.ts` (`fitToStage`,
the slots, read-ahead, the frozen scale), the specs `score.fill`, `score.layout`,
`score.slots`, `score.readahead`, the tour's `shoot.ts` and `choices.spec.ts`, and
`docs/pending-review.md` Entries 49 and 58 first. Read sections, not whole files.**

## Why

The owner (2026-09-23): "We've got to find the balance between showing the music to be as
big as possible without distorting it, showing upcoming music, and following user options.
If you do a screenshot tour of phone, tablet, in both landscape and portrait, with
different bars-shown options selected, you'll see that things don't look right. You either
can't see the next music, or nothing changes, or it's too small, or it's nonsensical in
that you choose x bars shown but a different number is shown."

Three goods pull against each other: the notes as large as the stage allows without
stretching them; the music that comes next visible before it is needed; and the learner's
own choice of how many bars to see. Today's rules were written one at a time (Entries 49
and 58 record some) and nobody has looked at the whole grid.

## Do

1. **The gallery, every cell shot and measured.** Form factors: phone upright (342×740 and
   390×844), phone sideways (740×342 or the tour's landscape size), tablet upright
   (768×1024), tablet sideways (1024×768). Options: *Bars in window* 1, 2, 3, 4, 6, 8;
   *Layout* `Window` and `Scroll`; *Size* at its default and at one step up and down.
   Pieces, chosen to differ and named with their ids: a one-hand exercise with few notes
   per bar; a simple two-hand song; a dense two-hand piece with wide chords and many notes
   per bar; a piece in a compound or long metre (12/8 or 4/4 with sixteenths); a generated
   technique exercise; a drill that draws a stave if any does. Two moments per cell: before
   the run (bar 1) and mid-run with the cursor past the first window, so read-ahead shows.
   Use the tour's camera (`shoot.ts`) so names and contact sheets match the existing ones;
   write the sheets under `build/tour/T30/` (gitignored) and say the path.
   **Per cell, measure and print into the cell's caption**: bars actually drawn in the
   stage; the drawn size (CSS scale × engraving zoom, as Entry 58 measures it) and the
   stave height in px; the fraction of the stage the ink occupies (`score.fill`'s measure);
   whether any bar beyond the current window is visible; whether the number the stepper
   shows equals the number drawn. A picture without those numbers is not a cell.
2. **The fault table.** Every cell that fails one of the owner's four complaints, in his
   four groups: *cannot see the next music*; *nothing changes when the option changes*;
   *too small*; *the chosen count is not the drawn count*. For each: form factor, piece,
   options, what was measured, and which rule in the code produced it (file:line). Say the
   counts per group and the total cells.
3. **The strategy, for the owner to choose.** Two or three whole rules, each stated in one
   paragraph a learner could read, each with the same three pieces shot under it (a probe
   build in a scratch branch of the renderer is fine; do not leave it in the tree), for
   example: (A) *Bars in window* is the most the window will hold, the fit fills the stage
   to a floor of readable size and shows fewer when the piece is dense, and the next system
   is always previewed; (B) the count is exact and the size follows, with a warning when
   it falls under the floor; (C) an automatic count from the piece's density and the
   stage, with the stepper as an override that says what it overrode. State for each how
   phone and tablet, upright and sideways, `Window` and `Scroll`, and read-ahead behave,
   and what happens to the frozen size mid-run. Recommend one, with the reason in
   measurements from the gallery, not taste. **Build nothing beyond the probes.** The
   owner decides; `docs/00` says eye over spec.
4. Write the gallery's index, the fault table and the strategy as
   `docs/decisions/2026-09-23-score-window-strategy.md` (draft, marked as awaiting the
   owner's choice), with the contact-sheet paths.

## Rules

- Files: the decision draft, `build/tour/T30/**`, probe specs under `app/tests/tour/`
  only if they are removed or kept as the tour's own; nothing in `app/src` survives this
  task. One appended entry in `docs/pending-review.md` (next free number; check the tail).
- `npm run build:app` before shooting; one Playwright run at a time on 4173; four workers
  at most. Never name an AI model. Commit nothing. An absence needs two searches; a plural
  is several claims; a picture is a proxy for the screen and a measurement is the claim.
- Every form factor × option × piece cell shot or a not-shot line with the reason. Keep
  `HANDOFF.md` current in your scratch folder. Never stop silently.

## Final message

The cell count and where the sheets are; the fault table's counts per group with the three
worst cells named; the strategies with the recommendation and its measured reason; what is
unverified.
