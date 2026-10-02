### Entry 212 — U110 — rows the window grants never overlap at the frozen size: a drawn scale read at the wrong zoom, held by a spent reshape ladder

Brief: `docs/prompts/tasks/U110-granted-rows-never-overlap.md`. The ruling: `docs/review/responses/9e14839e.md` §3. The evidence: `docs/review/walks/walk-2026-10-02.md` finding 2 and `docs/prompts/runs/walk-2026-10-02/360x780/`. Base `3461cba9`. The harness: `operating-procedure.md` §14, port 5423, config copies under `app/build/u110/`. The machine blue-screened once mid-lane, a graphics-driver fault under browser load. The worktree's edits survived. After the restart, no Playwright run used more than two workers.

## Judgement

**Unverified on a device.** Everything here is Chromium on this machine at DPR 1, with the piano a MIDI mock, a mouse and the app's own face. **Nothing was heard.** **Pedagogical verdict: not applicable.** Nothing taught, judged or recorded changes; what changes is whether the music can be read. Every number below is this machine's.

**What a learner meets at 360 × 780 upright, piano connected, on Ode to Joy (hands together).**
- *Before*, on the committed renderer, most loads draw three rows at the two-row size (`before-360x780-reload-at-rest.png`).
  - Each row's ink runs about a quarter of its height into the row below.
  - The bass row's chord symbol (*C*, *G*) sits under the notes of the row above, and the fingering digits are doubled.
  - In a run the three rows stay through the fold, at every bar (`before-360x780-reload-playing-bar6.png`, the walk's `08-playing`).
  - A teacher would refuse the page.
- *After*, the fresh load and every reload draw two rows at the same two-row size. Each row's chord symbols and fingering stay in its own row (`after-360x780-reload-at-rest.png`, `after-360x780-fresh-at-rest.png`).
  - In a run, the greyed next bar comes in below as the window turns, as it does at 342 × 740 (`after-360x780-reload-playing-bar6.png`).
  - The bar being played always has the next bar on the glass.
- *What was given up*: at rest at 360 × 780 there is no third, greyed row under the first two bars, because it does not fit.
  - Two rows fill the stage at that size, and a third has nowhere to go but into them.
  - Nothing shrank. The drawn scale is the one the window had before, at rest and frozen in the run (`probe-run-before.txt`, `probe-run-after.txt`).
  - The look-ahead row still appears wherever it fits. Hot Cross Buns and the Nocturne at 360 × 780 keep theirs (`sweep-after.txt`).
- *Elsewhere*: 342 × 740, 390 × 844 and 412 × 915 draw what they drew before.
  - In the sweep, 120 of 128 loads drew the same shape and the same rows before and after.
  - Six of the other eight are the overlapping loads, now two clean rows each.
  - The last two are one Nocturne cell, opened and reloaded, whose last row moved by one pixel (`sweep-compare.txt`).

**Technical verdict.** The overlap had two causes acting together, both in the window plan. Both are fixed there, in `WindowRenderer.ts` alone. The brief's hypothesis was half right (below). The named case is red on the committed renderer and red with only the second fix part; it is green on the final. (g), *no row drawn into another*, holds in every window-rule cell. The mapped browser specs pass on the final at two workers (Verification).

## The mechanism

**The refuting test, as the brief set it.** For each granted row: its priced height, its slot pitch and its drawn ink, on fresh loads and reloads (`scripts-u110-probe.spec.ts`). For the probe only, the renderer was given a pricing log, removed afterwards.
- `probe-load-before.txt` reads every row.
- `pricing-log-before-reload1.txt` has, for one reload, every pricing pass, fit, shape change and packing.

- **At rest after the settle, the priced and drawn heights agree.** All three rows are priced at the drawn row, 274 px, on a 190 px pitch; each row's ink is 262 px tall. By the brief's own rule the cause is elsewhere. It is: the last pricing pass says *no look-ahead row*, and the shape on the glass has one.
- **The reshape ladder kept it.** `settleShape` lets the shape change only `MAX_SLOTS + 2` times per zoom, width and asked count (`mayReshape`).
  - In the log the sixth change was a grant, and the correction after it was refused (`shape -> 2 slots ... REFUSED, ladder spent`).
  - `packSlots` then gave three rows even shares of a stage two rows fill, so each row's ink ran into the next.
- **Why the plan kept granting a row and taking it back.**
  - The stage changed height three times as the header and bar laid themselves out: 698, 626, then 571 px. Each change set off an engraving search (`refitEngraving`, `searchForFit`).
  - The search re-engraves at a larger zoom it tries (1.81, 1.8, 1.65), fits the slots there, and then re-engraves at the zoom it keeps (1).
  - That last re-engraving runs `showStep` → `updateReadAhead` → the pricing pass, before the fit at the kept zoom.
  - The pass read the cursor slot's transform (`currentScale`, 0.887) as the drawn scale. That is a scale of the zoom-1.81 engraving, and it was multiplied by the piece's measurement at zoom 1.
  - So the window's rows came out at 170 px where they draw 298. A look-ahead row was granted on a stage the two rows already fill.
  - The fit at the kept zoom read the right scale and took the row back. Each grant and each correction spent a rung.
- **Why one load is clean and the next not.** The first shape takes one rung, and each search takes two.
  - Two searches end on a correction, which is clean. Three end on a grant, which is the overlap.
  - How many height changes the settling chrome makes is a matter of timing.
  - The named case's observer recorded it, on a build with only the second fix part, whose pricing is the committed pricing (`red-u110-case-on-the-guard-only-variant.txt`). The fresh load's rows went 2 → 3 → 2 → 3 → 2; every reload's went 2 → 3 → 2 → 3 → 2 → 3 → 2.
  - On the committed renderer the same case shows the fresh load clean after granting twice, and every reload ending on three rows (`red-u110-case-on-the-committed-renderer.txt`).
  - The walk's first load was clean, and so was the committed probe's (`before-360x780-fresh-at-rest.png`). The instrumented probe's first load ended on three (`probe-load-before.txt`).
- **The brief's two premises.**
  - *Priced at `drawnRowPx`*: refuted for this case. `drawnRowPx` was right at every pass, 274 or 298 px, the drawn row. The look-ahead row's price is the lesser of the window row's price and `drawnRowPx`, and it was the window row's price that was wrong.
  - *A stale measurement on a reload*: refuted as stated. Nothing carries from one load to the next. The stale value was a transform from a fit at another zoom, within one load.
- **The brief's mechanism is real elsewhere.** On Twinkle at 342 × 740, Bars 3, the chrome's first stage is 658 px (`pricing-log-twinkle-342x740-bars3-before.txt`).
  - Priced from the rows drawn, the look-ahead row is granted while it is not drawn: 2 × 204 + 199 + 48 ≤ 658.
  - Once it is drawn its own ink is the taller (204), so it is refused, and the cycle repeats until the ladder is spent.
  - On the committed renderer the spent ladder held three rows that do not fit for about 85 ms, across two more stage changes. It let go only because the engraving zoom then changed, which resets the ladder.
  - This is U113's Observation 1 hypothesis, observed on a different cell. U113's own cell (Twinkle at 360 × 780, Bars 3 and 4) is cleared by the zoom gate alone (`sweep-zoom-gate-only-360x780.txt`).

## The fix

Both parts are in `app/src/score/WindowRenderer.ts`, in the window plan's pricing and granting. No other code changes.

1. **The drawn scale is read only at the zoom it was drawn at.** `drawnAtZoom` is written by `fitSlots`, beside `drawnRowPx`, and read in `priceWindowShape` before `aheadFor`.
   - Off that zoom, the rows are priced as predicted: the piece's measurement times the scale the plan computes.
   - The fit at the zoom prices them again from what it drew, so T38's *priced as drawn* rule still holds (the Nocturne on a tablet upright).
2. **A spent ladder never keeps a look-ahead row that the rows drawn at this zoom have no room for** (`settleShape`, with `aheadMeasured` returned by `priceWindowShape`).
   - It applies when the plan's answer is the same window, the same systems and bars, with fewer slots, and that answer was priced from the glass.
   - A predicted *no room* does not take a row away, since the prediction prices the piece's tallest system and can be wrong the other way.
   - It only ever removes a row, so the ladder still ends.
   - The measured condition was added after the first version of the fix. That version took the row away on any answer, and the narrowing closes a path where a predicted answer could have lost a row that fits. Every browser result below is on the narrowed version unless it says *first version*.

**Each part alone.**
- *The zoom gate alone*, on the first version's build (`mutant-zoom-gate-only.txt`):
  - At 360 × 780 the plan grants no look-ahead row during any load, the ladder ends at its first rung, and every load draws two clean rows.
  - In the sweep it also clears Twinkle at 360 × 780 (`sweep-zoom-gate-only-360x780.txt`).
  - This part removes the mispricing.
- *The guard alone* (`mutant-ladder-guard-only.txt`; `red-u110-case-on-the-guard-only-variant.txt` on the narrowed version):
  - Every load still grants and takes back the row, and the ladder is spent; the guard removes the row at the end, so the glass ends clean.
  - The named case is red on it, because a row granted and taken back is drawn for a few frames on every load.
  - This part catches any flip that ends on a grant, whatever its cause. It is the only fix part for the self-referential flip above: the first version's log shows it ending Twinkle's flip at two rows at the spent rung (`pricing-log-twinkle-342x740-bars3-after.txt`).

## Tests

| Test | Class | Layer | What it asserts | Old assumption |
| --- | --- | --- | --- | --- |
| `score.window-rule.spec.ts` (g), in every cell (five shapes × three pieces × Bars 1, 2, 4, 8) | add | browser, the glass | no drawn row's ink, every painted mark including text, reaches into the ink of the row below | none: (a)–(f) never compared rows with each other |
| `score.window-rule.spec.ts`, *rows the window grants never overlap: Ode to Joy at 360 x 780 with the piano, fresh, on reloads and through a run (U110)* | add | browser, the glass and the stage's settle | on a fresh load and three reloads: no row drawn into another; no row granted and taken back while the stage settles; the same shape and size every time. Then a Wait run into its sixth bar, read at every bar it enters and once folded | none: the window-rule shapes are 342, 390, 740, 768 and 1024 wide, and no case read 360 × 780 with chord symbols, a reload or the settle |
| `readGlass`'s sheet ink | revise | browser | the sheet's ink box now carries top and bottom, skipping marks taller than the stage, beside left and right | ink was read across only |

**Red, then green.**
- On the committed renderer the named case fails seven ways (`red-u110-case-on-the-committed-renderer.txt`):
  - the fresh load granted the row and took it back (2 → 3 → 2 → 3 → 2);
  - each of the three reloads has two (g) faults, a row inked about 71 px into the row below, three systems on a 571 px stage.
- With only the guard, it fails on all four loads with *granted and taken back*.
- On the final it passes, and the whole window-rule file passes, 20 of 20.
- The case's settle observer first watched the root element, which does not exist yet when an init script runs, so it saw nothing. Corrected to observe the document, it was seen red on the guard-only variant before the green above. The mapped run below used the inert draft of the case. The case in its final form ran in the window-rule file's own run on the same build.

**The sweep** (`scripts-u110-sweep.spec.ts`; `sweep-before.txt`, `sweep-after.txt`, `sweep-compare.txt`).
- Four upright phones (342 × 740, 360 × 780, 390 × 844, 412 × 915) × four pieces (Ode to Joy hands together, Twinkle, Hot Cross Buns, the Nocturne op. 48 no. 1) × Bars 2, 3, 4, 8, each opened and then reloaded, piano connected: 128 loads.
- Before: 6 loads overlap, Ode to Joy at 360 × 780 Bars 2 and Twinkle at 360 × 780 Bars 3 and 4. That is U113's Observation 1, the spent ladder holding a greyed row.
- After: 0 overlap, on the first version and again on the final. The two runs drew the same 128 loads.

**The run probe** (`scripts-u110-run.spec.ts`; `probe-run-before.txt`, `probe-run-after.txt`).
- Ode to Joy, a Wait run to its end at 360 × 780 (fresh and reloaded), 342 × 740, 390 × 844 and 412 × 915, read at every bar and once folded.
- Before, at 360 × 780 every read overlapped: 63 px in the run, 72 at rest. After, none did.
- At the other three sizes, before and after are the same.

## Verification (the final, this machine)

- `npx tsc -b`: exit 0.
- `npm run lint`: exit 0, on the tree after the lane's temp folder (`app/build/u110/`) was deleted. While that folder existed, the same eslint run with it excluded was also exit 0.
- `npm run build:app`: exit 0.
- `npx vitest run`: 7638 passed, 4 failed (`unit-all.txt`).
  - Two of the four are `lessonClaimsAboutApp.test.ts` *blues.3* and *4.7*. Their predicates search `ScoreScreen.ts` and `style.css` for `\n`, and this worktree's checkout has CRLF line ends. This lane does not touch those files, and the same two failed on the first version's run.
  - The other two, `expectedNote.test.ts` and `sessionProtocol.test.ts`, timed out at 5 s under load; alone they pass, 18 of 18. Neither imports the renderer.
  - The renderer's own unit files (`windowRendererStage`, `pieceExtent`, `readAheadScale`) pass, 47 of 47.
- **The mapped browser specs** (`map-min.txt`, 28 files, each checked to exist), at two workers on 5423: 291 passed, 1 skipped (`e2e-mapped-specs.txt`). The skip is the spec's own, `score.density` *a narrow system on a phone is centred*.
  - A fresh worktree has no `-win32.png` screenshot references. They were written from the committed renderer: 15 written, then 15 of 15 against themselves. The final then matched them, 15 of 15 (`screenshots-and-fuzz.txt`).
  - The first version's mapped run: 275 passed, 15 failed for want of those references, and 1 failed, `score.fuzz` seed 4 at 390 × 844. That one has U123's recorded signature, the band at x 153 while Hear it plays. It is recorded pre-existing (red on `1cadc4dc`, a tree without this lane). Solo it passed 3 of 3 on the committed renderer and 3 of 3 on the final, and it passed in the final's mapped run.
- **The state gallery** (`npm run states`' spec on a config copy at 5423, 60 cells; `states-gallery-final.txt`, `states-gallery-committed.txt`, `gallery-compare-*.txt`).
  - The committed renderer and the final show the same two *new breakage* cells:
    - `theme--light`: `#score-waiting` and `#score-help-more` at a 4.3:1 contrast;
    - `rotation--bars1-real-phone`: music is 39 % of the stage.
  - Neither is this seam.
  - Committed against the first version: 57 of 60 cells identical in shape, look-ahead and music share. The other three differ only in music share. Two of them have the same slots, scale and rows, with the chrome folded at a different moment of the shot. The third, `pickup--bar-count`, settled at another engraving zoom.
  - That zoom differs between loads on the committed renderer itself (`pickup-committed.json`): Happy Birthday at 360 × 780 settles at zoom 1 on a fresh load and 1.6 on reloads, drawn about 4 % smaller fresh. The final does the same (`pickup-final.json`).
  - The old U110 gallery cell, `end-of-piece--grand-staff`, is two rows, the same in every run.

## Done

- The mechanism found, with the measurements that told it apart (above; `pricing-log-*.txt`).
- The fix in the window plan's pricing and granting: two parts, each run alone, the second narrowed to measured answers.
- Red first at 360 × 780 on reload, and on the fresh load's settle. Green after on the fresh load, on reloads and through a run.
- (g) added to every window-rule cell, and the named U110 case added.
- Pictures at 360 × 780, before and after: at rest on a reload, in a run at bar 6, and the fresh load. Also 342 × 740 after (`before-*.png`, `after-*.png`).
- Docs:
  - `docs/08-score-render-states.md`: invariant 40, and the look-ahead sentence in §4.1;
  - `docs/04-ui-spec.md`: the greyed row's paragraph;
  - `docs/08-test-map.md`: the `score.window-rule` row.

## Not done

- **On a device**: not done. No phone is attached to this process. The owner's phone is the reference, and nothing here was seen on it.
- **The self-referential look-ahead price is not removed at its source.** The look-ahead row priced from `drawnRowPx`, which includes it when drawn and not otherwise, still flips while Twinkle's chrome lays out at 342 × 740. The guard makes the flip end without the row, but it still spends the ladder and re-engraves during the settle.
  - Removing it means pricing the row from a measurement that does not depend on whether it is drawn. For example: the row's own drawn height, remembered for the bars it holds at this zoom. That changes the *costs the window nothing* rule's input, and it is left to a seam that can weigh it.
- **No test pins the guard.** The only place it was measured acting is that transient at Twinkle's first stage, and no case reads the transient. The named case cannot read it there either: on the final, Twinkle's flip still grants and takes back the row.
  - A search for a settled stage where the flip decides the end state found none: Twinkle Bars 3, 342 wide, heights 840 to 900 px in 4 px steps, guard removed (`heights-twinkle-bars3-342-wide-guard-removed.json`).
  - Removing the guard leaves every test green.
- **No jsdom unit case** for either part. The browser case pins the zoom gate: it is red with the gate removed.

## Follow-ups

- **U113's Observation 1 is this defect.** Twinkle at 360 × 780, Bars 3 and 4: a greyed row kept by a spent ladder, its chord symbols against the fingering above. It is red before and clean after in the sweep, cleared by the zoom gate. Its hypothesis, a look-ahead row priced from the rows drawn, is observed here on Twinkle at 342 × 740 in the settle and covered by the guard. U113's note can close on this entry; the orchestrator's call.
- **The settling stage does not always end at one engraving zoom.**
  - Happy Birthday at 360 × 780 is drawn about 4 % smaller on a fresh load than on a reload, on the committed renderer and on the final.
  - On the guard-removed build, Twinkle at Bars 3 and 342 × 864 drew two rows at zoom 1 when opened and three rows at zoom 1.36 on reload.
  - No overlap either way, but *a fresh load and a reload draw the same window* does not hold there.
  - The engraving search runs once per stage height while the chrome settles: three times on Ode to Joy's load, each a re-engraving at two zooms.
  - An observation for CL07's whole-screen model, or U74's *the same from every path in*. Not a row from this lane, and outside the window plan's granting.
- **U110's old gallery race** (`end-of-piece--grand-staff`, 1 of 2 runs on U32's tree): not reproduced in three gallery runs here. Whether that red run was this mechanism is not established.
- **Two gallery cells are red on the committed renderer** (`theme--light` contrast and `rotation--bars1-real-phone` music share). They are pre-existing on this base and not this seam; recorded so the orchestrator can check whether a row already holds them.

## Questions

None for the owner.

For the reviewer:
- Part 2 changes `settleShape`'s rule, *the drawn shape when the ladder is spent*, in one direction and only on a measured answer. Is that inside the ruling's narrow fix?
- It is kept because part 1 removes only the mispricing measured here. The self-referential flip, observed in Twinkle's settle, would otherwise be able to end on three rows that do not fit, and held three for about 85 ms on the committed renderer.

## Files

- `app/src/score/WindowRenderer.ts`:
  - `drawnAtZoom`, declared beside `drawnRowPx` and written in `fitSlots`;
  - `drawnHere` and `aheadMeasured` in `priceWindowShape`, and `aheadMeasured` in its return type;
  - the guard in `settleShape`, called with the flag by `chooseWindowShape`;
  - their comments.
- `app/tests/e2e/score.window-rule.spec.ts`: (g) and `rowsDrawnIntoEachOther`, the ink's top and bottom in `readGlass`, and the U110 case with its settle observer.
- `docs/08-score-render-states.md`, `docs/04-ui-spec.md`, `docs/08-test-map.md`.
- This folder:
  - pictures, probe and sweep summaries, pricing logs, the red logs, gallery and unit summaries;
  - the probe scripts (`scripts-*`). They are records; they ran from `app/build/u110/`, a pricing log was compiled into the renderer for the instrumented probes, and both are deleted.

**Orchestrator's note at the landing (2026-10-01).** U110's worktree committed by name (bbbdffb0) and merged (407d58e1). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U110/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0; states 1 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner — the states gallery's only red is `U62`'s recorded contrast measurement, red before this seam; `runs/U110/orchestrator-exit.txt`). Dispatched at `3461cba9` under the reviewer's ruling (`responses/9e14839e.md` section 3): rows the window plan grants never overlap at the frozen size, never by shrinking below the floor or dropping look-ahead unconditionally; U110 alone owns the overlap fix.. U110 landed: rows the window grants never overlap at the frozen size; the slot priced from a zoom the search only tried and the reshape ladder that ran out on a grant, both fixed in the window plan

## Doc rows

- `docs/08-score-render-states.md` §9: a new group **Rows**, invariant 40, *Rows never overlap*, with the two mechanisms and the two fix parts. §4.1's look-ahead sentence now says a row that does not fit is never drawn into the others.
- `docs/04-ui-spec.md` §5, *The next row never sizes the window*: the greyed row is drawn only below the window's rows, never into them.
- `docs/08-test-map.md`, the `score.window-rule.spec.ts` row: U110's (g) and the named case with its settle observer, red on the committed renderer and on the guard-only variant.
