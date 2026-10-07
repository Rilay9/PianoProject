### Entry 218 — U110a: the terminal exception replaced by a packing test, and two unit cases that hold both halves of it

Lane U110a, a fix-forward on U110 (Entry 212); brief `docs/prompts/tasks/U110a-prune-the-terminal-guard.md`; the reviewer's required change `docs/review/responses/bbbdffb0.md`. Base: `cd6a62ee` for the code; this branch was cut at `345ffda4`. The pruning of U110's exception is the outside builder's, commit `f11cd7c6` on `chatgpt/u110a`, brought in as its `app/src` diff over `cd6a62ee`. The sweep, probe and run measurements of that pruning are the published checks `checks-f11cd7c6.txt` and `checks-3203626b.txt` in this folder. The packing exception, the unit cases, the mutants, the spec and test-map edits, the sweep and window-rule runs on the final tree and this entry are this branch's. Two passes: the first stopped at the pruning and recorded an open exposure; the second built the narrowed exception on the coordinator's instruction, which `bbbdffb0.md` had pre-authorised in this shape.

## Judgement

- **The reviewer's reading is right against the code.** `aheadFor` prices the window's rows at the piece's tallest system and caps only the look-ahead row at the rows drawn; `aheadMeasured` held matching shape, matching zoom, a positive transform and a positive `drawnRowPx`, none of which says the rows overflow. U110's exception treated a refusal from that reserve as proof they do.
- **The final code keeps the pruning and puts a different test in the exception's place.** After the ladder has run out, `settleShape` returns the drawn shape, a look-ahead row included, unless the rows drawn, each at its own drawn height with the gaps between, are no longer under the stage's height (`rowsFitStage`, which is `packSlots`' own test); then it drops the look-ahead row. It only ever removes that row, so the ladder still ends, and it stores nothing: the fit that has just drawn the rows passes the verdict down as an argument.
- **Both halves are held on the stood-in engraver, red where they should be.** The fitting case (a stage the three rows fit and the reserve refuses) keeps its row; the overflowing case (that stage shortened by height alone after the ladder ran out) drops it. See the cases below.
- **What earned the exception is the stand-in's overflow, not a browser reading.** The browser instruments read 0 of 128 loads overlapping without it (published) and again with it (this branch's sweep: 0 of 128, same shape in 128 of 128 against the published pruned-only run). The overflow state itself was not read in a browser: no browser case here holds a height-only shortening after a spent ladder. Its browser behaviour is unverified.
- **Unverified as a picture.** No pixels were looked at in this lane and nothing was heard. The unit cases read wrapper boxes and ink on a stand-in; the browser files read ink in every cell. Nothing taught or judged musically changes (pedagogical verdict: not applicable).

## The code

`app/src/score/WindowRenderer.ts`, on top of `f11cd7c6`'s pruning:

- `rowsFitStage(entries)`: the stage's height less the folded chip's band, against the sum of the entries' heights plus the gaps; the exact test `packSlots` made inline, now shared (`packSlots` calls it; its behaviour is unchanged).
- `fitSlots` packs the rows it has just fitted, asks `rowsFitStage` of those same rows and passes `rowsOverflow` to `chooseWindowShape('slots', rowsOverflow)`; `settleShape(…, rowsOverflow = false)` drops the look-ahead row only when the ladder is spent, the answer has the same systems and bars, and fewer slots than are drawn.
- The other caller of `chooseWindowShape` that can reach a spent ladder (`updateReadAhead`) passes nothing, so it holds the drawn shape as `f11cd7c6` does. The reason is a reading of the code, not a case: a pack stored earlier could predate the stage that call sees, and a drop made on it could not be undone by a spent ladder. No stored state was added; `lastPack` is read by nothing new.
- The zoom gate (`drawnAtZoom`, `drawnRowPx`), `aheadFor`'s reserve, `mayReshape`/`canReshape` and the ladder bound are untouched.

## The cases

`tests/unit/windowRendererStage.test.ts`, describe "a spent reshape ladder keeps the look-ahead row the drawn rows leave room for, and drops one they do not (U110a)". The stood-in engraver gained a per-bar rise (`FakeOsmdView.rise`, empty in every other case, reset in `beforeEach`). One fixture: two bars asked over bars 22 engraver units wide at 342 px, so each bar is a row; every bar from the third on is taller, so the tallest system is the look-ahead row's and the window's rows draw shorter than the reserve they are priced at.

1. **The fitting case.** Stage 820, never changed. Asserts, in order: the fit finished; the ladder ran out (n of at least `MAX_SLOTS + 2`); the greyed third row is on the glass; no row's ink reaches into the ink below and the last row's ink ends on the stage; three rows at the reserve are over the stage and the chooser's own read-out for the drawn count says no room.
2. **The overflowing case**, `it.each` over 700, 600 and 560 px. Opens as case 1, asserts the same three rows and the spent ladder as its premise, shortens the stage by height alone, lets the observer refit, and asserts: the ladder's record is unchanged (nothing was counted against it, so only the exception can have changed the shape); no row's ink reaches into another's and the last ends on the stage; the shape is bars `0-0` and `1-1` without the greyed row.

| Tree | Fitting case | Overflowing case (700, 600, 560) | The file |
| --- | --- | --- | --- |
| final | green | green, green, green | 38 passed |
| the outside builder's pruning, no exception (`f11cd7c6`'s code) | green | **red, red, red**: row ink runs into the next row (at 700 the look-ahead row's ink into the second row's, at 600 and 560 the first row's into the second's) | 3 failed, 35 passed |
| HEAD, U110's `aheadMeasured` guard | **red**: "the third row was taken away" (rows 0-0 and 1-1 only, ladder n 6) | red at their premise: the guard has already dropped the row on the first stage | 4 failed, 34 passed |

The 34 cases that were there before pass on all four trees: the stand-in's change is neutral to them.

## The two mutants

Both are the final tree with one change, each swapped in as a whole file for one run and the final file put back byte for byte.

- **M1, the old guard where the packing test goes** (`aheadMeasured`'s condition passed as the argument in place of `rowsOverflow`): the fitting case catches it (red, "the third row was taken away … would end at 779 of a 820 px stage"); the overflowing cases go red at their premise as on HEAD. 4 failed, 34 passed.
- **M2, no exception at all** (the packing branch made unreachable, which is the outside builder's pruning again): the overflowing cases catch it, all three (ink runs into the next row); the fitting case stays green. 3 failed, 35 passed.

## Checks run on the final tree

| Check | Result |
| --- | --- |
| `npx tsc -b` | exit 0 |
| `npm run lint` | exit 0 |
| `windowRendererStage.test.ts` | 38 passed, exit 0 |
| `score.window-rule.spec.ts`, port 5473, `--workers=1` | 20 passed, 0 failed, 0 skipped, exit 0; includes the named Ode case (U110) |
| U110's `u110-sweep.spec.ts` (rehydrated, port 5473, `--workers=1`) | 16 of 16 passed, exit 0; 128 loads, none with `overlapPx` over 0.5 (max −21, min −37); same slots, systems and shown as the published pruned-only sweep in 128 of 128 loads, same rows in 127, same ladder count in 123 |

The one cell whose rows differ from the published run is Ode to Joy at 412 × 915, Bars 8, reload: same shape, ink positions and ladder count (2 there, 6 here) differ. That cell differed between the archived sweep and the published one as well (`checks-f11cd7c6.txt` section 2.2), so it varies with the load, not with this change; it is a reading, not proved to be unrelated. The sweep says the exception changed no drawn shape in these 128 loads; it says nothing about a shortened stage. Commands, exit codes and logs: `checks.txt`; raw sweep JSON: `sweep-final-*.json`; the first pass on the pruned-only tree: `checks-pruned-only.txt`. Every figure is this machine's.

Not run: the full unit suite, the other Playwright files, the run probe and the fresh-and-reload probe on this tree (the published `checks-f11cd7c6.txt` ran them on the pruned-only tree, whose renderer differs from this one by the packing exception), the overflow state in a browser.

## Where the brief was wrong

- Step 4 offered "Twinkle 342 × 740 Bars 3, or the case the trace shows". The trace shows a transient, and the "650 fits" figure is the sum priced at the drawn rows (`checks-3203626b.txt`, "window rows priced at the drawn height"), with no ink read at that pass. Neither is a rest state a browser case could hold, so both cases are on the stand-in.
- The figures 658 / 650 / 660 are the reviewer's, from U110's earlier trace. The admission trace measures 658.4 for the room, 659.8 for the plan's sum and 650.3 priced at the drawn rows, at one pass: a refusal by 1.4 px, so the margin is the whole case.
- "No residual" was judged by browser reads at rest, on open and on reload. Those cannot show a height-only shortening after a spent ladder, the other state the old exception covered. The brief's two branches (prune, or keep a narrowed exception) were not exclusive: the right code was the prune of the measured-row condition plus a packing condition.

## Open

- **The overflow state is read on the stand-in only.** Whether a learner meets a height-only shortening after a spent ladder, and whether the exception then leaves a readable window in the browser, needs a browser read of that state (a spent ladder such as Twinkle at 342 × 740, Bars 3, then the stage shortened with the zoom held). **No one in this process can decide whether the transient is visible to a learner**; it needs a device or a picture.
- **A retained look-ahead row sits close to the row above it on the stand-in.** In the fitting case's stage the look-ahead row's ink starts 1.3 px below the second row's ink (read by the first pass's scratch spec, the 820 line of `shrink-after-spent-ladder.txt`, on the pruned-only tree; the final tree's case asserts only that the gap is not negative). By reading `placement` and `packSlots`, not by a test: each row's stave is anchored to the piece's tallest ink above while `packSlots` stacks by each row's own height, so a row with less ink above than the piece's tallest sits lower than its pitch says. The stand-in's rise (30 px at its zoom) is much larger than the 5 px between the reserve and the drawn rows in the traced Twinkle load, so the browser's gap will be larger; it was not read. The cases assert no overlap, not a gap. Classified as a question for the layout owner, not changed here.

## Doc rows

`docs/08-score-render-states.md` invariant 40 rewritten to the final code; `docs/08-test-map.md` rows for U110 and `windowRendererStage.test.ts`. Not touched, left to the record's owner: `docs/pending-review.md`, `docs/prompts/in-flight.md`, `docs/prompts/backlog-2026-09-25.md`, the task's Record lines.

## Files

- `app/src/score/WindowRenderer.ts` (the pruning from `f11cd7c6`, `rowsFitStage`, `settleShape`'s packing exception and its doc comment, `fitSlots`' argument)
- `app/tests/unit/windowRendererStage.test.ts` (the two cases, `FakeOsmdView.rise`)
- `docs/08-score-render-states.md`, `docs/08-test-map.md`
- In `docs/prompts/runs/U110a/`: `ENTRY.md`, `checks.txt`, `checks-pruned-only.txt`, `shrink-after-spent-ladder.txt` (the scratch measurement that earned the exception), `sweep-final-*.json` (16 cells)
