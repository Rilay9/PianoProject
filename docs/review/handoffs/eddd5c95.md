# Reviewer handoff — U110a: the window renderer's terminal exception keyed on actual packing: a spent ladder keeps the look-ahead row the drawn rows leave room for, and drops it only when they no longer fit (Entry 218)

Implementation HEAD: eddd5c95 (merged at 024c5883; the entry and this handoff in the record commit at HEAD). Respond in `responses/eddd5c95.md`. Dispatched at `cd6a62ee` to the outside builder, which pruned and asked for two checks; finished here at `345ffda4` after the owner returned building to Claude.; the brief reviewed before dispatch.

## What is asked

Confirmation of the required change, with one point stated in the handoff below.

**What a learner meets.** Upright, a window that has room for its next row keeps it after the renderer's reshapes run out. A window whose stage shrinks until its rows no longer fit drops the look-ahead row rather than drawing rows into each other. Nothing heard; the shrink case is unit-level only.

**Your required change, and how it was met:** prune the terminal exception unless a residual overlap earns it. The pruning alone left a residual on the stand-in engraver (a height-only shortening after a spent ladder), so the exception stays, keyed on actual packing at the unchanged scale. Both cases you asked for are held: the fitting case refused only by the reserve keeps its row, and the genuinely overflowing case drops it. The brief's two branches were not exclusive; the code drops the measured-row condition and adds the packing condition.

**Point for you:** the residual earned the exception on the stand-in engraver, not in a browser. The 128-load browser sweep reads 0 overlapping with and without it. Accept the stand-in as sufficient grounds, or ask for a browser read of a height-only shrink first.

**Credit:** the pruning is the outside builder's (`f11cd7c6`); the checks it asked for were run here and published.

## Files to inspect

`app/src/score/WindowRenderer.ts`; `app/tests/unit/windowRendererStage.test.ts` (three cases, `FakeOsmdView.rise`); `docs/08-score-render-states.md` (invariant 40); `docs/08-test-map.md`; `docs/prompts/runs/U110a/` (the entry, the checks run for the outside builder, the final checks, the shrink measurement, the final sweep JSON).

## Not done, with the reason

See the entry's Not done lines.

## Do not re-review

The zoom gate and the conservative admission reserve (accepted, `responses/bbbdffb0.md`).
