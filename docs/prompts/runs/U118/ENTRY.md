### Entry 198 — U118 — the stacked slots and the folded chip: stopped at the stop condition

**Continued 2026-10-01: built as the reviewer's option (iii)** (`responses/questions-e9aa51ae.md`) — see *Option (iii), built* at the end. The sections before it are the stop-condition record, unchanged.

Brief: `docs/prompts/tasks/U118-the-stacked-slots-honour-the-folded-chip-reserve.md`, as amended by the reviewer's ruling `docs/review/responses/questions-91f683ff.md`, section "U118 — folded chip reserve" (option (b): room for the chip's tallest allowed state, two lines, kept from before the freeze, priced into the pre-freeze slot pricing, with the stop condition kept). Second read: `docs/review/second-reads/cc45b3a8.md` item 1. Base: `a969987a` (`git log -1 --format=%h` in the worktree before anything else).

**Outcome: the stop condition was reached, and nothing in the app changed.** Priced from the run's start as ruled, the two-line reserve changes `priceWindowShape`'s chosen systems in 6 of the 112 phone cells measured. Per the ruling, the table goes back before any change to the chooser. A premise behind the ruling was also found wrong at runtime (below), and it opens a cheaper path. That choice is the reviewer's, so it is put as Question 1, not built.

## Judgement

**Unverified on a device**: this is Chromium on this machine, on the app's own face, with no phone. **Nothing was heard.** **Pedagogical verdict: not applicable**: this is layout only, and nothing taught, judged or recorded is touched.

What a learner meets folded on a phone. A Wait run on Hot Cross Buns, upright at 342 × 740, paused, and three seconds later the chrome folds:

- **Before (the code as it stands):** the corner chip reads *bar 1 / 4 · Paused — ▶ to carry on, or Start again in ⋯ to go back to the beginning.* in two lines across the top of the stage.
  - The first system's fingerings, *3 2 1*, are hidden under it.
  - It also covers the top of the clef. Those four marks, the clef and *3 2 1*, are what the probe finds under its box.
  - The second system's fingerings print in full. So the learner sees the fingering for the next bar but not for the bar they are on.
  - Picture: `docs/prompts/pictures/u118/folded-paused-342x740-hcb-bar1-as-is.png`.
  - After a crossing into bar 3 it is the same over that window's first system (`…-hcb-bar3-as-is.png`).
  - Across the 80 upright phone cells measured, the chip takes two lines in every cell and meets the first system's ink in 76. The four it misses are the Nocturne at one bar, whose first system starts lower.
- **After:** nothing changed, so the learner meets the same screen. §12's itemisation list is empty because nothing shipped.
- **What the ruled fix would cost the learner** (the stop table below), if it were built:
  - Three one-bar windows lose their greyed next system: Twinkle and the Nocturne at 390 × 844, and the Nocturne at 360 × 780.
  - At 115 % text the five-finger exercise at 342 × 740 drops from three systems to two. Its drawn size falls by about an eighth.
  - The Nocturne at four bars on 1024 × 768 re-splits.
  - In 28 cells the drawn size changes. It falls in 27, most by a few per cent and up to about an eighth, and grows in the one re-split.
- **What the alternative would look like (a stand-in, not shipped).** Move the drawn slots down by the same two-line reserve once folded, and price nothing differently:
  - In all 112 cells the chip clears the score's ink, every mark stays on the stage, the slots keep their order, and the frozen size and system count do not move.
  - Picture: `…-hcb-bar1-placement-stand-in.png`. *3 2 1* print below the chip, and the stage still has room below the last system.
  - It works because folding upright also hides the header row, and the header row is taller than the reserve on every measured shape.
  - It fails in one place. If the run's size is taken again while the chrome is already folded (turned sideways and back during a run), the stage has no header row left to give, and the bottom system runs under the keyboard strip. Picture: `folded-turned-back-342x740-five-finger-4bars-placement-stand-in.png`.

## The stop condition, in my own words

*If honouring the reserve in stacked mode reduces usable music height enough to force a new slot-count or readability trade, I stop at that measured product choice rather than silently changing the chooser.* **Reached.** The two-line reserve, priced before the freeze, changes the chosen shape in 6 of 112 cells and the drawn size in 28 (table below). These are cells of the window-rule spec's own phone grid, plus U105c's 115 % text condition. I made no change to `chooseWindowShape`, `priceWindowShape`, `fitFor`, `nextInView`, `aheadFor`, `sheetShift` or `packSlots`, and no change to any app file.

## The table

**How it was measured, with the chooser untouched.** The ruled reserve is the chip's own folded rule at two lines: `top: 4px`, `padding: 1px 4px`, `0.8rem` at `line-height: 1.2` (`style.css`:2376–2390), at the page's root size. On this machine that is 36.7 px at 100 % text and 41.3 px at 115 %; the chip's measured two-line box ends at the same place.

- The probe is `scripts-stop.spec.ts`, run on the code as it stands.
- Each cell is run twice. "as-is" is the code as it stands. "reserved" makes the stage shorter by the reserve while `data-running` is true, off a tablet (a `margin-top` on `.score-stage`).
- In the reserved arm the pricing pass (`fitFor`, `nextInView`, `aheadFor`) and the slot fit (`perSlot`) see `stage.height − R` before the freeze, and only during a run. That is what the ruling asks of them.
- Shape is written systems on the stage / systems in the window / bars shown. The drawn size is the frozen CSS scale × the engraving zoom.

**The cells measured:**
- The window-rule spec's upright phones, 342 × 740 and 390 × 844, and its other phone sizes, 360 × 780 and 360 × 844.
- Each with Hot Cross Buns (U105c's piece) and the spec's three pieces (five-finger, Twinkle, Nocturne op. 48 no. 1), at 1, 2, 4 and 8 bars.
- The same four pieces at 342 × 740 with 115 % text.
- The spec's two "tablet" shapes, 768 × 1024 and 1024 × 768. **These are not tablets to the app.** `isTablet` needs the shorter side at 900 or more (`ui/tablet.ts`:14, 24–29), so the header folds and the chip is drawn there too.
- "The slot snapshot" in the dispatch matched no file. A scoped search of `app/tests`, `app/src` and `tools` for "snapshot" found only data snapshots. I read it as `score.slots.spec.ts`'s upright cell, 390 × 844, which the grid above covers.

The full upright set was run twice (`stop-table-run1.md` and `stop-table-run2.md`), and the two tables are identical row for row. The two large shapes were run once (`stop-table-not-tablets.md`).

The cells where the reserve changes anything:

| cell | shape as-is | shape reserved | drawn size as-is → reserved | fit by |
| --- | --- | --- | --- | --- |
| 342×740 five-finger 4 bars, 115 % text | 3/3/3 | **2/2/3** | 1.1479 → 1.0048 | height → width |
| 342×740 five-finger 8 bars, 115 % text | 3/3/3 | **2/2/3** | 1.1479 → 1.0048 | height → width |
| 360×780 Nocturne 1 bar | 2/1/1 | **1/1/1** (no greyed next system) | 1.4057 (same) | width |
| 390×844 Nocturne 1 bar | 2/1/1 | **1/1/1** (no greyed next system) | 1.5269 (same) | width |
| 390×844 Twinkle 1 bar | 2/1/1 | **1/1/1** (no greyed next system) | 1.7435 (same) | width |
| 1024×768 Nocturne 4 bars | 2/1/4 | **2/2/4** (re-split) | 1.0878 → 1.258 | width → height |
| 342×740 five-finger 4 and 8 bars | 3/3/3 | 3/3/3 | 1.1644 → 1.1126 | height |
| 342×740 Hot Cross Buns 4 and 8 bars, 115 % | 4/4/4 | 4/4/4 | 1.4315 → 1.3736 | width |
| 342×740 Twinkle 2 bars | 2/2/2 | 2/2/2 | 1.5045 → 1.3661 | width → height |
| 342×740 Twinkle 2 bars, 115 % | 2/2/2 | 2/2/2 | 1.4365 → 1.2851 | width → height |
| 360×780 five-finger 4 and 8 bars | 3/3/3 | 3/3/3 | 1.3007 → 1.211 | height |
| 360×780 Twinkle 2 bars | 2/2/2 | 2/2/2 | 1.5756 → 1.475 | height |
| 360×844 five-finger 4 and 8 bars | 3/3/3 | 3/3/3 | 1.4098 → 1.366 | height |
| 390×844 five-finger 4 and 8 bars | 3/3/3 | 3/3/3 | 1.4558 → 1.366 | height |
| 390×844 Twinkle 2 bars | 2/2/2 | 2/2/2 | 1.7435 → 1.6949 | width → height |
| 768×1024 / 1024×768, 12 cells | same | same | smaller in each (`stop-table-not-tablets.md`) | height |

Totals:
- 112 cells: the shape changes in 6, the drawn size in 28.
- The shape at rest never differs between the arms: the reserve applies only during a run.
- In every remaining cell the shape and size are the same in both arms.

## A premise found wrong, and what it changes

**Brief premise 7, and premise 6 as applied to SLOTS, are wrong at runtime.** On a phone held upright, folding the chrome *does* change the stage's box:

- The fold hides the header: `.screen--score[data-chrome='folded']:not([data-tablet='true']) .score-head { display: none; }` (`style.css`:2973–2975).
- The stage then grows by the header's whole row.
- The stage's `ResizeObserver` (`WindowRenderer.ts`:998–1015) runs `stageChanged`, which runs `fitSlots`, which runs `packSlots` at the fold (`:2606–2668`).
- `foldChrome` itself still calls nothing in the renderer (premise 7 is true of that function's code). The renderer reacts to the box it watches.

Measured in every cell, on this machine: the stage grows at the fold by the header's height, 84.9 px at 100 % text and 97.5 px at 115 %. The reserve is 36.7 and 41.3 px. Both scale with the root size.

Sideways, CHUNK's premise holds: the header is already gone (`@media (orientation: landscape) and (max-height: 500px)`, `style.css`:954–962), so the fold moves the sheet without changing the box. That is the case `sheetShift`'s comment describes, and the ruling's "include the same reserve in the pre-freeze slot pricing" follows its model.

**What it changes.** A stacked run's size and systems are priced and frozen on the stage before the fold, with the header still drawn. Once folded, the run already has the header's row spare below its last system, more than the chip needs. Pricing the reserve before the freeze then pays for room the fold frees anyway, and that payment is the whole of the table's trade. The one case the fold does not pay for is a size taken while already folded, measured below.

## The discriminating test (red first)

`scripts-folded-chip.spec.ts`, kept with the run and not added to `app/tests/e2e`: it accepts a fix that was held back, so on the code as it stands two of its checks are red by design. Each of the response's checks is a separate soft assertion.

1. The first slot's top, and the first system's ink, at or below the chip's bottom (read in the stage's padding box, where both are placed).
2. Nothing of the front sheets' ink (text, path, rect, line, ellipse, polygon) meets the chip's box.
3. The engraving zoom and the cursor slot's transform are the same before the fold (read paused, settled, chrome open) and after it.
4. The slots top to bottom in first-bar order, the greyed row below the window's rows, as many systems and the greyed row kept through the fold, and every mark on the stage.
5. At rest and running with the chrome open, no chip and the first slot at the stage's top. On a tablet (900 × 1200, the gallery's), no chip after the fold timer, the first slot at the top, and the scale held.

Each case was run on the code as it stands (`disc-as-is.txt`) and with the placement stand-in (`disc-placement-stand-in.txt`, `U118_EMULATE=placed`):

| case | as it stands | placement stand-in |
| --- | --- | --- |
| 342×740 HCB, paused at bar 1, ordinary paused line | **1 and 2 red**: first slot at 0; first-system ink 5.8 px below the stage's top against the chip's bottom at 36.7; four marks under the chip (the clef and *3 2 1*). 3, 4 and 5 green | all green |
| the same after a crossing into bar 3 (MIDI mock) | **1 and 2 red** (seven marks under the chip: the stave's top lines, the clef, *3 2 1* and *2*); 3 and 4 green | all green |
| tablet 900×1200 | 5 green | 5 green |
| 342×740 five-finger 4 bars, frozen, folded, turned to 740×342 and back | chip over 13 marks (no placement) | **ink past the stage's bottom**: the lowest ink at 698 px on a 666 px stage, chip clear |

The as-is red lines are the refuting result the brief named: the first system begins above the chip's bottom, so the hypothesis holds. Check 3 holds on the code as it stands, because the fold grows the stage and the frozen size is kept. Check 5 holds because nothing reserves anything today.

**Two corrections to the spec while running it (superseded runs, not kept):**
- The first tablet case used the window-rule spec's 768 × 1024, which is not a tablet to the app and draws the chip.
- The crossing case read check 3 before the vacated slot had settled. At bar 3 the eight-quaver bar does not fit across at bar 1's size, and the held size gives way once that slot settles. This is T38's across rule in §4.1 ("a bar being played never runs off the side"), not the fold. The spec now reads after `data-settled`, and the fold itself held the size.

## Done

- Base confirmed `a969987a` before any edit.
- Read: the repository's root instructions file, `operating-procedure.md` §11–§14, the brief, the ruling, the second read's item 1, and the code at the lines (`WindowRenderer.ts` `chooseWindowShape`/`priceWindowShape`/`fitFor`/`nextInView`/`aheadFor`/`sheetShift`/`fitSlots`/`packSlots`/`stageChanged`/the observer, `style.css` fold rules, `ScoreScreen.ts` the chip and `foldChrome`, `ui/tablet.ts`).
- The stop condition's table across 112 cells, with the upright set run twice, identical.
- The refuting test red first on U105c's layout (342 × 740, Hot Cross Buns, Wait, frozen, paused, folded), with the ordinary paused line and after a crossing, and the five checks.
- The placement-only stand-in measured across the same 112 cells (`placement-stand-in-table.md`, `placement-stand-in-table-not-tablets.md`): chip clear, ink on the stage, order kept and the frozen scale held through the fold in all 112, and the shape and drawn size identical to as-is in all 112. Its gap (a size taken while folded) was measured once.
- Pictures under `docs/prompts/pictures/u118/`: as-is and stand-in at bar 1, at bar 3, and the turned case.

Technical verdict: no app change. Pedagogical verdict: not applicable.

## Not done

- **The fix** (the slots' reserve in `sheetShift`/the pricing pass and the stacking origin in `packSlots`): stopped at the stop condition. The ruling says to "stop and return that table before changing the chooser". No app file changed.
- **The mutants**: there is no fix for them to test, so none were run.
- **The gallery change** (`tests/states/gallery.ts`'s blanket exclusion of `.score-stage__corner`): the ruling ties it to "once U118 gives the chip owned space". With no space given, it would only report the overlap already measured, so it was not made. Whether any gallery cell is a folded phone state was not checked: a scoped grep of `tests/states/score.states.spec.ts` for "fold", "chrome" and "corner" found nothing, and running cells may fold anyway.
- **The doc row in `08` §4.1 SLOTS**: it would describe behaviour the code does not have. Proposed text for each option is under Doc rows.
- **A test-map row**: no spec was added under `app/tests`.
- **tsc, lint, unit, and the build after a change**: no app source file changed. The build at base ran once (exit 0) to serve the probes.

## Follow-ups (observations, none fixed)

1. The window-rule spec's `tablet-upright` (768 × 1024) and `tablet-sideways` (1024 × 768) are not tablets to the app. The header folds and the chip is drawn there. As it stands the chip meets the first system's ink in 17 of the 32 cells there. Its one line costs nothing today. For the fix lane's scope.
2. On those wider stages the chip takes one line in every measured state. A fixed two-line reserve keeps a line's room there for nothing. It matters only where the reserve is priced.
3. Sideways (CHUNK, the 22 px reserve) was not measured here: the phone sideways is the single arrangement and outside the slots' stop question. The gallery check the ruling asks for covers folded phone states, which include sideways, so the chip's lines sideways should be measured before that check goes in.

## Questions

1. **For the reviewer: which reserve placement and pricing, given the table and the premise found wrong?**
   - (i) **As ruled**: the two-line reserve priced from the run's start and the slots stacked below it. Costs the table's trade: 6 shape changes (three lost greyed next systems, one lost system at 115 % text, one re-split) and 27 smaller drawn sizes in 112 cells.
   - (ii) **Placement only**: the slots stacked below the two-line reserve once folded on a phone, kept for the whole run, nothing priced differently. No change to shape or size in the 112 cells, because the fold frees the header's row, which is larger than the reserve on every measured shape. Its measured gap: a size re-taken while folded (turned and back mid-run) puts the bottom system past the stage.
   - (iii) **Placement always, pricing only where the fold frees nothing**: the reserve is priced into a run's size only when that size is taken while the chip is already drawn (folded), which is how `sheetShift` already reads the folded state before falling back to its run-start constant. This should close (ii)'s gap and cost an ordinary start nothing. That is inferred from the code and from the two measurements, not measured as a whole. Its assumption is that the header row the fold hides is at least the reserve. Both grow with the root size, and it holds on every measured shape, but it is not shown for every text size.
2. **For the reviewer, only if (i) or (iii):** on stages wide enough that every chip sentence takes one line (both "tablet" shapes of the window-rule spec), is the reserve still two lines, or the chip's own extent at that width?

## Doc rows, proposed and not applied

- `docs/08-score-render-states.md` §4.1 SLOTS, beside CHUNK's T38 bullet. Under (ii) or (iii): "**A run keeps the folded chip's room (U118).** On a phone the folded chrome draws the `bar n / m` chip over the top of the stage. Once folded, the stacked slots start below it, at the chip's own extent for two lines (its `top`, padding and line height), the same for the whole run whatever the chip says. Upright, the fold also hides the header row, which gives the stage more height than the chip takes. So a run sized before the fold keeps its size, systems and look-ahead row through it. *(iii only:)* A size taken while the chrome is already folded, after a turn, is priced with the chip's room." Under (i): the same first two sentences, then "The room is kept from the run's start: priced into the run's size and systems before the freeze, as CHUNK's is."
- `docs/08-test-map.md`: a row for the folded stacked case in `score.window-rule.spec.ts`, beside CHUNK's folded case at `:942–991` (the spec the second read named as the model and the path map ties to `WindowRenderer.ts`), when a fix lands.
- The brief's citation correction (§5.3 → §4.1) is already confirmed by the ruling, so it needs no question.

## Files

Kept under `docs/prompts/runs/U118/`:
- `ENTRY.md`.
- Tables: `stop-table-run1.md`, `stop-table-run2.md`, `stop-table-not-tablets.md`, `placement-stand-in-table.md`, `placement-stand-in-table-not-tablets.md`.
- Probe samples: `probe-342x740-hcb-2bars-{as-is,reserved,placed}.json`, one cell. The other probe JSON files (496) were not kept; the scripts regenerate them.
- Logs: `probe-stop-run1.txt`, `probe-stop-run2.txt`, `probe-stop-not-tablets.txt`, `disc-as-is.txt`, `disc-placement-stand-in.txt`, `build-app-base.txt`, `npm-ci.txt`.
- Scripts: `scripts-stop.spec.ts`, `scripts-folded-chip.spec.ts`, `scripts-summarise_stop.py`, `scripts-summarise_placed.py`, `scripts-playwright.u118-5313.config.ts`, `scripts-keep.py`.

Pictures under `docs/prompts/pictures/u118/`: `folded-paused-342x740-hcb-bar1-{as-is,placement-stand-in}.png`, `folded-paused-342x740-hcb-bar3-{as-is,placement-stand-in}.png`, `folded-turned-back-342x740-five-finger-4bars-{as-is,placement-stand-in}.png`.

No app file and no doc outside the run and picture folders changed.

## Exit codes

| step | exit |
| --- | --- |
| `npm ci` (app) | 0 |
| `npm run build:app` at base | 0 |
| probe, one cell (trial) | 0 |
| probe, upright set, run 1 (160 tests) | 0 |
| probe, upright set, run 2 with the stand-in (240 tests) | 0 |
| probe, 768×1024 and 1024×768 (96 tests) | 0 |
| discriminating spec, as it stands | 1, red by design: checks 1 and 2 on both phone cases, and the turned case without placement |
| discriminating spec, placement stand-in | 1: the turned case, ink past the stage's bottom |
| tsc, lint, unit | not run: no app file changed |

All browser runs used port 5313 from the config copy under `app/build/u118/`, one suite at a time.

---

## Option (iii), built (2026-10-01)

The reviewer's answer to this entry's Question 1 is `docs/review/responses/questions-e9aa51ae.md`, section "U118 — folded corner-chip reserve": **option (iii)**. The rule, in the ruling's words where it decides:
- "When folded chrome is drawn, stacked slots are placed below the chip's reserved band."
- "Do not re-price/re-fit merely because the chrome folds during an already frozen run."
- A size taken while the chip is already drawn "includes the chip reserve in its available height".
- "A status-text change by itself never re-prices the run."
- The band is "the maximum allowed chip height at that geometry", one line where every legitimate sentence fits one.

Built in this worktree on the same base, `a969987a`. Everything above this section stands as the stop-condition record.

### Judgement

**Unverified on a device**: this is Chromium on this machine, on the app's own face, with no phone. **Nothing was heard.** **Pedagogical verdict: not applicable**: this is layout only, and nothing taught, judged or recorded changes.

What a learner meets folded on a phone. A Wait run on Hot Cross Buns, upright at 342 × 740, paused, and three seconds later the chrome folds:

- **Before (the code as it stands):**
  - The chip's two lines (*bar 1 / 4 · Paused — ▶ to carry on, …*) sit over the first system's clef and its fingerings *3 2 1*.
  - The learner sees the next bar's fingering but not the fingering of the bar they are on.
  - Pictures: `folded-paused-342x740-hcb-bar1-as-is.png`; after a crossing, `…-bar3-as-is.png`.
- **After:**
  - The first system starts below the chip. Its clef, time signature and *3 2 1* print whole, and nothing of the score is under the chip.
  - The systems are the same size and the same in number as a moment before the fold. The greyed next row is still there, and the stage still has room below the last system.
  - Picture: `folded-paused-342x740-hcb-bar1-after.png`; after a crossing, `…-bar3-after.png`.
- **At 115 % text** the band is three lines tall while the paused chip shows two. A line's height of empty stage sits between the chip and the first system (`folded-paused-342x740-hcb-text115-after.png`). The third line belongs to *Paused — you were away 86400 s. ▶ to carry on, …*, a sentence the chip can carry; see Question 2.
- **Turned sideways and back during a run while folded:**
  - Before, the chip covered the five-finger exercise's first system.
  - With placement alone, the bottom system ran under the keyboard strip.
  - Now the size is taken below the band. The chip is clear, the bottom system stays on the stage, and the size is between the ordinary start's and the old turned size (`folded-turned-back-342x740-five-finger-4bars-after.png`).
- **On wider stages** (1024 × 768, which the app draws as a phone), every sentence fits one line, so the band is one line (`folded-paused-1024x768-hcb-4bars-after.png`).
- **On a tablet** nothing changes: no chip and no band.

### The mechanism

The fault, from the first half of this entry: in `slots` mode `packSlots` writes every drawn slot's `top` inline, starting from 0, over the stylesheet's folded reserve. The changes act on that line and on the sizing pass, as the ruling directs.

- **The band is the Score screen's** (`ScoreScreen.ts`), because the chip, its sentences and when it is drawn are the screen's.
  - `cornerTexts()` builds every sentence the chip can carry for the piece, each at its longest. That is `bar n / m` alone, and joined to:
    - every refusal sentence, for each tap that can refuse (the module's taps, now listed in `SOUND_TAPS`, plus the hands and a held bar);
    - the paused, away, paused-at and every restarted line (each `RESTARTED_WITH` reason at its longest);
    - both demonstration lines;
    - the three first-note lines (`firstNoteLine` now takes the hand);
    - the piece's longest *Waiting for …*.
  - Every bar number is the piece's last; the tempo is the tempo row's own maximum; the bar count is `MAX_BARS_PER_WINDOW`. The seconds away have no ceiling, so they are priced at a day (`AWAY_PRICED_S`).
  - `foldedCornerReserve()` returns 0 unless the chrome is folded off a tablet and the chip is drawn. Otherwise it lays out an unseen copy of the chip under the chip's own rule (its `top`, padding, type and line height, at the width the stage leaves it) with each sentence, and takes the lowest bottom edge.
  - The result is cached on the stage's width, the chip's type and the piece, so a change of sentence never changes it. Nothing in the renderer is told when the chip's text changes.
- **The renderer asks for the band** through a new option, `foldedReserve` (`WindowRenderer.ts`).
  - `packSlots` starts the first slot in reading order at the band, rounded up to a whole pixel, and stacks within what is left of the stage.
  - `placeSlots()` places the slots again from the last pack, with no fit, price or engraving. The screen calls it when the chrome folds or unfolds (`foldChrome`), so the slots are below the chip from the frame the chip is drawn in. Upright, the stage observer's fit a moment later places them at the same tops.
  - The slots' pricing in `priceWindowShape` (`fitFor`, `nextInView`, `aheadFor`) and the slot fit (`sheetShift`'s new slots branch) subtract the band only while the chip is drawn. A run that starts unfolded is priced on the whole stage.
  - The fold during a frozen run reaches no pricing: `chooseWindowShape` returns the frozen shape, and `scaleFor`'s hold keeps the size, because the stage gained the header's row, which is more than the band.
  - A turn while folded releases the run's size (`stageChanged`), and the next size is priced and fitted below the band.
- CHUNK (sideways, one sliding sheet) is untouched. It keeps the stylesheet's fixed 22 px and `sheetShift`'s own path.

### The tables

**The ordinary path** (an unfolded start, frozen, paused, folded), the same 112 cells as the stop table, on the built code: `iii-ordinary-and-turned-upright.md` (80 cells) and `iii-ordinary-and-turned-not-tablets.md` (32).

- The frozen shape and the drawn size are **identical to the code before U118 in all 112** (against the as-is columns of `stop-table-run1.md` and `stop-table-not-tablets.md`).
- The frozen scale held through the fold in all 112, the slots stayed in first-bar order in all 112, and every mark was on the stage in all 112.
- The chip is clear of the score's ink in 110 of 112. The 2 exceptions are both at 1024 × 768, on the five-finger exercise at 4 and 8 bars (one window of three bars on one system):
  - a fingering *5* reaches into the band, its ink starting about 4 px above the slot's top;
  - without the band the same ink starts the same distance above the stage's top and is clipped there (`turned-off` read: the ink's top above 0 with the slot at 0);
  - so it is not the band's doing. Placement anchors the stave at `staffTop − piece.above`, and this window has more ink above its stave than the piece's measurement. Follow-up 1.
- The band at each geometry: two lines on every upright phone at 100 % text, three at 115 % on 342 × 740, and one at 768 and 1024 wide.

**A size taken while folded** (turned and turned back mid-run), the same 112 cells, three ways: with the band; with the chip hidden, so the band is 0 (the code before U118's pricing); and the ordinary path at the same geometry.

- With the band, the chip is clear in 110 of 112 (the same two 1024 × 768 cells) and every mark is on the stage in all 112.
- In no cell are there fewer systems or bars, or a smaller size, than the ordinary start at that geometry. The shape is the same in 101 cells; in 11 the turned run uses more, because the folded stage less the band is taller than the stage a run starts on.
- Against band 0, the count differs in 2 cells, both real phone sizes:

| cell | ordinary start | turned, band 0 | turned, with the band | band 0's lowest ink + the band vs the stage |
| --- | --- | --- | --- | --- |
| 360×780 Twinkle 4 bars | 2/2/4 @ 1.1092 | 3/2/4 @ 1.1092 (a greyed next row) | 2/2/4 @ 1.1092 | 677.1 + 36.7 > 708 |
| 390×844 Twinkle 8 bars | 3/3/8 @ 0.8811 | 4/4/8 @ 0.8932 | 3/3/8 @ 0.8811 | 755.3 + 36.7 > 772 |

### The stop condition on the second path, in my own words

*If honouring the band on a size taken while folded forces a new slot-count or readability trade in a measured real-phone case, I stop at that measured product choice rather than silently changing the chooser.*

**By the letter, reached in 2 of 112 cells. By substance, not reached in my reading.** I did not stop, and Question 1 puts the reading to the reviewer.

- In both cells, with the band the turned run draws exactly what an ordinary start draws there: the same systems, bars and size.
- The band-0 shape in those two cells needs the room under the chip. Placed below the band, its lowest ink would end past the stage's bottom (the last column above).
- So the alternative it would trade against is the overflow this rule exists to close, not a valid layout.
- If the reviewer reads it as reached, one line takes the band out of that pricing (`slotsHeight` in `priceWindowShape`, and `sheetShift`'s slots branch). Option (ii)'s overflow then returns in exactly the cases this table measures.

### The discriminating tests

**Browser** (`score.window-rule.spec.ts`, seven cases beside CHUNK's folded case):
- Two ordinary-path cases: U105c's layout, and the five-finger exercise at 4 bars, sized by the height. Each covers the response's five checks:
  - no chip and the first slot at the top, at rest and running unfolded;
  - then folded: the first slot below the band, the first system's ink below the chip, nothing of the score under it, first-bar order with the greyed row below, every mark on the stage, and the shape, engraving zoom, held size and scale unchanged through the fold.
- A crossing into the third bar: checks 1, 2 and 4. Check 3 is left out there for the reason below.
- The turned-while-folded path.
- What the chip says: waiting for the first note, nothing, paused. The band, the slots, the shape and the size are the same in all three, and the band holds the tallest of them.
- One line at 1024 × 768.
- A tablet.

All eight pass on the build (`iii-window-rule-u118-cases.txt`; the eighth is CHUNK's existing case).

**Red first:** on the code before U118 (`base`, the two source files as at HEAD, with these tests), six of the seven are red. The tablet case and CHUNK's are green, as they should be (`iii-mutant-base-browser.txt`).

**Unit** (`windowRendererStage.test.ts`, five cases, with the band set by the test where the screen would answer it):
- placed below the band and back at the top, with nothing fitted or engraved;
- a fractional band starts the first slot on the pixel below it;
- an ordinary fold during a frozen run holds the shape, the held scale and the engraving while the stage gains the header's row;
- a size taken while the band is drawn (turned back while folded) draws what a stage short by the band draws, placed under the band;
- sideways, the sliding sheet's `top` is left to the stylesheet.

34 of 34 in the file pass. Four of the five are red on the code before U118.

**Why check 3 is not asserted after a crossing.** At bar 3 the eighth-note bar does not fit across at the size frozen at bar 1, and the run drew it off the right edge: the window's ink reached 467 px on a 340 px stage before the fold (`iii-disc-crossing-before-the-fold.txt`). T38's across rule shrinks it at the first fit after the crossing, which on this path is the fold's. On the code before U118 the same happened (this entry's first run). Follow-up 2.

### Mutants

Each was applied to the source, built, and run against the U118 browser cases and unit cases. The source was restored byte for byte after each (`iii-mutants.md`, per-mutant logs `iii-mutant-*`).

| mutant | what changes | red | green |
| --- | --- | --- | --- |
| base | the code before U118 | 6 browser (every phone case), 4 unit | tablet, CHUNK, the sideways unit case |
| M1 placement removed | the slots stack from 0 | the same 6 browser, 4 unit | tablet, CHUNK |
| M2 the band priced on an ordinary fold | the fold releases the run's size and takes it again | 1 browser (the case sized by the height), 1 unit (the ordinary fold) | the other 7 browser, 4 unit |
| M3 a status change re-prices | the band follows the sentence shown now, and every change of the chip places the slots again | 1 browser (what the chip says) | the other 7 browser, all unit |
| M4 a fixed two-line band | two lines whatever fits | 1 browser (one line at 1024 × 768) | the other 7 browser, all unit |

M2, M3 and M4 each redden only the check they target. M1 reddens every check that reads placement, which is checks 1 and 2 in every phone case.

M2 survives on Hot Cross Buns. Its window is sized by the width, so a re-price on the taller folded stage draws the same size. That is why the height-sized case is there.

### The gallery

`tests/states/gallery.ts` no longer leaves `.score-stage__corner` out of the sweep.
- A new `chipOverInk`, read with each cell's record, reports any mark of the front sheets that the drawn chip's box meets (clef, stave, notes, fingerings) as `§4.1 the folded chip over the score's ink`.
- The chip's own box inside the stage is not judged.
- Unfolded and on a tablet the chip is not drawn, and nothing is read.

The gallery was run on the build and on the code before U118, both times with this lane's `gallery.ts` (`iii-gallery-summary.md`):
- **60 cells; the chip is drawn in 20.** These are slots upright at 360 × 780, the sliding chunk and scroll sideways at 780 × 360, *Hear it* at two lines, and the real-phone rotation cell.
- **Before U118** the guard finds the fault: on `hear-it--running` the chip is over the clef and *3 2 1*, and the sweep, now judging the chip, reports it over the score's *2 1* on `waiting-line--wait`.
- **With U118** the chip is over nothing in any of the 20 cells.
- Two cells break the same way on both runs, so they are not this lane's: `theme--light` (contrast 4.3:1 on `#score-waiting` and `#score-help-more`) and `rotation--bars1-real-phone` (§9.35, music 39 % of the stage). Follow-up 6.

### Done

- Option (iii) as ruled: the band from the chip's own rule and the legitimate sentences, placement while drawn, no price on the fold, the band priced on a size taken while drawn, and no re-price on a status change.
- The rerun of the 112-cell table, showing no shape or size change on the ordinary path.
- The 112-cell table for a size taken while folded.
- Browser and unit discriminating cases, red on the code before U118.
- Four mutants and the before-U118 run.
- The gallery change, run before and after.
- The doc row in `08` §4.1, a `SLOTS` bullet *Below the folded chip (U118)* after "The slots pack from the top", beside CHUNK's T38 bullet.
- Test-map rows (`score.window-rule.spec.ts`, `windowRendererStage.test.ts`, `gallery.ts`).
- Pictures, the after set, beside the as-is and stand-in sets.

Technical verdict: built as ruled; on the ordinary path the learner's music is unchanged and clear of the chip; one reading for the reviewer (Question 1). Pedagogical verdict: not applicable.

### The tests, by class

| test | class | the old assumption |
| --- | --- | --- |
| `score.window-rule.spec.ts`, seven U118 cases | add | none: no case read the chip against the stacked slots |
| `windowRendererStage.test.ts`, five U118 cases | add | none |
| `tests/states/gallery.ts`, the chip judged and `chipOverInk` | replace | the chip is "drawn over the notation on purpose: covering a chord symbol is the trade" |
| twelve unit files' renderer stand-ins (`evidenceVersion`, `feedbackFromMeasurements`, `firstContactOnTheScore`, `observationsFromRun`, `projectOnTheFinishSheet`, `scoreMidRunSettings`, `scoreSheetRows`, `scoreSheetsCloseAndPlayStartsSound`, `scoreSidePanelDecision`, `scoreSummaryTruth`, `scoreTourRoute`, `transferOfferOnTheRun`) gain `placeSlots(): void {}` | revise | the screen calls only the renderer methods the stand-in had. Without the stub, 201 tests in 11 files failed on `renderer?.placeSlots is not a function` |

### Not done

- **The unit suite is not all green here.** 4 failures are the same on the code before U118 (`iii-unit-four-on-base-source.txt`):
  - `lessonClaimsAboutApp` 4.7 and `lessonClaimsAboutMusic` rock.7 (they read built content copied read-only from the main checkout);
  - `midiParity` (no reference: `parity_reference.py` was not run in this worktree);
  - `taughtByAncestry` (no `build/rung-claims.json`: the content build was not run).
- On the last full run three more timed out at 5 s (`expectedNote`, `materialOnTheRecord`, `tempoSoundAgainstMark`); alone, all three pass (`iii-unit-three-timeouts-rerun.txt`).
- `lessonClaimsAboutApp`'s blues.3 failed once more on the build. Its `source()` check matches `"\n"` and the working copy of `ScoreScreen.ts` was CRLF; written with LF it passes (`iii-unit-lesson-claims-lf.txt`). Git normalises to LF on commit.
- **The targeted browser specs:** 164 passed and 15 failed (`iii-e2e-targeted.txt`). Every failure is a screenshot case with no `-win32.png` reference: `score.layout` 3 and `score.spec` 12, "A snapshot doesn't exist … writing actual". The written references were deleted. They are at-rest screenshots, not folded states.
- **The path map's full e2e list and `npm run states` on 4183** were not run as such. I ran the targeted set above, and the gallery on 5313 from a config copy.
- CHUNK's fixed 22 px is unchanged. Whether a sentence takes two lines sideways was not measured beyond the gallery's six sideways folded cells, all one line and clear.

### Follow-ups (observations, none fixed)

1. At 1024 × 768 one fingering of the five-finger exercise (three bars, one system) starts about 4 px above its slot. Placement anchors the stave at `staffTop − piece.above`, and this window has more ink above its stave than the piece's measurement. Without the band it is clipped at the stage's top; with the band it reaches into the chip's band. Owner: placement's stave anchor (T34/T38). Not a real-phone cell.
2. After a crossing into a wider bar, the frozen size holds until the next fit, so the bar runs off the side in between (Hot Cross Buns bar 3 at 342 × 740). T38's across rule; seen before U118 too.
3. `windowRendererStage.test.ts` case "(c) a width change during a run releases the held size …" never delivers the stage observer's first observation. The renderer never records a width, so the freeze is not released and the test passes without exercising its claim. Found while writing the turned unit case, which delivers it.
4. CHUNK keeps the fixed 22 px (above).
5. Lesson-claim `source()` checks fail on a CRLF working copy (above).
6. The gallery's `theme--light` contrast and `rotation--bars1-real-phone` §9.35 break on the code before U118 too.

### Questions (for the reviewer)

1. **The second path's stop condition** (above): two of 112 cells change count against the code before U118's turned run, and match the ordinary start exactly. The band-0 count needed the chip's room. Does that read as not a new trade, or should the pricing on a size taken while folded come out (the one line named above)?
2. **The seconds away are priced at a day** (`AWAY_PRICED_S`): the count has no ceiling, and its sentence is the longest the chip carries. At 115 % text on 342 × 740 it is the one sentence that takes three lines, so the band holds a line nothing else uses. Keep a day, choose another bound, or leave the away sentence out of the band? It costs nothing on the ordinary path, where the header's row is taller than three lines. It costs a little size on a turned run at that text size.

### Exit codes (option (iii))

| step | exit |
| --- | --- |
| `npx tsc -b` | 0 |
| `npm run lint` | 0 |
| `npm run build:app` | 0 |
| `vitest run tests/unit/windowRendererStage.test.ts` | 0 (34 of 34) |
| `vitest run` (all) | 1: 7 failed of 7,583. 4 the same on the code before U118, 3 timeouts that pass alone |
| window-rule U118 cases | 0 (8 of 8) |
| targeted browser specs (13 files) | 1: 164 passed, 15 screenshot cases with no win32 reference |
| gallery on the build | 1: 2 cells, both the same on the code before U118 |
| gallery on the code before U118 | 1: the guard finds the chip over the score in 2 cells, and the same 2 other cells |
| probe, upright, three arms (240 tests) | 0 |
| probe, 768×1024 and 1024×768, three arms (96 tests) | 0 |
| mutants: base, M1, M2, M3, M4 | browser 1 each; unit 1, 1, 1, 0, 0 (M3 and M4 change nothing the unit cases read) |

All browser runs used port 5313 from config copies under `app/build/u118/`, one Playwright run at a time.
