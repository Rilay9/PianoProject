### Entry 222 — U110b: U110a's packing exception reached in a browser, kept, and what it earns there

Lane U110b, a fix-forward on U110a (Entry 218); brief `docs/prompts/tasks/U110b-the-earning-state-in-a-browser.md`; the reviewer's required change `docs/review/responses/eddd5c95.md`. Cut from origin's head `06df5891`. `app/src` is unchanged: the renderer is U110a's, byte for byte (`git status` shows nothing under `app/src`). Every figure below is this machine's (Chromium at device pixel ratio 1, one engine, one font stack); the relationships are the claims.

## Judgement

- **Reachable: yes, by a real event, on a phone upright.** Twinkle (`song.folk.twinkle.ht`) with three Bars at 342 wide, opened at a viewport 865 or 866 tall, lands on the state on every load measured (16 of 16; 864 reaches it on 5 of 8, 867 on none, 868 lands on a different shape, below). Then the viewport's height alone is made shorter, which is a phone's browser bar. All five facts of the required change were read on the real renderer, with the exception in place: the look-ahead row is drawn and the ladder is spent (`shapeChanges.n` at the bound, keyed at the zoom drawn); the stage shortens while the width, the asked bars and the ladder's record are the same; the three rows fit before (packed from the top, a gap of 24 between boxes, 650 of 657 px) and fail the packing test after (the same rows at their own heights with the gaps are over a stage 35 or 95 px shorter, and the window rows are drawn at the same size, 199 px each); the look-ahead row drops, the two window rows stay where they were (boxes and ink within a pixel by the case's tolerance; the probes read at most 0.2 px), and their ink neither overlaps nor leaves the stage.
- **What the exception earns in a browser is small, and that leads because it bears on whether it stays.** With the exception removed the same shortening also ends on two clean rows. The engraving search that the same stage change sets off re-engraves at a smaller zoom in the same frame; that resets the ladder's record to the new zoom and lets the drop through. In the frame probes (six shortenings per tree) no frame was painted with ink over the next row's or past the stage's foot in either tree. What differs is that without the exception the window is re-engraved: after the 35 px shortening the music ended 5 px low in one probe (zoom 1.19) and sat 5 px low for a single frame (33 ms before the next) and then returned in another (zoom 1.2, then 1.79); after the 95 px shortening it ends 4 to 5 px from where it was; and in every case the ladder's record is reset. So the committed case is red without the exception on the packing test's own mechanism (the ladder's record) and, at 95 px, on the window moving, not on a worse end picture. The stand-in's overflow (ink running into the next row for good) is not what the browser shows on this cell; that exposure is stand-in-only here. By the required change's own sentence ("a stand-in-only exposure does not earn production branching") that is an argument for removing the exception; by its other sentence (reachable: keep and prove) it stays. I kept it, because the state is reached and the brief's condition is met, and I say plainly that the browser value is the window not being re-engraved, with the removal's cost listed under Open. **The keep-or-remove question is the reviewer's** (a product-behaviour and architecture choice: a first-line guard the engraving search backs up).
- **Product look.** I looked at the five pictures (below): before, and after at both shortenings with and without the exception. At 622 and 562 px the stage holds the two window rows and about 200 px or 140 px of empty stage below them, the third row not fitting (a row and its gap need 228 px) — the rule's "next music in view when it can be" says it cannot be. The two trees' end pictures are the same to the eye. Nothing was heard; nothing taught or judged musically changes (pedagogical verdict: not applicable).
- **Where the brief was wrong.** Its state includes "engraving zoom fixed". In the browser the zoom after the drop is not fixed by anything the exception does: after it drops the row the search may try a larger zoom for the two rows left and keeps it or goes back, depending on the engraver (1.36 or 1.79 for a 1 px difference in the stage). The first version of the case asserted the zoom and was red on the real renderer's own tree in 5 of 10 runs (the 35 px case every time); the zoom assertion is gone, and the ladder's record carries the claim (it is the same in all 20 of the exception tree's runs of the later versions, and reset in all 12 of the other tree's).

## The state, and how it is reached

By real events only; nothing was injected into the renderer. **Height-changing paths driven:** the viewport's height (`setViewportSize`: a phone's browser bar showing or hiding), to the shortenings below. **Not driven:** the chrome that changes height (the header growing a line, the keyboard strip) and a refusal line; the viewport path reached the state, so they were not needed.

| Open height (342 wide, Bars 3) | Loads reaching "look-ahead drawn, ladder spent" | Shape on the glass |
| --- | --- | --- |
| 864 | 5 of 8 | 3 rows (2 window, 1 greyed) |
| 865, 866 | 8 of 8, 8 of 8 | 3 rows, packed, fitting by 6.6 and 7 px |
| 867 | 0 of 8 | 2 rows, ladder not spent |
| 868 | 8 of 8 | three window rows (3 systems), no greyed row: not this state |

(`opens-twinkle-342-864-868.txt`.) Why 865 and 866: the plan prices the window's rows at the piece's tallest system and the look-ahead row at its own drawn ink, so a stage a few pixels either side of the three rows' sum grants the row while it is not drawn and refuses it once it is; the ladder runs out after a few flips, with the row on the glass when the answer is flipped last (`checks-3203626b.txt` in `runs/U110a/` traced the same flip at 342 × 740 during load).

**The shortening, probed** (`shrink-with-exception-from-866.txt`, `shrink-without-exception-from-866.txt`; one fresh load per height from 866, polled every 100 ms):

| Viewport shortened by (to) | With the exception | Without it |
| --- | --- | --- |
| 14 to 36 px (852, 850, 846, 840, 830) | 2 rows; ladder record 6 at 1.36 in every one (untouched); zoom 1.36, except 1.85 at 852 | 850, 840, 830 only: 2 rows, zoom 1.23, 1.21, 1.19, record reset to 1 at that zoom |
| 46 to 76 px (820, 810, 800, 790) | 2 rows; record 6 at 1.36; zoom 1.76, 1.73, 1.7, 1.67 | 790 only: 2 rows, zoom 1.67, record reset (1 at 1.12) |
| 96 and 116 px (770, 750) | 2 rows; record 6 at 1.36; zoom 1.36 | 770 and 750, three loads each: 2 rows, zoom 1.08 and 1.04, record reset; 730: zoom 1.5, reset |
| 4 to 11 px (862, 858, 855) | 862: 3 rows held (they still fit), record reset, zoom 1.88; 858 and 855: 2 rows, zoom 1.25 and 1.24, record reset at the new zoom | not probed |

(The polls at 7 ms in the second file show 3 rows with the stage already shorter and the boxes not yet repacked: that is a sample between the layout change and the renderer's resize observer, never a painted frame.) **The frames** (`frames-with-exception.txt` and `frames-without-exception.txt`, from 866 to 831 and 771; `frames-865-with-exception.txt` and `frames-865-without-exception.txt`, from 865 to 830, 770, 770 and 750; a sample taken in a task queued from every animation frame, 91 to 94 frames per shortening): in both trees the first frame at the shortened stage is already two rows. Without the exception the first such frame can be the re-engraved one (zoom 1.2, ink 5 px low, 33 ms), then the zoom the search ends on. No frame in either tree had a row's ink over the next row's or past the stage's foot. The pictures: `docs/prompts/pictures/u110b/` (`before-342x866-three-rows-spent-ladder.png`, `after-with-exception-342x831.png`, `after-with-exception-342x771.png`, `after-without-exception-342x831.png`, `after-without-exception-342x771.png`), and the row boxes, before and after, in the frames files (box top and height and ink top and bottom per row, stage height, slots, zoom, ladder record).

## The cases

`app/tests/e2e/score.window-rule.spec.ts`, two cases (the stage 35 px and 95 px shorter), one body: Twinkle, Bars 3 set before the page opens, 342 wide. It finds the open height by opening from 870 down to 862 until one lands on the state (a band with none fails the case as a premise, naming each height tried), reads the three rows' boxes and ink, and asserts the premise (two window rows and a greyed row, packed from the top with a gap between each, their sum under the stage, no ink overlapping or past the stage). It then shortens the viewport and settles, and asserts: the stage is the stated amount shorter and the asked bars unchanged; the rows that were drawn are over the shortened stage; the look-ahead row is dropped (two rows, none greyed); the ladder's record equals the one before (soft); each window row's box and ink are within a pixel of where they were (soft); no row's ink in the next row's or past the stage's foot. Before and after pictures are attached to the case's report. The zoom is deliberately not asserted.

| Tree | 35 px | 95 px | Red lines |
| --- | --- | --- | --- |
| Final spec, exception in place (U110a's renderer) | 5 of 5 green | 5 of 5 green | none |
| The same renderer with the packing branch made unreachable (`if (false && rowsOverflow && …`), built to its own folder, the source put back byte for byte (sha256 `27a1e0e6…` before and after) | 5 of 5 red | 5 of 5 red | the ladder's record (reset to the zoom re-engraved at) in all ten; in the one run with every assertion soft, also the window rows' ink 3.8 to 4.8 px off in the 95 px case, and none in the 35 px case |

The ten red runs used the spec before the two mechanism assertions were made soft (the ladder's record was a hard assertion then, so only it was reported); the soft run is the one that lists the ink lines. The files: `case-final-exception-5-repeats.txt` (the final spec, with the exception), `case-with-exception-5-repeats-before-soft.txt` and `case-without-exception-5-repeats-before-soft.txt` (the spec before the soft change), `case-without-exception-1-repeat-all-assertions-soft.txt`. A first version carried a frames assertion (no painted frame at the shortened stage with a third row or ink out of place); it is removed because it was green in both trees and gave one false red in ten runs (the sampler forced a layout between the viewport change and the observer), so it proved nothing about the exception and cost a flake.

## Checks run

| Check | Result |
| --- | --- |
| `npx tsc -b` (from `app/`) | exit 0 |
| `npx eslint tests/e2e/score.window-rule.spec.ts --max-warnings=0` | exit 0 |
| `npm run lint` (from `app/`, after the lane's build folders were removed; with the no-exception build still under `app/build/` it reports thousands of errors from that bundle, none in tracked files) | exit 0 |
| `windowRendererStage.test.ts` (unit, unchanged) | 38 passed, exit 0 |
| The two new cases, port 5473, `--workers=1`, 5 repeats each, with the exception | 10 passed, exit 0 |
| The same cases on the no-exception build | 10 failed (as above) |

Not run: the rest of `score.window-rule.spec.ts` and every other browser file (the renderer is unchanged and the cases added are independent of the others: the file's helpers are only read), the full unit suite, any other piece, width, Bars or Size, and any device. Playwright runs shared the machine's lock (`<home>/repos/pw-lock`), and the first waited about eleven minutes for it.

## Open

- **Keep or remove the exception (the reviewer's).** What removal would change: delete the `rowsOverflow` branch in `settleShape` and its argument through `chooseWindowShape` and `fitSlots` (`rowsFitStage` stays, `packSlots` uses it); the unit file's overflowing case (`it.each` over 700, 600 and 560 px) goes green only if it asserts the held shape, so it is deleted or re-pointed to the held state, and the fitting case stays; invariant 40's last paragraph and the test-map rows return to the stand-in-only reading; the two browser cases here are deleted (their premise assertions stay true, their mechanism assertions are the exception's). Cost of keeping: one branch and an argument threaded through two callers that holds no state of its own.
- **HYPOTHESIS: a cell where the pruned tree holds an overflowing third row at rest.** The search stays silent when the shortening leaves a slot's share of the stage within its tolerance (8 per cent) of the engraved height, and the rows overflow by less than that: a band a few pixels deep. On Twinkle at 342 it is empty by about a pixel (three rows at their own heights sum to 650, the search fires below 651), which is why the pruned tree self-heals there. It is non-empty wherever the drawn rows are taller against the engraved row than here. The test that would refute it: find a piece, width and Bars where, with the exception removed, a ladder-spent three-row state shortened by height alone settles on rows whose ink overlaps or leaves the stage. Not searched; the lane's scope is phone upright and the one piece. If one is found, it is the browser case that earns the exception.
- **No one in this process can decide whether a learner meets the state.** It sits at the edge of the look-ahead row's grant (a stage within a few pixels of three rows' sum) for a piece, width and Bars; 342 × 865 is a tall phone viewport for this piece. Whether the owner's phone sits at such an edge on pieces they open needs a device.
- Adjacent, classified (an observation, no row): at a stage that holds the two window rows and not a third, the empty stage below them (200 and 140 px here) is by rule and the same in both trees.

**Orchestrator's note at the landing (2026-10-02).** U110b's worktree committed by name (8d391dfa) and merged (063e0a88). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U110b/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/U110b/orchestrator-exit.txt`). Dispatched at `06df5891` as U110a's required change, under the accepted contract.. U110b landed: the state that earns U110a's packing exception, reproduced in a real browser; the exception kept

## Doc rows

`docs/08-test-map.md` (the `score.window-rule.spec.ts` entry, a U110b sentence after U110a's); `docs/08-score-render-states.md` invariant 40 (the "read only on the stand-in" paragraph replaced by the browser reading, and the sentence that said no browser case holds the exception). Not touched: `docs/pending-review.md`, `docs/prompts/in-flight.md`, the backlog, the task's Record lines.

## Files

- `app/tests/e2e/score.window-rule.spec.ts` (`PackedRow`, `Packing`, `readPacking`, `inkFaults`, and the two cases)
- `docs/08-test-map.md`, `docs/08-score-render-states.md`
- `docs/prompts/pictures/u110b/` (five pictures)
- In `docs/prompts/runs/U110b/`: `ENTRY.md`; `opens-twinkle-342-864-868.txt`, `shrink-with-exception-from-866.txt`, `shrink-without-exception-from-866.txt`, `frames-with-exception.txt`, `frames-without-exception.txt`; the case summaries (`case-*.txt`); the probe scripts (`scripts-*`), kept for rerunning
