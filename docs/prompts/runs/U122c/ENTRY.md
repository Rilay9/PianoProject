### Entry 216 — U122c — the Score screen shows each moment what it needs, on three devices

Lane U122c: a build. Brief `docs/prompts/tasks/U122c-the-score-screen-per-moment-on-three-devices.md`, approved at `docs/review/responses/adb0873a.md` §1, resting on `responses/e070d238.md`. Worktree cut at `af18a3ae`. Port 5453 from a config copy under `app/build/u122c/` (kept here as `scripts-playwright.u122c-5453.config.ts`), two workers throughout. The outside builder's red seed (its branch at `44fd5fd2`) and the coordinator's run of it on the base (`docs/prompts/runs/U122c/checks-44fd5fd2.txt` and `pictures/u122c/before-{568x320,342x740,1024x768}-*.png`, in the main checkout) were read before anything was built.

## Judgement

**Unverified on a device:** this machine's Chromium only, and every pixel count and cell count below is this machine's. **Nothing was heard; no musical judgement is made.** Pedagogical verdict: not applicable, except where a control's or a sentence's place changes what a learner can do — ⏸ and ▶ on the glass, the count off the entrance notes, the next step on the finished sheet.

**What a learner meets now, per moment and device** (the walk, every step a real tap or a MIDI note):

| Moment | Phone sideways (c6) | Phone upright | Tablet |
| --- | --- | --- | --- |
| At rest | a thin top line: the name, `bar n / m`; one row: Back, the status, ▶, `Hear it`, the mode (whole), Hands, the tempo, ⋯ | the header and the row, as before | the header, the side panel and the row, as before |
| Count-in | the row folds to ⏸ in ▶'s place at once; the count, large, right of ⏸ in the row; the music untouched | the same; the header keeps its box, its Back, name and mode name not drawn, `bar n / m` and the beat dot drawn | the same |
| Holding for the first note | ⏸ alone; the cue in the name's place | ⏸ alone; the cue on the header's state line | the same |
| Playing | ⏸ alone; the top line says `bar n / m` and what the run says | ⏸ alone; the header says `bar n / m` and what the run says | the same |
| Paused | the row back whole, ▶ in its place; the name back; the generic paused line on neither surface (▶ says it); a pause with a cause says it in the name's place | the header and the row whole; the header's state line as before | the same |
| ▶ refused | the sentence in the name's place, bold, accent colour, `bar n / m` beside it or yielded whole; the row unchanged | the sentence on the header's state line, which takes the mode name's line, so the header keeps its height | the same |
| Finished | X46's sheet in two columns: the outcome and the figures left, the actions right from the top, the recommended one first | one column, as before (already in view) | one column, as before |

**The music no longer moves between moments on any device measured**, and no chrome lies over the notation a moment needs. Sideways the music moved 22 px at the fold; upright it jumped up by the header's height at the fold; on a tablet it grew at ▶ (about a fifteenth) and the reopened bar would have covered its foot. Now the music's top edge stays within a fraction of a pixel from rest through the refusal in every cell (§ Acceptance).

**Per device, what changed and why; what was retained:**

- **Shared (every device):** the fold keys on the task, through one pure function (`scoreChrome.ts`, `chromeFor`): while the hands are on the keys (counting in, holding, playing, a demonstration) the controls fold to one direct control in its own place, ⏸ or *Stop*; paused, refused, at rest and finished, nothing folds; a tap on the music peeks for 3 s. The count leaves the stage for the row beside ⏸. The beat dot leaves the music's corner for the surface that names the bar. The chip over the stage is gone. The tap floor is drawn in pixels as well as rem.
- **Phone sideways:** c6 per state, as settled (`docs/design/score-bar-layout.md` §10.3). The top line is the chip's folded form (one box, so `bar n / m` never moves); the row is flush; the refusal never enters the row (U120); U122's chooser, smaller, keeps the selected mode whole (U121); the finished sheet uses its width.
- **Phone upright:** today's surfaces retained (the header, the row, the sheet). Changed: the header keeps its box through a run (the music jumped up 32–48 px at the fold on the phones, 59–63 px on the tablet-sized cells the app lays out upright, and the state rule would have made it jump at every pause); the stage keeps the bar's row through a run (it bought nothing upright); the dot beside `bar n / m`; the count beside ⏸; a refusal takes the mode name's line. The row is the chooser's wherever that keeps today's controls, and today's row where it would not (the open trade, below).
- **Tablet:** today's surfaces retained (the header, which never folded, the side panel, the row, the sheet). Changed: the stage keeps its margin above the bar through a run (the music grew at ▶ and the bar, reopened on a pause, would cover 35 px of it); the header hides Back, the name and the mode name while the hands are on the keys, keeping its box. 1024 × 768 and 768 × 1024, R7's tablet cells, are a phone upright to the app (`isTablet`), and the upright rules reach them.

**Stopped (the brief's stop condition), not chosen: upright, Hands on the row against Hands at the floor with the mode whole.** On 342 × 740 and 360 × 780 the floor for R, L and Both and the whole mode label leave no room for Hands where today's row kept it. The build keeps today's row there (`data-row='today'`, the mode cut as before) and gives the floor wherever Hands keeps its place with it (`data-floor`); those cells are counted apart. The trade, with what a learner meets under each option, is design §10.7 and the question below.

## Acceptance, counted mechanically

`app/tests/e2e/score.task-chrome.spec.ts` with `U122C_MATRIX=full`: R7's eight cells × 90/100/115 % text × the app's face and a wider one × Hot Cross Buns and Moonlight III = 96 cells, each walked through rest, count-in, holding, playing, paused, refused and (Hot Cross Buns) finished. Counts from `scripts-matrix.py` over the records (`matrix-counts.txt`; one line per cell and moment in `matrix-cells.txt`):

| Device | cells | rest | count-in | holding | playing | paused | refused | finished |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Phone sideways (568 × 320, 780 × 360) | 24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 12/12 |
| Phone upright (342 × 740, 360 × 780) | 24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 12/12 |
| Tablet (1024 × 768, 1366 × 1024, both ways) | 48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 24/24 |

**96 of 96 cells with no failure in any moment.** Also counted, from the same records:

- the largest move of the music's top edge from rest before finished: 0 px sideways and on the tablet cells, about a fifth of a pixel upright (the base, by the same walk: 22, 48 and 63 px);
- Hands at rest: on the row in 24/24 sideways and 48/48 tablet cells, at the floor; upright on the row in 14/24 and behind ⋯ in 10, where today's sizing sends it too (by construction: today's row is kept wherever the chooser would keep less; the base was not walked on those ten); **counted apart as the open trade:** in 14 upright cells Hands keeps today's width (`data-floor='false'`), and in 6 of them today's row is kept, the mode cut (342 × 740 at 100 % on the app's face and at 90 % on the wider one, 360 × 780 at 100 % on the wider face, both pieces);
- the selected mode: whole in every sideways and tablet cell (*Keep tempo* 22, *Tempo* 2 sideways; *Keep tempo* 48 on the tablet), upright whole but in those 6;
- finished: the outcome, its *To pass* line and *Keep tempo at 80 %* whole in the sheet's first view and hit in 48/48.

The four checks per moment: the moment's action drawn, hit at five points, at the tap floor, in the window; the setup controls not drawn while the hands are on the keys, and `bar n / m` drawn; the music's top edge within 1 px and its five-line stave within 1 % of rest (finished excepted, the reviewer's reading 1); no chrome box over the stage's ink past a 2-px touch, stave lines included. Finished: X46's outcome (the heading and the *To pass* line) and the primary action whole in the sheet's first view and hit; no run chrome over the sheet. U110's 360 × 780 cell is among the 96.

The scope of "every cell": these 96 cells, this machine's Chromium, these two faces, these two pieces. Not measured: a device, text above 115 %, other pieces, a loop or the ladder, the one-bar preview, the offer to carry on (R2), a run nothing listened to.

The ordinary suite runs every R7 cell at 100 % on the app's face plus the narrow adversaries (13 cells), and the suite cases: U120 at rest (568 × 320, 115 %, both faces; 667 × 375), U121, a demonstration folding to *Stop* and the peek (three devices), the time away, the refused start (R19) sideways: **22 passed** (`subset-final.txt`).

## Red-first, and green

- **The outside builder's seed, judged:** replaced, keeping its name and its two discriminating ideas. Its paused case passed `toBeVisible` and `toBeEnabled` on a ▶ under the folded bar and then waited out the 30-s test timeout on the click (the coordinator's run: 3 of 3 that way, 3 of 3 count-in cases red on the assertion). An element-from-point test at five points tells the fold apart in a second. Its "tablet" cell, 1024 × 768, is not a tablet to the app; the matrix has both kinds.
- **The base, by the final judge** (`scripts-base-run.py`: the base sources built into the dist for the run only, then restored and checked by hash): **13 of 13 cells red** (clean moments only at upright rest, 1 of 3, and on the upright and tablet finished sheets); **the 8 suite cases red** (`red-base-run.txt`, `red-base-counts.txt`, `red-base-cells.txt`). The red reasons: paused and refused, ▶, Back, the mode and ⋯ not drawn (finding 5); the count's wash and digits over the ink on every device (finding 8, measured upright and on the tablet too); the music's top edge moved 22 px sideways, up to 48 px upright, up to 63 px on the tablet-sized cells, and the stave grew at ▶ on the two height-bound tablet cells; R and L under the floor; the mode cut; sideways the finished sheet's recommended action not in its first view. U121 and the demonstration are red on their assertions; U120's case and the time away are red at their first step (the base has no top line), so U120's semantic red is U119a's standalone reproducer (`runs/U119a/refusal-568-base-run.txt`).
- **Green:** the matrix 96 of 96; the subset and suite cases 22 of 22; the Score browser specs in focused batches (below).

## Mutants (`mutants.txt`; each a real source change, built, run on the cells that should catch it, restored by hash)

| Mutant | Killed by |
| --- | --- |
| m1: the fold asks whether a run exists (finding 5) | paused and refused: Back, the mode and ⋯ not drawn (2 of 2 cells); the unit test |
| m2: the count on the stage again (finding 8) | the count's digits over the ink 16–19 px (2 of 2), the count-in spec |
| m3: the stage takes the bar's row everywhere again | tablet: the bar over the ink 35 px paused, the stave 146 → 155 and 211 → 225 px, the edge moved (2 of 2) |
| m4: the header leaves the flow when folded, upright | the music's top edge moved about 85 px, `bar n / m` and the cue gone (2 of 2) |
| m5: sideways, the sheet not below the band from the run's start | the edge moved 22 px in every run moment, the top line over the ink (2 of 2) |
| m6: the finished sheet one column sideways | the recommended action not whole in the first view and not hit (2 of 2) |
| m7: the Hands floor gone | R and L under the floor at rest, paused, refused (2 of 2) |

## Checks run, and their results

All from `app/`, on the final tree unless said (`checks.txt`):

- `npx tsc -b`: exit 0. `npm run lint`: exit 0.
- `npx vitest run`: 7630 passed, 3 failed, each this worktree's environment and none on a changed line: `blues.3` reads `ScoreScreen.ts` raw for a `\n` string and this checkout is CRLF (on the working copy: raw false, LF-normalised true); `midiParity` has no parity reference here; `taughtByAncestry` has no `build/rung-claims.json` (no content build; the content was copied from the main checkout). The new `scoreChrome.test.ts`: 8 passed.
- The walk, full matrix: 96 passed (`matrix-run.txt`). The ordinary suite's walk and suite cases: 22 passed (`subset-final.txt`).
- The Score browser specs the change touches, in one focused batch: 230 passed (`score-batch-3-final.txt`: states, screen, bar-targets, score, both fuzz walks at 390 × 844 and 900 × 1200, window-rule, countin, blind, run, layout, head-height, rotate, hearIt, latch, tour-practice-modes). Before the old-surface tests were revised the same specs gave 57 failures (`score-batch-1-before-the-test-revisions.txt`), then 4 (`score-batch-2.txt`: the *Stop* button under the floor, and a hit-test under `pointer-events: none`), fixed.
- The base, by the final walk: 21 failed of 21 (`red-base-run.txt`). The mutants: 7 of 7 killed (`mutants.txt`).
- Not run: the tour (sixteen minutes; its scene 24 now reads the top line), the state gallery, CI. The local `-win32` screenshot comparisons compare against baselines this lane's first run wrote: no evidence either way.

## Learner-facing text, itemised (no sentence written or reworded; `help.ts` unchanged)

| Where | Before | After | Why |
| --- | --- | --- | --- |
| Sideways, paused by ⏸ (`STATE_TEXT.paused`) | in the row's status slot, cut to a prefix, or whole in the chip once folded | not drawn on the sideways glass (the header's state line, which sideways is not drawn, still holds it) | the reviewer's correction: the stopped music, the open row and ▶ say it; *Start again* is one tap away in ⋯ |
| Sideways, paused because the page went away (`STATE_TEXT.away`) | *Paused — you were away N s. ▶ to carry on, or Start again in ⋯ to go back to the beginning.* in the row or the chip | *Paused — you were away N s. ▶ to carry on.* on the top line, in the name's place (the performance's existing form of the same sentence) | `responses/e070d238.md`: the short form is sufficient; it fits beside `bar n / m` at the tightest cell |
| Sideways, a sound refusal (`STATE_TEXT.soundOff`), the refused start, the first-note cue, an option's restart, the return from a demonstration | in the row's status slot (the refusal wrapping and growing the row) or the chip | the same words on the top line in the name's place; a refusal bold in the accent colour | c6; U120 |
| Upright and tablet, while a refusal stands | the mode's name (*Keep tempo*) above the state line, the state line wrapping and growing the header | the mode's name not drawn, the state line using its line | the header keeps its height, so the music does not move; the selected mode stays on the row's select |
| Upright and tablet, while the hands are on the keys | the header folded away (upright) or whole (tablet) | the header in place with Back, the name, the mode's name, `?` and the mode's standing line not drawn | show what the moment needs; nothing moves |
| The count-in's numerals | over the notation under a wash | beside ⏸ in the row, no wash | finding 8 |

## Where the brief was wrong

- The brief said finding 8 was a hypothesis upright and on a tablet; the base showed the count over the ink on every device (24 marks at 342 × 740, 15 at 1024 × 768 in the coordinator's run), so it is fixed everywhere.
- The brief's hypothesis was that upright and tablet need at most the count's and the finished view's placement. The trace showed each needs one placement change besides: upright the header must keep its box (the music jumped at the fold, and the state rule would make it jump at every pause); on height-bound tablet screens the stage must keep its reserve above the bar (the music grew at ▶ and the reopened bar would cover it). No new decomposition; today's surfaces kept. The finished view needed nothing upright or on a tablet.
- The brief's tablet cells include 1024 × 768 and 768 × 1024, which the app lays out as a phone upright (`isTablet`); the rules were written to reach them anyway, and the classification is recorded outside the lane.
- The settled tap floor for every named control (U124 widened) has a consequence upright the brief did not see: with the mode whole it sends Hands behind ⋯ on the narrow rows. That is a product trade; stopped, not chosen (above).
- The count needed no spacing fit: right of ⏸ the row has the room (U122b fitted it to the left, in the room Back and the status leave).
- The ownership boundary was wider than the brief's start: `WindowRenderer.sheetShift` priced a 22-px chip band before the fold, which no longer exists; and tests outside the Score's suites read the old surfaces (`tests/tour/tour.spec.ts`, `tests/states/gallery.ts`, `lessonClaimsAboutApp.test.ts`).

## Tests replaced or revised (class, the old assumption)

| Test | Class | The old assumption |
| --- | --- | --- |
| `score.task-chrome.spec.ts` (the outside builder's seed) | replace | a click's timeout as the paused check; a 1024 × 768 cell as the tablet |
| `score.countin.spec.ts`, *it covers the notation but never the controls* → *it stays off the notation and off ⏸* | replace | covering the notation is what the count does |
| `score.screen.spec.ts`, U105d's two refusal cases | replace | the refusal is said in the row's mirror, wrapping |
| `score.screen.spec.ts`, U119/U119a's 23 rows, the 667 × 375 and 568 × 320 refusal cases | revise | the left group holds the name and `bar n / m`; the paused line is in the mirror; a pause folds |
| `score.screen.spec.ts`, the refused summary sideways; *names it once the setting is on* | revise | the chip is a copy to read; the sideways sheet always scrolls; a folded select can be chosen unseen |
| `score.window-rule.spec.ts`, U118's eight folded-chip cases → five | replace (three deleted: what the chip says, the one-line band, the seconds away in the band) | a chip over the stage while folded, the slots below its band |
| `score.blind.spec.ts`, *still says which bar you are in* | revise | the corner chip is one of the two places |
| `scoreSheetsCloseAndPlayStartsSound.test.ts` (g) | replace | the refusal reaches the bar's mirror and the chip |
| `lessonClaimsAboutApp.test.ts`, 4.7's blind claim | replace (the claim kept, the check reads where the count and the dot are) | the count and the dot are on the stage, shown again by a rule |
| `scoreChrome.test.ts` | add | — |
| `tests/tour/tour.spec.ts` scene 24; `tests/states/gallery.ts`; `score.run.spec.ts` | revise (a selector; comments) | the bar's mirror; the chip |

## Files changed

- `app/src/ui/screens/scoreChrome.ts` (new): `chromeFor`, the moment-to-chrome mapping.
- `app/src/ui/screens/ScoreScreen.ts`: the fold by the moment (`drawChrome`, the peek, `showBar`, `toggleBar`); the top line and `topLineSays`; the row's left group (Back, the status); the count in the bar, placed beside the direct control; the beat dot placed by device; the chip, its reserve and `cornerTexts` removed; the row's chooser (`fitBarControls`, the priced mode and tempo, *Hear it* at its wider word, the Hands floor where it keeps its place, today's row upright where the chooser keeps less); the finished sheet in two parts; `bar n / m` kept beside a status during a run; `CONTROL_BAR_START_HIDE_MS` and `NARROW_BAR_PX` gone.
- `app/src/style.css`: the sideways c6 rules (the top line, its band under a run, the flush row, the stage taking the row sideways only); the folded row and the header kept in its box; the count; the dot; the tap floor in pixels and for Hands; the refusal's line upright; the two-column sheet sideways; the chip's and U105d's rules removed.
- `app/src/score/WindowRenderer.ts`: `sheetShift` reads the stylesheet's band only (the 22-px pre-fold fallback and its constant removed).
- Tests: `app/tests/e2e/score.task-chrome.spec.ts` (new), `app/tests/unit/scoreChrome.test.ts` (new), and the revisions above.
- Docs: `docs/04-ui-spec.md` §5 (each moment, the three devices, the sheet, the floor, the help strip), `docs/08-test-map.md`, `docs/design/score-bar-layout.md` §10.
- Record: this entry, its evidence, `docs/prompts/pictures/u122c/` (50 pictures).

## Questions for the reviewer

1. **Upright, the narrow rows: Hands on the row, or Hands at the floor with the mode whole?** (design §10.7.) Today's row is kept there for now: R, L and Both about half the floor wide and the chosen hand visible, the mode cut (*Temp…*) at the narrowest. The alternative: three full-size targets and the mode whole, Hands one tap away behind ⋯ at rest and paused, brought back to the row whenever a sentence names a hand.
2. **The tablet's run is now the at-rest size** where the height decides (about a fifteenth smaller than today's run at 1366 × 1024 and 1024 × 768), so the music never grows at ▶ and the reopened bar never covers it. Taken as an implementation choice under adb0873a §1 (no loss of action, notation, stability, tap size or look-ahead; the window's Bars 2 kept); overturn if size outranks it here.

## Evidence

In `docs/prompts/runs/U122c/`: `matrix-counts.txt`, `matrix-cells.txt`, `matrix-run.txt` (the 96 cells); `subset-final.txt`; `red-base-run.txt`, `red-base-counts.txt`, `red-base-cells.txt` (the base by the same walk); `mutants.txt`; `score-batch-1-before-the-test-revisions.txt`, `score-batch-2.txt`, `score-batch-3-final.txt`; `checks.txt`; the scripts (`scripts-*.py`, `scripts-playwright.u122c-5453.config.ts`). Logs are trimmed to their result lines and each failure's first lines; the full logs were not kept.

Pictures, `docs/prompts/pictures/u122c/`, before (the base) and after, every moment of the walk: `568x320-100-stack-hcb` (phone sideways), `342x740-100-stack-hcb` (phone upright), `1366x1024-100-stack-hcb` (tablet); `1024x768-100-stack-hcb` count-in and paused (the stage kept above the bar); `568x320-115-wider-moon` count-in and refused (the tightest sideways cell). The coordinator's earlier `before-{568x320,342x740,1024x768}-{rest,count-in,paused}.png` in the main checkout are the outside seed's run.
