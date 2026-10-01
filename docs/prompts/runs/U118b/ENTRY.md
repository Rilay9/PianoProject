### Entry 205 — U118b — the folded chip's reserve prices the widest away count the product can print, and the width-change case tests what it says

Brief: `docs/prompts/tasks/U118b-the-folded-reserve-prices-a-provable-bound.md`, U118's required change (`docs/review/responses/bea2d4e2.md`) under the fast path. Second read: `docs/review/second-reads/0d2c3472.md` item 2. Base `0d2c3472`. Built to the brief's sixteen digits, stopped at the stop condition, and then built to the reviewer's ruling on that stop (`docs/review/responses/questions-1cadc4dc.md`): **fourteen** copies of the chip face's widest digit, the band kept in turned/folded pricing. The sixteen-digit stop is kept below as history.

## Judgement

**Unverified on a device**: Chromium on this machine, on the app's own face, no phone. **No picture was looked at**: every claim below is a measurement (the grid's reads, the gallery's records); the gallery's shots were taken and deleted unseen. **Nothing was heard.** **Pedagogical verdict: not applicable**: layout only; nothing taught, judged or recorded changes.

**What a learner meets.** The chip says what it said: *Paused — you were away 1 s. …* carries the real seconds (case 4 reads it off the chip). What moved is the room the band keeps for that sentence:

- **342 × 740 at 100 % text**: the band is three lines where it was two. On this face the away sentence needs a third line once the count has ten digits (Twinkle, the Nocturne: `bar 12 / 12`, `bar 81 / 81`) or twelve (Hot Cross Buns, the five-finger exercise) — counts of about 30 years and 3 000 years away, inside what the product's one source can print (`explore-14-digits.md`, the last column).
  - **An ordinary run** (started unfolded, frozen, paused, folded) is unchanged in shape and size in every cell; its slots sit one line lower under the chip, every mark still on the stage.
  - **A run turned and turned back while folded** takes its size below the taller band. Two cells draw smaller: the five-finger exercise at 4 and 8 bars, the same three systems at 1.2803 instead of 1.3173, still larger than the ordinary start's 1.1644.
- **Every other geometry** (360 × 780, 360 × 844, 390 × 844 at 100 %; 342 × 740 at 115 %; 768 × 1024 and 1024 × 768): the band is the height it was. At 360 wide the sentence reaches a third line only at fifteen digits, one past what the product can print, which is what the sixteen-digit bound had wrongly priced (history below).

**The width-change unit case** now establishes the stage's first width, turns it, and fails where the held size is not released at the turn or the new size is not the new stage's. The original case passed with the release removed from the renderer; the corrected one does not.

**Technical verdict:** built as ruled. The reviewer's five conditions hold on the 224 cell-arms (below). One ordinary-path cell read differently between sessions; reruns in one session show the bound does not reach it (`reruns.md`).

## The fourteen-digit grid (`grid-compare.md`)

U118's own probe (`scripts-grid.spec.ts`, from `runs/U118/iii-scripts-stop.spec.ts`), the same 112 cells × two arms (as-is: an unfolded start, frozen, paused, folded; turned: the same run turned and turned back while folded), on the code before U118b (`grid-before`, the sentinel at 86 400) and on this lane's build (`grid-after14`), both measured in this worktree on port 5343, one run at a time. Exit 0 on both sets, both trees, 224 of 224 read.

- **The band moved in 32 cell-arms**: exactly the 16 cells × 2 arms at 342 × 740 at 100 %, two lines to three (36.69 → 52.03 px on this machine). Nowhere else.
- **Cells whose shape or size moved:**

| arm | cell | ordinary start | before (86 400) | after (14 digits) | what a learner loses |
| --- | --- | --- | --- | --- | --- |
| turned | 342 × 740 five-finger, 4 bars, 100 % | 3/3/3 @ 1.1644 | 3/3/3 @ 1.3173, 3 systems | 3/3/3 @ 1.2803, 3 systems | the same three systems about 3 % smaller; still larger than the ordinary start |
| turned | 342 × 740 five-finger, 8 bars, 100 % | 3/3/3 @ 1.1644 | 3/3/3 @ 1.3173 | 3/3/3 @ 1.2803 | the same |
| as-is | 342 × 740 Nocturne op. 48 no. 1, 1 bar, 115 % | — | 2/1/1 @ 1.333 (a greyed next row) | 1/1/1 @ 1.333 | not the bound's: the band is 58.97 px in both trees; five reruns on each build in one session all draw 1/1/1 (`reruns.md`) |

Shape is systems on the stage / systems in the window / bars shown; size is the drawn scale.

- **The reviewer's conditions** (`responses/questions-1cadc4dc.md`), as the grid reads them (`scripts-compare_grid.py`):
  1. *Ordinary starts unchanged*: one cell read differently, the Nocturne row above. Its band is identical in both trees, and in one session the day-priced build and this build both draw 1/1/1 five times out of five, so the bound does not move it. **Holds**, with that cell named.
  2. *No chip ink over score ink, no score ink off the stage*: no cell gains a mark under the chip; the four that have one (1024 × 768 five-finger at 4 and 8 bars, both arms) have it identically before, U118's Follow-up 1 (the placement anchor, a separate seam). No score ink off the stage in any of the 224. **Holds.**
  3. *A size taken while folded never fits worse than an ordinary start at the same geometry*: in no cell is a turned run smaller, fewer bars or fewer systems than the ordinary start. One turned run has fewer greyed rows than its ordinary start (1024 × 768 Nocturne, 4 bars: two active systems at 1.2783 against one system and a greyed row at 1.0878), the same in the before-grid, not the band's. **Holds.**
  4. *Every changed turned cell explained by the truthful reserve*: both moved turned cells have the taller band, and the same cell on the day-priced build in the same session draws 1.3173 at the two-line band three times out of three (`reruns.md`). **Holds.**
  5. *The corrected width-change case still kills the release-removing mutant*: rerun after this round, red under M-c1 (below). **Holds.**
- **The two cells the reviewer accepted under U118** read as before: 360 × 780 Twinkle 4 bars 2/2/4 @ 1.1092, 390 × 844 Twinkle 8 bars 3/3/8 @ 0.8811.

## The mechanism

**The sentinel.** `ScoreScreen.ts`: `AWAY_PRICED_S = 86_400` (a day, a guess at how long a phone is left) is gone. `AWAY_PRICED_COUNTS` (`:288`) is ten strings, fourteen of each digit, and `cornerTexts()` (`:1289–1290`) lays the away sentence with each, performing and not. `foldedCornerReserve()` is untouched: it lays every candidate in an unseen copy of the chip and keeps the lowest bottom edge, so the band holds the tallest of the ten.

Why that is a bound on what the product shows:
- The count's one source is the page's return, `Math.max(1, Math.round((Date.now() - awayFromMs) / 1000))` (`onVisibilityChange`), printed by `STATE_TEXT.away` through `String` with no ceiling, rounding to minutes or rewrite of its own. Two `Date.now()` readings are at most 1.728e13 s apart, fourteen digits.
- The chip sets no tabular figures and no letter spacing (`style.css`, `.score-stage__corner`), so digit widths are the face's to say. Fourteen of the widest digit are at least as wide as any count of fourteen digits or fewer, provided digit advances add with no positive kerning between different digits (stated, not measured beyond this face, on which all ten digits are one width).
- No line break falls between digits, and the chip wraps greedily (no `text-wrap`, `overflow-wrap` or hyphenation on it or its ancestors), so a wider digit run never takes fewer lines: the widest run gives the tallest of the ten, and the max over the ten is the widest digit's whatever the face.

Learner copy: `STATE_TEXT.away` and `pausedLine`'s call are untouched; the count is layout input only.

**Follow-up 3.** `windowRendererStage.test.ts:468`, *(c) a width change during a run releases the held size, takes a new one and keeps the step*. The harness's stage observer fires only when a test calls `observe()`; `stageChanged` tells a turn only from the second observation (`measuredWidth >= 0`). The case called `observe()` once, after changing the width, so that was the first observation: nothing was released, and the size held from 342 × 531 passed its "not null". Now:
- `observe(); await settle();` at 342 × 531 before the run (the pattern of the U118 turned case);
- at the turn, the held size must be null at once (released);
- once the new stage settles, the drawn picture must be the one a run turned to 390 × 600 from 300 × 480 draws (an independent reference: the size a turn takes is the new stage's, not where the run began), at step 2 with bar 0 on the glass.

Not a shared-helper fix: `open()` is used by the file's other cases and is unchanged.

## Discriminating tests and mutants

**Browser** (`score.window-rule.spec.ts`, a new test after the 1024 × 768 case; every existing case byte-identical): *the band holds the seconds away at the widest count they can print, and the chip says the real ones (U118b)*. Hot Cross Buns at 342 × 740, Tempo, hidden and shown again so the away sentence is drawn; folded. It reads the real count off the chip (under 60), lays the sentence in an unseen chip copy with fourteen of the widest digit (measured in the chip's type) and with 86 400, asserts the band holds the fourteen-digit sentence, adds an annotation saying whether this face tells the two apart, and runs U118's checks 1, 2 and 4 (`belowTheChip`).

| tree | the 7 U118 cases + CHUNK's folded case | case 4 |
| --- | --- | --- |
| the code before U118b | 8 pass | **red**: band 36.69 against the fourteen-digit sentence's 52.03 (2 lines against 3) |
| fourteen digits | 8 pass | pass |
| M-s1: the count back at a day (`['86400']`) | 8 pass | **red**, the same line |
| M-s2: the away sentence out of the reserve | 8 pass | **red**, the same line |

Case 4 is the only case either mutant reddens: no other case reads the away sentence.

**Unit** (`unit_mutants.py`, `unit_mutant_c4.py`; each source put back byte for byte, `cmp` after):

| mutant | the corrected case | the original case (HEAD) |
| --- | --- | --- |
| none | pass | pass |
| M-c1: `this.frozen = null` deleted from the turned branch (`WindowRenderer.ts:2683`) | **red** ("the held size let go at the width change") | **pass** |
| M-c2: the turned branch never taken | **red** | **pass** |
| M-c3: the corrected case's first `observe()` removed | **red** | — |
| M-c4: M-c1 with the release check taken out of the corrected case | **red** (size 1.2711 against 1.1368: the comparison alone catches it) | — |

The original passing under M-c1 and M-c2 is Follow-up 3's proof. Condition 5 is M-c1, rerun after the fourteen-digit change.

## History: the sixteen-digit stop (2026-10-01)

Built first to the brief's "sixteen copies of the chip font's widest digit" (`Number.MAX_SAFE_INTEGER`'s width). The same grid (`grid-compare-16-digits.md`) moved three turned cells outside the two accepted ones, which is the brief's stop condition, so the lane stopped and returned the table:

| cell | ordinary start | before (86 400) | after (16 digits) | what a learner loses |
| --- | --- | --- | --- | --- |
| 342 × 740 five-finger, 4 bars | 3/3/3 @ 1.1644 | 3/3/3 @ 1.3173 | 3/3/3 @ 1.2803 | the same systems about 3 % smaller |
| 342 × 740 five-finger, 8 bars | 3/3/3 @ 1.1644 | 3/3/3 @ 1.3173 | 3/3/3 @ 1.2803 | the same |
| 360 × 844 Twinkle, 8 bars | 3/3/8 @ 0.8112 | 4/4/8 @ 0.8429 | 4/3/8 @ 0.8112, three systems and a greyed row | about 4 % smaller, a greyed next row gained |

The band then grew in 64 cell-arms (every upright phone at 100 % where the sentence reached a third line at fifteen or sixteen digits); the large shapes did not move. The reviewer ruled (`questions-1cadc4dc.md`): sixteen digits is a type domain, not a reachable product state; price fourteen, keep the band in turned/folded pricing. At fourteen the 360-wide cells keep their two-line band and the Twinkle row is gone; the five-finger rows remain, now explained by a reachable count.

## The gallery

The state gallery (`tests/states`, served from `dist/` by a config copy on port 5343, one worker) against the code before U118b and against the fourteen-digit build (`gallery-summary.md`):
- **Both: 60 cells, the chip drawn in 20, the chip over the score's ink (`chipOverInk`) in none.** The chip's own lines are the same in all 20 (one, two on `hear-it--running`).
- **The band moved in one gallery cell, as the grid predicts**: `rotation--bars1-real-phone` (Hot Cross Buns, 342 × 740, one bar, folded and frozen), `foldedReserve` 36.69 → 52.03; its two slots sit 16 px lower (46, 215 → 62, 231), the same held scale 0.917, the same music share. In the other 19 the band is the same number on both runs.
- **One other cell drew differently, not by the band**: `end-of-piece--grand-staff` (Twinkle, 360 × 780, after a played run, the summary up) drew three systems at engraving zoom 1 before and two at zoom 2 after, the same size on the glass (1.905); its band is 36.69 on both runs, so the bound does not reach it. Like Follow-up 1, a difference between sessions at the end of a played run; not investigated further here.
- **Both break the same two cells**, U118's Follow-up 6, neither this lane's: `theme--light` (contrast 4.3:1 on `#score-waiting` and `#score-help-more`) and `rotation--bars1-real-phone` (§9.35, music 39 % of the stage). Exit 1 on both runs for those two.
- Confirmatory, as the brief expected: a wider reserve moves the stacked slots down, never up.

## Done

- The required change as ruled: the away sentence priced at fourteen of the chip face's widest digit (all ten laid out, the tallest kept), the comment stating the product's domain; learner copy untouched.
- The folded/turned grid rerun, 224 of 224, on both trees, and the reviewer's five conditions read from it; the two cells that moved explained, one by reruns in a single session.
- Case 4, red on the code before U118b and under both sentinel mutants.
- Follow-up 3: the case establishes the first observation, asserts the release at the turn and the new stage's size against an independent reference; red under four mutants, the original green under the two production ones.
- The sixteen-digit build, its grid and its stop table, kept as history.
- The gallery, before and after.
- Docs: `08-score-render-states.md` §4.1 *Below the folded chip* names the bound; `08-test-map.md`'s window-rule and `windowRendererStage` rows name case 4 and the corrected case.

Technical verdict: built as ruled, conditions 1–5 hold. Pedagogical verdict: not applicable.

**Content and corrections itemised (§12): none.** No lesson text, curriculum table, vocabulary entry, score, edition note or catalogue fact changes.

## Not done

- **No device**: no phone ran any of this; the face is this machine's (Segoe UI, every digit one width). On a face with a wider digit the threshold digit count moves, which is what the ten-digit construction is for; not seen.
- **The full e2e and unit suites** were not run: the seam is one constant, one test file's case and one new browser case (`verify-by-what-a-seam-touches`); `windowRendererStage.test.ts` whole, the window-rule cases and the gallery were.
- **The annotation's text** in case 4 is not printed by the list reporter; the exploration probe (`explore-14-digits.md`) carries the same fact.

## Follow-ups (observations, none fixed)

1. **342 × 740, Nocturne op. 48 no. 1, one bar, 115 %, ordinary path: the greyed next row depends on the session.** The before-grid and the sixteen-digit grid drew 2/1/1 (one system and a greyed next row); the fourteen-digit grid drew 1/1/1. The band is 58.97 px in all three. Ten reruns in one session, one Playwright run at a time (`reruns.md`): five on the fourteen-digit build and five on the day-priced build (the M-s1 mutant build, the same two away sentences as the code before U118b), all ten 1/1/1 @ 1.333, one slot at 59 px. So the bound does not move this cell; what does is not measured here. A hypothesis, not tested: the long piece's later sheets (U32) land before or after the freeze depending on load, and the greyed row needs one. Owner: the renderer's long-piece sheets and the freeze's wait for them (U32, T41); not this lane's.
2. **The gallery's `end-of-piece--grand-staff`** (Twinkle at 360 × 780, the summary up after 80 played notes) drew three 2-bar systems at engraving zoom 1 on one run and two at zoom 2 on the next, the same size on the glass, at the same band (36.69 both). Seen once each; not rerun. Owner: whoever next owns the end-of-piece fit; not this lane's.
3. U118's Follow-up 1 stands: at 1024 × 768 the five-finger exercise's fingering *5* reaches into the band, identically before and after.
4. The *height-only change during a run* case beside the corrected one (`windowRendererStage.test.ts`, the next `it`) also makes its only observation after the change. Its claim (nothing released, nothing re-engraved) holds on a first observation for a different reason than on a second, so a regression that read a height change as a turn would still pass it. Read in code, not run as a mutant. Unchanged here (the brief owns one case); recorded for whoever owns the file next.

## Questions

None.

## Tests, by class

| test | class | the old assumption it refutes |
| --- | --- | --- |
| `windowRendererStage.test.ts`, *(c) a width change during a run releases the held size…* | replace | that one `observe()` after the change is a width change; it was the stage's first observation, so nothing was released and the old size passed for a new one |
| `score.window-rule.spec.ts`, *the band holds the seconds away at the widest count they can print…* | add | that pricing the count at a day bounds the sentence; the count has no ceiling and a day is a guess |
| the 7 U118 browser cases, CHUNK's, the other 33 unit cases of the file | preserve | — |

## Files

- `app/src/ui/screens/ScoreScreen.ts` — `AWAY_PRICED_COUNTS` and its two call sites in `cornerTexts()`, and `cornerTexts`' comment. Nothing in `fitBarControls`' region.
- `app/tests/unit/windowRendererStage.test.ts` — the one case at `:468`.
- `app/tests/e2e/score.window-rule.spec.ts` — case 4, added.
- `docs/08-score-render-states.md`, `docs/08-test-map.md` — the rows above.
- `docs/prompts/runs/U118b/`:
  - `grid-compare.md` (fourteen digits, with the conditions), `grid-compare-16-digits.md` (history), `reruns.md`;
  - `explore-before.md`, `explore-14-digits.md` (the away sentence's lines by digit count, the band, the digit widths);
  - `gallery-summary.md`;
  - logs: `browser-u118-cases-on-base.txt`, `browser-u118-cases-14-digits.txt`, `browser-u118-cases-16-digits-run1.txt` / `-run2.txt`, `browser-1024-case-16-digits-rerun-alone.txt`, `browser-mutant-M-s1-a-day.txt`, `browser-mutant-M-s2-no-away.txt`, `unit-mutant-*.txt`, `unit-window-renderer-stage.txt`, `tsc.txt`, `lint.txt`;
  - scripts: `scripts-*` (the grid probe, the exploration probe, the config copies, the run and compare scripts, the mutant scripts).
- Not kept: the grid and rerun JSON (one file per cell-arm per run: 336 before, 224 at sixteen digits, 224 at fourteen, 13 reruns), the gallery's pictures and `states.json`; the comparisons and summaries carry what they say. Deleted at the end with `app/dist`, the copied content and the config copies, per §14.

## Exit codes

All browser runs on port 5343 from config copies under `app/build/u118b/`, one Playwright run at a time.

| step | exit |
| --- | --- |
| `npm ci` (app) | 0 |
| `npm run build:app`: the code before U118b, sixteen digits, fourteen digits, the clean fourteen-digit build after the mutants | 0 each |
| exploration probe (28 cells): before, fourteen digits | 0, 0 |
| the 7 U118 cases + CHUNK's + case 4, on the code before U118b | 1 (case 4 red, as built to be) |
| the same nine on sixteen digits | 1, then 0 alone and 0 whole (run 1: the 1024 × 768 case's score screen did not appear in 90 s, before anything about the band ran; it passed alone and in the full rerun) |
| the same nine on fourteen digits | 0 (9 of 9) |
| browser mutants M-s1 (a day), M-s2 (no away sentence), fourteen-digit base | 1, 1 (case 4 red in each; the other 8 pass) |
| grid, the code before U118b (as-is, turned, turned-off): upright, large shapes | 0, 0 |
| grid, sixteen digits (as-is, turned): upright, large shapes | 0, 0 |
| grid, fourteen digits (as-is, turned): upright, large shapes | 0, 0 |
| reruns: Nocturne 1 bar 115 % ×5 on fourteen digits, ×5 on a day; five-finger 4 bars turned ×3 on a day | 0 each |
| gallery, the code before U118b; fourteen digits | 1, 1 (the same two cells, U118's Follow-up 6) |
| unit mutants (`unit_mutants.py`, `unit_mutant_c4.py`), twice | as tabled above |
| `npx tsc -b` | 0 |
| `npm run lint` | 0 |
| `npx vitest run tests/unit/windowRendererStage.test.ts` | 0 (34 of 34) |

## Record

lane: U118b · closes: U118 · entry: 205
